/**
 * CSVパーサーモジュール
 *
 * CSV形式の決算書をパースします。
 * ストリーミング処理、エンコーディング対応、柔軟なフォーマット検出を実装。
 */

import fs from 'fs';
import { parse } from 'csv-parse';
import type {
  ParserOptions,
  ParsedStatement,
  AccountItem,
  BalanceSheet,
  IncomeStatement,
  CashFlowStatement,
} from '../types/financial.js';
import { parseAmount, normalizeAccountName, cleanText, parseDate } from './normalizer.js';

/**
 * CSVファイルをパース
 *
 * @param filePath - CSVファイルパス
 * @param options - パーサーオプション
 * @returns パース済み財務諸表
 */
export async function parseCsv(
  filePath: string,
  options: ParserOptions = {}
): Promise<ParsedStatement> {
  const startTime = Date.now();

  try {
    // CSVをストリーミング読み込み
    const records = await readCsvStream(filePath, options);

    if (options.debug) {
      console.log(`[CSVParser] Records: ${records.length}`);
    }

    // ヘッダーを検出
    const headers = detectHeaders(records);

    if (options.debug) {
      console.log(`[CSVParser] Headers: ${headers.join(', ')}`);
    }

    // 財務諸表を抽出
    const statement = extractFinancialStatements(records, headers, filePath, options);

    const duration = Date.now() - startTime;
    if (options.debug) {
      console.log(`[CSVParser] Parse completed in ${duration}ms`);
    }

    return statement;
  } catch (error) {
    throw new Error(
      `CSVパースエラー: ${filePath} - ${(error as Error).message}`
    );
  }
}

/**
 * CSVファイルをストリーミング読み込み
 *
 * @param filePath - CSVファイルパス
 * @param options - パーサーオプション
 * @returns レコード配列
 */
function readCsvStream(
  filePath: string,
  options: ParserOptions
): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const records: string[][] = [];
    const encoding = (options.encoding || 'utf8') as BufferEncoding;
    const delimiter = options.delimiter || ',';

    fs.createReadStream(filePath, { encoding })
      .pipe(
        parse({
          delimiter,
          relax_column_count: true, // 列数が一致しなくても許容
          skip_empty_lines: true,
          trim: true,
          from_line: (options.skipRows || 0) + 1,
        })
      )
      .on('data', (record: string[]) => {
        records.push(record);
      })
      .on('end', () => {
        resolve(records);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * ヘッダー行を検出
 *
 * @param records - レコード配列
 * @returns ヘッダー配列
 */
function detectHeaders(records: string[][]): string[] {
  if (records.length === 0) {
    return [];
  }

  // 最初の行をヘッダーとして採用
  const firstRow = records[0];

  // ヘッダーらしい行を探す（"勘定科目", "金額", "Amount"などを含む）
  const headerKeywords = ['勘定科目', '科目', '項目', '金額', '当期', '前期', 'amount', 'item'];

  for (let i = 0; i < Math.min(5, records.length); i++) {
    const row = records[i];
    const matched = row.some((cell) =>
      headerKeywords.some((keyword) =>
        cell.toLowerCase().includes(keyword.toLowerCase())
      )
    );

    if (matched) {
      return row.map((cell) => cleanText(cell));
    }
  }

  // ヘッダーが見つからない場合は最初の行を採用
  return firstRow.map((cell) => cleanText(cell));
}

/**
 * レコードから財務諸表を抽出
 *
 * @param records - レコード配列
 * @param headers - ヘッダー配列
 * @param sourceFile - ソースファイル名
 * @param options - パーサーオプション
 * @returns パース済み財務諸表
 */
function extractFinancialStatements(
  records: string[][],
  headers: string[],
  sourceFile: string,
  options: ParserOptions
): ParsedStatement {
  const warnings: string[] = [];

  // 企業情報を抽出
  const company = extractCompanyInfo(records, headers);

  // 会計期間を抽出
  const period = extractFiscalPeriod(records, headers);

  // 勘定科目列と金額列のインデックスを特定
  const accountColIndex = findColumnIndex(headers, ['勘定科目', '科目', '項目', 'account', 'item']);
  const amountColIndex = findColumnIndex(headers, ['金額', '当期', 'amount', 'current']);

  if (accountColIndex === -1 || amountColIndex === -1) {
    throw new Error('勘定科目列または金額列が見つかりません');
  }

  // 勘定科目を抽出
  const items = extractAccountItems(records, accountColIndex, amountColIndex, options);

  // 財務諸表を分類
  let balanceSheet: BalanceSheet | undefined;
  let incomeStatement: IncomeStatement | undefined;
  let cashFlowStatement: CashFlowStatement | undefined;

  try {
    balanceSheet = classifyBalanceSheet(items);
  } catch (error) {
    warnings.push(`貸借対照表の分類エラー: ${(error as Error).message}`);
    if (options.strict) throw error;
  }

  try {
    incomeStatement = classifyIncomeStatement(items);
  } catch (error) {
    warnings.push(`損益計算書の分類エラー: ${(error as Error).message}`);
    if (options.strict) throw error;
  }

  try {
    cashFlowStatement = classifyCashFlowStatement(items);
  } catch (error) {
    warnings.push(`キャッシュフロー計算書の分類エラー: ${(error as Error).message}`);
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
      format: 'csv',
      parsedAt: new Date(),
      parserVersion: '1.0.0',
      warnings,
    },
  };
}

/**
 * 企業情報を抽出
 */
function extractCompanyInfo(records: string[][], headers: string[]) {
  let name = '';
  let securityCode: string | undefined;

  // 上位20行をスキャン
  for (let i = 0; i < Math.min(20, records.length); i++) {
    const row = records[i];

    for (const cell of row) {
      // 企業名検出
      if (cell.includes('株式会社') && !name) {
        name = cleanText(cell);
      }

      // 証券コード検出
      const codeMatch = cell.match(/\b(\d{4})\b/);
      if (codeMatch && !securityCode) {
        securityCode = codeMatch[1];
      }
    }
  }

  if (!name) {
    name = '不明'; // デフォルト値
  }

  return {
    name,
    securityCode,
  };
}

/**
 * 会計期間を抽出
 */
function extractFiscalPeriod(records: string[][], headers: string[]) {
  let startDate: Date | undefined;
  let endDate: Date | undefined;

  // ヘッダーから日付を検索
  for (const header of headers) {
    const dateMatch = header.match(/(\d{4}[年/-]\d{1,2}[月/-]\d{1,2})/g);
    if (dateMatch && dateMatch.length >= 2) {
      try {
        startDate = parseDate(dateMatch[0]);
        endDate = parseDate(dateMatch[1]);
        break;
      } catch {
        // パース失敗
      }
    }
  }

  if (!startDate || !endDate) {
    // デフォルトの会計期間
    const now = new Date();
    endDate = new Date(now.getFullYear(), 2, 31);
    startDate = new Date(now.getFullYear() - 1, 3, 1);
  }

  return {
    startDate,
    endDate,
  };
}

/**
 * 列インデックスを検索
 *
 * @param headers - ヘッダー配列
 * @param keywords - 検索キーワード
 * @returns 列インデックス（見つからない場合は-1）
 */
function findColumnIndex(headers: string[], keywords: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i].toLowerCase();
    if (keywords.some((kw) => header.includes(kw.toLowerCase()))) {
      return i;
    }
  }
  return -1;
}

