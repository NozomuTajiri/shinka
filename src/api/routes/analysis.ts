/**
 * 分析エンドポイント
 *
 * @module api/routes/analysis
 * @description
 * - POST /api/v1/analysis/run - 分析実行
 * - GET /api/v1/analysis/:id - 分析結果取得
 * - GET /api/v1/analysis/:id/stream - 分析進捗SSE（Server-Sent Events）
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import { analysisRateLimiter, streamRateLimiter } from '../middleware/rate-limiter.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler.js';
import { analyzeFinancialData } from '../../analysis/financial-analyzer.js';
import type { FinancialAnalysisSummary, FinancialData } from '../../types/analysis.js';

const router = Router();

// ===================================
// バリデーションスキーマ
// ===================================

const runAnalysisSchema = z.object({
  statementId: z.string(),
  options: z.object({
    includeBenchmark: z.boolean().default(true),
    includeAnomalyDetection: z.boolean().default(true),
    verbose: z.boolean().default(false),
  }).optional(),
});

// ===================================
// インメモリストレージ（本番環境ではDB使用）
// ===================================

interface AnalysisJob {
  id: string;
  statementId: string;
  userId: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  result?: FinancialAnalysisSummary;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  logs: Array<{
    timestamp: Date;
    message: string;
    level: 'info' | 'warning' | 'error';
  }>;
}

const analysisJobsStore = new Map<string, AnalysisJob>();

/**
 * ログ追加ヘルパー
 */
function addLog(
  job: AnalysisJob,
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
// POST /api/v1/analysis/run
// 分析実行
// ===================================

router.post(
  '/run',
  authenticate,
  analysisRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const body = runAnalysisSchema.parse(req.body);
    const userId = (req as any).user?.userId || 'anonymous';

    // ジョブID生成
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // ジョブ作成
    const job: AnalysisJob = {
      id: jobId,
      statementId: body.statementId,
      userId,
      status: 'pending',
      progress: 0,
      createdAt: new Date(),
      logs: [],
    };

    analysisJobsStore.set(jobId, job);

    // 非同期分析実行（バックグラウンド）
    runAnalysisInBackground(job, body.options);

    res.status(202).json({
      success: true,
      data: {
        jobId: job.id,
        status: job.status,
        message: 'Analysis job created. Use /analysis/:id/stream to monitor progress.',
      },
    });
  })
);

/**
 * バックグラウンド分析実行
 */
async function runAnalysisInBackground(
  job: AnalysisJob,
  options?: z.infer<typeof runAnalysisSchema>['options']
): Promise<void> {
  try {
    job.status = 'running';
    addLog(job, 'Analysis started');

    // ダミーデータ（本番環境では決算書データから取得）
    const financialData: FinancialData = {
      companyId: 'company_001',
      fiscalPeriod: '2023-04-01 to 2024-03-31',
      revenue: 1000000000,
      costOfRevenue: 600000000,
      grossProfit: 400000000,
      operatingIncome: 150000000,
      ordinaryIncome: 140000000,
      netIncome: 100000000,
      totalAssets: 800000000,
      currentAssets: 400000000,
      fixedAssets: 400000000,
      totalLiabilities: 500000000,
      currentLiabilities: 200000000,
      longTermLiabilities: 300000000,
      equity: 300000000,
      operatingCashFlow: 120000000,
      investingCashFlow: -50000000,
      financingCashFlow: -30000000,
    };

    job.progress = 20;
    addLog(job, 'Financial data loaded');

    // 財務分析実行
    const result = await analyzeFinancialData(
      financialData,
      undefined,
      undefined,
      {
        includeBenchmark: options?.includeBenchmark ?? true,
        includeAnomalyDetection: options?.includeAnomalyDetection ?? true,
        verbose: options?.verbose ?? false,
      }
    );

    job.progress = 80;
    addLog(job, 'Analysis computation completed');

    job.result = result;
    job.progress = 100;
    job.status = 'completed';
    job.completedAt = new Date();
    addLog(job, 'Analysis completed successfully');
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Unknown error';
    job.completedAt = new Date();
    addLog(job, `Analysis failed: ${job.error}`, 'error');
  }
}

// ===================================
// GET /api/v1/analysis/:id
// 分析結果取得
// ===================================

router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const job = analysisJobsStore.get(id);

    if (!job) {
      throw new NotFoundError('Analysis job');
    }

    // ユーザー権限チェック
    const user = (req as any).user;
    if (user.role !== 'admin' && job.userId !== user.userId) {
      throw new NotFoundError('Analysis job');
    }

    res.json({
      success: true,
      data: {
        id: job.id,
        statementId: job.statementId,
        status: job.status,
        progress: job.progress,
        result: job.result,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      },
    });
  })
);

// ===================================
// GET /api/v1/analysis/:id/stream
// 分析進捗SSE（Server-Sent Events）
// ===================================

router.get(
  '/:id/stream',
  authenticate,
  streamRateLimiter,
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;

    const job = analysisJobsStore.get(id);

    if (!job) {
      throw new NotFoundError('Analysis job');
    }

    // ユーザー権限チェック
    const user = (req as any).user;
    if (user.role !== 'admin' && job.userId !== user.userId) {
      throw new NotFoundError('Analysis job');
    }

    // SSEヘッダー設定
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // nginxのバッファリング無効化

    // 初期状態送信
    sendSSE(res, 'status', {
      status: job.status,
      progress: job.progress,
    });

    // 進捗監視（1秒ごとに更新）
    const interval = setInterval(() => {
      const currentJob = analysisJobsStore.get(id);

      if (!currentJob) {
        clearInterval(interval);
        res.end();
        return;
      }

      // 進捗更新送信
      sendSSE(res, 'progress', {
        status: currentJob.status,
        progress: currentJob.progress,
      });

      // 新しいログ送信
      const recentLogs = currentJob.logs.slice(-5); // 直近5件
      if (recentLogs.length > 0) {
        sendSSE(res, 'logs', recentLogs);
      }

      // 完了/失敗時
      if (currentJob.status === 'completed') {
        sendSSE(res, 'complete', {
          result: currentJob.result,
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
    }, 1000);

    // クライアント切断時のクリーンアップ
    req.on('close', () => {
      clearInterval(interval);
    });
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
