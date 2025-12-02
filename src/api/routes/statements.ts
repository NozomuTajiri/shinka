/**
 * 決算書エンドポイント
 *
 * @module api/routes/statements
 * @description
 * - POST /api/v1/statements/upload - ファイルアップロード
 * - GET /api/v1/statements/:id - 決算書詳細取得
 * - GET /api/v1/statements - 決算書一覧取得
 * - DELETE /api/v1/statements/:id - 決算書削除
 */

import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import { z } from 'zod';
import { authenticate, authorize } from '../middleware/auth.js';
import { uploadRateLimiter } from '../middleware/rate-limiter.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler.js';
import { parseStatement } from '../../parsers/index.js';
import type { ParsedStatement } from '../../types/financial.js';
import { config } from '../../config/index.js';

const router = Router();

// ===================================
// Multer設定（ファイルアップロード）
// ===================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.upload.uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: config.upload.maxFileSize, // 10MB
  },
  fileFilter: (_req, file, cb) => {
    if (!config.upload.allowedTypes.includes(file.mimetype)) {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: ${config.upload.allowedTypes.join(', ')}`));
      return;
    }
    cb(null, true);
  },
});

// ===================================
// バリデーションスキーマ
// ===================================

const uploadQuerySchema = z.object({
  companyName: z.string().optional(),
  fiscalYear: z.string().regex(/^\d{4}$/).optional(),
});

const listQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1').transform(Number),
  limit: z.string().regex(/^\d+$/).optional().default('20').transform(Number),
  companyName: z.string().optional(),
  fiscalYear: z.string().regex(/^\d{4}$/).optional(),
  sortBy: z.enum(['createdAt', 'fiscalYear', 'companyName']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ===================================
// インメモリストレージ（本番環境ではDB使用）
// ===================================

interface StoredStatement extends ParsedStatement {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  filePath: string;
}

const statementsStore = new Map<string, StoredStatement>();

// ===================================
// POST /api/v1/statements/upload
// ファイルアップロード
// ===================================

router.post(
  '/upload',
  authenticate,
  uploadRateLimiter,
  upload.single('file'),
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError('File is required');
    }

    // クエリパラメータ検証
    const query = uploadQuerySchema.parse(req.query);

    // ファイルパース
    const parseResult = await parseStatement(req.file.path, {
      strict: false,
      debug: process.env.NODE_ENV === 'development',
    });

    if (!parseResult.success || !parseResult.data) {
      throw new ValidationError('Failed to parse financial statement', {
        error: parseResult.error,
        warnings: parseResult.warnings,
      });
    }

    // オプション情報でデータを補完
    if (query.companyName) {
      parseResult.data.company.name = query.companyName;
    }
    if (query.fiscalYear) {
      const year = parseInt(query.fiscalYear, 10);
      parseResult.data.period.fiscalYear = year;
    }

    // ID生成
    const id = `stmt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // ストレージに保存
    const storedStatement: StoredStatement = {
      ...parseResult.data,
      id,
      userId: (req as any).user?.userId || 'anonymous',
      createdAt: new Date(),
      updatedAt: new Date(),
      filePath: req.file.path,
    };

    statementsStore.set(id, storedStatement);

    res.status(201).json({
      success: true,
      data: {
        id: storedStatement.id,
        company: storedStatement.company,
        period: storedStatement.period,
        metadata: storedStatement.metadata,
        createdAt: storedStatement.createdAt,
      },
      warnings: parseResult.warnings,
    });
  })
);

// ===================================
// GET /api/v1/statements/:id
// 決算書詳細取得
// ===================================

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const statement = statementsStore.get(id);

    if (!statement) {
      throw new NotFoundError('Financial statement');
    }

    // ユーザー権限チェック（自分のデータのみアクセス可能、管理者は全データアクセス可）
    const user = (req as any).user;
    if (user.role !== 'admin' && statement.userId !== user.userId) {
      throw new NotFoundError('Financial statement');
    }

    res.json({
      success: true,
      data: {
        id: statement.id,
        company: statement.company,
        period: statement.period,
        balanceSheet: statement.balanceSheet,
        incomeStatement: statement.incomeStatement,
        cashFlowStatement: statement.cashFlowStatement,
        metadata: statement.metadata,
        createdAt: statement.createdAt,
        updatedAt: statement.updatedAt,
      },
    });
  })
);

// ===================================
// GET /api/v1/statements
// 決算書一覧取得（ページネーション対応）
// ===================================

router.get(
  '/',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const query = listQuerySchema.parse(req.query);

    const user = (req as any).user;

    // ユーザーのデータのみフィルタ（管理者は全データ）
    let statements = Array.from(statementsStore.values());
    if (user.role !== 'admin') {
      statements = statements.filter((s) => s.userId === user.userId);
    }

    // フィルタ適用
    if (query.companyName) {
      statements = statements.filter((s) =>
        s.company.name.toLowerCase().includes(query.companyName!.toLowerCase())
      );
    }

    if (query.fiscalYear) {
      const year = parseInt(query.fiscalYear, 10);
      statements = statements.filter((s) => s.period.fiscalYear === year);
    }

    // ソート
    statements.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (query.sortBy) {
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        case 'fiscalYear':
          aValue = a.period.fiscalYear || 0;
          bValue = b.period.fiscalYear || 0;
          break;
        case 'companyName':
          aValue = a.company.name;
          bValue = b.company.name;
          break;
        default:
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
      }

      if (query.order === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // ページネーション
    const total = statements.length;
    const startIndex = (query.page - 1) * query.limit;
    const endIndex = startIndex + query.limit;
    const paginatedStatements = statements.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedStatements.map((s) => ({
        id: s.id,
        company: s.company,
        period: s.period,
        metadata: s.metadata,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      })),
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    });
  })
);

// ===================================
// DELETE /api/v1/statements/:id
// 決算書削除（管理者のみ）
// ===================================

router.delete(
  '/:id',
  authenticate,
  authorize(['admin']),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const statement = statementsStore.get(id);

    if (!statement) {
      throw new NotFoundError('Financial statement');
    }

    statementsStore.delete(id);

    res.json({
      success: true,
      message: 'Financial statement deleted successfully',
    });
  })
);

export default router;
