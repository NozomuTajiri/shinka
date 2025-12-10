/**
 * セッション管理型定義
 */

export type SessionStatus = 'active' | 'paused' | 'completed' | 'abandoned';
export type AvatarAssignmentStrategy = 'auto' | 'manual' | 'recommended';

export interface SessionMetadata {
  sessionId: string;
  clientId: string;
  createdAt: Date;
  updatedAt: Date;
  status: SessionStatus;
  assignedAvatarId: string;
  assignmentStrategy: AvatarAssignmentStrategy;
}

export interface ClientSession {
  metadata: SessionMetadata;
  context: SessionContext;
  history: ConversationTurn[];
  insights: SessionInsight[];
  actionItems: SessionActionItem[];
  metrics: SessionMetrics;
}

export interface SessionContext {
  clientProfile?: ClientProfile;
  currentTopic?: string;
  objectives: string[];
  constraints: string[];
  previousSessionIds: string[];
  customData: Record<string, unknown>;
}

export interface ClientProfile {
  id: string;
  name: string;
  company?: string;
  industry?: string;
  size?: 'startup' | 'sme' | 'enterprise';
  challenges: string[];
  preferences: ClientPreferences;
}

export interface ClientPreferences {
  communicationStyle: 'formal' | 'casual' | 'balanced';
  responseLength: 'concise' | 'detailed' | 'adaptive';
  language: string;
  timezone?: string;
}

export interface ConversationTurn {
  id: string;
  timestamp: Date;
  role: 'client' | 'avatar';
  avatarId?: string;
  content: string;
  metadata?: TurnMetadata;
}

export interface TurnMetadata {
  responseTime?: number;
  confidence?: number;
  frameworkUsed?: string;
  tokensUsed?: number;
}

export interface SessionInsight {
  id: string;
  timestamp: Date;
  category: string;
  content: string;
  confidence: number;
  source: 'avatar' | 'analysis' | 'pattern';
}

export interface SessionActionItem {
  id: string;
  createdAt: Date;
  action: string;
  assignee: 'client' | 'avatar' | 'both';
  priority: 'high' | 'medium' | 'low';
  dueDate?: Date;
  status: 'pending' | 'in-progress' | 'completed';
  completedAt?: Date;
}

export interface SessionMetrics {
  totalTurns: number;
  duration: number; // seconds
  avgResponseTime: number;
  insightsGenerated: number;
  actionItemsCreated: number;
  satisfactionScore?: number;
}

export interface AvatarRecommendation {
  avatarId: string;
  score: number;
  reasons: string[];
  suitability: 'excellent' | 'good' | 'moderate' | 'low';
}

export interface SessionSummary {
  sessionId: string;
  duration: number;
  keyTopics: string[];
  mainInsights: string[];
  actionItems: SessionActionItem[];
  nextSteps: string[];
  overallAssessment: string;
}
