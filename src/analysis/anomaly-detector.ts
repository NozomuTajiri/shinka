/**
 * 異常値検出モジュール
 *
 * 財務指標の異常値を検出し、アラートを生成します。
 * - 閾値チェック（絶対値ベース）
 * - 偏差チェック（業界平均からの乖離）
 * - アラートレベル判定
 */

import type { AnomalyResult, MetricResult, IndustryData } from '../types/analysis.js';

/**
 * 異常値検出の閾値設定
 */
interface AnomalyThresholds {
  /** 警告レベルの偏差倍数 */
  warningDeviation: number;
  /** 危険レベルの偏差倍数 */
  criticalDeviation: number;
  /** 絶対的な最小値（これ以下は異常） */
  absoluteMin?: number;
  /** 絶対的な最大値（これ以上は異常） */
  absoluteMax?: number;
}

/**
 * デフォルトの閾値設定
 */
const DEFAULT_THRESHOLDS: AnomalyThresholds = {
  warningDeviation: 1.5, // 平均±1.5σで警告
  criticalDeviation: 2.5, // 平均±2.5σで危険
};

/**
 * 指標別の閾値設定
 *
 * 各指標の特性に応じて適切な閾値を設定します。
 */
const METRIC_SPECIFIC_THRESHOLDS: Record<string, Partial<AnomalyThresholds>> = {
  // 自己資本比率: 30%未満は警告、10%未満は危険
  'Equity Ratio': {
    absoluteMin: 10,
    warningDeviation: 1.0,
    criticalDeviation: 2.0,
  },
  // ROE: マイナスは警告、-10%以下は危険
  ROE: {
    absoluteMin: -10,
    warningDeviation: 1.2,
    criticalDeviation: 2.0,
  },
  // 流動比率: 100%未満は警告、50%未満は危険
  'Current Ratio': {
    absoluteMin: 50,
    warningDeviation: 1.0,
    criticalDeviation: 1.5,
  },
  // 負債比率: 200%超は警告、300%超は危険
  'Debt Ratio': {
    absoluteMax: 300,
    warningDeviation: 1.0,
    criticalDeviation: 1.5,
  },
};

/**
 * 標準偏差を計算
 *
 * @param values - 数値の配列
 * @param mean - 平均値（オプション、未指定の場合は計算）
 * @returns 標準偏差
 */
function calculateStandardDeviation(values: number[], mean?: number): number {
  if (values.length === 0) return 0;

  const avg = mean ?? values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return Math.sqrt(variance);
}

/**
 * 異常度（severity）を計算
 *
 * @param deviation - 偏差の絶対値
 * @param criticalDeviation - 危険レベルの偏差倍数
 * @returns 異常度（0-1）
 *
 * 計算方法:
 * - 偏差が0の場合: 異常度0
 * - 偏差がcriticalDeviation以上の場合: 異常度1
 * - その間は線形補間
 */
function calculateSeverity(deviation: number, criticalDeviation: number): number {
  const absDeviation = Math.abs(deviation);
  if (absDeviation === 0) return 0;
  if (absDeviation >= criticalDeviation) return 1;

  return absDeviation / criticalDeviation;
}

/**
 * アラートレベルを判定
 *
 * @param deviation - 偏差の絶対値
 * @param thresholds - 閾値設定
 * @returns アラートレベル
 */
function determineAlertLevel(
  deviation: number,
  thresholds: AnomalyThresholds
): 'info' | 'warning' | 'critical' {
  const absDeviation = Math.abs(deviation);

  if (absDeviation >= thresholds.criticalDeviation) {
    return 'critical';
  }
  if (absDeviation >= thresholds.warningDeviation) {
    return 'warning';
  }
  return 'info';
}

/**
 * 絶対値ベースの異常値チェック
 *
 * 指標値が絶対的な範囲を超えていないかをチェックします。
 *
 * @param metric - 指標名
 * @param value - 指標値
 * @param thresholds - 閾値設定
 * @returns 異常検出結果（異常がない場合はnull）
 */
