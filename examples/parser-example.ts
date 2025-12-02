/**
 * 決算書パーサー使用例
 *
 * 基本的な使い方とベストプラクティスを示します。
 */

import {
  parseStatement,
  parseStatements,
  validateResult,
  getStatistics,
  exportToJson,
  parseAmount,
  toYen,
  normalizeAccountName,
  parseDate,
} from '../src/parsers/index.js';

/**
 * 例1: 単一ファイルのパース
 */
async function example1() {
  console.log('=== 例1: 単一ファイルのパース ===\n');

  const result = await parseStatement('./決算書.pdf', {
    debug: true,
    strict: false,
  });

  if (result.success && result.data) {
    console.log('企業名:', result.data.company.name);
    console.log('証券コード:', result.data.company.securityCode);
    console.log('会計期間:', {
      開始: result.data.period.startDate.toLocaleDateString('ja-JP'),
      終了: result.data.period.endDate.toLocaleDateString('ja-JP'),
    });

    // 統計情報
    const stats = getStatistics(result);
    console.log('\n統計情報:');
    console.log('  処理時間:', stats.duration, 'ms');
    console.log('  勘定科目数:', stats.totalAccounts);
    console.log('  貸借対照表:', stats.hasBalanceSheet ? '有' : '無');
    console.log('  損益計算書:', stats.hasIncomeStatement ? '有' : '無');
  } else {
    console.error('パースエラー:', result.error);
  }
}

/**
 * 例2: バッチ処理
 */
async function example2() {
  console.log('\n=== 例2: 複数ファイルのバッチ処理 ===\n');

  const files = [
    './2024年3月期.pdf',
    './2023年3月期.xlsx',
    './2022年3月期.csv',
  ];

  const results = await parseStatements(files, { debug: false });

  results.forEach((result, index) => {
    console.log(`ファイル ${index + 1}:`, files[index]);
    if (result.success) {
      console.log('  成功 ✓');
      console.log('  企業名:', result.data?.company.name);
    } else {
      console.log('  失敗 ✗');
      console.log('  エラー:', result.error);
    }
  });
}

/**
 * 例3: JSON出力
 */
async function example3() {
  console.log('\n=== 例3: JSON出力 ===\n');

  const result = await parseStatement('./決算書.pdf');

  if (result.success) {
    await exportToJson(result, './output.json');
    console.log('JSON出力完了: output.json');
  }
}

/**
 * 例4: 金額処理
 */
function example4() {
  console.log('\n=== 例4: 金額処理 ===\n');

  // 金額パース
  const examples = [
    '1,234,567円',
    '1,234千円',
    '123百万円',
    '12億円',
    '-1,234円',
    '(1,234)円', // 括弧表記（マイナス）
  ];

  examples.forEach((amountStr) => {
    const amount = parseAmount(amountStr);
    const yen = toYen(amount);
    console.log(`${amountStr.padEnd(15)} → ${yen.toLocaleString('ja-JP')}円`);
  });
}

/**
 * 例5: 勘定科目正規化
 */
function example5() {
  console.log('\n=== 例5: 勘定科目正規化 ===\n');

  const accounts = [
    '現金預金',
    '売掛債権',
    '販管費',
    '長期借入金',
  ];

  accounts.forEach((account) => {
    const normalized = normalizeAccountName(account);
    console.log(`${account.padEnd(15)} → ${normalized}`);
  });
}

/**
 * 例6: 日付パース
 */
function example6() {
  console.log('\n=== 例6: 日付パース ===\n');

  const dates = [
    '2024年3月31日',
    '2024/03/31',
    '2024-03-31',
    '令和6年3月31日',
    '平成31年4月1日',
  ];

  dates.forEach((dateStr) => {
    const date = parseDate(dateStr);
    console.log(
      `${dateStr.padEnd(20)} → ${date.toLocaleDateString('ja-JP')}`
    );
  });
}

/**
 * 例7: エラーハンドリング
 */
async function example7() {
  console.log('\n=== 例7: エラーハンドリング ===\n');

  try {
    const result = await parseStatement('./存在しないファイル.pdf', {
      strict: true,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    // 検証
    const validation = validateResult(result);
    if (!validation.isValid) {
      console.error('検証エラー:', validation.errors);
    }

  } catch (error) {
    console.error('キャッチされたエラー:', (error as Error).message);
  }
}

/**
 * 例8: 貸借対照表の詳細表示
 */
async function example8() {
  console.log('\n=== 例8: 貸借対照表の詳細表示 ===\n');

  const result = await parseStatement('./決算書.pdf');

  if (result.success && result.data?.balanceSheet) {
    const bs = result.data.balanceSheet;

    console.log('【資産の部】');
    console.log('  流動資産:');
    bs.assets.currentAssets.forEach((item) => {
      console.log(`    ${item.name}: ${item.amount.value.toLocaleString()}${item.amount.unit}`);
    });

    console.log('\n  固定資産:');
    bs.assets.fixedAssets.forEach((item) => {
      console.log(`    ${item.name}: ${item.amount.value.toLocaleString()}${item.amount.unit}`);
    });

    console.log('\n【負債の部】');
    console.log('  流動負債:');
    bs.liabilities.currentLiabilities.forEach((item) => {
      console.log(`    ${item.name}: ${item.amount.value.toLocaleString()}${item.amount.unit}`);
    });

    console.log('\n【純資産の部】');
    bs.equity.shareholdersEquity.forEach((item) => {
      console.log(`    ${item.name}: ${item.amount.value.toLocaleString()}${item.amount.unit}`);
    });
  }
}

/**
 * メイン関数
 */
async function main() {
  console.log('決算書パーサー - 使用例\n');
  console.log('==========================================\n');

  // 金額・勘定科目・日付処理の例（ファイル不要）
  example4();
  example5();
  example6();

  // ファイルを使用する例（実際のファイルが必要）
  // await example1();
  // await example2();
  // await example3();
  // await example7();
  // await example8();

  console.log('\n==========================================');
  console.log('完了\n');
}

// 実行
main().catch(console.error);
