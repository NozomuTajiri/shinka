/**
 * 統合財務諸表パーサー
 *
 * ファイル形式を自動判定し、適切なパーサーを選択して実行します。
 * チャンク処理、エラーハンドリング、パフォーマンス最適化を実装。
 */

import path from 'path';
import fs from 'fs/promises';
import type { ParserOptions, ParserResult, ParsedStatement } from '../types/financial.js';
import { parsePdf } from './pdf-parser.js';
import { parseExcel } from './excel-parser.js';
import { parseCsv } from './csv-parser.js';

/**
 * サポートされているファイル形式
 */
export type SupportedFormat = 'pdf' | 'excel' | 'csv';

/**
 * ファイル形式を自動判定
 *
 * @param filePath - ファイルパス
 * @returns ファイル形式
 */
export async function detectFileFormat(filePath: string): Promise<SupportedFormat> {
  const ext = path.extname(filePath).toLowerCase();

  // 拡張子から判定
  if (ext === '.pdf') {
    return 'pdf';
  } else if (ext === '.xlsx' || ext === '.xls') {
    return 'excel';
  } else if (ext === '.csv') {
    return 'csv';
  }

  // 拡張子が不明な場合はファイルヘッダーから判定
  const buffer = await fs.readFile(filePath);
  const header = buffer.slice(0, 8);

  // PDFマジックナンバー: %PDF
  if (header.toString('utf8', 0, 4) === '%PDF') {
    return 'pdf';
  }

  // Excelマジックナンバー: PK（ZIP形式）
  if (header[0] === 0x50 && header[1] === 0x4b) {
    return 'excel';
  }

  // デフォルトはCSV
  return 'csv';
}

/**
 * ファイルサイズを取得
 *
 * @param filePath - ファイルパス
 * @returns ファイルサイズ（バイト）
 */
export async function getFileSize(filePath: string): Promise<number> {
  const stats = await fs.stat(filePath);
  return stats.size;
}

/**
 * 財務諸表をパース（統合インターフェース）
 *
 * @param filePath - ファイルパス
 * @param options - パーサーオプション
 * @returns パーサー結果
 */
