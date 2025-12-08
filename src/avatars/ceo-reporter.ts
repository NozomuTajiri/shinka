/**
 * CEO Reporter Module
 *
 * レポート生成モジュール
 * 総合分析レポート、戦略オプション提示、リスク分析、アクションアイテム生成
 */

import type { CEOAvatar } from './ceo-avatar.js';
import type {
  AvatarReport,
  ReportSection,
  StrategicOption,
  RiskAnalysis,
  ActionItem,
  TaskPriority,
} from './types.js';

/**
 * レポート設定
 */
export interface ReportConfig {
  /** レポートタイトル */
  title: string;
  /** 含めるセクション */
  includeSections?: {
    executiveSummary?: boolean;
    situation?: boolean;
    analysis?: boolean;
    options?: boolean;
    risks?: boolean;
    actionItems?: boolean;
  };
  /** 戦略オプション数（デフォルト: 3） */
  numberOfOptions?: number;
  /** 詳細度（1-5、デフォルト: 3） */
  detailLevel?: number;
}

/**
 * CEOレポーター
 *
 * 経営層向けの総合分析レポートを生成
 */
export class CEOReporter {
  /** 親CEOアバター */
  private ceo: CEOAvatar;

  /**
   * コンストラクター
   *
   * @param ceo - CEOアバターインスタンス
   */
  constructor(ceo: CEOAvatar) {
    this.ceo = ceo;
  }

  /**
   * 総合分析レポート生成
   *
   * @param config - レポート設定
   * @returns 生成されたレポート
   */
  public async generateReport(config: ReportConfig): Promise<AvatarReport> {
    const reportId = this.generateReportId();

    this.log(`レポート生成開始: ${config.title}`);

    // デフォルト設定
    const finalConfig: Required<ReportConfig> = {
      title: config.title,
      includeSections: {
        executiveSummary: true,
        situation: true,
        analysis: true,
        options: true,
        risks: true,
        actionItems: true,
        ...config.includeSections,
      },
      numberOfOptions: config.numberOfOptions ?? 3,
      detailLevel: config.detailLevel ?? 3,
    };

    // 各セクションを生成
    const sections: ReportSection[] = [];

    if (finalConfig.includeSections.situation) {
      sections.push(await this.generateSituationSection());
    }

    if (finalConfig.includeSections.analysis) {
      sections.push(await this.generateAnalysisSection());
    }

    // エグゼクティブサマリーを生成
    const executiveSummary = finalConfig.includeSections.executiveSummary
      ? await this.generateExecutiveSummary(sections)
      : '';

    // 戦略オプション生成
    const strategicOptions = finalConfig.includeSections.options
      ? await this.generateStrategicOptions(finalConfig.numberOfOptions)
      : [];

    // リスク分析生成
    const risks = finalConfig.includeSections.risks
      ? await this.generateRiskAnalysis()
      : [];

    // アクションアイテム生成
    const actionItems = finalConfig.includeSections.actionItems
      ? await this.generateActionItems()
      : [];

    const report: AvatarReport = {
      id: reportId,
      title: config.title,
      generatedAt: new Date(),
      executiveSummary,
      sections,
      strategicOptions,
      risks,
      actionItems,
    };

    // レポートを保存
    this.ceo.addReport(report);

    this.log(`レポート生成完了: ${reportId}`);

    return report;
  }

  /**
   * エグゼクティブサマリー生成
   *
   * @param sections - 既存セクション
   * @returns サマリーテキスト
   */
  private async generateExecutiveSummary(
    sections: ReportSection[]
  ): Promise<string> {
    const allTasks = this.ceo.getAllTasks();
    const sectionSummaries = sections.map((s) => `${s.title}: ${s.content}`).join('\n\n');

    const prompt = `
以下の情報をもとに、経営層向けのエグゼクティブサマリーを作成してください。

## 現状のタスク情報
- 総タスク数: ${allTasks.length}
- 完了: ${allTasks.filter((t) => t.status === 'completed').length}
- 進行中: ${allTasks.filter((t) => t.status === 'in_progress').length}
- ブロック: ${allTasks.filter((t) => t.status === 'blocked').length}

## 詳細セクション
${sectionSummaries}

## エグゼクティブサマリーの要件

1. **長さ**: 3-5段落（A4半ページ程度）
2. **内容**:
   - 現状の要約
   - 主要な発見事項（Key Findings）
   - 重要な意思決定ポイント
   - 推奨アクション（トップ3）
3. **スタイル**:
   - 明確で簡潔
   - データドリブン
   - アクション志向

経営者が5分で読めるサマリーを作成してください。
`.trim();

    return this.ceo.sendMessage(prompt);
  }

