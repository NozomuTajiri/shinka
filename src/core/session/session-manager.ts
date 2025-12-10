/**
 * セッションマネージャー
 * クライアントセッションの作成・管理・アバター割り当て
 */

import type {
  SessionMetadata,
  ClientSession,
  SessionStatus,
  SessionContext,
  ClientProfile,
  ConversationTurn,
  SessionInsight,
  SessionActionItem,
  SessionMetrics,
  AvatarRecommendation,
  SessionSummary,
  AvatarAssignmentStrategy,
} from './types.js';

export class SessionManager {
  private sessions: Map<string, ClientSession> = new Map();
  private clientSessions: Map<string, string[]> = new Map(); // clientId -> sessionIds

  generateSessionId(): string {
    return `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  createSession(
    clientId: string,
    options: {
      avatarId?: string;
      assignmentStrategy?: AvatarAssignmentStrategy;
      context?: Partial<SessionContext>;
      clientProfile?: ClientProfile;
    } = {}
  ): ClientSession {
    const sessionId = this.generateSessionId();
    const now = new Date();

    // Determine avatar assignment
    let assignedAvatarId = options.avatarId ?? 'hiraku';
    const strategy = options.assignmentStrategy ?? 'auto';

    if (strategy === 'auto' && !options.avatarId) {
      const recommendation = this.recommendAvatar(options.clientProfile, options.context);
      assignedAvatarId = recommendation.avatarId;
    }

    const session: ClientSession = {
      metadata: {
        sessionId,
        clientId,
        createdAt: now,
        updatedAt: now,
        status: 'active',
        assignedAvatarId,
        assignmentStrategy: strategy,
      },
      context: {
        clientProfile: options.clientProfile,
        objectives: [],
        constraints: [],
        previousSessionIds: this.getClientSessionIds(clientId),
        customData: {},
        ...options.context,
      },
      history: [],
      insights: [],
      actionItems: [],
      metrics: {
        totalTurns: 0,
        duration: 0,
        avgResponseTime: 0,
        insightsGenerated: 0,
        actionItemsCreated: 0,
      },
    };

    this.sessions.set(sessionId, session);

    // Track client sessions
    const clientSessionIds = this.clientSessions.get(clientId) ?? [];
    clientSessionIds.push(sessionId);
    this.clientSessions.set(clientId, clientSessionIds);

    return session;
  }

  recommendAvatar(
    profile?: ClientProfile,
    context?: Partial<SessionContext>
  ): AvatarRecommendation {
    const recommendations: AvatarRecommendation[] = [];

    // Default: hiraku for initial consultation
    recommendations.push({
      avatarId: 'hiraku',
      score: 70,
      reasons: ['初回相談に最適', '企業診断が可能'],
      suitability: 'good',
    });

    if (profile?.challenges) {
      const challenges = profile.challenges.join(' ').toLowerCase();

      if (challenges.includes('戦略') || challenges.includes('経営') || challenges.includes('ビジョン')) {
        recommendations.push({
          avatarId: 'senryaku',
          score: 90,
          reasons: ['経営戦略の専門家', '付加価値経営のフレームワーク'],
          suitability: 'excellent',
        });
      }

      if (challenges.includes('営業') || challenges.includes('売上') || challenges.includes('商談')) {
        recommendations.push({
          avatarId: 'eigyo',
          score: 90,
          reasons: ['科学的営業プロセス', '商談支援に強み'],
          suitability: 'excellent',
        });
      }

      if (challenges.includes('マーケティング') || challenges.includes('市場') || challenges.includes('競合')) {
        recommendations.push({
          avatarId: 'shijo',
          score: 90,
          reasons: ['市場分析の専門家', 'Neo-Market-Inフレームワーク'],
          suitability: 'excellent',
        });
      }

      if (challenges.includes('組織') || challenges.includes('チーム') || challenges.includes('マネジメント')) {
        recommendations.push({
          avatarId: 'kanri',
          score: 90,
          reasons: ['マネジメントコーチング', 'チーム開発支援'],
          suitability: 'excellent',
        });
      }
    }

    // Sort by score and return best
    recommendations.sort((a, b) => b.score - a.score);
    return recommendations[0];
  }

  getSession(sessionId: string): ClientSession | undefined {
    return this.sessions.get(sessionId);
  }

  getClientSessionIds(clientId: string): string[] {
    return this.clientSessions.get(clientId) ?? [];
  }

  getClientSessions(clientId: string): ClientSession[] {
    const sessionIds = this.getClientSessionIds(clientId);
    return sessionIds
      .map(id => this.sessions.get(id))
      .filter((s): s is ClientSession => s !== undefined);
  }

  addTurn(
    sessionId: string,
    role: 'client' | 'avatar',
    content: string,
    metadata?: ConversationTurn['metadata']
  ): ConversationTurn | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'active') return null;

    const turn: ConversationTurn = {
      id: this.generateId('trn'),
      timestamp: new Date(),
      role,
      avatarId: role === 'avatar' ? session.metadata.assignedAvatarId : undefined,
      content,
      metadata,
    };

    session.history.push(turn);
    session.metrics.totalTurns++;
    session.metadata.updatedAt = new Date();

    if (metadata?.responseTime) {
      const totalResponseTime = session.metrics.avgResponseTime * (session.metrics.totalTurns - 1);
      session.metrics.avgResponseTime = (totalResponseTime + metadata.responseTime) / session.metrics.totalTurns;
    }

    return turn;
  }

  addInsight(
    sessionId: string,
    category: string,
    content: string,
    confidence: number,
    source: SessionInsight['source'] = 'avatar'
  ): SessionInsight | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const insight: SessionInsight = {
      id: this.generateId('ins'),
      timestamp: new Date(),
      category,
      content,
      confidence,
      source,
    };

    session.insights.push(insight);
    session.metrics.insightsGenerated++;
    session.metadata.updatedAt = new Date();

    return insight;
  }

  addActionItem(
    sessionId: string,
    action: string,
    assignee: SessionActionItem['assignee'],
    priority: SessionActionItem['priority'] = 'medium',
    dueDate?: Date
  ): SessionActionItem | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const actionItem: SessionActionItem = {
      id: this.generateId('act'),
      createdAt: new Date(),
      action,
      assignee,
      priority,
      dueDate,
      status: 'pending',
    };

    session.actionItems.push(actionItem);
    session.metrics.actionItemsCreated++;
    session.metadata.updatedAt = new Date();

    return actionItem;
  }

  updateActionItemStatus(
    sessionId: string,
    actionItemId: string,
    status: SessionActionItem['status']
  ): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const actionItem = session.actionItems.find(a => a.id === actionItemId);
    if (!actionItem) return false;

    actionItem.status = status;
    if (status === 'completed') {
      actionItem.completedAt = new Date();
    }

    session.metadata.updatedAt = new Date();
    return true;
  }

  switchAvatar(sessionId: string, newAvatarId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'active') return false;

    session.metadata.assignedAvatarId = newAvatarId;
    session.metadata.assignmentStrategy = 'manual';
    session.metadata.updatedAt = new Date();

    // Add system message to history
    session.history.push({
      id: this.generateId('trn'),
      timestamp: new Date(),
      role: 'avatar',
      avatarId: 'system',
      content: `アバターが ${newAvatarId} に切り替わりました`,
    });

    return true;
  }

  pauseSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'active') return false;

    session.metadata.status = 'paused';
    session.metadata.updatedAt = new Date();
    return true;
  }

  resumeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'paused') return false;

    session.metadata.status = 'active';
    session.metadata.updatedAt = new Date();
    return true;
  }

  completeSession(sessionId: string, satisfactionScore?: number): SessionSummary | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    session.metadata.status = 'completed';
    session.metadata.updatedAt = new Date();

    // Calculate duration
    const duration = Math.round(
      (session.metadata.updatedAt.getTime() - session.metadata.createdAt.getTime()) / 1000
    );
    session.metrics.duration = duration;

    if (satisfactionScore !== undefined) {
      session.metrics.satisfactionScore = satisfactionScore;
    }

    return this.generateSummary(session);
  }

  abandonSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.metadata.status = 'abandoned';
    session.metadata.updatedAt = new Date();
    return true;
  }

  generateSummary(session: ClientSession): SessionSummary {
    // Extract key topics from conversation
    const keyTopics = this.extractKeyTopics(session.history);

    // Get main insights
    const mainInsights = session.insights
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5)
      .map(i => i.content);

    // Determine next steps
    const nextSteps = session.actionItems
      .filter(a => a.status === 'pending')
      .map(a => a.action);

    return {
      sessionId: session.metadata.sessionId,
      duration: session.metrics.duration,
      keyTopics,
      mainInsights,
      actionItems: session.actionItems,
      nextSteps,
      overallAssessment: this.generateAssessment(session),
    };
  }

  private extractKeyTopics(history: ConversationTurn[]): string[] {
    // Simplified topic extraction - in production, use NLP
    const topics = new Set<string>();

    for (const turn of history) {
      if (turn.role === 'client') {
        // Extract potential topics from client messages
        const content = turn.content.toLowerCase();
        if (content.includes('戦略')) topics.add('経営戦略');
        if (content.includes('営業')) topics.add('営業');
        if (content.includes('マーケティング')) topics.add('マーケティング');
        if (content.includes('組織')) topics.add('組織開発');
        if (content.includes('チーム')) topics.add('チームマネジメント');
      }
    }

    return Array.from(topics);
  }

  private generateAssessment(session: ClientSession): string {
    const satisfaction = session.metrics.satisfactionScore ?? 0;
    const insights = session.metrics.insightsGenerated;
    const actions = session.metrics.actionItemsCreated;

    if (satisfaction >= 4.5 && insights >= 3) {
      return '非常に生産的なセッションでした。多くの洞察と具体的なアクションが生まれました。';
    } else if (satisfaction >= 4.0 || insights >= 2) {
      return '効果的なセッションでした。いくつかの重要な気づきがありました。';
    } else if (actions >= 1) {
      return '次のステップが明確になりました。継続的なフォローアップを推奨します。';
    }
    return 'セッションは完了しました。追加の相談が必要な場合はお知らせください。';
  }

  getActiveSessions(): ClientSession[] {
    return Array.from(this.sessions.values()).filter(s => s.metadata.status === 'active');
  }

  getSessionsByStatus(status: SessionStatus): ClientSession[] {
    return Array.from(this.sessions.values()).filter(s => s.metadata.status === status);
  }

  getSessionStatistics(): {
    total: number;
    byStatus: Record<SessionStatus, number>;
    avgDuration: number;
    avgSatisfaction: number;
  } {
    const sessions = Array.from(this.sessions.values());

    const byStatus: Record<SessionStatus, number> = {
      active: 0,
      paused: 0,
      completed: 0,
      abandoned: 0,
    };

    let totalDuration = 0;
    let totalSatisfaction = 0;
    let satisfactionCount = 0;

    for (const session of sessions) {
      byStatus[session.metadata.status]++;
      totalDuration += session.metrics.duration;

      if (session.metrics.satisfactionScore !== undefined) {
        totalSatisfaction += session.metrics.satisfactionScore;
        satisfactionCount++;
      }
    }

    return {
      total: sessions.length,
      byStatus,
      avgDuration: sessions.length > 0 ? Math.round(totalDuration / sessions.length) : 0,
      avgSatisfaction: satisfactionCount > 0 ? Math.round((totalSatisfaction / satisfactionCount) * 10) / 10 : 0,
    };
  }
}
