/**
 * セッションエンジン
 * 合同セッション管理・進行・要約生成
 */

import type {
  SessionMetadata,
  JointSession,
  SessionType,
  SessionStatus,
  Participant,
  ParticipantRole,
  AgendaItem,
  Turn,
  Decision,
  ActionItem,
  SessionSummary,
  SessionTemplate,
  TurnManagementConfig,
  Reaction,
} from './types.js';

export class SessionEngine {
  private sessions: Map<string, JointSession> = new Map();
  private templates: Map<string, SessionTemplate> = new Map();
  private turnConfig: TurnManagementConfig;

  constructor() {
    this.initializeDefaultTemplates();
    this.turnConfig = {
      maxTurnDuration: 180,
      turnOrder: 'raise-hand',
      allowInterruptions: false,
      requireAcknowledgment: true,
    };
  }

  private initializeDefaultTemplates(): void {
    this.templates.set('strategy-session', {
      id: 'strategy-session',
      type: 'strategy',
      name: '戦略策定セッション',
      defaultDuration: 90,
      suggestedParticipants: ['senryaku', 'shijo', 'eigyo'],
      defaultAgenda: [
        { order: 1, topic: '現状分析共有', duration: 20, lead: 'hiraku', expectedOutcome: '現状の共通認識' },
        { order: 2, topic: '市場環境分析', duration: 20, lead: 'shijo', expectedOutcome: '市場機会の特定' },
        { order: 3, topic: '戦略オプション検討', duration: 30, lead: 'senryaku', expectedOutcome: '戦略候補の絞り込み' },
        { order: 4, topic: 'アクションプラン策定', duration: 20, lead: 'senryaku', expectedOutcome: '具体的なアクション決定' },
      ],
      groundRules: [
        '発言は簡潔に、データに基づいて',
        '否定より代替案を提示',
        '全員の意見を尊重',
        'タイムボックスを守る',
      ],
    });

    this.templates.set('problem-solving', {
      id: 'problem-solving',
      type: 'problem-solving',
      name: '問題解決セッション',
      defaultDuration: 60,
      suggestedParticipants: ['hiraku', 'senryaku', 'kanri'],
      defaultAgenda: [
        { order: 1, topic: '問題の定義と共有', duration: 10, lead: 'hiraku', expectedOutcome: '問題の明確化' },
        { order: 2, topic: '原因分析', duration: 15, lead: 'hiraku', expectedOutcome: '根本原因の特定' },
        { order: 3, topic: '解決策のブレインストーミング', duration: 20, lead: 'senryaku', expectedOutcome: '解決策候補リスト' },
        { order: 4, topic: '解決策の評価と選択', duration: 15, lead: 'senryaku', expectedOutcome: '採用する解決策の決定' },
      ],
      groundRules: [
        'ブレインストーミング中は批判禁止',
        '量より質を重視しない段階と重視する段階を分ける',
        '全員参加',
      ],
    });

    this.templates.set('crisis-response', {
      id: 'crisis-response',
      type: 'crisis',
      name: '危機対応セッション',
      defaultDuration: 45,
      suggestedParticipants: ['senryaku', 'kanri', 'eigyo'],
      defaultAgenda: [
        { order: 1, topic: '状況確認', duration: 5, lead: 'kanri', expectedOutcome: '現状把握' },
        { order: 2, topic: '影響範囲の特定', duration: 10, lead: 'senryaku', expectedOutcome: '影響範囲の明確化' },
        { order: 3, topic: '即時対応策の決定', duration: 15, lead: 'senryaku', expectedOutcome: '緊急対応策の合意' },
        { order: 4, topic: '役割分担と実行', duration: 15, lead: 'kanri', expectedOutcome: '担当者と期限の決定' },
      ],
      groundRules: [
        '事実ベースで議論',
        '迅速な意思決定',
        '責任の明確化',
      ],
    });
  }