  /**
   * 現状分析セクション生成
   *
   * @returns 現状セクション
   */
  private async generateSituationSection(): Promise<ReportSection> {
    const allTasks = this.ceo.getAllTasks();

    const prompt = `
現在のプロジェクト状況を分析してください。

## タスク情報
${JSON.stringify(
      allTasks.map((t) => ({
        title: t.title,
        priority: t.priority,
        status: t.status,
        assignedTo: t.assignedTo,
      })),
      null,
      2
    )}

## 分析ポイント

1. **全体の進捗状況**
2. **優先度別の状況**（urgent, high, medium, low）
3. **専門家別の負荷状況**
4. **期限遵守状況**
5. **主要なボトルネック**

データに基づいた客観的な分析を、3-4段落でまとめてください。
`.trim();

    const content = await this.ceo.sendMessage(prompt);

    return {
      title: '現状分析',
      content,
      importance: 5,
      sources: ['タスク管理データ'],
    };
  }

  /**
   * 詳細分析セクション生成
   *
   * @returns 分析セクション
   */
  private async generateAnalysisSection(): Promise<ReportSection> {
    const prompt = `
現在の状況を深く分析し、以下の観点でレポートしてください：

## 分析フレームワーク

### 1. SWOT分析
- Strengths（強み）
- Weaknesses（弱み）
- Opportunities（機会）
- Threats（脅威）

### 2. 重要課題の特定
- 最優先で対処すべき課題（トップ3）
- それぞれの影響範囲と緊急度

### 3. 成功要因の分析
- うまくいっている点
- その理由
- 横展開の可能性

5-6段落で、構造的に分析してください。
`.trim();

    const content = await this.ceo.sendMessage(prompt);

    return {
      title: '詳細分析',
      content,
      importance: 4,
    };
  }

