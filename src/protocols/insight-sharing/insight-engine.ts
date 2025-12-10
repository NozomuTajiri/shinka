/**
 * インサイトエンジン
 * インサイト取得・配信・統合管理
 */

import type {
  InsightMetadata,
  Insight,
  InsightCategory,
  InsightSource,
  InsightStatus,
  InsightContext,
  InsightContent,
  InsightApplicability,
  Evidence,
  InsightEngagement,
  InsightDistribution,
  LearningIntegration,
  InsightCatalog,
  InsightSearchQuery,
  Rating,
  Comment,
  ApplicationEntry,
} from './types.js';

export class InsightEngine {
  private insights: Map<string, Insight> = new Map();
  private distributions: Map<string, InsightDistribution> = new Map();
  private integrations: Map<string, LearningIntegration> = new Map();
  private catalogs: Map<string, InsightCatalog> = new Map();

  constructor() {
    this.initializeDefaultCatalogs();
  }

  private initializeDefaultCatalogs(): void {
    this.catalogs.set('best-practices', {
      catalogId: 'best-practices',
      name: 'ベストプラクティス集',
      description: '検証済みの効果的なアプローチ',
      categories: ['best-practice', 'pattern'],
      insightIds: [],
      curators: ['senryaku', 'mother-ai'],
      lastUpdated: new Date(),
    });

    this.catalogs.set('lessons-learned', {
      catalogId: 'lessons-learned',
      name: '学んだ教訓',
      description: '失敗や課題から得られた学び',
      categories: ['lesson-learned', 'anti-pattern'],
      insightIds: [],
      curators: ['senryaku', 'mother-ai'],
      lastUpdated: new Date(),
    });

    this.catalogs.set('innovations', {
      catalogId: 'innovations',
      name: 'イノベーション事例',
      description: '新しいアプローチや革新的な解決策',
      categories: ['innovation'],
      insightIds: [],
      curators: ['shijo', 'mother-ai'],
      lastUpdated: new Date(),
    });
  }

