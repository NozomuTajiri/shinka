/**
 * スコアリングモデル
 *
 * 4軸評価、重み付け計算、総合スコア算出、推奨アバターマトリックス
 */

import {
  DiagnosisSession,
  DiagnosisQuestion,
  DiagnosisScenario,
  IssueAxis,
  ValueDimension,
  AxisScore,
  TotalScore,
  RecommendedAvatar,
} from './types.js';

/**
 * スコアリングモデルクラス
 */
export class ScoringModel {
  private scenario: DiagnosisScenario;
  private questionMap: Map<string, DiagnosisQuestion>;

  constructor(scenario: DiagnosisScenario) {
    this.scenario = scenario;
    this.questionMap = new Map(
      scenario.questions.map((q) => [q.id, q])
    );
  }

  /**
   * 総合スコア計算
   */
  calculateTotalScore(session: DiagnosisSession): TotalScore {
    // 軸別スコア計算
    const axisScores: AxisScore[] = [
      this.calculateAxisScore(session, 'management'),
      this.calculateAxisScore(session, 'sales'),
      this.calculateAxisScore(session, 'organization'),
      this.calculateAxisScore(session, 'marketing'),
    ];

    // 総合スコア計算（加重平均）
    const overall = this.calculateOverallScore(axisScores);

    // 最優先課題軸
    const topPriorityAxis = this.determineTopPriorityAxis(axisScores);

    // 付加価値経営®6つの価値の評価
    const valueDimensions = this.evaluateValueDimensions(session, axisScores);

    return {
      axisScores,
      overall,
      topPriorityAxis,
      valueDimensions,
    };
  }

  /**
   * 軸別スコア計算
   */
  private calculateAxisScore(
    session: DiagnosisSession,
    axis: IssueAxis
  ): AxisScore {
    let totalWeight = 0;
    let weightedSum = 0;
    const keyIssues: string[] = [];

    for (const answer of session.answers) {
      if (answer.skipped) continue;

      const question = this.questionMap.get(answer.questionId);
      if (!question || !question.relatedAxes.includes(axis)) {
        continue;
      }

      // スコア計算
      let questionScore = 0;
      let questionWeight = 1;

      if (question.type === 'scale' && typeof answer.value === 'number') {
        const maxScale = question.scaleRange?.max ?? 5;
        questionScore = (answer.value / maxScale) * 100;
        questionWeight = 1;
      } else if (question.type === 'single-choice' && typeof answer.value === 'string') {
        const option = question.options?.find((opt) => opt.id === answer.value);
        if (option?.weight[axis]) {
          questionScore = option.weight[axis] * 100;
          questionWeight = Math.abs(option.weight[axis]);

          // 課題抽出（スコアが低い場合）
          if (questionScore < 40) {
            keyIssues.push(question.question);
          }
        }
      } else if (question.type === 'multiple-choice' && Array.isArray(answer.value)) {
        // 複数選択の場合、平均を取る
        const selectedOptions = question.options?.filter((opt) =>
          (answer.value as string[]).includes(opt.id)
        ) ?? [];
        if (selectedOptions.length > 0) {
          const sum = selectedOptions.reduce(
            (acc, opt) => acc + (opt.weight[axis] ?? 0),
            0
          );
          questionScore = (sum / selectedOptions.length) * 100;
          questionWeight = selectedOptions.length;
        }
      }

      weightedSum += questionScore * questionWeight;
      totalWeight += questionWeight;
    }

    const score = totalWeight > 0 ? weightedSum / totalWeight : 0;
    const level = this.determineLevel(score);

    // 課題数が多い場合は上位3つに絞る
    const topKeyIssues = keyIssues.slice(0, 3);

    return {
      axis,
      score: Math.round(score * 10) / 10, // 小数点1桁
      level,
      keyIssues: topKeyIssues,
    };
  }

  /**
   * 重要度レベル判定
   */
  private determineLevel(score: number): AxisScore['level'] {
    if (score >= 70) return 'low';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'high';
    return 'critical';
  }

  /**
   * 総合スコア計算（加重平均）
   */
  private calculateOverallScore(axisScores: AxisScore[]): number {
    const weights = this.scenario.scoringConfig.axisWeights;
    let weightedSum = 0;
    let totalWeight = 0;

    for (const axisScore of axisScores) {
      const weight = weights[axisScore.axis] ?? 1;
      weightedSum += axisScore.score * weight;
      totalWeight += weight;
    }

    return Math.round((weightedSum / totalWeight) * 10) / 10;
  }

  /**
   * 最優先課題軸決定
   */
  private determineTopPriorityAxis(axisScores: AxisScore[]): IssueAxis {
    // スコアが最も低い軸を最優先課題とする
    const sorted = [...axisScores].sort((a, b) => a.score - b.score);
    return sorted[0]?.axis ?? 'management';
  }

  /**
   * 付加価値経営®6つの価値の評価
   */
  private evaluateValueDimensions(
    session: DiagnosisSession,
    axisScores: AxisScore[]
  ): Record<ValueDimension, number> {
    const mapping = this.scenario.scoringConfig.valueDimensionMapping;
    const valueDimensions: Record<ValueDimension, number> = {
      vision: 0,
      strategy: 0,
      execution: 0,
      talent: 0,
      innovation: 0,
      customer: 0,
    };

    // 各課題軸から価値次元へマッピング
    for (const axisScore of axisScores) {
      const dimensions = mapping[axisScore.axis] ?? [];
      for (const dimension of dimensions) {
        // 同じ価値次元に複数の軸が影響する場合、平均を取る
        if (valueDimensions[dimension] === 0) {
          valueDimensions[dimension] = axisScore.score;
        } else {
          valueDimensions[dimension] =
            (valueDimensions[dimension] + axisScore.score) / 2;
        }
      }
    }

    // 小数点1桁に丸める
    for (const key of Object.keys(valueDimensions) as ValueDimension[]) {
      valueDimensions[key] = Math.round(valueDimensions[key] * 10) / 10;
    }

    return valueDimensions;
  }

