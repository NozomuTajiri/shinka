/**
 * レポート生成
 *
 * 診断レポート、エグゼクティブサマリ、提案書の生成
 * Markdown/PDF出力対応
 */

import {
  DiagnosisSession,
  DiagnosisReport,
  TotalScore,
  RecommendedAvatar,
  ReportFormat,
  DiagnosisScenario,
  DiagnosisQuestion,
  IssueAxis,
} from './types.js';
import { ScoringModel } from './scoring-model.js';

/**
 * レポート生成器クラス
 */
export class ReportGenerator {
  private scenario: DiagnosisScenario;
  private scoringModel: ScoringModel;
  private questionMap: Map<string, DiagnosisQuestion>;

  constructor(scenario: DiagnosisScenario) {
    this.scenario = scenario;
    this.scoringModel = new ScoringModel(scenario);
    this.questionMap = new Map(
      scenario.questions.map((q) => [q.id, q])
    );
  }

  /**
   * 診断レポート生成
   */
  async generateReport(
    session: DiagnosisSession,
    claudeApiKey?: string
  ): Promise<DiagnosisReport> {
    // スコア計算
    const totalScore = this.scoringModel.calculateTotalScore(session);

    // 推奨アバター決定
    const recommendedAvatars = this.scoringModel.determineRecommendedAvatars(totalScore);

    // エグゼクティブサマリ生成
    const executiveSummary = await this.generateExecutiveSummary(
      session,
      totalScore,
      recommendedAvatars,
      claudeApiKey
    );

    // 詳細分析生成
    const detailedAnalysis = this.generateDetailedAnalysis(
      session,
      totalScore,
      recommendedAvatars
    );

    return {
      sessionId: session.sessionId,
      generatedAt: new Date().toISOString(),
      totalScore,
      recommendedAvatars,
      executiveSummary,
      detailedAnalysis,
      metadata: session.metadata,
    };
  }

  /**
   * エグゼクティブサマリ生成（Claude API使用）
   */
  private async generateExecutiveSummary(
    session: DiagnosisSession,
    totalScore: TotalScore,
    recommendedAvatars: RecommendedAvatar[],
    claudeApiKey?: string
  ): Promise<string> {
    if (!claudeApiKey) {
      return this.generateFallbackSummary(session, totalScore, recommendedAvatars);
    }

    try {
      // Claude API呼び出し
      const prompt = this.buildSummaryPrompt(session, totalScore, recommendedAvatars);
      const summary = await this.callClaudeAPI(prompt, claudeApiKey);
      return summary;
    } catch (error) {
      console.error('Claude API error:', error);
      return this.generateFallbackSummary(session, totalScore, recommendedAvatars);
    }
  }

  /**
   * Claude APIプロンプト構築
   */
  private buildSummaryPrompt(
    session: DiagnosisSession,
    totalScore: TotalScore,
    recommendedAvatars: RecommendedAvatar[]
  ): string {
    const companyName = session.metadata?.companyName ?? '貴社';
    const topAxis = totalScore.topPriorityAxis;
    const topAxisScore = totalScore.axisScores.find((a) => a.axis === topAxis);
    const topAvatar = recommendedAvatars[0];

    return `
あなたは経営コンサルタントです。以下の診断結果に基づき、経営者向けのエグゼクティブサマリを200-300文字で作成してください。

# 診断結果
- 企業名: ${companyName}
- 総合スコア: ${totalScore.overall}点
- 最優先課題: ${this.getAxisLabel(topAxis)}（スコア: ${topAxisScore?.score ?? 0}点）
- 推奨アバター: ${topAvatar?.name ?? 'なし'}

# 課題詳細
${totalScore.axisScores.map((a) => `- ${this.getAxisLabel(a.axis)}: ${a.score}点 (${a.level})`).join('\n')}

# 要件
- 経営者が5分で理解できる内容
- 課題の緊急性を明確に
- 具体的な改善効果を示す
- 前向きなトーンで記述
`;
  }

  /**
   * Claude API呼び出し（仮実装）
   */
  private async callClaudeAPI(prompt: string, apiKey: string): Promise<string> {
    // 実際のClaude API呼び出しをここに実装
    // 現時点ではフォールバック実装を返す
    console.log('Claude API call (not implemented):', { prompt, apiKey: '***' });
    return this.generateFallbackSummary(
      { sessionId: '', startedAt: '', currentPhase: 'initial', currentQuestionId: null, answers: [], progress: 0 },
      { axisScores: [], overall: 0, topPriorityAxis: 'management', valueDimensions: { vision: 0, strategy: 0, execution: 0, talent: 0, innovation: 0, customer: 0 } },
      []
    );
  }

