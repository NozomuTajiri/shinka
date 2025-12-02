/**
 * 収益性指標計算モジュール
 *
 * 企業の収益力を評価する6つの主要指標を計算します。
 * - ROE（自己資本利益率）
 * - ROA（総資産利益率）
 * - 営業利益率
 * - 売上総利益率
 * - 経常利益率
 * - 当期純利益率
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
 * 評価レベルを判定
 */
function getRating(
  value: number,
  thresholds: { excellent: number; good: number; fair: number }
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (value >= thresholds.excellent) return 'excellent';
  if (value >= thresholds.good) return 'good';
  if (value >= thresholds.fair) return 'fair';
  return 'poor';
}

/**
 * ROE（自己資本利益率）を計算
 *
 * 計算式: ROE = 当期純利益 / 自己資本 × 100
 *
 * 意味: 株主が投下した資本に対してどれだけ利益を上げたかを示す指標。
 * ROEが高いほど、株主資本を効率的に活用して利益を生み出している。
 *
 * 目安:
 * - 15%以上: 優良（excellent）
 * - 10%以上: 良好（good）
 * - 5%以上: 普通（fair）
 * - 5%未満: 改善が必要（poor）
 */
export function calculateROE(data: FinancialData): MetricResult {
  const roe = safeDivide(data.netIncome, data.equity);

  if (roe === null) {
    return {
      metric: 'ROE',
      value: null,
      unit: '%',
      formula: 'ROE = 当期純利益 / 自己資本 × 100',
      error: 'ゼロ除算エラー: 自己資本が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const roePercent = roe * 100;

  return {
    metric: 'ROE',
    value: roePercent,
    unit: '%',
    formula: 'ROE = 当期純利益 / 自己資本 × 100',
    rating: getRating(roePercent, { excellent: 15, good: 10, fair: 5 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * ROA（総資産利益率）を計算
 *
 * 計算式: ROA = 当期純利益 / 総資産 × 100
 *
 * 意味: 企業が保有する総資産をどれだけ効率的に利益に変えているかを示す指標。
 * ROAが高いほど、資産を効率的に活用している。
 *
 * 目安:
 * - 10%以上: 優良（excellent）
 * - 5%以上: 良好（good）
 * - 2%以上: 普通（fair）
 * - 2%未満: 改善が必要（poor）
 */
export function calculateROA(data: FinancialData): MetricResult {
  const roa = safeDivide(data.netIncome, data.totalAssets);

  if (roa === null) {
    return {
      metric: 'ROA',
      value: null,
      unit: '%',
      formula: 'ROA = 当期純利益 / 総資産 × 100',
      error: 'ゼロ除算エラー: 総資産が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const roaPercent = roa * 100;

  return {
    metric: 'ROA',
    value: roaPercent,
    unit: '%',
    formula: 'ROA = 当期純利益 / 総資産 × 100',
    rating: getRating(roaPercent, { excellent: 10, good: 5, fair: 2 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 営業利益率を計算
 *
 * 計算式: 営業利益率 = 営業利益 / 売上高 × 100
 *
 * 意味: 本業でどれだけ利益を上げているかを示す指標。
 * 営業利益率が高いほど、本業の収益性が高い。
 *
 * 目安:
 * - 15%以上: 優良（excellent）
 * - 10%以上: 良好（good）
 * - 5%以上: 普通（fair）
 * - 5%未満: 改善が必要（poor）
 */
export function calculateOperatingMargin(data: FinancialData): MetricResult {
  const margin = safeDivide(data.operatingIncome, data.revenue);

  if (margin === null) {
    return {
      metric: 'Operating Margin',
      value: null,
      unit: '%',
      formula: '営業利益率 = 営業利益 / 売上高 × 100',
      error: 'ゼロ除算エラー: 売上高が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const marginPercent = margin * 100;

  return {
    metric: 'Operating Margin',
    value: marginPercent,
    unit: '%',
    formula: '営業利益率 = 営業利益 / 売上高 × 100',
    rating: getRating(marginPercent, { excellent: 15, good: 10, fair: 5 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 売上総利益率を計算
 *
 * 計算式: 売上総利益率 = 売上総利益 / 売上高 × 100
 *
 * 意味: 売上に対する粗利の割合を示す指標。
 * 売上総利益率が高いほど、商品・サービスの付加価値が高い。
 *
 * 目安:
 * - 40%以上: 優良（excellent）
 * - 30%以上: 良好（good）
 * - 20%以上: 普通（fair）
 * - 20%未満: 改善が必要（poor）
 *
 * 注: 売上総利益が提供されていない場合、売上高 - 売上原価で計算
 */
export function calculateGrossMargin(data: FinancialData): MetricResult {
  // 売上総利益が提供されていない場合は売上原価から計算
  const grossProfit =
    data.grossProfit !== undefined
      ? data.grossProfit
      : data.costOfRevenue !== undefined
        ? data.revenue - data.costOfRevenue
        : null;

  if (grossProfit === null) {
    return {
      metric: 'Gross Margin',
      value: null,
      unit: '%',
      formula: '売上総利益率 = 売上総利益 / 売上高 × 100',
      error: '売上総利益または売上原価のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const margin = safeDivide(grossProfit, data.revenue);

  if (margin === null) {
    return {
      metric: 'Gross Margin',
      value: null,
      unit: '%',
      formula: '売上総利益率 = 売上総利益 / 売上高 × 100',
      error: 'ゼロ除算エラー: 売上高が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const marginPercent = margin * 100;

  return {
    metric: 'Gross Margin',
    value: marginPercent,
    unit: '%',
    formula: '売上総利益率 = 売上総利益 / 売上高 × 100',
    rating: getRating(marginPercent, { excellent: 40, good: 30, fair: 20 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 経常利益率を計算
 *
 * 計算式: 経常利益率 = 経常利益 / 売上高 × 100
 *
 * 意味: 本業と財務活動を含めた経常的な利益率を示す指標。
 * 経常利益率が高いほど、企業の総合的な収益力が高い。
 *
 * 目安:
 * - 10%以上: 優良（excellent）
 * - 7%以上: 良好（good）
 * - 4%以上: 普通（fair）
 * - 4%未満: 改善が必要（poor）
 *
 * 注: 経常利益が提供されていない場合、営業利益で代用
 */
export function calculateOrdinaryMargin(data: FinancialData): MetricResult {
  const ordinaryIncome = data.ordinaryIncome ?? data.operatingIncome;

  const margin = safeDivide(ordinaryIncome, data.revenue);

  if (margin === null) {
    return {
      metric: 'Ordinary Margin',
      value: null,
      unit: '%',
      formula: '経常利益率 = 経常利益 / 売上高 × 100',
      error: 'ゼロ除算エラー: 売上高が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const marginPercent = margin * 100;

  return {
    metric: 'Ordinary Margin',
    value: marginPercent,
    unit: '%',
    formula: '経常利益率 = 経常利益 / 売上高 × 100',
    rating: getRating(marginPercent, { excellent: 10, good: 7, fair: 4 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 当期純利益率を計算
 *
 * 計算式: 当期純利益率 = 当期純利益 / 売上高 × 100
 *
 * 意味: 売上に対する最終的な利益率を示す指標。
 * 当期純利益率が高いほど、売上が効率的に利益に変換されている。
 *
 * 目安:
 * - 8%以上: 優良（excellent）
 * - 5%以上: 良好（good）
 * - 3%以上: 普通（fair）
 * - 3%未満: 改善が必要（poor）
 */
export function calculateNetMargin(data: FinancialData): MetricResult {
  const margin = safeDivide(data.netIncome, data.revenue);

  if (margin === null) {
    return {
      metric: 'Net Margin',
      value: null,
      unit: '%',
      formula: '当期純利益率 = 当期純利益 / 売上高 × 100',
      error: 'ゼロ除算エラー: 売上高が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const marginPercent = margin * 100;

  return {
    metric: 'Net Margin',
    value: marginPercent,
    unit: '%',
    formula: '当期純利益率 = 当期純利益 / 売上高 × 100',
    rating: getRating(marginPercent, { excellent: 8, good: 5, fair: 3 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 全収益性指標を一括計算
 */
export function calculateAllProfitabilityMetrics(
  data: FinancialData
): {
  roe: MetricResult;
  roa: MetricResult;
  operatingMargin: MetricResult;
  grossMargin: MetricResult;
  ordinaryMargin: MetricResult;
  netMargin: MetricResult;
} {
  return {
    roe: calculateROE(data),
    roa: calculateROA(data),
    operatingMargin: calculateOperatingMargin(data),
    grossMargin: calculateGrossMargin(data),
    ordinaryMargin: calculateOrdinaryMargin(data),
    netMargin: calculateNetMargin(data),
  };
}
