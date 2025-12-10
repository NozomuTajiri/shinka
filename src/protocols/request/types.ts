/**
 * リクエストプロトコル型定義
 * アバター間の情報収集・分析依頼・参加支援プロトコル
 */

export type RequestType = 'information' | 'analysis' | 'participation' | 'support';
export type RequestPriority = 'low' | 'normal' | 'high' | 'urgent';
export type RequestStatus = 'pending' | 'accepted' | 'in-progress' | 'completed' | 'rejected' | 'expired';

export interface RequestMetadata {
  requestId: string;
  type: RequestType;
  fromAvatarId: string;
  toAvatarId: string;
  clientId: string;
  priority: RequestPriority;
  createdAt: Date;
  deadline: Date;
  status: RequestStatus;
  acceptedAt?: Date;
  completedAt?: Date;
}

export interface InformationRequest {
  metadata: RequestMetadata;
  topic: string;
  context: string;
  specificQuestions: string[];
  preferredFormat: 'summary' | 'detailed' | 'data' | 'presentation';
  response?: InformationResponse;
}

export interface InformationResponse {
  respondedAt: Date;
  summary: string;
  details: string;
  sources: string[];
  confidence: number; // 0-100
  caveats: string[];
}

export interface AnalysisRequest {
  metadata: RequestMetadata;
  analysisType: 'market' | 'financial' | 'operational' | 'strategic' | 'risk';
  subject: string;
  scope: string;
  dataProvided: DataItem[];
  expectedOutputs: string[];
  response?: AnalysisResponse;
}

export interface DataItem {
  id: string;
  name: string;
  type: 'document' | 'spreadsheet' | 'metric' | 'interview' | 'survey';
  content: string;
}

export interface AnalysisResponse {
  respondedAt: Date;
  findings: Finding[];
  recommendations: Recommendation[];
  methodology: string;
  limitations: string[];
  confidence: number;
}

export interface Finding {
  id: string;
  category: string;
  description: string;
  evidence: string[];
  impact: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: number;
  effort: 'low' | 'medium' | 'high';
  expectedOutcome: string;
}

export interface ParticipationRequest {
  metadata: RequestMetadata;
  sessionType: 'client-meeting' | 'strategy-session' | 'problem-solving' | 'review';
  scheduledAt: Date;
  duration: number; // minutes
  agenda: AgendaItem[];
  expectedRole: string;
  preparationNeeded: string[];
  response?: ParticipationResponse;
}

export interface AgendaItem {
  order: number;
  topic: string;
  duration: number;
  lead: string;
  expectedOutcome: string;
}

export interface ParticipationResponse {
  respondedAt: Date;
  accepted: boolean;
  alternativeTime?: Date;
  preparationStatus: 'ready' | 'preparing' | 'needs-info';
  questions: string[];
}

export interface SupportRequest {
  metadata: RequestMetadata;
  supportType: 'escalation' | 'handoff' | 'consultation' | 'backup';
  reason: string;
  currentSituation: string;
  specificNeed: string;
  urgency: string;
  response?: SupportResponse;
}

export interface SupportResponse {
  respondedAt: Date;
  accepted: boolean;
  supportPlan: string;
  availability: string;
  conditions?: string[];
}

export interface RequestSLA {
  requestType: RequestType;
  priority: RequestPriority;
  responseTimeHours: number;
  completionTimeHours: number;
}

export interface RequestRouting {
  requestType: RequestType;
  keywords: string[];
  preferredAvatars: string[];
  fallbackAvatars: string[];
}
