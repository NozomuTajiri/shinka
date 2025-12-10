/**
 * 横断インサイトエンジン - ユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CrossClientInsightEngine } from '../../src/mother-ai/engines/insight/index.js';
import type {
  ClientActivity,
  CrossClientPattern,
  BestPractice,
  InsightReport,
} from '../../src/mother-ai/engines/insight/types.js';

// Anthropic APIをモック
vi.mock('@anthropic-ai/sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: {
      create: vi.fn().mockResolvedValue({
        content: [
          {
            type: 'text',
            text: `タイトル: 効果的な対話戦略
カテゴリ: コミュニケーション
説明: 高い成功率を実現する対話パターン。顧客との信頼関係構築と課題解決を両立します。
コンテキスト: 経営課題の明確化と行動計画策定
ステップ:
1. 初期ヒアリング実施
2. 課題の優先順位付け
3. 行動計画の策定
期待される成果:
- 顧客満足度20%向上
- 意思決定速度30%改善
- アバター利用継続率85%以上`,
          },
        ],
      }),
    },
  })),
}));

describe('CrossClientInsightEngine', () => {
  let engine: CrossClientInsightEngine;

  beforeEach(() => {
    engine = new CrossClientInsightEngine();
  });

  describe('collectClientActivities', () => {
    it('複数クライアントの活動データを収集できる', async () => {
      const clientIds = ['client1', 'client2', 'client3'];
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-03-31'),
      };

      const activities = await engine.collectClientActivities(clientIds, period);

      expect(activities).toHaveLength(3);
      expect(activities[0].clientId).toBe('client1');
      expect(activities[0].avatarInteractions).toBeDefined();
      expect(activities[0].outcomes).toBeDefined();
    });

    it('クライアント活動データが正しい構造を持つ', async () => {
      const activities = await engine.collectClientActivities(['client1'], {
        start: new Date(),
        end: new Date(),
      });

      const activity = activities[0];
      expect(activity).toHaveProperty('clientId');
      expect(activity).toHaveProperty('clientName');
      expect(activity).toHaveProperty('industry');
      expect(activity).toHaveProperty('size');
      expect(activity).toHaveProperty('avatarInteractions');
      expect(activity).toHaveProperty('outcomes');
      expect(activity).toHaveProperty('period');
    });
  });

  describe('detectPatterns', () => {
    it('成功パターンを検出できる', async () => {
      const activities: ClientActivity[] = [
        {
          clientId: 'c1',
          clientName: 'クライアント1',
          industry: 'tech',
          size: 'medium',
          avatarInteractions: [
            {
              avatarId: 'hiraku',
              avatarName: 'ひらく',
              sessionCount: 10,
              topics: [{ topic: '経営課題', frequency: 5, avgSentiment: 0.8, relatedTopics: [] }],
              sentiment: { overall: 0.8, trend: 'improving', highlights: [], concerns: [] },
              actionsTaken: [],
              successRate: 0.85,
            },
          ],
          outcomes: [],
          period: { start: new Date(), end: new Date() },
        },
        {
          clientId: 'c2',
          clientName: 'クライアント2',
          industry: 'tech',
          size: 'large',
          avatarInteractions: [
            {
              avatarId: 'hiraku',
              avatarName: 'ひらく',
              sessionCount: 15,
              topics: [{ topic: '経営課題', frequency: 7, avgSentiment: 0.75, relatedTopics: [] }],
              sentiment: { overall: 0.75, trend: 'stable', highlights: [], concerns: [] },
              actionsTaken: [],
              successRate: 0.82,
            },
          ],
          outcomes: [],
          period: { start: new Date(), end: new Date() },
        },
        {
          clientId: 'c3',
          clientName: 'クライアント3',
          industry: 'tech',
          size: 'small',
          avatarInteractions: [
            {
              avatarId: 'hiraku',
              avatarName: 'ひらく',
              sessionCount: 8,
              topics: [{ topic: '戦略', frequency: 4, avgSentiment: 0.85, relatedTopics: [] }],
              sentiment: { overall: 0.85, trend: 'improving', highlights: [], concerns: [] },
              actionsTaken: [],
              successRate: 0.88,
            },
          ],
          outcomes: [],
          period: { start: new Date(), end: new Date() },
        },
      ];

      const patterns = await engine.detectPatterns(activities);

      expect(patterns.length).toBeGreaterThan(0);
      const successPattern = patterns.find(p => p.type === 'success');
      expect(successPattern).toBeDefined();
      expect(successPattern?.name).toBe('高成功率の対話パターン');
      expect(successPattern?.confidence).toBeGreaterThan(0.8);
    });

    it('検出パターンが正しい構造を持つ', async () => {
      const activities = await engine.collectClientActivities(['c1', 'c2', 'c3'], {
        start: new Date(),
        end: new Date(),
      });

      const patterns = await engine.detectPatterns(activities);

      if (patterns.length > 0) {
        const pattern = patterns[0];
        expect(pattern).toHaveProperty('patternId');
        expect(pattern).toHaveProperty('name');
        expect(pattern).toHaveProperty('type');
        expect(pattern).toHaveProperty('description');
        expect(pattern).toHaveProperty('conditions');
        expect(pattern).toHaveProperty('outcomes');
        expect(pattern).toHaveProperty('confidence');
      }
    });
  });

  describe('generateBestPractice', () => {
    it('パターンからベストプラクティスを生成できる', async () => {
      const pattern: CrossClientPattern = {
        patternId: 'p1',
        name: '高成功率対話',
        type: 'success',
        description: 'テストパターン',
        frequency: 3,
        clients: ['c1', 'c2', 'c3'],
        conditions: [{ factor: 'successRate', value: 0.8, operator: 'greater' }],
        outcomes: [{ metric: '満足度', direction: 'increase', magnitude: 20, timeframe: '3ヶ月' }],
        confidence: 0.85,
        detectedAt: new Date(),
      };

      const practice = await engine.generateBestPractice(pattern);

      expect(practice).toHaveProperty('practiceId');
      expect(practice).toHaveProperty('title');
      expect(practice).toHaveProperty('category');
      expect(practice).toHaveProperty('description');
      expect(practice).toHaveProperty('steps');
      expect(practice).toHaveProperty('expectedOutcomes');
      expect(practice.rating).toBeGreaterThan(0);
    });
  });

  describe('analyzeTrends', () => {
    it('トピックトレンドを分析できる', async () => {
      const activities = await engine.collectClientActivities(['c1', 'c2'], {
        start: new Date('2025-01-01'),
        end: new Date('2025-03-31'),
      });

      const trends = await engine.analyzeTrends(activities, {
        start: new Date('2025-01-01'),
        end: new Date('2025-03-31'),
      });

      expect(trends.length).toBeGreaterThan(0);
      const topicTrend = trends.find(t => t.name.includes('への関心'));
      expect(topicTrend).toBeDefined();
      expect(topicTrend?.direction).toBe('up');
    });
  });

  describe('generateRecommendations', () => {
    it('パターンとトレンドからレコメンデーションを生成できる', async () => {
      const patterns: CrossClientPattern[] = [
        {
          patternId: 'p1',
          name: 'パターン1',
          type: 'success',
          description: 'テスト',
          frequency: 3,
          clients: ['c1'],
          conditions: [],
          outcomes: [{ metric: '満足度', direction: 'increase', magnitude: 20, timeframe: '3ヶ月' }],
          confidence: 0.85,
          detectedAt: new Date(),
        },
      ];

      const trends = [
        {
          trendId: 't1',
          name: 'トレンド1',
          direction: 'up' as const,
          strength: 0.75,
          description: 'テストトレンド',
          affectedClients: 2,
          projectedImpact: '需要増加',
        },
      ];

      const recommendations = await engine.generateRecommendations(patterns, trends);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations[0]).toHaveProperty('priority');
      expect(recommendations[0]).toHaveProperty('title');
      expect(recommendations[0]).toHaveProperty('actions');
    });

    it('レコメンデーションが優先度順にソートされる', async () => {
      const patterns: CrossClientPattern[] = [
        {
          patternId: 'p1',
          name: 'パターン1',
          type: 'success',
          description: 'テスト',
          frequency: 3,
          clients: ['c1'],
          conditions: [],
          outcomes: [{ metric: '満足度', direction: 'increase', magnitude: 20, timeframe: '3ヶ月' }],
          confidence: 0.82,
          detectedAt: new Date(),
        },
        {
          patternId: 'p2',
          name: 'パターン2',
          type: 'success',
          description: 'テスト',
          frequency: 5,
          clients: ['c1', 'c2'],
          conditions: [],
          outcomes: [{ metric: '効率', direction: 'increase', magnitude: 30, timeframe: '3ヶ月' }],
          confidence: 0.95,
          detectedAt: new Date(),
        },
      ];

      const recommendations = await engine.generateRecommendations(patterns, []);

      expect(recommendations.length).toBeGreaterThanOrEqual(2);
      expect(recommendations[0].priority).toBe('high');
      expect(recommendations[1].priority).toBe('medium');
    });
  });

  describe('generateReport', () => {
    it('包括的なインサイトレポートを生成できる', async () => {
      await engine.collectClientActivities(['c1', 'c2', 'c3'], {
        start: new Date('2025-01-01'),
        end: new Date('2025-03-31'),
      });

      const report = await engine.generateReport({
        start: new Date('2025-01-01'),
        end: new Date('2025-03-31'),
      });

      expect(report).toHaveProperty('reportId');
      expect(report).toHaveProperty('title');
      expect(report).toHaveProperty('executiveSummary');
      expect(report).toHaveProperty('patterns');
      expect(report).toHaveProperty('bestPractices');
      expect(report).toHaveProperty('trends');
      expect(report).toHaveProperty('recommendations');
      expect(report.executiveSummary.length).toBeGreaterThan(0);
    });
  });

  describe('distributeInsight', () => {
    it('インサイトを配信できる', async () => {
      const recipients = [
        { type: 'client' as const, id: 'c1', name: 'クライアント1', relevanceScore: 0.9 },
        { type: 'avatar' as const, id: 'a1', name: 'アバター1', relevanceScore: 0.8 },
      ];

      const distribution = await engine.distributeInsight('insight1', recipients, 'email');

      expect(distribution).toHaveProperty('distributionId');
      expect(distribution.insightId).toBe('insight1');
      expect(distribution.recipients).toHaveLength(2);
      expect(distribution.channel).toBe('email');
      expect(distribution.status).toBe('sent');
      expect(distribution.sentAt).toBeDefined();
    });
  });

  describe('ゲッターメソッド', () => {
    it('パターンを取得できる', async () => {
      const activities = await engine.collectClientActivities(['c1', 'c2', 'c3'], {
        start: new Date(),
        end: new Date(),
      });
      const patterns = await engine.detectPatterns(activities);

      if (patterns.length > 0) {
        const patternId = patterns[0].patternId;
        const retrieved = engine.getPattern(patternId);
        expect(retrieved).toBeDefined();
        expect(retrieved?.patternId).toBe(patternId);
      }
    });

    it('すべてのパターンを取得できる', async () => {
      const activities = await engine.collectClientActivities(['c1', 'c2', 'c3'], {
        start: new Date(),
        end: new Date(),
      });
      await engine.detectPatterns(activities);

      const allPatterns = engine.getAllPatterns();
      expect(Array.isArray(allPatterns)).toBe(true);
    });

    it('すべてのベストプラクティスを取得できる', () => {
      const allPractices = engine.getAllBestPractices();
      expect(Array.isArray(allPractices)).toBe(true);
    });
  });
});
