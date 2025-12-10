/**
 * 横断インサイトエンジン型定義
 */

export interface ClientActivity {
  clientId: string;
  clientName: string;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  avatarInteractions: AvatarInteraction[];
  outcomes: BusinessOutcome[];
  period: { start: Date; end: Date };
}

export interface AvatarInteraction {
  avatarId: string;
  avatarName: string;
  sessionCount: number;
  topics: TopicSummary[];
  sentiment: SentimentAnalysis;
  actionsTaken: string[];
  successRate: number;
}

export interface TopicSummary {
  topic: string;
  frequency: number;
  avgSentiment: number;
  relatedTopics: string[];
}

export interface SentimentAnalysis {
  overall: number;
  trend: 'improving' | 'stable' | 'declining';
  highlights: string[];
  concerns: string[];
}

export interface BusinessOutcome {
  type: 'revenue' | 'cost' | 'efficiency' | 'satisfaction' | 'other';
  metric: string;
  baseline: number;
  current: number;
  change: number;
  attribution: number;
}

export interface CrossClientPattern {
  patternId: string;
  name: string;
  type: 'success' | 'challenge' | 'trend' | 'opportunity';
  description: string;
  frequency: number;
  clients: string[];
  conditions: PatternCondition[];
  outcomes: PatternOutcome[];
  confidence: number;
  detectedAt: Date;
}

export interface PatternCondition {
  factor: string;
  value: string | number;
  operator: 'equals' | 'contains' | 'greater' | 'less' | 'between';
}

export interface PatternOutcome {
  metric: string;
  direction: 'increase' | 'decrease' | 'stable';
  magnitude: number;
  timeframe: string;
}

export interface BestPractice {
  practiceId: string;
  title: string;
  category: string;
  description: string;
  context: string;
  steps: PracticeStep[];
  expectedOutcomes: string[];
  applicability: ApplicabilityCriteria;
  evidence: Evidence[];
  rating: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface PracticeStep {
  order: number;
  action: string;
  tips: string[];
  commonMistakes: string[];
}

export interface ApplicabilityCriteria {
  industries: string[];
  companySize: string[];
  challenges: string[];
  prerequisites: string[];
}

export interface Evidence {
  clientId: string;
  outcome: string;
  metrics: Record<string, number>;
  testimonial?: string;
}

export interface InsightReport {
  reportId: string;
  title: string;
  period: { start: Date; end: Date };
  executiveSummary: string;
  patterns: CrossClientPattern[];
  bestPractices: BestPractice[];
  trends: TrendAnalysis[];
  recommendations: Recommendation[];
  generatedAt: Date;
}

export interface TrendAnalysis {
  trendId: string;
  name: string;
  direction: 'up' | 'down' | 'stable';
  strength: number;
  description: string;
  affectedClients: number;
  projectedImpact: string;
}

export interface Recommendation {
  id: string;
  priority: 'high' | 'medium' | 'low';
  target: 'all' | 'segment' | 'specific';
  targetCriteria?: Record<string, string>;
  title: string;
  rationale: string;
  actions: string[];
  expectedBenefit: string;
}

export interface InsightDistribution {
  distributionId: string;
  insightId: string;
  recipients: Recipient[];
  channel: 'email' | 'dashboard' | 'notification' | 'report';
  scheduledAt: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
}

export interface Recipient {
  type: 'client' | 'avatar' | 'admin';
  id: string;
  name: string;
  relevanceScore: number;
}
