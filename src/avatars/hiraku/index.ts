/**
 * 初期相談アバター「ひらく」
 *
 * 深い傾聴と探索的質問を通じて、
 * クライアントの課題を特定し、最適なアバター構成を推薦する
 */

import Anthropic from '@anthropic-ai/sdk';
import { DIAGNOSIS_LAYERS, getDiagnosisLayer, getAllQuestions } from './diagnosis-model.js';
import { matchAvatarsToIssues } from './avatar-matching.js';
import type {
  HirakuPersona,
  HirakuSession,
  IdentifiedIssue,
  AvatarRecommendation,
  DiagnosisQuestion,
  IssuePriorityMatrix,
} from './types.js';

const HIRAKU_PERSONA: HirakuPersona = {
  id: 'hiraku',
  name: 'ひらく',
  role: '初期相談コンサルタント',
  description: '深い傾聴と探索的質問を通じて、あなたの課題を明らかにし、最適な支援を見つけるお手伝いをします。',
  communicationStyle: {
    tone: '温かく受容的',
    approach: '深い傾聴・探索的質問',
    principle: '非処方的ガイダンス',
  },
  values: [
    '傾聴を通じた信頼構築',
    '押し付けない対話',
    '本質的な課題の発見',
    '最適な支援への橋渡し',
  ],
  behaviorPrinciples: [
    '判断せずに聴く',
    '質問で導く',
    '沈黙を恐れない',
    '感情に寄り添う',
  ],
};

const SYSTEM_PROMPT = `
あなたは「ひらく」という名前の初期相談コンサルタントです。

## ペルソナ
- 温かく受容的な雰囲気で対話します
- 深い傾聴と探索的質問を通じて、クライアントの本質的な課題を見つけます
- 決して押し付けや処方的なアドバイスはしません
- 相手のペースに合わせて、じっくりと対話を進めます

## 対話の原則
1. まず相手の話を十分に聴く
2. 「なるほど」「そうですか」など共感を示す
3. オープンクエスチョンで深堀りする
4. 相手の言葉を使って確認する
5. 課題の優先順位を一緒に整理する

## 診断の目的
- クライアントの現状と課題を多角的に理解する
- 5層企業診断モデルを活用して体系的に把握する
- 最適なアバター（専門コンサルタント）を推薦する

## 対話スタイル
- 1回の発言は3-4文程度に抑える
- 必ず1つの質問で締める
- 専門用語は使わず、わかりやすい言葉で話す
`;

export class HirakuAvatar {
  private anthropic: Anthropic;
  private sessions: Map<string, HirakuSession>;

  constructor() {
    this.anthropic = new Anthropic();
    this.sessions = new Map();
  }

