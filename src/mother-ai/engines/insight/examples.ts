/**
 * 横断インサイトエンジン - 使用例
 *
 * このファイルは実装例を示すためのものです。
 * 実際の環境では、環境変数とデータベースが必要です。
 */

import { CrossClientInsightEngine } from './index.js';
import type { Recipient, ClientActivity } from './types.js';

/**
 * 例1: 基本的なインサイト生成フロー
 */
export async function basicInsightGeneration() {
  const engine = new CrossClientInsightEngine();

  // 1. クライアント活動データを収集
  const activities = await engine.collectClientActivities(
    ['client1', 'client2', 'client3', 'client4', 'client5'],
    {
      start: new Date('2025-01-01'),
      end: new Date('2025-03-31'),
    }
  );

  console.log(`収集した活動データ: ${activities.length}件`);

  // 2. パターンを検出
  const patterns = await engine.detectPatterns(activities);
  console.log(`検出されたパターン: ${patterns.length}件`);

  patterns.forEach(pattern => {
    console.log(`  - ${pattern.name} (信頼度: ${pattern.confidence})`);
  });

  // 3. 成功パターンからベストプラクティスを生成
  const successPatterns = patterns.filter(p => p.type === 'success');
  const bestPractices = [];

  for (const pattern of successPatterns.slice(0, 3)) {
    const practice = await engine.generateBestPractice(pattern);
    bestPractices.push(practice);
    console.log(`\nベストプラクティス生成: ${practice.title}`);
    console.log(`  カテゴリ: ${practice.category}`);
    console.log(`  評価: ${practice.rating}/5.0`);
    console.log(`  ステップ数: ${practice.steps.length}`);
  }

  return { activities, patterns, bestPractices };
}

/**
 * 例2: トレンド分析とレコメンデーション
 */
export async function trendAnalysisAndRecommendations() {
  const engine = new CrossClientInsightEngine();

  const period = {
    start: new Date('2025-01-01'),
    end: new Date('2025-03-31'),
  };

  // データ収集
  await engine.collectClientActivities(
    ['client1', 'client2', 'client3'],
    period
  );

  // トレンド分析
  const activities = Array.from((engine as any).activities.values()) as ClientActivity[];
  const trends = await engine.analyzeTrends(activities, period);

  console.log(`\n検出されたトレンド: ${trends.length}件`);
  trends.forEach(trend => {
    console.log(`  - ${trend.name}`);
    console.log(`    方向: ${trend.direction}`);
    console.log(`    強度: ${trend.strength}`);
    console.log(`    影響クライアント数: ${trend.affectedClients}`);
  });

  // パターン検出
  const patterns = await engine.detectPatterns(activities);

  // レコメンデーション生成
  const recommendations = await engine.generateRecommendations(patterns, trends);

  console.log(`\n生成されたレコメンデーション: ${recommendations.length}件`);
  recommendations.forEach((rec, index) => {
    console.log(`\n${index + 1}. ${rec.title}`);
    console.log(`   優先度: ${rec.priority}`);
    console.log(`   対象: ${rec.target}`);
    console.log(`   アクション:`);
    rec.actions.forEach(action => {
      console.log(`     - ${action}`);
    });
  });

  return { trends, recommendations };
}

/**
 * 例3: 包括的なレポート生成と配信
 */
export async function generateAndDistributeReport() {
  const engine = new CrossClientInsightEngine();

  const period = {
    start: new Date('2025-01-01'),
    end: new Date('2025-03-31'),
  };

  // クライアント活動データを収集
  await engine.collectClientActivities(
    ['client1', 'client2', 'client3', 'client4', 'client5'],
    period
  );

  // 包括的レポート生成
  const report = await engine.generateReport(period);

  console.log(`\n=== ${report.title} ===`);
  console.log(`\nレポートID: ${report.reportId}`);
  console.log(`生成日時: ${report.generatedAt.toLocaleString()}`);
  console.log(`\nエグゼクティブサマリー:`);
  console.log(report.executiveSummary);

  console.log(`\n統計:`);
  console.log(`  パターン: ${report.patterns.length}件`);
  console.log(`  ベストプラクティス: ${report.bestPractices.length}件`);
  console.log(`  トレンド: ${report.trends.length}件`);
  console.log(`  レコメンデーション: ${report.recommendations.length}件`);

  // 高優先度レコメンデーション
  const highPriorityRecs = report.recommendations.filter(r => r.priority === 'high');
  console.log(`\n高優先度レコメンデーション: ${highPriorityRecs.length}件`);

  // レポートを配信
  const recipients: Recipient[] = [
    { type: 'admin', id: 'admin1', name: '管理者', relevanceScore: 1.0 },
    { type: 'client', id: 'client1', name: 'クライアント1', relevanceScore: 0.9 },
    { type: 'client', id: 'client2', name: 'クライアント2', relevanceScore: 0.85 },
  ];

  const distribution = await engine.distributeInsight(
    report.reportId,
    recipients,
    'dashboard'
  );

  console.log(`\n配信ステータス: ${distribution.status}`);
  console.log(`配信先: ${distribution.recipients.length}件`);
  console.log(`配信チャネル: ${distribution.channel}`);

  return report;
}

