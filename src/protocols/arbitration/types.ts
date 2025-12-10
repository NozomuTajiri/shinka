/**
 * 裁定プロトコル型定義
 * アバター間コンフリクト解決プロトコル
 */

export type ConflictType = 'recommendation' | 'priority' | 'resource' | 'approach' | 'scope';
export type ConflictSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ArbitrationStatus = 'detected' | 'analyzing' | 'mediation' | 'escalated' | 'resolved' | 'closed';
export type ResolutionStrategy = 'consensus' | 'compromise' | 'authority' | 'escalation' | 'withdrawal';

export interface ConflictMetadata {
  conflictId: string;
  type: ConflictType;
  severity: ConflictSeverity;
  parties: PartyInfo[];
  clientId: string;
  detectedAt: Date;
  status: ArbitrationStatus;
  resolvedAt?: Date;
  arbiter?: string;
}

export interface PartyInfo {
  avatarId: string;
  position: string;
  rationale: string[];
  supportingEvidence: string[];
  flexibility: 'rigid' | 'moderate' | 'flexible';
}

export interface ConflictCase {
  metadata: ConflictMetadata;
  description: string;
  context: string;
  impactAssessment: ImpactAssessment;
  timeline: ConflictEvent[];
  resolution?: Resolution;
}

export interface ImpactAssessment {
  clientImpact: 'none' | 'low' | 'medium' | 'high';
  urgency: 'low' | 'medium' | 'high' | 'immediate';
  affectedAreas: string[];
  potentialOutcomes: PotentialOutcome[];
}

export interface PotentialOutcome {
  scenario: string;
  probability: number; // 0-100
  impact: 'positive' | 'neutral' | 'negative';
  description: string;
}

export interface ConflictEvent {
  timestamp: Date;
  eventType: 'detected' | 'position-stated' | 'mediation-attempt' | 'escalation' | 'resolution-proposed' | 'resolved';
  actor: string;
  description: string;
  data?: Record<string, unknown>;
}

export interface Resolution {
  strategy: ResolutionStrategy;
  decision: string;
  rationale: string;
  acceptedBy: string[];
  rejectedBy: string[];
  conditions: string[];
  followUpActions: FollowUpAction[];
  lessonsLearned: string[];
}

export interface FollowUpAction {
  id: string;
  action: string;
  responsible: string;
  deadline: Date;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface ArbitrationRule {
  id: string;
  conflictType: ConflictType;
  condition: string;
  recommendedStrategy: ResolutionStrategy;
  escalationThreshold: number; // hours before escalation
  autoResolvable: boolean;
}

export interface EscalationPath {
  level: number;
  escalateTo: string;
  triggerConditions: string[];
  timeoutHours: number;
  authority: 'advisory' | 'binding';
}

export interface MediationSession {
  sessionId: string;
  conflictId: string;
  mediator: string;
  participants: string[];
  scheduledAt: Date;
  duration: number;
  agenda: string[];
  outcome?: MediationOutcome;
}

export interface MediationOutcome {
  success: boolean;
  agreements: string[];
  remainingIssues: string[];
  nextSteps: string[];
}
