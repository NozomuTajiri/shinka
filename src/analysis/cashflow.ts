/**
 * キャッシュフロー分析モジュール
 *
 * 企業のキャッシュフロー状況を評価します。
 * - 営業キャッシュフロー
 * - 投資キャッシュフロー
 * - 財務キャッシュフロー
 * - フリーキャッシュフロー
 * - CFマージン
 * - CFパターン判定
 */

import type { FinancialData, CashFlowAnalysis, CashFlowPattern } from '../types/analysis.js';

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
 * キャッシュフローパターンを判定
 *
 * 営業・投資・財務の3つのCFの符号から企業の状況を判定します。
 *
 * パターン分類:
 * 1. healthy（優良企業型）: 営業+、投資-、財務-
 *    → 本業で稼ぎ、設備投資し、借金を返済している
 *
 * 2. growth（成長企業型）: 営業+、投資-、財務+
 *    → 本業で稼ぎ、設備投資し、さらに資金調達して拡大している
 *
 * 3. restructuring（リストラ型）: 営業-、投資+、財務+
 *    → 本業が赤字、資産売却、資金調達で延命している
 *
 * 4. struggling（苦境型）: 営業-、投資-、財務+
 *    → 本業が赤字、投資も控え、資金調達で凌いでいる
 *
 * 5. unknown（判定不能）: 上記以外
 */
function determineCashFlowPattern(
  operatingCF: number,
  investingCF: number,
  financingCF: number
): { pattern: CashFlowPattern; description: string } {
  const opPositive = operatingCF > 0;
  const invNegative = investingCF < 0;
  const finNegative = financingCF < 0;

  // Healthy: 営業+、投資-、財務-
  if (opPositive && invNegative && finNegative) {
    return {
      pattern: 'healthy',
      description:
        '優良企業型: 本業で利益を生み、設備投資を行い、借入金を返済している理想的な状態です。',
    };
  }

  // Growth: 営業+、投資-、財務+
  if (opPositive && invNegative && !finNegative) {
    return {
      pattern: 'growth',
      description:
        '成長企業型: 本業で利益を生み、積極的に設備投資を行い、さらに資金調達して事業拡大を図っています。',
    };
  }

  // Restructuring: 営業-、投資+、財務+
  if (!opPositive && !invNegative && !finNegative) {
    return {
      pattern: 'restructuring',
      description:
        'リストラ型: 本業が赤字で、資産売却と資金調達により延命を図っている状態です。要注意。',
    };
  }

  // Struggling: 営業-、投資-、財務+
  if (!opPositive && invNegative && !finNegative) {
    return {
      pattern: 'struggling',
      description:
        '苦境型: 本業が赤字で、投資も控え、資金調達で凌いでいる厳しい状態です。要警戒。',
    };
  }

  // その他のパターン
  return {
    pattern: 'unknown',
    description: 'キャッシュフローパターンが標準的な分類に該当しません。詳細な分析が必要です。',
  };
}

/**
 * キャッシュフロー分析を実行
 *
 * 財務データからキャッシュフロー関連の全指標を計算します。
 *
 * @param data - 財務データ
 * @returns キャッシュフロー分析結果
 */
export function analyzeCashFlow(data: FinancialData): CashFlowAnalysis {
  // CFデータが不足している場合のデフォルト値
  const operatingCF = data.operatingCashFlow ?? 0;
  const investingCF = data.investingCashFlow ?? 0;
  const financingCF = data.financingCashFlow ?? 0;

  /**
   * フリーキャッシュフロー (FCF) を計算
   *
   * 計算式: FCF = 営業CF - 投資CF
   *
   * 意味: 企業が自由に使える現金の量を示す。
   * FCFがプラスであれば、本業で稼いだ現金が投資を上回っており、
   * 配当や借入金返済に充てられる余裕がある。
   */
  const freeCF = operatingCF - Math.abs(investingCF);

  /**
   * CFマージンを計算
   *
   * 計算式: CFマージン = 営業CF / 売上高 × 100
   *
   * 意味: 売上高に対する営業CFの割合を示す。
   * CFマージンが高いほど、売上が効率的に現金に変換されている。
   *
   * 目安:
   * - 15%以上: 優良
   * - 10%以上: 良好
   * - 5%以上: 普通
   * - 5%未満: 改善が必要
   */
  const cfMarginRatio = safeDivide(operatingCF, data.revenue);
  const cfMargin = cfMarginRatio !== null ? cfMarginRatio * 100 : 0;

  // CFパターンを判定
  const { pattern, description } = determineCashFlowPattern(
    operatingCF,
    investingCF,
    financingCF
  );

  return {
    operatingCF,
    investingCF,
    financingCF,
    freeCF,
    cfMargin,
    pattern,
    patternDescription: description,
  };
}

/**
 * キャッシュフロー健全性を評価
 *
 * キャッシュフロー分析結果から企業の健全性を0-100点で評価します。
 *
 * 評価基準:
 * - 営業CFがプラス: +30点
 * - フリーCFがプラス: +30点
 * - CFマージンが高い: 最大+20点
 * - CFパターンが健全: 最大+20点
 */
export function evaluateCashFlowHealth(analysis: CashFlowAnalysis): number {
  let score = 0;

  // 営業CFがプラスなら30点
  if (analysis.operatingCF > 0) {
    score += 30;
  }

  // フリーCFがプラスなら30点
  if (analysis.freeCF > 0) {
    score += 30;
  }

  // CFマージンによる評価（最大20点）
  if (analysis.cfMargin >= 15) {
    score += 20;
  } else if (analysis.cfMargin >= 10) {
    score += 15;
  } else if (analysis.cfMargin >= 5) {
    score += 10;
  } else if (analysis.cfMargin >= 0) {
    score += 5;
  }

  // CFパターンによる評価（最大20点）
  switch (analysis.pattern) {
    case 'healthy':
      score += 20;
      break;
    case 'growth':
      score += 15;
      break;
    case 'unknown':
      score += 10;
      break;
    case 'restructuring':
      score += 5;
      break;
    case 'struggling':
      score += 0;
      break;
  }

  return Math.min(score, 100);
}

/**
 * キャッシュフロー指標の文字列説明を生成
 */
export function describeCashFlow(analysis: CashFlowAnalysis): string {
  const lines: string[] = [];

  lines.push(`キャッシュフロー分析結果:`);
  lines.push(`- 営業CF: ${analysis.operatingCF.toLocaleString()}円`);
  lines.push(`- 投資CF: ${analysis.investingCF.toLocaleString()}円`);
  lines.push(`- 財務CF: ${analysis.financingCF.toLocaleString()}円`);
  lines.push(`- フリーCF: ${analysis.freeCF.toLocaleString()}円`);
  lines.push(`- CFマージン: ${analysis.cfMargin.toFixed(2)}%`);
  lines.push(`- パターン: ${analysis.pattern}`);
  lines.push(`  ${analysis.patternDescription}`);

  const healthScore = evaluateCashFlowHealth(analysis);
  lines.push(`- 健全性スコア: ${healthScore}点/100点`);

  return lines.join('\n');
}
