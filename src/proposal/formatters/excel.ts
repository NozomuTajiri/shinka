/**
 * Excel フォーマッター
 * コンサルティング提案書を Excel 形式に変換
 * exceljs を使用
 */

import ExcelJS from 'exceljs';
import type { ConsultingProposal, CoreValue } from '../../types/proposal.js';
import { writeFile as _writeFile } from 'fs/promises';

/**
 * Excel フォーマットオプション
 */
export interface ExcelFormatOptions {
  /** シート名のカスタマイズ */
  sheetNames?: {
    summary?: string;
    analysis?: string;
    measures?: string;
    implementation?: string;
  };
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
    short: '短期',
    medium: '中期',
    long: '長期',
  };
  return timeframes[timeframe] || timeframe;
}

/**
 * Excel フォーマッター
 */
export class ExcelFormatter {
  private options: ExcelFormatOptions;

  constructor(options: ExcelFormatOptions = {}) {
    this.options = {
      sheetNames: {
        summary: options.sheetNames?.summary || 'サマリー',
        analysis: options.sheetNames?.analysis || '現状分析',
        measures: options.sheetNames?.measures || '改善施策',
        implementation: options.sheetNames?.implementation || '実行計画',
      },
    };
  }

  /**
   * 提案書を Excel に変換
   */
  async format(proposal: ConsultingProposal): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();

    // ワークブックのプロパティ設定
    workbook.creator = proposal.consultant.name;
    workbook.created = proposal.createdAt;
    workbook.modified = new Date();
    workbook.subject = proposal.title;

    // 各シートを作成
    await this.addSummarySheet(workbook, proposal);
    await this.addAnalysisSheet(workbook, proposal);
    await this.addMeasuresSheet(workbook, proposal);
    await this.addImplementationSheet(workbook, proposal);

