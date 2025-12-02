/**
 * コンサルティング提案生成エンジン
 * Claude API を使用した提案書自動生成
 */

// メインモジュール
export { ClaudeClient, type ClaudeClientConfig } from './claude-client.js';
export {
  ProposalGenerator,
  createProposalGenerator,
  type ProposalGeneratorConfig,
} from './proposal-generator.js';

// プロンプトテンプレート
export {
  getSystemPrompt,
  buildProposalPrompt,
  getRetryPrompt,
  SECTION_PROMPTS,
} from './prompt-templates.js';

// フォーマッター
export {
  MarkdownFormatter,
  createMarkdownFormatter,
} from './formatters/markdown.js';
export {
  PDFFormatter,
  createPDFFormatter,
  type PDFFormatOptions,
} from './formatters/pdf.js';
export {
  ExcelFormatter,
  createExcelFormatter,
  type ExcelFormatOptions,
} from './formatters/excel.js';

// 型定義（re-export）
export type {
  ConsultingProposal,
  ProposalGenerationRequest,
  ProposalGenerationResult,
  StreamingEvent,
  ExecutiveSummary,
  CurrentStateAnalysis,
  Issue,
  ImprovementMeasure,
  ImplementationPlan,
  ImplementationPhase,
  ExpectedEffects,
  InvestmentPlan,
  CoreValue,
  ProposalSection,
  Priority,
  Timeframe,
  ClaudeMetadata,
  ExportFormat,
  ExportOptions,
} from '../types/proposal.js';