  /**
   * フォールバックサマリ生成
   */
  private generateFallbackSummary(
    session: DiagnosisSession,
    totalScore: TotalScore,
    recommendedAvatars: RecommendedAvatar[]
  ): string {
    const companyName = session.metadata?.companyName ?? '貴社';
    const topAxis = totalScore.topPriorityAxis;
    const topAxisScore = totalScore.axisScores.find((a) => a.axis === topAxis);
    const topAvatar = recommendedAvatars[0];

    return `
${companyName}様の診断結果、総合スコアは${totalScore.overall}点となりました。特に「${this.getAxisLabel(topAxis)}」領域（${topAxisScore?.score ?? 0}点）に改善の余地がございます。

${topAvatar ? `「${topAvatar.name}」の導入により、${topAvatar.expectedBenefits[0]}を実現し、月間${topAvatar.estimatedROI?.timeSaved ?? '20時間'}の業務効率化が見込まれます。` : ''}

付加価値経営®の観点から、ビジョン共有と戦略実行の強化を推奨いたします。
`.trim();
  }

  /**
   * 詳細分析生成
   */
  private generateDetailedAnalysis(
    session: DiagnosisSession,
    totalScore: TotalScore,
    recommendedAvatars: RecommendedAvatar[]
  ): DiagnosisReport['detailedAnalysis'] {
    // 現状分析
    const currentSituation = this.analyzeCurrentSituation(session, totalScore);

    // 主要な発見
    const keyFindings = this.extractKeyFindings(totalScore);

    // 推奨施策
    const recommendations = this.generateRecommendations(totalScore, recommendedAvatars);

    // 次のステップ
    const nextSteps = this.defineNextSteps(recommendedAvatars);

    return {
      currentSituation,
      keyFindings,
      recommendations,
      nextSteps,
    };
  }

  /**
   * 現状分析
   */
  private analyzeCurrentSituation(
    session: DiagnosisSession,
    totalScore: TotalScore
  ): string {
    const companyName = session.metadata?.companyName ?? '貴社';
    const industry = session.metadata?.industry ?? '業界';
    const employeeCount = session.metadata?.employeeCount ?? '規模';

    const criticalAxes = totalScore.axisScores.filter((a) => a.level === 'critical');
    const highAxes = totalScore.axisScores.filter((a) => a.level === 'high');

    let situation = `${companyName}様（${industry}、従業員${employeeCount}名規模）の診断結果、`;

    if (criticalAxes.length > 0) {
      situation += `「${criticalAxes.map((a) => this.getAxisLabel(a.axis)).join('」「')}」領域に緊急の改善が必要です。`;
    } else if (highAxes.length > 0) {
      situation += `「${highAxes.map((a) => this.getAxisLabel(a.axis)).join('」「')}」領域に重点的な改善が推奨されます。`;
    } else {
      situation += `全体的に良好な状態ですが、更なる成長に向けた改善余地があります。`;
    }

    return situation;
  }

  /**
   * 主要な発見抽出
   */
  private extractKeyFindings(totalScore: TotalScore): string[] {
    const findings: string[] = [];

    // スコアの低い軸から課題を抽出
    const sortedAxes = [...totalScore.axisScores].sort((a, b) => a.score - b.score);

    for (const axisScore of sortedAxes.slice(0, 3)) {
      if (axisScore.keyIssues.length > 0) {
        findings.push(
          `${this.getAxisLabel(axisScore.axis)}：${axisScore.keyIssues[0]}`
        );
      } else {
        findings.push(
          `${this.getAxisLabel(axisScore.axis)}：スコア${axisScore.score}点（${this.getLevelLabel(axisScore.level)}）`
        );
      }
    }

    // 付加価値経営®の視点
    const lowValueDimensions = Object.entries(totalScore.valueDimensions)
      .filter(([_, score]) => score < 50)
      .sort(([_, a], [__, b]) => a - b)
      .slice(0, 2);

    for (const [dimension, score] of lowValueDimensions) {
      findings.push(
        `付加価値経営®：${this.getValueDimensionLabel(dimension as any)}が${score}点と低く、改善が必要`
      );
    }

    return findings;
  }

  /**
   * 推奨施策生成
   */
  private generateRecommendations(
    totalScore: TotalScore,
    recommendedAvatars: RecommendedAvatar[]
  ): string[] {
    const recommendations: string[] = [];

    // アバター導入推奨
    for (const avatar of recommendedAvatars.slice(0, 2)) {
      recommendations.push(
        `${avatar.name}の導入により、${avatar.expectedBenefits[0]}を実現`
      );
    }

    // 軸別の改善施策
    const criticalAxes = totalScore.axisScores.filter((a) => a.level === 'critical' || a.level === 'high');
    for (const axisScore of criticalAxes.slice(0, 2)) {
      recommendations.push(
        `${this.getAxisLabel(axisScore.axis)}領域の強化：${this.getAxisRecommendation(axisScore.axis)}`
      );
    }

    return recommendations;
  }

  /**
   * 次のステップ定義
   */
  private defineNextSteps(recommendedAvatars: RecommendedAvatar[]): string[] {
    const steps: string[] = [
      '診断レポートの経営陣共有',
      '優先課題の合意形成',
    ];

    if (recommendedAvatars.length > 0) {
      steps.push(`${recommendedAvatars[0].name}のデモ体験`);
      steps.push('導入計画の策定（3ヶ月ロードマップ）');
      steps.push('KPI設定と効果測定開始');
    } else {
      steps.push('改善施策の具体化');
      steps.push('実行計画の策定');
    }

    return steps;
  }

