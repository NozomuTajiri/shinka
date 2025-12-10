/**
 * Quality Monitoring Engine 使用例
 */

import { QualityMonitoringEngine } from './index.js';

async function main() {
  console.log('=== Quality Monitoring Engine Example ===\n');

  // エンジン初期化
  const engine = new QualityMonitoringEngine();

  // 1. 品質メトリクス収集
  console.log('1. Collecting quality metrics...');
  const metrics = await engine.collectMetrics('demo-avatar', {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  });

  console.log(`   Overall Score: ${metrics.overallScore.toFixed(1)}`);
  console.log(`   Trend: ${metrics.trend}`);
  console.log(`   Response Quality: ${metrics.responseQuality.averageScore.toFixed(1)}`);
  console.log(`   User Satisfaction (CSAT): ${metrics.userSatisfaction.csat.toFixed(1)}`);
  console.log(`   Avg Response Time: ${metrics.systemPerformance.averageResponseTime.toFixed(0)}ms\n`);

  // 2. 応答サンプリングと評価
  console.log('2. Sampling and evaluating responses...');
  const sample1 = await engine.sampleAndEvaluate(
    'demo-avatar',
    'session-001',
    'システムの使い方を教えてください',
    'システムの使い方をご説明します。まず、ダッシュボードにアクセスしてください。'
  );

  console.log(`   Sample Quality Score: ${sample1.quality.averageScore.toFixed(1)}`);
  console.log(`   - Accuracy: ${sample1.quality.accuracy.toFixed(1)}`);
  console.log(`   - Relevance: ${sample1.quality.relevance.toFixed(1)}`);
  console.log(`   - Clarity: ${sample1.quality.clarity.toFixed(1)}\n`);

  // 3. アラート確認
  console.log('3. Checking alerts...');
  const activeAlerts = engine.getActiveAlerts();
  console.log(`   Active Alerts: ${activeAlerts.length}`);

  if (activeAlerts.length > 0) {
    const alert = activeAlerts[0];
    console.log(`   - ${alert.message}`);
    console.log(`   - Severity: ${alert.severity}`);
    console.log(`   - Threshold: ${alert.threshold}, Actual: ${alert.actualValue.toFixed(1)}\n`);

    // アラート確認
    engine.acknowledgeAlert(alert.alertId);
    console.log(`   Alert ${alert.alertId} acknowledged\n`);
  } else {
    console.log('   No active alerts\n');
  }

  // 4. 改善提案生成
  console.log('4. Generating improvement suggestions...');
  const suggestions = await engine.generateSuggestions('demo-avatar');
  console.log(`   Generated ${suggestions.length} suggestions:`);

  suggestions.forEach((suggestion, index) => {
    console.log(`   ${index + 1}. ${suggestion.title}`);
    console.log(`      Category: ${suggestion.category}`);
    console.log(`      Expected Impact: +${suggestion.expectedImpact}pts`);
    console.log(`      Effort: ${suggestion.effort}`);
    console.log(`      Priority: ${suggestion.priority}`);
  });
  console.log();

  // 5. カスタムアラートルール追加
  console.log('5. Adding custom alert rule...');
  engine.addAlertRule({
    ruleId: 'demo-accuracy-check',
    name: 'デモ正確性チェック',
    metric: 'responseQuality.accuracy',
    condition: 'below',
    threshold: 85,
    window: 1800000, // 30分
    severity: 'info',
    enabled: true,
    notificationChannels: ['console'],
  });
  console.log('   Custom alert rule added\n');

  // 6. エスカレーションポリシー設定
  console.log('6. Setting escalation policy...');
  engine.setEscalationPolicy({
    policyId: 'demo-policy',
    name: 'デモエスカレーションポリシー',
    levels: [
      {
        level: 1,
        name: 'First Response',
        notifyRoles: ['developer'],
        channels: ['slack'],
        responseTimeMinutes: 15,
        actions: ['初回確認'],
      },
      {
        level: 2,
        name: 'Senior Review',
        notifyRoles: ['senior-dev'],
        channels: ['slack', 'email'],
        responseTimeMinutes: 30,
        actions: ['詳細調査'],
      },
    ],
    autoEscalate: true,
    escalationWindow: 15,
  });
  console.log('   Escalation policy configured\n');

  // 7. 品質レポート生成
  console.log('7. Generating quality report...');

  // 複数アバターのメトリクスを収集（デモ用）
  await engine.collectMetrics('avatar-a', {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  });

  await engine.collectMetrics('avatar-b', {
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  });

  const report = await engine.generateReport({
    start: new Date('2025-01-01'),
    end: new Date('2025-01-31'),
  });

  console.log('   Report Summary:');
  console.log(`   - Overall Health: ${report.summary.overallHealth}`);
  console.log(`   - Top Performers: ${report.summary.topPerformers.join(', ') || 'None'}`);
  console.log(`   - Needs Attention: ${report.summary.needsAttention.join(', ') || 'None'}`);
  console.log(`   - Total Avatars: ${report.avatarMetrics.length}`);
  console.log(`   - Total Alerts: ${report.alerts.length}`);
  console.log(`   - Total Suggestions: ${report.suggestions.length}`);
  console.log(`   - Trends: ${report.trends.length}`);
  console.log();

  console.log('   Key Insights:');
  report.summary.keyInsights.forEach(insight => {
    console.log(`   - ${insight}`);
  });
  console.log();

  if (report.summary.actionItems.length > 0) {
    console.log('   Action Items:');
    report.summary.actionItems.forEach(item => {
      console.log(`   - ${item}`);
    });
  }

  console.log('\n=== Example Complete ===');
}

// 実行
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { main };
