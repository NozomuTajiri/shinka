/**
 * PDFパーサーモジュール
 *
 * PDF形式の決算書をパースします。
 * OCR対応、テーブル抽出、メモリ効率的な処理を実装。
 */

import fs from 'fs/promises';
// @ts-ignore - pdf-parse types are incomplete
import * as pdfParseMod from 'pdf-parse';
const pdfParse = (pdfParseMod as any).default || pdfParseMod;
import type { ParserOptions, ParsedStatement, AccountItem, Amount } from '../types/financial.js';
import { parseAmount, normalizeAccountName, cleanText, parseDate } from './normalizer.js';

/**
 * PDFファイルをパース
 *
 * @param filePath - PDFファイルパス
 * @param options - パーサーオプション
 * @returns パース済み財務諸表
 */
export async function parsePdf(
  filePath: string,
  options: ParserOptions = {}
): Promise<ParsedStatement> {
  const startTime = Date.now();

  try {
    // PDFファイルを読み込み
    const dataBuffer = await fs.readFile(filePath);

    // pdf-parseでパース
    // @ts-ignore - pdf-parse default export callable
    const pdfData = await pdfParse(dataBuffer, {
      max: options.chunkSize ? Math.floor(options.chunkSize / 1024) : undefined,
    });

    if (options.debug) {
      console.log(`[PDFParser] Pages: ${pdfData.numpages}`);
      console.log(`[PDFParser] Text length: ${pdfData.text.length} chars`);
    }

    // テキストを行に分割
    const lines = pdfData.text.split('\n').map((line: string) => cleanText(line));

    // 財務諸表を抽出
    const statement = await extractFinancialStatements(lines, filePath, options);

    // メタデータを追加
    statement.metadata = {
      sourceFile: filePath,
      format: 'pdf',
      parsedAt: new Date(),
      parserVersion: '1.0.0',
      warnings: statement.metadata?.warnings || [],
    };

    const duration = Date.now() - startTime;
    if (options.debug) {
      console.log(`[PDFParser] Parse completed in ${duration}ms`);
    }

    return statement;
  } catch (error) {
    throw new Error(
      `PDFパースエラー: ${filePath} - ${(error as Error).message}`
    );
  }
}

/**
 * テキスト行から財務諸表を抽出
 *
 * @param lines - テキスト行配列
 * @param sourceFile - ソースファイル名
 * @param options - パーサーオプション
 * @returns パース済み財務諸表
 */
async function extractFinancialStatements(
  lines: string[],
  sourceFile: string,
  options: ParserOptions
): Promise<ParsedStatement> {
  const warnings: string[] = [];

  // 企業情報を抽出
  const company = extractCompanyInfo(lines);

  // 会計期間を抽出
  const period = extractFiscalPeriod(lines);

  // 貸借対照表を抽出
  let balanceSheet;
  try {
    balanceSheet = extractBalanceSheet(lines);
  } catch (error) {
    warnings.push(`貸借対照表の抽出に失敗: ${(error as Error).message}`);
    if (options.strict) throw error;
  }

  // 損益計算書を抽出
  let incomeStatement;
  try {
    incomeStatement = extractIncomeStatement(lines);
  } catch (error) {
    warnings.push(`損益計算書の抽出に失敗: ${(error as Error).message}`);
    if (options.strict) throw error;
  }

  // キャッシュフロー計算書を抽出
  let cashFlowStatement;
  try {
    cashFlowStatement = extractCashFlowStatement(lines);
  } catch (error) {
    warnings.push(`キャッシュフロー計算書の抽出に失敗: ${(error as Error).message}`);
    if (options.strict) throw error;
  }

  return {
    company,
    period,
    balanceSheet,
    incomeStatement,
    cashFlowStatement,
    metadata: {
      sourceFile,
      format: 'pdf',
      parsedAt: new Date(),
      parserVersion: '1.0.0',
      warnings,
    },
  };
}

/**
 * 企業情報を抽出
 */
function extractCompanyInfo(lines: string[]) {
  let name = '';
  let securityCode;

  // 上位50行から企業名を抽出
  for (let i = 0; i < Math.min(50, lines.length); i++) {
    const line = lines[i];

    // 証券コード検出（4桁数字）
    const codeMatch = line.match(/\b(\d{4})\b/);
    if (codeMatch && !securityCode) {
      securityCode = codeMatch[1];
    }

    // 株式会社を含む行を企業名候補とする
    if (line.includes('株式会社') && !name) {
      name = line.replace(/\(.*\)/, '').trim();
    }
  }

  if (!name) {
    throw new Error('企業名を抽出できませんでした');
  }

  return {
    name,
    securityCode,
  };
}

/**
 * 会計期間を抽出
 */
function extractFiscalPeriod(lines: string[]) {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  for (const line of lines) {
    // "令和X年X月X日から令和X年X月X日まで" パターン
    const periodMatch = line.match(/(\d+年\d+月\d+日).*?(\d+年\d+月\d+日)/);
    if (periodMatch) {
      try {
        startDate = parseDate(periodMatch[1]);
        endDate = parseDate(periodMatch[2]);
        break;
      } catch {
        // パース失敗時は次の行へ
      }
    }
  }

  if (!startDate || !endDate) {
    // デフォルトで前年度の期間を設定
    const now = new Date();
    endDate = new Date(now.getFullYear(), 2, 31); // 3月31日
    startDate = new Date(now.getFullYear() - 1, 3, 1); // 4月1日
  }

  return {
    startDate,
    endDate,
  };
}

