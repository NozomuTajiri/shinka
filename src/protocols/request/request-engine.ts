/**
 * リクエストエンジン
 * リクエスト管理・ルーティング・SLA監視
 */

import type {
  RequestMetadata,
  InformationRequest,
  AnalysisRequest,
  ParticipationRequest,
  SupportRequest,
  RequestType,
  RequestPriority,
  RequestStatus,
  RequestSLA,
  RequestRouting,
  InformationResponse,
  AnalysisResponse,
  ParticipationResponse,
  SupportResponse,
} from './types.js';

type AnyRequest = InformationRequest | AnalysisRequest | ParticipationRequest | SupportRequest;

export class RequestEngine {
  private requests: Map<string, AnyRequest> = new Map();
  private slaDefinitions: RequestSLA[] = [];
  private routingRules: RequestRouting[] = [];

  constructor() {
    this.initializeDefaultSLAs();
    this.initializeDefaultRouting();
  }

  private initializeDefaultSLAs(): void {
    this.slaDefinitions = [
      { requestType: 'information', priority: 'urgent', responseTimeHours: 4, completionTimeHours: 24 },
      { requestType: 'information', priority: 'high', responseTimeHours: 8, completionTimeHours: 24 },
      { requestType: 'information', priority: 'normal', responseTimeHours: 24, completionTimeHours: 48 },
      { requestType: 'information', priority: 'low', responseTimeHours: 48, completionTimeHours: 72 },
      { requestType: 'analysis', priority: 'urgent', responseTimeHours: 8, completionTimeHours: 48 },
      { requestType: 'analysis', priority: 'high', responseTimeHours: 24, completionTimeHours: 72 },
      { requestType: 'analysis', priority: 'normal', responseTimeHours: 48, completionTimeHours: 120 },
      { requestType: 'analysis', priority: 'low', responseTimeHours: 72, completionTimeHours: 168 },
      { requestType: 'participation', priority: 'urgent', responseTimeHours: 2, completionTimeHours: 4 },
      { requestType: 'participation', priority: 'high', responseTimeHours: 8, completionTimeHours: 24 },
      { requestType: 'participation', priority: 'normal', responseTimeHours: 24, completionTimeHours: 48 },
      { requestType: 'participation', priority: 'low', responseTimeHours: 48, completionTimeHours: 72 },
      { requestType: 'support', priority: 'urgent', responseTimeHours: 1, completionTimeHours: 8 },
      { requestType: 'support', priority: 'high', responseTimeHours: 4, completionTimeHours: 24 },
      { requestType: 'support', priority: 'normal', responseTimeHours: 24, completionTimeHours: 48 },
      { requestType: 'support', priority: 'low', responseTimeHours: 48, completionTimeHours: 72 },
    ];
  }

  private initializeDefaultRouting(): void {
    this.routingRules = [
      { requestType: 'information', keywords: ['市場', 'マーケティング', '顧客'], preferredAvatars: ['shijo'], fallbackAvatars: ['senryaku'] },
      { requestType: 'information', keywords: ['財務', '決算', '収益'], preferredAvatars: ['senryaku'], fallbackAvatars: ['kanri'] },
      { requestType: 'information', keywords: ['営業', '販売', '商談'], preferredAvatars: ['eigyo'], fallbackAvatars: ['senryaku'] },
      { requestType: 'information', keywords: ['組織', 'チーム', 'マネジメント'], preferredAvatars: ['kanri'], fallbackAvatars: ['senryaku'] },
      { requestType: 'analysis', keywords: ['戦略', '経営', 'ビジョン'], preferredAvatars: ['senryaku'], fallbackAvatars: ['shijo'] },
      { requestType: 'analysis', keywords: ['営業プロセス', '商談'], preferredAvatars: ['eigyo'], fallbackAvatars: ['senryaku'] },
      { requestType: 'analysis', keywords: ['市場調査', '競合'], preferredAvatars: ['shijo'], fallbackAvatars: ['senryaku'] },
      { requestType: 'support', keywords: ['初回相談', '診断'], preferredAvatars: ['hiraku'], fallbackAvatars: ['senryaku'] },
    ];
  }

  generateRequestId(): string {
    return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateDeadline(priority: RequestPriority, type: RequestType): Date {
    const sla = this.slaDefinitions.find(s => s.requestType === type && s.priority === priority);
    const hours = sla?.completionTimeHours ?? 72;
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + hours);
    return deadline;
  }

  createInformationRequest(
    fromAvatarId: string,
    toAvatarId: string,
    clientId: string,
    priority: RequestPriority,
    topic: string,
    context: string,
    specificQuestions: string[],
    preferredFormat: InformationRequest['preferredFormat'] = 'summary'
  ): InformationRequest {
    const request: InformationRequest = {
      metadata: {
        requestId: this.generateRequestId(),
        type: 'information',
        fromAvatarId,
        toAvatarId,
        clientId,
        priority,
        createdAt: new Date(),
        deadline: this.calculateDeadline(priority, 'information'),
        status: 'pending',
      },
      topic,
      context,
      specificQuestions,
      preferredFormat,
    };

    this.requests.set(request.metadata.requestId, request);
    return request;
  }

  createAnalysisRequest(
    fromAvatarId: string,
    toAvatarId: string,
    clientId: string,
    priority: RequestPriority,
    analysisType: AnalysisRequest['analysisType'],
    subject: string,
    scope: string,
    dataProvided: AnalysisRequest['dataProvided'],
    expectedOutputs: string[]
  ): AnalysisRequest {
    const request: AnalysisRequest = {
      metadata: {
        requestId: this.generateRequestId(),
        type: 'analysis',
        fromAvatarId,
        toAvatarId,
        clientId,
        priority,
        createdAt: new Date(),
        deadline: this.calculateDeadline(priority, 'analysis'),
        status: 'pending',
      },
      analysisType,
      subject,
      scope,
      dataProvided,
      expectedOutputs,
    };

    this.requests.set(request.metadata.requestId, request);
    return request;
  }

