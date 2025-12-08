/**
 * アバター構築エンジン
 * 新規アバターの必要性検証、ROI試算、構築を担当
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  Avatar,
  AvatarBuildRequest,
  AvatarBuildResult,
  AvatarPersona,
  ROIEstimate,
  MotherAIConfig,
} from './types.js';

export class AvatarBuilder {
  private anthropic: Anthropic;
  private config: MotherAIConfig['avatarBuilder'];

  constructor(
    anthropic: Anthropic,
    config: MotherAIConfig['avatarBuilder']
  ) {
    this.anthropic = anthropic;
    this.config = config;
  }

  /**
   * アバター構築の必要性を検証し、必要に応じて構築
   */
  async build(
    request: AvatarBuildRequest,
    existingAvatars: Avatar[]
  ): Promise<AvatarBuildResult> {
    console.log('[AvatarBuilder] アバター構築リクエストを処理中...');

    // ステップ1: 既存アバターで対応可能か検証
    const existingMatch = await this.findExistingMatch(
      request,
      existingAvatars
    );
    if (existingMatch) {
      console.log(
        `[AvatarBuilder] 既存アバター ${existingMatch.id} で対応可能`
      );
      return {
        decision: 'use_existing',
        reason: '既存アバターのコンピテンシーでカバー可能',
        existingAvatarId: existingMatch.id,
      };
    }

    // ステップ2: 重複度チェック
    const duplicateCheck = await this.checkDuplicates(
      request,
      existingAvatars
    );
    if (duplicateCheck.isDuplicate) {
      console.log(
        `[AvatarBuilder] コンピテンシー重複度が高い (${duplicateCheck.score})`
      );
      return {
        decision: 'reject',
        reason: `既存アバターとの重複度が高い (${Math.round(duplicateCheck.score * 100)}%)。統合を検討してください。`,
      };
    }

    // ステップ3: ROI試算
    const roiEstimate = this.calculateROI(request);
    if (roiEstimate.monthlyROI < this.config.minROI) {
      console.log(
        `[AvatarBuilder] ROIが基準未満 (${roiEstimate.monthlyROI})`
      );
      return {
        decision: 'reject',
        reason: `期待ROI ${roiEstimate.monthlyROI.toFixed(2)} が基準 ${this.config.minROI} を下回る`,
        roiEstimate,
      };
    }

    // ステップ4: ペルソナ生成
    const persona = await this.generatePersona(request);

    // ステップ5: アバター作成（30日間試用期間）
    const avatar: Avatar = {
      id: this.generateAvatarId(),
      name: this.generateAvatarName(request),
      competencies: request.requiredCompetencies,
      persona,
      status: 'trial',
      createdAt: new Date(),
      trialEndsAt: new Date(
        Date.now() + this.config.trialPeriodDays * 24 * 60 * 60 * 1000
      ),
      metrics: {
        totalSessions: 0,
        averageSatisfaction: 0,
        taskCompletionRate: 0,
        responseTimeMs: 0,
        errorRate: 0,
      },
    };

    console.log(
      `[AvatarBuilder] 新規アバター ${avatar.id} を試用期間で作成`
    );

    return {
      decision: 'create',
      reason: 'ROI基準を満たし、既存アバターとの重複なし',
      avatar,
      roiEstimate,
    };
  }

  /**
   * 既存アバターで対応可能か検証
   */
  private async findExistingMatch(
    request: AvatarBuildRequest,
    existingAvatars: Avatar[]
  ): Promise<Avatar | null> {
    for (const avatar of existingAvatars) {
      if (avatar.status === 'deprecated') continue;

      const coverage = this.calculateCompetencyCoverage(
        request.requiredCompetencies,
        avatar.competencies
      );

      // 90%以上カバーできれば既存アバターで対応可能
      if (coverage >= 0.9) {
        return avatar;
      }
    }

    return null;
  }

  /**
   * コンピテンシーカバレッジ計算
   */
  private calculateCompetencyCoverage(
    required: string[],
    existing: string[]
  ): number {
    const covered = required.filter((comp) =>
      existing.some((e) => this.isSimilarCompetency(comp, e))
    );
    return covered.length / required.length;
  }

  /**
   * コンピテンシー類似度判定（簡易版）
   */
  private isSimilarCompetency(comp1: string, comp2: string): boolean {
    const normalize = (s: string) => s.toLowerCase().trim();
    return normalize(comp1) === normalize(comp2);
  }

  /**
   * 重複度チェック
   */
  private async checkDuplicates(
    request: AvatarBuildRequest,
    existingAvatars: Avatar[]
  ): Promise<{ isDuplicate: boolean; score: number }> {
    let maxSimilarity = 0;

    for (const avatar of existingAvatars) {
      if (avatar.status === 'deprecated') continue;

      const similarity = this.calculateSimilarity(
        request.requiredCompetencies,
        avatar.competencies
      );

      if (similarity > maxSimilarity) {
        maxSimilarity = similarity;
      }

      // 70%以上の重複で統合検討
      if (similarity >= this.config.similarityThreshold) {
        return { isDuplicate: true, score: similarity };
      }
    }

    return { isDuplicate: false, score: maxSimilarity };
  }

  /**
   * コンピテンシー類似度計算（Jaccard係数）
   */
  private calculateSimilarity(comp1: string[], comp2: string[]): number {
    const set1 = new Set(comp1.map((c) => c.toLowerCase()));
    const set2 = new Set(comp2.map((c) => c.toLowerCase()));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * ROI試算
   */
  private calculateROI(request: AvatarBuildRequest): ROIEstimate {
    // 簡易試算ロジック
    const estimatedMonthlySessions = this.estimateMonthlySessions(
      request.priority
    );
    const costPerSession = 50; // 仮定: 1セッション50円
    const valuePerSession = request.expectedROI
      ? costPerSession * request.expectedROI
      : 100; // 仮定: デフォルト100円の価値

    const monthlyCost = estimatedMonthlySessions * costPerSession;
    const monthlyValue = estimatedMonthlySessions * valuePerSession;
    const monthlyROI = monthlyValue / monthlyCost;

    const setupCost = 10000; // 仮定: 初期構築コスト10,000円
    const monthlyProfit = monthlyValue - monthlyCost;
    const breakEvenMonths = Math.ceil(setupCost / monthlyProfit);

    return {
      estimatedMonthlySessions,
      costPerSession,
      valuePerSession,
      monthlyROI,
      breakEvenMonths,
    };
  }

  /**
   * 月次セッション数推定
   */
  private estimateMonthlySessions(priority: string): number {
    switch (priority) {
      case 'high':
        return 100;
      case 'medium':
        return 50;
      case 'low':
        return 20;
      default:
        return 30;
    }
  }

  /**
   * ペルソナ生成（Claude APIを使用）
   */
  private async generatePersona(
    request: AvatarBuildRequest
  ): Promise<AvatarPersona> {
    const prompt = `
あなたはAIアバターのペルソナ設計専門家です。

以下の要件に基づいて、適切なアバターペルソナを設計してください。

【要件】
- コンピテンシー: ${request.requiredCompetencies.join(', ')}
- ビジネスコンテキスト: ${request.businessContext}
- 優先度: ${request.priority}

【出力形式】
以下のJSON形式で出力してください:
{
  "role": "役割名（例: シニアマーケティングストラテジスト）",
  "expertise": ["専門知識1", "専門知識2", "専門知識3"],
  "communicationStyle": "コミュニケーションスタイルの説明",
  "decisionMakingStyle": "意思決定スタイルの説明",
  "background": "バックグラウンドストーリー"
}
`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        // JSON部分を抽出
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }

      // パース失敗時のフォールバック
      return this.getDefaultPersona(request);
    } catch (error) {
      console.error('[AvatarBuilder] ペルソナ生成エラー:', error);
      return this.getDefaultPersona(request);
    }
  }

  /**
   * デフォルトペルソナ
   */
  private getDefaultPersona(request: AvatarBuildRequest): AvatarPersona {
    return {
      role: 'ビジネスアドバイザー',
      expertise: request.requiredCompetencies,
      communicationStyle: '論理的で分かりやすく、具体的な提案を行う',
      decisionMakingStyle: 'データ駆動型で、リスクとベネフィットを明確化',
      background: `${request.requiredCompetencies.join('、')}の専門家として、企業の課題解決をサポート`,
    };
  }

  /**
   * アバターID生成
   */
  private generateAvatarId(): string {
    return `avatar_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * アバター名生成
   */
  private generateAvatarName(request: AvatarBuildRequest): string {
    const primary = request.requiredCompetencies[0] || 'General';
    return `${primary} Specialist`;
  }
}
