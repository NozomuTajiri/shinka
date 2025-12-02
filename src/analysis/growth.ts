/**
 * 成長性指標計算モジュール
 *
 * 企業の成長性を評価する5つの主要指標を計算します。
 * - 売上高成長率
 * - 営業利益成長率
 * - 経常利益成長率
 * - 総資産成長率
 * - 従業員数成長率
 */

import type { FinancialData, MetricResult, PreviousYearData } from '../types/analysis.js';

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
 * 成長率を計算
 *
 * 計算式: 成長率 = (当期値 - 前期値) / 前期値 × 100
 */
function calculateGrowthRate(current: number, previous: number): number | null {
  const change = current - previous;
  return safeDivide(change, previous);
}

/**
 * 評価レベルを判定（成長率系）
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
 * 売上高成長率を計算
 *
 * 計算式: 売上高成長率 = (当期売上高 - 前期売上高) / 前期売上高 × 100
 *
 * 意味: 前年と比較してどれだけ売上が伸びたかを示す指標。
 * プラスであれば成長、マイナスであれば縮小を意味する。
 *
 * 目安:
 * - 20%以上: 優良（excellent）高成長
 * - 10%以上: 良好（good）堅調な成長
 * - 5%以上: 普通（fair）緩やかな成長
 * - 5%未満: 改善が必要（poor）低成長または縮小
 */