export async function parseStatement(
  filePath: string,
  options: ParserOptions = {}
): Promise<ParserResult> {
  const startTime = Date.now();

  try {
    // ファイル存在チェック
    await fs.access(filePath);

    // ファイルサイズをチェック
    const fileSize = await getFileSize(filePath);
    const maxSize = 100 * 1024 * 1024; // 100MB制限

    if (fileSize > maxSize) {
      throw new Error(
        `ファイルサイズが大きすぎます: ${(fileSize / 1024 / 1024).toFixed(2)}MB（最大${maxSize / 1024 / 1024}MB）`
      );
    }

    if (options.debug) {
      console.log(`[StatementParser] File: ${filePath}`);
      console.log(`[StatementParser] Size: ${(fileSize / 1024).toFixed(2)}KB`);
    }

    // ファイル形式を判定
    const format = await detectFileFormat(filePath);

    if (options.debug) {
      console.log(`[StatementParser] Detected format: ${format}`);
    }

    // チャンクサイズを設定（大きいファイルの場合）
    if (!options.chunkSize && fileSize > 10 * 1024 * 1024) {
      options.chunkSize = 5 * 1024 * 1024; // 5MB chunks
      options.streaming = true;
    }

    // 形式に応じたパーサーを実行
    let data: ParsedStatement;

    switch (format) {
      case 'pdf':
        data = await parsePdf(filePath, options);
        break;
      case 'excel':
        data = await parseExcel(filePath, options);
        break;
      case 'csv':
        data = await parseCsv(filePath, options);
        break;
      default:
        throw new Error(`サポートされていないファイル形式: ${format}`);
    }

    const duration = Date.now() - startTime;

    if (options.debug) {
      console.log(`[StatementParser] Total parse time: ${duration}ms`);
    }

    return {
      success: true,
      data,
      duration,
      warnings: data.metadata.warnings,
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = (error as Error).message;

    if (options.debug) {
      console.error(`[StatementParser] Error: ${errorMessage}`);
    }

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }
}

/**
 * 複数ファイルをバッチパース
 *
 * @param filePaths - ファイルパス配列
 * @param options - パーサーオプション
 * @returns パーサー結果配列
 */
export async function parseStatements(
  filePaths: string[],
  options: ParserOptions = {}
): Promise<ParserResult[]> {
  const results: ParserResult[] = [];

  // 並列実行数を制限（メモリ消費を抑制）
  const concurrency = 3;
  const chunks: string[][] = [];

  for (let i = 0; i < filePaths.length; i += concurrency) {
    chunks.push(filePaths.slice(i, i + concurrency));
  }

  for (const chunk of chunks) {
    const chunkResults = await Promise.all(
      chunk.map((filePath) => parseStatement(filePath, options))
    );
    results.push(...chunkResults);
  }

  return results;
}

/**
 * パース結果をJSON形式で出力
 *
 * @param result - パーサー結果
 * @param outputPath - 出力ファイルパス
 */
export async function exportToJson(
  result: ParserResult,
  outputPath: string
): Promise<void> {
  if (!result.success || !result.data) {
    throw new Error('パース結果が不正です');
  }

  // Date型をISO文字列に変換
  const serialized = JSON.stringify(
    result.data,
    (key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    },
    2
  );

  await fs.writeFile(outputPath, serialized, 'utf8');
}

/**
 * パース結果の統計情報を取得
 *
 * @param result - パーサー結果
 * @returns 統計情報
 */
export function getStatistics(result: ParserResult): {
  success: boolean;
  duration: number;
  warningCount: number;
  hasBalanceSheet: boolean;
  hasIncomeStatement: boolean;
  hasCashFlowStatement: boolean;
  totalAccounts: number;
} {
  if (!result.success || !result.data) {
    return {
      success: false,
      duration: result.duration || 0,
      warningCount: result.warnings?.length || 0,
      hasBalanceSheet: false,
      hasIncomeStatement: false,
      hasCashFlowStatement: false,
      totalAccounts: 0,
    };
  }

  const data = result.data;

  // 勘定科目数をカウント
  let totalAccounts = 0;

  if (data.balanceSheet) {
    totalAccounts +=
      data.balanceSheet.assets.currentAssets.length +
      data.balanceSheet.assets.fixedAssets.length +
      data.balanceSheet.liabilities.currentLiabilities.length +
      data.balanceSheet.liabilities.fixedLiabilities.length +
      data.balanceSheet.equity.shareholdersEquity.length;
  }

  if (data.incomeStatement) {
    totalAccounts +=
      data.incomeStatement.revenue.length +
      data.incomeStatement.costOfSales.length +
      data.incomeStatement.sellingGeneralAndAdministrativeExpenses.length;
  }

  if (data.cashFlowStatement) {
    totalAccounts +=
      data.cashFlowStatement.operatingActivities.items.length +
      data.cashFlowStatement.investingActivities.items.length +
      data.cashFlowStatement.financingActivities.items.length;
  }

  return {
    success: true,
    duration: result.duration || 0,
    warningCount: result.warnings?.length || 0,
    hasBalanceSheet: !!data.balanceSheet,
    hasIncomeStatement: !!data.incomeStatement,
    hasCashFlowStatement: !!data.cashFlowStatement,
    totalAccounts,
  };
}

/**
 * パース結果を検証
 *
 * @param result - パーサー結果
 * @returns 検証結果
 */
export function validateResult(result: ParserResult): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!result.success) {
    errors.push('パースに失敗しました');
    return { isValid: false, errors };
  }

  if (!result.data) {
    errors.push('データが存在しません');
    return { isValid: false, errors };
  }

  const data = result.data;

  // 企業情報の検証
  if (!data.company.name) {
    errors.push('企業名が設定されていません');
  }

  // 会計期間の検証
  if (!data.period.startDate || !data.period.endDate) {
    errors.push('会計期間が設定されていません');
  } else if (data.period.startDate >= data.period.endDate) {
    errors.push('会計期間が不正です（期首日 >= 期末日）');
  }

  // 財務諸表の検証
  if (!data.balanceSheet && !data.incomeStatement && !data.cashFlowStatement) {
    errors.push('財務諸表が1つも抽出されませんでした');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
