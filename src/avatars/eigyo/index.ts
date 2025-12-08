/**
 * 営業コンサルアバター「営業」
 *
 * 営業チームの変革と個人の成長を支援する
 * ヒーロー化対話と科学的営業プロセスで成果を最大化
 */

import Anthropic from '@anthropic-ai/sdk';
import { SALES_PROCESSES, OBJECTION_PATTERNS, getProcessByPhase, getNextPhase } from './sales-process.js';
import type {
  EigyoPersona,
  SalesCoachingSession,
  DealContext,
  SkillsAssessment,
  SalesActionItem,
  HeroStory,
  NeedsBehindNeeds,
  ValueProposition,
} from './types.js';

const EIGYO_PERSONA: EigyoPersona = {
  id: 'eigyo',
  name: '営業',
  role: '営業コンサルタント',
  description: '営業のプロフェッショナルとして、あなたの成長と成果を全力で支援します。共に「ヒーロー」になりましょう！',
  communicationStyle: {
    tone: '情熱的で実践的',
    approach: 'ヒーロー化・科学的営業',
    principle: '行動レベル実装',
  },
  values: [
    '営業は顧客への価値提供',
    '失敗は成長の糧',
    '継続的な改善',
    'チームで勝つ',
  ],
  behaviorPrinciples: [
    '具体的な行動に落とし込む',
    '成功体験を積み重ねる',
    'ロールプレイで実践力を磨く',
    '数字で成果を可視化する',
  ],
};

const SYSTEM_PROMPT = `
あなたは「営業」という名前の営業コンサルタントです。

## ペルソナ
- 情熱的で実践的な対話を行います
- 営業パーソンを「ヒーロー」として扱い、成長を支援します
- 科学的な営業プロセスに基づいたアドバイスを提供します
- 行動レベルまで落とし込んだ具体的な支援を行います

## 対話の原則
1. まず成功体験を引き出し、称賛する
2. 課題を一緒に分析し、解決策を探る
3. 具体的なアクションプランを作成する
4. ロールプレイやシミュレーションで実践力を磨く
5. 小さな成功を積み重ねる

## 活用するフレームワーク
- 科学的営業プロセス（6フェーズ）
- ニーズビハインドニーズ
- 応酬話法パターン
- ヒーローストーリー

## 対話スタイル
- 励ましと共感を大切にする
- 「できる」「やれる」というポジティブな言葉を使う
- 具体例を多用する
- 実践的なロールプレイを提案する
`;

export class EigyoAvatar {
  private anthropic: Anthropic;
  private sessions: Map<string, SalesCoachingSession>;
  private heroStories: HeroStory[];

  constructor() {
    this.anthropic = new Anthropic();
    this.sessions = new Map();
    this.heroStories = [];
  }

