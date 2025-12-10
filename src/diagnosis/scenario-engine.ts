/**
 * 診断シナリオエンジン
 *
 * 質問フロー管理、回答分岐、進捗管理を担当
 */

import {
  DiagnosisSession,
  DiagnosisQuestion,
  DiagnosisPhase,
  Answer,
  DiagnosisScenario,
  SkipCondition,
  IssueAxis,
} from './types.js';

/**
 * 診断シナリオエンジンクラス
 */
export class ScenarioEngine {
  private scenario: DiagnosisScenario;
  private session: DiagnosisSession | null = null;
  private questionMap: Map<string, DiagnosisQuestion>;
  private phaseQuestionMap: Map<DiagnosisPhase, string[]>;

  constructor(scenario: DiagnosisScenario) {
    this.scenario = scenario;
    this.questionMap = new Map(
      scenario.questions.map((q) => [q.id, q])
    );
    this.phaseQuestionMap = new Map(
      scenario.phases.map((p) => [p.phase, p.questionIds])
    );
  }

  /**
   * 新規セッション開始
   */
  startSession(metadata?: DiagnosisSession['metadata']): DiagnosisSession {
    const firstPhase = this.scenario.phases[0];
    const firstQuestionId = firstPhase?.questionIds[0] ?? null;

    this.session = {
      sessionId: this.generateSessionId(),
      startedAt: new Date().toISOString(),
      currentPhase: 'initial',
      currentQuestionId: firstQuestionId,
      answers: [],
      progress: 0,
      metadata,
    };

    return this.session;
  }

  /**
   * セッション復元
   */
  restoreSession(session: DiagnosisSession): void {
    this.session = session;
  }

  /**
   * 現在のセッション取得
   */
  getSession(): DiagnosisSession | null {
    return this.session;
  }

  /**
   * 現在の質問取得
   */
  getCurrentQuestion(): DiagnosisQuestion | null {
    if (!this.session || !this.session.currentQuestionId) {
      return null;
    }
    return this.questionMap.get(this.session.currentQuestionId) ?? null;
  }

  /**
   * 回答を記録し、次の質問を決定
   */
  answerQuestion(questionId: string, value: string | number | string[]): {
    success: boolean;
    nextQuestion: DiagnosisQuestion | null;
    sessionCompleted: boolean;
  } {
    if (!this.session) {
      throw new Error('Session not started');
    }

    const question = this.questionMap.get(questionId);
    if (!question) {
      throw new Error(`Question not found: ${questionId}`);
    }

    // 回答を記録
    const answer: Answer = {
      questionId,
      value,
      timestamp: new Date().toISOString(),
    };
    this.session.answers.push(answer);

    // 次の質問を決定
    const nextQuestionId = this.determineNextQuestion(question, value);

    if (nextQuestionId === null) {
      // フェーズ完了、次のフェーズへ
      const nextPhaseQuestion = this.moveToNextPhase();
      if (nextPhaseQuestion === null) {
        // 全フェーズ完了
        this.session.completedAt = new Date().toISOString();
        this.session.currentQuestionId = null;
        this.session.progress = 100;
        return {
          success: true,
          nextQuestion: null,
          sessionCompleted: true,
        };
      }
      this.session.currentQuestionId = nextPhaseQuestion.id;
      this.updateProgress();
      return {
        success: true,
        nextQuestion: nextPhaseQuestion,
        sessionCompleted: false,
      };
    }

    // スキップ条件評価
    let actualNextQuestionId = nextQuestionId;
    let nextQuestion: DiagnosisQuestion | null = this.questionMap.get(actualNextQuestionId) ?? null;

    while (nextQuestion && this.shouldSkipQuestion(nextQuestion)) {
      // スキップされた質問を記録
      this.session.answers.push({
        questionId: nextQuestion.id,
        value: '',
        timestamp: new Date().toISOString(),
        skipped: true,
      });

      const skippedNextId = this.determineNextQuestion(nextQuestion, '');
      if (skippedNextId === null) {
        const nextPhaseQuestion = this.moveToNextPhase();
        if (nextPhaseQuestion === null) {
          this.session.completedAt = new Date().toISOString();
          this.session.currentQuestionId = null;
          this.session.progress = 100;
          return {
            success: true,
            nextQuestion: null,
            sessionCompleted: true,
          };
        }
        nextQuestion = nextPhaseQuestion;
        break;
      }
      actualNextQuestionId = skippedNextId;
      nextQuestion = this.questionMap.get(actualNextQuestionId) ?? null;
    }

    this.session.currentQuestionId = nextQuestion?.id ?? null;
    this.updateProgress();

    return {
      success: true,
      nextQuestion,
      sessionCompleted: false,
    };
  }

  /**
   * 次の質問を決定（分岐ロジック）
   */
  private determineNextQuestion(
    question: DiagnosisQuestion,
    value: string | number | string[]
  ): string | null {
    // 回答に基づく分岐
    if (question.options && typeof value === 'string') {
      const selectedOption = question.options.find((opt) => opt.id === value);
      if (selectedOption?.nextQuestion !== undefined) {
        return selectedOption.nextQuestion;
      }
    }

    // デフォルトの次の質問
    if (question.defaultNextQuestion !== undefined) {
      return question.defaultNextQuestion;
    }

    // 同じフェーズ内の次の質問
    const phaseQuestions = this.phaseQuestionMap.get(question.phase) ?? [];
    const currentIndex = phaseQuestions.indexOf(question.id);
    if (currentIndex !== -1 && currentIndex < phaseQuestions.length - 1) {
      return phaseQuestions[currentIndex + 1];
    }

    // フェーズ終了
    return null;
  }

