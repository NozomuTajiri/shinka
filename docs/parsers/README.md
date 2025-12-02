# 決算書パーサー

PDF/Excel/CSV形式の決算書を自動パースし、構造化データに変換します。

## 特徴

- **複数フォーマット対応**: PDF、Excel (.xlsx, .xls)、CSV
- **自動判定**: ファイル形式を自動検出
- **日本語対応**: 日本の会計基準に準拠した勘定科目マッピング
- **メモリ効率**: ストリーミング処理、チャンク分割
- **型安全**: TypeScript strict mode完全対応
- **財務諸表抽出**:
  - 貸借対照表 (Balance Sheet)
  - 損益計算書 (Income Statement)
  - キャッシュフロー計算書 (Cash Flow Statement)

## インストール

```bash
npm install pdf-parse xlsx csv-parse
```

## 基本的な使い方

### 統合インターフェース（推奨）

```typescript
import { parseStatement } from './src/parsers/index.js';

// ファイル形式は自動判定
const result = await parseStatement('./決算書.pdf', {
  debug: true,
  strict: false,
});

if (result.success && result.data) {
  console.log('企業名:', result.data.company.name);
  console.log('会計期間:', result.data.period);

  // 貸借対照表
  if (result.data.balanceSheet) {
    console.log('流動資産:', result.data.balanceSheet.assets.currentAssets);
  }

  // 損益計算書
  if (result.data.incomeStatement) {
    console.log('売上高:', result.data.incomeStatement.revenue);
  }
} else {
  console.error('パースエラー:', result.error);
}
```

### 個別パーサー

```typescript
import { parsePdf, parseExcel, parseCsv } from './src/parsers/index.js';

// PDFパーサー
const pdfData = await parsePdf('./決算書.pdf', {
  useOcr: false,
  debug: true,
});

// Excelパーサー
const excelData = await parseExcel('./決算書.xlsx', {
  skipRows: 2,
});

// CSVパーサー
const csvData = await parseCsv('./決算書.csv', {
  encoding: 'utf8',
  delimiter: ',',
});
```

### バッチ処理

```typescript
import { parseStatements } from './src/parsers/index.js';

const filePaths = [
  './2024年3月期.pdf',
  './2023年3月期.xlsx',
  './2022年3月期.csv',
];

const results = await parseStatements(filePaths, {
  debug: true,
});

results.forEach((result, index) => {
  if (result.success) {
    console.log(`${filePaths[index]}: パース成功`);
  } else {
    console.error(`${filePaths[index]}: ${result.error}`);
  }
});
```

## オプション

```typescript
interface ParserOptions {
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
```

## データ構造

### ParsedStatement

```typescript
interface ParsedStatement {
  /** 企業情報 */
  company: {
    name: string;
    securityCode?: string;
  };

  /** 会計期間 */
  period: {
    startDate: Date;
    endDate: Date;
  };

  /** 貸借対照表 */
  balanceSheet?: BalanceSheet;

  /** 損益計算書 */
  incomeStatement?: IncomeStatement;

  /** キャッシュフロー計算書 */
  cashFlowStatement?: CashFlowStatement;

  /** メタデータ */
  metadata: {
    sourceFile: string;
    format: 'pdf' | 'excel' | 'csv';
    parsedAt: Date;
    parserVersion: string;
    warnings?: string[];
  };
}
```

### BalanceSheet（貸借対照表）

```typescript
interface BalanceSheet {
  assets: {
    currentAssets: AccountItem[];    // 流動資産
    fixedAssets: AccountItem[];      // 固定資産
    total: Amount;                   // 資産合計
  };
  liabilities: {
    currentLiabilities: AccountItem[]; // 流動負債
    fixedLiabilities: AccountItem[];   // 固定負債
    total: Amount;                     // 負債合計
  };
  equity: {
    shareholdersEquity: AccountItem[]; // 株主資本
    total: Amount;                     // 純資産合計
  };
}
```

### IncomeStatement（損益計算書）

```typescript
interface IncomeStatement {
  revenue: AccountItem[];           // 売上高
  costOfSales: AccountItem[];       // 売上原価
  grossProfit: Amount;              // 売上総利益
  sellingGeneralAndAdministrativeExpenses: AccountItem[]; // 販管費
  operatingIncome: Amount;          // 営業利益
  ordinaryIncome: Amount;           // 経常利益
  netIncome: Amount;                // 当期純利益
}
```

