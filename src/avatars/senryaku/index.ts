/**
 * CEOコンサルアバター「戦略」
 *
 * 経営層の思考パートナーとして、
 * 戦略的意思決定を支援し、統合的な経営報告を作成する
 */

import Anthropic from '@anthropic-ai/sdk';
import { STRATEGIC_FRAMEWORKS, getFramework, getApplicableFrameworks } from './frameworks.js';
import type {
  SenryakuPersona,
  SenryakuSession,
  DecisionContext,
  IntegratedReport,
  ConversationTurn,
  Recommendation,
  ActionItem,
  KPI,
} from './types.js';

const SENRYAKU_PERSONA: SenryakuPersona = {
  id: 'senryaku',
  name: '戦略',
  role: 'CEO戦略コンサルタント',
  description: '経営者の思考パートナーとして、俯瞰的な視点から戦略的意思決定を支援します。',
  communicationStyle: {
    tone: '知的で戦略的',
    approach: '俯瞰的視点・長期思考',
    principle: '意思決定支援',
  },
  values: [
    '長期的な企業価値の最大化',
    '論理と直感の統合',
    '持続可能な成長',
    'ステークホルダーとの共創',
  ],
  behaviorPrinciples: [
    '本質的な問いを投げかける',
    'データと直感の両方を重視',
    '選択肢を広げてから絞り込む',
    '実行可能性を常に意識',
  ],
};

const SYSTEM_PROMPT = `
あなたは「戦略」という名前のCEOコンサルタントです。

## ペルソナ
- 知的で戦略的な対話を行います
- 俯瞰的な視点から物事を捉え、長期的思考を促します
- 意思決定を支援しますが、最終判断は経営者に委ねます

## 対話の原則
1. 本質的な問いを投げかける
2. フレームワークを活用して思考を整理する
3. 選択肢を広げてから絞り込む
4. リスクと機会の両面を示す
5. 実行可能性を常に確認する

## 活用するフレームワーク
- 付加価値経営®（6つの価値軸）
- 戦略的意思決定マトリクス
- シナリオプランニング
- その他、状況に応じて適切なフレームワーク

## 対話スタイル
- 経営者として対等なパートナーとして接する
- 専門用語を使う場合は簡潔に説明を加える
- 具体例や数字を交えて説明する
- 「もし〜だとしたら？」という問いで視野を広げる
`;

export class SenryakuAvatar {
  private anthropic: Anthropic;
  private sessions: Map<string, SenryakuSession>;

  constructor() {
    this.anthropic = new Anthropic();
    this.sessions = new Map();
  }

