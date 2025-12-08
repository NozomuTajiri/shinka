/**
 * CEOコンサルアバター「戦略」型定義
 */

export interface SenryakuPersona {
  id: 'senryaku';
  name: '戦略';
  role: 'CEO戦略コンサルタント';
  description: string;
  communicationStyle: {
    tone: '知的で戦略的';
    approach: '俯瞰的視点・長期思考';
    principle: '意思決定支援';
  };
  values: string[];
  behaviorPrinciples: string[];
}

export interface StrategicFramework {
  id: string;
  name: string;
  description: string;
  applicableScenarios: string[];
  steps: FrameworkStep[];
}

export interface FrameworkStep {
  order: number;
  name: string;
  description: string;
  questions: string[];
  outputs: string[];
}

export interface DecisionContext {
  situation: string;
  options: DecisionOption[];
  constraints: string[];
  timeframe: 'short' | 'medium' | 'long';
  stakeholders: string[];
}

export interface DecisionOption {
  id: string;
  name: string;
  description: string;
  pros: string[];
  cons: string[];
  risks: Risk[];
  expectedOutcome: string;
}

export interface Risk {
  type: 'financial' | 'operational' | 'strategic' | 'reputational';
  probability: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation?: string;
}

export interface IntegratedReport {
  executiveSummary: string;
  strategicAnalysis: {
    currentState: string;
    challenges: string[];
    opportunities: string[];
  };
  recommendations: Recommendation[];
  actionPlan: ActionItem[];
  kpis: KPI[];
}

export interface Recommendation {
  priority: number;
  title: string;
  rationale: string;
  expectedImpact: string;
  resources: string[];
}

export interface ActionItem {
  id: string;
  action: string;
  owner: string;
  deadline: string;
  dependencies: string[];
}

export interface KPI {
  name: string;
  currentValue: number | string;
  targetValue: number | string;
  unit: string;
  timeline: string;
}

export interface SenryakuSession {
  sessionId: string;
  clientId: string;
  topic: 'strategy' | 'decision' | 'planning' | 'review';
  context: DecisionContext | null;
  conversationHistory: ConversationTurn[];
  insights: string[];
  generatedReports: IntegratedReport[];
}

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  frameworks?: string[];
}
