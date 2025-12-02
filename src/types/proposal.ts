/**
 * コンサルティング提案に関する型定義
 * 価値主義経営®の6つの価値を反映した提案書生成
 */

/**
 * 価値主義経営®の6つの価値
 */
export type CoreValue =
  | 'customer_value'      // 顧客価値
  | 'employee_value'      // 社員価値
  | 'business_value'      // 事業価値
  | 'organization_value'  // 組織価値
  | 'brand_value'         // ブランド価値
  | 'shareholder_value';  // 株主価値

/**
 * 提案書のセクション種別
 */
export type ProposalSection =
  | 'executive_summary'    // エグゼクティブサマリー
  | 'current_state'        // 現状分析
  | 'issues'               // 課題抽出
  | 'solutions'            // 解決策
  | 'implementation_plan'  // 実行計画
  | 'expected_effects'     // 期待効果
  | 'investment'           // 投資計画
  | 'risk_assessment';     // リスク評価

/**
 * 改善施策の優先度
 */
export type Priority = 'high' | 'medium' | 'low';

/**
 * 施策の実施期間
 */
export type Timeframe = 'short' | 'medium' | 'long';

/**
 * エグゼクティブサマリー
 */
export interface ExecutiveSummary {
  /** 経営課題の要約 */
  challengeSummary: string;
  /** 提案の概要 */
  proposalOverview: string;
  /** 期待される主要な成果（3-5項目） */
  keyOutcomes: string[];
  /** 投資概算 */
  estimatedInvestment: string;
  /** 期待ROI */
  expectedROI: string;
}

/**
 * 現状分析
 */
export interface CurrentStateAnalysis {
  /** 業界動向 */
  industryTrends: string;
  /** 企業の現状 */
  companyStatus: string;
  /** 強み */
  strengths: string[];
  /** 弱み */
  weaknesses: string[];
  /** 機会 */
  opportunities: string[];
  /** 脅威 */
  threats: string[];
}

/**
 * 課題
 */
export interface Issue {
  /** 課題ID */
  id: string;
  /** 課題タイトル */
  title: string;
  /** 課題の詳細説明 */
  description: string;
  /** 影響を受ける価値領域 */
  affectedValues: CoreValue[];
  /** 優先度 */
  priority: Priority;
  /** ビジネスインパクト */
  businessImpact: string;
}

/**
 * 改善施策
 */
export interface ImprovementMeasure {
  /** 施策ID */
  id: string;
  /** 施策名 */
  title: string;
  /** 施策の詳細説明 */
  description: string;
  /** 対象となる課題ID */
  targetIssueIds: string[];
  /** 関連する価値領域 */
  relatedValues: CoreValue[];
  /** 優先度 */
  priority: Priority;
  /** 実施期間 */
  timeframe: Timeframe;
  /** 期待効果 */
  expectedEffects: string[];
  /** 必要なリソース */
  requiredResources: string[];
  /** 成功指標（KPI） */
  successMetrics: string[];
}

/**
 * 実行計画のフェーズ
 */
export interface ImplementationPhase {
  /** フェーズ番号 */
  phase: number;
  /** フェーズ名 */
  name: string;
  /** 期間（例: "1-3ヶ月目"） */
  duration: string;
  /** 主要な活動 */
  activities: string[];
  /** マイルストーン */
  milestones: string[];
  /** 成果物 */
  deliverables: string[];
}

/**
 * 実行計画
 */
export interface ImplementationPlan {
  /** 全体スケジュール */
  overallTimeline: string;
  /** 実行フェーズ */
  phases: ImplementationPhase[];
  /** 体制図 */
  organizationStructure: string;
  /** リスクと対策 */
  risksAndMitigations: Array<{
    risk: string;
    mitigation: string;
  }>;
}

/**
 * 期待効果
 */
export interface ExpectedEffects {
  /** 短期的効果（6ヶ月以内） */
  shortTerm: string[];
  /** 中期的効果（1年以内） */
  mediumTerm: string[];
  /** 長期的効果（1年以上） */
  longTerm: string[];
  /** 定量的効果 */
  quantitativeEffects: Array<{
    metric: string;
    current: string;
    target: string;
    improvement: string;
  }>;
}

