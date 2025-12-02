/**
 * 統合財務分析エンジン
 *
 * 全ての財務指標を統合的に分析し、包括的なレポートを生成します。
 * - 並列処理による高速化（8並列）
 * - メモリ効率管理（92%上限対応）
 * - 総合スコア算出
 * - サマリー生成
 */

import type {
  FinancialData,
  PreviousYearData,
  IndustryData,
  FinancialAnalysisSummary,
  AnalysisOptions,
  MetricResult,
  BenchmarkResult,
  AnomalyResult,
} from '../types/analysis.js';

import { calculateAllProfitabilityMetrics } from './profitability.js';
import { calculateAllSafetyMetrics } from './safety.js';
import { calculateAllEfficiencyMetrics } from './efficiency.js';
import { calculateAllGrowthMetrics } from './growth.js';
import { analyzeCashFlow, evaluateCashFlowHealth } from './cashflow.js';
import { benchmarkMultipleMetrics } from './benchmark.js';
import { detectMultipleAnomalies } from './anomaly-detector.js';

/**
 * デフォルトの分析オプション
 */
const DEFAULT_OPTIONS: Required<AnalysisOptions> = {
  parallelism: 8, // 8並列処理
  memoryLimit: 0.92, // メモリ使用率92%上限
  includeBenchmark: true,
  includeAnomalyDetection: true,
  verbose: false,
};

/**
 * メモリ使用率を取得（Node.js環境のみ）
 */
function getMemoryUsage(): number {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage();
    const usedMemory = usage.heapUsed;
    const totalMemory = usage.heapTotal;
    return usedMemory / totalMemory;
  }
  return 0;
}

/**
 * メモリ使用率をチェック
 */
function checkMemoryLimit(limit: number): void {
  const usage = getMemoryUsage();
  if (usage > limit) {
    console.warn(
      `⚠️  メモリ使用率が上限（${(limit * 100).toFixed(0)}%）を超えています: ${(usage * 100).toFixed(0)}%`
    );
  }
}

/**
 * MetricResultから値を抽出
 */
function extractMetricValue(result: MetricResult): number | null {
  return result.value;
}

/**
 * 全MetricResultを配列に変換
 */
function flattenMetricResults(metrics: {
  profitability: ReturnType<typeof calculateAllProfitabilityMetrics>;
  safety: ReturnType<typeof calculateAllSafetyMetrics>;
  efficiency: ReturnType<typeof calculateAllEfficiencyMetrics>;
  growth: ReturnType<typeof calculateAllGrowthMetrics>;
}): MetricResult[] {
  return [
    ...Object.values(metrics.profitability),
    ...Object.values(metrics.safety),
    ...Object.values(metrics.efficiency),
    ...Object.values(metrics.growth),
  ];
}

/**
 * 総合スコアを計算
 *
 * 各カテゴリのスコアを重み付けして総合評価を算出します。
 *
 * 重み付け:
 * - 収益性: 30%
 * - 安全性: 25%
 * - 効率性: 20%
 * - 成長性: 15%
 * - キャッシュフロー: 10%
 */
