/**
 * マネジメントアバター「管理」型定義
 */

export interface KanriPersona {
  id: 'kanri';
  name: '管理';
  role: 'マネジメントコンサルタント';
  description: string;
  communicationStyle: {
    tone: '共感的で支援的';
    approach: '伴走型コーチング';
    principle: '心理的安全性の確保';
  };
  values: string[];
  behaviorPrinciples: string[];
}

export interface ManagementChallenge {
  id: string;
  category: 'delegation' | 'communication' | 'motivation' | 'conflict' | 'development' | 'performance';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  context: string;
  stakeholders: string[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  tenure: string;
  strengths: string[];
  developmentAreas: string[];
  motivators: string[];
  communicationStyle: string;
  currentProjects: string[];
  oneOnOneNotes: OneOnOneNote[];
}

export interface OneOnOneNote {
  date: Date;
  topics: string[];
  actionItems: string[];
  mood: 'positive' | 'neutral' | 'concerned';
  followUp: string[];
}

export interface DelegationPlan {
  taskId: string;
  taskName: string;
  delegateTo: string;
  reason: string;
  supportLevel: 'full-support' | 'check-in' | 'autonomous';
  milestones: Milestone[];
  successCriteria: string[];
  riskMitigation: string[];
}

export interface Milestone {
  name: string;
  dueDate: string;
  checkInType: 'meeting' | 'report' | 'demo';
  completed: boolean;
}

export interface TeamDevelopmentPlan {
  teamId: string;
  teamName: string;
  currentState: TeamHealth;
  targetState: TeamHealth;
  initiatives: DevelopmentInitiative[];
  timeline: string;
}

export interface TeamHealth {
  psychologicalSafety: number;
  clarity: number;
  engagement: number;
  collaboration: number;
  performance: number;
  overallScore: number;
}

export interface DevelopmentInitiative {
  id: string;
  name: string;
  objective: string;
  actions: string[];
  owner: string;
  timeline: string;
  metrics: string[];
}

export interface ConflictResolution {
  conflictId: string;
  parties: string[];
  nature: 'interpersonal' | 'task' | 'process' | 'status';
  rootCause: string;
  approach: string;
  steps: ConflictStep[];
  resolution?: string;
}

export interface ConflictStep {
  order: number;
  action: string;
  responsible: string;
  timeline: string;
  status: 'pending' | 'in-progress' | 'completed';
}

export interface KanriSession {
  sessionId: string;
  managerId: string;
  challengeType: ManagementChallenge['category'] | 'general';
  currentChallenge?: ManagementChallenge;
  teamMembers: TeamMember[];
  conversationHistory: { role: string; content: string; timestamp: Date }[];
  actionItems: string[];
  insights: string[];
}

export interface CoachingQuestion {
  category: string;
  question: string;
  purpose: string;
  followUps: string[];
}
