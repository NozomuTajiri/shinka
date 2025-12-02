/**
 * 財務分析エンジン - エクスポートモジュール
 *
 * このファイルは財務分析エンジンの全ての機能をエクスポートします。
 */

// 型定義
export type {
  AnalysisResult,
  MetricResult,
  BenchmarkResult,
  AnomalyResult,
  CashFlowPattern,
  CashFlowAnalysis,
  ProfitabilityMetrics,
  SafetyMetrics,
  EfficiencyMetrics,
  GrowthMetrics,
  FinancialAnalysisSummary,
  FinancialData,
  PreviousYearData,
  IndustryData,
  AnalysisOptions,
} from '../types/analysis.js';

// 収益性指標
export {
  calculateROE,
  calculateROA,
  calculateOperatingMargin,
  calculateGrossMargin,
  calculateOrdinaryMargin,
  calculateNetMargin,
  calculateAllProfitabilityMetrics,
} from './profitability.js';

// 安全性指標
export {
  calculateEquityRatio,
  calculateCurrentRatio,
  calculateQuickRatio,
  calculateFixedToLongTermRatio,
  calculateDebtRatio,
  calculateInterestCoverageRatio,
  calculateAllSafetyMetrics,
} from './safety.js';

// 効率性指標
export {
  calculateTotalAssetTurnover,
  calculateReceivablesTurnover,
  calculateInventoryTurnover,
  calculatePayablesTurnover,
  calculateFixedAssetTurnover,
  calculateAllEfficiencyMetrics,
} from './efficiency.js';

// 成長性指標
export {
  calculateRevenueGrowth,
  calculateOperatingIncomeGrowth,
  calculateOrdinaryIncomeGrowth,
  calculateTotalAssetGrowth,
  calculateEmployeeGrowth,
  calculateAllGrowthMetrics,
} from './growth.js';

// キャッシュフロー分析
export {
  analyzeCashFlow,
  evaluateCashFlowHealth,
  describeCashFlow,
} from './cashflow.js';

// ベンチマーク比較
export {
  benchmarkMetric,
  benchmarkMultipleMetrics,
  summarizeBenchmarks,
  createIndustryData,
} from './benchmark.js';

// 異常値検出
export {
  detectAnomalies,
  detectMultipleAnomalies,
  summarizeAnomalies,
} from './anomaly-detector.js';

// 統合分析エンジン
export {
  analyzeFinancialData,
  analyzeBatch,
} from './financial-analyzer.js';