  /**
   * 新しいセッションを開始
   */
  startSession(
    clientId: string,
    topic: SenryakuSession['topic']
  ): SenryakuSession {
    const sessionId = `senryaku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: SenryakuSession = {
      sessionId,
      clientId,
      topic,
      context: null,
      conversationHistory: [],
      insights: [],
      generatedReports: [],
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
    suggestedFrameworks: string[];
    insights: string[];
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    // 会話履歴に追加
    session.conversationHistory.push({
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });

    // 適用可能なフレームワークを特定
    const suggestedFrameworks = this.identifyApplicableFrameworks(userMessage, session.topic);

    // AIで応答生成
    const response = await this.generateResponse(session, userMessage, suggestedFrameworks);

    // インサイトを抽出
    const newInsights = await this.extractInsights(userMessage, response);
    session.insights.push(...newInsights);

    // 会話履歴に追加
    session.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      frameworks: suggestedFrameworks,
    });

    return {
      response,
      suggestedFrameworks,
      insights: session.insights,
    };
  }

  /**
   * 意思決定コンテキストを設定
   */
  setDecisionContext(sessionId: string, context: DecisionContext): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.context = context;
    }
  }

  /**
   * 統合報告書を生成
   */
  async generateIntegratedReport(sessionId: string): Promise<IntegratedReport> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const conversationSummary = session.conversationHistory
      .map(turn => `${turn.role}: ${turn.content}`)
      .join('\n');

    const prompt = `
以下の対話内容に基づいて、統合報告書を作成してください。

## 対話履歴
${conversationSummary}

## 抽出されたインサイト
${session.insights.join('\n')}

## 出力形式
1. エグゼクティブサマリー（3-5文）
2. 戦略分析
   - 現状認識
   - 課題
   - 機会
3. 推奨事項（優先順位付き）
4. アクションプラン
5. KPI設定
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: 'あなたは経営コンサルタントとして統合報告書を作成します。簡潔で実行可能な内容にしてください。',
      messages: [{ role: 'user', content: prompt }],
    });

    const reportText = (response.content[0] as { type: 'text'; text: string }).text;

    // レポートをパース（簡易実装）
    const report: IntegratedReport = {
      executiveSummary: this.extractSection(reportText, 'エグゼクティブサマリー'),
      strategicAnalysis: {
        currentState: this.extractSection(reportText, '現状認識'),
        challenges: this.extractListItems(reportText, '課題'),
        opportunities: this.extractListItems(reportText, '機会'),
      },
      recommendations: this.parseRecommendations(reportText),
      actionPlan: this.parseActionPlan(reportText),
      kpis: this.parseKPIs(reportText),
    };

    session.generatedReports.push(report);
    return report;
  }

  /**
   * フレームワークを特定
   */
  private identifyApplicableFrameworks(message: string, topic: string): string[] {
    const frameworks = getApplicableFrameworks(topic);

    // メッセージ内容から追加のフレームワークを特定
    const keywords: Record<string, string[]> = {
      'value-based-management': ['価値', '経営', '改革', '統合'],
      'decision-matrix': ['判断', '意思決定', '選択', '投資'],
      'scenario-planning': ['将来', 'シナリオ', '不確実', '変化'],
    };

    const additionalFrameworks: string[] = [];
    for (const [frameworkId, kws] of Object.entries(keywords)) {
      if (kws.some(kw => message.includes(kw))) {
        if (!frameworks.find(f => f.id === frameworkId)) {
          additionalFrameworks.push(frameworkId);
        }
      }
    }

    return [...frameworks.map(f => f.id), ...additionalFrameworks];
  }

  /**
   * AIで応答を生成
   */
  private async generateResponse(
    session: SenryakuSession,
    userMessage: string,
    frameworks: string[]
  ): Promise<string> {
    const contextPrompt = `
セッショントピック: ${session.topic}
適用フレームワーク: ${frameworks.join(', ')}
これまでの会話ターン数: ${session.conversationHistory.length}
${session.context ? `意思決定コンテキスト: ${JSON.stringify(session.context)}` : ''}

ユーザーの発言: ${userMessage}

経営者の思考パートナーとして、適切な応答をしてください。
必要に応じてフレームワークを活用し、本質的な問いを投げかけてください。
`;

    const messages = session.conversationHistory.map(turn => ({
      role: turn.role as 'user' | 'assistant',
      content: turn.content,
    }));

    messages.push({ role: 'user', content: contextPrompt });

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages,
    });

    return (response.content[0] as { type: 'text'; text: string }).text;
  }

  /**
   * インサイトを抽出
   */
  private async extractInsights(userMessage: string, response: string): Promise<string[]> {
    const prompt = `
以下の対話から、重要なビジネスインサイトを1-2個抽出してください。

ユーザー: ${userMessage}
アシスタント: ${response}

インサイトは1行で簡潔に表現してください。
`;

    const result = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 200,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (result.content[0] as { type: 'text'; text: string }).text;
    return text.split('\n').filter(line => line.trim().length > 0);
  }

  // ヘルパーメソッド
  private extractSection(text: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[：:]?\\s*([^#]+?)(?=\\n#|$)`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractListItems(text: string, sectionName: string): string[] {
    const section = this.extractSection(text, sectionName);
    return section.split('\n')
      .map(line => line.replace(/^[-*•]\s*/, '').trim())
      .filter(line => line.length > 0);
  }

  private parseRecommendations(text: string): Recommendation[] {
    const section = this.extractSection(text, '推奨事項');
    const items = section.split('\n').filter(line => line.trim());

    return items.map((item, index) => ({
      priority: index + 1,
      title: item.replace(/^\d+\.\s*/, '').split(':')[0] || item,
      rationale: '',
      expectedImpact: '',
      resources: [],
    }));
  }

  private parseActionPlan(text: string): ActionItem[] {
    const section = this.extractSection(text, 'アクションプラン');
    const items = section.split('\n').filter(line => line.trim());

    return items.map((item, index) => ({
      id: `action-${index + 1}`,
      action: item.replace(/^\d+\.\s*/, ''),
      owner: '未定',
      deadline: '要設定',
      dependencies: [],
    }));
  }

  private parseKPIs(text: string): KPI[] {
    const section = this.extractSection(text, 'KPI');
    const items = section.split('\n').filter(line => line.trim());

    return items.map(item => ({
      name: item.replace(/^\d+\.\s*/, '').split(':')[0] || item,
      currentValue: '現状値',
      targetValue: '目標値',
      unit: '',
      timeline: '1年',
    }));
  }

  /**
   * ペルソナ情報を取得
   */
  getPersona(): SenryakuPersona {
    return SENRYAKU_PERSONA;
  }

  /**
   * セッションを取得
   */
  getSession(sessionId: string): SenryakuSession | undefined {
    return this.sessions.get(sessionId);
  }
}

export { SENRYAKU_PERSONA, STRATEGIC_FRAMEWORKS };
export type { SenryakuPersona, SenryakuSession, IntegratedReport };
