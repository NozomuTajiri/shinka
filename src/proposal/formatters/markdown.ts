/**
 * Markdown フォーマッター
 * コンサルティング提案書を Markdown 形式に変換
 */

import type { ConsultingProposal, CoreValue } from '../../types/proposal.js';
import { writeFile } from 'fs/promises';

/**
 * 価値領域を日本語名に変換
 */
function formatCoreValue(value: CoreValue): string {
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
 * 優先度を日本語に変換
 */
function formatPriority(priority: string): string {
  const priorities: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  };
  return priorities[priority] || priority;
}

/**
 * 期間を日本語に変換
 */
function formatTimeframe(timeframe: string): string {
  const timeframes: Record<string, string> = {
    short: '短期（3-6ヶ月）',
    medium: '中期（6-12ヶ月）',
    long: '長期（12ヶ月以上）',
  };
  return timeframes[timeframe] || timeframe;
}

/**
 * 日付をフォーマット
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Markdown フォーマッター
 */
export class MarkdownFormatter {
  /**
   * 提案書を Markdown に変換
   */
  format(proposal: ConsultingProposal): string {
    const sections = [
      this.formatHeader(proposal),
      this.formatExecutiveSummary(proposal),
      this.formatCurrentState(proposal),
      this.formatIssues(proposal),
      this.formatMeasures(proposal),
      this.formatImplementationPlan(proposal),
      this.formatExpectedEffects(proposal),
      this.formatInvestmentPlan(proposal),
      this.formatAppendix(proposal),
      this.formatFooter(proposal),
    ];

    return sections.join('\n\n---\n\n');
  }

  /**
   * ヘッダー
   */
  private formatHeader(proposal: ConsultingProposal): string {
    return `# ${proposal.title}

**クライアント**: ${proposal.clientName}
**作成日**: ${formatDate(proposal.createdAt)}
**提案者**: ${proposal.consultant.name} - ${proposal.consultant.title}
**組織**: ${proposal.consultant.organization}
`;
  }

  /**
   * エグゼクティブサマリー
   */
  private formatExecutiveSummary(proposal: ConsultingProposal): string {
    const { executiveSummary } = proposal;

    return `## エグゼクティブサマリー

### 経営課題の要約

${executiveSummary.challengeSummary}

### 提案の概要

${executiveSummary.proposalOverview}

### 期待される主要な成果

${executiveSummary.keyOutcomes.map((outcome, i) => `${i + 1}. ${outcome}`).join('\n')}

### 投資とリターン

- **投資概算**: ${executiveSummary.estimatedInvestment}
- **期待ROI**: ${executiveSummary.expectedROI}
`;
  }

  /**
   * 現状分析
   */
  private formatCurrentState(proposal: ConsultingProposal): string {
    const { currentState } = proposal;

    return `## 現状分析

### 業界動向

${currentState.industryTrends}

### 企業の現状

${currentState.companyStatus}

### SWOT分析

#### 強み (Strengths)

${currentState.strengths.map((s, i) => `${i + 1}. ${s}`).join('\n')}

#### 弱み (Weaknesses)

${currentState.weaknesses.map((w, i) => `${i + 1}. ${w}`).join('\n')}

#### 機会 (Opportunities)

${currentState.opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}

#### 脅威 (Threats)

${currentState.threats.map((t, i) => `${i + 1}. ${t}`).join('\n')}
`;
  }

  /**
   * 課題一覧
   */
  private formatIssues(proposal: ConsultingProposal): string {
    const sections = proposal.issues.map((issue, index) => {
      const values = issue.affectedValues.map(formatCoreValue).join('、');

      return `### 課題 ${index + 1}: ${issue.title}

**優先度**: ${formatPriority(issue.priority)}
**影響する価値領域**: ${values}

#### 課題の詳細

${issue.description}

#### ビジネスインパクト

${issue.businessImpact}
`;
    });

    return `## 課題抽出

${sections.join('\n')}`;
  }

  /**
   * 改善施策
   */
  private formatMeasures(proposal: ConsultingProposal): string {
    const sections = proposal.measures.map((measure, index) => {
      const values = measure.relatedValues.map(formatCoreValue).join('、');
      const targetIssues = measure.targetIssueIds
        .map((id) => {
          const issue = proposal.issues.find((i) => i.id === id);
          return issue ? issue.title : id;
        })
        .join('、');

      return `### 施策 ${index + 1}: ${measure.title}

**優先度**: ${formatPriority(measure.priority)}
**実施期間**: ${formatTimeframe(measure.timeframe)}
**対象課題**: ${targetIssues}
**関連する価値領域**: ${values}

#### 施策の詳細

${measure.description}

#### 期待効果

${measure.expectedEffects.map((e, i) => `${i + 1}. ${e}`).join('\n')}

#### 必要なリソース

${measure.requiredResources.map((r, i) => `${i + 1}. ${r}`).join('\n')}

#### 成功指標 (KPI)

${measure.successMetrics.map((m, i) => `${i + 1}. ${m}`).join('\n')}
`;
    });

    return `## 改善施策

${sections.join('\n')}`;
  }

