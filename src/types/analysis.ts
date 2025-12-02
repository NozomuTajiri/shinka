/**
 * 財務分析結果の型定義
 *
 * このファイルは財務分析エンジンで使用される全ての型を定義します。
 */

/**
 * 分析結果の基本型
 */
export interface AnalysisResult {
  /** 指標名 */
  metric: string;
  /** 計算値 */
  value: number | null;
  /** 単位（%, 倍, 円等） */
  unit: string;
  /** 計算式の説明 */
  formula?: string;
  /** エラーメッセージ */
  error?: string;
  /** 計算日時 */
  calculatedAt: string;
}

/**
 * 指標結果（評価付き）
 */
export interface MetricResult extends AnalysisResult {
  /** 評価レベル（excellent, good, fair, poor） */
  rating?: 'excellent' | 'good' | 'fair' | 'poor';
  /** 業界平均との比較 */
  vsIndustryAvg?: number;
  /** 前年同期比 */
  yoyChange?: number;
}

/**
 * ベンチマーク結果
 */
export interface BenchmarkResult {
  /** 指標名 */
  metric: string;
  /** 自社値 */
  value: number;
  /** 業界平均 */
  industryAvg: number;
  /** 業界中央値 */
  industryMedian: number;
  /** パーセンタイル順位（0-100） */
  percentile: number;
  /** 四分位数（Q1, Q2, Q3, Q4） */
  quartile: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  /** 評価 */
  rating: 'excellent' | 'good' | 'fair' | 'poor';
}

/**
 * 異常値検出結果
 */
export interface AnomalyResult {
  /** 異常検出された指標名 */
  metric: string;
  /** 実際の値 */
  actualValue: number;
  /** 期待値（正常範囲の中央値等） */
  expectedValue: number;
  /** 偏差（標準偏差の倍数等） */
  deviation: number;
  /** 異常度（0-1, 1が最も異常） */
  severity: number;
  /** アラートレベル（info, warning, critical） */
  alertLevel: 'info' | 'warning' | 'critical';
  /** 説明 */
  description: string;
  /** 検出日時 */
  detectedAt: string;
}

/**
 * キャッシュフローパターン
 */
export type CashFlowPattern =
  | 'healthy'        // 営業+、投資-、財務-（優良企業）
  | 'growth'         // 営業+、投資-、財務+（成長企業）
  | 'restructuring'  // 営業-、投資+、財務+（リストラ中）
  | 'struggling'     // 営業-、投資-、財務+（苦境）
  | 'unknown';       // 判定不能

/**
 * キャッシュフロー分析結果
 */
export interface CashFlowAnalysis {
  /** 営業キャッシュフロー */
  operatingCF: number;
  /** 投資キャッシュフロー */
  investingCF: number;
  /** 財務キャッシュフロー */
  financingCF: number;
  /** フリーキャッシュフロー */
  freeCF: number;
  /** CFマージン（営業CF / 売上高） */
  cfMargin: number;
  /** CFパターン */
  pattern: CashFlowPattern;
  /** パターン説明 */
  patternDescription: string;
}

/**
 * 収益性指標グループ
 */
export interface ProfitabilityMetrics {
  /** ROE（自己資本利益率） */
  roe: MetricResult;
  /** ROA（総資産利益率） */
  roa: MetricResult;
  /** 営業利益率 */
  operatingMargin: MetricResult;
  /** 売上総利益率 */
  grossMargin: MetricResult;
  /** 経常利益率 */
  ordinaryMargin: MetricResult;
  /** 当期純利益率 */
  netMargin: MetricResult;
}

/**
 * 安全性指標グループ
 */
export interface SafetyMetrics {
  /** 自己資本比率 */
  equityRatio: MetricResult;
  /** 流動比率 */
  currentRatio: MetricResult;
  /** 当座比率 */
  quickRatio: MetricResult;
  /** 固定長期適合率 */
  fixedToLongTermRatio: MetricResult;
  /** 負債比率 */
  debtRatio: MetricResult;
  /** インタレストカバレッジレシオ */
  interestCoverageRatio: MetricResult;
}

/**
 * 効率性指標グループ
 */
export interface EfficiencyMetrics {
  /** 総資産回転率 */
  totalAssetTurnover: MetricResult;
  /** 売上債権回転率 */
  receivablesTurnover: MetricResult;
  /** 棚卸資産回転率 */
  inventoryTurnover: MetricResult;
  /** 仕入債務回転率 */
  payablesTurnover: MetricResult;
  /** 固定資産回転率 */
  fixedAssetTurnover: MetricResult;
}

