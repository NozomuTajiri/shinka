/**
 * ShijoAvatarのユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ShijoAvatar, SHIJO_PERSONA, MARKET_FRAMEWORKS } from './index.js';
import { getFramework, evaluateSegmentAttractiveness, compareCompetitors, analyzeTrendImpact } from './market-analysis.js';
import type { MarketSegment, Competitor, Trend } from './types.js';

// Anthropic SDKのモック
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: `
市場トレンド:
- DX推進の加速
- AIの普及
成長率: 15%

主要セグメント:
- 先進採用層
- 慎重層
- 後発層

主要競合:
- 競合A社
- 競合B社
- 競合C社

機会:
- 新市場の創出
- 既存顧客の深掘り
- パートナーシップ

脅威:
- 新規参入者の増加
- 技術変化
- 規制強化

潜在ニーズ:
- 業務効率化
- コスト削減
- 競争力強化

ジョブ:
- 成果を出す
- リスクを減らす
- 時間を節約する

価値提案:
- ワンストップソリューション
- AI活用支援
- 継続的改善

X軸: 20, Y軸: 30
ホワイトスペース: 高品質×低価格領域

コンテンツピラー:
- 業界インサイト
- 活用事例
- ノウハウ共有

チャネル:
- ブログ
- SNS
- メールマガジン

KPI:
- 月間PV: 10000
- コンバージョン率: 2%
              `,
            },
          ],
        }),
      },
    })),
  };
});

describe('ShijoAvatar', () => {
  let shijo: ShijoAvatar;

  beforeEach(() => {
    shijo = new ShijoAvatar();
  });

  describe('getPersona', () => {
    it('ペルソナ情報を取得できる', () => {
      const persona = shijo.getPersona();
      expect(persona.id).toBe('shijo');
      expect(persona.name).toBe('市場');
      expect(persona.role).toBe('マーケティングストラテジスト');
      expect(persona.values.length).toBeGreaterThan(0);
    });
  });

  describe('startSession', () => {
    it('セッションを開始できる', () => {
      const session = shijo.startSession('client-123', 'market');
      expect(session.sessionId).toContain('shijo-');
      expect(session.clientId).toBe('client-123');
      expect(session.analysisType).toBe('market');
      expect(session.insights).toEqual([]);
    });

    it('異なる分析タイプでセッションを開始できる', () => {
      const session1 = shijo.startSession('client-1', 'market');
      const session2 = shijo.startSession('client-2', 'positioning');
      const session3 = shijo.startSession('client-3', 'content');
      const session4 = shijo.startSession('client-4', 'campaign');

      expect(session1.analysisType).toBe('market');
      expect(session2.analysisType).toBe('positioning');
      expect(session3.analysisType).toBe('content');
      expect(session4.analysisType).toBe('campaign');
    });
  });

  describe('processMessage', () => {
    it('ユーザーメッセージを処理できる', async () => {
      const session = shijo.startSession('client-123', 'market');
      const result = await shijo.processMessage(
        session.sessionId,
        '新しい市場機会を探しています'
      );

      expect(result.response).toBeDefined();
      expect(typeof result.response).toBe('string');
      expect(result.insights).toBeDefined();
    });

    it('存在しないセッションIDでエラーを投げる', async () => {
      await expect(
        shijo.processMessage('invalid-session', 'test message')
      ).rejects.toThrow('セッションが見つかりません');
    });

    it('フレームワークを提案する', async () => {
      const session = shijo.startSession('client-123', 'market');
      const result = await shijo.processMessage(
        session.sessionId,
        '競合との比較をしたい'
      );

      expect(result.suggestedFramework).toBeDefined();
    });
  });

  describe('analyzeMarket', () => {
    it('市場分析を実行できる', async () => {
      const session = shijo.startSession('client-123', 'market');
      const analysis = await shijo.analyzeMarket(
        session.sessionId,
        'クラウドサービス市場',
        {
          marketSize: { value: 1000, unit: '億円', year: 2024, source: '業界レポート' },
        }
      );

      expect(analysis.id).toBeDefined();
      expect(analysis.marketName).toBe('クラウドサービス市場');
      expect(analysis.marketSize.value).toBe(1000);
      expect(analysis.trends.length).toBeGreaterThan(0);
      expect(analysis.segments.length).toBeGreaterThan(0);
      expect(analysis.competitors.length).toBeGreaterThan(0);
      expect(analysis.opportunities.length).toBeGreaterThan(0);
      expect(analysis.threats.length).toBeGreaterThan(0);
    });

    it('セッションに分析結果を保存する', async () => {
      const session = shijo.startSession('client-123', 'market');
      await shijo.analyzeMarket(session.sessionId, 'テスト市場', {});

      const updatedSession = shijo.getSession(session.sessionId);
      expect(updatedSession?.marketAnalysis).toBeDefined();
    });
  });

  describe('createPositioningMap', () => {
    it('ポジショニングマップを作成できる', async () => {
      const session = shijo.startSession('client-123', 'positioning');
      const map = await shijo.createPositioningMap(
        session.sessionId,
        { label: '価格', min: '低価格', max: '高価格' },
        { label: '品質', min: '標準', max: '高品質' },
        [
          { name: '自社', isUs: true },
          { name: '競合A', isUs: false },
          { name: '競合B', isUs: false },
        ]
      );

      expect(map.axes).toBeDefined();
      expect(map.positions.length).toBe(3);
      expect(map.whiteSpaces.length).toBeGreaterThan(0);
      expect(map.positions.find(p => p.isUs)).toBeDefined();
    });

    it('座標が0-100の範囲内にある', async () => {
      const session = shijo.startSession('client-123', 'positioning');
      const map = await shijo.createPositioningMap(
        session.sessionId,
        { label: 'X軸', min: '小', max: '大' },
        { label: 'Y軸', min: '小', max: '大' },
        [{ name: 'テスト', isUs: true }]
      );

      for (const position of map.positions) {
        expect(position.x).toBeGreaterThanOrEqual(0);
        expect(position.x).toBeLessThanOrEqual(100);
        expect(position.y).toBeGreaterThanOrEqual(0);
        expect(position.y).toBeLessThanOrEqual(100);
      }
    });
  });

  describe('createContentStrategy', () => {
    it('コンテンツ戦略を策定できる', async () => {
      const session = shijo.startSession('client-123', 'content');
      const persona = {
        name: 'テストペルソナ',
        demographics: { age: '30-40', occupation: 'マーケター' },
        psychographics: ['データ重視', '効率志向'],
        goals: ['成果向上', 'スキルアップ'],
        frustrations: ['時間不足', '情報過多'],
        preferredChannels: ['ブログ', 'SNS'],
        contentPreferences: ['実践的', '事例ベース'],
      };

      const strategy = await shijo.createContentStrategy(
        session.sessionId,
        persona,
        ['認知度向上', 'リード獲得']
      );

      expect(strategy.targetPersona).toEqual(persona);
      expect(strategy.contentPillars.length).toBeGreaterThan(0);
      expect(strategy.channels.length).toBeGreaterThan(0);
      expect(strategy.contentCalendar.length).toBeGreaterThan(0);
      expect(strategy.kpis.length).toBeGreaterThan(0);
    });
  });

  describe('discoverLatentNeeds', () => {
    it('潜在ニーズを発見できる', async () => {
      const result = await shijo.discoverLatentNeeds(
        ['効率化したい', 'コストを削減したい', '品質を向上したい'],
        'B2B SaaS企業のマーケティング部門'
      );

      expect(result.latentNeeds.length).toBeGreaterThan(0);
      expect(result.jobsToBeDone.length).toBeGreaterThan(0);
      expect(result.newValuePropositions.length).toBeGreaterThan(0);
    });
  });
});

describe('MARKET_FRAMEWORKS', () => {
  it('3つのフレームワークが定義されている', () => {
    expect(MARKET_FRAMEWORKS.length).toBe(3);
    expect(MARKET_FRAMEWORKS.map(f => f.id)).toContain('3c-analysis');
    expect(MARKET_FRAMEWORKS.map(f => f.id)).toContain('stp-analysis');
    expect(MARKET_FRAMEWORKS.map(f => f.id)).toContain('neo-market-in');
  });

  it('各フレームワークにステップがある', () => {
    for (const framework of MARKET_FRAMEWORKS) {
      expect(framework.steps.length).toBeGreaterThan(0);
      for (const step of framework.steps) {
        expect(step.questions.length).toBeGreaterThan(0);
        expect(step.outputs.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('getFramework', () => {
  it('IDでフレームワークを取得できる', () => {
    const framework = getFramework('3c-analysis');
    expect(framework).toBeDefined();
    expect(framework?.name).toBe('3C分析');
  });

  it('存在しないIDでundefinedを返す', () => {
    const framework = getFramework('invalid-id');
    expect(framework).toBeUndefined();
  });
});

describe('evaluateSegmentAttractiveness', () => {
  it('セグメントの魅力度を評価できる', () => {
    const segment: MarketSegment = {
      id: 'seg-1',
      name: 'テストセグメント',
      size: 120,
      characteristics: ['特性1', '特性2'],
      needs: ['ニーズ1', 'ニーズ2', 'ニーズ3', 'ニーズ4'],
      painPoints: ['課題1', '課題2', '課題3'],
      buyingBehavior: '価値重視',
      reachability: 'easy',
    };

    const result = evaluateSegmentAttractiveness(segment);
    expect(result.score).toBeGreaterThan(0);
    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.factors).toBeDefined();
    expect(result.recommendation).toBeDefined();
  });

  it('大規模セグメントに高評価を与える', () => {
    const largeSegment: MarketSegment = {
      id: 'seg-large',
      name: '大規模',
      size: 150,
      characteristics: [],
      needs: ['n1', 'n2', 'n3', 'n4'],
      painPoints: ['p1', 'p2', 'p3'],
      buyingBehavior: 'test',
      reachability: 'easy',
    };

    const smallSegment: MarketSegment = {
      id: 'seg-small',
      name: '小規模',
      size: 30,
      characteristics: [],
      needs: ['n1', 'n2'],
      painPoints: ['p1'],
      buyingBehavior: 'test',
      reachability: 'difficult',
    };

    const largeResult = evaluateSegmentAttractiveness(largeSegment);
    const smallResult = evaluateSegmentAttractiveness(smallSegment);

    expect(largeResult.score).toBeGreaterThan(smallResult.score);
  });
});

describe('compareCompetitors', () => {
  it('競合を比較できる', () => {
    const competitors: Competitor[] = [
      {
        id: 'c1',
        name: '競合A',
        marketShare: 30,
        strengths: ['強み1', '強み2'],
        weaknesses: ['弱み1'],
        strategy: '戦略A',
        positioning: 'リーダー',
      },
      {
        id: 'c2',
        name: '競合B',
        marketShare: 20,
        strengths: ['強み3'],
        weaknesses: ['弱み2', '弱み3'],
        strategy: '戦略B',
        positioning: 'チャレンジャー',
      },
    ];

    const result = compareCompetitors(competitors);
    expect(result.leader).toBeDefined();
    expect(result.leader?.name).toBe('競合A');
    expect(result.ourPosition).toBeDefined();
    expect(result.gaps.length).toBeGreaterThan(0);
    expect(result.opportunities.length).toBeGreaterThan(0);
  });

  it('空の配列でnullリーダーを返す', () => {
    const result = compareCompetitors([]);
    expect(result.leader).toBeNull();
  });
});

describe('analyzeTrendImpact', () => {
  it('トレンドの影響を分析できる', () => {
    const trend: Trend = {
      id: 't1',
      name: 'AI活用',
      type: 'mega',
      description: 'AI技術の普及',
      impact: 'high',
      timeline: '3年',
      implications: ['自動化進展'],
    };

    const result = analyzeTrendImpact(trend, 'SaaS事業');
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.threats.length).toBeGreaterThan(0);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });
});

describe('SHIJO_PERSONA', () => {
  it('正しいペルソナ定義がある', () => {
    expect(SHIJO_PERSONA.id).toBe('shijo');
    expect(SHIJO_PERSONA.name).toBe('市場');
    expect(SHIJO_PERSONA.role).toBe('マーケティングストラテジスト');
    expect(SHIJO_PERSONA.communicationStyle.tone).toBe('洞察的で創造的');
    expect(SHIJO_PERSONA.communicationStyle.approach).toBe('ネオ・マーケットイン');
    expect(SHIJO_PERSONA.values.length).toBe(4);
    expect(SHIJO_PERSONA.behaviorPrinciples.length).toBe(4);
  });
});
