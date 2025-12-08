/**
 * 横断インサイトエンジン
 * パターン検出、匿名化処理、インサイト生成を担当
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  CrossInsight,
  InsightEvidence,
  AnonymizedExample,
  MotherAIConfig,
} from './types.js';

/**
 * セッションデータ（簡易版）
 */
interface SessionData {
  avatarId: string;
  companyId: string;
  companyName: string;
  industry: string;
  companySize: 'small' | 'medium' | 'large';
  challenge: string;
  solution: string;
  outcome: string;
  success: boolean;
  metrics?: Record<string, number>;
  timestamp: Date;
}

export class InsightEngine {
  private anthropic: Anthropic;
  private config: MotherAIConfig['insightEngine'];

  constructor(
    anthropic: Anthropic,
    config: MotherAIConfig['insightEngine']
  ) {
    this.anthropic = anthropic;
    this.config = config;
  }

  /**
   * 横断インサイトを生成
   */
  async generateInsights(
    sessions: SessionData[]
  ): Promise<CrossInsight[]> {
    console.log(
      `[InsightEngine] ${sessions.length}件のセッションからインサイトを生成中...`
    );

    // ステップ1: パターン検出
    const patterns = await this.detectPatterns(sessions);
    console.log(`[InsightEngine] ${patterns.length}件のパターンを検出`);

    // ステップ2: 各パターンからインサイトを生成
    const insights: CrossInsight[] = [];

    for (const pattern of patterns) {
      // 出現回数と成功率のフィルタリング
      if (
        pattern.occurrences < this.config.minOccurrences ||
        pattern.successRate < this.config.minSuccessRate
      ) {
        continue;
      }

      // ステップ3: 匿名化処理
      const anonymizedExamples = pattern.examples.map((ex) =>
        this.anonymize(ex)
      );

      // ステップ4: インサイト文言生成
      const insight = await this.generateInsightText(
        pattern,
        anonymizedExamples
      );

      if (insight.confidenceScore >= this.config.confidenceThreshold) {
        insights.push(insight);
      }
    }

    console.log(
      `[InsightEngine] ${insights.length}件の高信頼度インサイトを生成`
    );

    return insights;
  }

  /**
   * パターン検出
   */
  private async detectPatterns(sessions: SessionData[]): Promise<
    {
      pattern: string;
      occurrences: number;
      successRate: number;
      examples: SessionData[];
    }[]
  > {
    // 課題をグループ化
    const challengeGroups = new Map<string, SessionData[]>();

    for (const session of sessions) {
      const normalizedChallenge = this.normalizeText(session.challenge);

      // 類似課題をグループ化（簡易版: 完全一致）
      if (!challengeGroups.has(normalizedChallenge)) {
        challengeGroups.set(normalizedChallenge, []);
      }
      challengeGroups.get(normalizedChallenge)!.push(session);
    }

    // パターンを抽出
    const patterns: {
      pattern: string;
      occurrences: number;
      successRate: number;
      examples: SessionData[];
    }[] = [];

    for (const [challenge, group] of challengeGroups.entries()) {
      const uniqueCompanies = new Set(group.map((s) => s.companyId));

      // 3社以上で同じ課題が発生している場合
      if (uniqueCompanies.size >= this.config.minOccurrences) {
        const successCount = group.filter((s) => s.success).length;
        const successRate = successCount / group.length;

        patterns.push({
          pattern: challenge,
          occurrences: uniqueCompanies.size,
          successRate,
          examples: group,
        });
      }
    }

    return patterns;
  }

  /**
   * テキスト正規化
   */
  private normalizeText(text: string): string {
    return text.toLowerCase().trim();
  }

  /**
   * データ匿名化
   */
  private anonymize(session: SessionData): AnonymizedExample {
    return {
      industry: session.industry,
      companySize: session.companySize,
      challenge: this.removeIdentifiers(session.challenge),
      solution: this.removeIdentifiers(session.solution),
      outcome: this.removeIdentifiers(session.outcome),
      metrics: session.metrics ? this.generalizeMetrics(session.metrics) : undefined,
    };
  }

  /**
   * 識別子削除（企業名、個人名など）
   */
  private removeIdentifiers(text: string): string {
    // 簡易版: 固有名詞を一般化
    return text
      .replace(/株式会社[^\s]+/g, 'A社')
      .replace(/[A-Z][a-z]+ [A-Z][a-z]+/g, '担当者')
      .replace(/\d{4}年\d{1,2}月/g, '20XX年X月');
  }

  /**
   * メトリクス一般化
   */
  private generalizeMetrics(
    metrics: Record<string, number>
  ): Record<string, number> {
    const generalized: Record<string, number> = {};

    for (const [key, value] of Object.entries(metrics)) {
      // 10%単位に丸める
      generalized[key] = Math.round(value / 10) * 10;
    }

    return generalized;
  }

