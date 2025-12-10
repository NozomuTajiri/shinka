/**
 * アバターベーステンプレート型定義
 * 全アバター共通の基盤構造
 */

export type AvatarCategory = 'management' | 'sales' | 'marketing' | 'operations' | 'organization' | 'specialized';
export type AvatarStatus = 'draft' | 'review' | 'trial' | 'active' | 'deprecated';
export type CommunicationStyle = 'formal' | 'friendly' | 'coaching' | 'directive' | 'collaborative';
export type ExpertiseLevel = 'basic' | 'intermediate' | 'advanced' | 'expert';

export interface AvatarTemplateMetadata {
  templateId: string;
  version: string;
  category: AvatarCategory;
  createdAt: Date;
  updatedAt: Date;
  author: string;
  status: AvatarStatus;
  parentTemplateId?: string;
}

export interface BaseAvatarTemplate {
  metadata: AvatarTemplateMetadata;
  persona: AvatarPersona;
  knowledge: KnowledgeDomain[];
  capabilities: AvatarCapabilities;
  database: DatabasePermissions;
  collaboration: CollaborationSettings;
  quality: QualityStandards;
  learning: LearningMechanism;
}

export interface AvatarPersona {
  id: string;
  name: string;
  nameJa: string;
  role: string;
  description: string;
  background: string;
  communicationStyle: CommunicationStyle;
  tone: string[];
  principles: string[];
  strengths: string[];
  limitations: string[];
}

export interface KnowledgeDomain {
  id: string;
  name: string;
  description: string;
  expertiseLevel: ExpertiseLevel;
  topics: string[];
  frameworks: string[];
  sources: KnowledgeSource[];
  updatedAt: Date;
}

export interface KnowledgeSource {
  id: string;
  type: 'internal' | 'external' | 'client' | 'industry';
  name: string;
  priority: number;
  refreshInterval: number; // days
}

export interface AvatarCapabilities {
  core: CoreCapability[];
  extended: ExtendedCapability[];
  limitations: string[];
  integrations: Integration[];
}

export interface CoreCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  requiredKnowledge: string[];
}

export interface ExtendedCapability {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  conditions: string[];
  dependencies: string[];
}

export interface Integration {
  id: string;
  type: 'api' | 'database' | 'service' | 'avatar';
  target: string;
  permissions: string[];
  config?: Record<string, unknown>;
}

export interface DatabasePermissions {
  read: DatabaseAccess[];
  write: DatabaseAccess[];
  restricted: string[];
}

export interface DatabaseAccess {
  database: string;
  tables: string[];
  fields?: string[];
  conditions?: string;
}

export interface CollaborationSettings {
  canInitiate: string[];
  canRespond: string[];
  reportingTo: string[];
  supervisedBy?: string;
  protocols: ProtocolConfig[];
}

export interface ProtocolConfig {
  protocolId: string;
  enabled: boolean;
  role: 'initiator' | 'responder' | 'both';
  priority: number;
}

export interface QualityStandards {
  responseTime: ResponseTimeStandard;
  accuracy: AccuracyStandard;
  satisfaction: SatisfactionStandard;
  metrics: QualityMetric[];
}

export interface ResponseTimeStandard {
  targetSeconds: number;
  maxSeconds: number;
  warningThreshold: number;
}

export interface AccuracyStandard {
  minScore: number;
  targetScore: number;
  evaluationMethod: string;
}

export interface SatisfactionStandard {
  minScore: number;
  targetScore: number;
  surveyFrequency: 'session' | 'daily' | 'weekly';
}

export interface QualityMetric {
  id: string;
  name: string;
  type: 'counter' | 'gauge' | 'histogram';
  unit: string;
  threshold: number;
}

export interface LearningMechanism {
  enabled: boolean;
  mode: 'supervised' | 'reinforcement' | 'hybrid';
  feedbackSources: FeedbackSource[];
  updateFrequency: 'realtime' | 'daily' | 'weekly';
  retentionPolicy: RetentionPolicy;
}

export interface FeedbackSource {
  id: string;
  type: 'explicit' | 'implicit' | 'outcome';
  weight: number;
  minSamples: number;
}

export interface RetentionPolicy {
  successfulPatterns: number; // days
  failedPatterns: number;
  clientContext: number;
  sessionHistory: number;
}

export interface AvatarInstance {
  instanceId: string;
  templateId: string;
  clientId: string;
  customizations: Partial<BaseAvatarTemplate>;
  createdAt: Date;
  lastActiveAt: Date;
  status: AvatarStatus;
  metrics: InstanceMetrics;
}

export interface InstanceMetrics {
  totalSessions: number;
  avgResponseTime: number;
  satisfactionScore: number;
  successRate: number;
  learningProgress: number;
}