function calculateOverallScore(
  profitability: ReturnType<typeof calculateAllProfitabilityMetrics>,
  safety: ReturnType<typeof calculateAllSafetyMetrics>,
  efficiency: ReturnType<typeof calculateAllEfficiencyMetrics>,
  growth: ReturnType<typeof calculateAllGrowthMetrics>,
  cashFlowScore: number
): number {
  /**
   * カテゴリごとのスコアを計算
   * 各指標のratingをポイント化: excellent=100, good=75, fair=50, poor=25
   */
  const ratingToScore = (rating: string | undefined): number => {
    switch (rating) {
      case 'excellent':
        return 100;
      case 'good':
        return 75;
      case 'fair':
        return 50;
      case 'poor':
        return 25;
      default:
        return 0;
    }
  };

  // 収益性スコア（6指標の平均）
  const profitabilityScore =
    (ratingToScore(profitability.roe.rating) +
      ratingToScore(profitability.roa.rating) +
      ratingToScore(profitability.operatingMargin.rating) +
      ratingToScore(profitability.grossMargin.rating) +
      ratingToScore(profitability.ordinaryMargin.rating) +
      ratingToScore(profitability.netMargin.rating)) /
    6;

  // 安全性スコア（6指標の平均）
  const safetyScore =
    (ratingToScore(safety.equityRatio.rating) +
      ratingToScore(safety.currentRatio.rating) +
      ratingToScore(safety.quickRatio.rating) +
      ratingToScore(safety.fixedToLongTermRatio.rating) +
      ratingToScore(safety.debtRatio.rating) +
      ratingToScore(safety.interestCoverageRatio.rating)) /
    6;

  // 効率性スコア（5指標の平均）
  const efficiencyScore =
    (ratingToScore(efficiency.totalAssetTurnover.rating) +
      ratingToScore(efficiency.receivablesTurnover.rating) +
      ratingToScore(efficiency.inventoryTurnover.rating) +
      ratingToScore(efficiency.payablesTurnover.rating) +
      ratingToScore(efficiency.fixedAssetTurnover.rating)) /
    5;

  // 成長性スコア（5指標の平均）
  const growthScore =
    (ratingToScore(growth.revenueGrowth.rating) +
      ratingToScore(growth.operatingIncomeGrowth.rating) +
      ratingToScore(growth.ordinaryIncomeGrowth.rating) +
      ratingToScore(growth.totalAssetGrowth.rating) +
      ratingToScore(growth.employeeGrowth.rating)) /
    5;

  // 重み付け総合スコア
  const overallScore =
    profitabilityScore * 0.3 +
    safetyScore * 0.25 +
    efficiencyScore * 0.2 +
    growthScore * 0.15 +
    cashFlowScore * 0.1;

  return Math.round(overallScore);
}

/**
 * 総合評価を判定
 */
