/**
 * 統廃合エンジン
 *
 * 非効率なアバターの分析・統合・廃止を管理
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AvatarMetrics,
  ConsolidationCandidate,
  MergeProposal,
  DeprecationPlan,
  ConsolidationReport,
  ImpactAssessment,
  MergeStrategy,
  Risk,
  ReportSummary,
  UsageMetrics,
  EffectivenessMetrics,
  CostMetrics,
} from './types.js';

export class ConsolidationEngine {
  private anthropic: Anthropic;
  private metricsCache: Map<string, AvatarMetrics>;
  private candidates: Map<string, ConsolidationCandidate>;
  private proposals: Map<string, MergeProposal>;
  private deprecations: Map<string, DeprecationPlan>;

  // 閾値設定
  private readonly USAGE_THRESHOLD = 10; // 最小セッション数
  private readonly EFFECTIVENESS_THRESHOLD = 60; // 最小効果スコア
  private readonly SIMILARITY_THRESHOLD = 0.7; // 統合検討の類似度閾値

  constructor() {
    this.anthropic = new Anthropic();
    this.metricsCache = new Map();
    this.candidates = new Map();
    this.proposals = new Map();
    this.deprecations = new Map();
  }

  /**
   * アバターメトリクスを収集
   */
  async collectMetrics(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<AvatarMetrics> {
    // 実際の実装ではDBやログから収集
    const usage = await this.collectUsageMetrics(avatarId, period);
    const effectiveness = await this.collectEffectivenessMetrics(avatarId, period);
    const cost = await this.collectCostMetrics(avatarId, period);

    const overallScore = this.calculateOverallScore(usage, effectiveness, cost);

    const metrics: AvatarMetrics = {
      avatarId,
      avatarName: `アバター-${avatarId}`,
      period,
      usage,
      effectiveness,
      cost,
      overallScore,
    };

    this.metricsCache.set(avatarId, metrics);
    return metrics;
  }

  /**
   * 統廃合候補を検出
   */
  async detectCandidates(metrics: AvatarMetrics[]): Promise<ConsolidationCandidate[]> {
    const candidates: ConsolidationCandidate[] = [];

    // 低利用率アバターを検出
    const underusedAvatars = metrics.filter(m =>
      m.usage.totalSessions < this.USAGE_THRESHOLD
    );

    for (const avatar of underusedAvatars) {
      candidates.push(this.createDeprecationCandidate(avatar));
    }

    // 低効果アバターを検出
    const ineffectiveAvatars = metrics.filter(m =>
      m.effectiveness.qualityScore < this.EFFECTIVENESS_THRESHOLD &&
      m.usage.totalSessions >= this.USAGE_THRESHOLD
    );

    for (const avatar of ineffectiveAvatars) {
      candidates.push(this.createImprovementCandidate(avatar));
    }

    // 類似アバターを検出
    const similarPairs = await this.detectSimilarAvatars(metrics);
    for (const pair of similarPairs) {
      candidates.push(this.createMergeCandidate(pair));
    }

    // 候補をキャッシュ
    for (const candidate of candidates) {
      this.candidates.set(candidate.candidateId, candidate);
    }

    return candidates;
  }

  /**
   * 統合提案を作成
   */
  async createMergeProposal(
    sourceAvatarIds: string[]
  ): Promise<MergeProposal> {
    const proposalId = `merge-${Date.now()}`;

    // ターゲットアバター仕様を生成
    const targetSpec = await this.generateMergedSpec(sourceAvatarIds);

    // 統合戦略を決定
    const strategy = this.determineMergeStrategy(sourceAvatarIds);

    // タイムラインを作成
    const timeline = this.createMergeTimeline(strategy);

    // リスク分析
    const risks = await this.analyzeRisks(sourceAvatarIds, strategy);

    const proposal: MergeProposal = {
      proposalId,
      sourceAvatars: sourceAvatarIds,
      targetAvatar: targetSpec,
      mergeStrategy: strategy,
      timeline,
      risks,
      status: 'draft',
    };

    this.proposals.set(proposalId, proposal);
    return proposal;
  }

  /**
   * 廃止計画を作成
   */
  async createDeprecationPlan(
    avatarId: string,
    reason: string
  ): Promise<DeprecationPlan> {
    const planId = `deprecation-${Date.now()}`;

    const now = new Date();
    const announcement = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1週間後
    const deprecation = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1ヶ月後
    const sunset = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000); // 2ヶ月後

    const plan: DeprecationPlan = {
      planId,
      avatarId,
      reason,
      timeline: {
        announcementDate: announcement,
        deprecationDate: deprecation,
        sunsetDate: sunset,
        gracePeriod: 30,
      },
      migration: {
        targetAvatar: await this.findReplacementAvatar(avatarId),
        dataTransfer: [
          { dataType: 'conversation_history', source: avatarId, destination: 'archive' },
          { dataType: 'user_preferences', source: avatarId, destination: 'replacement' },
        ],
        userNotification: {
          channels: ['email', 'in-app'],
          frequency: 'weekly',
          templates: {
            initial: '${avatarName}は${deprecationDate}に廃止予定です。',
            reminder: '${avatarName}の廃止まであと${daysRemaining}日です。',
            final: '${avatarName}は本日廃止されました。',
          },
        },
        fallbackBehavior: '別のアバターにリダイレクトします。',
      },
      communication: {
        stakeholders: ['users', 'admins', 'support'],
        messages: [
          {
            audience: 'users',
            subject: 'サービス変更のお知らせ',
            content: 'ご利用のアバターが統合されます。',
            channel: 'email',
          },
        ],
        schedule: [],
      },
      status: 'draft',
    };

    this.deprecations.set(planId, plan);
    return plan;
  }

  /**
   * 影響評価を実行
   */
  async assessImpact(
    candidateId: string
  ): Promise<ImpactAssessment> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new Error('候補が見つかりません');
    }

    // 影響を受けるユーザー数を計算
    let affectedUsers = 0;
    for (const avatarId of candidate.avatars) {
      const metrics = this.metricsCache.get(avatarId);
      if (metrics) {
        affectedUsers += metrics.usage.uniqueUsers;
      }
    }

    // サービス中断レベルを判定
    const disruption = this.determineDisruptionLevel(candidate);

    // コスト削減を計算
    const costSavings = await this.calculateCostSavings(candidate);

    // 失われる機能を特定
    const capabilityLoss = await this.identifyCapabilityLoss(candidate);

    // 移行工数を見積もり
    const migrationEffort = this.estimateMigrationEffort(candidate);

    const impact: ImpactAssessment = {
      affectedUsers,
      serviceDisruption: disruption,
      costSavings,
      capabilityLoss,
      migrationEffort,
    };

    candidate.impact = impact;
    return impact;
  }

  /**
   * 統廃合レポートを生成
   */
  async generateReport(
    period: { start: Date; end: Date }
  ): Promise<ConsolidationReport> {
    const metricsArray = Array.from(this.metricsCache.values());
    const candidatesArray = Array.from(this.candidates.values());
    const proposalsArray = Array.from(this.proposals.values());
    const deprecationsArray = Array.from(this.deprecations.values());

    const summary = this.generateSummary(
      metricsArray,
      candidatesArray,
      proposalsArray,
      deprecationsArray
    );

    return {
      reportId: `report-${Date.now()}`,
      period,
      avatarMetrics: metricsArray,
      candidates: candidatesArray,
      proposals: proposalsArray,
      deprecations: deprecationsArray,
      summary,
      generatedAt: new Date(),
    };
  }

  // プライベートメソッド

  private async collectUsageMetrics(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<UsageMetrics> {
    // 実際の実装ではDBから収集
    return {
      totalSessions: Math.floor(Math.random() * 100),
      uniqueUsers: Math.floor(Math.random() * 50),
      averageSessionDuration: Math.random() * 30,
      messagesPerSession: Math.floor(Math.random() * 10) + 1,
      returnRate: Math.random(),
      peakUsageHours: [9, 10, 14, 15],
    };
  }

  private async collectEffectivenessMetrics(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<EffectivenessMetrics> {
    return {
      taskCompletionRate: Math.random() * 100,
      userSatisfactionScore: Math.random() * 100,
      escalationRate: Math.random() * 20,
      resolutionRate: Math.random() * 100,
      qualityScore: Math.random() * 100,
    };
  }

  private async collectCostMetrics(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<CostMetrics> {
    const apiCalls = Math.floor(Math.random() * 1000);
    const tokenUsage = apiCalls * 500;
    const computeCost = tokenUsage * 0.00001;

    return {
      apiCalls,
      tokenUsage,
      computeCost,
      maintenanceHours: Math.random() * 10,
      totalCost: computeCost + Math.random() * 100,
    };
  }

  private calculateOverallScore(
    usage: UsageMetrics,
    effectiveness: EffectivenessMetrics,
    cost: CostMetrics
  ): number {
    const usageScore = Math.min(100, usage.totalSessions * 2);
    const effectivenessScore = effectiveness.qualityScore;
    const costEfficiency = 100 - Math.min(100, cost.totalCost / 10);

    return (usageScore * 0.3 + effectivenessScore * 0.5 + costEfficiency * 0.2);
  }

  private createDeprecationCandidate(metrics: AvatarMetrics): ConsolidationCandidate {
    return {
      candidateId: `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'deprecate',
      avatars: [metrics.avatarId],
      reason: `低利用率: ${metrics.usage.totalSessions}セッション/期間`,
      confidence: 0.8,
      impact: {
        affectedUsers: metrics.usage.uniqueUsers,
        serviceDisruption: 'minimal',
        costSavings: metrics.cost.totalCost,
        capabilityLoss: [],
        migrationEffort: 'low',
      },
      recommendation: '廃止して別アバターへ移行',
      detectedAt: new Date(),
    };
  }

  private createImprovementCandidate(metrics: AvatarMetrics): ConsolidationCandidate {
    return {
      candidateId: `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'archive',
      avatars: [metrics.avatarId],
      reason: `低効果: 品質スコア${metrics.effectiveness.qualityScore.toFixed(1)}`,
      confidence: 0.7,
      impact: {
        affectedUsers: metrics.usage.uniqueUsers,
        serviceDisruption: 'moderate',
        costSavings: metrics.cost.totalCost * 0.5,
        capabilityLoss: [],
        migrationEffort: 'medium',
      },
      recommendation: '改善または統合を検討',
      detectedAt: new Date(),
    };
  }

  private createMergeCandidate(pair: [AvatarMetrics, AvatarMetrics]): ConsolidationCandidate {
    return {
      candidateId: `candidate-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'merge',
      avatars: [pair[0].avatarId, pair[1].avatarId],
      reason: '機能重複が検出されました',
      confidence: 0.75,
      impact: {
        affectedUsers: pair[0].usage.uniqueUsers + pair[1].usage.uniqueUsers,
        serviceDisruption: 'moderate',
        costSavings: Math.min(pair[0].cost.totalCost, pair[1].cost.totalCost),
        capabilityLoss: [],
        migrationEffort: 'medium',
      },
      recommendation: '2つのアバターを統合',
      detectedAt: new Date(),
    };
  }

  private async detectSimilarAvatars(
    metrics: AvatarMetrics[]
  ): Promise<[AvatarMetrics, AvatarMetrics][]> {
    // 類似度分析の簡易実装
    return [];
  }

  private async generateMergedSpec(avatarIds: string[]): Promise<{
    name: string;
    capabilities: string[];
    persona: string;
    knowledgeSources: string[];
  }> {
    return {
      name: '統合アバター',
      capabilities: ['統合された機能'],
      persona: '統合されたペルソナ',
      knowledgeSources: [],
    };
  }

  private determineMergeStrategy(avatarIds: string[]): MergeStrategy {
    return {
      personaMerge: 'blend',
      knowledgeMerge: 'union',
      behaviorMerge: 'weighted',
      transitionPeriod: 30,
    };
  }

  private createMergeTimeline(strategy: MergeStrategy): {
    phases: { name: string; duration: number; tasks: string[]; dependencies: string[] }[];
    totalDuration: number;
  } {
    return {
      phases: [
        { name: '準備', duration: 7, tasks: ['設計確定', 'リソース確保'], dependencies: [] },
        { name: '実装', duration: 14, tasks: ['コード統合', 'テスト'], dependencies: ['準備'] },
        { name: '移行', duration: strategy.transitionPeriod, tasks: ['段階的移行', 'モニタリング'], dependencies: ['実装'] },
      ],
      totalDuration: 7 + 14 + strategy.transitionPeriod,
    };
  }

  private async analyzeRisks(avatarIds: string[], strategy: MergeStrategy): Promise<Risk[]> {
    return [
      {
        id: 'risk-1',
        type: 'user',
        description: 'ユーザー体験の変化による混乱',
        probability: 'medium',
        impact: 'medium',
        mitigation: '段階的移行と十分な告知',
      },
      {
        id: 'risk-2',
        type: 'technical',
        description: 'データ移行の失敗',
        probability: 'low',
        impact: 'high',
        mitigation: 'バックアップとロールバック計画',
      },
    ];
  }

  private async findReplacementAvatar(avatarId: string): Promise<string> {
    return 'default-avatar';
  }

  private determineDisruptionLevel(
    candidate: ConsolidationCandidate
  ): 'none' | 'minimal' | 'moderate' | 'significant' {
    if (candidate.type === 'archive') return 'none';
    if (candidate.type === 'deprecate') return 'minimal';
    return 'moderate';
  }

  private async calculateCostSavings(candidate: ConsolidationCandidate): Promise<number> {
    let savings = 0;
    for (const avatarId of candidate.avatars) {
      const metrics = this.metricsCache.get(avatarId);
      if (metrics) {
        savings += metrics.cost.totalCost * 0.5;
      }
    }
    return savings;
  }

  private async identifyCapabilityLoss(candidate: ConsolidationCandidate): Promise<string[]> {
    if (candidate.type === 'merge') {
      return ['一部の特化機能'];
    }
    return [];
  }

  private estimateMigrationEffort(
    candidate: ConsolidationCandidate
  ): 'low' | 'medium' | 'high' {
    if (candidate.avatars.length === 1) return 'low';
    if (candidate.avatars.length <= 3) return 'medium';
    return 'high';
  }

  private generateSummary(
    metrics: AvatarMetrics[],
    candidates: ConsolidationCandidate[],
    proposals: MergeProposal[],
    deprecations: DeprecationPlan[]
  ): ReportSummary {
    const healthyAvatars = metrics.filter(m => m.overallScore >= 70).length;
    const underperforming = metrics.filter(m => m.overallScore < 50).length;

    const estimatedSavings = candidates.reduce((sum, c) => sum + (c.impact?.costSavings || 0), 0);

    return {
      totalAvatars: metrics.length,
      healthyAvatars,
      underperformingAvatars: underperforming,
      consolidationOpportunities: candidates.length,
      estimatedSavings,
      recommendations: [
        `${candidates.filter(c => c.type === 'deprecate').length}件の廃止を検討`,
        `${candidates.filter(c => c.type === 'merge').length}件の統合を検討`,
        `推定コスト削減: ¥${estimatedSavings.toFixed(0)}`,
      ],
    };
  }

  // 公開ゲッター

  getCandidate(candidateId: string): ConsolidationCandidate | undefined {
    return this.candidates.get(candidateId);
  }

  getProposal(proposalId: string): MergeProposal | undefined {
    return this.proposals.get(proposalId);
  }

  getDeprecationPlan(planId: string): DeprecationPlan | undefined {
    return this.deprecations.get(planId);
  }
}

export type {
  AvatarMetrics,
  ConsolidationCandidate,
  MergeProposal,
  DeprecationPlan,
  ConsolidationReport,
};
