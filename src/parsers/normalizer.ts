/**
 * データ正規化モジュール
 *
 * 勘定科目のマッピング、数値変換、データクリーニングを実施します。
 */

import type { Amount, AccountItem } from '../types/financial.js';

/**
 * 勘定科目マッピング辞書（日本語→標準化名称）
 */
const ACCOUNT_MAPPING: Record<string, string> = {
  // 資産の部
  現金及び預金: '現金及び預金',
  現金預金: '現金及び預金',
  受取手形: '受取手形',
  売掛金: '売掛金',
  売掛債権: '売掛金',
  商品: '商品',
  製品: '製品',
  仕掛品: '仕掛品',
  原材料: '原材料',
  貯蔵品: '貯蔵品',
  前払費用: '前払費用',
  繰延税金資産: '繰延税金資産',
  その他流動資産: 'その他流動資産',
  貸倒引当金: '貸倒引当金',
  有形固定資産: '有形固定資産',
  建物: '建物',
  構築物: '構築物',
  機械装置: '機械装置',
  車両運搬具: '車両運搬具',
  工具器具備品: '工具器具備品',
  土地: '土地',
  建設仮勘定: '建設仮勘定',
  無形固定資産: '無形固定資産',
  ソフトウェア: 'ソフトウェア',
  のれん: 'のれん',
  投資その他の資産: '投資その他の資産',
  投資有価証券: '投資有価証券',
  長期貸付金: '長期貸付金',
  // 負債の部
  支払手形: '支払手形',
  買掛金: '買掛金',
  短期借入金: '短期借入金',
  未払金: '未払金',
  未払費用: '未払費用',
  未払法人税等: '未払法人税等',
  賞与引当金: '賞与引当金',
  その他流動負債: 'その他流動負債',
  長期借入金: '長期借入金',
  社債: '社債',
  退職給付引当金: '退職給付引当金',
  // 純資産の部
  資本金: '資本金',
  資本剰余金: '資本剰余金',
  利益剰余金: '利益剰余金',
  自己株式: '自己株式',
  // 損益計算書
  売上高: '売上高',
  売上原価: '売上原価',
  販売費及び一般管理費: '販売費及び一般管理費',
  販管費: '販売費及び一般管理費',
  営業利益: '営業利益',
  営業外収益: '営業外収益',
  営業外費用: '営業外費用',
  経常利益: '経常利益',
  特別利益: '特別利益',
  特別損失: '特別損失',
  法人税等: '法人税等',
  当期純利益: '当期純利益',
};

/**
 * 単位文字列から単位型へ変換
 */
function normalizeUnit(unitStr: string): Amount['unit'] {
  const normalized = unitStr.replace(/\s/g, '');
  if (normalized.includes('億')) return '億円';
  if (normalized.includes('百万') || normalized.includes('百萬')) return '百万円';
  if (normalized.includes('千')) return '千円';
  return '円';
}

/**
 * 金額文字列をAmountオブジェクトに変換
 *
 * @param amountStr - 金額文字列（例: "1,234,567円", "123百万円", "-456千円"）
 * @returns Amount型オブジェクト
 */
export function parseAmount(amountStr: string): Amount {
  const original = amountStr;
  let cleaned = amountStr.replace(/,|、/g, ''); // カンマ除去

  // 単位を抽出
  let unit: Amount['unit'] = '円';
  if (cleaned.includes('億円') || cleaned.includes('億')) {
    unit = '億円';
    cleaned = cleaned.replace(/億円?/, '');
  } else if (cleaned.includes('百万円') || cleaned.includes('百萬円') || cleaned.includes('百万') || cleaned.includes('百萬')) {
    unit = '百万円';
    cleaned = cleaned.replace(/百[万萬]円?/, '');
  } else if (cleaned.includes('千円') || cleaned.includes('千')) {
    unit = '千円';
    cleaned = cleaned.replace(/千円?/, '');
  } else {
    cleaned = cleaned.replace(/円/, '');
  }

  // 全角数字を半角に変換
  cleaned = cleaned.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  );

  // マイナス記号を統一
  cleaned = cleaned.replace(/[−ー－]/g, '-');

  // 括弧をマイナスに変換（会計表記）
  const isNegative = /^\(.*\)$/.test(cleaned.trim());
  if (isNegative) {
    cleaned = '-' + cleaned.replace(/[()（）]/g, '');
  }

  // 数値をパース
  const value = parseFloat(cleaned.trim());

  if (isNaN(value)) {
    throw new Error(`無効な金額形式: ${original}`);
  }

  return {
    value,
    unit,
    original,
  };
}

/**
 * 金額を標準単位（円）に変換
 *
 * @param amount - Amount型オブジェクト
 * @returns 円単位の金額
 */
