/**
 * クライアント情報データベース
 * 企業プロファイル、課題履歴、対話ログの管理
 */

import {
  ClientProfile,
  Challenge,
  DialogSession,
  Message,
  Insight,
  CompanySize,
  ChallengeCategory,
  ChallengeStatus,
  SessionStatus,
  InsightType,
} from './types.js';

/**
 * クライアントデータベースクラス
 */
export class ClientDatabase {
  private clients: Map<string, ClientProfile>;
  private sessions: Map<string, DialogSession>;

  constructor() {
    this.clients = new Map();
    this.sessions = new Map();
  }

  /**
   * クライアント登録
   */
  async createClient(
    data: Omit<ClientProfile, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ClientProfile> {
    const id = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const client: ClientProfile = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.clients.set(id, client);
    return client;
  }

  /**
   * クライアント取得
   */
  async getClient(id: string): Promise<ClientProfile | undefined> {
    return this.clients.get(id);
  }

  /**
   * クライアント一覧取得
   */
  async getAllClients(): Promise<ClientProfile[]> {
    return Array.from(this.clients.values());
  }

  /**
   * クライアント情報更新
   */
  async updateClient(
    id: string,
    updates: Partial<Omit<ClientProfile, 'id' | 'createdAt'>>
  ): Promise<ClientProfile> {
    const client = this.clients.get(id);
    if (!client) {
      throw new Error(`Client not found: ${id}`);
    }

    const updated: ClientProfile = {
      ...client,
      ...updates,
      updatedAt: new Date(),
    };

    this.clients.set(id, updated);
    return updated;
  }

  /**
   * 課題追加
   */
  async addChallenge(clientId: string, challenge: Challenge): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    client.challenges.push(challenge);
    client.updatedAt = new Date();
    this.clients.set(clientId, client);
  }

  /**
   * 課題更新
   */
  async updateChallenge(
    clientId: string,
    challengeId: string,
    updates: Partial<Challenge>
  ): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const challengeIndex = client.challenges.findIndex((c) => c.id === challengeId);
    if (challengeIndex === -1) {
      throw new Error(`Challenge not found: ${challengeId}`);
    }

    client.challenges[challengeIndex] = {
      ...client.challenges[challengeIndex],
      ...updates,
    };