  /**
   * 次のフェーズへ移動
   */
  private moveToNextPhase(): DiagnosisQuestion | null {
    if (!this.session) return null;

    const phaseOrder: DiagnosisPhase[] = ['initial', 'deep-dive', 'priority', 'summary'];
    const currentPhaseIndex = phaseOrder.indexOf(this.session.currentPhase);

    if (currentPhaseIndex === -1 || currentPhaseIndex >= phaseOrder.length - 1) {
      return null; // 最終フェーズ完了
    }

    const nextPhase = phaseOrder[currentPhaseIndex + 1];
    this.session.currentPhase = nextPhase;

    const nextPhaseQuestionIds = this.phaseQuestionMap.get(nextPhase) ?? [];
    if (nextPhaseQuestionIds.length === 0) {
      return null;
    }

    const firstQuestionId = nextPhaseQuestionIds[0];
    return this.questionMap.get(firstQuestionId) ?? null;
  }

  /**
   * スキップ条件評価
   */
  private shouldSkipQuestion(question: DiagnosisQuestion): boolean {
    if (!question.skipCondition || !this.session) {
      return false;
    }

    const condition = question.skipCondition;

    switch (condition.type) {
      case 'answer-equals':
        return this.evaluateAnswerEquals(condition);
      case 'score-threshold':
        return this.evaluateScoreThreshold(condition);
      case 'phase-complete':
        return this.evaluatePhaseComplete(condition);
      default:
        return false;
    }
  }

  /**
   * answer-equals条件評価
   */
  private evaluateAnswerEquals(condition: SkipCondition): boolean {
    if (!condition.questionId || condition.value === undefined || !this.session) {
      return false;
    }

    const answer = this.session.answers.find(
      (a) => a.questionId === condition.questionId
    );
    if (!answer) {
      return false;
    }

    return answer.value === condition.value;
  }

  /**
   * score-threshold条件評価
   */
  private evaluateScoreThreshold(condition: SkipCondition): boolean {
    if (
      condition.threshold === undefined ||
      !condition.axis ||
      !this.session
    ) {
      return false;
    }

    // 暫定スコア計算（簡易版）
    const axisScore = this.calculateAxisScore(condition.axis);
    return axisScore >= condition.threshold;
  }

  /**
   * phase-complete条件評価
   */
  private evaluatePhaseComplete(_condition: SkipCondition): boolean {
    // 特定フェーズが完了しているか確認
    // 現時点では常にfalse（拡張用）
    return false;
  }

  /**
   * 軸別スコア計算（簡易版）
   */
  private calculateAxisScore(axis: IssueAxis): number {
    if (!this.session) return 0;

    let totalWeight = 0;
    let weightedSum = 0;

    for (const answer of this.session.answers) {
      if (answer.skipped) continue;

      const question = this.questionMap.get(answer.questionId);
      if (!question || !question.relatedAxes.includes(axis)) {
        continue;
      }

      if (question.type === 'scale' && typeof answer.value === 'number') {
        const maxScale = question.scaleRange?.max ?? 5;
        const normalizedScore = (answer.value / maxScale) * 100;
        weightedSum += normalizedScore;
        totalWeight += 1;
      } else if (question.type === 'single-choice' && typeof answer.value === 'string') {
        const option = question.options?.find((opt) => opt.id === answer.value);
        if (option?.weight[axis]) {
          weightedSum += option.weight[axis] * 100;
          totalWeight += 1;
        }
      }
    }

    return totalWeight > 0 ? weightedSum / totalWeight : 0;
  }

  /**
   * 進捗率更新
   */
  private updateProgress(): void {
    if (!this.session) return;

    const totalQuestions = this.scenario.questions.length;
    const answeredQuestions = this.session.answers.length;
    this.session.progress = Math.min(
      100,
      Math.round((answeredQuestions / totalQuestions) * 100)
    );
  }

  /**
   * セッションID生成
   */
  private generateSessionId(): string {
    return `diag_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 回答取得
   */
  getAnswer(questionId: string): Answer | undefined {
    return this.session?.answers.find((a) => a.questionId === questionId);
  }

  /**
   * フェーズ別回答取得
   */
  getAnswersByPhase(phase: DiagnosisPhase): Answer[] {
    if (!this.session) return [];

    const phaseQuestionIds = this.phaseQuestionMap.get(phase) ?? [];
    return this.session.answers.filter((a) =>
      phaseQuestionIds.includes(a.questionId)
    );
  }

  /**
   * 全回答取得
   */
  getAllAnswers(): Answer[] {
    return this.session?.answers ?? [];
  }

  /**
   * セッション完了判定
   */
  isSessionCompleted(): boolean {
    return this.session?.completedAt !== undefined;
  }

  /**
   * セッションリセット
   */
  resetSession(): void {
    this.session = null;
  }
}
