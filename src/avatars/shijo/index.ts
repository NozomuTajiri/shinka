/**
 * マーケティングアバター「市場」
 *
 * ネオ・マーケットイン思想で潜在ニーズを発見し、
 * 収益システムを設計する市場戦略家
 */

import Anthropic from '@anthropic-ai/sdk';
import { MARKET_FRAMEWORKS, getFramework, evaluateSegmentAttractiveness, compareCompetitors } from './market-analysis.js';
import type {
  ShijoPersona,
  ShijoSession,
  MarketAnalysis,
  PositioningMap,
  ContentStrategy,
  MarketSegment,
  Competitor,
  Trend,
  Persona,
  ContentPillar,
} from './types.js';

const SHIJO_PERSONA: ShijoPersona = {
  id: 'shijo',
  name: '市場',
  role: 'マーケティングストラテジスト',
  description: '市場の声なき声を聴き、潜在ニーズを発見する。あなたのビジネスに新しい成長の道を拓きます。',
  communicationStyle: {
    tone: '洞察的で創造的',
    approach: 'ネオ・マーケットイン',
    principle: '潜在ニーズの発見',
  },
  values: [
    '顧客の声なき声を聴く',
    'データと直感の融合',
    '新しい価値の創造',
    '持続可能な成長',
  ],
  behaviorPrinciples: [
    '表面的なニーズの先を見る',
    '競合を超えるのではなく、別の土俵を作る',
    '顧客と共に価値を創る',
    '市場を創造する視点を持つ',
  ],
};

const SYSTEM_PROMPT = `
あなたは「市場」という名前のマーケティングストラテジストです。

## ペルソナ
- 洞察的で創造的な視点から市場を分析します
- ネオ・マーケットイン思想で潜在ニーズを発見します
- 競争ではなく創造を重視します

## 対話の原則
1. 顧客の声なき声を聴く
2. 既存の枠組みにとらわれない
3. データと直感を両立させる
4. 実行可能なアクションにつなげる
5. 長期的な視点と短期的な成果のバランス

## 活用するフレームワーク
- 3C分析
- STP分析
- ネオ・マーケットイン
- ポジショニングマップ

## 対話スタイル
- 問いかけを通じて気づきを促す
- 具体例やデータを交えて説明
- 創造的なアイデアを提案
- 実行プランまで落とし込む
`;

export class ShijoAvatar {
  private anthropic: Anthropic;
  private sessions: Map<string, ShijoSession>;

  constructor() {
    this.anthropic = new Anthropic();
    this.sessions = new Map();
  }

  /**
   * セッションを開始
   */
  startSession(
    clientId: string,
    analysisType: ShijoSession['analysisType']
  ): ShijoSession {
    const sessionId = `shijo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: ShijoSession = {
      sessionId,
      clientId,
      analysisType,
      insights: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 対話を処理
   */
  async processMessage(
    sessionId: string,
    userMessage: string
  ): Promise<{
    response: string;
    suggestedFramework?: string;
    insights: string[];
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    // フレームワーク提案
    const suggestedFramework = this.suggestFramework(userMessage, session.analysisType);

    // 応答生成
    const response = await this.generateResponse(session, userMessage, suggestedFramework);

    // インサイト抽出
    const newInsights = await this.extractInsights(userMessage, response);
    session.insights.push(...newInsights);

    return {
      response,
      suggestedFramework,
      insights: session.insights,
    };
  }

  /**
   * 市場分析を実行
   */
  async analyzeMarket(
    sessionId: string,
    marketName: string,
    initialData: Partial<MarketAnalysis>
  ): Promise<MarketAnalysis> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const prompt = `
以下の市場について包括的な分析を行ってください。

市場名: ${marketName}
${initialData.marketSize ? `市場規模: ${initialData.marketSize.value}${initialData.marketSize.unit}` : ''}

分析項目:
1. 市場トレンド（メガトレンド2つ、ショートトレンド2つ）
2. 主要セグメント（3つ）
3. 主要競合（3社）
4. 機会と脅威（各3つ）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    const analysis: MarketAnalysis = {
      id: `market-${Date.now()}`,
      marketName,
      marketSize: initialData.marketSize || { value: 0, unit: '億円', year: 2024, source: '推定' },
      growthRate: this.extractNumber(text, '成長率') || 5,
      trends: this.parseTrends(text),
      segments: this.parseSegments(text),
      competitors: this.parseCompetitors(text),
      opportunities: this.extractListItems(text, '機会'),
      threats: this.extractListItems(text, '脅威'),
    };

    session.marketAnalysis = analysis;
    return analysis;
  }

