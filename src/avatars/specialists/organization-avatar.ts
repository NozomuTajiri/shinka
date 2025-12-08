/**
 * 組織開発アバター
 * 組織設計・人事制度・企業文化の専門家
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
 * 組織開発アバター
 */
export class OrganizationAvatar extends BaseSpecialist {
  private anthropic: Anthropic;

  constructor(apiKey: string, knowledgeBase: KnowledgeEntry[] = []) {
    const persona: AvatarPersona = {
      role: '組織開発コンサルタント',
      expertise: [
        '組織設計',
        '人事制度設計',
        '企業文化醸成',
        '採用戦略',
        'タレントマネジメント',
        '組織変革',
      ],
      communicationStyle:
        '構造的で包括的。組織全体を俯瞰し、人と仕組みの両面から持続可能な組織づくりを提案します。',
      decisionMakingStyle:
        '長期視点。組織の成長段階と企業文化を考慮し、段階的な変革アプローチを設計します。',
      background:
        '組織人事コンサルティング歴15年。スタートアップから大企業まで、組織変革プロジェクト150件以上を支援。',
    };

    super('organization', persona, knowledgeBase);
    this.anthropic = new Anthropic({ apiKey });
  }

  protected getAvatarName(): string {
    return '組織開発コンサル HARUKA（ハルカ）';
  }

  protected getCompetencies(): string[] {
    return [
      '組織構造設計',
      '人事制度構築',
      '評価・報酬制度',
      '採用戦略・ブランディング',
      'オンボーディング設計',
      '企業文化変革',
      'エンゲージメント向上',
      '組織診断・サーベイ',
    ];
  }

