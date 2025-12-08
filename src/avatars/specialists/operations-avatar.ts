/**
 * オペレーション改善アバター
 * 業務効率化・生産性向上の専門家
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
 * オペレーション改善アバター
 */
export class OperationsAvatar extends BaseSpecialist {
  private anthropic: Anthropic;

  constructor(apiKey: string, knowledgeBase: KnowledgeEntry[] = []) {
    const persona: AvatarPersona = {
      role: 'オペレーション改善エキスパート',
      expertise: [
        '業務プロセス改善',
        '生産性向上',
        'コスト削減',
        '品質管理',
        'DX推進',
        '業務自動化',
      ],
      communicationStyle:
        '実務的で効率重視。現場目線で実行可能な改善策を提示し、着実な成果創出を支援します。',
      decisionMakingStyle:
        'データと現場の声を重視。QCD（品質・コスト・納期）のバランスを取り、段階的な改善を推進します。',
      background:
        '製造業からサービス業まで、業務改善プロジェクト200件以上を成功させた実績があります。',
    };

    super('operations', persona, knowledgeBase);
    this.anthropic = new Anthropic({ apiKey });
  }

  protected getAvatarName(): string {
    return 'オペレーション改善 KENJI（ケンジ）';
  }

  protected getCompetencies(): string[] {
    return [
      '業務プロセス分析',
      'ボトルネック特定',
      '業務フロー設計',
      'KPI設計・管理',
      '業務自動化（RPA）',
      'DXツール導入',
      '品質管理体制構築',
      'コスト削減施策',
    ];
  }