/**
 * 例4: 特定パターンの詳細分析
 */
export async function analyzeSpecificPattern() {
  const engine = new CrossClientInsightEngine();

  // データ収集とパターン検出
  const activities = await engine.collectClientActivities(
    ['client1', 'client2', 'client3'],
    {
      start: new Date('2025-01-01'),
      end: new Date('2025-03-31'),
    }
  );

  const patterns = await engine.detectPatterns(activities);

  // 最も信頼度の高いパターンを選択
  const topPattern = patterns.sort((a, b) => b.confidence - a.confidence)[0];

  if (topPattern) {
    console.log(`\n=== トップパターン分析 ===`);
    console.log(`パターン名: ${topPattern.name}`);
    console.log(`タイプ: ${topPattern.type}`);
    console.log(`信頼度: ${topPattern.confidence}`);
    console.log(`発生頻度: ${topPattern.frequency}`);
    console.log(`影響クライアント: ${topPattern.clients.join(', ')}`);

    console.log(`\n条件:`);
    topPattern.conditions.forEach(cond => {
      console.log(`  - ${cond.factor} ${cond.operator} ${cond.value}`);
    });

    console.log(`\n成果:`);
    topPattern.outcomes.forEach(outcome => {
      console.log(`  - ${outcome.metric}: ${outcome.direction} ${outcome.magnitude}% (${outcome.timeframe})`);
    });

    // ベストプラクティスを生成
    const practice = await engine.generateBestPractice(topPattern);

    console.log(`\n=== 生成されたベストプラクティス ===`);
    console.log(`タイトル: ${practice.title}`);
    console.log(`カテゴリ: ${practice.category}`);
    console.log(`\n説明:`);
    console.log(practice.description);

    console.log(`\n実施ステップ:`);
    practice.steps.forEach(step => {
      console.log(`  ${step.order}. ${step.action}`);
    });

    console.log(`\n期待される成果:`);
    practice.expectedOutcomes.forEach(outcome => {
      console.log(`  - ${outcome}`);
    });

    console.log(`\n適用条件:`);
    console.log(`  業界: ${practice.applicability.industries.join(', ')}`);
    console.log(`  企業規模: ${practice.applicability.companySize.join(', ')}`);

    return { pattern: topPattern, practice };
  }

  return null;
}

/**
 * 例5: 複数期間のトレンド比較
 */
export async function compareTrendsAcrossPeriods() {
  const engine = new CrossClientInsightEngine();

  const clientIds = ['client1', 'client2', 'client3', 'client4'];

  // Q1のデータ
  const q1Activities = await engine.collectClientActivities(
    clientIds,
    {
      start: new Date('2025-01-01'),
      end: new Date('2025-03-31'),
    }
  );

  const q1Trends = await engine.analyzeTrends(q1Activities, {
    start: new Date('2025-01-01'),
    end: new Date('2025-03-31'),
  });

  console.log(`\n=== Q1 トレンド分析 ===`);
  console.log(`検出されたトレンド: ${q1Trends.length}件`);

  // トップ3のトレンドを表示
  q1Trends.slice(0, 3).forEach((trend, index) => {
    console.log(`\n${index + 1}. ${trend.name}`);
    console.log(`   方向: ${trend.direction}`);
    console.log(`   強度: ${(trend.strength * 100).toFixed(1)}%`);
    console.log(`   影響: ${trend.projectedImpact}`);
  });

  return { q1Trends };
}

/**
 * メイン実行関数（デモ用）
 */
export async function runAllExamples() {
  console.log('='.repeat(60));
  console.log('横断インサイトエンジン - 使用例デモ');
  console.log('='.repeat(60));

  try {
    console.log('\n例1: 基本的なインサイト生成フロー');
    console.log('-'.repeat(60));
    await basicInsightGeneration();

    console.log('\n\n例2: トレンド分析とレコメンデーション');
    console.log('-'.repeat(60));
    await trendAnalysisAndRecommendations();

    console.log('\n\n例3: 包括的なレポート生成と配信');
    console.log('-'.repeat(60));
    await generateAndDistributeReport();

    console.log('\n\n例4: 特定パターンの詳細分析');
    console.log('-'.repeat(60));
    await analyzeSpecificPattern();

    console.log('\n\n例5: 複数期間のトレンド比較');
    console.log('-'.repeat(60));
    await compareTrendsAcrossPeriods();

    console.log('\n' + '='.repeat(60));
    console.log('すべての例の実行が完了しました');
    console.log('='.repeat(60));
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// このファイルを直接実行した場合
// Note: import.meta requires ES2020+ module mode
// Uncomment below if running as ES module
// if (import.meta.url === `file://${process.argv[1]}`) {
//   runAllExamples().catch(console.error);
// }