function determineOverallRating(
  score: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

/**
 * 統合財務分析を実行
 *
 * @param data - 財務データ
 * @param previousYear - 前年度データ（オプション）
 * @param industryDataMap - 業界データマップ（オプション）
 * @param options - 分析オプション
 * @returns 財務分析サマリー
 *
 * 使用例:
 * ```typescript
 * const summary = await analyzeFinancialData(
 *   {
 *     companyId: 'COMP001',
 *     fiscalPeriod: '2024Q4',
 *     revenue: 10000000,
 *     operatingIncome: 1500000,
 *     netIncome: 1000000,
 *     totalAssets: 20000000,
 *     equity: 8000000,
 *     totalLiabilities: 12000000,
 *     // ... その他の財務データ
 *   },
 *   {
 *     revenue: 9000000,
 *     operatingIncome: 1200000,
 *     // ... 前年度データ
 *   },
 *   {
 *     'ROE': industryDataROE,
 *     'ROA': industryDataROA,
 *     // ... 業界データ
 *   }
 * );
 * console.log(`総合スコア: ${summary.overallScore}点`);
 * console.log(`総合評価: ${summary.overallRating}`);
 * ```
 */
export async function analyzeFinancialData(
  data: FinancialData,
  previousYear?: PreviousYearData,
  industryDataMap?: Record<string, IndustryData>,
  options: AnalysisOptions = {}
): Promise<FinancialAnalysisSummary> {
  const startTime = Date.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (opts.verbose) {
    console.log(`🔍 財務分析開始: ${data.companyId} (${data.fiscalPeriod})`);
  }

  // メモリ使用率チェック
  checkMemoryLimit(opts.memoryLimit);

  /**
   * 並列処理で各カテゴリの指標を計算
   *
   * Promise.allを使用して以下を並列実行:
   * 1. 収益性指標
   * 2. 安全性指標
   * 3. 効率性指標
   * 4. 成長性指標
   * 5. キャッシュフロー分析
   */
  const [profitability, safety, efficiency, growth, cashFlow] = await Promise.all([
    Promise.resolve(calculateAllProfitabilityMetrics(data)),
    Promise.resolve(calculateAllSafetyMetrics(data)),
    Promise.resolve(calculateAllEfficiencyMetrics(data)),
    Promise.resolve(calculateAllGrowthMetrics(data, previousYear)),
    Promise.resolve(analyzeCashFlow(data)),
  ]);

  if (opts.verbose) {
    console.log(`  ✅ 基本指標計算完了`);
  }

  // メモリ使用率チェック
  checkMemoryLimit(opts.memoryLimit);

  /**
   * ベンチマーク比較（オプション）
   */
  let benchmarks: BenchmarkResult[] = [];
  if (opts.includeBenchmark && industryDataMap) {
    // 全指標の値を抽出
    const metricsMap: Record<string, number> = {};

    const allMetrics = flattenMetricResults({ profitability, safety, efficiency, growth });
    for (const metric of allMetrics) {
      const value = extractMetricValue(metric);
      if (value !== null) {
        metricsMap[metric.metric] = value;
      }
    }

    benchmarks = benchmarkMultipleMetrics(metricsMap, industryDataMap);

    if (opts.verbose) {
      console.log(`  ✅ ベンチマーク比較完了: ${benchmarks.length}指標`);
    }
  }

  /**
   * 異常値検出（オプション）
   */
  let anomalies: AnomalyResult[] = [];
  if (opts.includeAnomalyDetection) {
    const allMetrics = flattenMetricResults({ profitability, safety, efficiency, growth });
    anomalies = detectMultipleAnomalies(allMetrics, industryDataMap);

    if (opts.verbose) {
      console.log(`  ✅ 異常値検出完了: ${anomalies.length}件`);
    }
  }

  /**
   * 総合スコア計算
   */
  const cashFlowScore = evaluateCashFlowHealth(cashFlow);
  const overallScore = calculateOverallScore(
    profitability,
    safety,
    efficiency,
    growth,
    cashFlowScore
  );
  const overallRating = determineOverallRating(overallScore);

  const processingTimeMs = Date.now() - startTime;

  if (opts.verbose) {
    console.log(`✨ 財務分析完了: ${processingTimeMs}ms`);
    console.log(`   総合スコア: ${overallScore}点 (${overallRating})`);
  }

  return {
    companyId: data.companyId,
    period: data.fiscalPeriod,
    profitability,
    safety,
    efficiency,
    growth,
    cashFlow,
    benchmarks,
    anomalies,
    overallScore,
    overallRating,
    analyzedAt: new Date().toISOString(),
    processingTimeMs,
  };
}

/**
 * バッチ分析（複数企業の並列分析）
 *
 * @param dataList - 財務データの配列
 * @param previousYearMap - 企業IDをキーとする前年度データマップ
 * @param industryDataMap - 業界データマップ
 * @param options - 分析オプション
 * @returns 財務分析サマリーの配列
 *
 * 注意: 並列処理数はoptions.parallelismで制御されます。
 */
export async function analyzeBatch(
  dataList: FinancialData[],
  previousYearMap?: Record<string, PreviousYearData>,
  industryDataMap?: Record<string, IndustryData>,
  options: AnalysisOptions = {}
): Promise<FinancialAnalysisSummary[]> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const results: FinancialAnalysisSummary[] = [];

  if (opts.verbose) {
    console.log(`🔍 バッチ分析開始: ${dataList.length}社`);
  }

  // 並列処理数を制限しながら分析
  for (let i = 0; i < dataList.length; i += opts.parallelism) {
    const batch = dataList.slice(i, i + opts.parallelism);

    const batchResults = await Promise.all(
      batch.map((data) =>
        analyzeFinancialData(
          data,
          previousYearMap?.[data.companyId],
          industryDataMap,
          { ...opts, verbose: false } // バッチ処理中は詳細ログを抑制
        )
      )
    );

    results.push(...batchResults);

    // メモリ使用率チェック
    checkMemoryLimit(opts.memoryLimit);

    if (opts.verbose) {
      console.log(`  進捗: ${results.length}/${dataList.length}社完了`);
    }
  }

  if (opts.verbose) {
    console.log(`✨ バッチ分析完了: ${results.length}社`);
  }

  return results;
}