  generateSessionId(): string {
    return `ses-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateItemId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
  }

  createSession(
    type: SessionType,
    clientId: string,
    title: string,
    description: string,
    scheduledAt: Date,
    facilitator: string,
    participants: { avatarId: string; role: ParticipantRole; expertise: string[] }[],
    customAgenda?: Omit<AgendaItem, 'id' | 'status' | 'notes'>[]
  ): JointSession {
    const template = Array.from(this.templates.values()).find(t => t.type === type);
    const agenda = (customAgenda ?? template?.defaultAgenda ?? []).map((item, index) => ({
      ...item,
      id: this.generateItemId('agd'),
      status: 'pending' as const,
      notes: [],
    }));

    const session: JointSession = {
      metadata: {
        sessionId: this.generateSessionId(),
        type,
        clientId,
        title,
        description,
        scheduledAt,
        status: 'scheduled',
        facilitator,
      },
      participants: participants.map(p => ({
        ...p,
        contributionCount: 0,
        active: true,
      })),
      agenda,
      objectives: [],
      groundRules: template?.groundRules ?? [],
      currentAgendaIndex: 0,
      turns: [],
      decisions: [],
      actionItems: [],
    };

    this.sessions.set(session.metadata.sessionId, session);
    return session;
  }

  startSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'scheduled') return false;

    session.metadata.status = 'in-progress';
    session.metadata.startedAt = new Date();

    // Mark first agenda item as in-progress
    if (session.agenda.length > 0) {
      session.agenda[0].status = 'in-progress';
    }

    // Mark all participants as joined
    for (const participant of session.participants) {
      participant.joinedAt = new Date();
    }

    return true;
  }

  addTurn(
    sessionId: string,
    speakerId: string,
    type: Turn['type'],
    content: string,
    referencedTurnId?: string
  ): Turn | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'in-progress') return null;

    const participant = session.participants.find(p => p.avatarId === speakerId);
    if (!participant) return null;

    const turn: Turn = {
      id: this.generateItemId('trn'),
      timestamp: new Date(),
      speakerId,
      type,
      content,
      referencedTurnId,
      reactions: [],
    };

    session.turns.push(turn);
    participant.contributionCount++;

    return turn;
  }

  addReaction(sessionId: string, turnId: string, avatarId: string, reactionType: Reaction['type']): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    const turn = session.turns.find(t => t.id === turnId);
    if (!turn) return false;

    turn.reactions.push({
      avatarId,
      type: reactionType,
      timestamp: new Date(),
    });

    return true;
  }

  advanceAgenda(sessionId: string): AgendaItem | null {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'in-progress') return null;

    const currentItem = session.agenda[session.currentAgendaIndex];
    if (currentItem) {
      currentItem.status = 'completed';
      currentItem.actualDuration = this.calculateAgendaItemDuration(session, session.currentAgendaIndex);
    }

    session.currentAgendaIndex++;

    if (session.currentAgendaIndex < session.agenda.length) {
      const nextItem = session.agenda[session.currentAgendaIndex];
      nextItem.status = 'in-progress';
      return nextItem;
    }

    return null;
  }

  private calculateAgendaItemDuration(session: JointSession, agendaIndex: number): number {
    // Simplified calculation based on turns
    const agendaStartIndex = session.turns.findIndex((t, i) => {
      // Find first turn after previous agenda items
      return i >= agendaIndex * 5; // Rough estimate
    });
    return session.agenda[agendaIndex].duration; // Return planned duration as placeholder
  }

  recordDecision(
    sessionId: string,
    topic: string,
    decision: string,
    rationale: string,
    madeBy: string[],
    abstained: string[] = [],
    opposed: string[] = []
  ): Decision | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const decisionRecord: Decision = {
      id: this.generateItemId('dec'),
      topic,
      decision,
      rationale,
      madeBy,
      abstained,
      opposed,
      timestamp: new Date(),
      status: opposed.length > 0 ? 'tentative' : 'confirmed',
    };

    session.decisions.push(decisionRecord);
    return decisionRecord;
  }

  addActionItem(
    sessionId: string,
    action: string,
    assignee: string,
    deadline: Date,
    priority: ActionItem['priority'] = 'medium',
    relatedDecisionId?: string
  ): ActionItem | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    const actionItem: ActionItem = {
      id: this.generateItemId('act'),
      action,
      assignee,
      deadline,
      priority,
      status: 'assigned',
      relatedDecisionId,
      notes: [],
    };

    session.actionItems.push(actionItem);
    return actionItem;
  }

  pauseSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'in-progress') return false;

    session.metadata.status = 'paused';
    return true;
  }

  resumeSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || session.metadata.status !== 'paused') return false;

    session.metadata.status = 'in-progress';
    return true;
  }

  endSession(sessionId: string): SessionSummary | null {
    const session = this.sessions.get(sessionId);
    if (!session || !['in-progress', 'paused'].includes(session.metadata.status)) return null;

    session.metadata.status = 'completed';
    session.metadata.endedAt = new Date();

    // Mark remaining agenda items as skipped
    for (let i = session.currentAgendaIndex; i < session.agenda.length; i++) {
      if (session.agenda[i].status === 'pending') {
        session.agenda[i].status = 'skipped';
      }
    }

    // Generate summary
    const summary = this.generateSummary(session);
    session.summary = summary;

    return summary;
  }

  private generateSummary(session: JointSession): SessionSummary {
    const startTime = session.metadata.startedAt ?? new Date();
    const endTime = session.metadata.endedAt ?? new Date();
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / (1000 * 60));

    const completedAgendaItems = session.agenda.filter(a => a.status === 'completed').length;
    const totalAgendaItems = session.agenda.length;
    const completionRate = totalAgendaItems > 0 ? completedAgendaItems / totalAgendaItems : 0;

    let assessment: SessionSummary['overallAssessment'];
    if (completionRate >= 0.9 && session.decisions.length >= 2) {
      assessment = 'highly-productive';
    } else if (completionRate >= 0.7 && session.decisions.length >= 1) {
      assessment = 'productive';
    } else if (completionRate >= 0.5) {
      assessment = 'moderate';
    } else {
      assessment = 'needs-improvement';
    }

    return {
      generatedAt: new Date(),
      duration,
      participantCount: session.participants.length,
      keyDiscussions: session.agenda.filter(a => a.status === 'completed').map(a => a.topic),
      decisionsCount: session.decisions.length,
      actionItemsCount: session.actionItems.length,
      outcomes: session.decisions.map(d => d.decision),
      nextSteps: session.actionItems.map(a => `${a.action} (担当: ${a.assignee})`),
      overallAssessment: assessment,
    };
  }

  getSession(sessionId: string): JointSession | undefined {
    return this.sessions.get(sessionId);
  }

  getSessionsByClient(clientId: string): JointSession[] {
    return Array.from(this.sessions.values()).filter(s => s.metadata.clientId === clientId);
  }

  getSessionsByParticipant(avatarId: string): JointSession[] {
    return Array.from(this.sessions.values()).filter(
      s => s.participants.some(p => p.avatarId === avatarId)
    );
  }

  getUpcomingSessions(avatarId?: string): JointSession[] {
    const now = new Date();
    return Array.from(this.sessions.values()).filter(s => {
      if (s.metadata.status !== 'scheduled') return false;
      if (s.metadata.scheduledAt <= now) return false;
      if (avatarId && !s.participants.some(p => p.avatarId === avatarId)) return false;
      return true;
    }).sort((a, b) => a.metadata.scheduledAt.getTime() - b.metadata.scheduledAt.getTime());
  }

  getTemplate(templateId: string): SessionTemplate | undefined {
    return this.templates.get(templateId);
  }

  getAllTemplates(): SessionTemplate[] {
    return Array.from(this.templates.values());
  }

  setTurnConfig(config: Partial<TurnManagementConfig>): void {
    this.turnConfig = { ...this.turnConfig, ...config };
  }

  getTurnConfig(): TurnManagementConfig {
    return { ...this.turnConfig };
  }
}