  generateInsightId(): string {
    return `ins-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateDistributionId(): string {
    return `dst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  generateIntegrationId(): string {
    return `int-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  captureInsight(
    category: InsightCategory,
    source: InsightSource,
    createdBy: string,
    title: string,
    description: string,
    context: InsightContext,
    content: InsightContent,
    applicability: InsightApplicability,
    evidence: Evidence[],
    tags: string[]
  ): Insight {
    const insight: Insight = {
      metadata: {
        insightId: this.generateInsightId(),
        category,
        source,
        createdBy,
        createdAt: new Date(),
        status: 'draft',
        version: 1,
      },
      title,
      description,
      context,
      content,
      applicability,
      evidence,
      relatedInsights: [],
      tags,
      engagement: {
        views: 0,
        applications: 0,
        successRate: 0,
        ratings: [],
        comments: [],
      },
    };

    this.insights.set(insight.metadata.insightId, insight);
    return insight;
  }

  submitForReview(insightId: string): boolean {
    const insight = this.insights.get(insightId);
    if (!insight || insight.metadata.status !== 'draft') return false;

    insight.metadata.status = 'review';
    return true;
  }

  validateInsight(insightId: string, validatorId: string): boolean {
    const insight = this.insights.get(insightId);
    if (!insight || insight.metadata.status !== 'review') return false;

    insight.metadata.status = 'validated';
    insight.metadata.validatedBy = validatorId;
    insight.metadata.validatedAt = new Date();
    return true;
  }

  publishInsight(insightId: string): boolean {
    const insight = this.insights.get(insightId);
    if (!insight || insight.metadata.status !== 'validated') return false;

    insight.metadata.status = 'published';

    // Add to relevant catalogs
    for (const [_, catalog] of this.catalogs) {
      if (catalog.categories.includes(insight.metadata.category)) {
        if (!catalog.insightIds.includes(insightId)) {
          catalog.insightIds.push(insightId);
          catalog.lastUpdated = new Date();
        }
      }
    }

    return true;
  }

  archiveInsight(insightId: string): boolean {
    const insight = this.insights.get(insightId);
    if (!insight) return false;

    insight.metadata.status = 'archived';

    // Remove from catalogs
    for (const [_, catalog] of this.catalogs) {
      const index = catalog.insightIds.indexOf(insightId);
      if (index > -1) {
        catalog.insightIds.splice(index, 1);
        catalog.lastUpdated = new Date();
      }
    }

    return true;
  }

  distributeInsight(
    insightId: string,
    targetAvatars: string[],
    deliveryMethod: InsightDistribution['deliveryMethod'] = 'push'
  ): InsightDistribution | null {
    const insight = this.insights.get(insightId);
    if (!insight || insight.metadata.status !== 'published') return null;

    const distribution: InsightDistribution = {
      distributionId: this.generateDistributionId(),
      insightId,
      targetAvatars,
      distributedAt: new Date(),
      deliveryMethod,
      acknowledged: [],
      applied: [],
    };

    this.distributions.set(distribution.distributionId, distribution);
    return distribution;
  }

  acknowledgeDistribution(distributionId: string, avatarId: string): boolean {
    const distribution = this.distributions.get(distributionId);
    if (!distribution) return false;

    if (!distribution.acknowledged.includes(avatarId)) {
      distribution.acknowledged.push(avatarId);

      // Update insight views
      const insight = this.insights.get(distribution.insightId);
      if (insight) {
        insight.engagement.views++;
      }
    }

    return true;
  }

  integrateInsight(insightId: string, avatarId: string): LearningIntegration | null {
    const insight = this.insights.get(insightId);
    if (!insight) return null;

    const integration: LearningIntegration = {
      integrationId: this.generateIntegrationId(),
      insightId,
      avatarId,
      integratedAt: new Date(),
      integrationLevel: 'awareness',
      applicationLog: [],
    };

    this.integrations.set(integration.integrationId, integration);
    return integration;
  }

  logApplication(
    integrationId: string,
    clientId: string,
    context: string,
    outcome: ApplicationEntry['outcome'],
    notes: string
  ): boolean {
    const integration = this.integrations.get(integrationId);
    if (!integration) return false;

    integration.applicationLog.push({
      timestamp: new Date(),
      clientId,
      context,
      outcome,
      notes,
    });

    // Update integration level based on applications
    const successCount = integration.applicationLog.filter(a => a.outcome === 'success').length;
    if (successCount >= 5) {
      integration.integrationLevel = 'mastery';
    } else if (successCount >= 3) {
      integration.integrationLevel = 'application';
    } else if (integration.applicationLog.length >= 1) {
      integration.integrationLevel = 'understanding';
    }

    // Update insight engagement
    const insight = this.insights.get(integration.insightId);
    if (insight) {
      insight.engagement.applications++;
      const totalApplications = Array.from(this.integrations.values())
        .filter(i => i.insightId === integration.insightId)
        .flatMap(i => i.applicationLog);
      const successfulApplications = totalApplications.filter(a => a.outcome === 'success').length;
      insight.engagement.successRate = totalApplications.length > 0
        ? Math.round((successfulApplications / totalApplications.length) * 100)
        : 0;
    }

    return true;
  }

  rateInsight(insightId: string, avatarId: string, score: number): boolean {
    const insight = this.insights.get(insightId);
    if (!insight || score < 1 || score > 5) return false;

    // Remove existing rating from same avatar
    insight.engagement.ratings = insight.engagement.ratings.filter(r => r.avatarId !== avatarId);

    insight.engagement.ratings.push({
      avatarId,
      score,
      timestamp: new Date(),
    });

    return true;
  }

  addComment(insightId: string, avatarId: string, content: string, type: Comment['type']): Comment | null {
    const insight = this.insights.get(insightId);
    if (!insight) return null;

    const comment: Comment = {
      id: `cmt-${Date.now()}`,
      avatarId,
      content,
      timestamp: new Date(),
      type,
    };

    insight.engagement.comments.push(comment);
    return comment;
  }

  searchInsights(query: InsightSearchQuery): Insight[] {
    return Array.from(this.insights.values()).filter(insight => {
      if (query.status && !query.status.includes(insight.metadata.status)) return false;
      if (query.categories && !query.categories.includes(insight.metadata.category)) return false;
      if (query.sources && !query.sources.includes(insight.metadata.source)) return false;
      if (query.targetAvatar && !insight.applicability.targetAvatars.includes(query.targetAvatar)) return false;
      if (query.industry && !insight.applicability.industries.includes(query.industry)) return false;

      if (query.minRating) {
        const avgRating = this.getAverageRating(insight.metadata.insightId);
        if (avgRating < query.minRating) return false;
      }

      if (query.keywords && query.keywords.length > 0) {
        const searchText = `${insight.title} ${insight.description} ${insight.tags.join(' ')}`.toLowerCase();
        const hasMatch = query.keywords.some(kw => searchText.includes(kw.toLowerCase()));
        if (!hasMatch) return false;
      }

      return true;
    });
  }

  getAverageRating(insightId: string): number {
    const insight = this.insights.get(insightId);
    if (!insight || insight.engagement.ratings.length === 0) return 0;

    const sum = insight.engagement.ratings.reduce((acc, r) => acc + r.score, 0);
    return Math.round((sum / insight.engagement.ratings.length) * 10) / 10;
  }

  getInsight(insightId: string): Insight | undefined {
    return this.insights.get(insightId);
  }

  getInsightsByCategory(category: InsightCategory): Insight[] {
    return Array.from(this.insights.values()).filter(
      i => i.metadata.category === category && i.metadata.status === 'published'
    );
  }

  getInsightsByCreator(avatarId: string): Insight[] {
    return Array.from(this.insights.values()).filter(i => i.metadata.createdBy === avatarId);
  }

  getRecommendedInsights(avatarId: string, limit: number = 5): Insight[] {
    const publishedInsights = Array.from(this.insights.values()).filter(
      i => i.metadata.status === 'published' && i.applicability.targetAvatars.includes(avatarId)
    );

    // Sort by relevance (engagement metrics and recency)
    return publishedInsights
      .sort((a, b) => {
        const scoreA = (this.getAverageRating(a.metadata.insightId) * 20) + a.engagement.applications;
        const scoreB = (this.getAverageRating(b.metadata.insightId) * 20) + b.engagement.applications;
        return scoreB - scoreA;
      })
      .slice(0, limit);
  }

  getCatalog(catalogId: string): InsightCatalog | undefined {
    return this.catalogs.get(catalogId);
  }

  getCatalogInsights(catalogId: string): Insight[] {
    const catalog = this.catalogs.get(catalogId);
    if (!catalog) return [];

    return catalog.insightIds
      .map(id => this.insights.get(id))
      .filter((i): i is Insight => i !== undefined);
  }

  getInsightStatistics(): {
    total: number;
    byCategory: Record<InsightCategory, number>;
    byStatus: Record<InsightStatus, number>;
    avgRating: number;
    totalApplications: number;
    avgSuccessRate: number;
  } {
    const insights = Array.from(this.insights.values());

    const byCategory: Record<InsightCategory, number> = {
      'best-practice': 0, 'lesson-learned': 0, 'pattern': 0, 'anti-pattern': 0, 'innovation': 0,
    };
    const byStatus: Record<InsightStatus, number> = {
      draft: 0, review: 0, validated: 0, published: 0, archived: 0,
    };

    let totalRatings = 0;
    let ratingSum = 0;
    let totalApplications = 0;
    let successRateSum = 0;
    let publishedCount = 0;

    for (const insight of insights) {
      byCategory[insight.metadata.category]++;
      byStatus[insight.metadata.status]++;

      for (const rating of insight.engagement.ratings) {
        ratingSum += rating.score;
        totalRatings++;
      }

      totalApplications += insight.engagement.applications;

      if (insight.metadata.status === 'published') {
        successRateSum += insight.engagement.successRate;
        publishedCount++;
      }
    }

    return {
      total: insights.length,
      byCategory,
      byStatus,
      avgRating: totalRatings > 0 ? Math.round((ratingSum / totalRatings) * 10) / 10 : 0,
      totalApplications,
      avgSuccessRate: publishedCount > 0 ? Math.round(successRateSum / publishedCount) : 0,
    };
  }

  linkRelatedInsights(insightId1: string, insightId2: string): boolean {
    const insight1 = this.insights.get(insightId1);
    const insight2 = this.insights.get(insightId2);
    if (!insight1 || !insight2) return false;

    if (!insight1.relatedInsights.includes(insightId2)) {
      insight1.relatedInsights.push(insightId2);
    }
    if (!insight2.relatedInsights.includes(insightId1)) {
      insight2.relatedInsights.push(insightId1);
    }

    return true;
  }
}