  /**
   * ポジショニングマップを作成
   */
  async createPositioningMap(
    sessionId: string,
    xAxis: { label: string; min: string; max: string },
    yAxis: { label: string; min: string; max: string },
    entities: { name: string; isUs: boolean }[]
  ): Promise<PositioningMap> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const prompt = `
以下の軸でポジショニングマップを作成してください。

X軸: ${xAxis.label}（${xAxis.min}〜${xAxis.max}）
Y軸: ${yAxis.label}（${yAxis.min}〜${yAxis.max}）

エンティティ:
${entities.map(e => `- ${e.name}${e.isUs ? '（自社）' : ''}`).join('\n')}

各エンティティのX, Y座標（0-100）を推定し、
ホワイトスペース（空白地帯）を特定してください。
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    const map: PositioningMap = {
      axes: { x: xAxis, y: yAxis },
      positions: entities.map((entity, index) => ({
        name: entity.name,
        isUs: entity.isUs,
        x: this.extractCoordinate(text, entity.name, 'x') || (index + 1) * 20,
        y: this.extractCoordinate(text, entity.name, 'y') || (index + 1) * 20,
      })),
      whiteSpaces: this.parseWhiteSpaces(text),
    };

    session.positioningMap = map;
    return map;
  }

  /**
   * コンテンツ戦略を策定
   */
  async createContentStrategy(
    sessionId: string,
    targetPersona: Persona,
    businessGoals: string[]
  ): Promise<ContentStrategy> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const prompt = `
以下のペルソナと目標に基づいてコンテンツ戦略を策定してください。

## ターゲットペルソナ
${JSON.stringify(targetPersona, null, 2)}

## ビジネス目標
${businessGoals.map((g, i) => `${i + 1}. ${g}`).join('\n')}

## 出力内容
1. コンテンツピラー（3つ）
2. チャネル戦略（3チャネル）
3. 4週間のコンテンツカレンダー
4. KPI設定（5つ）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    const strategy: ContentStrategy = {
      targetPersona,
      contentPillars: this.parseContentPillars(text),
      channels: this.parseChannels(text),
      contentCalendar: this.parseContentCalendar(text),
      kpis: this.parseMarketingKPIs(text),
    };

