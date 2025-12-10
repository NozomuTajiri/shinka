/**
 * レポートプロトコル型定義
 * アバター間の報告・アラート・成果記録プロトコル
 */

export type ReportType = 'weekly' | 'alert' | 'achievement' | 'status';
export type AlertSeverity = 'info' | 'warning' | 'critical';
export type ReportStatus = 'draft' | 'submitted' | 'acknowledged' | 'archived';

export interface ReportMetadata {
  reportId: string;
  type: ReportType;
  fromAvatarId: string;
  toAvatarIds: string[];
  clientId: string;
  createdAt: Date;
  submittedAt?: Date;
  acknowledgedAt?: Date;
  status: ReportStatus;
}

export interface WeeklyReport {
  metadata: ReportMetadata;
  period: { startDate: Date; endDate: Date };
  summary: string;
  activities: ActivityRecord[];
  metrics: ReportMetrics;
  insights: string[];
  nextWeekPlan: string[];
  blockers: BlockerItem[];
}

export interface ActivityRecord {
  id: string;
  date: Date;
  type: 'session' | 'analysis' | 'recommendation' | 'followup';
  description: string;
  outcome: string;
  duration: number; // minutes
}

export interface ReportMetrics {
  sessionsCount: number;
  avgSessionDuration: number;
  clientSatisfaction?: number;
  recommendationsGiven: number;
  recommendationsImplemented: number;
  progressScore: number;
}

export interface BlockerItem {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  requestedSupport?: string;
  resolvedAt?: Date;
}

export interface AlertReport {
  metadata: ReportMetadata;
  severity: AlertSeverity;
  title: string;
  description: string;
  affectedAreas: string[];
  immediateActions: string[];
  recommendedResponse: string;
  deadline?: Date;
}

export interface AchievementReport {
  metadata: ReportMetadata;
  achievementType: 'milestone' | 'goal' | 'breakthrough' | 'improvement';
  title: string;
  description: string;
  metrics: { name: string; before: number; after: number }[];
  contributingFactors: string[];
  lessonsLearned: string[];
  replicability: 'high' | 'medium' | 'low';
}

export interface StatusReport {
  metadata: ReportMetadata;
  currentPhase: string;
  progress: number; // 0-100
  health: 'healthy' | 'at-risk' | 'critical';
  highlights: string[];
  concerns: string[];
  nextMilestone: { name: string; targetDate: Date };
}

export interface ReportTemplate {
  id: string;
  type: ReportType;
  name: string;
  sections: TemplateSection[];
  requiredFields: string[];
  optionalFields: string[];
}

export interface TemplateSection {
  id: string;
  name: string;
  description: string;
  fieldType: 'text' | 'number' | 'date' | 'list' | 'metrics';
  required: boolean;
}

export interface ReportSubscription {
  subscriberId: string;
  reportTypes: ReportType[];
  filters: {
    avatarIds?: string[];
    clientIds?: string[];
    severities?: AlertSeverity[];
  };
  deliveryPreference: 'immediate' | 'daily-digest' | 'weekly-digest';
}
