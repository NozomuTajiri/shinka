/**
 * アバター構築エンジン型定義
 */

export interface AvatarBuildRequest {
  requestId: string;
  requestedBy: 'system' | 'client' | 'admin';
  reason: string;
  requirements: AvatarRequirements;
  priority: 'low' | 'medium' | 'high' | 'critical';
  requestedAt: Date;
  status: BuildRequestStatus;
}

export type BuildRequestStatus =
  | 'pending'
  | 'analyzing'
  | 'approved'
  | 'rejected'
  | 'building'
  | 'testing'
  | 'deployed'
  | 'failed';

export interface AvatarRequirements {
  purpose: string;
  targetAudience: string[];
  domain: string;
  capabilities: string[];
  communicationStyle: CommunicationStyleSpec;
  knowledgeSources: string[];
  integrations: string[];
}

export interface CommunicationStyleSpec {
  tone: string;
  formality: 'casual' | 'semi-formal' | 'formal';
  empathy: 'low' | 'medium' | 'high';
  directness: 'indirect' | 'balanced' | 'direct';
}

export interface BuildTrigger {
  type: 'market_need' | 'client_request' | 'gap_analysis' | 'scheduled_review';
  source: string;
  data: Record<string, unknown>;
  detectedAt: Date;
  confidence: number;
}

export interface BuildValidation {
  validationId: string;
  checks: ValidationCheck[];
  overallScore: number;
  passed: boolean;
  recommendations: string[];
}

export interface ValidationCheck {
  name: string;
  category: 'functionality' | 'quality' | 'security' | 'performance';
  passed: boolean;
  score: number;
  details: string;
}

export interface AvatarBlueprint {
  blueprintId: string;
  name: string;
  version: string;
  persona: PersonaSpec;
  knowledge: KnowledgeSpec;
  behavior: BehaviorSpec;
  integrations: IntegrationSpec[];
  metadata: BlueprintMetadata;
}

export interface PersonaSpec {
  id: string;
  name: string;
  role: string;
  description: string;
  values: string[];
  principles: string[];
  systemPrompt: string;
}

export interface KnowledgeSpec {
  domains: string[];
  frameworks: FrameworkRef[];
  databases: DatabaseRef[];
  externalSources: ExternalSourceRef[];
}

export interface FrameworkRef {
  id: string;
  name: string;
  priority: number;
}

export interface DatabaseRef {
  id: string;
  type: string;
  connectionConfig: Record<string, string>;
}

export interface ExternalSourceRef {
  id: string;
  url: string;
  refreshInterval: number;
}

export interface BehaviorSpec {
  responseStyle: CommunicationStyleSpec;
  maxTokens: number;
  temperature: number;
  topP: number;
  fallbackBehavior: string;
}

export interface IntegrationSpec {
  type: 'api' | 'database' | 'webhook' | 'mcp';
  name: string;
  config: Record<string, unknown>;
}

export interface BlueprintMetadata {
  createdAt: Date;
  createdBy: string;
  lastModified: Date;
  status: 'draft' | 'review' | 'approved' | 'deployed' | 'deprecated';
  tags: string[];
}

export interface BuildPipeline {
  pipelineId: string;
  stages: PipelineStage[];
  currentStage: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'running' | 'paused' | 'completed' | 'failed';
  logs: PipelineLog[];
}

export interface PipelineStage {
  name: string;
  order: number;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  output?: Record<string, unknown>;
}

export interface PipelineLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  stage: string;
  message: string;
}
