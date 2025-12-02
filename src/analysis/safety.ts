/**
 * 安全性指標計算モジュール
 *
 * 企業の財務安全性を評価する6つの主要指標を計算します。
 * - 自己資本比率
 * - 流動比率
 * - 当座比率
 * - 固定長期適合率
 * - 負債比率
 * - インタレストカバレッジレシオ
 */

import type { FinancialData, MetricResult } from '../types/analysis.js';

/**
 * ゼロ除算を防ぐ安全な除算
 */
function safeDivide(numerator: number, denominator: number): number | null {
  if (denominator === 0 || !isFinite(denominator)) {
    return null;
  }
  const result = numerator / denominator;
  return isFinite(result) ? result : null;
}

/**
 * 評価レベルを判定（比率系）
 */
function getRating(
  value: number,
  thresholds: { excellent: number; good: number; fair: number },
  higherIsBetter = true
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (higherIsBetter) {
    if (value >= thresholds.excellent) return 'excellent';
    if (value >= thresholds.good) return 'good';
    if (value >= thresholds.fair) return 'fair';
    return 'poor';
  } else {
    // 低いほど良い指標（固定長期適合率など）
    if (value <= thresholds.excellent) return 'excellent';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.fair) return 'fair';
    return 'poor';
  }
}

/**
 * 自己資本比率を計算
 *
 * 計算式: 自己資本比率 = 自己資本 / 総資産 × 100
 *
 * 意味: 総資産に占める自己資本の割合を示す指標。
 * 自己資本比率が高いほど、財務基盤が安定している。
 *
 * 目安:
 * - 50%以上: 優良（excellent）
 * - 40%以上: 良好（good）
 * - 30%以上: 普通（fair）
 * - 30%未満: 改善が必要（poor）
 */
