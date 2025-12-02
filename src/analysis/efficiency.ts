/**
 * 効率性指標計算モジュール
 *
 * 企業の資産運用効率を評価する5つの主要指標を計算します。
 * - 総資産回転率
 * - 売上債権回転率
 * - 棚卸資産回転率
 * - 仕入債務回転率
 * - 固定資産回転率
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
 * 評価レベルを判定（回転率系）
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
 * 総資産回転率を計算
 *
 * 計算式: 総資産回転率 = 売上高 / 総資産
 *
 * 意味: 総資産が1年間に何回転したかを示す指標。
 * 値が高いほど、資産を効率的に活用して売上を生み出している。
 *
 * 目安:
 * - 1.5回以上: 優良（excellent）
 * - 1.0回以上: 良好（good）
 * - 0.7回以上: 普通（fair）
 * - 0.7回未満: 改善が必要（poor）
 */
export function calculateTotalAssetTurnover(data: FinancialData): MetricResult {
  const turnover = safeDivide(data.revenue, data.totalAssets);

  if (turnover === null) {
    return {
      metric: 'Total Asset Turnover',
      value: null,
      unit: '回',
      formula: '総資産回転率 = 売上高 / 総資産',
      error: 'ゼロ除算エラー: 総資産が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  return {
    metric: 'Total Asset Turnover',
    value: turnover,
    unit: '回',
    formula: '総資産回転率 = 売上高 / 総資産',
    rating: getRating(turnover, { excellent: 1.5, good: 1.0, fair: 0.7 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 売上債権回転率を計算
 *
 * 計算式: 売上債権回転率 = 売上高 / 売上債権
 *
 * 意味: 売上債権（売掛金）が1年間に何回転したかを示す指標。
 * 値が高いほど、売掛金の回収が早い（回収サイクルが短い）。
 *
 * 目安:
 * - 12回以上: 優良（excellent）約30日で回収
 * - 8回以上: 良好（good）約45日で回収
 * - 6回以上: 普通（fair）約60日で回収
 * - 6回未満: 改善が必要（poor）
 *
 * 補足: 回転率 × 365日 = 平均回収日数
 */
export function calculateReceivablesTurnover(data: FinancialData): MetricResult {
  if (data.accountsReceivable === undefined) {
    return {
      metric: 'Receivables Turnover',
      value: null,
      unit: '回',
      formula: '売上債権回転率 = 売上高 / 売上債権',
      error: '売上債権のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const turnover = safeDivide(data.revenue, data.accountsReceivable);

  if (turnover === null) {
    return {
      metric: 'Receivables Turnover',
      value: null,
      unit: '回',
      formula: '売上債権回転率 = 売上高 / 売上債権',
      error: 'ゼロ除算エラー: 売上債権が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  return {
    metric: 'Receivables Turnover',
    value: turnover,
    unit: '回',
    formula: '売上債権回転率 = 売上高 / 売上債権',
    rating: getRating(turnover, { excellent: 12, good: 8, fair: 6 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 棚卸資産回転率を計算
 *
 * 計算式: 棚卸資産回転率 = 売上高 / 棚卸資産
 *
 * 意味: 棚卸資産（在庫）が1年間に何回転したかを示す指標。
 * 値が高いほど、在庫が効率的に販売されている（在庫回転が早い）。
 *
 * 目安:
 * - 12回以上: 優良（excellent）約30日で販売
 * - 8回以上: 良好（good）約45日で販売
 * - 5回以上: 普通（fair）約73日で販売
 * - 5回未満: 改善が必要（poor）
 *
 * 補足: 回転率 × 365日 = 平均在庫保有日数
 */
export function calculateInventoryTurnover(data: FinancialData): MetricResult {
  if (data.inventory === undefined) {
    return {
      metric: 'Inventory Turnover',
      value: null,
      unit: '回',
      formula: '棚卸資産回転率 = 売上高 / 棚卸資産',
      error: '棚卸資産のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const turnover = safeDivide(data.revenue, data.inventory);

  if (turnover === null) {
    return {
      metric: 'Inventory Turnover',
      value: null,
      unit: '回',
      formula: '棚卸資産回転率 = 売上高 / 棚卸資産',
      error: 'ゼロ除算エラー: 棚卸資産が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  return {
    metric: 'Inventory Turnover',
    value: turnover,
    unit: '回',
    formula: '棚卸資産回転率 = 売上高 / 棚卸資産',
    rating: getRating(turnover, { excellent: 12, good: 8, fair: 5 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 仕入債務回転率を計算
 *
 * 計算式: 仕入債務回転率 = 売上高 / 仕入債務
 *
 * 意味: 仕入債務（買掛金）が1年間に何回転したかを示す指標。
 * 値が高いと支払サイクルが短く、低いと支払いを延ばしている。
 *
 * 目安:
 * - 10回以上: 約36日で支払い（やや早め）
 * - 8回以上: 約45日で支払い（標準的）
 * - 6回以上: 約60日で支払い（やや遅め）
 * - 6回未満: 約60日超で支払い（要注意）
 *
 * 注意: この指標は必ずしも高ければ良いとは限らない。
 * 低すぎる（支払いが遅い）と取引先との関係悪化のリスクがあるが、
 * 高すぎる（支払いが早い）と資金繰りに余裕がない可能性もある。
 */
export function calculatePayablesTurnover(data: FinancialData): MetricResult {
  if (data.accountsPayable === undefined) {
    return {
      metric: 'Payables Turnover',
      value: null,
      unit: '回',
      formula: '仕入債務回転率 = 売上高 / 仕入債務',
      error: '仕入債務のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const turnover = safeDivide(data.revenue, data.accountsPayable);

  if (turnover === null) {
    return {
      metric: 'Payables Turnover',
      value: null,
      unit: '回',
      formula: '仕入債務回転率 = 売上高 / 仕入債務',
      error: 'ゼロ除算エラー: 仕入債務が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  // 仕入債務回転率は中程度が良い（極端に高いor低いは問題）
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (turnover >= 8 && turnover <= 12) {
    rating = 'excellent'; // 適切な範囲
  } else if (turnover >= 6 && turnover <= 15) {
    rating = 'good';
  } else if (turnover >= 4 && turnover <= 18) {
    rating = 'fair';
  } else {
    rating = 'poor'; // 極端に高いor低い
  }

  return {
    metric: 'Payables Turnover',
    value: turnover,
    unit: '回',
    formula: '仕入債務回転率 = 売上高 / 仕入債務',
    rating,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 固定資産回転率を計算
 *
 * 計算式: 固定資産回転率 = 売上高 / 固定資産
 *
 * 意味: 固定資産（設備、建物等）が1年間に何回転したかを示す指標。
 * 値が高いほど、固定資産を効率的に活用して売上を生み出している。
 *
 * 目安:
 * - 3.0回以上: 優良（excellent）
 * - 2.0回以上: 良好（good）
 * - 1.5回以上: 普通（fair）
 * - 1.5回未満: 改善が必要（poor）
 *
 * 注意: 業種によって大きく異なる（製造業は低め、サービス業は高め）
 */
export function calculateFixedAssetTurnover(data: FinancialData): MetricResult {
  if (data.fixedAssets === undefined) {
    return {
      metric: 'Fixed Asset Turnover',
      value: null,
      unit: '回',
      formula: '固定資産回転率 = 売上高 / 固定資産',
      error: '固定資産のデータが不足しています',
      calculatedAt: new Date().toISOString(),
    };
  }

  const turnover = safeDivide(data.revenue, data.fixedAssets);

  if (turnover === null) {
    return {
      metric: 'Fixed Asset Turnover',
      value: null,
      unit: '回',
      formula: '固定資産回転率 = 売上高 / 固定資産',
      error: 'ゼロ除算エラー: 固定資産が0または無効です',
      calculatedAt: new Date().toISOString(),
    };
  }

  return {
    metric: 'Fixed Asset Turnover',
    value: turnover,
    unit: '回',
    formula: '固定資産回転率 = 売上高 / 固定資産',
    rating: getRating(turnover, { excellent: 3.0, good: 2.0, fair: 1.5 }),
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * 全効率性指標を一括計算
 */
export function calculateAllEfficiencyMetrics(
  data: FinancialData
): {
  totalAssetTurnover: MetricResult;
  receivablesTurnover: MetricResult;
  inventoryTurnover: MetricResult;
  payablesTurnover: MetricResult;
  fixedAssetTurnover: MetricResult;
} {
  return {
    totalAssetTurnover: calculateTotalAssetTurnover(data),
    receivablesTurnover: calculateReceivablesTurnover(data),
    inventoryTurnover: calculateInventoryTurnover(data),
    payablesTurnover: calculatePayablesTurnover(data),
    fixedAssetTurnover: calculateFixedAssetTurnover(data),
  };
}
