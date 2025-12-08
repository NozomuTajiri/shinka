/**
 * 財務分析アバター
 * 財務諸表分析・収益改善の専門家
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
 * 財務分析アバター
 */
export class FinanceAvatar extends BaseSpecialist {
  private anthropic: Anthropic;

  constructor(apiKey: string, knowledgeBase: KnowledgeEntry[] = []) {
    const persona: AvatarPersona = {
      role: 'CFOアドバイザー',
      expertise: [
        '財務諸表分析',
        '収益性改善',
        'キャッシュフロー管理',
        '投資判断支援',
        '予算管理',
        '財務戦略立案',
      ],
      communicationStyle:
        '数字に基づく論理的な説明。複雑な財務情報をわかりやすく伝え、経営判断に直結する提案を行います。',
      decisionMakingStyle:
        '財務データを重視しつつ、事業の将来性も考慮。リスクとリターンのバランスを取った判断を行います。',
      background:
        '上場企業のCFOを経験後、100社以上の財務改善プロジェクトを成功させてきました。',
    };

    super('finance', persona, knowledgeBase);
    this.anthropic = new Anthropic({ apiKey });
  }

  protected getAvatarName(): string {
    return '財務アドバイザー KAZUKI（カズキ）';
  }

  protected getCompetencies(): string[] {
    return [
      '財務三表分析',
      '財務比率分析',
      'キャッシュフロー分析',
      '収益性改善提案',
      'コスト構造分析',
      '投資評価（NPV/IRR）',
      '予算策定・管理',
      '資金調達戦略',
    ];
  }