  /**
   * レポート出力（Markdown形式）
   */
  exportMarkdown(report: DiagnosisReport): string {
    const md: string[] = [];

    md.push('# 診断レポート\n');
    md.push(`生成日時: ${new Date(report.generatedAt).toLocaleString('ja-JP')}\n`);

    if (report.metadata?.companyName) {
      md.push(`企業名: ${report.metadata.companyName}\n`);
    }

    md.push('\n## エグゼクティブサマリ\n');
    md.push(`${report.executiveSummary}\n`);

    md.push('\n## 総合スコア\n');
    md.push(`**${report.totalScore.overall}点** / 100点\n`);

    md.push('\n## 軸別評価\n');
    for (const axisScore of report.totalScore.axisScores) {
      md.push(`### ${this.getAxisLabel(axisScore.axis)}\n`);
      md.push(`- スコア: **${axisScore.score}点**\n`);
      md.push(`- 重要度: ${this.getLevelLabel(axisScore.level)}\n`);
      if (axisScore.keyIssues.length > 0) {
        md.push(`- 主要課題:\n`);
        axisScore.keyIssues.forEach((issue) => {
          md.push(`  - ${issue}\n`);
        });
      }
      md.push('\n');
    }

    md.push('\n## 付加価値経営®評価\n');
    for (const [dimension, score] of Object.entries(report.totalScore.valueDimensions)) {
      md.push(`- ${this.getValueDimensionLabel(dimension as any)}: ${score}点\n`);
    }

    md.push('\n## 推奨アバター\n');
    for (let i = 0; i < report.recommendedAvatars.length; i++) {
      const avatar = report.recommendedAvatars[i];
      md.push(`### ${i + 1}. ${avatar.name}\n`);
      md.push(`- 適合度: **${avatar.matchScore}点**\n`);
      md.push(`- 期待効果:\n`);
      avatar.expectedBenefits.forEach((benefit) => {
        md.push(`  - ${benefit}\n`);
      });
      if (avatar.estimatedROI) {
        md.push(`- 想定ROI:\n`);
        md.push(`  - 削減時間: ${avatar.estimatedROI.timeSaved}\n`);
        md.push(`  - コスト削減: ${avatar.estimatedROI.costReduction}\n`);
        md.push(`  - 売上増加: ${avatar.estimatedROI.revenueIncrease}\n`);
      }
      md.push('\n');
    }

    md.push('\n## 詳細分析\n');
    md.push(`### 現状分析\n${report.detailedAnalysis.currentSituation}\n\n`);
    md.push(`### 主要な発見\n`);
    report.detailedAnalysis.keyFindings.forEach((finding, i) => {
      md.push(`${i + 1}. ${finding}\n`);
    });
    md.push(`\n### 推奨施策\n`);
    report.detailedAnalysis.recommendations.forEach((rec, i) => {
      md.push(`${i + 1}. ${rec}\n`);
    });
    md.push(`\n### 次のステップ\n`);
    report.detailedAnalysis.nextSteps.forEach((step, i) => {
      md.push(`${i + 1}. ${step}\n`);
    });

    return md.join('');
  }

  /**
   * レポート出力（JSON形式）
   */
  exportJSON(report: DiagnosisReport): string {
    return JSON.stringify(report, null, 2);
  }

  /**
   * レポート出力（PDF形式）※仮実装
   */
  exportPDF(report: DiagnosisReport): Buffer {
    // PDF生成は外部ライブラリ（例: pdfkit）を使用
    // 現時点では未実装
    throw new Error('PDF export not implemented yet');
  }

  /**
   * レポート出力（統合）
   */
  export(report: DiagnosisReport, format: ReportFormat): string | Buffer {
    switch (format) {
      case 'markdown':
        return this.exportMarkdown(report);
      case 'json':
        return this.exportJSON(report);
      case 'pdf':
        return this.exportPDF(report);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  // ヘルパーメソッド

  private getAxisLabel(axis: IssueAxis): string {
    const labels: Record<IssueAxis, string> = {
      management: '経営課題',
      sales: '営業課題',
      organization: '組織課題',
      marketing: 'マーケティング課題',
    };
    return labels[axis];
  }

  private getLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      low: '低',
      medium: '中',
      high: '高',
      critical: '緊急',
    };
    return labels[level] ?? level;
  }

  private getValueDimensionLabel(dimension: string): string {
    const labels: Record<string, string> = {
      vision: 'ビジョン共有',
      strategy: '戦略明確性',
      execution: '実行力',
      talent: '人材育成',
      innovation: 'イノベーション',
      customer: '顧客価値',
    };
    return labels[dimension] ?? dimension;
  }

  private getAxisRecommendation(axis: IssueAxis): string {
    const recommendations: Record<IssueAxis, string> = {
      management: 'ビジョン・戦略の明確化とステークホルダーへの浸透',
      sales: '商談プロセスの標準化と提案品質の向上',
      organization: '人材育成体系の構築とエンゲージメント向上',
      marketing: 'デジタルマーケティング強化とリード獲得施策の最適化',
    };
    return recommendations[axis];
  }
}