function checkAbsoluteAnomaly(
  metric: string,
  value: number,
  thresholds: AnomalyThresholds
): AnomalyResult | null {
  // 最小値チェック
  if (thresholds.absoluteMin !== undefined && value < thresholds.absoluteMin) {
    const deviation = (thresholds.absoluteMin - value) / thresholds.absoluteMin;
    const severity = Math.min(deviation, 1);

    return {
      metric,
      actualValue: value,
      expectedValue: thresholds.absoluteMin,
      deviation,
      severity,
      alertLevel: severity > 0.5 ? 'critical' : 'warning',
      description: `${metric}が最小許容値（${thresholds.absoluteMin}）を下回っています。`,
      detectedAt: new Date().toISOString(),
    };
  }

  // 最大値チェック
  if (thresholds.absoluteMax !== undefined && value > thresholds.absoluteMax) {
    const deviation = (value - thresholds.absoluteMax) / thresholds.absoluteMax;
    const severity = Math.min(deviation, 1);

    return {
      metric,
      actualValue: value,
      expectedValue: thresholds.absoluteMax,
      deviation,
      severity,
      alertLevel: severity > 0.5 ? 'critical' : 'warning',
      description: `${metric}が最大許容値（${thresholds.absoluteMax}）を上回っています。`,
      detectedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * 業界平均からの偏差ベースの異常値チェック
 *
 * 指標値が業界平均から大きく乖離していないかをチェックします。
 *
 * @param metric - 指標名
 * @param value - 指標値
 * @param industryData - 業界データ
 * @param thresholds - 閾値設定
 * @returns 異常検出結果（異常がない場合はnull）
 */
function checkDeviationAnomaly(
  metric: string,
  value: number,
  industryData: IndustryData,
  thresholds: AnomalyThresholds
): AnomalyResult | null {
  const stdDev = calculateStandardDeviation(
    industryData.dataPoints,
    industryData.average
  );

  if (stdDev === 0) {
    // 標準偏差が0の場合は判定不能
    return null;
  }

  // 平均からの偏差を標準偏差の倍数で表現
  const zScore = (value - industryData.average) / stdDev;
  const absZScore = Math.abs(zScore);

  // 警告レベル以上の偏差がある場合のみ異常として検出
  if (absZScore >= thresholds.warningDeviation) {
    const alertLevel = determineAlertLevel(absZScore, thresholds);
    const severity = calculateSeverity(absZScore, thresholds.criticalDeviation);

    const direction = zScore > 0 ? '上回' : '下回';
    const description = `${metric}が業界平均から${absZScore.toFixed(2)}σ${direction}っています（業界平均: ${industryData.average.toFixed(2)}）。`;

    return {
      metric,
      actualValue: value,
      expectedValue: industryData.average,
      deviation: absZScore,
      severity,
      alertLevel,
      description,
      detectedAt: new Date().toISOString(),
    };
  }

  return null;
}

/**
 * 単一指標の異常値検出
 *
 * 絶対値チェックと偏差チェックの両方を実施します。
 *
 * @param metricResult - 指標結果
 * @param industryData - 業界データ（オプション）
 * @returns 異常検出結果の配列
 */
export function detectAnomalies(
  metricResult: MetricResult,
  industryData?: IndustryData
): AnomalyResult[] {
  const anomalies: AnomalyResult[] = [];

  // 値がnullの場合は検出不能
  if (metricResult.value === null) {
    return anomalies;
  }

  // 指標別の閾値を取得（なければデフォルト）
  const specificThresholds = METRIC_SPECIFIC_THRESHOLDS[metricResult.metric] ?? {};
  const thresholds: AnomalyThresholds = {
    ...DEFAULT_THRESHOLDS,
    ...specificThresholds,
  };

  // 絶対値ベースのチェック
  const absoluteAnomaly = checkAbsoluteAnomaly(
    metricResult.metric,
    metricResult.value,
    thresholds
  );
  if (absoluteAnomaly) {
    anomalies.push(absoluteAnomaly);
  }

  // 偏差ベースのチェック（業界データがある場合のみ）
  if (industryData) {
    const deviationAnomaly = checkDeviationAnomaly(
      metricResult.metric,
      metricResult.value,
      industryData,
      thresholds
    );
    if (deviationAnomaly) {
      anomalies.push(deviationAnomaly);
    }
  }

  return anomalies;
}

/**
 * 複数指標の異常値検出を一括実行
 *
 * @param metricResults - 指標結果の配列
 * @param industryDataMap - 指標名をキーとする業界データマップ
 * @returns 異常検出結果の配列
 */
export function detectMultipleAnomalies(
  metricResults: MetricResult[],
  industryDataMap?: Record<string, IndustryData>
): AnomalyResult[] {
  const allAnomalies: AnomalyResult[] = [];

  for (const metricResult of metricResults) {
    const industryData = industryDataMap?.[metricResult.metric];
    const anomalies = detectAnomalies(metricResult, industryData);
    allAnomalies.push(...anomalies);
  }

  // 異常度（severity）の降順でソート
  return allAnomalies.sort((a, b) => b.severity - a.severity);
}

/**
 * 異常値検出結果のサマリーを生成
 *
 * @param anomalies - 異常検出結果の配列
 * @returns サマリー文字列
 */
export function summarizeAnomalies(anomalies: AnomalyResult[]): string {
  if (anomalies.length === 0) {
    return '異常値は検出されませんでした。';
  }

  const lines: string[] = [];
  lines.push(`異常値検出結果: ${anomalies.length}件`);
  lines.push('');

  // アラートレベル別に集計
  const criticalCount = anomalies.filter((a) => a.alertLevel === 'critical').length;
  const warningCount = anomalies.filter((a) => a.alertLevel === 'warning').length;
  const infoCount = anomalies.filter((a) => a.alertLevel === 'info').length;

  lines.push(`サマリー:`);
  lines.push(`  Critical: ${criticalCount}件`);
  lines.push(`  Warning: ${warningCount}件`);
  lines.push(`  Info: ${infoCount}件`);
  lines.push('');

  // 各異常の詳細
  lines.push('詳細:');
  for (const anomaly of anomalies) {
    const icon = anomaly.alertLevel === 'critical' ? '🔴' : anomaly.alertLevel === 'warning' ? '⚠️' : 'ℹ️';
    lines.push(`${icon} [${anomaly.alertLevel.toUpperCase()}] ${anomaly.metric}`);
    lines.push(`   ${anomaly.description}`);
    lines.push(`   実際の値: ${anomaly.actualValue.toFixed(2)}`);
    lines.push(`   期待値: ${anomaly.expectedValue.toFixed(2)}`);
    lines.push(`   偏差: ${anomaly.deviation.toFixed(2)}`);
    lines.push(`   異常度: ${(anomaly.severity * 100).toFixed(0)}%`);
    lines.push('');
  }

  return lines.join('\n');
}