/**
 * 投資計画
 */
export interface InvestmentPlan {
  /** 初期投資 */
  initialInvestment: {
    description: string;
    amount: string;
    breakdown: Array<{
      item: string;
      cost: string;
    }>;
  };
  /** 運用コスト（年間） */
  operationalCost: {
    description: string;
    amount: string;
    breakdown: Array<{
      item: string;
      cost: string;
    }>;
  };
  /** ROI試算 */
  roiProjection: {
    year1: string;
    year2: string;
    year3: string;
  };
}

/**
 * コンサルティング提案書
 */
export interface ConsultingProposal {
  /** 提案書ID */
  id: string;
  /** 提案書タイトル */
  title: string;
  /** クライアント名 */
  clientName: string;
  /** 作成日 */
  createdAt: Date;
  /** 提案者情報 */
  consultant: {
    name: string;
    title: string;
    organization: string;
  };
  /** エグゼクティブサマリー */
  executiveSummary: ExecutiveSummary;
  /** 現状分析 */
  currentState: CurrentStateAnalysis;
  /** 課題一覧 */
  issues: Issue[];
  /** 改善施策 */
  measures: ImprovementMeasure[];
  /** 実行計画 */
  implementationPlan: ImplementationPlan;
  /** 期待効果 */
  expectedEffects: ExpectedEffects;
  /** 投資計画 */
  investmentPlan: InvestmentPlan;
  /** 付録・補足資料 */
  appendix?: string;
}

/**
 * 提案生成リクエスト
 */
export interface ProposalGenerationRequest {
  /** クライアント名 */
  clientName: string;
  /** 業界 */
  industry: string;
  /** 企業規模 */
  companySize: string;
  /** 主要な経営課題（自由記述） */
  mainChallenges: string;
  /** 追加情報・コンテキスト */
  additionalContext?: string;
  /** 重点を置く価値領域 */
  focusValues?: CoreValue[];
}

/**
 * ストリーミング生成イベント
 */
export interface StreamingEvent {
  /** イベントタイプ */
  type: 'start' | 'progress' | 'section_complete' | 'complete' | 'error';
  /** セクション（progress/section_completeの場合） */
  section?: ProposalSection;
  /** 生成されたコンテンツ（progressの場合） */
  content?: string;
  /** 完成した提案書（completeの場合） */
  proposal?: ConsultingProposal;
  /** エラーメッセージ（errorの場合） */
  error?: string;
  /** 進捗率（0-100） */
  progress?: number;
  /** タイムスタンプ */
  timestamp: Date;
}

/**
 * Claude APIレスポンスのメタデータ
 */
export interface ClaudeMetadata {
  /** 使用したモデル */
  model: string;
  /** 入力トークン数 */
  inputTokens: number;
  /** 出力トークン数 */
  outputTokens: number;
  /** APIリクエスト時刻 */
  requestTime: Date;
  /** APIレスポンス時刻 */
  responseTime: Date;
  /** レスポンス時間（ミリ秒） */
  durationMs: number;
}

/**
 * 提案生成結果
 */
export interface ProposalGenerationResult {
  /** 提案書 */
  proposal: ConsultingProposal;
  /** メタデータ */
  metadata: ClaudeMetadata;
  /** 生成ログ */
  logs?: string[];
}

/**
 * フォーマットオプション
 */
export type ExportFormat = 'markdown' | 'pdf' | 'excel';

/**
 * エクスポートオプション
 */
export interface ExportOptions {
  /** フォーマット */
  format: ExportFormat;
  /** 出力ファイルパス */
  outputPath: string;
  /** PDFオプション（formatが'pdf'の場合） */
  pdfOptions?: {
    /** ページサイズ */
    pageSize?: 'A4' | 'Letter';
    /** マージン */
    margin?: number;
    /** フォント */
    font?: string;
  };
  /** Excelオプション（formatが'excel'の場合） */
  excelOptions?: {
    /** シート名 */
    sheetNames?: {
      summary?: string;
      analysis?: string;
      measures?: string;
      implementation?: string;
    };
  };
}