  /**
   * コーチングセッションを開始
   */
  startSession(salesPersonId: string): SalesCoachingSession {
    const sessionId = `eigyo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: SalesCoachingSession = {
      sessionId,
      salesPersonId,
      skillsAssessment: this.initializeSkillsAssessment(),
      actionPlan: [],
      heroMoments: [],
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
    suggestedActions: SalesActionItem[];
    rolePlaySuggestion?: string;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    // ヒーローモーメントの検出
    const heroMoment = this.detectHeroMoment(userMessage);
    if (heroMoment) {
      session.heroMoments.push(heroMoment);
    }

    // 応答生成
    const response = await this.generateResponse(session, userMessage);

    // アクション提案の生成
    const suggestedActions = await this.generateActionSuggestions(session, userMessage);

    // ロールプレイ提案の検討
    const rolePlaySuggestion = this.considerRolePlay(userMessage, session);

    return {
      response,
      suggestedActions,
      rolePlaySuggestion,
    };
  }

  /**
   * 案件コンテキストを設定
   */
  setDealContext(sessionId: string, context: DealContext): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.dealContext = context;
    }
  }

  /**
   * スキル診断を実行
   */
  async assessSkills(sessionId: string, responses: Record<string, number>): Promise<SkillsAssessment> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const assessment: SkillsAssessment = {
      approach: responses.approach || 0,
      discovery: responses.discovery || 0,
      presentation: responses.presentation || 0,
      handling: responses.handling || 0,
      closing: responses.closing || 0,
      relationship: responses.relationship || 0,
      overallScore: 0,
      strengths: [],
      developmentAreas: [],
    };

    // 総合スコア計算
    const scores = [
      assessment.approach,
      assessment.discovery,
      assessment.presentation,
      assessment.handling,
      assessment.closing,
      assessment.relationship,
    ];
    assessment.overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    // 強み・改善点の特定
    const skillNames = ['アプローチ', 'ニーズ発見', 'プレゼン', '反論対応', 'クロージング', '関係構築'];
    scores.forEach((score, index) => {
      if (score >= 80) {
        assessment.strengths.push(skillNames[index]);
      } else if (score < 60) {
        assessment.developmentAreas.push(skillNames[index]);
      }
    });

    session.skillsAssessment = assessment;
    return assessment;
  }

  /**
   * ニーズビハインドニーズを分析
   */
  async analyzeNeedsBehindNeeds(surfaceNeed: string): Promise<NeedsBehindNeeds> {
    const prompt = `
以下の表面的なニーズから、深層のニーズを分析してください。

表面ニーズ: ${surfaceNeed}

以下の観点で分析:
1. より深いニーズ（業務レベル）
2. 感情的なニーズ（個人レベル）
3. ビジネスへの影響
4. アプローチ戦略
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      surfaceNeed,
      deeperNeed: this.extractAnalysis(text, '深いニーズ'),
      emotionalNeed: this.extractAnalysis(text, '感情的'),
      businessImpact: this.extractAnalysis(text, 'ビジネス'),
      approachStrategy: this.extractAnalysis(text, 'アプローチ'),
    };
  }

  /**
   * 価値提案を作成
   */
  async createValueProposition(
    targetSegment: string,
    customerProblem: string,
    solution: string
  ): Promise<ValueProposition> {
    const prompt = `
以下の情報から価値提案を作成してください。

ターゲット: ${targetSegment}
顧客の課題: ${customerProblem}
ソリューション: ${solution}

以下を作成:
1. ユニークな価値（競合との違い）
2. 証拠・実績（3つ）
3. エレベーターピッチ（30秒で伝える文章）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      targetSegment,
      customerProblem,
      solution,
      uniqueValue: this.extractAnalysis(text, 'ユニーク'),
      proof: this.extractListFromText(text, '証拠'),
      elevator: this.extractAnalysis(text, 'エレベーター'),
    };
  }

  /**
   * ロールプレイシナリオを生成
   */
  async generateRolePlayScenario(
    phase: string,
    challenge: string
  ): Promise<{
    scenario: string;
    customerRole: string;
    objectives: string[];
    tips: string[];
  }> {
    const prompt = `
営業ロールプレイのシナリオを作成してください。

フェーズ: ${phase}
課題: ${challenge}

以下を含めてください:
1. シナリオ設定（背景、状況）
2. 顧客役の設定（態度、反応パターン）
3. 達成目標（3つ）
4. 成功のためのヒント（3つ）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      scenario: this.extractAnalysis(text, 'シナリオ'),
      customerRole: this.extractAnalysis(text, '顧客役'),
      objectives: this.extractListFromText(text, '達成目標'),
      tips: this.extractListFromText(text, 'ヒント'),
    };
  }

  // プライベートメソッド

  private initializeSkillsAssessment(): SkillsAssessment {
    return {
      approach: 0,
      discovery: 0,
      presentation: 0,
      handling: 0,
      closing: 0,
      relationship: 0,
      overallScore: 0,
      strengths: [],
      developmentAreas: [],
    };
  }

  private detectHeroMoment(message: string): string | null {
    const heroKeywords = ['受注', '成約', '達成', '成功', '感謝', '信頼'];
    const hasHeroMoment = heroKeywords.some(kw => message.includes(kw));

    if (hasHeroMoment) {
      return message;
    }
    return null;
  }

  private async generateResponse(session: SalesCoachingSession, userMessage: string): Promise<string> {
    const contextPrompt = `
営業パーソンID: ${session.salesPersonId}
スキル総合スコア: ${session.skillsAssessment.overallScore}
強み: ${session.skillsAssessment.strengths.join(', ') || 'まだ診断していません'}
ヒーローモーメント数: ${session.heroMoments.length}
${session.dealContext ? `案件: ${session.dealContext.customerName} (${session.dealContext.currentPhase})` : ''}

ユーザーの発言: ${userMessage}

営業コーチとして、励ましながら具体的なアドバイスをしてください。
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contextPrompt }],
    });

    return (response.content[0] as { type: 'text'; text: string }).text;
  }

  private async generateActionSuggestions(
    session: SalesCoachingSession,
    userMessage: string
  ): Promise<SalesActionItem[]> {
    // 改善エリアに基づいてアクションを提案
    const actions: SalesActionItem[] = [];

    for (const area of session.skillsAssessment.developmentAreas.slice(0, 2)) {
      actions.push({
        id: `action-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        action: `${area}スキルの強化練習`,
        skill: area,
        priority: 'high',
        deadline: '1週間以内',
        successMetric: 'ロールプレイ3回実施',
      });
    }

    return actions;
  }

  private considerRolePlay(message: string, session: SalesCoachingSession): string | undefined {
    const rolePlayTriggers = ['練習', 'うまくいかない', '苦手', '不安', 'どう言えば'];
    const shouldSuggest = rolePlayTriggers.some(trigger => message.includes(trigger));

    if (shouldSuggest) {
      const phase = session.dealContext?.currentPhase || 'discovery';
      return `${getProcessByPhase(phase)?.name}のロールプレイをしてみませんか？`;
    }

    return undefined;
  }

  private extractAnalysis(text: string, keyword: string): string {
    const lines = text.split('\n');
    for (const line of lines) {
      if (line.includes(keyword)) {
        return line.replace(/^[^:：]+[:：]\s*/, '').trim();
      }
    }
    return '';
  }

  private extractListFromText(text: string, sectionKeyword: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    let inSection = false;

    for (const line of lines) {
      if (line.includes(sectionKeyword)) {
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

  /**
   * ペルソナ情報を取得
   */
  getPersona(): EigyoPersona {
    return EIGYO_PERSONA;
  }

  /**
   * セッションを取得
   */
  getSession(sessionId: string): SalesCoachingSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * ヒーローストーリーを追加
   */
  addHeroStory(story: HeroStory): void {
    this.heroStories.push(story);
  }

  /**
   * 関連するヒーローストーリーを検索
   */
  findRelevantStories(scenario: string): HeroStory[] {
    return this.heroStories.filter(story =>
      story.applicableScenarios.some(s => scenario.includes(s))
    );
  }
}

export { EIGYO_PERSONA, SALES_PROCESSES, OBJECTION_PATTERNS };
export type { EigyoPersona, SalesCoachingSession, DealContext, SkillsAssessment };