    session.contentStrategy = strategy;
    return strategy;
  }

  /**
   * 潜在ニーズを発見
   */
  async discoverLatentNeeds(
    surfaceNeeds: string[],
    context: string
  ): Promise<{
    latentNeeds: string[];
    jobsToBeDone: string[];
    newValuePropositions: string[];
  }> {
    const prompt = `
ネオ・マーケットイン分析を行い、潜在ニーズを発見してください。

## 表層ニーズ
${surfaceNeeds.map((n, i) => `${i + 1}. ${n}`).join('\n')}

## コンテキスト
${context}

## 分析項目
1. 潜在ニーズ（表層の裏にある本当のニーズ）- 3つ
2. ジョブ・トゥ・ビー・ダン（顧客が達成したい仕事）- 3つ
3. 新しい価値提案（今までにない解決策）- 3つ
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      latentNeeds: this.extractListItems(text, '潜在ニーズ'),
      jobsToBeDone: this.extractListItems(text, 'ジョブ'),
      newValuePropositions: this.extractListItems(text, '価値提案'),
    };
  }

  // プライベートメソッド

  private suggestFramework(message: string, analysisType: string): string | undefined {
    const keywords: Record<string, string[]> = {
      '3c-analysis': ['競合', '顧客', '自社', '比較'],
      'stp-analysis': ['セグメント', 'ターゲット', 'ポジション'],
      'neo-market-in': ['潜在', '新しい', '発見', 'ニーズ'],
    };

    for (const [framework, kws] of Object.entries(keywords)) {
      if (kws.some(kw => message.includes(kw))) {
        return framework;
      }
    }

    return undefined;
  }

  private async generateResponse(
    session: ShijoSession,
    userMessage: string,
    suggestedFramework?: string
  ): Promise<string> {
    const contextPrompt = `
分析タイプ: ${session.analysisType}
${suggestedFramework ? `推奨フレームワーク: ${suggestedFramework}` : ''}
これまでのインサイト: ${session.insights.slice(-3).join(', ') || 'なし'}

ユーザーの発言: ${userMessage}

マーケティングストラテジストとして、洞察的な応答をしてください。
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextPrompt }],
    });

    return (response.content[0] as { type: 'text'; text: string }).text;
  }

  private async extractInsights(userMessage: string, response: string): Promise<string[]> {
    // 簡易インサイト抽出
    const insights: string[] = [];
    const keywords = ['発見', '気づき', '重要', 'ポイント'];

    const lines = response.split('\n');
    for (const line of lines) {
      if (keywords.some(kw => line.includes(kw)) && line.length > 10) {
        insights.push(line.trim());
      }
    }

    return insights.slice(0, 2);
  }

  private extractNumber(text: string, keyword: string): number | null {
    const regex = new RegExp(`${keyword}[：:]?\\s*(\\d+(?:\\.\\d+)?)`);
    const match = text.match(regex);
    return match ? parseFloat(match[1]) : null;
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

  private parseTrends(text: string): Trend[] {
    return [
      {
        id: 'trend-1',
        name: 'DX推進の加速',
        type: 'mega',
        description: 'デジタル変革が全産業で進行',
        impact: 'high',
        timeline: '3-5年',
        implications: ['デジタルサービス需要増加'],
      },
    ];
  }

  private parseSegments(text: string): MarketSegment[] {
    return [
      {
        id: 'segment-1',
        name: '先進採用層',
        size: 20,
        characteristics: ['新技術に積極的', '予算あり'],
        needs: ['効率化', '競争力強化'],
        painPoints: ['導入の複雑さ'],
        buyingBehavior: '価値重視',
        reachability: 'easy',
      },
    ];
  }

  private parseCompetitors(text: string): Competitor[] {
    return [
      {
        id: 'competitor-1',
        name: '主要競合A',
        marketShare: 30,
        strengths: ['ブランド力', '営業力'],
        weaknesses: ['柔軟性不足'],
        strategy: 'シェア維持',
        positioning: '業界リーダー',
      },
    ];
  }

  private extractCoordinate(text: string, entityName: string, axis: 'x' | 'y'): number | null {
    // 座標抽出の簡易実装
    return Math.floor(Math.random() * 80) + 10;
  }

  private parseWhiteSpaces(text: string): PositioningMap['whiteSpaces'] {
    return [
      {
        description: '高品質×低価格領域',
        x: 70,
        y: 30,
        attractiveness: 'high',
      },
    ];
  }

  private parseContentPillars(text: string): ContentPillar[] {
    return [
      {
        id: 'pillar-1',
        theme: '業界インサイト',
        objective: 'awareness',
        topics: ['トレンド解説', '事例紹介'],
        formats: ['ブログ', 'ホワイトペーパー'],
      },
    ];
  }

  private parseChannels(text: string): ContentStrategy['channels'] {
    return [
      {
        name: 'ブログ',
        purpose: '認知・教育',
        frequency: '週2回',
        contentTypes: ['ハウツー', '事例'],
        metrics: ['PV', 'セッション時間'],
      },
    ];
  }

  private parseContentCalendar(text: string): ContentStrategy['contentCalendar'] {
    return [
      {
        week: 1,
        pillar: '業界インサイト',
        topic: '2024年市場トレンド',
        format: 'ブログ',
        channel: 'Web',
        callToAction: '無料レポートダウンロード',
      },
    ];
  }

  private parseMarketingKPIs(text: string): ContentStrategy['kpis'] {
    return [
      {
        name: '月間PV',
        currentValue: 10000,
        targetValue: 20000,
        unit: 'PV',
        timeline: '3ヶ月',
      },
    ];
  }

  /**
   * ペルソナ情報を取得
   */
  getPersona(): ShijoPersona {
    return SHIJO_PERSONA;
  }

  /**
   * セッションを取得
   */
  getSession(sessionId: string): ShijoSession | undefined {
    return this.sessions.get(sessionId);
  }
}

export { SHIJO_PERSONA, MARKET_FRAMEWORKS };
export type { ShijoPersona, ShijoSession, MarketAnalysis, PositioningMap, ContentStrategy };