/**
 * 成長性指標グループ
 */
export interface GrowthMetrics {
  /** 売上高成長率 */
  revenueGrowth: MetricResult;
  /** 営業利益成長率 */
  operatingIncomeGrowth: MetricResult;
  /** 経常利益成長率 */
  ordinaryIncomeGrowth: MetricResult;
  /** 総資産成長率 */
  totalAssetGrowth: MetricResult;
  /** 従業員数成長率 */
  employeeGrowth: MetricResult;
}

/**
 * 統合財務分析サマリー
 */
export interface FinancialAnalysisSummary {
  /** 企業ID */
  companyId: string;
  /** 分析対象期間 */
  period: string;
  /** 収益性指標 */
  profitability: ProfitabilityMetrics;
  /** 安全性指標 */
  safety: SafetyMetrics;
  /** 効率性指標 */
  efficiency: EfficiencyMetrics;
  /** 成長性指標 */
  growth: GrowthMetrics;
  /** キャッシュフロー分析 */
  cashFlow: CashFlowAnalysis;
  /** ベンチマーク結果 */
  benchmarks: BenchmarkResult[];
  /** 異常値検出結果 */
  anomalies: AnomalyResult[];
  /** 総合スコア（0-100） */
  overallScore: number;
  /** 総合評価 */
  overallRating: 'excellent' | 'good' | 'fair' | 'poor';
  /** 分析完了日時 */
  analyzedAt: string;
  /** 処理時間（ミリ秒） */
  processingTimeMs: number;
}

/**
 * 財務データ入力
 */
export interface FinancialData {
  /** 企業ID */
  companyId: string;
  /** 会計期間 */
  fiscalPeriod: string;

  // 損益計算書（P/L）
  /** 売上高 */
  revenue: number;
  /** 売上原価 */
  costOfRevenue?: number;
  /** 売上総利益 */
  grossProfit?: number;
  /** 営業利益 */
  operatingIncome: number;
  /** 経常利益 */
  ordinaryIncome?: number;
  /** 当期純利益 */
  netIncome: number;
  /** 支払利息 */
  interestExpense?: number;

  // 貸借対照表（B/S）
  /** 総資産 */
  totalAssets: number;
  /** 流動資産 */
  currentAssets?: number;
  /** 固定資産 */
  fixedAssets?: number;
  /** 総負債 */
  totalLiabilities: number;
  /** 流動負債 */
  currentLiabilities?: number;
  /** 固定負債 */
  longTermLiabilities?: number;
  /** 純資産（自己資本） */
  equity: number;
  /** 売上債権 */
  accountsReceivable?: number;
  /** 棚卸資産 */
  inventory?: number;
  /** 仕入債務 */
  accountsPayable?: number;

  // キャッシュフロー計算書（C/F）
  /** 営業キャッシュフロー */
  operatingCashFlow?: number;
  /** 投資キャッシュフロー */
  investingCashFlow?: number;
  /** 財務キャッシュフロー */
  financingCashFlow?: number;

  // その他
  /** 従業員数 */
  numberOfEmployees?: number;
}

/**
 * 前年度データ（成長率計算用）
 */
export interface PreviousYearData {
  /** 売上高 */
  revenue?: number;
  /** 営業利益 */
  operatingIncome?: number;
  /** 経常利益 */
  ordinaryIncome?: number;
  /** 総資産 */
  totalAssets?: number;
  /** 従業員数 */
  numberOfEmployees?: number;
}

/**
 * 業界データ（ベンチマーク用）
 */
export interface IndustryData {
  /** 業界コード */
  industryCode: string;
  /** 業界名 */
  industryName: string;
  /** 指標名 */
  metric: string;
  /** 全データポイント */
  dataPoints: number[];
  /** 平均値 */
  average: number;
  /** 中央値 */
  median: number;
  /** 第1四分位数 */
  q1: number;
  /** 第3四分位数 */
  q3: number;
  /** 最小値 */
  min: number;
  /** 最大値 */
  max: number;
}

/**
 * 分析オプション
 */
export interface AnalysisOptions {
  /** 並列処理数（デフォルト: 8） */
  parallelism?: number;
  /** メモリ使用率上限（デフォルト: 0.92） */
  memoryLimit?: number;
  /** ベンチマーク比較を実施するか */
  includeBenchmark?: boolean;
  /** 異常値検出を実施するか */
  includeAnomalyDetection?: boolean;
  /** 詳細ログを出力するか */
  verbose?: boolean;
}
