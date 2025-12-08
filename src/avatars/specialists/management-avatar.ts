/**
 * 管理職業務改善アバター
 * マネジメントスキル向上・チームビルディングの専門家
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AvatarPersona } from '@/mother-ai/types';
import type { CoreValue } from '@/types/proposal';
import {
  BaseSpecialist,
  type ConsultationRequest,
  type ConsultationResponse,
  type KnowledgeEntry,
} from './base-specialist';

/**
 * 管理職業務改善アバター
 */
export class ManagementAvatar extends BaseSpecialist {
  private anthropic: Anthropic;

  constructor(apiKey: string, knowledgeBase: KnowledgeEntry[] = []) {
    const persona: AvatarPersona = {
      role: 'マネジメントコーチ',
      expertise: [
        'マネジメントスキル向上',
        'チームビルディング',
        '評価制度設計',
        '1on1コーチング',
        'リーダーシップ開発',
        '目標管理（MBO/OKR）',
      ],
      communicationStyle:
        '共感的で支援的。マネージャーの悩みに寄り添い、実践的なアドバイスとツールを提供します。',
      decisionMakingStyle:
        '人間重視。組織の成果とメンバーの成長の両立を目指し、持続可能なマネジメントを追求します。',
      background:
        '大手企業の人事部長を経て、マネジメントコーチとして500名以上の管理職を育成してきました。',
    };

    super('management', persona, knowledgeBase);
    this.anthropic = new Anthropic({ apiKey });
  }

  protected getAvatarName(): string {
    return 'マネジメントコーチ MEGUMI（メグミ）';
  }

  protected getCompetencies(): string[] {
    return [
      'マネジメント研修設計',
      'チームビルディング支援',
      '1on1面談スキル',
      '評価・フィードバック',
      '目標設定・管理',
      'コンフリクト解決',
      'モチベーション管理',
      'リーダーシップ開発',
    ];
  }

  protected generateSystemPrompt(request: ConsultationRequest): string {
    const knowledgeContext = this.searchKnowledge(request)
      .map((k) => `[${k.category}] ${k.title}: ${k.content}`)
      .join('\n');

    return `あなたは「MEGUMI（メグミ）」という名のマネジメントコーチです。

# ペルソナ
- 役割: ${this.avatar.persona.role}
- 専門性: ${this.avatar.persona.expertise.join(', ')}
- コミュニケーションスタイル: ${this.avatar.persona.communicationStyle}
- 意思決定スタイル: ${this.avatar.persona.decisionMakingStyle}
- 背景: ${this.avatar.persona.background}

# 相談内容
${request.query}

# 企業コンテキスト
${request.companyContext ? `
- 業界: ${request.companyContext.industry || '未指定'}
- 企業規模: ${request.companyContext.size || '未指定'}
- 課題: ${request.companyContext.challenges?.join(', ') || '未指定'}
` : '（コンテキスト情報なし）'}

# 重点価値領域
${request.focusValues?.join(', ') || '全領域'}

# 関連ナレッジベース
${knowledgeContext || '（該当なし）'}

# 追加コンテキスト
${request.additionalContext || 'なし'}

# 回答方針
1. **付加価値経営®フレームワーク準拠**: 特に「社員価値」「組織価値」の観点からマネジメント改善を提案
2. **実践重視**: 明日から使えるフレームワークやテンプレートを提供
3. **心理的安全性**: チームの心理的安全性を高める施策を重視
4. **成長支援**: マネージャー自身の成長とメンバーの育成を両立
5. **継続可能性**: 無理なく続けられる仕組みづくり

# 出力形式
以下のJSON形式で回答してください：

{
  "answer": "マネジメント改善の提案（マークダウン形式、見出し・箇条書き使用可）",
  "recommendations": ["具体的な推奨アクション1", "具体的な推奨アクション2", ...],
  "relatedValues": ["関連する価値領域"],
  "knowledgeReferences": ["参照したナレッジのID"],
  "requiresCEOReport": true/false,
  "ceoReport": {
    "category": "insight/risk/opportunity/decision_required",
    "severity": "high/medium/low",
    "summary": "CEOへの報告サマリー",
    "details": "詳細",
    "recommendedAction": "推奨アクション"
  },
  "collaborationSuggestions": [
    {
      "targetAvatar": "organization/finance/etc",
      "reason": "連携が必要な理由",
      "expectedOutcome": "期待される成果"
    }
  ],
  "confidenceScore": 0.0-1.0
}

必ずJSON形式で回答してください。`;
  }