export function calculateEquityRatio(data: FinancialData): MetricResult {
  const ratio = safeDivide(data.equity, data.totalAssets);

  if (ratio === null) {
    return {
      metric: 'Equity Ratio',
      value: null,
      unit: '%',
      formula: '自己資本比率 = 自己資本 / 総資産 × 100',
      error: 'ゼロ除算エラー: 総資産が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const ratioPercent = ratio * 100;

  return {
    metric: 'Equity Ratio',
    value: ratioPercent,
    unit: '%',
    formula: '自己資本比率 = 自己資本 / 総資産 × 100',
    rating: getRating(ratioPercent, { excellent: 50, good: 40, fair: 30 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 流動比率を計算
 *
 * 計算式: 流動比率 = 流動資産 / 流動負債 × 100
 *
 * 意味: 短期的な支払能力を示す指標。
 * 流動比率が高いほど、短期的な債務返済能力が高い。
 *
 * 目安:
 * - 200%以上: 優良（excellent）
 * - 150%以上: 良好（good）
 * - 100%以上: 普通（fair）
 * - 100%未満: 改善が必要（poor）
 */
export function calculateCurrentRatio(data: FinancialData): MetricResult {
  if (data.currentAssets === undefined || data.currentLiabilities === undefined) {
    return {
      metric: 'Current Ratio',
      value: null,
      unit: '%',
      formula: '流動比率 = 流動資産 / 流動負債 × 100',
      error: '流動資産または流動負債のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const ratio = safeDivide(data.currentAssets, data.currentLiabilities);

  if (ratio === null) {
    return {
      metric: 'Current Ratio',
      value: null,
      unit: '%',
      formula: '流動比率 = 流動資産 / 流動負債 × 100',
      error: 'ゼロ除算エラー: 流動負債が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const ratioPercent = ratio * 100;

  return {
    metric: 'Current Ratio',
    value: ratioPercent,
    unit: '%',
    formula: '流動比率 = 流動資産 / 流動負債 × 100',
    rating: getRating(ratioPercent, { excellent: 200, good: 150, fair: 100 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 当座比率を計算
 *
 * 計算式: 当座比率 = (流動資産 - 棚卸資産) / 流動負債 × 100
 *
 * 意味: より厳格な短期支払能力を示す指標。
 * 棚卸資産を除いた流動資産で短期債務を返済できるかを測る。
 *
 * 目安:
 * - 120%以上: 優良（excellent）
 * - 100%以上: 良好（good）
 * - 80%以上: 普通（fair）
 * - 80%未満: 改善が必要（poor）
 */
export function calculateQuickRatio(data: FinancialData): MetricResult {
  if (data.currentAssets === undefined || data.currentLiabilities === undefined) {
    return {
      metric: 'Quick Ratio',
      value: null,
      unit: '%',
      formula: '当座比率 = (流動資産 - 棚卸資産) / 流動負債 × 100',
      error: '流動資産または流動負債のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  // 棚卸資産が提供されていない場合は0として扱う
  const inventory = data.inventory ?? 0;
  const quickAssets = data.currentAssets - inventory;

  const ratio = safeDivide(quickAssets, data.currentLiabilities);

  if (ratio === null) {
    return {
      metric: 'Quick Ratio',
      value: null,
      unit: '%',
      formula: '当座比率 = (流動資産 - 棚卸資産) / 流動負債 × 100',
      error: 'ゼロ除算エラー: 流動負債が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const ratioPercent = ratio * 100;

  return {
    metric: 'Quick Ratio',
    value: ratioPercent,
    unit: '%',
    formula: '当座比率 = (流動資産 - 棚卸資産) / 流動負債 × 100',
    rating: getRating(ratioPercent, { excellent: 120, good: 100, fair: 80 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 固定長期適合率を計算
 *
 * 計算式: 固定長期適合率 = 固定資産 / (自己資本 + 固定負債) × 100
 *
 * 意味: 固定資産が長期資金（自己資本+固定負債）でどれだけ賄われているかを示す指標。
 * 100%以下であれば、固定資産が長期資金で賄われており安全性が高い。
 *
 * 目安:
 * - 80%以下: 優良（excellent）
 * - 90%以下: 良好（good）
 * - 100%以下: 普通（fair）
 * - 100%超: 改善が必要（poor）
 *
 * 注: この指標は低いほど良い
 */
export function calculateFixedToLongTermRatio(data: FinancialData): MetricResult {
  if (data.fixedAssets === undefined || data.longTermLiabilities === undefined) {
    return {
      metric: 'Fixed to Long-term Ratio',
      value: null,
      unit: '%',
      formula: '固定長期適合率 = 固定資産 / (自己資本 + 固定負債) × 100',
      error: '固定資産または固定負債のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const longTermCapital = data.equity + data.longTermLiabilities;
  const ratio = safeDivide(data.fixedAssets, longTermCapital);

  if (ratio === null) {
    return {
      metric: 'Fixed to Long-term Ratio',
      value: null,
      unit: '%',
      formula: '固定長期適合率 = 固定資産 / (自己資本 + 固定負債) × 100',
      error: 'ゼロ除算エラー: 長期資金が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const ratioPercent = ratio * 100;

  return {
    metric: 'Fixed to Long-term Ratio',
    value: ratioPercent,
    unit: '%',
    formula: '固定長期適合率 = 固定資産 / (自己資本 + 固定負債) × 100',
    rating: getRating(ratioPercent, { excellent: 80, good: 90, fair: 100 }, false),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 負債比率を計算
 *
 * 計算式: 負債比率 = 総負債 / 自己資本 × 100
 *
 * 意味: 自己資本に対する負債の割合を示す指標。
 * 負債比率が低いほど、財務的に安全性が高い。
 *
 * 目安:
 * - 100%以下: 優良（excellent）
 * - 150%以下: 良好（good）
 * - 200%以下: 普通（fair）
 * - 200%超: 改善が必要（poor）
 *
 * 注: この指標は低いほど良い
 */
export function calculateDebtRatio(data: FinancialData): MetricResult {
  const ratio = safeDivide(data.totalLiabilities, data.equity);

  if (ratio === null) {
    return {
      metric: 'Debt Ratio',
      value: null,
      unit: '%',
      formula: '負債比率 = 総負債 / 自己資本 × 100',
      error: 'ゼロ除算エラー: 自己資本が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const ratioPercent = ratio * 100;

  return {
    metric: 'Debt Ratio',
    value: ratioPercent,
    unit: '%',
    formula: '負債比率 = 総負債 / 自己資本 × 100',
    rating: getRating(ratioPercent, { excellent: 100, good: 150, fair: 200 }, false),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * インタレストカバレッジレシオを計算
 *
 * 計算式: インタレストカバレッジレシオ = 営業利益 / 支払利息
 *
 * 意味: 営業利益が支払利息の何倍あるかを示す指標。
 * 値が高いほど、利息支払能力が高い。
 *
 * 目安:
 * - 10倍以上: 優良（excellent）
 * - 5倍以上: 良好（good）
 * - 2倍以上: 普通（fair）
 * - 2倍未満: 改善が必要（poor）
 */
export function calculateInterestCoverageRatio(data: FinancialData): MetricResult {
  if (data.interestExpense === undefined) {
    return {
      metric: 'Interest Coverage Ratio',
      value: null,
      unit: '倍',
      formula: 'インタレストカバレッジレシオ = 営業利益 / 支払利息',
      error: '支払利息のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const ratio = safeDivide(data.operatingIncome, data.interestExpense);

  if (ratio === null) {
    return {
      metric: 'Interest Coverage Ratio',
      value: null,
      unit: '倍',
      formula: 'インタレストカバレッジレシオ = 営業利益 / 支払利息',
      error: 'ゼロ除算エラー: 支払利息が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  return {
    metric: 'Interest Coverage Ratio',
    value: ratio,
    unit: '倍',
    formula: 'インタレストカバレッジレシオ = 営業利益 / 支払利息',
    rating: getRating(ratio, { excellent: 10, good: 5, fair: 2 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 全安全性指標を一括計算
 */
export function calculateAllSafetyMetrics(
  data: FinancialData
): {
  equityRatio: MetricResult;
  currentRatio: MetricResult;
  quickRatio: MetricResult;
  fixedToLongTermRatio: MetricResult;
  debtRatio: MetricResult;
  interestCoverageRatio: MetricResult;
} {
  return {
    equityRatio: calculateEquityRatio(data),
    currentRatio: calculateCurrentRatio(data),
    quickRatio: calculateQuickRatio(data),
    fixedToLongTermRatio: calculateFixedToLongTermRatio(data),
    debtRatio: calculateDebtRatio(data),
    interestCoverageRatio: calculateInterestCoverageRatio(data),
  };
}
