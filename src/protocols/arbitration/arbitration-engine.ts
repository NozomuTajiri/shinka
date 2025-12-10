/**
 * 裁定エンジン
 * コンフリクト検知・分析・解決
 */

import type {
  ConflictMetadata,
  ConflictCase,
  ConflictType,
  ConflictSeverity,
  ArbitrationStatus,
  ResolutionStrategy,
  PartyInfo,
  ImpactAssessment,
  ConflictEvent,
  Resolution,
  ArbitrationRule,
  EscalationPath,
  MediationSession,
  MediationOutcome,
} from './types.js';

export class ArbitrationEngine {
  private conflicts: Map<string, ConflictCase> = new Map();
  private rules: ArbitrationRule[] = [];
  private escalationPaths: EscalationPath[] = [];
  private mediationSessions: Map<string, MediationSession> = new Map();

  constructor() {
    this.initializeDefaultRules();
    this.initializeEscalationPaths();
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'rule-recommendation-conflict',
        conflictType: 'recommendation',
        condition: '異なるアバターが相反する提案を行った場合',
        recommendedStrategy: 'consensus',
        escalationThreshold: 48,
        autoResolvable: false,
      },
      {
        id: 'rule-priority-conflict',
        conflictType: 'priority',
        condition: 'リソースや時間の優先順位で意見が分かれた場合',
        recommendedStrategy: 'authority',
        escalationThreshold: 24,
        autoResolvable: true,
      },
      {
        id: 'rule-resource-conflict',
        conflictType: 'resource',
        condition: '同じリソースに対する競合が発生した場合',
        recommendedStrategy: 'compromise',
        escalationThreshold: 12,
        autoResolvable: true,
      },
      {
        id: 'rule-approach-conflict',
        conflictType: 'approach',
        condition: '問題解決のアプローチが根本的に異なる場合',
        recommendedStrategy: 'consensus',
        escalationThreshold: 72,
        autoResolvable: false,
      },
      {
        id: 'rule-scope-conflict',
        conflictType: 'scope',
        condition: '担当範囲や責任の境界で曖昧さがある場合',
        recommendedStrategy: 'authority',
        escalationThreshold: 24,
        autoResolvable: true,
      },
    ];
  }

  private initializeEscalationPaths(): void {
    this.escalationPaths = [
      {
        level: 1,
        escalateTo: 'senryaku',
        triggerConditions: ['24時間以内に解決しない', '当事者間で合意に至らない'],
        timeoutHours: 24,
        authority: 'advisory',
      },
      {
        level: 2,
        escalateTo: 'mother-ai',
        triggerConditions: ['48時間以内に解決しない', 'クライアントへの影響が高い'],
        timeoutHours: 48,
        authority: 'binding',
      },
      {
        level: 3,
        escalateTo: 'human-supervisor',
        triggerConditions: ['重大なビジネス影響', 'AIでは判断困難'],
        timeoutHours: 72,
        authority: 'binding',
      },
    ];
  }

  generateConflictId(): string {
    return `cfl-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateSessionId(): string {
    return `med-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  detectConflict(
    type: ConflictType,
    parties: PartyInfo[],
    clientId: string,
    description: string,
    context: string
  ): ConflictCase {
    const severity = this.assessSeverity(type, parties, context);
    const impactAssessment = this.assessImpact(type, parties, context);

    const conflictCase: ConflictCase = {
      metadata: {
        conflictId: this.generateConflictId(),
        type,
        severity,
        parties,
        clientId,
        detectedAt: new Date(),
        status: 'detected',
      },
      description,
      context,
      impactAssessment,
      timeline: [{
        timestamp: new Date(),
        eventType: 'detected',
        actor: 'system',
        description: `コンフリクトが検知されました: ${description}`,
      }],
    };

    this.conflicts.set(conflictCase.metadata.conflictId, conflictCase);
    return conflictCase;
  }

  private assessSeverity(type: ConflictType, parties: PartyInfo[], context: string): ConflictSeverity {
    // Check for rigid parties
    const rigidParties = parties.filter(p => p.flexibility === 'rigid').length;
    if (rigidParties >= 2) return 'critical';

    // Check conflict type severity
    if (type === 'recommendation' && parties.length > 2) return 'high';
    if (type === 'priority' || type === 'resource') return 'medium';

    // Default assessment
    return 'low';
  }

  private assessImpact(type: ConflictType, parties: PartyInfo[], context: string): ImpactAssessment {
    const urgencyMap: Record<ConflictType, ImpactAssessment['urgency']> = {
      recommendation: 'medium',
      priority: 'high',
      resource: 'high',
      approach: 'low',
      scope: 'medium',
    };

    return {
      clientImpact: parties.length > 2 ? 'high' : 'medium',
      urgency: urgencyMap[type],
      affectedAreas: parties.map(p => p.avatarId),
      potentialOutcomes: [
        {
          scenario: '合意形成による解決',
          probability: 60,
          impact: 'positive',
          description: '当事者間で建設的な合意に至る',
        },
        {
          scenario: '妥協による解決',
          probability: 30,
          impact: 'neutral',
          description: '双方が一定の譲歩を行い解決',
        },
        {
          scenario: 'エスカレーション',
          probability: 10,
          impact: 'negative',
          description: '上位権限での判断が必要になる',
        },
      ],
    };
  }

  startAnalysis(conflictId: string): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.metadata.status !== 'detected') return false;

    conflict.metadata.status = 'analyzing';
    conflict.timeline.push({
      timestamp: new Date(),
      eventType: 'position-stated',
      actor: 'system',
      description: '各当事者の立場を分析中',
    });

    return true;
  }

  recommendStrategy(conflictId: string): ResolutionStrategy | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return null;

    const rule = this.rules.find(r => r.conflictType === conflict.metadata.type);
    return rule?.recommendedStrategy ?? 'consensus';
  }

  startMediation(conflictId: string, mediator: string): MediationSession | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return null;

    conflict.metadata.status = 'mediation';
    conflict.metadata.arbiter = mediator;

    const session: MediationSession = {
      sessionId: this.generateSessionId(),
      conflictId,
      mediator,
      participants: conflict.metadata.parties.map(p => p.avatarId),
      scheduledAt: new Date(),
      duration: 60,
      agenda: [
        '各当事者の立場確認',
        '共通点の特定',
        '妥協点の探索',
        '解決案の策定',
      ],
    };

    this.mediationSessions.set(session.sessionId, session);

    conflict.timeline.push({
      timestamp: new Date(),
      eventType: 'mediation-attempt',
      actor: mediator,
      description: `調停セッション開始: ${session.sessionId}`,
    });

    return session;
  }

  completeMediationSession(sessionId: string, outcome: MediationOutcome): boolean {
    const session = this.mediationSessions.get(sessionId);
    if (!session) return false;

    session.outcome = outcome;

    const conflict = this.conflicts.get(session.conflictId);
    if (conflict) {
      conflict.timeline.push({
        timestamp: new Date(),
        eventType: outcome.success ? 'resolution-proposed' : 'mediation-attempt',
        actor: session.mediator,
        description: outcome.success
          ? `調停成功: ${outcome.agreements.join(', ')}`
          : `調停継続: ${outcome.remainingIssues.join(', ')}`,
      });
    }

    return true;
  }

  escalate(conflictId: string): EscalationPath | null {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return null;

    // Find next escalation level
    const currentLevel = conflict.timeline.filter(e => e.eventType === 'escalation').length;
    const nextPath = this.escalationPaths.find(p => p.level === currentLevel + 1);

    if (!nextPath) return null;

    conflict.metadata.status = 'escalated';
    conflict.timeline.push({
      timestamp: new Date(),
      eventType: 'escalation',
      actor: 'system',
      description: `エスカレーション: Level ${nextPath.level} - ${nextPath.escalateTo}`,
    });

    return nextPath;
  }

  resolveConflict(
    conflictId: string,
    strategy: ResolutionStrategy,
    decision: string,
    rationale: string,
    acceptedBy: string[],
    rejectedBy: string[] = [],
    conditions: string[] = [],
    lessonsLearned: string[] = []
  ): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict) return false;

    conflict.resolution = {
      strategy,
      decision,
      rationale,
      acceptedBy,
      rejectedBy,
      conditions,
      followUpActions: [],
      lessonsLearned,
    };

    conflict.metadata.status = 'resolved';
    conflict.metadata.resolvedAt = new Date();

    conflict.timeline.push({
      timestamp: new Date(),
      eventType: 'resolved',
      actor: conflict.metadata.arbiter ?? 'system',
      description: `解決: ${decision}`,
    });

    return true;
  }

  closeConflict(conflictId: string): boolean {
    const conflict = this.conflicts.get(conflictId);
    if (!conflict || conflict.metadata.status !== 'resolved') return false;

    conflict.metadata.status = 'closed';
    return true;
  }

  getConflict(conflictId: string): ConflictCase | undefined {
    return this.conflicts.get(conflictId);
  }

  getConflictsByStatus(status: ArbitrationStatus): ConflictCase[] {
    return Array.from(this.conflicts.values()).filter(c => c.metadata.status === status);
  }

  getConflictsByParty(avatarId: string): ConflictCase[] {
    return Array.from(this.conflicts.values()).filter(
      c => c.metadata.parties.some(p => p.avatarId === avatarId)
    );
  }

  getActiveConflicts(): ConflictCase[] {
    const activeStatuses: ArbitrationStatus[] = ['detected', 'analyzing', 'mediation', 'escalated'];
    return Array.from(this.conflicts.values()).filter(c => activeStatuses.includes(c.metadata.status));
  }

  getMediationSession(sessionId: string): MediationSession | undefined {
    return this.mediationSessions.get(sessionId);
  }

  getConflictStatistics(): {
    total: number;
    byStatus: Record<ArbitrationStatus, number>;
    byType: Record<ConflictType, number>;
    avgResolutionTimeHours: number;
  } {
    const conflicts = Array.from(this.conflicts.values());

    const byStatus: Record<ArbitrationStatus, number> = {
      detected: 0, analyzing: 0, mediation: 0, escalated: 0, resolved: 0, closed: 0,
    };
    const byType: Record<ConflictType, number> = {
      recommendation: 0, priority: 0, resource: 0, approach: 0, scope: 0,
    };

    let totalResolutionTime = 0;
    let resolvedCount = 0;

    for (const conflict of conflicts) {
      byStatus[conflict.metadata.status]++;
      byType[conflict.metadata.type]++;

      if (conflict.metadata.resolvedAt) {
        const resolutionTime = conflict.metadata.resolvedAt.getTime() - conflict.metadata.detectedAt.getTime();
        totalResolutionTime += resolutionTime;
        resolvedCount++;
      }
    }

    return {
      total: conflicts.length,
      byStatus,
      byType,
      avgResolutionTimeHours: resolvedCount > 0
        ? Math.round(totalResolutionTime / resolvedCount / (1000 * 60 * 60) * 10) / 10
        : 0,
    };
  }
}
