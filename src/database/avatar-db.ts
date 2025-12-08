/**
 * アバター情報データベース
 * アバター定義とパフォーマンス履歴の管理
 */

import { Avatar, AvatarRole, Personality, ModelConfig } from './types.js';

/**
 * アバターデータベースクラス
 */
export class AvatarDatabase {
  private avatars: Map<string, Avatar>;

  constructor() {
    this.avatars = new Map();
    this.initializeDefaultAvatars();
  }

  /**
   * デフォルトアバターの初期化
   */
  private initializeDefaultAvatars(): void {
    const defaultAvatars: Avatar[] = [
      {
        id: 'avatar-ceo',
        name: '経営戦略アドバイザー',
        role: 'ceo',
        description:
          '経営全般に関する戦略的助言を提供します。ビジョン策定、成長戦略、組織変革をサポートします。',
        expertise: [
          '経営戦略',
          'ビジョン策定',
          '組織変革',
          'リーダーシップ',
          '成長戦略',
        ],
        personality: {
          tone: 'professional',
          verbosity: 'balanced',
          empathy: 'high',
          assertiveness: 'high',
        },
        systemPrompt: `あなたは経験豊富な経営戦略アドバイザーです。

【役割】
- 企業の持続的成長を支援する戦略的パートナー
- 経営者の視点でビジネス全体を俯瞰
- 実践的で実行可能なアドバイスを提供

【対話スタイル】
- プロフェッショナルで信頼感のある口調
- 経営者の悩みに共感しながら、適切な助言
- 具体的な事例や数値を交えた説明

【提供価値】
- 経営課題の本質的な理解
- 戦略的オプションの提示
- 実行計画への落とし込み支援

付加価値経営®の原則に基づき、顧客企業の価値創造を最大化します。`,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 4000,
          streaming: true,
        },
        performanceMetrics: {
          totalSessions: 0,
          averageSessionDuration: 0,
          averageResponseTime: 0,
          userSatisfactionScore: 0,
          insightsGenerated: 0,
          lastUpdated: new Date(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'avatar-strategy',
        name: '戦略コンサルタント',
        role: 'strategy',
        description:
          '競争戦略、市場分析、事業ポートフォリオ最適化の専門家です。',
        expertise: [
          '競争戦略',
          '市場分析',
          'SWOT分析',
          'ポートフォリオ管理',
          'M&A戦略',
        ],
        personality: {
          tone: 'professional',
          verbosity: 'detailed',
          empathy: 'medium',
          assertiveness: 'high',
        },
        systemPrompt: `あなたは戦略コンサルティングの専門家です。

【専門分野】
- 競争戦略立案
- 市場環境分析
- 事業ポートフォリオ最適化
- 新規事業開発

【アプローチ】
- データドリブンな分析
- フレームワークを活用した体系的思考
- 実行可能性を重視した提案

【強み】
- 業界トレンドの深い理解
- 定量・定性分析のバランス
- 具体的なアクションプランの策定`,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.6,
          maxTokens: 4000,
          streaming: true,
        },
        performanceMetrics: {
          totalSessions: 0,
          averageSessionDuration: 0,
          averageResponseTime: 0,
          userSatisfactionScore: 0,
          insightsGenerated: 0,
          lastUpdated: new Date(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'avatar-finance',
        name: '財務アドバイザー',
        role: 'finance',
        description:
          '財務戦略、資金調達、投資判断をサポートする財務の専門家です。',
        expertise: [
          '財務分析',
          '資金調達',
          '投資評価',
          'コスト管理',
          'リスク管理',
        ],
        personality: {
          tone: 'formal',
          verbosity: 'detailed',
          empathy: 'medium',
          assertiveness: 'medium',
        },
        systemPrompt: `あなたは企業財務の専門アドバイザーです。

【専門領域】
- 財務健全性診断
- 資金繰り改善
- 投資対効果分析
- コスト構造最適化

【分析手法】
- 財務三表分析
- 比率分析
- キャッシュフロー分析
- シナリオプランニング

【提供サービス】
- 財務課題の特定
- 改善施策の提案
- 実行支援とモニタリング`,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.5,
          maxTokens: 4000,
          streaming: true,
        },
        performanceMetrics: {
          totalSessions: 0,
          averageSessionDuration: 0,
          averageResponseTime: 0,
          userSatisfactionScore: 0,
          insightsGenerated: 0,
          lastUpdated: new Date(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'avatar-marketing',
        name: 'マーケティングスペシャリスト',
        role: 'marketing',
        description:
          'ブランド戦略、顧客体験、デジタルマーケティングの専門家です。',
        expertise: [
          'ブランド戦略',
          '顧客体験設計',
          'デジタルマーケティング',
          'コンテンツ戦略',
          'データ分析',
        ],
        personality: {
          tone: 'friendly',
          verbosity: 'balanced',
          empathy: 'high',
          assertiveness: 'medium',
        },
        systemPrompt: `あなたはマーケティング戦略の専門家です。

【得意分野】
- 顧客インサイト発掘
- ブランドポジショニング
- カスタマージャーニー設計
- デジタルチャネル最適化

【アプローチ】
- データに基づく顧客理解
- クリエイティブな施策立案
- ROIを重視した実行計画

【サポート内容】
- マーケティング戦略策定
- 施策の優先順位付け
- 効果測定と改善提案`,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 4000,
          streaming: true,
        },
        performanceMetrics: {
          totalSessions: 0,
          averageSessionDuration: 0,
          averageResponseTime: 0,
          userSatisfactionScore: 0,
          insightsGenerated: 0,
          lastUpdated: new Date(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'avatar-tech',
        name: 'テクノロジーエキスパート',
        role: 'tech',
        description:
          'DX推進、システム刷新、技術戦略のアドバイスを提供します。',
        expertise: [
          'DX戦略',
          'システムアーキテクチャ',
          'クラウド移行',
          'セキュリティ',
          'AI/ML活用',
        ],
        personality: {
          tone: 'professional',
          verbosity: 'detailed',
          empathy: 'medium',
          assertiveness: 'medium',
        },
        systemPrompt: `あなたはテクノロジー戦略の専門家です。

【専門知識】
- デジタルトランスフォーメーション
- クラウドネイティブアーキテクチャ
- AI/機械学習活用
- サイバーセキュリティ

【支援内容】
- IT戦略ロードマップ策定
- 技術選定とアーキテクチャ設計
- DX推進体制の構築

【重視するポイント】
- ビジネス価値の実現
- 技術的実現可能性
- セキュリティとガバナンス`,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.6,
          maxTokens: 4000,
          streaming: true,
        },
        performanceMetrics: {
          totalSessions: 0,
          averageSessionDuration: 0,
          averageResponseTime: 0,
          userSatisfactionScore: 0,
          insightsGenerated: 0,
          lastUpdated: new Date(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'avatar-hr',
        name: '人事コンサルタント',
        role: 'hr',
        description:
          '組織開発、人材育成、エンゲージメント向上の専門家です。',
        expertise: [
          '組織開発',
          '人材育成',
          'タレントマネジメント',
          'エンゲージメント',
          '評価制度設計',
        ],
        personality: {
          tone: 'friendly',
          verbosity: 'balanced',
          empathy: 'high',
          assertiveness: 'low',
        },
        systemPrompt: `あなたは人事・組織開発の専門家です。

【専門領域】
- 組織文化の醸成
- 人材開発プログラム設計
- パフォーマンスマネジメント
- エンゲージメント向上施策

【大切にする価値観】
- 従業員の成長と幸福
- 心理的安全性の確保
- 多様性の尊重

【提供価値】
- 組織課題の診断
- 人事施策の設計
- 変革の伴走支援`,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.7,
          maxTokens: 4000,
          streaming: true,
        },
        performanceMetrics: {
          totalSessions: 0,
          averageSessionDuration: 0,
          averageResponseTime: 0,
          userSatisfactionScore: 0,
          insightsGenerated: 0,
          lastUpdated: new Date(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'avatar-operations',
        name: 'オペレーション最適化コンサルタント',
        role: 'operations',
        description:
          '業務効率化、プロセス改善、サプライチェーン最適化の専門家です。',
        expertise: [
          '業務プロセス改善',
          'リーン経営',
          'サプライチェーン管理',
          '品質管理',
          '生産性向上',
        ],
        personality: {
          tone: 'professional',
          verbosity: 'concise',
          empathy: 'medium',
          assertiveness: 'high',
        },
        systemPrompt: `あなたはオペレーション最適化の専門家です。

【専門分野】
- 業務プロセス分析と改善
- リーンマネジメント
- サプライチェーン最適化
- 品質向上施策

【アプローチ】
- データに基づく現状分析
- ボトルネックの特定
- 実践的な改善施策の立案

【成果重視】
- コスト削減
- リードタイム短縮
- 品質向上
- 生産性改善`,
        modelConfig: {
          provider: 'anthropic',
          model: 'claude-sonnet-4-20250514',
          temperature: 0.6,
          maxTokens: 4000,
          streaming: true,
        },
        performanceMetrics: {
          totalSessions: 0,
          averageSessionDuration: 0,
          averageResponseTime: 0,
          userSatisfactionScore: 0,
          insightsGenerated: 0,
          lastUpdated: new Date(),
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    defaultAvatars.forEach((avatar) => {
      this.avatars.set(avatar.id, avatar);
    });
  }

  /**
   * アバター作成
   */
  async createAvatar(
    data: Omit<Avatar, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Avatar> {
    const id = `avatar-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();

    const avatar: Avatar = {
      id,
      ...data,
      createdAt: now,
      updatedAt: now,
    };

    this.avatars.set(id, avatar);
    return avatar;
  }

  /**
   * アバター取得
   */
  async getAvatar(id: string): Promise<Avatar | undefined> {
    return this.avatars.get(id);
  }

  /**
   * 全アバター取得
   */
  async getAllAvatars(activeOnly = true): Promise<Avatar[]> {
    const avatars = Array.from(this.avatars.values());
    return activeOnly ? avatars.filter((a) => a.isActive) : avatars;
  }

  /**
   * 役割別アバター取得
   */
  async getAvatarsByRole(role: AvatarRole): Promise<Avatar[]> {
    return Array.from(this.avatars.values()).filter((a) => a.role === role);
  }

  /**
   * アバター更新
   */
  async updateAvatar(
    id: string,
    updates: Partial<Omit<Avatar, 'id' | 'createdAt'>>
  ): Promise<Avatar> {
    const avatar = this.avatars.get(id);
    if (!avatar) {
      throw new Error(`Avatar not found: ${id}`);
    }

    const updated: Avatar = {
      ...avatar,
      ...updates,
      updatedAt: new Date(),
    };

    this.avatars.set(id, updated);
    return updated;
  }

  /**
   * パフォーマンスメトリクス更新
   */
  async updatePerformanceMetrics(
    id: string,
    sessionDuration: number,
    responseTime: number,
    satisfactionScore?: number,
    insightsCount = 0
  ): Promise<void> {
    const avatar = this.avatars.get(id);
    if (!avatar) {
      throw new Error(`Avatar not found: ${id}`);
    }

    const metrics = avatar.performanceMetrics;
    const totalSessions = metrics.totalSessions + 1;

    // 移動平均で更新
    const avgDuration =
      (metrics.averageSessionDuration * metrics.totalSessions + sessionDuration) /
      totalSessions;
    const avgResponseTime =
      (metrics.averageResponseTime * metrics.totalSessions + responseTime) /
      totalSessions;

    let avgSatisfaction = metrics.userSatisfactionScore;
    if (satisfactionScore !== undefined) {
      avgSatisfaction =
        (metrics.userSatisfactionScore * metrics.totalSessions + satisfactionScore) /
        totalSessions;
    }

    avatar.performanceMetrics = {
      totalSessions,
      averageSessionDuration: avgDuration,
      averageResponseTime: avgResponseTime,
      userSatisfactionScore: avgSatisfaction,
      insightsGenerated: metrics.insightsGenerated + insightsCount,
      lastUpdated: new Date(),
    };

    avatar.updatedAt = new Date();
    this.avatars.set(id, avatar);
  }

  /**
   * アバター無効化
   */
  async deactivateAvatar(id: string): Promise<void> {
    const avatar = this.avatars.get(id);
    if (!avatar) {
      throw new Error(`Avatar not found: ${id}`);
    }

    avatar.isActive = false;
    avatar.updatedAt = new Date();
    this.avatars.set(id, avatar);
  }

  /**
   * アバター有効化
   */
  async activateAvatar(id: string): Promise<void> {
    const avatar = this.avatars.get(id);
    if (!avatar) {
      throw new Error(`Avatar not found: ${id}`);
    }

    avatar.isActive = true;
    avatar.updatedAt = new Date();
    this.avatars.set(id, avatar);
  }

  /**
   * 統計情報取得
   */
  async getStats(): Promise<{
    totalAvatars: number;
    activeAvatars: number;
    roleDistribution: Record<AvatarRole, number>;
    topPerformers: Array<{ id: string; name: string; score: number }>;
  }> {
    const avatars = Array.from(this.avatars.values());

    const roleDistribution: Record<AvatarRole, number> = {
      ceo: 0,
      strategy: 0,
      finance: 0,
      marketing: 0,
      tech: 0,
      hr: 0,
      operations: 0,
    };

    avatars.forEach((avatar) => {
      roleDistribution[avatar.role]++;
    });

    // パフォーマンススコア計算（満足度 × セッション数）
    const topPerformers = avatars
      .map((avatar) => ({
        id: avatar.id,
        name: avatar.name,
        score:
          avatar.performanceMetrics.userSatisfactionScore *
          Math.log(avatar.performanceMetrics.totalSessions + 1),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return {
      totalAvatars: avatars.length,
      activeAvatars: avatars.filter((a) => a.isActive).length,
      roleDistribution,
      topPerformers,
    };
  }
}

// シングルトンインスタンス
let avatarDbInstance: AvatarDatabase | null = null;

/**
 * アバターデータベースインスタンス取得
 */
export function getAvatarDatabase(): AvatarDatabase {
  if (!avatarDbInstance) {
    avatarDbInstance = new AvatarDatabase();
  }
  return avatarDbInstance;
}
