/**
 * セールスコンサルアバター
 * 営業戦略・プロセス改善の専門家
 */

import Anthropic from '@anthropic-ai/sdk';
import type { AvatarPersona } from '@/mother-ai/types';
import type { CoreValue } from '@/types/proposal';
import {
  BaseSpecialist,
  type ConsultationRequest,
  type ConsultationResponse,
  type KnowledgeEntry,
  type CEOReport,
} from './base-specialist';

/**
 * セールスコンサルアバター
 */
export class SalesAvatar extends BaseSpecialist {
  private anthropic: Anthropic;

  constructor(apiKey: string, knowledgeBase: KnowledgeEntry[] = []) {
    const persona: AvatarPersona = {
      role: '営業改革のスペシャリスト',
      expertise: [
        '営業戦略立案',
        '営業プロセス改善',
        '価格戦略',
        '商談管理',
        'セールスイネーブルメント',
        '顧客関係管理',
      ],
      communicationStyle:
        '実践的で成果志向。データに基づく提案を行い、即座に実行可能なアクションプランを提示します。',
      decisionMakingStyle:
        '定量データと営業現場の実態を重視。短期的な成果と長期的な仕組み構築のバランスを取ります。',
      background:
        '20年以上の営業経験。BtoB、BtoC両方の営業改革プロジェクトを100件以上成功させてきました。',
    };

    super('sales', persona, knowledgeBase);
    this.anthropic = new Anthropic({ apiKey });
  }

  protected getAvatarName(): string {
    return 'セールスコンサル TAKUMI（タクミ）';
  }

  protected getCompetencies(): string[] {
    return [
      '営業戦略設計',
      '営業プロセス最適化',
      'KPI設計・運用',
      '価格戦略策定',
      '商談管理システム構築',
      'セールストレーニング',
      'インサイドセールス構築',
      'カスタマーサクセス設計',
    ];
  }

  protected generateSystemPrompt(request: ConsultationRequest): string {
    const knowledgeContext = this.searchKnowledge(request)
      .map((k) => `[${k.category}] ${k.title}: ${k.content}`)
      .join('\n');

    return `あなたは「TAKUMI（タクミ）」という名の営業改革のスペシャリストです。

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
1. **付加価値経営®フレームワーク準拠**: 特に「顧客価値」「事業価値」の観点から営業改革を提案
2. **実践的**: 明日から実行できる具体的なアクションを含める
3. **データドリブン**: 測定可能なKPIと目標値を提示
4. **営業現場主義**: 営業担当者が実際に使える仕組みを重視
5. **段階的アプローチ**: クイックウィン施策から長期的改革まで段階的に提案

# 出力形式
以下のJSON形式で回答してください：

{
  "answer": "営業改革の提案（マークダウン形式、見出し・箇条書き使用可）",
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
      "targetAvatar": "marketing/finance/etc",
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

      // JSON部分を抽出
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const response = JSON.parse(jsonMatch[0]) as ConsultationResponse;

      // CEOへの報告が必要な場合
      if (response.requiresCEOReport && response.ceoReport) {
        await this.reportToCEO(response.ceoReport);
      }

      // 他アバターとの連携提案がある場合
      if (response.collaborationSuggestions) {
        for (const suggestion of response.collaborationSuggestions) {
          await this.collaborateWith(suggestion.targetAvatar, suggestion.reason);
        }
      }

      return response;
    } catch (error) {
      // エラー時のフォールバック
      console.error('SalesAvatar error:', error);
      return this.generateFallbackResponse(request, knowledge);
    }
  }

  /**
   * フォールバック応答を生成
   */
  private generateFallbackResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[]
  ): ConsultationResponse {
    return {
      answer: `# 営業改革のご提案

ご相談ありがとうございます。以下、営業改革の基本的な方向性をご提案します。

## 現状分析のポイント
1. 営業プロセスの可視化
2. KPI設定と測定
3. ボトルネック特定

## 改善施策例
1. **営業プロセスの標準化**: 受注までのステップを明確化
2. **KPI管理の徹底**: リード数、商談化率、受注率を測定
3. **営業支援ツール導入**: SFA/CRMで活動を可視化

より詳細な分析には、貴社の営業データと現場へのヒアリングが必要です。`,
      recommendations: [
        '営業プロセスマップの作成',
        '主要KPIの設定と測定開始',
        '営業担当者へのヒアリング実施',
      ],
      relatedValues: ['customer_value', 'business_value'] as CoreValue[],
      knowledgeReferences: knowledge.map((k) => k.id),
      requiresCEOReport: false,
      confidenceScore: 0.6,
    };
  }

  /**
   * 営業KPI分析
   */
  async analyzeSalesKPI(data: {
    leads: number;
    opportunities: number;
    closedWon: number;
    revenue: number;
    period: string;
  }): Promise<{
    metrics: Record<string, number>;
    insights: string[];
    recommendations: string[];
  }> {
    const conversionRate = (data.closedWon / data.leads) * 100;
    const opportunityRate = (data.opportunities / data.leads) * 100;
    const closeRate = (data.closedWon / data.opportunities) * 100;
    const avgDealSize = data.revenue / data.closedWon;

    const insights: string[] = [];
    const recommendations: string[] = [];

    // コンバージョン率の評価
    if (conversionRate < 2) {
      insights.push('リード品質または営業プロセスに課題がある可能性');
      recommendations.push('リード獲得チャネルの見直しとナーチャリング強化');
    } else if (conversionRate > 5) {
      insights.push('高いコンバージョン率を達成');
      recommendations.push('成功パターンの横展開と規模拡大');
    }

    // 商談化率の評価
    if (opportunityRate < 10) {
      insights.push('リードの質またはフォロー体制に課題');
      recommendations.push('インサイドセールスの強化とリードスコアリング導入');
    }

    // 成約率の評価
    if (closeRate < 20) {
      insights.push('商談スキルまたは提案内容に改善余地');
      recommendations.push('商談プロセスの標準化とセールストレーニング実施');
    }

    return {
      metrics: {
        conversionRate,
        opportunityRate,
        closeRate,
        avgDealSize,
      },
      insights,
      recommendations,
    };
  }
}