    return workbook;
  }

  /**
   * サマリーシート
   */
  private async addSummarySheet(
    workbook: ExcelJS.Workbook,
    proposal: ConsultingProposal
  ): Promise<void> {
    const sheet = workbook.addWorksheet(this.options.sheetNames!.summary!);

    // 列幅設定
    sheet.columns = [
      { width: 20 },
      { width: 60 },
    ];

    let row = 1;

    // タイトル
    sheet.mergeCells(`A${row}:B${row}`);
    const titleCell = sheet.getCell(`A${row}`);
    titleCell.value = proposal.title;
    this.styleHeaderCell(titleCell, 18);
    row += 2;

    // 基本情報
    this.addKeyValue(sheet, row++, 'クライアント', proposal.clientName);
    this.addKeyValue(
      sheet,
      row++,
      '作成日',
      proposal.createdAt.toLocaleDateString('ja-JP')
    );
    this.addKeyValue(sheet, row++, '提案者', proposal.consultant.name);
    this.addKeyValue(sheet, row++, '組織', proposal.consultant.organization);
    row += 2;

    // エグゼクティブサマリー
    this.addSectionHeader(sheet, row++, 'エグゼクティブサマリー');

    this.addKeyValue(
      sheet,
      row++,
      '経営課題',
      proposal.executiveSummary.challengeSummary
    );
    this.addKeyValue(
      sheet,
      row++,
      '提案概要',
      proposal.executiveSummary.proposalOverview
    );
    this.addKeyValue(
      sheet,
      row++,
      '投資概算',
      proposal.executiveSummary.estimatedInvestment
    );
    this.addKeyValue(
      sheet,
      row++,
      '期待ROI',
      proposal.executiveSummary.expectedROI
    );
    row += 1;

    // 主要成果
    this.addSubHeader(sheet, row++, '期待される主要な成果');
    for (const outcome of proposal.executiveSummary.keyOutcomes) {
      this.addKeyValue(sheet, row++, '', outcome);
    }
    row += 2;

    // 課題サマリー
    this.addSectionHeader(sheet, row++, '主要課題');
    for (let i = 0; i < proposal.issues.length; i++) {
      const issue = proposal.issues[i];
      this.addKeyValue(
        sheet,
        row++,
        `課題${i + 1}`,
        `${issue.title} [${formatPriority(issue.priority)}]`
      );
    }
    row += 2;

    // 施策サマリー
    this.addSectionHeader(sheet, row++, '改善施策');
    for (let i = 0; i < proposal.measures.length; i++) {
      const measure = proposal.measures[i];
      this.addKeyValue(
        sheet,
        row++,
        `施策${i + 1}`,
        `${measure.title} [${formatPriority(measure.priority)}/${formatTimeframe(measure.timeframe)}]`
      );
    }
  }

  /**
   * 現状分析シート
   */
  private async addAnalysisSheet(
    workbook: ExcelJS.Workbook,
    proposal: ConsultingProposal
  ): Promise<void> {
    const sheet = workbook.addWorksheet(this.options.sheetNames!.analysis!);

    sheet.columns = [
      { width: 20 },
      { width: 60 },
    ];

    let row = 1;

    this.addSectionHeader(sheet, row++, '現状分析');
    row += 1;

    // 業界動向
    this.addSubHeader(sheet, row++, '業界動向');
    this.addKeyValue(sheet, row++, '', proposal.currentState.industryTrends);
    row += 1;

    // 企業の現状
    this.addSubHeader(sheet, row++, '企業の現状');
    this.addKeyValue(sheet, row++, '', proposal.currentState.companyStatus);
    row += 2;

    // SWOT分析
    this.addSectionHeader(sheet, row++, 'SWOT分析');
    row += 1;

    this.addSubHeader(sheet, row++, '強み (Strengths)');
    for (const s of proposal.currentState.strengths) {
      this.addKeyValue(sheet, row++, '', s);
    }
    row += 1;

    this.addSubHeader(sheet, row++, '弱み (Weaknesses)');
    for (const w of proposal.currentState.weaknesses) {
      this.addKeyValue(sheet, row++, '', w);
    }
    row += 1;

    this.addSubHeader(sheet, row++, '機会 (Opportunities)');
    for (const o of proposal.currentState.opportunities) {
      this.addKeyValue(sheet, row++, '', o);
    }
    row += 1;

    this.addSubHeader(sheet, row++, '脅威 (Threats)');
    for (const t of proposal.currentState.threats) {
      this.addKeyValue(sheet, row++, '', t);
    }
    row += 2;

    // 課題詳細
    this.addSectionHeader(sheet, row++, '課題詳細');
    row += 1;

    for (let i = 0; i < proposal.issues.length; i++) {
      const issue = proposal.issues[i];

      this.addSubHeader(sheet, row++, `課題${i + 1}: ${issue.title}`);
      this.addKeyValue(sheet, row++, '優先度', formatPriority(issue.priority));
      this.addKeyValue(
        sheet,
        row++,
        '影響する価値',
        issue.affectedValues.map(formatCoreValue).join('、')
      );
      this.addKeyValue(sheet, row++, '詳細', issue.description);
      this.addKeyValue(sheet, row++, 'ビジネスインパクト', issue.businessImpact);
      row += 1;
    }
  }

  /**
   * 改善施策シート
   */
  private async addMeasuresSheet(
    workbook: ExcelJS.Workbook,
    proposal: ConsultingProposal
  ): Promise<void> {
    const sheet = workbook.addWorksheet(this.options.sheetNames!.measures!);

    // ヘッダー行
    const headers = [
      'No.',
      '施策名',
      '優先度',
      '期間',
      '対象課題',
      '関連価値',
      '詳細',
      '期待効果',
      '必要リソース',
      'KPI',
    ];

    sheet.columns = headers.map(() => ({ width: 15 }));
    sheet.getColumn(2).width = 30; // 施策名
    sheet.getColumn(7).width = 40; // 詳細

    // ヘッダー行を追加
    const headerRow = sheet.addRow(headers);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    headerRow.font = { ...headerRow.font, color: { argb: 'FFFFFFFF' } };

    // データ行を追加
    for (let i = 0; i < proposal.measures.length; i++) {
      const measure = proposal.measures[i];

      const targetIssues = measure.targetIssueIds
        .map((id) => {
          const issue = proposal.issues.find((iss) => iss.id === id);
          return issue ? issue.title : id;
        })
        .join('\n');

      const row = sheet.addRow([
        i + 1,
        measure.title,
        formatPriority(measure.priority),
        formatTimeframe(measure.timeframe),
        targetIssues,
        measure.relatedValues.map(formatCoreValue).join('\n'),
        measure.description,
        measure.expectedEffects.join('\n'),
        measure.requiredResources.join('\n'),
        measure.successMetrics.join('\n'),
      ]);

      row.alignment = { vertical: 'top', wrapText: true };
      row.height = Math.max(
        20,
        Math.max(
          measure.expectedEffects.length,
          measure.requiredResources.length,
          measure.successMetrics.length
        ) * 15
      );
    }

    // フィルターを有効化
    sheet.autoFilter = {
      from: 'A1',
      to: `J${proposal.measures.length + 1}`,
    };
  }

  /**
   * 実行計画シート
   */
  private async addImplementationSheet(
    workbook: ExcelJS.Workbook,
    proposal: ConsultingProposal
  ): Promise<void> {
    const sheet = workbook.addWorksheet(this.options.sheetNames!.implementation!);

    sheet.columns = [
      { width: 20 },
      { width: 60 },
    ];

    let row = 1;

    this.addSectionHeader(sheet, row++, '実行計画');
    row += 1;

    // 全体スケジュール
    this.addSubHeader(sheet, row++, '全体スケジュール');
    this.addKeyValue(sheet, row++, '', proposal.implementationPlan.overallTimeline);
    row += 2;

    // フェーズ詳細
    this.addSectionHeader(sheet, row++, 'フェーズ詳細');
    row += 1;

    for (const phase of proposal.implementationPlan.phases) {
      this.addSubHeader(sheet, row++, `フェーズ${phase.phase}: ${phase.name}`);
      this.addKeyValue(sheet, row++, '期間', phase.duration);

      this.addKeyValue(sheet, row++, '主要な活動', '');
      for (const activity of phase.activities) {
        this.addKeyValue(sheet, row++, '', `- ${activity}`);
      }

      this.addKeyValue(sheet, row++, 'マイルストーン', '');
      for (const milestone of phase.milestones) {
        this.addKeyValue(sheet, row++, '', `- ${milestone}`);
      }

      this.addKeyValue(sheet, row++, '成果物', '');
      for (const deliverable of phase.deliverables) {
        this.addKeyValue(sheet, row++, '', `- ${deliverable}`);
      }

      row += 1;
    }

    // 実行体制
    this.addSectionHeader(sheet, row++, '実行体制');
    this.addKeyValue(
      sheet,
      row++,
      '',
      proposal.implementationPlan.organizationStructure
    );
    row += 2;

    // リスクと対策
    this.addSectionHeader(sheet, row++, 'リスクと対策');
    row += 1;

    for (const rm of proposal.implementationPlan.risksAndMitigations) {
      this.addKeyValue(sheet, row++, 'リスク', rm.risk);
      this.addKeyValue(sheet, row++, '対策', rm.mitigation);
      row += 1;
    }

    row += 2;

    // 期待効果
    this.addSectionHeader(sheet, row++, '期待効果');
    row += 1;

    this.addSubHeader(sheet, row++, '短期的効果（6ヶ月以内）');
    for (const effect of proposal.expectedEffects.shortTerm) {
      this.addKeyValue(sheet, row++, '', effect);
    }
    row += 1;

    this.addSubHeader(sheet, row++, '中期的効果（1年以内）');
    for (const effect of proposal.expectedEffects.mediumTerm) {
      this.addKeyValue(sheet, row++, '', effect);
    }
    row += 1;

    this.addSubHeader(sheet, row++, '長期的効果（1年以上）');
    for (const effect of proposal.expectedEffects.longTerm) {
      this.addKeyValue(sheet, row++, '', effect);
    }
    row += 2;

    // 定量効果テーブル
    this.addSectionHeader(sheet, row++, '定量的効果');

    const tableHeaders = ['指標', '現状', '目標', '改善率'];
    const tableHeaderRow = sheet.addRow(tableHeaders);
    tableHeaderRow.font = { bold: true };
    tableHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };

    for (const qe of proposal.expectedEffects.quantitativeEffects) {
      sheet.addRow([qe.metric, qe.current, qe.target, qe.improvement]);
    }

    row += proposal.expectedEffects.quantitativeEffects.length + 3;

    // 投資計画
    this.addSectionHeader(sheet, row++, '投資計画');
    row += 1;

    this.addSubHeader(sheet, row++, '初期投資');
    this.addKeyValue(
      sheet,
      row++,
      '総額',
      proposal.investmentPlan.initialInvestment.amount
    );
    for (const item of proposal.investmentPlan.initialInvestment.breakdown) {
      this.addKeyValue(sheet, row++, item.item, item.cost);
    }
    row += 1;

    this.addSubHeader(sheet, row++, '運用コスト（年間）');
    this.addKeyValue(
      sheet,
      row++,
      '総額',
      proposal.investmentPlan.operationalCost.amount
    );
    for (const item of proposal.investmentPlan.operationalCost.breakdown) {
      this.addKeyValue(sheet, row++, item.item, item.cost);
    }
    row += 2;

    this.addSubHeader(sheet, row++, 'ROI試算');
    this.addKeyValue(sheet, row++, '1年目', proposal.investmentPlan.roiProjection.year1);
    this.addKeyValue(sheet, row++, '2年目', proposal.investmentPlan.roiProjection.year2);
    this.addKeyValue(sheet, row++, '3年目', proposal.investmentPlan.roiProjection.year3);
  }

  /**
   * セクションヘッダーを追加
   */
  private addSectionHeader(sheet: ExcelJS.Worksheet, row: number, text: string): void {
    sheet.mergeCells(`A${row}:B${row}`);
    const cell = sheet.getCell(`A${row}`);
    cell.value = text;
    this.styleHeaderCell(cell, 14);
  }

  /**
   * サブヘッダーを追加
   */
  private addSubHeader(sheet: ExcelJS.Worksheet, row: number, text: string): void {
    sheet.mergeCells(`A${row}:B${row}`);
    const cell = sheet.getCell(`A${row}`);
    cell.value = text;
    cell.font = { bold: true, size: 12 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE7E6E6' },
    };
  }

  /**
   * キー・バリューペアを追加
   */
  private addKeyValue(
    sheet: ExcelJS.Worksheet,
    row: number,
    key: string,
    value: string
  ): void {
    const keyCell = sheet.getCell(`A${row}`);
    const valueCell = sheet.getCell(`B${row}`);

    keyCell.value = key;
    valueCell.value = value;

    if (key) {
      keyCell.font = { bold: true };
    }

    valueCell.alignment = { wrapText: true, vertical: 'top' };
  }

  /**
   * ヘッダーセルのスタイル設定
   */
  private styleHeaderCell(cell: ExcelJS.Cell, fontSize: number): void {
    cell.font = { bold: true, size: fontSize };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };
    cell.font = { ...cell.font, color: { argb: 'FFFFFFFF' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  }

  /**
   * ファイルに保存
   */
  async saveToFile(proposal: ConsultingProposal, filepath: string): Promise<void> {
    const workbook = await this.format(proposal);
    await workbook.xlsx.writeFile(filepath);
  }
}

/**
 * ファクトリー関数
 */
export function createExcelFormatter(options?: ExcelFormatOptions): ExcelFormatter {
  return new ExcelFormatter(options);
}