export function calculateRevenueGrowth(
  data: FinancialData,
  previousYear?: PreviousYearData
): MetricResult {
  if (!previousYear?.revenue) {
    return {
      metric: 'Revenue Growth',
      value: null,
      unit: '%',
      formula: '売上高成長率 = (当期売上高 - 前期売上高) / 前期売上高 × 100',
      error: '前期売上高のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthRate = calculateGrowthRate(data.revenue, previousYear.revenue);

  if (growthRate === null) {
    return {
      metric: 'Revenue Growth',
      value: null,
      unit: '%',
      formula: '売上高成長率 = (当期売上高 - 前期売上高) / 前期売上高 × 100',
      error: 'ゼロ除算エラー: 前期売上高が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthPercent = growthRate * 100;

  return {
    metric: 'Revenue Growth',
    value: growthPercent,
    unit: '%',
    formula: '売上高成長率 = (当期売上高 - 前期売上高) / 前期売上高 × 100',
    rating: getRating(growthPercent, { excellent: 20, good: 10, fair: 5 }),
    yoyChange: growthPercent,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 営業利益成長率を計算
 *
 * 計算式: 営業利益成長率 = (当期営業利益 - 前期営業利益) / 前期営業利益 × 100
 *
 * 意味: 前年と比較して本業の利益がどれだけ伸びたかを示す指標。
 * 売上高成長率よりも重要な指標とされる（利益の伸びが本質）。
 *
 * 目安:
 * - 30%以上: 優良（excellent）高収益成長
 * - 15%以上: 良好（good）堅調な収益成長
 * - 8%以上: 普通（fair）緩やかな収益成長
 * - 8%未満: 改善が必要（poor）低収益成長または縮小
 */
export function calculateOperatingIncomeGrowth(
  data: FinancialData,
  previousYear?: PreviousYearData
): MetricResult {
  if (!previousYear?.operatingIncome) {
    return {
      metric: 'Operating Income Growth',
      value: null,
      unit: '%',
      formula: '営業利益成長率 = (当期営業利益 - 前期営業利益) / 前期営業利益 × 100',
      error: '前期営業利益のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthRate = calculateGrowthRate(data.operatingIncome, previousYear.operatingIncome);

  if (growthRate === null) {
    return {
      metric: 'Operating Income Growth',
      value: null,
      unit: '%',
      formula: '営業利益成長率 = (当期営業利益 - 前期営業利益) / 前期営業利益 × 100',
      error: 'ゼロ除算エラー: 前期営業利益が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthPercent = growthRate * 100;

  return {
    metric: 'Operating Income Growth',
    value: growthPercent,
    unit: '%',
    formula: '営業利益成長率 = (当期営業利益 - 前期営業利益) / 前期営業利益 × 100',
    rating: getRating(growthPercent, { excellent: 30, good: 15, fair: 8 }),
    yoyChange: growthPercent,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 経常利益成長率を計算
 *
 * 計算式: 経常利益成長率 = (当期経常利益 - 前期経常利益) / 前期経常利益 × 100
 *
 * 意味: 前年と比較して経常的な利益がどれだけ伸びたかを示す指標。
 * 財務活動を含めた総合的な収益力の成長を評価する。
 *
 * 目安:
 * - 25%以上: 優良（excellent）高収益成長
 * - 12%以上: 良好（good）堅調な収益成長
 * - 6%以上: 普通（fair）緩やかな収益成長
 * - 6%未満: 改善が必要（poor）低収益成長または縮小
 */
export function calculateOrdinaryIncomeGrowth(
  data: FinancialData,
  previousYear?: PreviousYearData
): MetricResult {
  // 経常利益がない場合は営業利益で代用
  const currentOrdinaryIncome = data.ordinaryIncome ?? data.operatingIncome;
  const previousOrdinaryIncome =
    previousYear?.ordinaryIncome ?? previousYear?.operatingIncome;

  if (!previousOrdinaryIncome) {
    return {
      metric: 'Ordinary Income Growth',
      value: null,
      unit: '%',
      formula: '経常利益成長率 = (当期経常利益 - 前期経常利益) / 前期経常利益 × 100',
      error: '前期経常利益のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthRate = calculateGrowthRate(currentOrdinaryIncome, previousOrdinaryIncome);

  if (growthRate === null) {
    return {
      metric: 'Ordinary Income Growth',
      value: null,
      unit: '%',
      formula: '経常利益成長率 = (当期経常利益 - 前期経常利益) / 前期経常利益 × 100',
      error: 'ゼロ除算エラー: 前期経常利益が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthPercent = growthRate * 100;

  return {
    metric: 'Ordinary Income Growth',
    value: growthPercent,
    unit: '%',
    formula: '経常利益成長率 = (当期経常利益 - 前期経常利益) / 前期経常利益 × 100',
    rating: getRating(growthPercent, { excellent: 25, good: 12, fair: 6 }),
    yoyChange: growthPercent,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 総資産成長率を計算
 *
 * 計算式: 総資産成長率 = (当期総資産 - 前期総資産) / 前期総資産 × 100
 *
 * 意味: 前年と比較して企業規模がどれだけ拡大したかを示す指標。
 * プラスであれば事業拡大、マイナスであれば資産圧縮を意味する。
 *
 * 目安:
 * - 15%以上: 優良（excellent）積極的拡大
 * - 8%以上: 良好（good）堅調な拡大
 * - 3%以上: 普通（fair）緩やかな拡大
 * - 3%未満: 改善が必要（poor）低成長または縮小
 *
 * 注意: 資産成長が売上・利益成長を伴わない場合、効率性の低下を意味する
 */
export function calculateTotalAssetGrowth(
  data: FinancialData,
  previousYear?: PreviousYearData
): MetricResult {
  if (!previousYear?.totalAssets) {
    return {
      metric: 'Total Asset Growth',
      value: null,
      unit: '%',
      formula: '総資産成長率 = (当期総資産 - 前期総資産) / 前期総資産 × 100',
      error: '前期総資産のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthRate = calculateGrowthRate(data.totalAssets, previousYear.totalAssets);

  if (growthRate === null) {
    return {
      metric: 'Total Asset Growth',
      value: null,
      unit: '%',
      formula: '総資産成長率 = (当期総資産 - 前期総資産) / 前期総資産 × 100',
      error: 'ゼロ除算エラー: 前期総資産が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthPercent = growthRate * 100;

  return {
    metric: 'Total Asset Growth',
    value: growthPercent,
    unit: '%',
    formula: '総資産成長率 = (当期総資産 - 前期総資産) / 前期総資産 × 100',
    rating: getRating(growthPercent, { excellent: 15, good: 8, fair: 3 }),
    yoyChange: growthPercent,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 従業員数成長率を計算
 *
 * 計算式: 従業員数成長率 = (当期従業員数 - 前期従業員数) / 前期従業員数 × 100
 *
 * 意味: 前年と比較して従業員数がどれだけ増加したかを示す指標。
 * プラスであれば採用拡大、マイナスであれば人員削減を意味する。
 *
 * 目安:
 * - 10%以上: 優良（excellent）積極採用
 * - 5%以上: 良好（good）堅調な採用
 * - 2%以上: 普通（fair）緩やかな採用
 * - 2%未満: 改善が必要（poor）低成長または縮小
 *
 * 注意: 従業員数が増えても生産性が向上しない場合、効率性の低下を意味する
 */
export function calculateEmployeeGrowth(
  data: FinancialData,
  previousYear?: PreviousYearData
): MetricResult {
  if (
    data.numberOfEmployees === undefined ||
    !previousYear?.numberOfEmployees
  ) {
    return {
      metric: 'Employee Growth',
      value: null,
      unit: '%',
      formula: '従業員数成長率 = (当期従業員数 - 前期従業員数) / 前期従業員数 × 100',
      error: '従業員数のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthRate = calculateGrowthRate(
    data.numberOfEmployees,
    previousYear.numberOfEmployees
  );

  if (growthRate === null) {
    return {
      metric: 'Employee Growth',
      value: null,
      unit: '%',
      formula: '従業員数成長率 = (当期従業員数 - 前期従業員数) / 前期従業員数 × 100',
      error: 'ゼロ除算エラー: 前期従業員数が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  const growthPercent = growthRate * 100;

  return {
    metric: 'Employee Growth',
    value: growthPercent,
    unit: '%',
    formula: '従業員数成長率 = (当期従業員数 - 前期従業員数) / 前期従業員数 × 100',
    rating: getRating(growthPercent, { excellent: 10, good: 5, fair: 2 }),
    yoyChange: growthPercent,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 全成長性指標を一括計算
 */
export function calculateAllGrowthMetrics(
  data: FinancialData,
  previousYear?: PreviousYearData
): {
  revenueGrowth: MetricResult;
  operatingIncomeGrowth: MetricResult;
  ordinaryIncomeGrowth: MetricResult;
  totalAssetGrowth: MetricResult;
  employeeGrowth: MetricResult;
} {
  return {
    revenueGrowth: calculateRevenueGrowth(data, previousYear),
    operatingIncomeGrowth: calculateOperatingIncomeGrowth(data, previousYear),
    ordinaryIncomeGrowth: calculateOrdinaryIncomeGrowth(data, previousYear),
    totalAssetGrowth: calculateTotalAssetGrowth(data, previousYear),
    employeeGrowth: calculateEmployeeGrowth(data, previousYear),
  };
}