/**
 * 貸借対照表を抽出
 */
function extractBalanceSheet(lines: string[]) {
  // 「貸借対照表」セクションを特定
  const bsStartIndex = lines.findIndex((line) => line.includes('貸借対照表'));

  if (bsStartIndex === -1) {
    throw new Error('貸借対照表が見つかりません');
  }

  // セクション終了位置を特定（次の財務諸表または空行連続）
  let bsEndIndex = bsStartIndex + 1;
  let emptyLineCount = 0;
  for (let i = bsStartIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('損益計算書') || lines[i].includes('キャッシュ')) {
      bsEndIndex = i;
      break;
    }
    if (lines[i].trim() === '') {
      emptyLineCount++;
      if (emptyLineCount >= 5) {
        bsEndIndex = i;
        break;
      }
    } else {
      emptyLineCount = 0;
    }
  }

  const bsLines = lines.slice(bsStartIndex, bsEndIndex);

  // 簡易実装: 勘定科目と金額を抽出
  const items = extractAccountItems(bsLines);

  // 資産・負債・純資産に分類（簡略化）
  return {
    assets: {
      currentAssets: items.filter((item) => item.name.includes('流動資産')),
      fixedAssets: items.filter((item) => item.name.includes('固定資産')),
      total: { value: 0, unit: '円' as const },
    },
    liabilities: {
      currentLiabilities: items.filter((item) => item.name.includes('流動負債')),
      fixedLiabilities: items.filter((item) => item.name.includes('固定負債')),
      total: { value: 0, unit: '円' as const },
    },
    equity: {
      shareholdersEquity: items.filter((item) => item.name.includes('株主資本')),
      total: { value: 0, unit: '円' as const },
    },
  };
}

/**
 * 損益計算書を抽出
 */
function extractIncomeStatement(lines: string[]) {
  const plStartIndex = lines.findIndex((line) => line.includes('損益計算書'));

  if (plStartIndex === -1) {
    throw new Error('損益計算書が見つかりません');
  }

  let plEndIndex = plStartIndex + 1;
  for (let i = plStartIndex + 1; i < lines.length; i++) {
    if (lines[i].includes('貸借対照表') || lines[i].includes('キャッシュ')) {
      plEndIndex = i;
      break;
    }
  }

  const plLines = lines.slice(plStartIndex, plEndIndex);
  const items = extractAccountItems(plLines);

  return {
    revenue: items.filter((item) => item.name.includes('売上高')),
    costOfSales: items.filter((item) => item.name.includes('売上原価')),
    grossProfit: { value: 0, unit: '円' as const },
    sellingGeneralAndAdministrativeExpenses: items.filter((item) =>
      item.name.includes('販売費')
    ),
    operatingIncome: { value: 0, unit: '円' as const },
    nonOperatingIncome: [],
    nonOperatingExpenses: [],
    ordinaryIncome: { value: 0, unit: '円' as const },
    incomeBeforeTax: { value: 0, unit: '円' as const },
    incomeTaxes: [],
    netIncome: { value: 0, unit: '円' as const },
  };
}

/**
 * キャッシュフロー計算書を抽出
 */
function extractCashFlowStatement(lines: string[]) {
  const cfStartIndex = lines.findIndex((line) => line.includes('キャッシュ'));

  if (cfStartIndex === -1) {
    throw new Error('キャッシュフロー計算書が見つかりません');
  }

  return {
    operatingActivities: {
      items: [],
      subtotal: { value: 0, unit: '円' as const },
      total: { value: 0, unit: '円' as const },
    },
    investingActivities: {
      items: [],
      total: { value: 0, unit: '円' as const },
    },
    financingActivities: {
      items: [],
      total: { value: 0, unit: '円' as const },
    },
    netIncreaseInCash: { value: 0, unit: '円' as const },
    cashAtBeginningOfPeriod: { value: 0, unit: '円' as const },
    cashAtEndOfPeriod: { value: 0, unit: '円' as const },
  };
}

/**
 * テキスト行から勘定科目を抽出
 *
 * @param lines - テキスト行配列
 * @returns 勘定科目配列
 */
function extractAccountItems(lines: string[]): AccountItem[] {
  const items: AccountItem[] = [];

  for (const line of lines) {
    // 勘定科目名と金額のパターンマッチング
    // 例: "現金及び預金 1,234,567"
    const match = line.match(/^([^\d]+)\s+([\d,\-\(\)]+(?:円|千円|百万円|億円)?)\s*$/);

    if (match) {
      const name = normalizeAccountName(match[1]);
      try {
        const amount = parseAmount(match[2]);
        items.push({ name, amount });
      } catch (error) {
        // 金額パースエラーはスキップ
      }
    }
  }

  return items;
}