    client.updatedAt = new Date();
    this.clients.set(clientId, client);
  }

  /**
   * クライアントの課題一覧取得
   */
  async getClientChallenges(
    clientId: string,
    filters?: {
      category?: ChallengeCategory;
      status?: ChallengeStatus;
    }
  ): Promise<Challenge[]> {
    const client = this.clients.get(clientId);
    if (!client) {
      return [];
    }

    let challenges = client.challenges;

    if (filters?.category) {
      challenges = challenges.filter((c) => c.category === filters.category);
    }

    if (filters?.status) {
      challenges = challenges.filter((c) => c.status === filters.status);
    }

    return challenges;
  }

  /**
   * 対話セッション作成
   */
  async createSession(
    clientId: string,
    avatarId: string
  ): Promise<DialogSession> {
    const client = this.clients.get(clientId);
    if (!client) {
      throw new Error(`Client not found: ${clientId}`);
    }

    const id = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: DialogSession = {
      id,
      clientId,
      avatarId,
      messages: [],
      insights: [],
      startedAt: new Date(),
      status: 'active',
    };

    this.sessions.set(id, session);

    // クライアントの対話履歴に追加
    client.dialogHistory.push(session);
    client.updatedAt = new Date();
    this.clients.set(clientId, client);

    return session;
  }

  /**
   * セッション取得
   */
  async getSession(sessionId: string): Promise<DialogSession | undefined> {
    return this.sessions.get(sessionId);
  }

  /**
   * クライアントのセッション一覧取得
   */
  async getClientSessions(
    clientId: string,
    status?: SessionStatus
  ): Promise<DialogSession[]> {
    const client = this.clients.get(clientId);
    if (!client) {
      return [];
    }

    let sessions = client.dialogHistory;

    if (status) {
      sessions = sessions.filter((s) => s.status === status);
    }

    return sessions;
  }

  /**
   * メッセージ追加
   */
  async addMessage(sessionId: string, message: Message): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.messages.push(message);
    this.sessions.set(sessionId, session);

    // クライアント側も更新
    const client = this.clients.get(session.clientId);
    if (client) {
      const sessionIndex = client.dialogHistory.findIndex((s) => s.id === sessionId);
      if (sessionIndex !== -1) {
        client.dialogHistory[sessionIndex] = session;
        client.updatedAt = new Date();
        this.clients.set(client.id, client);
      }
    }
  }

  /**
   * インサイト追加
   */
  async addInsight(sessionId: string, insight: Insight): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.insights.push(insight);
    this.sessions.set(sessionId, session);

    // クライアント側も更新
    const client = this.clients.get(session.clientId);
    if (client) {
      const sessionIndex = client.dialogHistory.findIndex((s) => s.id === sessionId);
      if (sessionIndex !== -1) {
        client.dialogHistory[sessionIndex] = session;
        client.updatedAt = new Date();
        this.clients.set(client.id, client);
      }
    }
  }

  /**
   * セッション終了
   */
  async closeSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session not found: ${sessionId}`);
    }

    session.status = 'completed';
    session.endedAt = new Date();
    this.sessions.set(sessionId, session);

    // クライアント側も更新
    const client = this.clients.get(session.clientId);
    if (client) {
      const sessionIndex = client.dialogHistory.findIndex((s) => s.id === sessionId);
      if (sessionIndex !== -1) {
        client.dialogHistory[sessionIndex] = session;
        client.updatedAt = new Date();
        this.clients.set(client.id, client);
      }
    }
  }

  /**
   * 業界別クライアント取得
   */
  async getClientsByIndustry(industry: string): Promise<ClientProfile[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.industry === industry
    );
  }

  /**
   * 企業規模別クライアント取得
   */
  async getClientsBySize(size: CompanySize): Promise<ClientProfile[]> {
    return Array.from(this.clients.values()).filter(
      (client) => client.size === size
    );
  }

  /**
   * インサイトタイプ別取得
   */
  async getInsightsByType(
    sessionId: string,
    type: InsightType
  ): Promise<Insight[]> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return [];
    }

    return session.insights.filter((insight) => insight.type === type);
  }

  /**
   * 統計情報取得
   */
  async getStats(): Promise<{
    totalClients: number;
    totalSessions: number;
    activeSessions: number;
    totalChallenges: number;
    totalInsights: number;
    industryDistribution: Record<string, number>;
    sizeDistribution: Record<CompanySize, number>;
  }> {
    const clients = Array.from(this.clients.values());
    const sessions = Array.from(this.sessions.values());

    const industryDistribution: Record<string, number> = {};
    const sizeDistribution: Record<CompanySize, number> = {
      startup: 0,
      small: 0,
      medium: 0,
      large: 0,
      enterprise: 0,
    };

    let totalChallenges = 0;
    let totalInsights = 0;

    clients.forEach((client) => {
      // 業界分布
      industryDistribution[client.industry] =
        (industryDistribution[client.industry] || 0) + 1;

      // 規模分布
      sizeDistribution[client.size]++;

      // 課題数
      totalChallenges += client.challenges.length;
    });

    sessions.forEach((session) => {
      totalInsights += session.insights.length;
    });

    return {
      totalClients: clients.length,
      totalSessions: sessions.length,
      activeSessions: sessions.filter((s) => s.status === 'active').length,
      totalChallenges,
      totalInsights,
      industryDistribution,
      sizeDistribution,
    };
  }
}

// シングルトンインスタンス
let clientDbInstance: ClientDatabase | null = null;

/**
 * クライアントデータベースインスタンス取得
 */
export function getClientDatabase(): ClientDatabase {
  if (!clientDbInstance) {
    clientDbInstance = new ClientDatabase();
  }
  return clientDbInstance;
}
