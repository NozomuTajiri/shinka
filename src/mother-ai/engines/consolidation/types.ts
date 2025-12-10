/**
 * 統廃合エンジン型定義
 */

export interface AvatarMetrics {
  avatarId: string;
  avatarName: string;
  period: {
    start: Date;
    end: Date;
  };
  usage: UsageMetrics;
  effectiveness: EffectivenessMetrics;
  cost: CostMetrics;
  overallScore: number;
}

export interface UsageMetrics {
  totalSessions: number;
  uniqueUsers: number;
  averageSessionDuration: number;
  messagesPerSession: number;
  returnRate: number;
  peakUsageHours: number[];
}

export interface EffectivenessMetrics {
  taskCompletionRate: number;
  userSatisfactionScore: number;
  escalationRate: number;
  resolutionRate: number;
  qualityScore: number;
}

export interface CostMetrics {
  apiCalls: number;
  tokenUsage: number;
  computeCost: number;
  maintenanceHours: number;
  totalCost: number;
}

export interface ConsolidationCandidate {
  candidateId: string;
  type: 'merge' | 'deprecate' | 'archive';
  avatars: string[];
  reason: string;
  confidence: number;
  impact: ImpactAssessment;
  recommendation: string;
  detectedAt: Date;
}

export interface ImpactAssessment {
  affectedUsers: number;
  serviceDisruption: 'none' | 'minimal' | 'moderate' | 'significant';
  costSavings: number;
  capabilityLoss: string[];
  migrationEffort: 'low' | 'medium' | 'high';
}

export interface MergeProposal {
  proposalId: string;
  sourceAvatars: string[];
  targetAvatar: TargetAvatarSpec;
  mergeStrategy: MergeStrategy;
  timeline: MergeTimeline;
  risks: Risk[];
  status: ProposalStatus;
}

export interface TargetAvatarSpec {
  name: string;
  capabilities: string[];
  persona: string;
  knowledgeSources: string[];
}

export interface MergeStrategy {
  personaMerge: 'primary' | 'blend' | 'new';
  knowledgeMerge: 'union' | 'intersection' | 'selective';
  behaviorMerge: 'primary' | 'weighted' | 'adaptive';
  transitionPeriod: number;
}

export interface MergeTimeline {
  phases: TimelinePhase[];
  totalDuration: number;
  startDate?: Date;
  completionDate?: Date;
}

export interface TimelinePhase {
  name: string;
  duration: number;
  tasks: string[];
  dependencies: string[];
}

export interface Risk {
  id: string;
  type: 'technical' | 'business' | 'user' | 'operational';
  description: string;
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

export type ProposalStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'in-progress'
  | 'completed'
  | 'rejected'
  | 'cancelled';

export interface DeprecationPlan {
  planId: string;
  avatarId: string;
  reason: string;
  timeline: DeprecationTimeline;
  migration: MigrationPlan;
  communication: CommunicationPlan;
  status: ProposalStatus;
}

export interface DeprecationTimeline {
  announcementDate: Date;
  deprecationDate: Date;
  sunsetDate: Date;
  gracePeriod: number;
}

export interface MigrationPlan {
  targetAvatar: string;
  dataTransfer: DataTransferSpec[];
  userNotification: NotificationStrategy;
  fallbackBehavior: string;
}

export interface DataTransferSpec {
  dataType: string;
  source: string;
  destination: string;
  transformation?: string;
}

export interface NotificationStrategy {
  channels: string[];
  frequency: string;
  templates: Record<string, string>;
}

export interface CommunicationPlan {
  stakeholders: string[];
  messages: CommunicationMessage[];
  schedule: CommunicationSchedule[];
}

export interface CommunicationMessage {
  audience: string;
  subject: string;
  content: string;
  channel: string;
}

export interface CommunicationSchedule {
  date: Date;
  messageId: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface ConsolidationReport {
  reportId: string;
  period: { start: Date; end: Date };
  avatarMetrics: AvatarMetrics[];
  candidates: ConsolidationCandidate[];
  proposals: MergeProposal[];
  deprecations: DeprecationPlan[];
  summary: ReportSummary;
  generatedAt: Date;
}

export interface ReportSummary {
  totalAvatars: number;
  healthyAvatars: number;
  underperformingAvatars: number;
  consolidationOpportunities: number;
  estimatedSavings: number;
  recommendations: string[];
}
