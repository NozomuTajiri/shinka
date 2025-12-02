/**
 * パーサーモジュール エクスポート
 *
 * 決算書パーサーのメインエクスポートファイル
 */

// 統合パーサー（推奨インターフェース）
export {
  parseStatement,
  parseStatements,
  detectFileFormat,
  getFileSize,
  exportToJson,
  getStatistics,
  validateResult,
  type SupportedFormat,
} from './statement-parser.js';

// 個別パーサー（高度な使用）
export { parsePdf } from './pdf-parser.js';
export { parseExcel } from './excel-parser.js';
export { parseCsv } from './csv-parser.js';

// 正規化ユーティリティ
export {
  parseAmount,
  toYen,
  normalizeAccountName,
  normalizeAccountItems,
  validateAmount,
  cleanText,
  parseDate,
  getIndustryName,
} from './normalizer.js';

// 型定義（re-export）
export type {
  ParserOptions,
  ParserResult,
  ParsedStatement,
  AccountItem,
  Amount,
  BalanceSheet,
  IncomeStatement,
  CashFlowStatement,
  FiscalPeriod,
  CompanyInfo,
} from '../types/financial.js';