  /**
   * 新しいセッションを開始
   */
  startSession(clientId: string): HirakuSession {
    const sessionId = `hiraku-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const session: HirakuSession = {
      sessionId,
      clientId,
      startedAt: new Date(),
      currentLayer: 1,
      answers: new Map(),
      identifiedIssues: [],
      recommendedAvatars: [],
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
    currentLayer: number;
    progress: number;
    isComplete: boolean;
  }> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('セッションが見つかりません');
    }

    // 回答を記録
    const currentQuestion = this.getCurrentQuestion(session);
    if (currentQuestion) {
      session.answers.set(currentQuestion.id, userMessage);
    }

    // 課題を分析
    const identifiedIssue = await this.analyzeForIssues(userMessage, currentQuestion);
    if (identifiedIssue) {
      session.identifiedIssues.push(identifiedIssue);
    }

    // 次のレイヤーに進むべきか判断
    const layerComplete = this.isLayerComplete(session);
    if (layerComplete && session.currentLayer < 5) {
      session.currentLayer++;
    }

    // 進捗計算
    const totalQuestions = getAllQuestions().length;
    const answeredQuestions = session.answers.size;
    const progress = Math.round((answeredQuestions / totalQuestions) * 100);

    // 診断完了判定
    const isComplete = session.currentLayer === 5 && layerComplete;

    // AIで応答生成
    const response = await this.generateResponse(session, userMessage, isComplete);

    // 完了時にアバター推薦を生成
    if (isComplete) {
      session.recommendedAvatars = matchAvatarsToIssues(session.identifiedIssues);
    }

    return {
      response,
      currentLayer: session.currentLayer,
      progress,
      isComplete,
    };
  }

  /**
   * 現在の質問を取得
   */
  private getCurrentQuestion(session: HirakuSession): DiagnosisQuestion | undefined {
    const layer = getDiagnosisLayer(session.currentLayer);
    if (!layer) return undefined;

    return layer.questions.find(q => !session.answers.has(q.id));
  }

  /**
   * レイヤー完了判定
   */
  private isLayerComplete(session: HirakuSession): boolean {
    const layer = getDiagnosisLayer(session.currentLayer);
    if (!layer) return true;

    return layer.questions.every(q => session.answers.has(q.id));
  }

  /**
   * 回答から課題を分析
   */
  private async analyzeForIssues(
    answer: string,
    question?: DiagnosisQuestion
  ): Promise<IdentifiedIssue | null> {
    if (!question) return null;

    // ネガティブキーワードの検出
    const negativeKeywords = ['課題', '問題', '難しい', 'できていない', '不十分', '悩み'];
    const hasIssue = negativeKeywords.some(kw => answer.includes(kw));

    if (hasIssue) {
      const priority: IssuePriorityMatrix = {
        urgency: this.estimateUrgency(answer),
        impact: this.estimateImpact(answer, question.weight),
        resourceRequired: 'medium',
        recommendedAction: '専門アバターによる詳細分析を推奨',
      };

      return {
        id: `issue-${Date.now()}`,
        category: question.category,
        description: this.summarizeIssue(answer),
        priority,
        relatedValues: this.mapCategoryToValues(question.category),
      };
    }

    return null;
  }

  private estimateUrgency(answer: string): 1 | 2 | 3 | 4 | 5 {
    const urgentKeywords = ['すぐに', '急ぎ', '早急', '危機'];
    const hasUrgent = urgentKeywords.some(kw => answer.includes(kw));
    return hasUrgent ? 5 : 3;
  }

  private estimateImpact(answer: string, weight: number): 1 | 2 | 3 | 4 | 5 {
    return Math.min(5, Math.round(weight * 3)) as 1 | 2 | 3 | 4 | 5;
  }

  private summarizeIssue(answer: string): string {
    return answer.length > 50 ? answer.substring(0, 50) + '...' : answer;
  }

  private mapCategoryToValues(category: string): string[] {
    const mapping: Record<string, string[]> = {
      vision: ['ビジョン'],
      strategy: ['戦略'],
      execution: ['実行力'],
      talent: ['人材'],
      innovation: ['イノベーション'],
      customer: ['顧客価値'],
    };
    return mapping[category] || [];
  }

  /**
   * AIで応答を生成
   */
  private async generateResponse(
    session: HirakuSession,
    userMessage: string,
    isComplete: boolean
  ): Promise<string> {
    const currentLayer = getDiagnosisLayer(session.currentLayer);
    const nextQuestion = this.getCurrentQuestion(session);

    let contextPrompt = `
現在のレイヤー: ${currentLayer?.name || '完了'}
進捗: ${session.answers.size}/${getAllQuestions().length}問
特定された課題数: ${session.identifiedIssues.length}

ユーザーの発言: ${userMessage}
`;

    if (isComplete) {
      contextPrompt += `
診断が完了しました。以下の課題が特定されました:
${session.identifiedIssues.map(i => `- ${i.category}: ${i.description}`).join('\n')}

推薦アバター:
${session.recommendedAvatars.map(r => `- ${r.avatarName}: ${r.reason}`).join('\n')}

診断結果をまとめ、次のステップを提案してください。
`;
    } else if (nextQuestion) {
      contextPrompt += `
次の質問: ${nextQuestion.text}
この質問を自然な形で投げかけてください。
`;
    }

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: contextPrompt },
      ],
    });

    return (response.content[0] as { type: 'text'; text: string }).text;
  }

  /**
   * セッション結果を取得
   */
  getSessionResult(sessionId: string): {
    issues: IdentifiedIssue[];
    recommendations: AvatarRecommendation[];
  } | null {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    return {
      issues: session.identifiedIssues,
      recommendations: session.recommendedAvatars,
    };
  }

  /**
   * ペルソナ情報を取得
   */
  getPersona(): HirakuPersona {
    return HIRAKU_PERSONA;
  }
}

export { HIRAKU_PERSONA, DIAGNOSIS_LAYERS };
export type { HirakuPersona, HirakuSession, IdentifiedIssue, AvatarRecommendation };