  protected generateSystemPrompt(request: ConsultationRequest): string {
    const knowledgeContext = this.searchKnowledge(request)
      .map((k) => `[${k.category}] ${k.title}: ${k.content}`)
      .join('\n');

    return `あなたは「KAZUKI（カズキ）」という名のCFOアドバイザーです。

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
1. **付加価値経営®フレームワーク準拠**: 特に「事業価値」「株主価値」の観点から財務戦略を提案
2. **数字で語る**: 具体的な財務指標と目標値を提示
3. **実行可能性**: 財務改善の具体的なアクションプランを提供
4. **リスク管理**: 財務リスクを明確化し、対策を提示
5. **長期視点**: 短期的な収益と長期的な企業価値向上を両立

# 出力形式
以下のJSON形式で回答してください：

{
  "answer": "財務分析・改善提案（マークダウン形式、見出し・箇条書き使用可）",
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
      "targetAvatar": "operations/sales/etc",
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
        temperature: 0.5, // 財務は正確性重視
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
      console.error('FinanceAvatar error:', error);
      return this.generateFallbackResponse(request, knowledge);
    }
  }

  private generateFallbackResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[]
  ): ConsultationResponse {
    return {
      answer: `# 財務分析・改善のご提案

ご相談ありがとうございます。以下、財務改善の基本的な方向性をご提案します。

## 財務分析の基本
1. **収益性分析**: 売上総利益率、営業利益率、ROE
2. **安全性分析**: 流動比率、自己資本比率
3. **効率性分析**: 総資産回転率、在庫回転率

## 改善施策の方向性
1. **収益性向上**: 粗利率改善、固定費削減
2. **キャッシュフロー改善**: 運転資本の最適化
3. **財務体質強化**: 自己資本比率の向上

## 推奨KPI
- 営業利益率: 目標10%以上
- ROE: 目標8%以上
- 流動比率: 目標150%以上

より詳細な分析には、財務諸表データが必要です。`,
      recommendations: [
        '直近3期の財務諸表分析',
        'コスト構造の見直し',
        'キャッシュフロー改善計画の策定',
      ],
      relatedValues: ['business_value', 'shareholder_value'] as CoreValue[],
      knowledgeReferences: knowledge.map((k) => k.id),
      requiresCEOReport: false,
      confidenceScore: 0.6,
    };
  }

  /**
   * 財務諸表分析
   */
  async analyzeFinancials(data: {
    revenue: number;
    grossProfit: number;
    operatingProfit: number;
    netProfit: number;
    totalAssets: number;
    totalEquity: number;
    currentAssets: number;
    currentLiabilities: number;
    operatingCashFlow: number;
  }): Promise<{
    profitability: Record<string, number>;
    safety: Record<string, number>;
    efficiency: Record<string, number>;
    insights: string[];
    warnings: string[];
    recommendations: string[];
  }> {
    // 収益性指標
    const grossProfitMargin = (data.grossProfit / data.revenue) * 100;
    const operatingProfitMargin = (data.operatingProfit / data.revenue) * 100;
    const netProfitMargin = (data.netProfit / data.revenue) * 100;
    const roe = (data.netProfit / data.totalEquity) * 100;

    // 安全性指標
    const equityRatio = (data.totalEquity / data.totalAssets) * 100;
    const currentRatio = (data.currentAssets / data.currentLiabilities) * 100;

    // 効率性指標
    const totalAssetTurnover = data.revenue / data.totalAssets;

    const insights: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // 収益性評価
    if (operatingProfitMargin < 5) {
      warnings.push('営業利益率が低い（5%未満）');
      recommendations.push('コスト構造の抜本的見直しが必要');
    } else if (operatingProfitMargin > 10) {
      insights.push('優良な収益性を確保');
    }

    // 安全性評価
    if (equityRatio < 30) {
      warnings.push('自己資本比率が低い（財務リスク高）');
      recommendations.push('内部留保の蓄積または増資検討');
    }

    if (currentRatio < 100) {
      warnings.push('流動比率100%未満（短期的な資金繰りリスク）');
      recommendations.push('運転資金の確保が急務');
    }

    // ROE評価
    if (roe < 8) {
      insights.push('ROEが業界平均を下回る可能性');
      recommendations.push('収益性向上または資本効率改善が必要');
    }

    return {
      profitability: {
        grossProfitMargin: Math.round(grossProfitMargin * 10) / 10,
        operatingProfitMargin: Math.round(operatingProfitMargin * 10) / 10,
        netProfitMargin: Math.round(netProfitMargin * 10) / 10,
        roe: Math.round(roe * 10) / 10,
      },
      safety: {
        equityRatio: Math.round(equityRatio * 10) / 10,
        currentRatio: Math.round(currentRatio * 10) / 10,
      },
      efficiency: {
        totalAssetTurnover: Math.round(totalAssetTurnover * 100) / 100,
      },
      insights,
      warnings,
      recommendations,
    };
  }

  /**
   * 投資判断分析（NPV/IRR）
   */
  async evaluateInvestment(data: {
    initialInvestment: number;
    annualCashFlows: number[];
    discountRate: number;
  }): Promise<{
    npv: number;
    irr: number;
    paybackPeriod: number;
    recommendation: 'invest' | 'reject' | 'reconsider';
    reasoning: string;
  }> {
    // NPV計算
    let npv = -data.initialInvestment;
    for (let i = 0; i < data.annualCashFlows.length; i++) {
      npv += data.annualCashFlows[i] / Math.pow(1 + data.discountRate, i + 1);
    }

    // 回収期間計算
    let cumulativeCashFlow = -data.initialInvestment;
    let paybackPeriod = 0;
    for (let i = 0; i < data.annualCashFlows.length; i++) {
      cumulativeCashFlow += data.annualCashFlows[i];
      if (cumulativeCashFlow >= 0) {
        paybackPeriod = i + 1;
        break;
      }
    }

    // IRR概算（簡易計算）
    const totalCashFlow = data.annualCashFlows.reduce((sum, cf) => sum + cf, 0);
    const avgAnnualReturn =
      (totalCashFlow - data.initialInvestment) / data.annualCashFlows.length;
    const irr = (avgAnnualReturn / data.initialInvestment) * 100;

    // 投資判断
    let recommendation: 'invest' | 'reject' | 'reconsider';
    let reasoning: string;

    if (npv > 0 && irr > data.discountRate * 100) {
      recommendation = 'invest';
      reasoning = 'NPVがプラスでIRRが要求収益率を上回るため、投資推奨';
    } else if (npv < 0) {
      recommendation = 'reject';
      reasoning = 'NPVがマイナスのため、投資非推奨';
    } else {
      recommendation = 'reconsider';
      reasoning = '条件次第で投資可能。リスク要因を詳細検討すべき';
    }

    return {
      npv: Math.round(npv),
      irr: Math.round(irr * 10) / 10,
      paybackPeriod,
      recommendation,
      reasoning,
    };
  }
}
