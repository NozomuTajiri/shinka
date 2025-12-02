/**
 * プロンプトテンプレート
 * 価値主義経営®の6つの価値を反映した経営コンサルタントペルソナ
 */

import type { ProposalGenerationRequest, CoreValue } from '../types/proposal.js';

/**
 * 価値主義経営®の6つの価値の説明
 */
const CORE_VALUES_DESCRIPTION = `
価値主義経営®の6つの価値:

1. **顧客価値 (Customer Value)**: 顧客に提供する価値の最大化
2. **社員価値 (Employee Value)**: 社員の成長と幸福度の向上
3. **事業価値 (Business Value)**: 事業の持続的成長と収益性
4. **組織価値 (Organization Value)**: 組織能力と生産性の向上
5. **ブランド価値 (Brand Value)**: 市場における認知度と信頼性
6. **株主価値 (Shareholder Value)**: 企業価値と株主利益の最大化
`.trim();

/**
 * システムプロンプト
 * Claude のペルソナと役割を定義
 */
export function getSystemPrompt(): string {
  return `
あなたは20年以上の経験を持つ経営戦略コンサルタントです。
特に「価値主義経営®」のフレームワークに精通しており、企業の持続的成長を支援します。

## あなたの専門性

- 経営戦略立案（ビジョン策定、中期経営計画、事業ポートフォリオ分析）
- 組織変革・組織開発（組織診断、人材育成、企業文化醸成）
- 業務改革・DX推進（業務プロセス最適化、デジタル戦略、IT導入支援）
- マーケティング戦略（ブランド戦略、顧客価値創造、市場開拓）
- 財務・投資戦略（ROI分析、投資判断、コスト最適化）

## 価値主義経営®フレームワーク

${CORE_VALUES_DESCRIPTION}

すべての提案は、この6つの価値をバランスよく考慮し、統合的な価値創造を目指します。

## あなたの提案スタイル

1. **データ駆動**: 定量的な分析と具体的な数値目標を提示
2. **実行可能性**: 現実的で実装可能な施策を優先
3. **バランス**: 短期的成果と長期的投資のバランスを重視
4. **リスク管理**: 潜在的リスクと対策を明確に提示
5. **ステークホルダー視点**: 経営者、社員、顧客、株主の多角的視点

## 出力形式

提案書はJSON形式で構造化されたデータとして出力します。
各セクションは明確で、具体的で、アクション可能な内容を含みます。
`.trim();
}

/**
 * 提案生成プロンプトを構築
 */
