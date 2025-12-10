# 統廃合エンジン (Consolidation Engine)

非効率なアバターの分析・統合・廃止を管理するMother AIのサブシステム

## 概要

統廃合エンジンは、Mother AIシステム内のアバターを継続的に監視し、以下の判断を自動化します：

- **低利用率アバターの検出と廃止提案**
- **低効果アバターの改善または統合提案**
- **類似機能を持つアバターの統合提案**
- **影響評価とリスク分析**
- **統廃合レポートの自動生成**

## アーキテクチャ

```
ConsolidationEngine
├── メトリクス収集
│   ├── 利用状況メトリクス (UsageMetrics)
│   ├── 効果メトリクス (EffectivenessMetrics)
│   └── コストメトリクス (CostMetrics)
├── 候補検出
│   ├── 低利用率検出
│   ├── 低効果検出
│   └── 類似性分析
├── 提案作成
│   ├── 統合提案 (MergeProposal)
│   └── 廃止計画 (DeprecationPlan)
└── レポート生成
    └── 統廃合レポート (ConsolidationReport)
```

## 主要機能

### 1. メトリクス収集

```typescript
const engine = new ConsolidationEngine();

const metrics = await engine.collectMetrics('avatar-id', {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
});

console.log(metrics.overallScore); // 総合スコア (0-100)
```

**収集される指標：**
- セッション数、ユニークユーザー数
- タスク完了率、ユーザー満足度
- APIコール数、トークン使用量、コスト

### 2. 統廃合候補の検出

```typescript
const allMetrics = [
  await engine.collectMetrics('avatar-1', period),
  await engine.collectMetrics('avatar-2', period),
  await engine.collectMetrics('avatar-3', period),
];

const candidates = await engine.detectCandidates(allMetrics);

for (const candidate of candidates) {
  console.log(`${candidate.type}: ${candidate.reason}`);
  // 例: "deprecate: 低利用率: 5セッション/期間"
  // 例: "merge: 機能重複が検出されました"
}
```

**検出タイプ：**
- `deprecate`: 廃止推奨
- `archive`: アーカイブ推奨
- `merge`: 統合推奨

### 3. 統合提案の作成

```typescript
const proposal = await engine.createMergeProposal([
  'avatar-id-1',
  'avatar-id-2',
]);

console.log(proposal.targetAvatar.name); // 統合アバター名
console.log(proposal.mergeStrategy.personaMerge); // blend | primary | new
console.log(proposal.timeline.totalDuration); // 日数
console.log(proposal.risks); // リスク評価
```

**統合戦略：**
- **ペルソナ統合**: `primary` (主を採用) | `blend` (混合) | `new` (新規作成)
- **知識統合**: `union` (結合) | `intersection` (共通部分) | `selective` (選択的)
- **挙動統合**: `primary` | `weighted` (重み付け) | `adaptive` (適応的)

### 4. 廃止計画の作成

```typescript
const plan = await engine.createDeprecationPlan(
  'avatar-id',
  '低利用率のため廃止'
);

console.log(plan.timeline.announcementDate); // 告知日 (7日後)
console.log(plan.timeline.deprecationDate); // 廃止日 (30日後)
console.log(plan.timeline.sunsetDate); // 完全停止日 (60日後)
console.log(plan.migration.targetAvatar); // 移行先アバター
```

**移行計画：**
- データ転送仕様
- ユーザー通知戦略
- フォールバック動作

### 5. 影響評価

```typescript
const candidate = candidates[0];
const impact = await engine.assessImpact(candidate.candidateId);

console.log(impact.affectedUsers); // 影響を受けるユーザー数
console.log(impact.serviceDisruption); // none | minimal | moderate | significant
console.log(impact.costSavings); // コスト削減額
console.log(impact.migrationEffort); // low | medium | high
```

### 6. 統廃合レポート生成

```typescript
const report = await engine.generateReport({
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
});

console.log(report.summary);
// {
//   totalAvatars: 10,
//   healthyAvatars: 7,
//   underperformingAvatars: 2,
//   consolidationOpportunities: 3,
//   estimatedSavings: 150.5,
//   recommendations: [...]
// }
```

## 閾値設定

エンジンは以下の閾値で判断します：

