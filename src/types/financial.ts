/**
 * 財務データ型定義
 *
 * 決算書パーサーで使用する型定義を提供します。
 * 貸借対照表、損益計算書、キャッシュフロー計算書の構造化データを定義。
 */

/**
 * 金額データ（単位: 円）
 */
export interface Amount {
  /** 金額（数値） */
  value: number;
  /** 単位（円、千円、百万円など） */
  unit: '円' | '千円' | '百万円' | '億円';
  /** 元の文字列表現 */
  original?: string;
}

/**
 * 勘定科目
 */
export interface AccountItem {
  /** 勘定科目コード（任意） */
  code?: string;
  /** 勘定科目名（日本語） */
  name: string;
  /** 英語名（任意） */
  nameEn?: string;
  /** 金額 */
  amount: Amount;
  /** サブアイテム（詳細項目） */
  subItems?: AccountItem[];
}

/**
 * 貸借対照表（B/S: Balance Sheet）
 */
export interface BalanceSheet {
  /** 資産の部 */
  assets: {
    /** 流動資産 */
    currentAssets: AccountItem[];
    /** 固定資産 */
    fixedAssets: AccountItem[];
    /** 繰延資産 */
    deferredAssets?: AccountItem[];
    /** 資産合計 */
    total: Amount;
  };
  /** 負債の部 */
  liabilities: {
    /** 流動負債 */
    currentLiabilities: AccountItem[];
    /** 固定負債 */
    fixedLiabilities: AccountItem[];
    /** 負債合計 */
    total: Amount;
  };
  /** 純資産の部 */
  equity: {
    /** 株主資本 */
    shareholdersEquity: AccountItem[];
    /** その他の包括利益累計額 */
    accumulatedOtherComprehensiveIncome?: AccountItem[];
    /** 新株予約権 */
    stockAcquisitionRights?: AccountItem[];
    /** 非支配株主持分 */
    nonControllingInterests?: AccountItem[];
    /** 純資産合計 */
    total: Amount;
  };
}

/**
 * 損益計算書（P/L: Profit & Loss Statement / Income Statement）
 */
export interface IncomeStatement {
  /** 売上高 */
  revenue: AccountItem[];
  /** 売上原価 */
  costOfSales: AccountItem[];
  /** 売上総利益 */
  grossProfit: Amount;
  /** 販売費及び一般管理費 */
  sellingGeneralAndAdministrativeExpenses: AccountItem[];
  /** 営業利益 */
  operatingIncome: Amount;
  /** 営業外収益 */
  nonOperatingIncome: AccountItem[];
  /** 営業外費用 */
  nonOperatingExpenses: AccountItem[];
  /** 経常利益 */
  ordinaryIncome: Amount;
  /** 特別利益 */
  extraordinaryIncome?: AccountItem[];
  /** 特別損失 */
  extraordinaryLosses?: AccountItem[];
  /** 税引前当期純利益 */
  incomeBeforeTax: Amount;
  /** 法人税等 */
  incomeTaxes: AccountItem[];
  /** 当期純利益 */
  netIncome: Amount;
}

/**
 * キャッシュフロー計算書（C/F: Cash Flow Statement）
 */
export interface CashFlowStatement {
  /** 営業活動によるキャッシュフロー */
  operatingActivities: {
    /** 営業CF項目 */
    items: AccountItem[];
    /** 小計 */
    subtotal: Amount;
    /** 利息及び配当金の受取額 */
    interestAndDividendsReceived?: Amount;
    /** 利息の支払額 */
    interestPaid?: Amount;
    /** 法人税等の支払額 */
    incomeTaxesPaid?: Amount;
    /** 営業活動によるキャッシュフロー */
    total: Amount;
  };
  /** 投資活動によるキャッシュフロー */
  investingActivities: {
    /** 投資CF項目 */
    items: AccountItem[];
    /** 投資活動によるキャッシュフロー */
    total: Amount;
  };
  /** 財務活動によるキャッシュフロー */
  financingActivities: {
    /** 財務CF項目 */
    items: AccountItem[];
    /** 財務活動によるキャッシュフロー */
    total: Amount;
  };
  /** 現金及び現金同等物の増減額 */
  netIncreaseInCash: Amount;
  /** 現金及び現金同等物の期首残高 */
  cashAtBeginningOfPeriod: Amount;
  /** 現金及び現金同等物の期末残高 */
  cashAtEndOfPeriod: Amount;
}

/**
 * 会計期間
 */
export interface FiscalPeriod {
  /** 期首日 */
  startDate: Date;
  /** 期末日 */
  endDate: Date;
  /** 期（第○期） */
  period?: number;
  /** 会計年度 */
  fiscalYear?: number;
}

/**
 * 企業情報
 */
export interface CompanyInfo {
  /** 企業名 */
  name: string;
  /** 企業名（英語） */
  nameEn?: string;
  /** 証券コード */
  securityCode?: string;
  /** 業種 */
  industry?: string;
  /** 決算月 */
  fiscalYearEnd?: number;
}

/**
 * パース済み財務諸表（統合型）
 */
export interface ParsedStatement {
  /** 企業情報 */
  company: CompanyInfo;
  /** 会計期間 */
  period: FiscalPeriod;
  /** 貸借対照表 */
  balanceSheet?: BalanceSheet;
  /** 損益計算書 */
  incomeStatement?: IncomeStatement;
  /** キャッシュフロー計算書 */
  cashFlowStatement?: CashFlowStatement;
  /** メタデータ */
  metadata: {
    /** ソースファイル名 */
    sourceFile: string;
    /** ファイル形式 */
    format: 'pdf' | 'excel' | 'csv';
    /** パース日時 */
    parsedAt: Date;
    /** パーサーバージョン */
    parserVersion: string;
    /** 警告メッセージ */
    warnings?: string[];
  };
}

/**
 * パーサーオプション
 */
export interface ParserOptions {
  /** ストリーミング処理を有効化 */
  streaming?: boolean;
  /** チャンクサイズ（バイト） */
  chunkSize?: number;
  /** OCR使用（PDF用） */
  useOcr?: boolean;
  /** エンコーディング（CSV用） */
  encoding?: string;
  /** デリミタ（CSV用） */
  delimiter?: string;
  /** スキップする行数（ヘッダー行など） */
  skipRows?: number;
  /** 厳密モード（エラー時に例外をスロー） */
  strict?: boolean;
  /** デバッグログを有効化 */
  debug?: boolean;
}

/**
 * パーサー結果
 */
export interface ParserResult {
  /** パース成功フラグ */
  success: boolean;
  /** パース済みデータ */
  data?: ParsedStatement;
  /** エラーメッセージ */
  error?: string;
  /** 警告メッセージ */
  warnings?: string[];
  /** 処理時間（ミリ秒） */
  duration?: number;
}