  /**
   * インサイト文言生成（Claude APIを使用）
   */
  private async generateInsightText(
    pattern: {
      pattern: string;
      occurrences: number;
      successRate: number;
      examples: SessionData[];
    },
    anonymizedExamples: AnonymizedExample[]
  ): Promise<CrossInsight> {
    const prompt = `
あなたはビジネスインサイト生成の専門家です。

以下のパターンデータから、実用的なインサイトを生成してください。

【パターン情報】
- 課題: ${pattern.pattern}
- 出現回数: ${pattern.occurrences}社
- 成功率: ${Math.round(pattern.successRate * 100)}%

【匿名化事例】
${anonymizedExamples
  .slice(0, 3)
  .map(
    (ex, i) => `
事例${i + 1}:
- 業界: ${ex.industry}
- 企業規模: ${ex.companySize}
- 課題: ${ex.challenge}
- 解決策: ${ex.solution}
- 成果: ${ex.outcome}
`
  )
  .join('\n')}

【出力形式】
以下のJSON形式で出力してください:
{
  "title": "インサイトのタイトル（30文字以内）",
  "category": "pattern/trend/best_practice/warning のいずれか",
  "description": "インサイトの詳細説明（200文字程度）",
  "recommendation": "推奨アクション（具体的に3つ程度）",
  "confidenceScore": 0.0-1.0の信頼度スコア
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
          const parsed = JSON.parse(jsonMatch[0]);

          return {
            id: this.generateInsightId(),
            title: parsed.title,
            category: parsed.category,
            description: parsed.description,
            evidence: [
              {
                pattern: pattern.pattern,
                occurrences: pattern.occurrences,
                successRate: pattern.successRate,
                anonymizedExamples: anonymizedExamples.slice(0, 3),
              },
            ],
            recommendation: parsed.recommendation,
            applicableAvatars: this.findApplicableAvatars(pattern),
            confidenceScore: parsed.confidenceScore,
            createdAt: new Date(),
          };
        }
      }

      // パース失敗時のフォールバック
      return this.getDefaultInsight(pattern, anonymizedExamples);
    } catch (error) {
      console.error('[InsightEngine] インサイト生成エラー:', error);
      return this.getDefaultInsight(pattern, anonymizedExamples);
    }
  }

  /**
   * 該当アバター検出
   */
  private findApplicableAvatars(pattern: {
    pattern: string;
    occurrences: number;
    successRate: number;
    examples: SessionData[];
  }): string[] {
    // パターンに関連するアバターIDを抽出
    const avatarIds = new Set(pattern.examples.map((ex) => ex.avatarId));
    return Array.from(avatarIds);
  }

  /**
   * デフォルトインサイト
   */
  private getDefaultInsight(
    pattern: {
      pattern: string;
      occurrences: number;
      successRate: number;
    },
    anonymizedExamples: AnonymizedExample[]
  ): CrossInsight {
    return {
      id: this.generateInsightId(),
      title: `共通課題: ${pattern.pattern.substring(0, 30)}`,
      category: 'pattern',
      description: `${pattern.occurrences}社で同様の課題が発生。成功率${Math.round(pattern.successRate * 100)}%。`,
      evidence: [
        {
          pattern: pattern.pattern,
          occurrences: pattern.occurrences,
          successRate: pattern.successRate,
          anonymizedExamples: anonymizedExamples.slice(0, 3),
        },
      ],
      recommendation:
        '類似事例の解決策を参照し、自社の状況に合わせて適用を検討してください。',
      applicableAvatars: [],
      confidenceScore: 0.7,
      createdAt: new Date(),
    };
  }

  /**
   * インサイトID生成
   */
  private generateInsightId(): string {
    return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * インサイトを該当アバターに配信
   */
  async distributeInsight(
    insight: CrossInsight,
    avatarIds: string[]
  ): Promise<void> {
    console.log(
      `[InsightEngine] インサイト "${insight.title}" を ${avatarIds.length}件のアバターに配信`
    );

    // 実際の配信ロジック（通知、ダッシュボード更新など）
    // ここでは簡易版としてログ出力のみ

    for (const avatarId of avatarIds) {
      console.log(`[InsightEngine]   → ${avatarId} に配信`);
    }
  }

  /**
   * 週次サマリ生成
   */
  async generateWeeklySummary(
    insights: CrossInsight[]
  ): Promise<string> {
    const prompt = `
以下の週次インサイトをサマリしてください。

【インサイト一覧】
${insights
  .map(
    (insight, i) => `
${i + 1}. ${insight.title}
   カテゴリ: ${insight.category}
   信頼度: ${Math.round(insight.confidenceScore * 100)}%
   説明: ${insight.description}
`
  )
  .join('\n')}

【出力形式】
- 今週のハイライト（3-5つ）
- 重要なトレンド
- 推奨アクション

簡潔で読みやすい形式でお願いします。
`;

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = message.content[0];
      if (content.type === 'text') {
        return content.text;
      }

      return 'サマリ生成失敗';
    } catch (error) {
      console.error('[InsightEngine] 週次サマリ生成エラー:', error);
      return 'サマリ生成エラー';
    }
  }
}
