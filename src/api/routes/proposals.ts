/**
 * 提案エンドポイント
 *
 * @module api/routes/proposals
 * @description
 * - POST /api/v1/proposals/generate - 提案生成
 * - GET /api/v1/proposals/:id - 提案詳細取得
 * - GET /api/v1/proposals/:id/stream - 生成進捗SSE
 * - GET /api/v1/proposals/:id/export - エクスポート（PDF/Excel）
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { analysisRateLimiter, streamRateLimiter, exportRateLimiter } from '../middleware/rate-limiter.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler.js';
import { ProposalGenerator } from '../../proposal/proposal-generator.js';
import { createMarkdownFormatter } from '../../proposal/formatters/markdown.js';
import { createPDFFormatter } from '../../proposal/formatters/pdf.js';
import { createExcelFormatter } from '../../proposal/formatters/excel.js';
import type { ConsultingProposal, ProposalGenerationRequest, ExportFormat } from '../../types/proposal.js';

const router = Router();

// ===================================
// バリデーションスキーマ
// ===================================

const generateProposalSchema = z.object({
  clientName: z.string().min(1),
  industry: z.string().min(1),
  companySize: z.string().min(1),
  mainChallenges: z.string().min(10),
  additionalContext: z.string().optional(),
  focusValues: z.array(z.enum([
    'customer_value',
    'employee_value',
    'business_value',
    'organization_value',
    'brand_value',
    'shareholder_value',
  ])).optional(),
});

const exportQuerySchema = z.object({
  format: z.enum(['markdown', 'pdf', 'excel']).default('pdf'),
});

// ===================================
// インメモリストレージ（本番環境ではDB使用）
// ===================================

interface ProposalJob {
  id: string;
  userId: string;
  request: ProposalGenerationRequest;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  progress: number; // 0-100
  currentSection?: string;
  proposal?: ConsultingProposal;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  logs: Array<{
    timestamp: Date;
    message: string;
    level: 'info' | 'warning' | 'error';
  }>;
}

const proposalJobsStore = new Map<string, ProposalJob>();

/**
 * ログ追加ヘルパー
 */
function addLog(
  job: ProposalJob,
  message: string,
  level: 'info' | 'warning' | 'error' = 'info'
): void {
  job.logs.push({
    timestamp: new Date(),
    message,
    level,
  });
}

// ===================================
// POST /api/v1/proposals/generate
// 提案生成
// ===================================

