/**
 * 業界ベンチマーク比較モジュール
 *
 * 企業の財務指標を業界データと比較し、相対的な位置付けを評価します。
 * - パーセンタイル順位計算
 * - 四分位数判定
 * - 評価判定
 */

import type { BenchmarkResult, IndustryData } from '../types/analysis.js';

/**
 * パーセンタイル順位を計算
 *
 * @param value - 対象企業の値
 * @param dataPoints - 業界全体のデータポイント配列
 * @returns パーセンタイル順位（0-100）
 *
 * 計算方法:
 * 1. データポイントを昇順ソート
 * 2. 対象値より小さい値の個数を数える
 * 3. (小さい値の個数 / 全体の個数) × 100
 *
 * 例: パーセンタイル80 → 業界の80%の企業より優れている
 */
function calculatePercentile(value: number, dataPoints: number[]): number {
  if (dataPoints.length === 0) return 50; // デフォルト中央値

  const sorted = [...dataPoints].sort((a, b) => a - b);
  const belowCount = sorted.filter((v) => v < value).length;
  const percentile = (belowCount / sorted.length) * 100;

  return Math.round(percentile);
}

/**
 * 四分位数を判定
 *
 * @param percentile - パーセンタイル順位（0-100）
 * @returns 四分位数（Q1, Q2, Q3, Q4）
 *
 * 分類:
 * - Q1（第1四分位）: 0-25パーセンタイル（下位25%）
 * - Q2（第2四分位）: 25-50パーセンタイル（下位50%）
 * - Q3（第3四分位）: 50-75パーセンタイル（上位50%）
 * - Q4（第4四分位）: 75-100パーセンタイル（上位25%）
 */
function determineQuartile(
  percentile: number
): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  if (percentile < 25) return 'Q1';
  if (percentile < 50) return 'Q2';
  if (percentile < 75) return 'Q3';
  return 'Q4';
}

/**
 * 評価レベルを判定
 *
 * @param percentile - パーセンタイル順位（0-100）
 * @returns 評価（excellent, good, fair, poor）
 *
 * 評価基準:
 * - excellent: 75パーセンタイル以上（上位25%）
 * - good: 50-75パーセンタイル（上位50%）
 * - fair: 25-50パーセンタイル（下位50%）
 * - poor: 25パーセンタイル未満（下位25%）
 */
function determineRating(
  percentile: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (percentile >= 75) return 'excellent';
  if (percentile >= 50) return 'good';
  if (percentile >= 25) return 'fair';
  return 'poor';
}

/**
 * ベンチマーク比較を実行
 *
 * 企業の指標値を業界データと比較し、相対的な位置付けを評価します。
 *
 * @param metric - 指標名
 * @param value - 対象企業の値
 * @param industryData - 業界データ
 * @returns ベンチマーク結果
 *
 * 使用例:
 * ```typescript
 * const result = benchmarkMetric(
 *   'ROE',
 *   15.5,
 *   {
 *     industryCode: 'IT',
 *     industryName: '情報通信業',
 *     metric: 'ROE',
 *     dataPoints: [8, 10, 12, 14, 16, 18, 20],
 *     average: 14,
 *     median: 14,
 *     q1: 10,
 *     q3: 18,
 *     min: 8,
 *     max: 20
 *   }
 * );
 * console.log(result.percentile); // 71 (上位29%)
 * console.log(result.quartile);   // 'Q3'
 * console.log(result.rating);     // 'good'
 * ```
 */
export function benchmarkMetric(
  metric: string,
  value: number,
  industryData: IndustryData
): BenchmarkResult {
  // パーセンタイル順位を計算
  const percentile = calculatePercentile(value, industryData.dataPoints);

  // 四分位数を判定
  const quartile = determineQuartile(percentile);

  // 評価を判定
  const rating = determineRating(percentile);

  return {
    metric,
    value,
    industryAvg: industryData.average,
    industryMedian: industryData.median,
    percentile,
    quartile,
    rating,
  };
}