  protected generateSystemPrompt(request: ConsultationRequest): string {
    const knowledgeContext = this.searchKnowledge(request)
      .map((k) => `[${k.category}] ${k.title}: ${k.content}`)
      .join('\n');

    return `あなたは「KENJI（ケンジ）」という名のオペレーション改善エキスパートです。

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
1. **付加価値経営®フレームワーク準拠**: 特に「事業価値」の観点から業務効率化を提案
2. **現場重視**: 現場の負担を最小化し、実行可能な改善策を提示
3. **段階的改善**: クイックウィンから構造改革まで段階的にアプローチ
4. **測定可能性**: 改善効果を定量的に測定できるKPI設定
5. **自動化優先**: 人手作業の削減と自動化を積極提案

# 出力形式
以下のJSON形式で回答してください：

{
  "answer": "オペレーション改善の提案（マークダウン形式、見出し・箇条書き使用可）",
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
      "targetAvatar": "finance/management/etc",
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
        temperature: 0.6,
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
      console.error('OperationsAvatar error:', error);
      return this.generateFallbackResponse(request, knowledge);
    }
  }

  private generateFallbackResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[]
  ): ConsultationResponse {
    return {
      answer: `# オペレーション改善のご提案

ご相談ありがとうございます。以下、業務効率化の基本的な方向性をご提案します。

## 現状分析のステップ
1. **業務フロー可視化**: 現状の業務プロセスを図式化
2. **ボトルネック特定**: 時間・コストがかかる工程を特定
3. **改善優先順位**: 効果とコストのバランスで優先度決定

## 改善施策の方向性
1. **業務標準化**: 属人化している業務をマニュアル化
2. **自動化推進**: RPAやツール導入で定型作業を削減
3. **プロセス最適化**: 不要な工程の削除、順序の見直し

## 測定指標（例）
- 業務時間の削減率
- エラー発生率の低減
- 処理件数の増加

より具体的な提案には、現場の業務フローと課題のヒアリングが必要です。`,
      recommendations: [
        '業務フロー図の作成',
        'ボトルネック工程の時間測定',
        '自動化可能業務のリストアップ',
      ],
      relatedValues: ['business_value', 'employee_value'] as CoreValue[],
      knowledgeReferences: knowledge.map((k) => k.id),
      requiresCEOReport: false,
      confidenceScore: 0.6,
    };
  }

  /**
   * 業務プロセス分析
   */
  async analyzeProcess(data: {
    processName: string;
    steps: Array<{
      name: string;
      timeMinutes: number;
      errorRate: number;
      isAutomatable: boolean;
    }>;
    monthlyVolume: number;
  }): Promise<{
    currentState: {
      totalTimePerCase: number;
      monthlyTotalHours: number;
      avgErrorRate: number;
      automationPotential: number;
    };
    bottlenecks: Array<{
      step: string;
      issue: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    improvements: Array<{
      step: string;
      action: string;
      expectedTimeReduction: number;
      expectedCostReduction: number;
      priority: 'high' | 'medium' | 'low';
    }>;
    potentialSavings: {
      timeReductionHours: number;
      costReductionJPY: number;
      roi: number;
    };
  }> {
    // 現状分析
    const totalTimePerCase = data.steps.reduce((sum, s) => sum + s.timeMinutes, 0);
    const monthlyTotalHours = (totalTimePerCase * data.monthlyVolume) / 60;
    const avgErrorRate =
      data.steps.reduce((sum, s) => sum + s.errorRate, 0) / data.steps.length;
    const automatableSteps = data.steps.filter((s) => s.isAutomatable);
    const automationPotential = automatableSteps.length / data.steps.length;

    // ボトルネック特定
    const bottlenecks: Array<{
      step: string;
      issue: string;
      impact: 'high' | 'medium' | 'low';
    }> = data.steps
      .filter((step) => step.timeMinutes > totalTimePerCase * 0.2)
      .map((step) => ({
        step: step.name,
        issue: `処理時間が長い（${step.timeMinutes}分）`,
        impact: 'high' as const,
      }));

    // エラー率が高い工程もボトルネック
    data.steps
      .filter((step) => step.errorRate > 0.05)
      .forEach((step) => {
        bottlenecks.push({
          step: step.name,
          issue: `エラー率が高い（${(step.errorRate * 100).toFixed(1)}%）`,
          impact: 'medium',
        });
      });

    // 改善提案
    const improvements = [];
    let totalTimeReduction = 0;

    for (const step of data.steps) {
      if (step.isAutomatable) {
        const timeReduction = step.timeMinutes * 0.8; // 80%削減想定
        totalTimeReduction += timeReduction;
        improvements.push({
          step: step.name,
          action: 'RPA/ツール導入による自動化',
          expectedTimeReduction: timeReduction,
          expectedCostReduction: (timeReduction * data.monthlyVolume * 60 * 3000) / 60, // 時給3000円想定
          priority: 'high' as const,
        });
      }

      if (step.errorRate > 0.05) {
        improvements.push({
          step: step.name,
          action: 'チェックリスト導入とダブルチェック',
          expectedTimeReduction: 0,
          expectedCostReduction: step.errorRate * data.monthlyVolume * 10000, // エラー1件1万円想定
          priority: 'medium' as const,
        });
      }
    }

    // 削減効果試算
    const monthlyTimeReductionHours = (totalTimeReduction * data.monthlyVolume) / 60;
    const annualCostReduction = monthlyTimeReductionHours * 12 * 3000; // 時給3000円 × 12ヶ月

    return {
      currentState: {
        totalTimePerCase: Math.round(totalTimePerCase),
        monthlyTotalHours: Math.round(monthlyTotalHours),
        avgErrorRate: Math.round(avgErrorRate * 1000) / 10,
        automationPotential: Math.round(automationPotential * 100),
      },
      bottlenecks,
      improvements: improvements.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      potentialSavings: {
        timeReductionHours: Math.round(monthlyTimeReductionHours),
        costReductionJPY: Math.round(annualCostReduction),
        roi: Math.round((annualCostReduction / 1000000) * 10) / 10, // 投資100万円想定
      },
    };
  }

  /**
   * 自動化候補抽出
   */
  async identifyAutomationCandidates(tasks: Array<{
    name: string;
    frequency: 'daily' | 'weekly' | 'monthly';
    timePerExecution: number;
    complexity: 'low' | 'medium' | 'high';
    dataStructured: boolean;
  }>): Promise<
    Array<{
      task: string;
      automationType: 'RPA' | 'API' | 'Script' | 'Tool';
      priority: number;
      estimatedROI: number;
      reason: string;
    }>
  > {
    const candidates = tasks.map((task) => {
      const frequencyMultiplier = {
        daily: 20,
        weekly: 4,
        monthly: 1,
      };
      const monthlyTime = task.timePerExecution * frequencyMultiplier[task.frequency];

      // 自動化タイプ判定
      let automationType: 'RPA' | 'API' | 'Script' | 'Tool';
      if (task.dataStructured && task.complexity === 'low') {
        automationType = 'Script';
      } else if (task.dataStructured && task.complexity === 'medium') {
        automationType = 'API';
      } else if (!task.dataStructured && task.complexity === 'low') {
        automationType = 'RPA';
      } else {
        automationType = 'Tool';
      }

      // 優先度スコア（月間時間 × 複雑度逆数）
      const complexityScore = { low: 3, medium: 2, high: 1 };
      const priority = monthlyTime * complexityScore[task.complexity];

      // ROI概算（年間削減時間 × 時給3000円 / 開発コスト概算）
      const annualSavings = monthlyTime * 12 * 3000;
      const devCost = { low: 100000, medium: 300000, high: 500000 };
      const estimatedROI = annualSavings / devCost[task.complexity];

      return {
        task: task.name,
        automationType,
        priority: Math.round(priority),
        estimatedROI: Math.round(estimatedROI * 10) / 10,
        reason: `月間${monthlyTime}分削減可能。${automationType}による自動化を推奨。`,
      };
    });

    return candidates.sort((a, b) => b.priority - a.priority);
  }
}
