/**
 * PDF フォーマッター
 * コンサルティング提案書を PDF 形式に変換
 * jsPDF を使用
 */

import { jsPDF } from 'jspdf';
import type { ConsultingProposal, CoreValue } from '../../types/proposal.js';
import { writeFile } from 'fs/promises';

/**
 * PDF フォーマットオプション
 */
export interface PDFFormatOptions {
  /** ページサイズ（デフォルト: A4） */
  pageSize?: 'A4' | 'Letter';
  /** マージン（デフォルト: 20） */
  margin?: number;
  /** フォントサイズ（デフォルト: 11） */
  fontSize?: number;
}

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
 * PDF フォーマッター
 */
export class PDFFormatter {
  private options: Required<PDFFormatOptions>;

  constructor(options: PDFFormatOptions = {}) {
    this.options = {
      pageSize: options.pageSize || 'A4',
      margin: options.margin || 20,
      fontSize: options.fontSize || 11,
    };
  }

  /**
   * 提案書を PDF に変換
   */
  format(proposal: ConsultingProposal): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: this.options.pageSize === 'A4' ? 'a4' : 'letter',
    });

    let y = this.options.margin;

    // タイトルページ
    y = this.addTitlePage(doc, proposal, y);

    // 目次（オプション）
    // y = this.addTableOfContents(doc, y);

    // エグゼクティブサマリー
    y = this.addExecutiveSummary(doc, proposal, y);

    // 現状分析
    y = this.addCurrentState(doc, proposal, y);

    // 課題抽出
    y = this.addIssues(doc, proposal, y);

    // 改善施策
    y = this.addMeasures(doc, proposal, y);

    // 実行計画
    y = this.addImplementationPlan(doc, proposal, y);

    // 期待効果
    y = this.addExpectedEffects(doc, proposal, y);

    // 投資計画
    y = this.addInvestmentPlan(doc, proposal, y);

    // 付録
    if (proposal.appendix) {
      y = this.addAppendix(doc, proposal, y);
    }

    return doc;
  }

  /**
   * タイトルページ
   */
  private addTitlePage(doc: jsPDF, proposal: ConsultingProposal, y: number): number {
    const pageWidth = doc.internal.pageSize.getWidth();
    const centerX = pageWidth / 2;

    // タイトル
    doc.setFontSize(24);
    doc.text(proposal.title, centerX, y + 50, { align: 'center' });

    // クライアント名
    doc.setFontSize(16);
    doc.text(proposal.clientName, centerX, y + 70, { align: 'center' });

    // 作成日
    doc.setFontSize(12);
    doc.text(
      `作成日: ${proposal.createdAt.toLocaleDateString('ja-JP')}`,
      centerX,
      y + 90,
      { align: 'center' }
    );

    // 提案者情報
    doc.setFontSize(11);
    doc.text(
      `${proposal.consultant.name} - ${proposal.consultant.title}`,
      centerX,
      y + 110,
      { align: 'center' }
    );
    doc.text(proposal.consultant.organization, centerX, y + 120, {
      align: 'center',
    });

    doc.addPage();
    return this.options.margin;
  }

  /**
   * エグゼクティブサマリー
   */
  private addExecutiveSummary(
    doc: jsPDF,
    proposal: ConsultingProposal,
    y: number
  ): number {
    const { executiveSummary } = proposal;

    y = this.addHeading(doc, 'エグゼクティブサマリー', y, 1);

    y = this.addSubheading(doc, '経営課題の要約', y);
    y = this.addParagraph(doc, executiveSummary.challengeSummary, y);

    y = this.addSubheading(doc, '提案の概要', y);
    y = this.addParagraph(doc, executiveSummary.proposalOverview, y);

    y = this.addSubheading(doc, '期待される主要な成果', y);
    y = this.addList(doc, executiveSummary.keyOutcomes, y);

    y = this.addSubheading(doc, '投資とリターン', y);
    y = this.addParagraph(
      doc,
      `投資概算: ${executiveSummary.estimatedInvestment}\n期待ROI: ${executiveSummary.expectedROI}`,
      y
    );

    return y;
  }

  /**
   * 現状分析
   */
  private addCurrentState(
    doc: jsPDF,
    proposal: ConsultingProposal,
    y: number
  ): number {
    const { currentState } = proposal;

    y = this.addHeading(doc, '現状分析', y, 1);

    y = this.addSubheading(doc, '業界動向', y);
    y = this.addParagraph(doc, currentState.industryTrends, y);

    y = this.addSubheading(doc, '企業の現状', y);
    y = this.addParagraph(doc, currentState.companyStatus, y);

    y = this.addSubheading(doc, 'SWOT分析', y);

    y = this.addParagraph(doc, '強み (Strengths):', y);
    y = this.addList(doc, currentState.strengths, y);

    y = this.addParagraph(doc, '弱み (Weaknesses):', y);
    y = this.addList(doc, currentState.weaknesses, y);

    y = this.addParagraph(doc, '機会 (Opportunities):', y);
    y = this.addList(doc, currentState.opportunities, y);

    y = this.addParagraph(doc, '脅威 (Threats):', y);
    y = this.addList(doc, currentState.threats, y);

    return y;
  }

  /**
   * 課題抽出
   */
  private addIssues(doc: jsPDF, proposal: ConsultingProposal, y: number): number {
    y = this.addHeading(doc, '課題抽出', y, 1);

    for (let i = 0; i < proposal.issues.length; i++) {
      const issue = proposal.issues[i];

      y = this.addSubheading(doc, `課題 ${i + 1}: ${issue.title}`, y);

      const values = issue.affectedValues.map(formatCoreValue).join('、');
      y = this.addParagraph(
        doc,
        `優先度: ${formatPriority(issue.priority)}\n影響する価値領域: ${values}`,
        y
      );

      y = this.addParagraph(doc, issue.description, y);
      y = this.addParagraph(doc, `ビジネスインパクト: ${issue.businessImpact}`, y);
    }

    return y;
  }

  /**
   * 改善施策
   */
  private addMeasures(doc: jsPDF, proposal: ConsultingProposal, y: number): number {
    y = this.addHeading(doc, '改善施策', y, 1);

    for (let i = 0; i < proposal.measures.length; i++) {
      const measure = proposal.measures[i];

      y = this.addSubheading(doc, `施策 ${i + 1}: ${measure.title}`, y);

      const values = measure.relatedValues.map(formatCoreValue).join('、');
      y = this.addParagraph(
        doc,
        `優先度: ${formatPriority(measure.priority)}\n実施期間: ${formatTimeframe(measure.timeframe)}\n関連する価値領域: ${values}`,
        y
      );

      y = this.addParagraph(doc, measure.description, y);

      y = this.addParagraph(doc, '期待効果:', y);
      y = this.addList(doc, measure.expectedEffects, y);

      y = this.addParagraph(doc, '必要なリソース:', y);
      y = this.addList(doc, measure.requiredResources, y);

      y = this.addParagraph(doc, '成功指標 (KPI):', y);
      y = this.addList(doc, measure.successMetrics, y);
    }

    return y;
  }

  /**
   * 実行計画
   */
  private addImplementationPlan(
    doc: jsPDF,
    proposal: ConsultingProposal,
    y: number
  ): number {
    const { implementationPlan } = proposal;

    y = this.addHeading(doc, '実行計画', y, 1);

    y = this.addSubheading(doc, '全体スケジュール', y);
    y = this.addParagraph(doc, implementationPlan.overallTimeline, y);

    for (const phase of implementationPlan.phases) {
      y = this.addSubheading(doc, `フェーズ ${phase.phase}: ${phase.name}`, y);
      y = this.addParagraph(doc, `期間: ${phase.duration}`, y);

      y = this.addParagraph(doc, '主要な活動:', y);
      y = this.addList(doc, phase.activities, y);

      y = this.addParagraph(doc, 'マイルストーン:', y);
      y = this.addList(doc, phase.milestones, y);

      y = this.addParagraph(doc, '成果物:', y);
      y = this.addList(doc, phase.deliverables, y);
    }

    y = this.addSubheading(doc, '実行体制', y);
    y = this.addParagraph(doc, implementationPlan.organizationStructure, y);

    y = this.addSubheading(doc, 'リスクと対策', y);
    for (const rm of implementationPlan.risksAndMitigations) {
      y = this.addParagraph(doc, `リスク: ${rm.risk}\n対策: ${rm.mitigation}`, y);
    }

    return y;
  }

  /**
   * 期待効果
   */
  private addExpectedEffects(
    doc: jsPDF,
    proposal: ConsultingProposal,
    y: number
  ): number {
    const { expectedEffects } = proposal;

    y = this.addHeading(doc, '期待効果', y, 1);

    y = this.addSubheading(doc, '短期的効果（6ヶ月以内）', y);
    y = this.addList(doc, expectedEffects.shortTerm, y);

    y = this.addSubheading(doc, '中期的効果（1年以内）', y);
    y = this.addList(doc, expectedEffects.mediumTerm, y);

    y = this.addSubheading(doc, '長期的効果（1年以上）', y);
    y = this.addList(doc, expectedEffects.longTerm, y);

    y = this.addSubheading(doc, '定量的効果', y);
    for (const qe of expectedEffects.quantitativeEffects) {
      y = this.addParagraph(
        doc,
        `${qe.metric}: ${qe.current} → ${qe.target} (${qe.improvement})`,
        y
      );
    }

    return y;
  }

  /**
   * 投資計画
   */
  private addInvestmentPlan(
    doc: jsPDF,
    proposal: ConsultingProposal,
    y: number
  ): number {
    const { investmentPlan } = proposal;

    y = this.addHeading(doc, '投資計画', y, 1);

    y = this.addSubheading(doc, '初期投資', y);
    y = this.addParagraph(
      doc,
      `${investmentPlan.initialInvestment.description}\n総額: ${investmentPlan.initialInvestment.amount}`,
      y
    );
    for (const item of investmentPlan.initialInvestment.breakdown) {
      y = this.addParagraph(doc, `  ${item.item}: ${item.cost}`, y);
    }

    y = this.addSubheading(doc, '運用コスト（年間）', y);
    y = this.addParagraph(
      doc,
      `${investmentPlan.operationalCost.description}\n総額: ${investmentPlan.operationalCost.amount}`,
      y
    );
    for (const item of investmentPlan.operationalCost.breakdown) {
      y = this.addParagraph(doc, `  ${item.item}: ${item.cost}`, y);
    }

    y = this.addSubheading(doc, 'ROI試算', y);
    y = this.addParagraph(
      doc,
      `1年目: ${investmentPlan.roiProjection.year1}\n2年目: ${investmentPlan.roiProjection.year2}\n3年目: ${investmentPlan.roiProjection.year3}`,
      y
    );

    return y;
  }

  /**
   * 付録
   */
  private addAppendix(doc: jsPDF, proposal: ConsultingProposal, y: number): number {
    y = this.addHeading(doc, '付録・補足資料', y, 1);
    y = this.addParagraph(doc, proposal.appendix!, y);
    return y;
  }

  /**
   * 見出しを追加
   */
  private addHeading(
    doc: jsPDF,
    text: string,
    y: number,
    level: number = 1
  ): number {
    const fontSize = level === 1 ? 16 : 14;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');

    y = this.checkPageBreak(doc, y, fontSize * 0.5);
    doc.text(text, this.options.margin, y);
    doc.setFont('helvetica', 'normal');

    return y + fontSize * 0.5 + 5;
  }

  /**
   * サブ見出しを追加
   */
  private addSubheading(doc: jsPDF, text: string, y: number): number {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');

    y = this.checkPageBreak(doc, y, 12 * 0.5);
    doc.text(text, this.options.margin, y);
    doc.setFont('helvetica', 'normal');

    return y + 12 * 0.5 + 3;
  }

  /**
   * 段落を追加
   */
  private addParagraph(doc: jsPDF, text: string, y: number): number {
    doc.setFontSize(this.options.fontSize);

    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - this.options.margin * 2;

    // テキストを行に分割
    const lines = doc.splitTextToSize(text, maxWidth);

    for (const line of lines) {
      y = this.checkPageBreak(doc, y, this.options.fontSize * 0.5);
      doc.text(line, this.options.margin, y);
      y += this.options.fontSize * 0.5;
    }

    return y + 5;
  }

  /**
   * リストを追加
   */
  private addList(doc: jsPDF, items: string[], y: number): number {
    doc.setFontSize(this.options.fontSize);

    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - this.options.margin * 2 - 5;

    for (let i = 0; i < items.length; i++) {
      const bullet = `${i + 1}. `;
      const lines = doc.splitTextToSize(items[i], maxWidth);

      y = this.checkPageBreak(doc, y, this.options.fontSize * 0.5);
      doc.text(bullet, this.options.margin, y);
      doc.text(lines[0], this.options.margin + 5, y);
      y += this.options.fontSize * 0.5;

      // 複数行の場合
      for (let j = 1; j < lines.length; j++) {
        y = this.checkPageBreak(doc, y, this.options.fontSize * 0.5);
        doc.text(lines[j], this.options.margin + 5, y);
        y += this.options.fontSize * 0.5;
      }
    }

    return y + 3;
  }

  /**
   * ページ区切りをチェック
   */
  private checkPageBreak(doc: jsPDF, y: number, lineHeight: number): number {
    const pageHeight = doc.internal.pageSize.getHeight();
    const bottomMargin = this.options.margin;

    if (y + lineHeight > pageHeight - bottomMargin) {
      doc.addPage();
      return this.options.margin;
    }

    return y;
  }

  /**
   * ファイルに保存
   */
  async saveToFile(proposal: ConsultingProposal, filepath: string): Promise<void> {
    const pdf = this.format(proposal);
    const buffer = pdf.output('arraybuffer');
    await writeFile(filepath, Buffer.from(buffer));
  }
}

/**
 * ファクトリー関数
 */
export function createPDFFormatter(options?: PDFFormatOptions): PDFFormatter {
  return new PDFFormatter(options);
}
