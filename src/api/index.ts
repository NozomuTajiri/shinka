/**
 * Express APIサーバー - メインエントリーポイント
 *
 * @module api/index
 * @description
 * - Express.js + TypeScriptでRESTful API実装
 * - ミドルウェア設定（CORS, Helmet, 圧縮, ログ）
 * - ルーティング設定
 * - エラーハンドリング
 * - Graceful Shutdown対応
 */

import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { config } from '../config/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { rateLimiter } from './middleware/rate-limiter.js';

// ルートインポート
import statementsRouter from './routes/statements.js';
import analysisRouter from './routes/analysis.js';
import proposalsRouter from './routes/proposals.js';
import benchmarksRouter from './routes/benchmarks.js';

/**
 * Expressアプリケーション初期化
 */
export function createApp(): Express {
  const app = express();

  // ===================================
  // セキュリティミドルウェア
  // ===================================

  // Helmet: HTTPヘッダーセキュリティ設定
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  }));

  // CORS設定
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // ===================================
  // パフォーマンスミドルウェア
  // ===================================

  // レスポンス圧縮
  app.use(compression());

  // JSONパース（最大10MB）
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // ===================================
  // ログミドルウェア
  // ===================================

  // リクエストログ（development/production切り替え）
  const logFormat = process.env.NODE_ENV === 'production'
    ? 'combined'
    : 'dev';
  app.use(morgan(logFormat));

  // ===================================
  // レート制限
  // ===================================

  // 全エンドポイントにレート制限適用
  app.use('/api', rateLimiter);

  // ===================================
  // ヘルスチェックエンドポイント
  // ===================================

  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    });
  });

  // ===================================
  // APIルーティング (v1)
  // ===================================

  app.use('/api/v1/statements', statementsRouter);
  app.use('/api/v1/analysis', analysisRouter);
  app.use('/api/v1/proposals', proposalsRouter);
  app.use('/api/v1/benchmarks', benchmarksRouter);

  // ===================================
  // 404ハンドラ
  // ===================================

  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: 'Endpoint not found',
        timestamp: new Date().toISOString(),
      },
    });
  });

  // ===================================
  // エラーハンドリング（最後に配置）
  // ===================================

  app.use(errorHandler);

  return app;
}

/**
 * サーバー起動
 */
export async function startServer(): Promise<void> {
  const app = createApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  const HOST = process.env.HOST || '0.0.0.0';

  const server = app.listen(PORT, HOST, () => {
    console.log(`🚀 Server running on http://${HOST}:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔒 Security: Helmet enabled`);
    console.log(`⚡ Compression: Enabled`);
  });

  // ===================================
  // Graceful Shutdown
  // ===================================

  const shutdown = (signal: string) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);

    server.close(() => {
      console.log('✅ HTTP server closed');
      process.exit(0);
    });

    // タイムアウト（30秒後に強制終了）
    setTimeout(() => {
      console.error('⚠️  Forcefully shutting down');
      process.exit(1);
    }, 30000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // 未処理エラーのハンドリング
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
}

// 直接実行時のみサーバー起動
if (import.meta.url === `file://${process.argv[1]}`) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}