| 項目 | 閾値 | 説明 |
|------|------|------|
| 最小セッション数 | 10 | これ以下は低利用率と判断 |
| 最小効果スコア | 60 | これ以下は低効果と判断 |
| 類似度閾値 | 0.7 | これ以上は統合候補と判断 |
| 健全スコア | 70 | これ以上は健全と判断 |
| 要改善スコア | 50 | これ以下は要改善と判断 |

## 型定義

### AvatarMetrics
```typescript
interface AvatarMetrics {
  avatarId: string;
  avatarName: string;
  period: { start: Date; end: Date };
  usage: UsageMetrics;
  effectiveness: EffectivenessMetrics;
  cost: CostMetrics;
  overallScore: number; // 0-100
}
```

### ConsolidationCandidate
```typescript
interface ConsolidationCandidate {
  candidateId: string;
  type: 'merge' | 'deprecate' | 'archive';
  avatars: string[];
  reason: string;
  confidence: number; // 0-1
  impact: ImpactAssessment;
  recommendation: string;
  detectedAt: Date;
}
```

### MergeProposal
```typescript
interface MergeProposal {
  proposalId: string;
  sourceAvatars: string[];
  targetAvatar: TargetAvatarSpec;
  mergeStrategy: MergeStrategy;
  timeline: MergeTimeline;
  risks: Risk[];
  status: ProposalStatus;
}
```

### DeprecationPlan
```typescript
interface DeprecationPlan {
  planId: string;
  avatarId: string;
  reason: string;
  timeline: DeprecationTimeline;
  migration: MigrationPlan;
  communication: CommunicationPlan;
  status: ProposalStatus;
}
```

## 使用例

### 基本的な使用フロー

```typescript
import { ConsolidationEngine } from './mother-ai/engines/consolidation';

// 1. エンジン初期化
const engine = new ConsolidationEngine();

// 2. 期間設定
const period = {
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
};

// 3. 全アバターのメトリクス収集
const avatarIds = ['avatar-1', 'avatar-2', 'avatar-3'];
const metricsPromises = avatarIds.map(id =>
  engine.collectMetrics(id, period)
);
const metrics = await Promise.all(metricsPromises);

// 4. 候補検出
const candidates = await engine.detectCandidates(metrics);

// 5. 影響評価
for (const candidate of candidates) {
  const impact = await engine.assessImpact(candidate.candidateId);

  if (candidate.type === 'merge') {
    const proposal = await engine.createMergeProposal(candidate.avatars);
    console.log('統合提案:', proposal);
  } else if (candidate.type === 'deprecate') {
    const plan = await engine.createDeprecationPlan(
      candidate.avatars[0],
      candidate.reason
    );
    console.log('廃止計画:', plan);
  }
}

// 6. レポート生成
const report = await engine.generateReport(period);
console.log('統廃合レポート:', report);
```

### 月次レポート自動生成

```typescript
async function generateMonthlyReport() {
  const engine = new ConsolidationEngine();
  const now = new Date();
  const period = {
    start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
    end: new Date(now.getFullYear(), now.getMonth(), 0),
  };

  // 全アバターのメトリクス収集
  const avatarIds = await getAllAvatarIds();
  const metrics = await Promise.all(
    avatarIds.map(id => engine.collectMetrics(id, period))
  );

  // 候補検出と影響評価
  const candidates = await engine.detectCandidates(metrics);
  for (const candidate of candidates) {
    await engine.assessImpact(candidate.candidateId);
  }

  // レポート生成と出力
  const report = await engine.generateReport(period);
  await saveReportToDatabase(report);
  await sendReportEmail(report);

  return report;
}
```

## テスト

```bash
# ユニットテストを実行
npm test src/mother-ai/engines/consolidation/index.test.ts

# カバレッジ付きで実行
npm test -- --coverage src/mother-ai/engines/consolidation/
```

## 今後の拡張

- [ ] AI駆動の類似度分析（Claude API活用）
- [ ] 実データベース統合（現在はモック実装）
- [ ] リアルタイムモニタリングダッシュボード
- [ ] A/Bテスト機能統合
- [ ] 自動承認フロー（閾値ベース）
- [ ] Webhookによる通知送信

## 関連ドキュメント

- [Mother AI Overview](../README.md)
- [Avatar Builder](../avatar-builder/README.md)
- [Quality Monitor](../quality-monitor/README.md)

---

**Author**: Miyabi Framework Team
**Version**: 1.0.0
**License**: MIT
