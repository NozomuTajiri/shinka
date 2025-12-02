/**
 * ベンチマークエンドポイント
 *
 * @module api/routes/benchmarks
 * @description
 * - GET /api/v1/benchmarks/:industryCode - 業界基準値取得
 * - GET /api/v1/benchmarks - 全業界一覧取得
 * - GET /api/v1/benchmarks/:industryCode/metrics - 特定業界の全指標取得
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { asyncHandler, NotFoundError, ValidationError } from '../middleware/error-handler.js';
import type { IndustryData } from '../../types/analysis.js';

const router = Router();

// ===================================
// バリデーションスキーマ
// ===================================

const industryCodeSchema = z.string().regex(/^[A-Z0-9]{2,10}$/);

const metricsQuerySchema = z.object({
  metrics: z.string().optional(), // カンマ区切りの指標名
});

// ===================================
// ダミー業界データ（本番環境ではDBから取得）
// ===================================

/**
 * 業界マスタ
 */
const industries = [
  { code: 'IT001', name: '情報通信業', nameEn: 'Information & Communications' },
  { code: 'MFG001', name: '製造業', nameEn: 'Manufacturing' },
  { code: 'RET001', name: '小売業', nameEn: 'Retail' },
  { code: 'FIN001', name: '金融業', nameEn: 'Finance' },
  { code: 'CON001', name: '建設業', nameEn: 'Construction' },
  { code: 'SVC001', name: 'サービス業', nameEn: 'Services' },
  { code: 'RE001', name: '不動産業', nameEn: 'Real Estate' },
  { code: 'TRA001', name: '運輸業', nameEn: 'Transportation' },
];

/**
 * 業界ベンチマークデータ生成
 */
function generateIndustryBenchmarks(industryCode: string): IndustryData[] {
  const industry = industries.find((i) => i.code === industryCode);

  if (!industry) {
    return [];
  }

  // 業界ごとに異なる基準値を設定
  interface MetricValues {
    avg: number;
    median: number;
    q1: number;
    q3: number;
  }

  const baseMetrics: Record<string, Record<string, MetricValues>> = {
    IT001: {
      roe: { avg: 12.5, median: 11.8, q1: 8.2, q3: 15.6 },
      roa: { avg: 8.3, median: 7.9, q1: 5.1, q3: 10.8 },
      operatingMargin: { avg: 15.2, median: 14.5, q1: 10.3, q3: 19.1 },
      currentRatio: { avg: 185.3, median: 178.2, q1: 145.6, q3: 215.8 },
      equityRatio: { avg: 52.3, median: 50.1, q1: 42.5, q3: 61.2 },
    },
    MFG001: {
      roe: { avg: 9.8, median: 9.2, q1: 6.5, q3: 12.3 },
      roa: { avg: 6.5, median: 6.1, q1: 4.2, q3: 8.5 },
      operatingMargin: { avg: 8.7, median: 8.1, q1: 5.8, q3: 11.2 },
      currentRatio: { avg: 142.6, median: 138.5, q1: 115.3, q3: 165.8 },
      equityRatio: { avg: 45.2, median: 43.8, q1: 35.6, q3: 53.5 },
    },
    RET001: {
      roe: { avg: 11.2, median: 10.5, q1: 7.8, q3: 13.9 },
      roa: { avg: 5.8, median: 5.4, q1: 3.9, q3: 7.2 },
      operatingMargin: { avg: 4.5, median: 4.2, q1: 2.8, q3: 5.9 },
      currentRatio: { avg: 128.5, median: 125.3, q1: 105.6, q3: 148.2 },
      equityRatio: { avg: 38.6, median: 37.2, q1: 28.9, q3: 46.8 },
    },
  };

  const metrics = baseMetrics[industryCode] || baseMetrics.IT001;

  const result: IndustryData[] = [];

  for (const [metricName, values] of Object.entries(metrics)) {
    // データポイント生成（正規分布に従う）
    const dataPoints: number[] = [];
    for (let i = 0; i < 100; i++) {
      // 簡易的な正規分布生成
      const u1 = Math.random();
      const u2 = Math.random();
      const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const value = values.median + z0 * (values.q3 - values.q1) / 1.35;
      dataPoints.push(Math.max(0, value)); // 負の値を除外
    }

    result.push({
      industryCode,
      industryName: industry.name,
      metric: metricName,
      dataPoints,
      average: values.avg,
      median: values.median,
      q1: values.q1,
      q3: values.q3,
      min: Math.min(...dataPoints),
      max: Math.max(...dataPoints),
    });
  }

  return result;
}

// ===================================
// GET /api/v1/benchmarks
// 全業界一覧取得
// ===================================

router.get(
  '/',
  optionalAuthenticate,
  asyncHandler(async (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: industries.map((i) => ({
        code: i.code,
        name: i.name,
        nameEn: i.nameEn,
      })),
    });
  })
);

// ===================================
// GET /api/v1/benchmarks/:industryCode
// 業界基準値取得（サマリー）
// ===================================

router.get(
  '/:industryCode',
  optionalAuthenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const industryCode = industryCodeSchema.parse(req.params.industryCode);

    const industry = industries.find((i) => i.code === industryCode);

    if (!industry) {
      throw new NotFoundError(`Industry with code ${industryCode}`);
    }

    const benchmarks = generateIndustryBenchmarks(industryCode);

    // サマリーのみ返す（データポイントは含めない）
    const summary = benchmarks.map((b) => ({
      metric: b.metric,
      average: b.average,
      median: b.median,
      q1: b.q1,
      q3: b.q3,
      min: b.min,
      max: b.max,
    }));

    res.json({
      success: true,
      data: {
        industry: {
          code: industry.code,
          name: industry.name,
          nameEn: industry.nameEn,
        },
        benchmarks: summary,
        dataPoints: benchmarks.length > 0 ? benchmarks[0].dataPoints.length : 0,
      },
    });
  })
);

// ===================================
// GET /api/v1/benchmarks/:industryCode/metrics
// 特定業界の全指標取得（詳細データ含む）
// ===================================

router.get(
  '/:industryCode/metrics',
  authenticate, // 詳細データは認証必須
  asyncHandler(async (req: Request, res: Response) => {
    const industryCode = industryCodeSchema.parse(req.params.industryCode);
    const query = metricsQuerySchema.parse(req.query);

    const industry = industries.find((i) => i.code === industryCode);

    if (!industry) {
      throw new NotFoundError(`Industry with code ${industryCode}`);
    }

    let benchmarks = generateIndustryBenchmarks(industryCode);

    // 特定の指標のみフィルタ
    if (query.metrics) {
      const requestedMetrics = query.metrics.split(',').map((m) => m.trim());
      benchmarks = benchmarks.filter((b) => requestedMetrics.includes(b.metric));

      if (benchmarks.length === 0) {
        throw new ValidationError('No matching metrics found', {
          requestedMetrics,
          availableMetrics: generateIndustryBenchmarks(industryCode).map((b) => b.metric),
        });
      }
    }

    res.json({
      success: true,
      data: {
        industry: {
          code: industry.code,
          name: industry.name,
          nameEn: industry.nameEn,
        },
        metrics: benchmarks,
      },
    });
  })
);

export default router;