export function buildProposalPrompt(
  request: ProposalGenerationRequest
): string {
  const {
    clientName,
    industry,
    companySize,
    mainChallenges,
    additionalContext,
    focusValues,
  } = request;

  // 重点価値の説明を生成
  let focusValuesText = '';
  if (focusValues && focusValues.length > 0) {
    const valueNames = focusValues.map((v) => getValueName(v)).join('、');
    focusValuesText = `\n\n特に以下の価値領域に重点を置いてください: ${valueNames}`;
  }

  return `
# コンサルティング提案書の作成依頼

## クライアント情報

- **企業名**: ${clientName}
- **業界**: ${industry}
- **企業規模**: ${companySize}

## 経営課題

${mainChallenges}

${additionalContext ? `## 追加情報\n\n${additionalContext}` : ''}

${focusValuesText}

---

## 依頼内容

上記のクライアント情報と経営課題を踏まえ、包括的なコンサルティング提案書を作成してください。

提案書は以下の構造で、JSON形式で出力してください:

\`\`\`json
{
  "id": "提案書の一意なID（UUID形式）",
  "title": "提案書のタイトル",
  "clientName": "${clientName}",
  "createdAt": "作成日時（ISO 8601形式）",
  "consultant": {
    "name": "あなたの名前",
    "title": "経営戦略コンサルタント",
    "organization": "価値主義経営コンサルティング"
  },
  "executiveSummary": {
    "challengeSummary": "経営課題の要約（200字程度）",
    "proposalOverview": "提案の概要（300字程度）",
    "keyOutcomes": ["期待される主要な成果1", "成果2", "成果3"],
    "estimatedInvestment": "投資概算（例: 5,000万円〜8,000万円）",
    "expectedROI": "期待ROI（例: 3年間で投資額の3倍のリターン）"
  },
  "currentState": {
    "industryTrends": "業界動向の分析（500字程度）",
    "companyStatus": "企業の現状分析（500字程度）",
    "strengths": ["強み1", "強み2", "強み3"],
    "weaknesses": ["弱み1", "弱み2", "弱み3"],
    "opportunities": ["機会1", "機会2", "機会3"],
    "threats": ["脅威1", "脅威2", "脅威3"]
  },
  "issues": [
    {
      "id": "issue-1",
      "title": "課題タイトル",
      "description": "課題の詳細説明（300字程度）",
      "affectedValues": ["customer_value", "business_value"],
      "priority": "high",
      "businessImpact": "ビジネスへの影響（200字程度）"
    }
    // 3-5個の主要課題
  ],
  "measures": [
    {
      "id": "measure-1",
      "title": "施策タイトル",
      "description": "施策の詳細説明（400字程度）",
      "targetIssueIds": ["issue-1"],
      "relatedValues": ["customer_value", "employee_value"],
      "priority": "high",
      "timeframe": "short",
      "expectedEffects": ["期待効果1", "期待効果2"],
      "requiredResources": ["必要リソース1", "必要リソース2"],
      "successMetrics": ["KPI1", "KPI2"]
    }
    // 5-10個の改善施策
  ],
  "implementationPlan": {
    "overallTimeline": "全体スケジュール（例: 12ヶ月）",
    "phases": [
      {
        "phase": 1,
        "name": "フェーズ1名",
        "duration": "1-3ヶ月目",
        "activities": ["活動1", "活動2"],
        "milestones": ["マイルストーン1"],
        "deliverables": ["成果物1", "成果物2"]
      }
      // 3-4フェーズ
    ],
    "organizationStructure": "実行体制の説明（300字程度）",
    "risksAndMitigations": [
      {
        "risk": "リスク1",
        "mitigation": "対策1"
      }
      // 3-5個のリスク
    ]
  },
  "expectedEffects": {
    "shortTerm": ["短期的効果1（6ヶ月以内）", "効果2"],
    "mediumTerm": ["中期的効果1（1年以内）", "効果2"],
    "longTerm": ["長期的効果1（1年以上）", "効果2"],
    "quantitativeEffects": [
      {
        "metric": "売上高",
        "current": "10億円",
        "target": "15億円",
        "improvement": "+50%"
      }
      // 3-5個の定量指標
    ]
  },
  "investmentPlan": {
    "initialInvestment": {
      "description": "初期投資の説明",
      "amount": "5,000万円",
      "breakdown": [
        { "item": "項目1", "cost": "2,000万円" }
      ]
    },
    "operationalCost": {
      "description": "運用コストの説明",
      "amount": "年間1,000万円",
      "breakdown": [
        { "item": "項目1", "cost": "500万円" }
      ]
    },
    "roiProjection": {
      "year1": "ROI 50%",
      "year2": "ROI 150%",
      "year3": "ROI 300%"
    }
  },
  "appendix": "付録・補足資料（任意）"
}
\`\`\`

## 重要な指示

1. **具体性**: 抽象的な表現は避け、具体的な数値や施策を示す
2. **実行可能性**: 実際に実装可能な現実的な提案を行う
3. **バランス**: 6つの価値をバランスよく考慮する
4. **優先順位**: 重要度と緊急度に基づいて優先順位を明確にする
5. **JSON形式**: 必ず有効なJSON形式で出力する（コメントやMarkdownは含めない）

それでは、上記の要件に基づいて提案書を作成してください。
`.trim();
}

/**
 * 価値名を取得
 */
function getValueName(value: CoreValue): string {
  const valueNames: Record<CoreValue, string> = {
    customer_value: '顧客価値',
    employee_value: '社員価値',
    business_value: '事業価値',
    organization_value: '組織価値',
    brand_value: 'ブランド価値',
    shareholder_value: '株主価値',
  };
  return valueNames[value];
}

/**
 * セクション別のプロンプト（詳細化が必要な場合に使用）
 */
export const SECTION_PROMPTS = {
  executiveSummary: `
エグゼクティブサマリーを作成してください。
経営層が5分で理解できるよう、簡潔かつインパクトのある内容にしてください。
`,

  currentState: `
現状分析を実施してください。
SWOT分析を含め、客観的なデータに基づいた分析を行ってください。
`,

  issues: `
主要な経営課題を特定してください。
各課題は価値主義経営®の6つの価値のどれに影響するか明確にしてください。
`,

  solutions: `
課題に対する具体的な解決策を提案してください。
各施策の期待効果、必要リソース、成功指標を明確にしてください。
`,

  implementationPlan: `
実行計画を策定してください。
フェーズ分け、スケジュール、体制、リスク対策を含めてください。
`,

  expectedEffects: `
期待される効果を整理してください。
短期・中期・長期に分け、定量的な目標を設定してください。
`,

  investment: `
投資計画を作成してください。
初期投資、運用コスト、ROI試算を具体的に示してください。
`,
} as const;

/**
 * エラー発生時の再試行プロンプト
 */
export function getRetryPrompt(error: string): string {
  return `
前回のレスポンスでエラーが発生しました: ${error}

以下の点に注意して、再度提案書を生成してください:
1. 有効なJSON形式で出力する
2. すべての必須フィールドを含める
3. 文字列内のダブルクォートは適切にエスケープする
4. 日付は ISO 8601 形式（例: 2025-12-02T10:00:00.000Z）で出力する

それでは、修正した提案書を出力してください。
`.trim();
}