  createParticipationRequest(
    fromAvatarId: string,
    toAvatarId: string,
    clientId: string,
    priority: RequestPriority,
    sessionType: ParticipationRequest['sessionType'],
    scheduledAt: Date,
    duration: number,
    agenda: ParticipationRequest['agenda'],
    expectedRole: string,
    preparationNeeded: string[]
  ): ParticipationRequest {
    const request: ParticipationRequest = {
      metadata: {
        requestId: this.generateRequestId(),
        type: 'participation',
        fromAvatarId,
        toAvatarId,
        clientId,
        priority,
        createdAt: new Date(),
        deadline: scheduledAt,
        status: 'pending',
      },
      sessionType,
      scheduledAt,
      duration,
      agenda,
      expectedRole,
      preparationNeeded,
    };

    this.requests.set(request.metadata.requestId, request);
    return request;
  }

  createSupportRequest(
    fromAvatarId: string,
    toAvatarId: string,
    clientId: string,
    priority: RequestPriority,
    supportType: SupportRequest['supportType'],
    reason: string,
    currentSituation: string,
    specificNeed: string,
    urgency: string
  ): SupportRequest {
    const request: SupportRequest = {
      metadata: {
        requestId: this.generateRequestId(),
        type: 'support',
        fromAvatarId,
        toAvatarId,
        clientId,
        priority,
        createdAt: new Date(),
        deadline: this.calculateDeadline(priority, 'support'),
        status: 'pending',
      },
      supportType,
      reason,
      currentSituation,
      specificNeed,
      urgency,
    };

    this.requests.set(request.metadata.requestId, request);
    return request;
  }

  acceptRequest(requestId: string): boolean {
    const request = this.requests.get(requestId);
    if (!request || request.metadata.status !== 'pending') return false;

    request.metadata.status = 'accepted';
    request.metadata.acceptedAt = new Date();
    return true;
  }

  startRequest(requestId: string): boolean {
    const request = this.requests.get(requestId);
    if (!request || request.metadata.status !== 'accepted') return false;

    request.metadata.status = 'in-progress';
    return true;
  }

  respondToInformationRequest(requestId: string, response: InformationResponse): boolean {
    const request = this.requests.get(requestId) as InformationRequest | undefined;
    if (!request || request.metadata.type !== 'information') return false;

    request.response = response;
    request.metadata.status = 'completed';
    request.metadata.completedAt = new Date();
    return true;
  }

  respondToAnalysisRequest(requestId: string, response: AnalysisResponse): boolean {
    const request = this.requests.get(requestId) as AnalysisRequest | undefined;
    if (!request || request.metadata.type !== 'analysis') return false;

    request.response = response;
    request.metadata.status = 'completed';
    request.metadata.completedAt = new Date();
    return true;
  }

  respondToParticipationRequest(requestId: string, response: ParticipationResponse): boolean {
    const request = this.requests.get(requestId) as ParticipationRequest | undefined;
    if (!request || request.metadata.type !== 'participation') return false;

    request.response = response;
    request.metadata.status = response.accepted ? 'accepted' : 'rejected';
    return true;
  }

  respondToSupportRequest(requestId: string, response: SupportResponse): boolean {
    const request = this.requests.get(requestId) as SupportRequest | undefined;
    if (!request || request.metadata.type !== 'support') return false;

    request.response = response;
    request.metadata.status = response.accepted ? 'in-progress' : 'rejected';
    return true;
  }

  rejectRequest(requestId: string, reason: string): boolean {
    const request = this.requests.get(requestId);
    if (!request || !['pending', 'accepted'].includes(request.metadata.status)) return false;

    request.metadata.status = 'rejected';
    return true;
  }

  routeRequest(type: RequestType, context: string): string[] {
    const relevantRules = this.routingRules.filter(r => r.requestType === type);

    for (const rule of relevantRules) {
      if (rule.keywords.some(kw => context.includes(kw))) {
        return [...rule.preferredAvatars, ...rule.fallbackAvatars];
      }
    }

    // Default routing
    return ['senryaku', 'hiraku'];
  }

  getSLAStatus(requestId: string): { withinSLA: boolean; hoursRemaining: number } {
    const request = this.requests.get(requestId);
    if (!request) return { withinSLA: false, hoursRemaining: 0 };

    const now = new Date();
    const deadline = request.metadata.deadline;
    const hoursRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);

    return {
      withinSLA: hoursRemaining > 0,
      hoursRemaining: Math.round(hoursRemaining * 10) / 10,
    };
  }

  getRequest(requestId: string): AnyRequest | undefined {
    return this.requests.get(requestId);
  }

  getRequestsByStatus(status: RequestStatus): AnyRequest[] {
    return Array.from(this.requests.values()).filter(r => r.metadata.status === status);
  }

  getRequestsByAvatar(avatarId: string, direction: 'from' | 'to' | 'both' = 'both'): AnyRequest[] {
    return Array.from(this.requests.values()).filter(r => {
      if (direction === 'from') return r.metadata.fromAvatarId === avatarId;
      if (direction === 'to') return r.metadata.toAvatarId === avatarId;
      return r.metadata.fromAvatarId === avatarId || r.metadata.toAvatarId === avatarId;
    });
  }

  getOverdueRequests(): AnyRequest[] {
    const now = new Date();
    return Array.from(this.requests.values()).filter(
      r => r.metadata.deadline < now && !['completed', 'rejected', 'expired'].includes(r.metadata.status)
    );
  }
}
