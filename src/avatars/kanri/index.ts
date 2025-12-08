/**
 * マネジメントアバター「管理」
 *
 * 中間管理職の課題に寄り添うパートナー
 * 共感的伴走で心理的安全性を確保しながら成長を支援
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  MANAGEMENT_FRAMEWORKS,
  COACHING_QUESTIONS,
  getFramework,
  getApplicableFrameworks,
  getCoachingQuestions,
  assessTeamHealth,
  suggestDevelopmentFocus,
} from './management-framework.js';
import type {
  KanriPersona,
  KanriSession,
  ManagementChallenge,
  TeamMember,
  DelegationPlan,
  TeamDevelopmentPlan,
  TeamHealth,
  ConflictResolution,
  OneOnOneNote,
} from './types.js';

const KANRI_PERSONA: KanriPersona = {
  id: 'kanri',
  name: '管理',
  role: 'マネジメントコンサルタント',
  description: 'マネージャーとしての悩みに寄り添い、共に解決策を探ります。あなたは一人ではありません。',
  communicationStyle: {
    tone: '共感的で支援的',
    approach: '伴走型コーチング',
    principle: '心理的安全性の確保',
  },
  values: [
    'マネージャーの成長がチームの成長',
    '正解を教えるのではなく、一緒に考える',
    '小さな成功体験を積み重ねる',
    '失敗を学びに変える',
  ],
  behaviorPrinciples: [
    'まず共感し、受け止める',
    '質問で気づきを促す',
    '押し付けない',
    '具体的なアクションにつなげる',
  ],
};

const SYSTEM_PROMPT = `
あなたは「管理」という名前のマネジメントコンサルタントです。

## ペルソナ
- 共感的で支援的な対話を行います
- マネージャーの悩みに寄り添い、一緒に考えます
- 答えを教えるのではなく、質問で気づきを促します
- 心理的安全性を大切にし、失敗を責めません

## 対話の原則
1. まず相手の話を聴き、共感を示す
2. 「大変でしたね」「わかります」など気持ちを受け止める
3. 解決策を急がず、状況を十分に理解する
4. オープンクエスチョンで内省を促す
5. 小さな一歩から始められるアクションを一緒に考える

## 活用するフレームワーク
- 状況対応型リーダーシップ
- 心理的安全性の構築
- 効果的な権限委譲
- 1on1ミーティングの極意

## 対話スタイル
- 「〜ですよね」と共感を示す
- 「どう思われますか？」と問いかける
- 「一緒に考えましょう」と伴走する姿勢
- 専門用語を使わず、わかりやすく話す
- マネージャーを孤独にさせない
`;

export class KanriAvatar {
  private anthropic: Anthropic;
  private sessions: Map<string, KanriSession>;

  constructor() {
    this.anthropic = new Anthropic();
    this.sessions = new Map();
  }

  /**
   * セッションを開始
   */
  startSession(
    managerId: string,
    challengeType: KanriSession['challengeType'] = 'general'
  ): KanriSession {
    const sessionId = `kanri-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: KanriSession = {
      sessionId,
      managerId,
      challengeType,
      teamMembers: [],
      conversationHistory: [],
      actionItems: [],
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
    suggestedQuestion?: string;
    framework?: string;
    actionItems: string[];
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

    // 課題カテゴリを検出
    const detectedCategory = this.detectChallengeCategory(userMessage);
    if (detectedCategory && !session.currentChallenge) {
      session.challengeType = detectedCategory;
    }

    // フレームワークを提案
    const framework = this.suggestFramework(userMessage, session.challengeType);

    // コーチング質問を選択
    const suggestedQuestion = this.selectCoachingQuestion(session);

    // 応答を生成
    const response = await this.generateResponse(session, userMessage, framework);

    // アクションアイテムを抽出
    const newActions = this.extractActionItems(response);
    session.actionItems.push(...newActions);

    // 会話履歴に追加
    session.conversationHistory.push({
      role: 'assistant',
      content: response,
      timestamp: new Date(),
    });

    return {
      response,
      suggestedQuestion,
      framework,
      actionItems: session.actionItems,
    };
  }

  /**
   * チームメンバーを登録
   */
  addTeamMember(sessionId: string, member: TeamMember): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.teamMembers.push(member);
    }
  }

  /**
   * 1on1ノートを追加
   */
  addOneOnOneNote(
    sessionId: string,
    memberId: string,
    note: OneOnOneNote
  ): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const member = session.teamMembers.find(m => m.id === memberId);
    if (member) {
      member.oneOnOneNotes.push(note);
    }
  }

  /**
   * 権限委譲プランを作成
   */
  async createDelegationPlan(
    sessionId: string,
    taskName: string,
    taskDescription: string
  ): Promise<DelegationPlan> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const prompt = `
以下のタスクの権限委譲プランを作成してください。

タスク名: ${taskName}
説明: ${taskDescription}

チームメンバー:
${session.teamMembers.map(m => `- ${m.name}（${m.role}）: 強み[${m.strengths.join(', ')}]`).join('\n') || '情報なし'}

以下の項目を含めてください:
1. 適任者とその理由
2. サポートレベル（全面サポート/定期チェック/自律実行）
3. マイルストーン（3つ）
4. 成功基準（3つ）
5. リスク軽減策（2つ）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      taskId: `task-${Date.now()}`,
      taskName,
      delegateTo: this.extractValue(text, '適任者') || '未定',
      reason: this.extractValue(text, '理由') || '',
      supportLevel: this.determineSupportLevel(text),
      milestones: this.parseMilestones(text),
      successCriteria: this.extractListItems(text, '成功基準'),
      riskMitigation: this.extractListItems(text, 'リスク'),
    };
  }

  /**
   * チーム開発プランを作成
   */
  async createTeamDevelopmentPlan(
    sessionId: string,
    teamName: string,
    currentHealth: Partial<TeamHealth>
  ): Promise<TeamDevelopmentPlan> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const health = assessTeamHealth(currentHealth);
    const focusAreas = suggestDevelopmentFocus(health);

    const prompt = `
以下のチームの開発プランを作成してください。

チーム名: ${teamName}
現在のチーム健全性スコア:
- 心理的安全性: ${health.psychologicalSafety}/100
- 明確性: ${health.clarity}/100
- エンゲージメント: ${health.engagement}/100
- 協働: ${health.collaboration}/100
- 成果: ${health.performance}/100
- 総合: ${health.overallScore}/100

改善フォーカス:
${focusAreas.map((f, i) => `${i + 1}. ${f}`).join('\n')}

3つの具体的な施策を提案してください。各施策には:
1. 目的
2. アクション（3つ）
3. 担当
4. タイムライン
5. 成功指標
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      teamId: `team-${Date.now()}`,
      teamName,
      currentState: health,
      targetState: {
        ...health,
        psychologicalSafety: Math.min(100, health.psychologicalSafety + 20),
        clarity: Math.min(100, health.clarity + 15),
        engagement: Math.min(100, health.engagement + 15),
        collaboration: Math.min(100, health.collaboration + 15),
        performance: Math.min(100, health.performance + 10),
        overallScore: Math.min(100, health.overallScore + 15),
      },
      initiatives: this.parseInitiatives(text),
      timeline: '3ヶ月',
    };
  }

  /**
   * コンフリクト解決プランを作成
   */
  async createConflictResolutionPlan(
    parties: string[],
    conflictDescription: string
  ): Promise<ConflictResolution> {
    const prompt = `
