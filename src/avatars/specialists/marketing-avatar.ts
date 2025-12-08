/**
 * マーケティングコンサルアバター
 * マーケティング戦略・ブランディングの専門家
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
 * マーケティングコンサルアバター
 */
export class MarketingAvatar extends BaseSpecialist {
  private anthropic: Anthropic;

  constructor(apiKey: string, knowledgeBase: KnowledgeEntry[] = []) {
    const persona: AvatarPersona = {
      role: 'マーケティング戦略家',
      expertise: [
        'マーケティング戦略立案',
        '顧客セグメンテーション',
        'ブランディング',
        'デジタルマーケティング',
        'コンテンツ戦略',
        'プロモーション企画',
      ],
      communicationStyle:
        'クリエイティブかつ戦略的。データと洞察を組み合わせ、顧客の心を動かす施策を提案します。',
      decisionMakingStyle:
        '顧客理解を最優先。定量データと定性インサイトを統合し、ブランド価値向上につながる判断を行います。',
      background:
        'グローバル企業から中小企業まで、200社以上のマーケティング戦略を策定。ブランド価値向上の実績多数。',
    };

    super('marketing', persona, knowledgeBase);
    this.anthropic = new Anthropic({ apiKey });
  }

  protected getAvatarName(): string {
    return 'マーケティングコンサル AKARI（アカリ）';
  }

  protected getCompetencies(): string[] {
    return [
      'マーケティング戦略策定',
      '顧客ペルソナ設計',
      'ブランドポジショニング',
      'カスタマージャーニー設計',
      'コンテンツマーケティング',
      'デジタル広告運用',
      'SNSマーケティング',
      'マーケティングオートメーション',
    ];
  }

  protected generateSystemPrompt(request: ConsultationRequest): string {
    const knowledgeContext = this.searchKnowledge(request)
      .map((k) => `[${k.category}] ${k.title}: ${k.content}`)
      .join('\n');

    return `あなたは「AKARI（アカリ）」という名のマーケティング戦略家です。

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
1. **付加価値経営®フレームワーク準拠**: 特に「顧客価値」「ブランド価値」の観点からマーケティング戦略を提案
2. **顧客中心主義**: ターゲット顧客の深い理解に基づく施策
3. **統合的アプローチ**: オンライン・オフライン、有料・無料施策を統合
4. **測定可能性**: 明確なKPIと効果測定方法を提示
5. **ブランド一貫性**: 短期施策も長期的なブランド構築につながる設計

# 出力形式
以下のJSON形式で回答してください：

{
  "answer": "マーケティング戦略の提案（マークダウン形式、見出し・箇条書き使用可）",
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
      "targetAvatar": "sales/finance/etc",
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
        temperature: 0.8, // マーケティングはクリエイティブ性を重視
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
      console.error('MarketingAvatar error:', error);
      return this.generateFallbackResponse(request, knowledge);
    }
  }

  private generateFallbackResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[]
  ): ConsultationResponse {
    return {
      answer: `# マーケティング戦略のご提案

ご相談ありがとうございます。以下、マーケティング戦略の基本的な方向性をご提案します。

## 戦略フレームワーク
1. **ターゲット顧客の明確化**: ペルソナ設計とセグメンテーション
2. **ポジショニング戦略**: 競合との差別化ポイント
3. **カスタマージャーニー設計**: 認知から購買・ロイヤル化まで

## 主要施策
1. **コンテンツマーケティング**: 価値あるコンテンツで顧客を惹きつける
2. **デジタル広告**: ターゲティング精度の高いWeb広告
3. **SNS活用**: 顧客とのエンゲージメント強化

## 測定指標
- リーチ・認知度
- エンゲージメント率
- リード獲得数
- コンバージョン率

より効果的な施策には、貴社の顧客データと市場分析が必要です。`,
      recommendations: [
        'ターゲット顧客ペルソナの作成',
        'カスタマージャーニーマップの策定',
        'コンテンツカレンダーの作成',
      ],
      relatedValues: ['customer_value', 'brand_value'] as CoreValue[],
      knowledgeReferences: knowledge.map((k) => k.id),
      requiresCEOReport: false,
      confidenceScore: 0.6,
    };
  }

  /**
   * ブランドポジショニング分析
   */
  async analyzePositioning(data: {
    companyName: string;
    industry: string;
    competitors: string[];
    strengths: string[];
    weaknesses: string[];
  }): Promise<{
    positioning: string;
    differentiators: string[];
    messagingPillars: string[];
    recommendations: string[];
  }> {
    const request: ConsultationRequest = {
      query: `${data.companyName}のブランドポジショニング分析を行ってください。

業界: ${data.industry}
主要競合: ${data.competitors.join(', ')}
強み: ${data.strengths.join(', ')}
弱み: ${data.weaknesses.join(', ')}

1. 最適なポジショニング戦略
2. 差別化ポイント
3. メッセージングの柱
4. 具体的な推奨アクション`,
      companyContext: {
        industry: data.industry,
      },
      focusValues: ['brand_value', 'customer_value'],
    };

    const response = await this.consult(request);

    return {
      positioning: 'ポジショニング戦略分析結果',
      differentiators: ['差別化ポイント1', '差別化ポイント2'],
      messagingPillars: ['メッセージ1', 'メッセージ2'],
      recommendations: response.recommendations,
    };
  }
}