  /**
   * 実行計画
   */
  private formatImplementationPlan(proposal: ConsultingProposal): string {
    const { implementationPlan } = proposal;

    const phases = implementationPlan.phases.map((phase) => {
      return `### フェーズ ${phase.phase}: ${phase.name}

**期間**: ${phase.duration}

#### 主要な活動

${phase.activities.map((a, i) => `${i + 1}. ${a}`).join('\n')}

#### マイルストーン

${phase.milestones.map((m, i) => `${i + 1}. ${m}`).join('\n')}

#### 成果物

${phase.deliverables.map((d, i) => `${i + 1}. ${d}`).join('\n')}
`;
    });

    const risks = implementationPlan.risksAndMitigations.map((rm, i) => {
      return `${i + 1}. **リスク**: ${rm.risk}
   **対策**: ${rm.mitigation}`;
    });

    return `## 実行計画

### 全体スケジュール

${implementationPlan.overallTimeline}

${phases.join('\n')}

### 実行体制

${implementationPlan.organizationStructure}

### リスクと対策

${risks.join('\n')}
`;
  }

  /**
   * 期待効果
   */
  private formatExpectedEffects(proposal: ConsultingProposal): string {
    const { expectedEffects } = proposal;

    const quantitative = expectedEffects.quantitativeEffects.map((qe) => {
      return `| ${qe.metric} | ${qe.current} | ${qe.target} | ${qe.improvement} |`;
    });

    return `## 期待効果

### 短期的効果（6ヶ月以内）

${expectedEffects.shortTerm.map((e, i) => `${i + 1}. ${e}`).join('\n')}

### 中期的効果（1年以内）

${expectedEffects.mediumTerm.map((e, i) => `${i + 1}. ${e}`).join('\n')}

### 長期的効果（1年以上）

${expectedEffects.longTerm.map((e, i) => `${i + 1}. ${e}`).join('\n')}

### 定量的効果

| 指標 | 現状 | 目標 | 改善率 |
|------|------|------|--------|
${quantitative.join('\n')}
`;
  }

  /**
   * 投資計画
   */
  private formatInvestmentPlan(proposal: ConsultingProposal): string {
    const { investmentPlan } = proposal;

    const initialBreakdown = investmentPlan.initialInvestment.breakdown.map(
      (item) => `| ${item.item} | ${item.cost} |`
    );

    const operationalBreakdown = investmentPlan.operationalCost.breakdown.map(
      (item) => `| ${item.item} | ${item.cost} |`
    );

    return `## 投資計画

### 初期投資

${investmentPlan.initialInvestment.description}

**総額**: ${investmentPlan.initialInvestment.amount}

| 項目 | 金額 |
|------|------|
${initialBreakdown.join('\n')}

### 運用コスト（年間）

${investmentPlan.operationalCost.description}

**総額**: ${investmentPlan.operationalCost.amount}

| 項目 | 金額 |
|------|------|
${operationalBreakdown.join('\n')}

### ROI試算

- **1年目**: ${investmentPlan.roiProjection.year1}
- **2年目**: ${investmentPlan.roiProjection.year2}
- **3年目**: ${investmentPlan.roiProjection.year3}
`;
  }

  /**
   * 付録
   */
  private formatAppendix(proposal: ConsultingProposal): string {
    if (!proposal.appendix) {
      return '';
    }

    return `## 付録・補足資料

${proposal.appendix}
`;
  }

  /**
   * フッター
   */
  private formatFooter(proposal: ConsultingProposal): string {
    return `---

**提案書ID**: ${proposal.id}
**作成日時**: ${proposal.createdAt.toISOString()}

本提案書は価値主義経営®のフレームワークに基づいて作成されています。
`;
  }

  /**
   * ファイルに保存
   */
  async saveToFile(proposal: ConsultingProposal, filepath: string): Promise<void> {
    const markdown = this.format(proposal);
    await writeFile(filepath, markdown, 'utf-8');
  }
}

/**
 * ファクトリー関数
 */
export function createMarkdownFormatter(): MarkdownFormatter {
  return new MarkdownFormatter();
}