  /**
   * 戦略オプション生成
   *
   * @param numberOfOptions - オプション数
   * @returns 戦略オプション配列
   */
  private async generateStrategicOptions(
    numberOfOptions: number
  ): Promise<StrategicOption[]> {
    const prompt = `
現状を踏まえ、${numberOfOptions}つの戦略オプションを提示してください。

## オプションの種類

1. **保守的アプローチ**: リスク最小化、既存リソース活用
2. **バランス型アプローチ**: リスクとリターンのバランス
3. **革新的アプローチ**: 高リターン追求、新規投資

## 各オプションに含める情報

- 名前（簡潔に）
- 説明（3-4文）
- メリット（3つ）
- デメリット・リスク（3つ）
- 推定コスト（概算）
- 推定期間
- 推奨度（1-5で評価）

JSON形式で出力してください：

\`\`\`json
{
  "options": [
    {
      "name": "オプション名",
      "description": "説明",
      "benefits": ["メリット1", "メリット2", "メリット3"],
      "risks": ["リスク1", "リスク2", "リスク3"],
      "estimatedCost": "100万円〜300万円",
      "estimatedDuration": "3ヶ月",
      "recommendation": 4
    },
    ...
  ]
}
\`\`\`
`.trim();

    const response = await this.ceo.sendMessage(prompt);

    // JSON部分を抽出
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[1]);
    return parsed.options as StrategicOption[];
  }

  /**
   * リスク分析生成
   *
   * @returns リスク分析配列
   */
  private async generateRiskAnalysis(): Promise<RiskAnalysis[]> {
    const prompt = `
現在のプロジェクトにおける主要なリスクを分析してください。

## リスク分析フレームワーク

各リスクについて：
1. **リスク名**
2. **説明**
3. **発生確率**（low/medium/high）
4. **影響度**（low/medium/high）
5. **対策案**（3つ程度）

トップ5のリスクを、JSON形式で出力してください：

\`\`\`json
{
  "risks": [
    {
      "name": "リスク名",
      "description": "詳細説明",
      "probability": "high",
      "impact": "medium",
      "mitigation": ["対策1", "対策2", "対策3"]
    },
    ...
  ]
}
\`\`\`
`.trim();

    const response = await this.ceo.sendMessage(prompt);

    // JSON部分を抽出
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[1]);
    return parsed.risks as RiskAnalysis[];
  }

  /**
   * アクションアイテム生成
   *
   * @returns アクションアイテム配列
   */
  private async generateActionItems(): Promise<ActionItem[]> {
    const allTasks = this.ceo.getAllTasks();
    const pendingTasks = allTasks.filter((t) => t.status === 'pending');

    const prompt = `
以下の未着手タスクから、優先度の高いアクションアイテムを作成してください。

## 未着手タスク
${JSON.stringify(
      pendingTasks.map((t) => ({
        title: t.title,
        description: t.description,
        priority: t.priority,
      })),
      null,
      2
    )}

## アクションアイテムの要件

各アイテムについて：
1. **具体的なアクション**（動詞で始まる）
2. **担当者・チーム**
3. **優先度**
4. **期限**（具体的な日付）
5. **ステータス**

トップ10のアクションアイテムを、JSON形式で出力してください：

\`\`\`json
{
  "actionItems": [
    {
      "action": "〇〇を実施する",
      "owner": "担当者名 or チーム名",
      "priority": "urgent",
      "deadline": "2025-12-15",
      "status": "pending"
    },
    ...
  ]
}
\`\`\`
`.trim();

    const response = await this.ceo.sendMessage(prompt);

    // JSON部分を抽出
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (!jsonMatch) {
      return [];
    }

    const parsed = JSON.parse(jsonMatch[1]);

    // ActionItem形式に変換
    return parsed.actionItems.map(
      (item: {
        action: string;
        owner: string;
        priority: TaskPriority;
        deadline: string;
        status: 'pending' | 'in_progress' | 'completed';
      }) => ({
        id: this.generateActionItemId(),
        action: item.action,
        owner: item.owner,
        priority: item.priority,
        deadline: item.deadline ? new Date(item.deadline) : undefined,
        status: item.status,
      })
    );
  }

  /**
   * レポートをMarkdown形式でエクスポート
   *
   * @param report - レポート
   * @returns Markdown文字列
   */
  public exportToMarkdown(report: AvatarReport): string {
    let markdown = `# ${report.title}\n\n`;
    markdown += `**生成日時**: ${report.generatedAt.toLocaleString('ja-JP')}\n\n`;

    // エグゼクティブサマリー
    if (report.executiveSummary) {
      markdown += `## エグゼクティブサマリー\n\n${report.executiveSummary}\n\n`;
    }

    // セクション
    if (report.sections.length > 0) {
      markdown += `---\n\n`;
      for (const section of report.sections) {
        markdown += `## ${section.title}\n\n${section.content}\n\n`;
      }
    }

    // 戦略オプション
    if (report.strategicOptions && report.strategicOptions.length > 0) {
      markdown += `---\n\n## 戦略オプション\n\n`;
      for (const option of report.strategicOptions) {
        markdown += `### ${option.name} (推奨度: ${'★'.repeat(option.recommendation || 0)})\n\n`;
        markdown += `${option.description}\n\n`;
        markdown += `**メリット**:\n`;
        for (const benefit of option.benefits) {
          markdown += `- ${benefit}\n`;
        }
        markdown += `\n**デメリット・リスク**:\n`;
        for (const risk of option.risks) {
          markdown += `- ${risk}\n`;
        }
        markdown += `\n**推定コスト**: ${option.estimatedCost || '未定'}\n`;
        markdown += `**推定期間**: ${option.estimatedDuration || '未定'}\n\n`;
      }
    }

    // リスク分析
    if (report.risks && report.risks.length > 0) {
      markdown += `---\n\n## リスク分析\n\n`;
      markdown += `| リスク | 発生確率 | 影響度 | 対策 |\n`;
      markdown += `|--------|----------|--------|------|\n`;
      for (const risk of report.risks) {
        const mitigation = risk.mitigation ? risk.mitigation.join(', ') : '-';
        markdown += `| ${risk.name} | ${risk.probability} | ${risk.impact} | ${mitigation} |\n`;
      }
      markdown += `\n`;
    }

    // アクションアイテム
    if (report.actionItems && report.actionItems.length > 0) {
      markdown += `---\n\n## アクションアイテム\n\n`;
      markdown += `| # | アクション | 担当 | 優先度 | 期限 | ステータス |\n`;
      markdown += `|---|------------|------|--------|------|------------|\n`;
      let index = 1;
      for (const item of report.actionItems) {
        const deadline = item.deadline
          ? item.deadline.toLocaleDateString('ja-JP')
          : '-';
        markdown += `| ${index} | ${item.action} | ${item.owner} | ${item.priority} | ${deadline} | ${item.status} |\n`;
        index++;
      }
    }

    markdown += `\n---\n\n*このレポートはCEO Avatarにより自動生成されました*\n`;

    return markdown;
  }

  /**
   * レポートID生成
   *
   * @returns ユニークなレポートID
   */
  private generateReportId(): string {
    return `report_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * アクションアイテムID生成
   *
   * @returns ユニークなアクションアイテムID
   */
  private generateActionItemId(): string {
    return `action_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * ログ出力
   *
   * @param message - ログメッセージ
   */
  private log(message: string): void {
    console.log(`[CEOReporter] ${message}`);
  }
}