## 正規化ユーティリティ

### 金額パース

```typescript
import { parseAmount, toYen } from './src/parsers/index.js';

// 金額文字列をパース
const amount = parseAmount('1,234千円');
console.log(amount); // { value: 1234, unit: '千円', original: '1,234千円' }

// 円単位に変換
const yen = toYen(amount);
console.log(yen); // 1,234,000
```

### 勘定科目正規化

```typescript
import { normalizeAccountName } from './src/parsers/index.js';

// 勘定科目名を標準化
const normalized = normalizeAccountName('現金預金');
console.log(normalized); // '現金及び預金'
```

### 日付パース

```typescript
import { parseDate } from './src/parsers/index.js';

// 和暦をパース
const date1 = parseDate('令和6年3月31日');
console.log(date1); // 2024-03-31

// YYYY/MM/DD形式
const date2 = parseDate('2024/03/31');
console.log(date2); // 2024-03-31
```

## エクスポート機能

### JSON出力

```typescript
import { parseStatement, exportToJson } from './src/parsers/index.js';

const result = await parseStatement('./決算書.pdf');

if (result.success) {
  await exportToJson(result, './output.json');
  console.log('JSON出力完了');
}
```

### 統計情報取得

```typescript
import { parseStatement, getStatistics } from './src/parsers/index.js';

const result = await parseStatement('./決算書.pdf');
const stats = getStatistics(result);

console.log('成功:', stats.success);
console.log('処理時間:', stats.duration, 'ms');
console.log('警告数:', stats.warningCount);
console.log('勘定科目数:', stats.totalAccounts);
console.log('貸借対照表:', stats.hasBalanceSheet ? '有' : '無');
```

### 検証

```typescript
import { parseStatement, validateResult } from './src/parsers/index.js';

const result = await parseStatement('./決算書.pdf');
const validation = validateResult(result);

if (!validation.isValid) {
  console.error('検証エラー:', validation.errors);
}
```

## エラーハンドリング

```typescript
import { parseStatement } from './src/parsers/index.js';

try {
  const result = await parseStatement('./決算書.pdf', {
    strict: true, // 厳密モード
  });

  if (!result.success) {
    throw new Error(result.error);
  }

  // 警告をチェック
  if (result.data?.metadata.warnings?.length) {
    console.warn('警告:', result.data.metadata.warnings);
  }

} catch (error) {
  console.error('パースエラー:', error.message);
}
```

## パフォーマンス最適化

### 大容量ファイル処理

```typescript
// 自動でストリーミングとチャンク処理を有効化
const result = await parseStatement('./大容量決算書.pdf', {
  streaming: true,
  chunkSize: 5 * 1024 * 1024, // 5MB chunks
});
```

### 並列処理

```typescript
import { parseStatements } from './src/parsers/index.js';

// 並列実行数は自動制御（デフォルト: 3並列）
const results = await parseStatements([
  'file1.pdf',
  'file2.xlsx',
  'file3.csv',
]);
```

## テスト

```bash
# 全テスト実行
npm test -- tests/parsers/

# 正規化モジュールのみ
npm test -- tests/parsers/normalizer.test.ts

# 統合パーサーのみ
npm test -- tests/parsers/statement-parser.test.ts
```

## 制限事項

- **ファイルサイズ**: 最大100MB
- **PDFレイアウト**: 複雑なレイアウトは正確に抽出できない場合があります
- **OCR**: 現在のバージョンではOCRは未実装です（将来対応予定）
- **勘定科目**: 未マッピングの勘定科目は警告ログを出力します

## トラブルシューティング

### PDFパースエラー

```
Error: PDFパースエラー: Cannot read property 'text' of undefined
```

対処法: PDFが破損している可能性があります。別のPDFビューアで開けるか確認してください。

### 企業名が抽出できない

```
Error: 企業名を抽出できませんでした
```

対処法: `skipRows`オプションで不要なヘッダー行をスキップしてください。

### メモリ不足

```
Error: JavaScript heap out of memory
```

対処法: `chunkSize`を小さくし、`streaming: true`を設定してください。

## ライセンス

MIT

## 作成者

Miyabi Framework - CodeGenAgent

## バージョン履歴

- **1.0.0** (2025-12-02)
  - 初回リリース
  - PDF/Excel/CSV対応
  - 日本語勘定科目マッピング
  - メモリ効率的処理
