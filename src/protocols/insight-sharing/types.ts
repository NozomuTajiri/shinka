/**
 * インサイト共有プロトコル型定義
 * ベストプラクティス・学習共有プロトコル
 */

export type InsightCategory = 'best-practice' | 'lesson-learned' | 'pattern' | 'anti-pattern' | 'innovation';
export type InsightSource = 'session' | 'analysis' | 'feedback' | 'observation' | 'external';
export type InsightStatus = 'draft' | 'review' | 'validated' | 'published' | 'archived';
export type ApplicabilityLevel = 'universal' | 'domain-specific' | 'context-specific' | 'experimental';

export interface InsightMetadata {
  insightId: string;
  category: InsightCategory;
  source: InsightSource;
  createdBy: string;
  createdAt: Date;
  validatedBy?: string;
  validatedAt?: Date;
  status: InsightStatus;
  version: number;
}

export interface Insight {
  metadata: InsightMetadata;
  title: string;
  description: string;
  context: InsightContext;
  content: InsightContent;
  applicability: InsightApplicability;
  evidence: Evidence[];
  relatedInsights: string[];
  tags: string[];
  engagement: InsightEngagement;
}

export interface InsightContext {
  industry?: string;
  companySize?: 'startup' | 'sme' | 'enterprise';
  challengeType?: string;
  originalClientId?: string;
  anonymized: boolean;
}

export interface InsightContent {
  problem: string;
  solution: string;
  implementation: ImplementationStep[];
  expectedOutcome: string;
  caveats: string[];
  alternatives?: string[];
}

export interface ImplementationStep {
  order: number;
  action: string;
  duration?: string;
  prerequisites: string[];
  tips: string[];
}

export interface InsightApplicability {
  level: ApplicabilityLevel;
  conditions: string[];
  targetAvatars: string[];
  industries: string[];
  excludedScenarios: string[];
}

export interface Evidence {
  id: string;
  type: 'case-study' | 'metric' | 'testimonial' | 'comparison';
  description: string;
  data?: Record<string, unknown>;
  source: string;
  credibility: 'high' | 'medium' | 'low';
}

export interface InsightEngagement {
  views: number;
  applications: number;
  successRate: number;
  ratings: Rating[];
  comments: Comment[];
}

export interface Rating {
  avatarId: string;
  score: number; // 1-5
  timestamp: Date;
}

export interface Comment {
  id: string;
  avatarId: string;
  content: string;
  timestamp: Date;
  type: 'question' | 'feedback' | 'addition' | 'correction';
}

export interface InsightDistribution {
  distributionId: string;
  insightId: string;
  targetAvatars: string[];
  distributedAt: Date;
  deliveryMethod: 'push' | 'digest' | 'on-demand';
  acknowledged: string[];
  applied: string[];
}

export interface LearningIntegration {
  integrationId: string;
  insightId: string;
  avatarId: string;
  integratedAt: Date;
  integrationLevel: 'awareness' | 'understanding' | 'application' | 'mastery';
  applicationLog: ApplicationEntry[];
}

export interface ApplicationEntry {
  timestamp: Date;
  clientId: string;
  context: string;
  outcome: 'success' | 'partial' | 'failure';
  notes: string;
}

export interface InsightCatalog {
  catalogId: string;
  name: string;
  description: string;
  categories: InsightCategory[];
  insightIds: string[];
  curators: string[];
  lastUpdated: Date;
}

export interface InsightSearchQuery {
  keywords?: string[];
  categories?: InsightCategory[];
  sources?: InsightSource[];
  targetAvatar?: string;
  industry?: string;
  minRating?: number;
  status?: InsightStatus[];
}
