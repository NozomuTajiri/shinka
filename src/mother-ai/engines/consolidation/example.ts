/**
 * 統廃合エンジン使用例
 *
 * このファイルは統廃合エンジンの基本的な使い方を示すサンプルコードです。
 */

import { ConsolidationEngine } from './index.js';
import type { AvatarMetrics } from './types.js';

/**
 * 基本的な使用例
 */
async function basicExample() {
  // 1. エンジンのインスタンス化
  const engine = new ConsolidationEngine();

  // 2. 分析期間の設定
  const period = {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  };

  // 3. アバターのメトリクスを収集
  const metrics1 = await engine.collectMetrics('customer-support-bot', period);
  const metrics2 = await engine.collectMetrics('sales-assistant', period);
  const metrics3 = await engine.collectMetrics('technical-helper', period);

  console.log('Collected metrics:');
  console.log(`- ${metrics1.avatarName}: Score ${metrics1.overallScore.toFixed(1)}`);
  console.log(`- ${metrics2.avatarName}: Score ${metrics2.overallScore.toFixed(1)}`);
  console.log(`- ${metrics3.avatarName}: Score ${metrics3.overallScore.toFixed(1)}`);

  // 4. 統廃合候補を検出
  const candidates = await engine.detectCandidates([metrics1, metrics2, metrics3]);

  console.log(`\nFound ${candidates.length} consolidation candidates:`);
  for (const candidate of candidates) {
    console.log(`- [${candidate.type}] ${candidate.reason} (confidence: ${candidate.confidence})`);
  }

  // 5. レポート生成
  const report = await engine.generateReport(period);
  console.log('\nConsolidation Report Summary:');
  console.log(`- Total Avatars: ${report.summary.totalAvatars}`);
  console.log(`- Healthy Avatars: ${report.summary.healthyAvatars}`);
  console.log(`- Underperforming: ${report.summary.underperformingAvatars}`);
  console.log(`- Opportunities: ${report.summary.consolidationOpportunities}`);
  console.log(`- Estimated Savings: ¥${report.summary.estimatedSavings.toFixed(2)}`);
}

/**
 * 統合提案の作成例
 */
async function mergeProposalExample() {
  const engine = new ConsolidationEngine();

  // 類似機能を持つ2つのアバターを統合
  const proposal = await engine.createMergeProposal([
    'customer-support-bot',
    'sales-assistant',
  ]);

  console.log('\nMerge Proposal:');
  console.log(`- ID: ${proposal.proposalId}`);
  console.log(`- Target Avatar: ${proposal.targetAvatar.name}`);
  console.log(`- Strategy: ${proposal.mergeStrategy.personaMerge}`);
  console.log(`- Timeline: ${proposal.timeline.totalDuration} days`);
  console.log(`- Risks: ${proposal.risks.length} identified`);

  // リスクの詳細表示
  console.log('\nIdentified Risks:');
  for (const risk of proposal.risks) {
    console.log(`- [${risk.type}] ${risk.description}`);
    console.log(`  Probability: ${risk.probability}, Impact: ${risk.impact}`);
    console.log(`  Mitigation: ${risk.mitigation}`);
  }
}

/**
 * 廃止計画の作成例
 */
async function deprecationPlanExample() {
  const engine = new ConsolidationEngine();

  // 低利用率のアバターを廃止
  const plan = await engine.createDeprecationPlan(
    'legacy-support-bot',
    '利用率が極めて低く、機能が他のアバターで代替可能'
  );

  console.log('\nDeprecation Plan:');
  console.log(`- Avatar: ${plan.avatarId}`);
  console.log(`- Reason: ${plan.reason}`);
  console.log(`- Announcement: ${plan.timeline.announcementDate.toLocaleDateString()}`);
  console.log(`- Deprecation: ${plan.timeline.deprecationDate.toLocaleDateString()}`);
  console.log(`- Sunset: ${plan.timeline.sunsetDate.toLocaleDateString()}`);
  console.log(`- Migration Target: ${plan.migration.targetAvatar}`);

  // 通知計画の表示
  console.log('\nCommunication Plan:');
  for (const message of plan.communication.messages) {
    console.log(`- [${message.channel}] ${message.subject}`);
    console.log(`  Audience: ${message.audience}`);
  }
}