  protected async generateResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[],
    systemPrompt: string
  ): Promise<ConsultationResponse> {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: request.query,
          },
        ],
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const response = JSON.parse(jsonMatch[0]) as ConsultationResponse;

      if (response.requiresCEOReport && response.ceoReport) {
        await this.reportToCEO(response.ceoReport);
      }

      if (response.collaborationSuggestions) {
        for (const suggestion of response.collaborationSuggestions) {
          await this.collaborateWith(suggestion.targetAvatar, suggestion.reason);
        }
      }

      return response;
    } catch (error) {
      console.error('ManagementAvatar error:', error);
      return this.generateFallbackResponse(request, knowledge);
    }
  }

  private generateFallbackResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[]
  ): ConsultationResponse {
    return {
      answer: `# マネジメント改善のご提案

ご相談ありがとうございます。以下、マネジメント改善の基本的な方向性をご提案します。

## マネジメントの基本
1. **明確な目標設定**: チームと個人の目標を明確化
2. **定期的なコミュニケーション**: 1on1の定着
3. **適切なフィードバック**: タイムリーで具体的なフィードバック

## 改善施策
1. **1on1ミーティングの実施**: 週次または隔週で30分
2. **目標管理の仕組み**: OKRまたはMBOの導入
3. **チームビルディング**: 心理的安全性の醸成

## 推奨ツール
- 1on1テンプレート
- フィードバックフレームワーク（SBI法など）
- チェックインシート

より具体的な支援には、チームの状況とマネージャーの悩みを詳しくお聞かせください。`,
      recommendations: [
        '1on1ミーティングの週次実施',
        'チーム目標の明文化',
        'フィードバックスキル研修の受講',
      ],
      relatedValues: ['employee_value', 'organization_value'] as CoreValue[],
      knowledgeReferences: knowledge.map((k) => k.id),
      requiresCEOReport: false,
      confidenceScore: 0.6,
    };
  }

  /**
   * 1on1テンプレート生成
   */
  async generate1on1Template(options: {
    teamSize: number;
    frequency: 'weekly' | 'biweekly' | 'monthly';
    focusAreas: string[];
  }): Promise<{
    template: string;
    tips: string[];
    questions: string[];
  }> {
    return {
      template: `# 1on1ミーティングテンプレート

## 基本情報
- 日時: [日時を記入]
- メンバー: [名前]
- 実施頻度: ${options.frequency}

## アジェンダ
1. チェックイン（5分）
2. 近況報告（10分）
3. 課題・相談（10分）
4. 目標進捗確認（5分）
5. まとめ・次回アクション（5分）

## チェックイン質問
- 最近どう？調子はどう？
- 今週良かったこと・大変だったことは？

## 振り返り・記録
[ここに内容を記録]`,
      tips: [
        '傾聴を心がける - 話すより聞く',
        '心理的安全性を保つ - 評価の場ではない',
        'アクションを明確に - 次回までのコミット',
      ],
      questions: [
        '今週一番嬉しかったことは？',
        '今困っていることは何？',
        '私（上司）にサポートしてほしいことは？',
        'キャリアについて考えていることは？',
      ],
    };
  }

  /**
   * チーム健全性スコア算出
   */
  async calculateTeamHealth(metrics: {
    engagementScore: number; // 1-5
    turnoverRate: number; // 0-1
    productivityIndex: number; // 0-100
    collaborationScore: number; // 1-5
    satisfactionScore: number; // 1-5
  }): Promise<{
    healthScore: number;
    status: 'excellent' | 'good' | 'fair' | 'poor';
    insights: string[];
    recommendations: string[];
  }> {
    // 加重平均で健全性スコアを算出
    const healthScore =
      (metrics.engagementScore / 5) * 0.3 +
      (1 - metrics.turnoverRate) * 0.2 +
      (metrics.productivityIndex / 100) * 0.2 +
      (metrics.collaborationScore / 5) * 0.15 +
      (metrics.satisfactionScore / 5) * 0.15;

    const status =
      healthScore >= 0.8
        ? 'excellent'
        : healthScore >= 0.6
          ? 'good'
          : healthScore >= 0.4
            ? 'fair'
            : 'poor';

    const insights: string[] = [];
    const recommendations: string[] = [];

    if (metrics.engagementScore < 3) {
      insights.push('エンゲージメントが低い状態');
      recommendations.push('1on1の強化と成長機会の提供');
    }

    if (metrics.turnoverRate > 0.15) {
      insights.push('離職率が高い');
      recommendations.push('退職理由の分析と改善策の実施');
    }

    if (metrics.collaborationScore < 3) {
      insights.push('チーム協調性に課題');
      recommendations.push('チームビルディング活動の実施');
    }

    return {
      healthScore: Math.round(healthScore * 100) / 100,
      status,
      insights,
      recommendations,
    };
  }
}
