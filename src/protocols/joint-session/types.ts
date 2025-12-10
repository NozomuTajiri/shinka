/**
 * 合同セッションプロトコル型定義
 * 複数アバター協働セッション管理
 */

export type SessionType = 'strategy' | 'problem-solving' | 'planning' | 'review' | 'crisis';
export type SessionStatus = 'scheduled' | 'in-progress' | 'paused' | 'completed' | 'cancelled';
export type ParticipantRole = 'lead' | 'contributor' | 'observer' | 'facilitator';

export interface SessionMetadata {
  sessionId: string;
  type: SessionType;
  clientId: string;
  title: string;
  description: string;
  scheduledAt: Date;
  startedAt?: Date;
  endedAt?: Date;
  status: SessionStatus;
  facilitator: string;
}

export interface JointSession {
  metadata: SessionMetadata;
  participants: Participant[];
  agenda: AgendaItem[];
  objectives: string[];
  groundRules: string[];
  currentAgendaIndex: number;
  turns: Turn[];
  decisions: Decision[];
  actionItems: ActionItem[];
  summary?: SessionSummary;
}

export interface Participant {
  avatarId: string;
  role: ParticipantRole;
  expertise: string[];
  joinedAt?: Date;
  leftAt?: Date;
  contributionCount: number;
  active: boolean;
}

export interface AgendaItem {
  id: string;
  order: number;
  topic: string;
  duration: number; // minutes
  lead: string;
  expectedOutcome: string;
  status: 'pending' | 'in-progress' | 'completed' | 'skipped';
  actualDuration?: number;
  notes: string[];
}

export interface Turn {
  id: string;
  timestamp: Date;
  speakerId: string;
  type: 'statement' | 'question' | 'answer' | 'proposal' | 'objection' | 'agreement';
  content: string;
  referencedTurnId?: string;
  reactions: Reaction[];
}

export interface Reaction {
  avatarId: string;
  type: 'agree' | 'disagree' | 'question' | 'neutral';
  timestamp: Date;
}

export interface Decision {
  id: string;
  topic: string;
  decision: string;
  rationale: string;
  madeBy: string[];
  abstained: string[];
  opposed: string[];
  timestamp: Date;
  status: 'tentative' | 'confirmed' | 'revised';
}

export interface ActionItem {
  id: string;
  action: string;
  assignee: string;
  deadline: Date;
  priority: 'high' | 'medium' | 'low';
  status: 'assigned' | 'in-progress' | 'completed' | 'blocked';
  relatedDecisionId?: string;
  notes: string[];
}

export interface SessionSummary {
  generatedAt: Date;
  duration: number;
  participantCount: number;
  keyDiscussions: string[];
  decisionsCount: number;
  actionItemsCount: number;
  outcomes: string[];
  nextSteps: string[];
  overallAssessment: 'highly-productive' | 'productive' | 'moderate' | 'needs-improvement';
}

export interface SessionTemplate {
  id: string;
  type: SessionType;
  name: string;
  defaultDuration: number;
  suggestedParticipants: string[];
  defaultAgenda: Omit<AgendaItem, 'id' | 'status' | 'notes'>[];
  groundRules: string[];
}

export interface TurnManagementConfig {
  maxTurnDuration: number; // seconds
  turnOrder: 'round-robin' | 'raise-hand' | 'free-form';
  allowInterruptions: boolean;
  requireAcknowledgment: boolean;
}
