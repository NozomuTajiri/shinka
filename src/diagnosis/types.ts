/**
 * 診断システム型定義
 *
 * 初回面談における診断質問フロー、スコアリング、レポート生成に関する型定義
 */

/**
 * 診断フェーズ
 */
export type DiagnosisPhase =
  | 'initial'      // 現状把握
  | 'deep-dive'    // 課題深掘り
  | 'priority'     // 優先度確認
  | 'summary';     // まとめ

/**
 * 質問タイプ
 */
export type QuestionType =
  | 'single-choice'    // 単一選択
  | 'multiple-choice'  // 複数選択
  | 'scale'            // スケール（1-5等）
  | 'text';            // 自由記述

/**
 * 課題軸（付加価値経営®に基づく）
 */
export type IssueAxis =
  | 'management'    // 経営課題（ビジョン・戦略）
  | 'sales'         // 営業課題（商談・受注）
  | 'organization'  // 組織課題（人材・チーム）
  | 'marketing';    // マーケティング課題（認知・集客）

/**
 * 付加価値経営®の6つの価値
 */
export type ValueDimension =
  | 'vision'        // ビジョン共有
  | 'strategy'      // 戦略明確性
  | 'execution'     // 実行力
  | 'talent'        // 人材育成
  | 'innovation'    // イノベーション
  | 'customer';     // 顧客価値

/**
 * 質問選択肢
 */
export interface QuestionOption {
  /** 選択肢ID */
  id: string;
  /** 表示テキスト */
  label: string;
  /** スコアリング重み付け */
  weight: Partial<Record<IssueAxis, number>>;
  /** 次の質問への分岐条件 */
  nextQuestion?: string | null;
  /** スキップ条件 */
  skipCondition?: SkipCondition;
}

/**
 * スキップ条件
 */
export interface SkipCondition {
  /** 条件タイプ */
  type: 'answer-equals' | 'score-threshold' | 'phase-complete';
  /** 参照する質問ID（answer-equalsの場合） */
  questionId?: string;
  /** 期待値 */
  value?: string | number;
  /** スコア閾値（score-thresholdの場合） */
  threshold?: number;
  /** 対象軸（score-thresholdの場合） */
  axis?: IssueAxis;
}

/**
 * 診断質問
 */
export interface DiagnosisQuestion {
  /** 質問ID */
  id: string;
  /** フェーズ */
  phase: DiagnosisPhase;
  /** 質問タイプ */
  type: QuestionType;
  /** 質問文 */
  question: string;
  /** 説明文（オプション） */
  description?: string;
  /** 選択肢（single-choice, multiple-choiceの場合） */
  options?: QuestionOption[];
  /** スケール範囲（scaleの場合） */
  scaleRange?: {
    min: number;
    max: number;
    minLabel: string;
    maxLabel: string;
  };
  /** 関連する課題軸 */
  relatedAxes: IssueAxis[];
  /** 必須フラグ */
  required: boolean;
  /** スキップ条件 */
  skipCondition?: SkipCondition;
  /** 次の質問ID（デフォルト） */
  defaultNextQuestion?: string | null;
}

/**
 * 回答データ
 */
export interface Answer {
  /** 質問ID */
  questionId: string;
  /** 回答値（選択肢ID、スケール値、テキスト） */
  value: string | number | string[];
  /** 回答日時 */
  timestamp: string;
  /** スキップフラグ */
  skipped?: boolean;
}

/**
 * 診断セッション
 */
export interface DiagnosisSession {
  /** セッションID */
  sessionId: string;
  /** 開始日時 */
  startedAt: string;
  /** 終了日時 */
  completedAt?: string;
  /** 現在のフェーズ */
  currentPhase: DiagnosisPhase;
  /** 現在の質問ID */
  currentQuestionId: string | null;
  /** 回答履歴 */
  answers: Answer[];
  /** 進捗率（0-100） */
  progress: number;
  /** メタデータ */
  metadata?: {
    companyName?: string;
    industry?: string;
    employeeCount?: string;
    respondentName?: string;
    respondentRole?: string;
  };
}

/**
 * 軸別スコア
 */
export interface AxisScore {
  /** 課題軸 */
  axis: IssueAxis;
  /** スコア（0-100） */
  score: number;
  /** 重要度レベル */
  level: 'low' | 'medium' | 'high' | 'critical';
  /** 主要な課題 */
  keyIssues: string[];
}

/**
 * 総合スコア
 */
export interface TotalScore {
  /** 軸別スコア */
  axisScores: AxisScore[];
  /** 総合スコア（加重平均） */
  overall: number;
  /** 最優先課題軸 */
  topPriorityAxis: IssueAxis;
  /** 付加価値経営®6つの価値の評価 */
  valueDimensions: Record<ValueDimension, number>;
}

/**
 * 推奨アバター
 */
export interface RecommendedAvatar {
  /** アバター名 */
  name: string;
  /** アバタータイプ */
  type: 'sales' | 'marketing' | 'hr' | 'strategy' | 'consultant';
  /** 適合度スコア（0-100） */
  matchScore: number;
  /** 期待効果 */
  expectedBenefits: string[];
  /** 想定ROI（月間） */
  estimatedROI?: {
    timeSaved: string;        // 削減時間
    costReduction: string;     // コスト削減
    revenueIncrease: string;   // 売上増加見込み
  };
}

/**
 * 診断レポート
 */
export interface DiagnosisReport {
  /** セッションID */
  sessionId: string;
  /** 生成日時 */
  generatedAt: string;
  /** 総合スコア */
  totalScore: TotalScore;
  /** 推奨アバター（上位3つ） */
  recommendedAvatars: RecommendedAvatar[];
  /** エグゼクティブサマリ */
  executiveSummary: string;
  /** 詳細分析 */
  detailedAnalysis: {
    currentSituation: string;    // 現状分析
    keyFindings: string[];       // 主要な発見
    recommendations: string[];   // 推奨施策
    nextSteps: string[];         // 次のステップ
  };
  /** メタデータ */
  metadata: DiagnosisSession['metadata'];
}

/**
 * レポート出力形式
 */
export type ReportFormat = 'markdown' | 'pdf' | 'json';

/**
 * シナリオ定義
 */
export interface DiagnosisScenario {
  /** シナリオID */
  id: string;
  /** シナリオ名 */
  name: string;
  /** バージョン */
  version: string;
  /** 質問リスト */
  questions: DiagnosisQuestion[];
  /** フェーズ定義 */
  phases: {
    phase: DiagnosisPhase;
    name: string;
    description: string;
    questionIds: string[];
  }[];
  /** スコアリング設定 */
  scoringConfig: {
    /** 軸別重み付け */
    axisWeights: Record<IssueAxis, number>;
    /** 価値次元マッピング */
    valueDimensionMapping: Record<IssueAxis, ValueDimension[]>;
  };
}

/**
 * エンジン設定
 */
export interface EngineConfig {
  /** シナリオ定義 */
  scenario: DiagnosisScenario;
  /** Claude API設定 */
  claudeConfig?: {
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  /** レポート生成設定 */
  reportConfig?: {
    includeDetailedAnalysis: boolean;
    includeExecutiveSummary: boolean;
    language: 'ja' | 'en';
  };
}