/**
 * レコードから勘定科目を抽出
 *
 * @param records - レコード配列
 * @param accountColIndex - 勘定科目列インデックス
 * @param amountColIndex - 金額列インデックス
 * @param options - パーサーオプション
 * @returns 勘定科目配列
 */
function extractAccountItems(
  records: string[][],
  accountColIndex: number,
  amountColIndex: number,
  options: ParserOptions
): AccountItem[] {
  const items: AccountItem[] = [];

  // ヘッダー行をスキップ（最初の1行）
  for (let i = 1; i < records.length; i++) {
    const row = records[i];

    if (row.length <= Math.max(accountColIndex, amountColIndex)) {
      continue;
    }

    const accountName = cleanText(row[accountColIndex]);
    const amountStr = cleanText(row[amountColIndex]);

    if (!accountName || !amountStr) {
      continue;
    }

    try {
      const amount = parseAmount(amountStr);
      items.push({
        name: normalizeAccountName(accountName),
        amount,
      });
    } catch (error) {
      if (options.debug) {
        console.warn(`[CSVParser] 金額パースエラー: ${amountStr}`);
      }
    }
  }

  return items;
}

/**
 * 勘定科目を貸借対照表に分類
 */
function classifyBalanceSheet(items: AccountItem[]): BalanceSheet {
  const currentAssets = items.filter((item) =>
    ['現金及び預金', '受取手形', '売掛金', '商品', '製品'].includes(item.name)
  );

  const fixedAssets = items.filter((item) =>
    ['建物', '土地', 'ソフトウェア', '投資有価証券'].includes(item.name)
  );

  const currentLiabilities = items.filter((item) =>
    ['支払手形', '買掛金', '短期借入金'].includes(item.name)
  );

  const fixedLiabilities = items.filter((item) =>
    ['長期借入金', '社債', '退職給付引当金'].includes(item.name)
  );

  const shareholdersEquity = items.filter((item) =>
    ['資本金', '資本剰余金', '利益剰余金'].includes(item.name)
  );

  return {
    assets: {
      currentAssets,
      fixedAssets,
      total: { value: 0, unit: '円' },
    },
    liabilities: {
      currentLiabilities,
      fixedLiabilities,
      total: { value: 0, unit: '円' },
    },
    equity: {
      shareholdersEquity,
      total: { value: 0, unit: '円' },
    },
  };
}

/**
 * 勘定科目を損益計算書に分類
 */
function classifyIncomeStatement(items: AccountItem[]): IncomeStatement {
  return {
    revenue: items.filter((item) => item.name === '売上高'),
    costOfSales: items.filter((item) => item.name === '売上原価'),
    grossProfit: { value: 0, unit: '円' },
    sellingGeneralAndAdministrativeExpenses: items.filter((item) =>
      item.name === '販売費及び一般管理費'
    ),
    operatingIncome: { value: 0, unit: '円' },
    nonOperatingIncome: [],
    nonOperatingExpenses: [],
    ordinaryIncome: { value: 0, unit: '円' },
    incomeBeforeTax: { value: 0, unit: '円' },
    incomeTaxes: [],
    netIncome: { value: 0, unit: '円' },
  };
}

/**
 * 勘定科目をキャッシュフロー計算書に分類
 */
function classifyCashFlowStatement(items: AccountItem[]): CashFlowStatement {
  return {
    operatingActivities: {
      items: [],
      subtotal: { value: 0, unit: '円' },
      total: { value: 0, unit: '円' },
    },
    investingActivities: {
      items: [],
      total: { value: 0, unit: '円' },
    },
    financingActivities: {
      items: [],
      total: { value: 0, unit: '円' },
    },
    netIncreaseInCash: { value: 0, unit: '円' },
    cashAtBeginningOfPeriod: { value: 0, unit: '円' },
    cashAtEndOfPeriod: { value: 0, unit: '円' },
  };
}
