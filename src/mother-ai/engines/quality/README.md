# Quality Monitoring Engine

継続的な品質監視・改善を実現するAI駆動の品質管理エンジン

## 概要

Quality Monitoring Engineは、Mother AIシステムにおいてアバターの応答品質を継続的に監視し、自動的に改善提案を生成するエンジンです。

## 主要機能

### 1. 品質メトリクス収集

- **応答品質**: 正確性、関連性、完全性、明瞭性、一貫性
- **ユーザー満足度**: NPS、CSAT、CES、フィードバック分析
- **システムパフォーマンス**: 応答時間、エラー率、稼働率、スループット

### 2. リアルタイムアラート

- **品質低下検知**: 品質スコアが閾値を下回った場合
- **満足度低下検知**: CSATスコアの急激な低下
- **エラー急増検知**: エラー率の異常な上昇
- **レイテンシー増加検知**: 応答時間の遅延

### 3. AI駆動の改善提案

Claude Sonnet 4を活用した自動改善提案:
- 応答品質の改善
- ユーザー満足度向上施策
- パフォーマンス最適化
- ナレッジベース拡充

### 4. エスカレーションポリシー

- 多段階エスカレーション
- 自動エスカレート機能
- ロール別通知設定

### 5. 品質レポート生成

- 期間別品質サマリー
- トレンド分析
- トップパフォーマー/要改善アバター抽出
- アクションアイテム提示

## 使用例

### 基本的な使用方法

