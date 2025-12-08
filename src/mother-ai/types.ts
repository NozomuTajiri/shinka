/**
 * マザーAI「ORIGIN」型定義
 * システム全体を統括する頭脳の型定義
 */

/**
 * アバター情報
 */
export interface Avatar {
  id: string;
  name: string;
  competencies: string[];
  persona: AvatarPersona;
  status: 'active' | 'trial' | 'deprecated' | 'merged';
  createdAt: Date;
  trialEndsAt?: Date;
  metrics: AvatarMetrics;
}

/**
 * アバターペルソナ
 */
export interface AvatarPersona {
  role: string;
  expertise: string[];
  communicationStyle: string;
  decisionMakingStyle: string;
  background: string;
}

/**
 * アバターメトリクス
 */
export interface AvatarMetrics {
  totalSessions: number;
  lastSessionAt?: Date;
  averageSatisfaction: number;
  taskCompletionRate: number;
  responseTimeMs: number;
  errorRate: number;
}

/**
 * アバター構築リクエスト
 */
export interface AvatarBuildRequest {
  requiredCompetencies: string[];
  businessContext: string;
  expectedROI?: number;
  priority: 'high' | 'medium' | 'low';
}

/**
 * アバター構築結果
 */
export interface AvatarBuildResult {
  decision: 'create' | 'use_existing' | 'reject';
  reason: string;
  avatar?: Avatar;
  existingAvatarId?: string;
  roiEstimate?: ROIEstimate;
}

/**
 * ROI試算
 */
export interface ROIEstimate {
  estimatedMonthlySessions: number;
  costPerSession: number;
  valuePerSession: number;
  monthlyROI: number;
  breakEvenMonths: number;
}

/**
 * アバター統合候補
 */
export interface MergeCandidate {
  avatarIds: string[];
  similarityScore: number;
  reason: string;
  recommendedAction: 'merge' | 'keep_separate';
}

/**
 * アバター統合結果
 */
export interface MergeResult {
  mergedAvatarId: string;
  sourceAvatarIds: string[];
  newCompetencies: string[];
  migratedSessions: number;
  completedAt: Date;
}

/**
 * 横断インサイト
 */
export interface CrossInsight {
  id: string;
  title: string;
  category: 'pattern' | 'trend' | 'best_practice' | 'warning';
  description: string;
  evidence: InsightEvidence[];
  recommendation: string;
  applicableAvatars: string[];
  confidenceScore: number;
  createdAt: Date;
}

/**
 * インサイト根拠
 */
export interface InsightEvidence {
  pattern: string;
  occurrences: number;
  successRate: number;
  anonymizedExamples: AnonymizedExample[];
}

/**
 * 匿名化事例
 */
export interface AnonymizedExample {
  industry: string;
  companySize: 'small' | 'medium' | 'large';
  challenge: string;
  solution: string;
  outcome: string;
  metrics?: Record<string, number>;
}

/**
 * 品質アラート
 */
export interface QualityAlert {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'dialogue' | 'outcome' | 'system';
  avatarId: string;
  message: string;
  metrics: Record<string, number>;
  recommendedAction: string;
  createdAt: Date;
  resolvedAt?: Date;
}

/**
 * 品質メトリクス
 */
export interface QualityMetrics {
  dialogue: DialogueQuality;
  outcome: OutcomeQuality;
  system: SystemQuality;
}

/**
 * 対話品質
 */
export interface DialogueQuality {
  personaConsistency: number; // 0-1
  knowledgeUtilization: number; // 0-1
  responseRelevance: number; // 0-1
}

/**
 * 成果品質
 */
export interface OutcomeQuality {
  satisfaction: number; // 1-5
  problemSolutionRate: number; // 0-1
  actionItemCompletionRate: number; // 0-1
}

/**
 * システム品質
 */
export interface SystemQuality {
  averageResponseTimeMs: number;
  errorRate: number; // 0-1
  availability: number; // 0-1
}

/**
 * 運用サイクル
 */
export type OperationCycle = 'daily' | 'weekly' | 'monthly' | 'quarterly';

/**
 * 運用サイクル設定
 */
export interface CycleConfig {
  enabled: boolean;
  schedule: string; // cron形式
  tasks: string[];
}

/**
 * マザーAI設定
 */
export interface MotherAIConfig {
  avatarBuilder: {
    similarityThreshold: number; // デフォルト: 0.7
    trialPeriodDays: number; // デフォルト: 30
    minROI: number; // デフォルト: 1.5
  };
  avatarMerger: {
    inactivityDays: number; // デフォルト: 30
    minSatisfaction: number; // デフォルト: 3.0
    mergeThreshold: number; // デフォルト: 0.7
  };
  insightEngine: {
    minOccurrences: number; // デフォルト: 3
    minSuccessRate: number; // デフォルト: 0.7
    confidenceThreshold: number; // デフォルト: 0.8
  };
  qualityMonitor: {
    criticalThresholds: QualityThresholds;
    warningThresholds: QualityThresholds;
  };
  cycles: Record<OperationCycle, CycleConfig>;
}

/**
 * 品質閾値
 */
export interface QualityThresholds {
  satisfaction: number;
  errorRate: number;
  responseTimeMs: number;
  personaConsistency: number;
}

/**
 * マザーAIイベント
 */
export type MotherAIEvent =
  | { type: 'avatar_created'; avatar: Avatar }
  | { type: 'avatar_merged'; result: MergeResult }
  | { type: 'avatar_deprecated'; avatarId: string; reason: string }
  | { type: 'insight_generated'; insight: CrossInsight }
  | { type: 'quality_alert'; alert: QualityAlert }
  | { type: 'cycle_completed'; cycle: OperationCycle; timestamp: Date };

/**
 * イベントハンドラー
 */
export type EventHandler = (event: MotherAIEvent) => void | Promise<void>;