  protected generateSystemPrompt(request: ConsultationRequest): string {
    const knowledgeContext = this.searchKnowledge(request)
      .map((k) => `[${k.category}] ${k.title}: ${k.content}`)
      .join('\n');

    return `あなたは「HARUKA（ハルカ）」という名の組織開発コンサルタントです。

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
1. **付加価値経営®フレームワーク準拠**: 特に「社員価値」「組織価値」の観点から組織開発を提案
2. **段階的アプローチ**: 組織の成長段階に応じた施策
3. **人と仕組みの両立**: 制度と文化の両面から組織を設計
4. **持続可能性**: 一過性ではなく、継続的に機能する仕組み
5. **エンゲージメント重視**: 社員のモチベーションと成長を促進

# 出力形式
以下のJSON形式で回答してください：

{
  "answer": "組織開発の提案（マークダウン形式、見出し・箇条書き使用可）",
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
      "targetAvatar": "management/finance/etc",
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
      console.error('OrganizationAvatar error:', error);
      return this.generateFallbackResponse(request, knowledge);
    }
  }

  private generateFallbackResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[]
  ): ConsultationResponse {
    return {
      answer: `# 組織開発のご提案

ご相談ありがとうございます。以下、組織開発の基本的な方向性をご提案します。

## 組織診断の観点
1. **組織構造**: 役割・責任の明確化
2. **人事制度**: 評価・報酬の公平性
3. **企業文化**: ビジョン・バリューの浸透

## 改善施策の方向性
1. **組織設計の最適化**: 成長段階に応じた組織構造
2. **人事制度の整備**: 明確な評価基準と納得感
3. **企業文化の醸成**: ビジョン実現に向けた行動規範

## 推奨施策
- 組織診断サーベイの実施
- ミッション・ビジョン・バリューの再定義
- 評価制度の見直し
- 採用戦略の策定

より具体的な提案には、組織の現状と課題の詳細情報が必要です。`,
      recommendations: [
        '組織サーベイの実施',
        'ミッション・ビジョン・バリューワークショップ',
        '人事制度の棚卸しと改善計画策定',
      ],
      relatedValues: ['employee_value', 'organization_value'] as CoreValue[],
      knowledgeReferences: knowledge.map((k) => k.id),
      requiresCEOReport: false,
      confidenceScore: 0.6,
    };
  }

  /**
   * 組織健全性診断
   */
  async diagnoseOrganization(metrics: {
    employeeCount: number;
    turnoverRate: number; // 0-1
    engagementScore: number; // 1-5
    diversityIndex: number; // 0-1
    trainingHoursPerEmployee: number;
    promotionRate: number; // 0-1
    hasVisionStatement: boolean;
    hasPerformanceReview: boolean;
  }): Promise<{
    overallScore: number;
    status: 'healthy' | 'moderate' | 'needs_attention' | 'critical';
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    priorities: Array<{
      area: string;
      urgency: 'high' | 'medium' | 'low';
      action: string;
    }>;
  }> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: string[] = [];
    const priorities: Array<{
      area: string;
      urgency: 'high' | 'medium' | 'low';
      action: string;
    }> = [];

    let score = 0;

    // 離職率評価
    if (metrics.turnoverRate < 0.1) {
      strengths.push('低い離職率を維持');
      score += 20;
    } else if (metrics.turnoverRate > 0.2) {
      weaknesses.push('離職率が高い');
      recommendations.push('退職理由分析とリテンション施策の強化');
      priorities.push({
        area: '離職率改善',
        urgency: 'high',
        action: '退職面談の実施と課題分析',
      });
    } else {
      score += 10;
    }

    // エンゲージメント評価
    if (metrics.engagementScore >= 4) {
      strengths.push('高いエンゲージメント');
      score += 20;
    } else if (metrics.engagementScore < 3) {
      weaknesses.push('エンゲージメントが低い');
      recommendations.push('エンゲージメント向上施策の実施');
      priorities.push({
        area: 'エンゲージメント',
        urgency: 'high',
        action: '社員満足度調査と改善計画',
      });
    } else {
      score += 10;
    }

    // ダイバーシティ評価
    if (metrics.diversityIndex > 0.6) {
      strengths.push('ダイバーシティに配慮');
      score += 15;
    } else if (metrics.diversityIndex < 0.3) {
      weaknesses.push('ダイバーシティの低さ');
      recommendations.push('多様性推進施策の導入');
      priorities.push({
        area: 'ダイバーシティ',
        urgency: 'medium',
        action: '採用・登用におけるダイバーシティ目標設定',
      });
    } else {
      score += 7;
    }

    // 育成投資評価
    if (metrics.trainingHoursPerEmployee >= 40) {
      strengths.push('充実した人材育成');
      score += 15;
    } else if (metrics.trainingHoursPerEmployee < 20) {
      weaknesses.push('育成投資が不足');
      recommendations.push('体系的な研修プログラムの構築');
      priorities.push({
        area: '人材育成',
        urgency: 'medium',
        action: '育成体系の整備とプログラム実施',
      });
    } else {
      score += 7;
    }

    // 昇進機会評価
    if (metrics.promotionRate > 0.1) {
      strengths.push('良好なキャリアパス');
      score += 15;
    } else if (metrics.promotionRate < 0.05) {
      weaknesses.push('昇進機会が少ない');
      recommendations.push('キャリアパスの明確化と昇進機会の創出');
    } else {
      score += 7;
    }

    // ビジョン・評価制度
    if (metrics.hasVisionStatement) {
      score += 7;
    } else {
      weaknesses.push('ビジョンステートメント未整備');
      priorities.push({
        area: 'ビジョン',
        urgency: 'high',
        action: 'ミッション・ビジョン・バリューの策定',
      });
    }

    if (metrics.hasPerformanceReview) {
      score += 8;
    } else {
      weaknesses.push('評価制度未整備');
      priorities.push({
        area: '評価制度',
        urgency: 'high',
        action: '評価制度の設計と導入',
      });
    }

    const status =
      score >= 80
        ? 'healthy'
        : score >= 60
          ? 'moderate'
          : score >= 40
            ? 'needs_attention'
            : 'critical';

    return {
      overallScore: score,
      status,
      strengths,
      weaknesses,
      recommendations,
      priorities: priorities.sort((a, b) => {
        const urgencyOrder = { high: 0, medium: 1, low: 2 };
        return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
      }),
    };
  }

  /**
   * 採用戦略提案
   */
  async proposeRecruitmentStrategy(data: {
    targetRoles: string[];
    hiringGoals: number;
    budget: number;
    timeline: string;
    companyStage: 'startup' | 'growth' | 'mature';
  }): Promise<{
    strategy: string;
    channels: Array<{
      name: string;
      costEffectiveness: 'high' | 'medium' | 'low';
      expectedHires: number;
    }>;
    employerBranding: string[];
    timeline: Array<{
      phase: string;
      duration: string;
      activities: string[];
    }>;
  }> {
    const channels = [
      {
        name: '自社採用サイト強化',
        costEffectiveness: 'high' as const,
        expectedHires: Math.floor(data.hiringGoals * 0.3),
      },
      {
        name: 'リファラル採用',
        costEffectiveness: 'high' as const,
        expectedHires: Math.floor(data.hiringGoals * 0.2),
      },
      {
        name: 'ダイレクトリクルーティング',
        costEffectiveness: 'medium' as const,
        expectedHires: Math.floor(data.hiringGoals * 0.3),
      },
      {
        name: '人材紹介会社',
        costEffectiveness: 'low' as const,
        expectedHires: Math.floor(data.hiringGoals * 0.2),
      },
    ];

    return {
      strategy: `${data.companyStage}ステージに適した多様な採用チャネルを活用し、${data.hiringGoals}名の採用を${data.timeline}で実現します。`,
      channels,
      employerBranding: [
        '採用サイトのリニューアル',
        '社員インタビュー記事の発信',
        'SNSでの企業文化発信',
        '技術ブログ・イベント登壇',
      ],
      timeline: [
        {
          phase: '準備フェーズ',
          duration: '1ヶ月',
          activities: [
            '採用ペルソナ設計',
            'JD（職務記述書）作成',
            '採用サイト整備',
          ],
        },
        {
          phase: '実行フェーズ',
          duration: '3-6ヶ月',
          activities: [
            '各チャネルでの募集開始',
            '選考プロセス実施',
            'オファー・クロージング',
          ],
        },
        {
          phase: 'フォローアップ',
          duration: '継続',
          activities: ['採用振り返り', 'プロセス改善', 'データ分析'],
        },
      ],
    };
  }
}
