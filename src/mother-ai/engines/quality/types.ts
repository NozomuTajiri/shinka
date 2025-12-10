/**
 * 品質監視エンジン型定義
 */

export interface QualityMetrics {
  avatarId: string;
  period: { start: Date; end: Date };
  responseQuality: ResponseQualityMetrics;
  userSatisfaction: SatisfactionMetrics;
  systemPerformance: PerformanceMetrics;
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ResponseQualityMetrics {
  accuracy: number;
  relevance: number;
  completeness: number;
  clarity: number;
  consistency: number;
  averageScore: number;
}

export interface SatisfactionMetrics {
  nps: number;
  csat: number;
  ces: number;
  feedbackCount: number;
  positiveFeedback: number;
  negativeFeedback: number;
  commonComplaints: string[];
  commonPraises: string[];
}

export interface PerformanceMetrics {
  averageResponseTime: number;
  p95ResponseTime: number;
  errorRate: number;
  uptime: number;
  throughput: number;
}

export interface QualityAlert {
  alertId: string;
  avatarId: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type: AlertType;
  message: string;
  details: Record<string, unknown>;
  threshold: number;
  actualValue: number;
  createdAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
  status: 'active' | 'acknowledged' | 'resolved' | 'expired';
}

export type AlertType =
  | 'quality_drop'
  | 'satisfaction_drop'
  | 'error_spike'
  | 'latency_increase'
  | 'escalation_increase'
  | 'usage_anomaly';

export interface AlertRule {
  ruleId: string;
  name: string;
  metric: string;
  condition: 'above' | 'below' | 'change';
  threshold: number;
  window: number;
  severity: QualityAlert['severity'];
  enabled: boolean;
  notificationChannels: string[];
}

export interface EscalationPolicy {
  policyId: string;
  name: string;
  levels: EscalationLevel[];
  autoEscalate: boolean;
  escalationWindow: number;
}

export interface EscalationLevel {
  level: number;
  name: string;
  notifyRoles: string[];
  channels: string[];
  responseTimeMinutes: number;
  actions: string[];
}

export interface ImprovementSuggestion {
  suggestionId: string;
  avatarId: string;
  category: 'response' | 'knowledge' | 'persona' | 'performance' | 'process';
  title: string;
  description: string;
  rationale: string;
  expectedImpact: number;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  status: 'proposed' | 'approved' | 'implementing' | 'completed' | 'rejected';
  evidence: SuggestionEvidence[];
  createdAt: Date;
}

export interface SuggestionEvidence {
  type: 'metric' | 'feedback' | 'pattern' | 'benchmark';
  source: string;
  data: Record<string, unknown>;
}

export interface QualityReport {
  reportId: string;
  period: { start: Date; end: Date };
  avatarMetrics: QualityMetrics[];
  alerts: QualityAlert[];
  suggestions: ImprovementSuggestion[];
  trends: QualityTrend[];
  summary: QualitySummary;
  generatedAt: Date;
}

export interface QualityTrend {
  metric: string;
  values: { date: Date; value: number }[];
  direction: 'up' | 'down' | 'stable';
  changePercent: number;
}

export interface QualitySummary {
  overallHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  topPerformers: string[];
  needsAttention: string[];
  keyInsights: string[];
  actionItems: string[];
}

export interface ResponseSample {
  sampleId: string;
  avatarId: string;
  sessionId: string;
  userMessage: string;
  avatarResponse: string;
  quality: ResponseQualityMetrics;
  userFeedback?: UserFeedback;
  sampledAt: Date;
}

export interface UserFeedback {
  rating: number;
  comment?: string;
  helpful: boolean;
  issues?: string[];
}