  /**
   * 推奨アバター決定
   */
  determineRecommendedAvatars(totalScore: TotalScore): RecommendedAvatar[] {
    const avatars: RecommendedAvatar[] = [];

    // 軸別スコアに基づいてアバターを推奨
    for (const axisScore of totalScore.axisScores) {
      if (axisScore.level === 'critical' || axisScore.level === 'high') {
        const avatar = this.getAvatarForAxis(axisScore, totalScore);
        if (avatar) {
          avatars.push(avatar);
        }
      }
    }

    // 適合度スコアでソート
    avatars.sort((a, b) => b.matchScore - a.matchScore);

    // 上位3つを返す
    return avatars.slice(0, 3);
  }

  /**
   * 課題軸に対応するアバター取得
   */
  private getAvatarForAxis(
    axisScore: AxisScore,
    totalScore: TotalScore
  ): RecommendedAvatar | null {
    const matchScore = this.calculateMatchScore(axisScore, totalScore);

    switch (axisScore.axis) {
      case 'sales':
        return {
          name: '営業支援アバター',
          type: 'sales',
          matchScore,
          expectedBenefits: [
            '商談準備時間を70%削減',
            '提案資料の品質向上',
            '顧客理解の深化',
            '受注率の向上',
          ],
          estimatedROI: {
            timeSaved: '月40時間',
            costReduction: '月20万円',
            revenueIncrease: '月100万円',
          },
        };

      case 'marketing':
        return {
          name: 'マーケティング支援アバター',
          type: 'marketing',
          matchScore,
          expectedBenefits: [
            'コンテンツ制作時間を60%削減',
            'SNS投稿の自動化',
            'リード獲得数の増加',
            'ブランド認知の向上',
          ],
          estimatedROI: {
            timeSaved: '月30時間',
            costReduction: '月15万円',
            revenueIncrease: '月50万円',
          },
        };

      case 'organization':
        return {
          name: '人事・組織支援アバター',
          type: 'hr',
          matchScore,
          expectedBenefits: [
            '採用業務の効率化',
            'オンボーディング品質向上',
            '社員エンゲージメント向上',
            '評価プロセスの透明化',
          ],
          estimatedROI: {
            timeSaved: '月25時間',
            costReduction: '月10万円',
            revenueIncrease: '月30万円（離職率低下）',
          },
        };

      case 'management':
        return {
          name: '経営戦略支援アバター',
          type: 'strategy',
          matchScore,
          expectedBenefits: [
            '戦略立案の高速化',
            '市場分析の深化',
            '意思決定の質向上',
            '経営会議の効率化',
          ],
          estimatedROI: {
            timeSaved: '月20時間',
            costReduction: '月30万円（コンサル費用削減）',
            revenueIncrease: '月200万円（戦略改善効果）',
          },
        };

      default:
        return null;
    }
  }

  /**
   * 適合度スコア計算
   */
  private calculateMatchScore(
    axisScore: AxisScore,
    totalScore: TotalScore
  ): number {
    // スコアが低いほど課題が大きいため、適合度が高い
    const urgencyScore = 100 - axisScore.score;

    // 総合スコアも考慮（全体的な課題感）
    const overallImpact = 100 - totalScore.overall;

    // 加重平均（緊急度70%、全体影響30%）
    const matchScore = urgencyScore * 0.7 + overallImpact * 0.3;

    return Math.round(matchScore * 10) / 10;
  }

  /**
   * ROI計算（詳細版）
   */
  calculateDetailedROI(
    avatar: RecommendedAvatar,
    session: DiagnosisSession
  ): {
    monthly: number;
    yearly: number;
    paybackMonths: number;
  } {
    // 仮の実装（実際のビジネスロジックに応じて調整）
    const employeeCount = this.parseEmployeeCount(
      session.metadata?.employeeCount ?? '10-50'
    );

    // 基本ROI（月額）
    let monthlyROI = 0;

    switch (avatar.type) {
      case 'sales':
        monthlyROI = employeeCount * 50000; // 1人あたり月5万円の効果
        break;
      case 'marketing':
        monthlyROI = employeeCount * 30000;
        break;
      case 'hr':
        monthlyROI = employeeCount * 20000;
        break;
      case 'strategy':
        monthlyROI = employeeCount * 100000;
        break;
      default:
        monthlyROI = employeeCount * 40000;
    }

    const yearlyROI = monthlyROI * 12;

    // 投資回収期間（仮に初期費用100万円、月額10万円と仮定）
    const initialCost = 1000000;
    const monthlyCost = 100000;
    const monthlyNetBenefit = monthlyROI - monthlyCost;
    const paybackMonths = monthlyNetBenefit > 0
      ? Math.ceil(initialCost / monthlyNetBenefit)
      : 12; // デフォルト12ヶ月

    return {
      monthly: monthlyROI,
      yearly: yearlyROI,
      paybackMonths,
    };
  }

  /**
   * 従業員数パース
   */
  private parseEmployeeCount(employeeCountRange: string): number {
    // "10-50" -> 30 (中央値)
    // "50-100" -> 75
    const match = employeeCountRange.match(/(\d+)-(\d+)/);
    if (match) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      return Math.floor((min + max) / 2);
    }
    return 30; // デフォルト
  }
}