router.post(
  '/generate',
  authenticate,
  analysisRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = generateProposalSchema.parse(req.body);
    const userId = (req as any).user?.userId || 'anonymous';

    // ジョブID生成
    const jobId = `proposal_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // ジョブ作成
    const job: ProposalJob = {
      id: jobId,
      userId,
      request: body,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      logs: [],
    };

    proposalJobsStore.set(jobId, job);

    // 非同期生成実行（バックグラウンド）
    generateProposalInBackground(job);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        message: 'Proposal generation started. Use /proposals/:id/stream to monitor progress.',
      },
    });
  })
);

/**
 * バックグラウンド提案生成
 */
async function generateProposalInBackground(job: ProposalJob): Promise<void> {
  try {
    job.status = 'generating';
    job.progress = 10;
    addLog(job, 'Starting proposal generation');

    const apiKey = process.env.ANTHROPIC_API_KEY || '';
    const generator = new ProposalGenerator({
      apiKey,
      verbose: false,
    });

    // セクションごとに進捗更新
    job.currentSection = 'executive_summary';
    job.progress = 20;
    addLog(job, 'Generating executive summary');

    const result = await generator.generate(job.request);

    job.progress = 80;
    addLog(job, 'AI generation completed');

    job.proposal = result.proposal;
    job.progress = 100;
    job.status = 'completed';
    job.completedAt = new Date();
    addLog(job, 'Proposal generation completed successfully');
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    addLog(job, `Generation failed: ${job.error}`, 'error');
  }
}

// ===================================
// GET /api/v1/proposals/:id
// 提案詳細取得
// ===================================

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const job = proposalJobsStore.get(id);

    if (!job) {
      throw new NotFoundError('Proposal');
    }

    // ユーザー権限チェック
    const user = (req as any).user;
    if (user.role !== 'admin' && job.userId !== user.userId) {
      throw new NotFoundError('Proposal');
    }

    res.json({
      success: true,
      data: {
        id: job.id,
        status: job.status,
        progress: job.progress,
        proposal: job.proposal,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  })
);

// ===================================
// GET /api/v1/proposals/:id/stream
// 生成進捗SSE（Server-Sent Events）
// ===================================

router.get(
  '/:id/stream',
  authenticate,
  streamRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const job = proposalJobsStore.get(id);

    if (!job) {
      throw new NotFoundError('Proposal');
    }

    // ユーザー権限チェック
    const user = (req as any).user;
    if (user.role !== 'admin' && job.userId !== user.userId) {
      throw new NotFoundError('Proposal');
    }

    // SSEヘッダー設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginxのバッファリング無効化

    // 初期状態送信
    sendSSE(res, 'start', {
      status: job.status,
      progress: job.progress,
    });

    // 進捗監視（500msごとに更新）
    const interval = setInterval(() => {
      const currentJob = proposalJobsStore.get(id);

      if (!currentJob) {
        clearInterval(interval);
        res.end();
        return;
      }

      // 進捗更新送信
      sendSSE(res, 'progress', {
        status: currentJob.status,
        progress: currentJob.progress,
        currentSection: currentJob.currentSection,
      });

      // 新しいログ送信
      const recentLogs = currentJob.logs.slice(-5); // 直近5件
      if (recentLogs.length > 0) {
        sendSSE(res, 'logs', recentLogs);
      }

      // セクション完了通知
      if (currentJob.currentSection) {
        sendSSE(res, 'section_complete', {
          section: currentJob.currentSection,
        });
      }

      // 完了/失敗時
      if (currentJob.status === 'completed') {
        sendSSE(res, 'complete', {
          proposal: currentJob.proposal,
          completedAt: currentJob.completedAt,
        });
        clearInterval(interval);
        res.end();
      } else if (currentJob.status === 'failed') {
        sendSSE(res, 'error', {
          error: currentJob.error,
          completedAt: currentJob.completedAt,
        });
        clearInterval(interval);
        res.end();
      }
    }, 500);

    // クライアント切断時のクリーンアップ
    req.on('close', () => {
      clearInterval(interval);
    });
  })
);

// ===================================
// GET /api/v1/proposals/:id/export
// エクスポート（PDF/Excel/Markdown）
// ===================================

router.get(
  '/:id/export',
  authenticate,
  exportRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const query = exportQuerySchema.parse(req.query);

    const job = proposalJobsStore.get(id);

    if (!job) {
      throw new NotFoundError('Proposal');
    }

    if (job.status !== 'completed' || !job.proposal) {
      throw new ValidationError('Proposal is not ready for export', {
        status: job.status,
      });
    }

    // ユーザー権限チェック
    const user = (req as any).user;
    if (user.role !== 'admin' && job.userId !== user.userId) {
      throw new NotFoundError('Proposal');
    }

    const format = query.format;
    const proposal = job.proposal;

    try {
      switch (format) {
        case 'markdown': {
          const formatter = createMarkdownFormatter();
          const markdown = await formatter.format(proposal);
          res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="proposal-${id}.md"`);
          res.send(markdown);
          break;
        }

        case 'pdf': {
          const formatter = createPDFFormatter();
          const pdfBuffer = await formatter.format(proposal);
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="proposal-${id}.pdf"`);
          res.send(pdfBuffer);
          break;
        }

        case 'excel': {
          const formatter = createExcelFormatter();
          const excelBuffer = await formatter.format(proposal);
          res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
          res.setHeader('Content-Disposition', `attachment; filename="proposal-${id}.xlsx"`);
          res.send(excelBuffer);
          break;
        }

        default:
          throw new ValidationError('Invalid export format');
      }
    } catch (error) {
      throw new Error(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  })
);

/**
 * SSEメッセージ送信ヘルパー
 */
function sendSSE(res: Response, event: string, data: any): void {
  res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

export default router;