以下のコンフリクトの解決プランを作成してください。

当事者: ${parties.join(', ')}
状況: ${conflictDescription}

以下を分析・提案してください:
1. コンフリクトの性質（対人/タスク/プロセス/地位）
2. 根本原因
3. 解決アプローチ
4. 具体的なステップ（4つ）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      conflictId: `conflict-${Date.now()}`,
      parties,
      nature: this.determineConflictNature(text),
      rootCause: this.extractValue(text, '根本原因') || '',
      approach: this.extractValue(text, 'アプローチ') || '',
      steps: this.parseConflictSteps(text),
    };
  }

  /**
   * 1on1アジェンダを生成
   */
  async generateOneOnOneAgenda(
    sessionId: string,
    memberId: string
  ): Promise<{
    topics: string[];
    questions: string[];
    previousActionItems: string[];
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    const member = session.teamMembers.find(m => m.id === memberId);
    const recentNotes = member?.oneOnOneNotes.slice(-3) || [];

    const previousActionItems = recentNotes.flatMap(n => n.actionItems);
    const followUps = recentNotes.flatMap(n => n.followUp);

    const topics = [
      '最近の仕事で嬉しかったこと・困ったこと',
      ...(followUps.length > 0 ? ['前回からのフォローアップ'] : []),
      'キャリアや成長について',
      '私（マネージャー）へのフィードバック',
    ];

    const questions = getCoachingQuestions().slice(0, 5).map(q => q.question);

    return {
      topics,
      questions,
      previousActionItems,
    };
  }

  // プライベートメソッド

  private detectChallengeCategory(message: string): ManagementChallenge['category'] | null {
    const categories: Record<ManagementChallenge['category'], string[]> = {
      delegation: ['委譲', '任せ', '権限', '自分でやって'],
      communication: ['伝わ', 'コミュニケーション', '報連相', '話し'],
      motivation: ['モチベーション', 'やる気', '意欲', 'エンゲージ'],
      conflict: ['対立', 'ぶつかり', 'もめ', '関係が悪'],
      development: ['育成', '成長', 'スキル', '教育'],
      performance: ['成果', 'パフォーマンス', '目標', '達成'],
    };

    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => message.includes(kw))) {
        return category as ManagementChallenge['category'];
      }
    }

    return null;
  }

  private suggestFramework(message: string, challengeType: string): string | undefined {
    const frameworks = getApplicableFrameworks(challengeType);
    return frameworks[0]?.id;
  }

  private selectCoachingQuestion(session: KanriSession): string | undefined {
    const turnCount = session.conversationHistory.length;

    if (turnCount < 2) {
      return getCoachingQuestions('exploration')[0]?.question;
    } else if (turnCount < 4) {
      return getCoachingQuestions('options')[0]?.question;
    } else {
      return getCoachingQuestions('action')[0]?.question;
    }
  }

  private async generateResponse(
    session: KanriSession,
    userMessage: string,
    framework?: string
  ): Promise<string> {
    const contextPrompt = `
マネージャーID: ${session.managerId}
課題タイプ: ${session.challengeType}
会話ターン数: ${session.conversationHistory.length}
${framework ? `推奨フレームワーク: ${getFramework(framework)?.name}` : ''}
チームメンバー数: ${session.teamMembers.length}

ユーザーの発言: ${userMessage}

共感的なマネジメントコーチとして応答してください。
まず気持ちを受け止め、その後で質問や提案をしてください。
`;

    const messages = session.conversationHistory.slice(-6).map(turn => ({
      role: turn.role as 'user' | 'assistant',
      content: turn.content,
    }));

    messages.push({ role: 'user', content: contextPrompt });

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages,
    });

    return (response.content[0] as { type: 'text'; text: string }).text;
  }

  private extractActionItems(response: string): string[] {
    const actionKeywords = ['してみて', 'やってみ', '試して', 'アクション', '次のステップ'];
    const lines = response.split('\n');

    return lines
      .filter(line => actionKeywords.some(kw => line.includes(kw)))
      .map(line => line.replace(/^[-*\d.]\s*/, '').trim())
      .slice(0, 3);
  }

  private extractValue(text: string, keyword: string): string | null {
    const regex = new RegExp(`${keyword}[：:]\\s*(.+?)(?:\\n|$)`);
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

  private determineSupportLevel(text: string): DelegationPlan['supportLevel'] {
    if (text.includes('全面') || text.includes('密接')) return 'full-support';
    if (text.includes('自律') || text.includes('任せ')) return 'autonomous';
    return 'check-in';
  }

  private parseMilestones(text: string): DelegationPlan['milestones'] {
    return [
      { name: '初期レビュー', dueDate: '1週間後', checkInType: 'meeting', completed: false },
      { name: '中間確認', dueDate: '2週間後', checkInType: 'report', completed: false },
      { name: '最終確認', dueDate: '1ヶ月後', checkInType: 'demo', completed: false },
    ];
  }

  private parseInitiatives(text: string): TeamDevelopmentPlan['initiatives'] {
    return [
      {
        id: 'init-1',
        name: '心理的安全性ワークショップ',
        objective: 'チームの発言しやすさを向上',
        actions: ['ワークショップ開催', '振り返り会実施', 'サーベイ実施'],
        owner: 'マネージャー',
        timeline: '1ヶ月',
        metrics: ['発言数', 'サーベイスコア'],
      },
    ];
  }

  private determineConflictNature(text: string): ConflictResolution['nature'] {
    if (text.includes('対人') || text.includes('関係')) return 'interpersonal';
    if (text.includes('タスク') || text.includes('仕事')) return 'task';
    if (text.includes('地位') || text.includes('権限')) return 'status';
    return 'process';
  }

  private parseConflictSteps(text: string): ConflictResolution['steps'] {
    return [
      { order: 1, action: '個別ヒアリング', responsible: 'マネージャー', timeline: '今週中', status: 'pending' },
      { order: 2, action: '共通点の整理', responsible: 'マネージャー', timeline: '来週', status: 'pending' },
      { order: 3, action: '三者面談', responsible: 'マネージャー', timeline: '2週間後', status: 'pending' },
      { order: 4, action: 'フォローアップ', responsible: 'マネージャー', timeline: '1ヶ月後', status: 'pending' },
    ];
  }

  /**
   * ペルソナ情報を取得
   */
  getPersona(): KanriPersona {
    return KANRI_PERSONA;
  }

  /**
   * セッションを取得
   */
  getSession(sessionId: string): KanriSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * 利用可能なフレームワークを取得
   */
  getAvailableFrameworks(): typeof MANAGEMENT_FRAMEWORKS {
    return MANAGEMENT_FRAMEWORKS;
  }
}

export { KANRI_PERSONA, MANAGEMENT_FRAMEWORKS, COACHING_QUESTIONS };
export type { KanriPersona, KanriSession, ManagementChallenge, TeamHealth, DelegationPlan };