export function toYen(amount: Amount): number {
  const multiplier: Record<Amount['unit'], number> = {
    円: 1,
    千円: 1_000,
    百万円: 1_000_000,
    億円: 100_000_000,
  };

  return amount.value * multiplier[amount.unit];
}

/**
 * 勘定科目名を正規化
 *
 * @param rawName - 元の勘定科目名
 * @returns 正規化された勘定科目名
 */
export function normalizeAccountName(rawName: string): string {
  // 空白を除去
  const trimmed = rawName.trim().replace(/\s+/g, '');

  // マッピング辞書で変換
  const normalized = ACCOUNT_MAPPING[trimmed];

  if (normalized) {
    return normalized;
  }

  // マッピングにない場合は元の名前を返す（警告ログ出力）
  console.warn(`[Normalizer] 未マッピング勘定科目: ${rawName}`);
  return trimmed;
}

/**
 * 勘定科目データを正規化
 *
 * @param items - 勘定科目配列
 * @returns 正規化された勘定科目配列
 */
export function normalizeAccountItems(items: AccountItem[]): AccountItem[] {
  return items.map((item) => ({
    ...item,
    name: normalizeAccountName(item.name),
    subItems: item.subItems ? normalizeAccountItems(item.subItems) : undefined,
  }));
}

/**
 * 金額の妥当性を検証
 *
 * @param amount - 検証する金額
 * @param context - コンテキスト（エラーメッセージ用）
 * @throws Error - 妥当性チェックに失敗した場合
 */
export function validateAmount(amount: Amount, context: string = ''): void {
  if (!Number.isFinite(amount.value)) {
    throw new Error(`無効な金額: ${context} - ${amount.value}`);
  }

  // 異常な金額（100兆円超）を検出
  const yenValue = toYen(amount);
  if (Math.abs(yenValue) > 100_000_000_000_000) {
    console.warn(`[Normalizer] 異常に大きい金額を検出: ${context} - ${yenValue}円`);
  }
}

/**
 * 文字列をクリーニング（空白、改行、制御文字の除去）
 *
 * @param text - クリーニングする文字列
 * @returns クリーニング済み文字列
 */
export function cleanText(text: string): string {
  return text
    .replace(/[\r\n\t]+/g, ' ') // 改行・タブをスペースに変換
    .replace(/\s+/g, ' ') // 連続するスペースを1つに統合
    .trim();
}

/**
 * 日付文字列をパース
 *
 * @param dateStr - 日付文字列（例: "2024年3月31日", "2024/03/31", "令和6年3月31日"）
 * @returns Dateオブジェクト
 */
export function parseDate(dateStr: string): Date {
  // 和暦変換テーブル
  const eraTable: Record<string, number> = {
    令和: 2018,
    平成: 1988,
    昭和: 1925,
    大正: 1911,
    明治: 1867,
  };

  let cleaned = dateStr.replace(/\s/g, '');

  // 和暦を西暦に変換
  for (const [era, baseYear] of Object.entries(eraTable)) {
    const pattern = new RegExp(`${era}(\\d+)年`);
    const match = cleaned.match(pattern);
    if (match) {
      const year = baseYear + parseInt(match[1]);
      cleaned = cleaned.replace(pattern, `${year}年`);
      break;
    }
  }

  // "YYYY年MM月DD日" 形式
  let match = cleaned.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  // "YYYY/MM/DD" 形式
  match = cleaned.match(/(\d{4})\/(\d{1,2})\/(\d{1,2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  // "YYYY-MM-DD" 形式
  match = cleaned.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
  }

  throw new Error(`無効な日付形式: ${dateStr}`);
}

/**
 * 業種コードから業種名を取得
 *
 * @param code - 業種コード（東証33業種分類）
 * @returns 業種名
 */
export function getIndustryName(code: number): string {
  const industries: Record<number, string> = {
    1: '水産・農林業',
    2: '鉱業',
    3: '建設業',
    4: '食料品',
    5: '繊維製品',
    6: 'パルプ・紙',
    7: '化学',
    8: '医薬品',
    9: '石油・石炭製品',
    10: 'ゴム製品',
    11: 'ガラス・土石製品',
    12: '鉄鋼',
    13: '非鉄金属',
    14: '金属製品',
    15: '機械',
    16: '電気機器',
    17: '輸送用機器',
    18: '精密機器',
    19: 'その他製品',
    20: '電気・ガス業',
    21: '陸運業',
    22: '海運業',
    23: '空運業',
    24: '倉庫・運輸関連業',
    25: '情報・通信業',
    26: '卸売業',
    27: '小売業',
    28: '銀行業',
    29: '証券、商品先物取引業',
    30: '保険業',
    31: 'その他金融業',
    32: '不動産業',
    33: 'サービス業',
  };

  return industries[code] || '不明';
}