\`\`\`typescript
import { QualityMonitoringEngine } from './mother-ai/engines/quality';

// エンジン初期化
const engine = new QualityMonitoringEngine();

// 品質メトリクス収集
const metrics = await engine.collectMetrics('avatar-1', {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
});

console.log('Overall Score:', metrics.overallScore);
console.log('Trend:', metrics.trend);
\`\`\`

### 応答サンプリング

\`\`\`typescript
// リアルタイム応答評価
const sample = await engine.sampleAndEvaluate(
  'avatar-1',
  'session-123',
  'ユーザーメッセージ',
  'アバター応答'
);

console.log('Quality Score:', sample.quality.averageScore);
\`\`\`

### アラート管理

\`\`\`typescript
// アクティブアラート取得
const alerts = engine.getActiveAlerts();

// アラート確認
engine.acknowledgeAlert(alerts[0].alertId);

// アラート解決
engine.resolveAlert(alerts[0].alertId);
\`\`\`

### カスタムアラートルール追加

\`\`\`typescript
engine.addAlertRule({
  ruleId: 'custom-accuracy',
  name: '正確性低下アラート',
  metric: 'responseQuality.accuracy',
  condition: 'below',
  threshold: 80,
  window: 3600000, // 1時間
  severity: 'warning',
  enabled: true,
  notificationChannels: ['slack', 'email'],
});
\`\`\`

### 改善提案生成

\`\`\`typescript
// AI駆動の改善提案
const suggestions = await engine.generateSuggestions('avatar-1');

suggestions.forEach(suggestion => {
  console.log('Title:', suggestion.title);
  console.log('Description:', suggestion.description);
  console.log('Expected Impact:', suggestion.expectedImpact);
  console.log('Effort:', suggestion.effort);
});
\`\`\`

### 品質レポート生成

\`\`\`typescript
const report = await engine.generateReport({
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
});

console.log('Overall Health:', report.summary.overallHealth);
console.log('Top Performers:', report.summary.topPerformers);
console.log('Needs Attention:', report.summary.needsAttention);
console.log('Key Insights:', report.summary.keyInsights);
\`\`\`

## アーキテクチャ

### データフロー

\`\`\`
ユーザー対話
    ↓
sampleAndEvaluate() ← Claude Sonnet 4で品質評価
    ↓
メトリクス蓄積
    ↓
collectMetrics() ← 定期実行
    ↓
アラートチェック → 閾値超過時に通知
    ↓
generateSuggestions() ← AI駆動の改善提案
    ↓
generateReport() ← 定期レポート生成
\`\`\`

### デフォルトアラートルール

| ルールID | 名称 | メトリクス | 条件 | 閾値 | 重要度 |
|---------|------|-----------|------|------|--------|
| quality-drop | 品質低下 | responseQuality.averageScore | below | 70 | warning |
| satisfaction-drop | 満足度低下 | userSatisfaction.csat | below | 60 | error |
| error-spike | エラー急増 | systemPerformance.errorRate | above | 5% | critical |
| latency-increase | レイテンシー増加 | systemPerformance.p95ResponseTime | above | 5000ms | warning |

### デフォルトエスカレーションポリシー

1. **Level 1**: 担当者 (30分以内に対応)
   - 通知: Slack
   - アクション: 調査開始

2. **Level 2**: チームリード (60分以内に対応)
   - 通知: Slack, Email
   - アクション: エスカレーション対応

3. **Level 3**: マネージャー (120分以内に対応)
   - 通知: Slack, Email, Pager
   - アクション: 緊急対応

## メトリクス詳細

### ResponseQualityMetrics

- **accuracy** (0-100): 情報の正確性
- **relevance** (0-100): 質問への関連性
- **completeness** (0-100): 必要情報の網羅性
- **clarity** (0-100): 明瞭さ・わかりやすさ
- **consistency** (0-100): 論理的一貫性
- **averageScore** (0-100): 総合スコア

### SatisfactionMetrics

- **nps** (-100〜100): Net Promoter Score
- **csat** (0-100): Customer Satisfaction Score
- **ces** (0-100): Customer Effort Score
- **feedbackCount**: フィードバック総数
- **positiveFeedback**: ポジティブフィードバック数
- **negativeFeedback**: ネガティブフィードバック数
- **commonComplaints**: よくある不満（配列）
- **commonPraises**: よくある称賛（配列）

### PerformanceMetrics

- **averageResponseTime** (ms): 平均応答時間
- **p95ResponseTime** (ms): 95パーセンタイル応答時間
- **errorRate** (%): エラー率
- **uptime** (%): 稼働率
- **throughput** (req/min): スループット

## 品質基準

### 総合品質スコア計算

\`\`\`
overallScore =
  responseQuality.averageScore × 0.4 +
  userSatisfaction.csat × 0.4 +
  performanceScore × 0.2

performanceScore = max(0, 100 - errorRate×10 - averageResponseTime/100)
\`\`\`

### 健全性レベル

| レベル | スコア範囲 | 説明 |
|--------|----------|------|
| excellent | 90+ | 優秀 |
| good | 75-89 | 良好 |
| fair | 60-74 | 普通 |
| poor | 40-59 | 要改善 |
| critical | 0-39 | 緊急対応必要 |

### トレンド判定

- **improving**: 直近3回の平均より+5点以上
- **stable**: ±5点以内
- **declining**: 直近3回の平均より-5点以上

## テスト

\`\`\`bash
npm test -- src/mother-ai/engines/quality/__tests__/quality-monitoring.test.ts
\`\`\`

### テストカバレッジ

- メトリクス収集: 100%
- アラート管理: 100%
- 改善提案生成: 100%
- レポート生成: 100%

## パフォーマンス

- **collectMetrics()**: 通常1-3秒
- **sampleAndEvaluate()**: 通常500ms-1秒（Claude API呼び出し含む）
- **generateSuggestions()**: 通常2-5秒
- **generateReport()**: 通常1-2秒

## 制限事項

- メトリクス履歴は直近30件まで保持
- サンプルは直近100件まで保持
- Claude API呼び出しにレート制限あり

## 今後の拡張予定

- [ ] Prometheus/Grafana連携
- [ ] Slack/Microsoft Teams通知統合
- [ ] A/Bテスト機能
- [ ] 自動改善アクション実行
- [ ] ベンチマーク比較機能
- [ ] カスタムメトリクス定義

## 関連ドキュメント

- [Mother AI Overview](../../README.md)
- [Avatar Builder](../../avatar-builder.ts)
- [Origin System](../../origin.ts)

## ライセンス

MIT