/**
 * 複数指標のベンチマーク比較を一括実行
 *
 * @param metrics - 指標名と値のマップ
 * @param industryDataMap - 指標名をキーとする業界データマップ
 * @returns ベンチマーク結果の配列
 *
 * 使用例:
 * ```typescript
 * const results = benchmarkMultipleMetrics(
 *   {
 *     ROE: 15.5,
 *     ROA: 8.2,
 *     'Operating Margin': 12.3
 *   },
 *   {
 *     ROE: industryDataROE,
 *     ROA: industryDataROA,
 *     'Operating Margin': industryDataOM
 *   }
 * );
 * ```
 */
export function benchmarkMultipleMetrics(
  metrics: Record<string, number>,
  industryDataMap: Record<string, IndustryData>
): BenchmarkResult[] {
  const results: BenchmarkResult[] = [];

  for (const [metric, value] of Object.entries(metrics)) {
    const industryData = industryDataMap[metric];

    if (!industryData) {
      // 業界データが存在しない場合はスキップ
      continue;
    }

    const result = benchmarkMetric(metric, value, industryData);
    results.push(result);
  }

  return results;
}

/**
 * ベンチマーク結果のサマリーを生成
 *
 * @param results - ベンチマーク結果の配列
 * @returns サマリー文字列
 */
export function summarizeBenchmarks(results: BenchmarkResult[]): string {
  if (results.length === 0) {
    return 'ベンチマークデータがありません。';
  }

  const lines: string[] = [];
  lines.push('業界ベンチマーク比較結果:');
  lines.push('');

  for (const result of results) {
    const vsAvg = result.value - result.industryAvg;
    const vsAvgSign = vsAvg >= 0 ? '+' : '';
    const vsAvgPercent = ((vsAvg / result.industryAvg) * 100).toFixed(1);

    lines.push(`【${result.metric}】`);
    lines.push(`  自社値: ${result.value.toFixed(2)}`);
    lines.push(`  業界平均: ${result.industryAvg.toFixed(2)}`);
    lines.push(`  業界中央値: ${result.industryMedian.toFixed(2)}`);
    lines.push(`  vs平均: ${vsAvgSign}${vsAvg.toFixed(2)} (${vsAvgSign}${vsAvgPercent}%)`);
    lines.push(`  パーセンタイル: ${result.percentile}位 (上位${100 - result.percentile}%)`);
    lines.push(`  四分位: ${result.quartile}`);
    lines.push(`  評価: ${result.rating}`);
    lines.push('');
  }

  // 総合評価
  const excellentCount = results.filter((r) => r.rating === 'excellent').length;
  const goodCount = results.filter((r) => r.rating === 'good').length;
  const fairCount = results.filter((r) => r.rating === 'fair').length;
  const poorCount = results.filter((r) => r.rating === 'poor').length;

  lines.push('総合評価:');
  lines.push(`  Excellent: ${excellentCount}指標`);
  lines.push(`  Good: ${goodCount}指標`);
  lines.push(`  Fair: ${fairCount}指標`);
  lines.push(`  Poor: ${poorCount}指標`);

  return lines.join('\n');
}

/**
 * 業界データを生成（サンプル/テスト用）
 *
 * 実際の運用では外部データソースから取得します。
 *
 * @param metric - 指標名
 * @param industryCode - 業界コード
 * @param industryName - 業界名
 * @param dataPoints - データポイント配列
 * @returns 業界データ
 */
export function createIndustryData(
  metric: string,
  industryCode: string,
  industryName: string,
  dataPoints: number[]
): IndustryData {
  const sorted = [...dataPoints].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, val) => acc + val, 0);
  const average = sum / sorted.length;

  const medianIndex = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 === 0
      ? (sorted[medianIndex - 1] + sorted[medianIndex]) / 2
      : sorted[medianIndex];

  const q1Index = Math.floor(sorted.length / 4);
  const q3Index = Math.floor((sorted.length * 3) / 4);

  return {
    industryCode,
    industryName,
    metric,
    dataPoints,
    average,
    median,
    q1: sorted[q1Index],
    q3: sorted[q3Index],
    min: sorted[0],
    max: sorted[sorted.length - 1],
  };
}
