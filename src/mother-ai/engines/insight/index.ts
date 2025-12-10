/**
 * 横断インサイトエンジン
 *
 * 複数クライアントの活動データから汎用的な知見を抽出し配信
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  ClientActivity,
  CrossClientPattern,
  BestPractice,
  InsightReport,
  TrendAnalysis,
  Recommendation,
  InsightDistribution,
  PatternCondition,
  PatternOutcome,
  Evidence,
  PracticeStep,
  Recipient,
} from './types.js';

export class CrossClientInsightEngine {
  private anthropic: Anthropic;
  private activities: Map<string, ClientActivity>;
  private patterns: Map<string, CrossClientPattern>;
  private bestPractices: Map<string, BestPractice>;
  private distributions: Map<string, InsightDistribution>;

  constructor() {
    this.anthropic = new Anthropic();
    this.activities = new Map();
    this.patterns = new Map();
    this.bestPractices = new Map();
    this.distributions = new Map();
  }

  /**
   * クライアント活動データを収集
   */
  async collectClientActivities(
    clientIds: string[],
    period: { start: Date; end: Date }
  ): Promise<ClientActivity[]> {
    const activities: ClientActivity[] = [];

    for (const clientId of clientIds) {
      const activity = await this.fetchClientActivity(clientId, period);
      activities.push(activity);
      this.activities.set(clientId, activity);
    }

    return activities;
  }

  /**
   * クロスクライアントパターンを検出
   */
  async detectPatterns(
    activities: ClientActivity[]
  ): Promise<CrossClientPattern[]> {
    const patterns: CrossClientPattern[] = [];

    // 成功パターンを検出
    const successPatterns = await this.detectSuccessPatterns(activities);
    patterns.push(...successPatterns);

    // 課題パターンを検出
    const challengePatterns = await this.detectChallengePatterns(activities);
    patterns.push(...challengePatterns);

    // トレンドパターンを検出
    const trendPatterns = await this.detectTrendPatterns(activities);
    patterns.push(...trendPatterns);

    // 機会パターンを検出
    const opportunityPatterns = await this.detectOpportunityPatterns(activities);
    patterns.push(...opportunityPatterns);

    // キャッシュに保存
    for (const pattern of patterns) {
      this.patterns.set(pattern.patternId, pattern);
    }

    return patterns;
  }

  /**
   * ベストプラクティスを生成
   */
  async generateBestPractice(
    pattern: CrossClientPattern
  ): Promise<BestPractice> {
    const prompt = `
以下のパターンからベストプラクティスを抽出してください。

パターン名: ${pattern.name}
タイプ: ${pattern.type}
説明: ${pattern.description}
発生クライアント数: ${pattern.clients.length}
信頼度: ${pattern.confidence}

条件:
${pattern.conditions.map(c => `- ${c.factor}: ${c.value}`).join('\n')}

結果:
${pattern.outcomes.map(o => `- ${o.metric}: ${o.direction} ${o.magnitude}%`).join('\n')}

以下の形式で出力してください:
1. タイトル（簡潔に）
2. カテゴリ
3. 説明（2-3文）
4. 適用コンテキスト
5. ステップ（3-5つ）
6. 期待される成果（3つ）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    const practice: BestPractice = {
      practiceId: `practice-${Date.now()}`,
      title: this.extractValue(text, 'タイトル') || pattern.name,
      category: this.extractValue(text, 'カテゴリ') || 'general',
      description: this.extractValue(text, '説明') || pattern.description,
      context: this.extractValue(text, 'コンテキスト') || '',
      steps: this.extractSteps(text),
      expectedOutcomes: this.extractListItems(text, '成果'),
      applicability: {
        industries: this.inferIndustries(pattern),
        companySize: this.inferCompanySizes(pattern),
        challenges: this.inferChallenges(pattern),
        prerequisites: [],
      },
      evidence: this.createEvidence(pattern),
      rating: pattern.confidence * 5,
      usageCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.bestPractices.set(practice.practiceId, practice);
    return practice;
  }

  /**
   * トレンド分析を実行
   */
  async analyzeTrends(
    activities: ClientActivity[],
    period: { start: Date; end: Date }
  ): Promise<TrendAnalysis[]> {
    const trends: TrendAnalysis[] = [];

    // トピックトレンドを分析
    const topicTrends = this.analyzeTopicTrends(activities);
    trends.push(...topicTrends);

    // センチメントトレンドを分析
    const sentimentTrends = this.analyzeSentimentTrends(activities);
    trends.push(...sentimentTrends);

    // 成果トレンドを分析
    const outcomeTrends = this.analyzeOutcomeTrends(activities);
    trends.push(...outcomeTrends);

    return trends;
  }

  /**
   * レコメンデーションを生成
   */
  async generateRecommendations(
    patterns: CrossClientPattern[],
    trends: TrendAnalysis[]
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 高優先度パターンからレコメンデーション
    const highConfidencePatterns = patterns.filter(p => p.confidence > 0.8);
    for (const pattern of highConfidencePatterns) {
      recommendations.push(this.createRecommendationFromPattern(pattern));
    }

    // 上昇トレンドからレコメンデーション
    const risingTrends = trends.filter(t => t.direction === 'up' && t.strength > 0.7);
    for (const trend of risingTrends) {
      recommendations.push(this.createRecommendationFromTrend(trend));
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }

  /**
   * インサイトレポートを生成
   */
  async generateReport(
    period: { start: Date; end: Date }
  ): Promise<InsightReport> {
    const activities = Array.from(this.activities.values());

    // パターン検出
    const patterns = await this.detectPatterns(activities);

    // ベストプラクティス生成
    const practices: BestPractice[] = [];
    for (const pattern of patterns.filter(p => p.type === 'success').slice(0, 5)) {
      const practice = await this.generateBestPractice(pattern);
      practices.push(practice);
    }

    // トレンド分析
    const trends = await this.analyzeTrends(activities, period);

    // レコメンデーション生成
    const recommendations = await this.generateRecommendations(patterns, trends);

    // エグゼクティブサマリー生成
    const executiveSummary = await this.generateExecutiveSummary(
      patterns,
      practices,
      trends,
      recommendations
    );

    return {
      reportId: `report-${Date.now()}`,
      title: `横断インサイトレポート ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`,
      period,
      executiveSummary,
      patterns,
      bestPractices: practices,
      trends,
      recommendations,
      generatedAt: new Date(),
    };
  }

  /**
   * インサイトを配信
   */
  async distributeInsight(
    insightId: string,
    recipients: Recipient[],
    channel: InsightDistribution['channel']
  ): Promise<InsightDistribution> {
    const distribution: InsightDistribution = {
      distributionId: `dist-${Date.now()}`,
      insightId,
      recipients,
      channel,
      scheduledAt: new Date(),
      status: 'pending',
    };

    // 配信実行（実際の実装ではメール送信やプッシュ通知）
    try {
      await this.executeDistribution(distribution);
      distribution.sentAt = new Date();
      distribution.status = 'sent';
    } catch (error) {
      distribution.status = 'failed';
    }

    this.distributions.set(distribution.distributionId, distribution);
    return distribution;
  }

  // プライベートメソッド

  private async fetchClientActivity(
    clientId: string,
    period: { start: Date; end: Date }
  ): Promise<ClientActivity> {
    // 実際の実装ではDBから取得
    return {
      clientId,
      clientName: `クライアント ${clientId}`,
      industry: 'technology',
      size: 'medium',
      avatarInteractions: [
        {
          avatarId: 'hiraku',
          avatarName: 'ひらく',
          sessionCount: Math.floor(Math.random() * 20) + 1,
          topics: [
            { topic: '経営課題', frequency: 5, avgSentiment: 0.7, relatedTopics: ['戦略', '組織'] },
          ],
          sentiment: {
            overall: 0.75,
            trend: 'improving',
            highlights: ['課題の明確化', '行動計画の策定'],
            concerns: [],
          },
          actionsTaken: ['診断完了', 'アバター推薦'],
          successRate: 0.85,
        },
      ],
      outcomes: [
        {
          type: 'efficiency',
          metric: '意思決定速度',
          baseline: 100,
          current: 130,
          change: 30,
          attribution: 0.6,
        },
      ],
      period,
    };
  }

  private async detectSuccessPatterns(activities: ClientActivity[]): Promise<CrossClientPattern[]> {
    const patterns: CrossClientPattern[] = [];

    // 高成功率のパターンを検出
    const highSuccessActivities = activities.filter(a =>
      a.avatarInteractions.some(i => i.successRate > 0.8)
    );

    if (highSuccessActivities.length >= 3) {
      patterns.push({
        patternId: `pattern-success-${Date.now()}`,
        name: '高成功率の対話パターン',
        type: 'success',
        description: '複数クライアントで高い成功率を達成している対話パターン',
        frequency: highSuccessActivities.length,
        clients: highSuccessActivities.map(a => a.clientId),
        conditions: [
          { factor: 'successRate', value: 0.8, operator: 'greater' },
        ],
        outcomes: [
          { metric: '顧客満足度', direction: 'increase', magnitude: 20, timeframe: '3ヶ月' },
        ],
        confidence: 0.85,
        detectedAt: new Date(),
      });
    }

    return patterns;
  }

  private async detectChallengePatterns(activities: ClientActivity[]): Promise<CrossClientPattern[]> {
    return [];
  }

  private async detectTrendPatterns(activities: ClientActivity[]): Promise<CrossClientPattern[]> {
    return [];
  }

  private async detectOpportunityPatterns(activities: ClientActivity[]): Promise<CrossClientPattern[]> {
    return [];
  }

  private analyzeTopicTrends(activities: ClientActivity[]): TrendAnalysis[] {
    const topicCounts: Record<string, number> = {};

    for (const activity of activities) {
      for (const interaction of activity.avatarInteractions) {
        for (const topic of interaction.topics) {
          topicCounts[topic.topic] = (topicCounts[topic.topic] || 0) + topic.frequency;
        }
      }
    }

    return Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic, count], index) => ({
        trendId: `trend-topic-${index}`,
        name: `${topic}への関心`,
        direction: 'up' as const,
        strength: Math.min(1, count / 10),
        description: `「${topic}」に関する対話が増加しています`,
        affectedClients: activities.filter(a =>
          a.avatarInteractions.some(i =>
            i.topics.some(t => t.topic === topic)
          )
        ).length,
        projectedImpact: '関連サービスの需要増加が予想されます',
      }));
  }

  private analyzeSentimentTrends(activities: ClientActivity[]): TrendAnalysis[] {
    return [];
  }

  private analyzeOutcomeTrends(activities: ClientActivity[]): TrendAnalysis[] {
    return [];
  }

  private createRecommendationFromPattern(pattern: CrossClientPattern): Recommendation {
    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      priority: pattern.confidence > 0.9 ? 'high' : 'medium',
      target: 'all',
      title: `${pattern.name}の活用`,
      rationale: pattern.description,
      actions: ['パターンの詳細分析', 'パイロット実施', '全社展開'],
      expectedBenefit: pattern.outcomes[0]?.metric || '効率向上',
    };
  }

  private createRecommendationFromTrend(trend: TrendAnalysis): Recommendation {
    return {
      id: `rec-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      priority: trend.strength > 0.8 ? 'high' : 'medium',
      target: 'segment',
      title: `${trend.name}への対応`,
      rationale: trend.description,
      actions: ['トレンド詳細分析', '対応策検討', '実施'],
      expectedBenefit: trend.projectedImpact,
    };
  }

  private async generateExecutiveSummary(
    patterns: CrossClientPattern[],
    practices: BestPractice[],
    trends: TrendAnalysis[],
    recommendations: Recommendation[]
  ): Promise<string> {
    const prompt = `
以下のデータからエグゼクティブサマリーを作成してください（3-4文）。

検出パターン数: ${patterns.length}
- 成功パターン: ${patterns.filter(p => p.type === 'success').length}
- 課題パターン: ${patterns.filter(p => p.type === 'challenge').length}

ベストプラクティス数: ${practices.length}
主要トレンド: ${trends.slice(0, 3).map(t => t.name).join(', ')}
高優先度レコメンデーション: ${recommendations.filter(r => r.priority === 'high').length}件
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    return (response.content[0] as { type: 'text'; text: string }).text;
  }

  private async executeDistribution(distribution: InsightDistribution): Promise<void> {
    // 実際の配信処理（メール、通知など）
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private extractValue(text: string, key: string): string | null {
    const regex = new RegExp(`${key}[：:]\\s*(.+?)(?:\\n|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractListItems(text: string, sectionName: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    let inSection = false;

    for (const line of lines) {
      if (line.includes(sectionName)) {
        inSection = true;
        continue;
      }
      if (inSection && line.match(/^[-*\d]/)) {
        items.push(line.replace(/^[-*\d.]\s*/, '').trim());
      }
      if (inSection && items.length >= 3) break;
    }

    return items;
  }

  private extractSteps(text: string): PracticeStep[] {
    const items = this.extractListItems(text, 'ステップ');
    return items.map((action, index) => ({
      order: index + 1,
      action,
      tips: [],
      commonMistakes: [],
    }));
  }

  private inferIndustries(pattern: CrossClientPattern): string[] {
    return ['technology', 'manufacturing', 'service'];
  }

  private inferCompanySizes(pattern: CrossClientPattern): string[] {
    return ['medium', 'large'];
  }

  private inferChallenges(pattern: CrossClientPattern): string[] {
    return pattern.conditions.map(c => c.factor);
  }

  private createEvidence(pattern: CrossClientPattern): Evidence[] {
    return pattern.clients.slice(0, 3).map(clientId => ({
      clientId,
      outcome: pattern.outcomes[0]?.metric || '',
      metrics: { improvement: pattern.outcomes[0]?.magnitude || 0 },
    }));
  }

  // 公開ゲッター

  getPattern(patternId: string): CrossClientPattern | undefined {
    return this.patterns.get(patternId);
  }

  getBestPractice(practiceId: string): BestPractice | undefined {
    return this.bestPractices.get(practiceId);
  }

  getAllPatterns(): CrossClientPattern[] {
    return Array.from(this.patterns.values());
  }

  getAllBestPractices(): BestPractice[] {
    return Array.from(this.bestPractices.values());
  }
}

export type {
  ClientActivity,
  CrossClientPattern,
  BestPractice,
  InsightReport,
  TrendAnalysis,
  Recommendation,
};
