/**
 * アバター検証・ワークフロー型定義
 */

export type WorkflowPhase = 'requirements' | 'design' | 'build' | 'validation' | 'trial' | 'adoption';
export type PhaseStatus = 'pending' | 'in-progress' | 'completed' | 'failed' | 'skipped';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'revision-requested';
export type ValidationSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface WorkflowMetadata {
  workflowId: string;
  avatarTemplateId: string;
  initiatedBy: string;
  initiatedAt: Date;
  currentPhase: WorkflowPhase;
  status: 'active' | 'completed' | 'cancelled' | 'on-hold';
}

export interface AvatarWorkflow {
  metadata: WorkflowMetadata;
  phases: PhaseRecord[];
  approvals: ApprovalRecord[];
  validations: ValidationRecord[];
  trial?: TrialPeriod;
  finalStatus?: FinalStatus;
}

export interface PhaseRecord {
  phase: WorkflowPhase;
  status: PhaseStatus;
  startedAt?: Date;
  completedAt?: Date;
  owner: string;
  deliverables: Deliverable[];
  notes: string[];
}

export interface Deliverable {
  id: string;
  name: string;
  type: 'document' | 'config' | 'code' | 'test-result';
  status: 'draft' | 'review' | 'approved';
  url?: string;
}

export interface ApprovalRecord {
  id: string;
  phase: WorkflowPhase;
  gateType: 'phase-exit' | 'quality-check' | 'stakeholder';
  requiredApprovers: string[];
  approvals: ApprovalDecision[];
  status: ApprovalStatus;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface ApprovalDecision {
  approver: string;
  decision: 'approved' | 'rejected' | 'revision-requested';
  comments: string;
  timestamp: Date;
}

export interface ValidationRecord {
  id: string;
  phase: WorkflowPhase;
  type: 'schema' | 'capability' | 'quality' | 'security' | 'integration';
  status: 'passed' | 'failed' | 'warning';
  results: ValidationResult[];
  executedAt: Date;
  executedBy: string;
}

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  passed: boolean;
  severity: ValidationSeverity;
  message: string;
  details?: Record<string, unknown>;
  suggestion?: string;
}

export interface TrialPeriod {
  startDate: Date;
  endDate: Date;
  status: 'active' | 'completed' | 'terminated';
  metrics: TrialMetrics;
  feedback: TrialFeedback[];
  checkpoints: TrialCheckpoint[];
}

export interface TrialMetrics {
  sessionsCount: number;
  avgResponseTime: number;
  satisfactionScore: number;
  successRate: number;
  errorRate: number;
  escalationRate: number;
}

export interface TrialFeedback {
  id: string;
  source: 'client' | 'user' | 'system' | 'reviewer';
  rating: number;
  comments: string;
  timestamp: Date;
  category: string;
}

export interface TrialCheckpoint {
  day: number;
  date: Date;
  metricsSnapshot: TrialMetrics;
  status: 'on-track' | 'at-risk' | 'failing';
  notes: string[];
}

export interface FinalStatus {
  decision: 'adopted' | 'rejected' | 'conditional';
  decidedBy: string;
  decidedAt: Date;
  conditions?: string[];
  reviewSchedule?: Date;
}

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  type: ValidationRecord['type'];
  severity: ValidationSeverity;
  phase: WorkflowPhase[];
  check: (template: unknown) => boolean;
  message: string;
}

export interface WorkflowConfig {
  trialDays: number;
  requiredApprovers: Record<WorkflowPhase, string[]>;
  autoAdvance: boolean;
  qualityThresholds: {
    minSatisfaction: number;
    maxErrorRate: number;
    minSuccessRate: number;
  };
}
