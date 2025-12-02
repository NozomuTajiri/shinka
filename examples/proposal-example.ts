/**
 * コンサルティング提案生成の使用例
 */

import {
  createProposalGenerator,
  createMarkdownFormatter,
  createPDFFormatter,
  createExcelFormatter,
  type ProposalGenerationRequest,
} from '../src/proposal/index.js';
import * as dotenv from 'dotenv';

// 環境変数を読み込み
dotenv.config();

/**
 * 基本的な使用例
 */
async function basicExample() {
  console.log('=== 基本的な使用例 ===\n');

  // API Keyを取得
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません');
  }

  // 提案生成器を作成
  const generator = createProposalGenerator({
    apiKey,
    model: 'claude-sonnet-4-20250514',
    maxTokens: 8000,
    verbose: true,
  });

  // リクエストを作成
  const request: ProposalGenerationRequest = {
    clientName: '株式会社サンプル商事',
    industry: '製造業（電子部品）',
    companySize: '従業員500名、年商100億円',
    mainChallenges: `
当社は電子部品製造業を営んでおり、以下の経営課題を抱えています：

1. デジタル化の遅れ
   - 生産管理システムが老朽化しており、リアルタイムの生産状況把握が困難
   - 営業・在庫管理が Excel ベースで非効率

2. 人材不足
   - 熟練技術者の高齢化と後継者不足
   - 若手人材の採用難と離職率の高さ（年間離職率15%）

3. 収益性の低下
   - 競合他社との価格競争により粗利率が低下（前年比-3%）
   - 新規顧客開拓が進まず、既存顧客への依存度が高い（上位3社で売上の60%）

4. 組織の硬直化
   - 部門間の連携不足により意思決定が遅い
   - 改善提案制度はあるが、実行に移されるケースが少ない
    `.trim(),
    additionalContext: `
経営陣は3年以内に以下の目標を達成したいと考えています：
- 売上高: 100億円 → 150億円（+50%）
- 営業利益率: 5% → 10%（2倍）
- 従業員満足度: 60点 → 80点以上
- デジタル化率: 30% → 80%
    `.trim(),
    focusValues: ['business_value', 'organization_value', 'employee_value'],
  };

  // 提案書を生成
  console.log('提案書を生成中...\n');
  const result = await generator.generate(request);

  console.log('\n=== 生成完了 ===');
  console.log(`提案書ID: ${result.proposal.id}`);
  console.log(`タイトル: ${result.proposal.title}`);
  console.log(`課題数: ${result.proposal.issues.length}`);
  console.log(`施策数: ${result.proposal.measures.length}`);
  console.log(`\n使用トークン: 入力=${result.metadata.inputTokens}, 出力=${result.metadata.outputTokens}`);
  console.log(`生成時間: ${result.metadata.durationMs}ms`);

  return result.proposal;
}

/**
 * ストリーミング生成の例
 */
async function streamingExample() {
  console.log('\n=== ストリーミング生成の例 ===\n');

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY が設定されていません');
  }

  const generator = createProposalGenerator({
    apiKey,
    verbose: false,
  });

  const request: ProposalGenerationRequest = {
    clientName: 'テクノロジースタートアップ株式会社',
    industry: 'IT・SaaS',
    companySize: '従業員30名、シリーズA調達済み',
    mainChallenges:
      'プロダクト開発は順調だが、営業・マーケティング体制が弱く、顧客獲得が進んでいない。',
    focusValues: ['customer_value', 'business_value'],
  };

  console.log('ストリーミング生成を開始...\n');

  const streamGenerator = generator.generateStreaming(request);

  for await (const event of streamGenerator) {
    switch (event.type) {
      case 'start':
        console.log('📝 生成開始');
        break;
      case 'progress':
        process.stdout.write('.');
        break;
      case 'complete':
        console.log('\n✅ 生成完了');
        break;
      case 'error':
        console.error(`\n❌ エラー: ${event.error}`);
        break;
    }
  }

  const result = await streamGenerator.next();
  if (result.done && result.value) {
    return result.value.proposal;
  }

  throw new Error('生成に失敗しました');
}

/**
 * フォーマット・エクスポートの例
 */
async function exportExample(proposal: any) {
  console.log('\n=== エクスポートの例 ===\n');

  // Markdown
  console.log('Markdown形式でエクスポート中...');
  const markdownFormatter = createMarkdownFormatter();
  await markdownFormatter.saveToFile(
    proposal,
    '/tmp/consulting-proposal.md'
  );
  console.log('✅ Markdown保存完了: /tmp/consulting-proposal.md');

  // PDF
  console.log('PDF形式でエクスポート中...');
  const pdfFormatter = createPDFFormatter({
    pageSize: 'A4',
    margin: 20,
  });
  await pdfFormatter.saveToFile(
    proposal,
    '/tmp/consulting-proposal.pdf'
  );
  console.log('✅ PDF保存完了: /tmp/consulting-proposal.pdf');

  // Excel
  console.log('Excel形式でエクスポート中...');
  const excelFormatter = createExcelFormatter();
  await excelFormatter.saveToFile(
    proposal,
    '/tmp/consulting-proposal.xlsx'
  );
  console.log('✅ Excel保存完了: /tmp/consulting-proposal.xlsx');
}

/**
 * メイン実行
 */
async function main() {
  try {
    // 基本的な使用例
    const proposal = await basicExample();

    // エクスポート
    await exportExample(proposal);

    console.log('\n🎉 すべての処理が完了しました！');
  } catch (error) {
    console.error('エラーが発生しました:', error);
    process.exit(1);
  }
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
