/**
 * 診断システム エクスポート
 *
 * 初回面談アバター用診断質問シナリオエンジン
 */

// 型定義
export * from './types.js';

// コアエンジン
export { ScenarioEngine } from './scenario-engine.js';
export { ScoringModel } from './scoring-model.js';
export { ReportGenerator } from './report-generator.js';

// デフォルトシナリオ
import initialDiagnosisScenario from './scenarios/initial-diagnosis.json' assert { type: 'json' };
import type { DiagnosisScenario } from './types.js';

export const DEFAULT_SCENARIO = initialDiagnosisScenario as DiagnosisScenario;

/**
 * 診断システムファサード
 *
 * ScenarioEngine、ScoringModel、ReportGeneratorを統合して提供
 *
 * @example
 * ```typescript
 * import { DiagnosisSystem } from './diagnosis';
 *
 * const system = new DiagnosisSystem();
 * const session = system.startSession({
 *   companyName: 'サンプル株式会社',
 *   industry: 'IT',
 *   employeeCount: '10-50',
 * });
 *
 * const question = system.getCurrentQuestion();
 * system.answerQuestion(question.id, 'q001_b');
 *
 * const report = await system.generateReport();
 * console.log(system.exportMarkdown(report));
 * ```
 */
export class DiagnosisSystem {
  private engine: ScenarioEngine;
  private scoringModel: ScoringModel;
  private reportGenerator: ReportGenerator;

  constructor(scenario: DiagnosisScenario = DEFAULT_SCENARIO) {
    this.engine = new ScenarioEngine(scenario);
    this.scoringModel = new ScoringModel(scenario);
    this.reportGenerator = new ReportGenerator(scenario);
  }

  /**
   * セッション開始
   */
  startSession(metadata?: {
    companyName?: string;
    industry?: string;
    employeeCount?: string;
    respondentName?: string;
    respondentRole?: string;
  }) {
    return this.engine.startSession(metadata);
  }

  /**
   * セッション復元
   */
  restoreSession(session: any) {
    this.engine.restoreSession(session);
  }

  /**
   * 現在のセッション取得
   */
  getSession() {
    return this.engine.getSession();
  }

  /**
   * 現在の質問取得
   */
  getCurrentQuestion() {
    return this.engine.getCurrentQuestion();
  }

  /**
   * 回答を記録
   */
  answerQuestion(questionId: string, value: string | number | string[]) {
    return this.engine.answerQuestion(questionId, value);
  }

  /**
   * セッション完了判定
   */
  isSessionCompleted() {
    return this.engine.isSessionCompleted();
  }

  /**
   * レポート生成
   */
  async generateReport(claudeApiKey?: string) {
    const session = this.engine.getSession();
    if (!session) {
      throw new Error('Session not found');
    }
    return this.reportGenerator.generateReport(session, claudeApiKey);
  }

  /**
   * Markdown出力
   */
  exportMarkdown(report: any) {
    return this.reportGenerator.exportMarkdown(report);
  }

  /**
   * JSON出力
   */
  exportJSON(report: any) {
    return this.reportGenerator.exportJSON(report);
  }

  /**
   * 総合スコア計算
   */
  calculateScore(session?: any) {
    const targetSession = session ?? this.engine.getSession();
    if (!targetSession) {
      throw new Error('Session not found');
    }
    return this.scoringModel.calculateTotalScore(targetSession);
  }

  /**
   * 推奨アバター決定
   */
  getRecommendedAvatars(totalScore?: any) {
    const score = totalScore ?? this.calculateScore();
    return this.scoringModel.determineRecommendedAvatars(score);
  }

  /**
   * セッションリセット
   */
  resetSession() {
    this.engine.resetSession();
  }
}