/**
 * 影響評価の実行例
 */
async function impactAssessmentExample() {
  const engine = new ConsolidationEngine();

  const period = {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  };

  // メトリクス収集と候補検出
  const metrics = await engine.collectMetrics('test-avatar', period);
  const candidates = await engine.detectCandidates([metrics]);

  if (candidates.length > 0) {
    const candidate = candidates[0];

    // 影響評価を実行
    const impact = await engine.assessImpact(candidate.candidateId);

    console.log('\nImpact Assessment:');
    console.log(`- Affected Users: ${impact.affectedUsers}`);
    console.log(`- Service Disruption: ${impact.serviceDisruption}`);
    console.log(`- Cost Savings: ¥${impact.costSavings.toFixed(2)}`);
    console.log(`- Migration Effort: ${impact.migrationEffort}`);

    if (impact.capabilityLoss.length > 0) {
      console.log('\nCapability Loss:');
      for (const capability of impact.capabilityLoss) {
        console.log(`- ${capability}`);
      }
    }
  }
}

/**
 * 月次レポート自動生成の例
 */
async function monthlyReportExample() {
  const engine = new ConsolidationEngine();

  // 前月の期間を計算
  const now = new Date();
  const period = {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 0),
  };

  console.log(`\nGenerating monthly report for ${period.start.toLocaleDateString()} - ${period.end.toLocaleDateString()}`);

  // 仮想的なアバターリスト
  const avatarIds = [
    'customer-support',
    'sales-assistant',
    'technical-helper',
    'hr-bot',
    'finance-assistant',
  ];

  // すべてのアバターのメトリクスを並列収集
  const metricsPromises = avatarIds.map(id =>
    engine.collectMetrics(id, period)
  );
  const allMetrics = await Promise.all(metricsPromises);

  // 候補検出
  const candidates = await engine.detectCandidates(allMetrics);

  // 各候補の影響評価
  for (const candidate of candidates) {
    await engine.assessImpact(candidate.candidateId);
  }

  // レポート生成
  const report = await engine.generateReport(period);

  console.log('\n=== Monthly Consolidation Report ===');
  console.log(`Report ID: ${report.reportId}`);
  console.log(`Generated: ${report.generatedAt.toLocaleString()}`);
  console.log('\nSummary:');
  console.log(`- Total Avatars: ${report.summary.totalAvatars}`);
  console.log(`- Healthy: ${report.summary.healthyAvatars}`);
  console.log(`- Underperforming: ${report.summary.underperformingAvatars}`);
  console.log(`- Consolidation Opportunities: ${report.summary.consolidationOpportunities}`);
  console.log(`- Estimated Savings: ¥${report.summary.estimatedSavings.toFixed(2)}`);

  console.log('\nRecommendations:');
  for (const recommendation of report.summary.recommendations) {
    console.log(`- ${recommendation}`);
  }

  // 詳細な候補リスト
  if (report.candidates.length > 0) {
    console.log('\nDetailed Candidates:');
    for (const candidate of report.candidates) {
      console.log(`\n[${candidate.type.toUpperCase()}] ${candidate.avatars.join(', ')}`);
      console.log(`  Reason: ${candidate.reason}`);
      console.log(`  Confidence: ${(candidate.confidence * 100).toFixed(0)}%`);
      console.log(`  Recommendation: ${candidate.recommendation}`);
    }
  }

  return report;
}

/**
 * すべての例を実行
 */
async function runAllExamples() {
  try {
    console.log('=== 統廃合エンジン使用例 ===\n');

    console.log('1. Basic Example');
    await basicExample();

    console.log('\n\n2. Merge Proposal Example');
    await mergeProposalExample();

    console.log('\n\n3. Deprecation Plan Example');
    await deprecationPlanExample();

    console.log('\n\n4. Impact Assessment Example');
    await impactAssessmentExample();

    console.log('\n\n5. Monthly Report Example');
    await monthlyReportExample();

    console.log('\n\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error);
    throw error;
  }
}

// エントリーポイント
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}

export {
  basicExample,
  mergeProposalExample,
  deprecationPlanExample,
  impactAssessmentExample,
  monthlyReportExample,
  runAllExamples,
};
