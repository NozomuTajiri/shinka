# Avatar Validation and Workflow System

アバターテンプレートの検証とワークフロー管理システム

## 概要

このモジュールは、アバターテンプレートの構築プロセス全体を管理し、品質保証を行うためのシステムを提供します。

### 主要機能

1. **ValidationEngine** - テンプレートの自動検証
2. **WorkflowEngine** - 構築ワークフローの管理
3. **Trial Period Tracking** - トライアル期間のメトリクス追跡
4. **Approval Management** - 承認フローの制御

## ワークフローフェーズ

アバター構築は以下の6つのフェーズで構成されます:

```
requirements → design → build → validation → trial → adoption
```

### 1. Requirements (要件定義)
- ビジネス要件の収集
- ユーザーストーリーの作成
- 成功基準の定義

### 2. Design (設計)
- ペルソナ設計
- 知識ドメイン定義
- 能力マッピング
- コラボレーション設計

### 3. Build (構築)
- テンプレート実装
- 設定ファイル作成
- 初期テスト

### 4. Validation (検証)
- スキーマ検証
- 機能検証
- 品質検証
- セキュリティ検証
- 統合検証

### 5. Trial (トライアル)
- 30日間の実運用テスト
- メトリクス収集
- フィードバック収集
- チェックポイント評価

### 6. Adoption (採用判定)
- 最終レビュー
- 採用/却下の決定
- 本番展開 or 再設計

## 使用例

### 基本的なワークフロー

```typescript
import { WorkflowEngine, ValidationEngine } from './avatar-templates/workflow';
import { AvatarTemplateBuilder } from './avatar-templates/builder';

// 1. ワークフローエンジンの初期化
const workflowEngine = new WorkflowEngine({
  trialDays: 30,
  autoAdvance: false,
  qualityThresholds: {
    minSatisfaction: 4.0,
    maxErrorRate: 5,
    minSuccessRate: 90,
  },
});

// 2. ワークフロー開始
const workflow = workflowEngine.initiateWorkflow(
  'customer-support-avatar',
  'tech-lead@company.com'
);

console.log(`Workflow ID: ${workflow.metadata.workflowId}`);
console.log(`Current Phase: ${workflow.metadata.currentPhase}`); // 'requirements'

// 3. フェーズオーナーの割り当て
workflowEngine.assignPhaseOwner(workflow.metadata.workflowId, 'requirements', 'po@company.com');
workflowEngine.assignPhaseOwner(workflow.metadata.workflowId, 'design', 'designer@company.com');
workflowEngine.assignPhaseOwner(workflow.metadata.workflowId, 'build', 'dev@company.com');

// 4. 要件定義フェーズ完了 → Design開始
workflowEngine.completePhase(workflow.metadata.workflowId, 'requirements');
workflowEngine.startPhase(workflow.metadata.workflowId, 'design');

// 5. 設計完了 → Build開始
workflowEngine.completePhase(workflow.metadata.workflowId, 'design');
workflowEngine.startPhase(workflow.metadata.workflowId, 'build');

// 6. テンプレート構築
const builder = new AvatarTemplateBuilder('customer-support-avatar', 'support-ai');
const template = builder
  .withPersona({
    name: 'サポートAI',
    role: 'カスタマーサポート',
    description: '顧客の問い合わせに対応する',
  })
  .withKnowledge({
    add: [
      { domain: 'customer-support', priority: 'high' },
      { domain: 'product-catalog', priority: 'medium' },
    ],
  })
  .build();

// 7. バリデーション実行
const validations = workflowEngine.runValidation(workflow.metadata.workflowId, template);

validations.forEach(validation => {
  console.log(`\n${validation.type} Validation: ${validation.status}`);
  validation.results.forEach(result => {
    if (!result.passed) {
      console.log(`  ❌ ${result.ruleName}: ${result.message}`);
      if (result.suggestion) {
        console.log(`     💡 ${result.suggestion}`);
      }
    }
  });
});

// 8. 承認リクエスト
const approval = workflowEngine.requestApproval(
  workflow.metadata.workflowId,
  'build',
  'phase-exit'
);

// 9. 承認処理
workflowEngine.submitApproval(
  workflow.metadata.workflowId,
  approval!.id,
  'tech-lead',
  'approved',
  'Looks good, ready for validation phase'
);

// 10. Validation フェーズへ進む
workflowEngine.completePhase(workflow.metadata.workflowId, 'build');
workflowEngine.startPhase(workflow.metadata.workflowId, 'validation');
```

### トライアル期間の管理

```typescript
// 1. Validation完了 → Trial開始
workflowEngine.completePhase(workflow.metadata.workflowId, 'validation');
workflowEngine.startPhase(workflow.metadata.workflowId, 'trial');

// 2. トライアル開始
const trial = workflowEngine.startTrial(workflow.metadata.workflowId);
console.log(`Trial Period: ${trial!.startDate} ~ ${trial!.endDate}`);

// 3. メトリクス更新（Day 1）
workflowEngine.updateTrialMetrics(workflow.metadata.workflowId, {
  sessionsCount: 15,
  avgResponseTime: 2.3,
  satisfactionScore: 4.2,
  successRate: 92,
  errorRate: 3,
  escalationRate: 5,
});

// 4. フィードバック追加
workflowEngine.addTrialFeedback(workflow.metadata.workflowId, {
  source: 'user',
  rating: 5,
  comments: '迅速で正確な回答でした',
  category: 'response-quality',
});

workflowEngine.addTrialFeedback(workflow.metadata.workflowId, {
  source: 'client',
  rating: 4,
  comments: '概ね良好だが、一部専門用語の説明が不足',
  category: 'knowledge',
});

// 5. チェックポイント作成（Day 7）
const checkpoint7 = workflowEngine.createTrialCheckpoint(
  workflow.metadata.workflowId,
  7,
  ['初週は好調', '満足度・成功率ともに目標達成']
);

console.log(`Day 7 Checkpoint: ${checkpoint7!.status}`); // 'on-track'

// 6. メトリクス更新（Day 15）
workflowEngine.updateTrialMetrics(workflow.metadata.workflowId, {
  sessionsCount: 150,
  avgResponseTime: 2.1,
  satisfactionScore: 4.3,
  successRate: 94,
  errorRate: 2,
  escalationRate: 4,
});

const checkpoint15 = workflowEngine.createTrialCheckpoint(
  workflow.metadata.workflowId,
  15,
  ['メトリクス改善傾向', 'ユーザーからの評価高い']
);

// 7. トライアル完了（Day 30）
workflowEngine.updateTrialMetrics(workflow.metadata.workflowId, {
  sessionsCount: 450,
  avgResponseTime: 1.9,
  satisfactionScore: 4.4,
  successRate: 95,
  errorRate: 1.5,
  escalationRate: 3.5,
});

const checkpoint30 = workflowEngine.createTrialCheckpoint(
  workflow.metadata.workflowId,
  30,
  ['全メトリクス目標達成', '本番採用を推奨']
);

workflowEngine.completeTrial(workflow.metadata.workflowId);

// 8. 採用判定
workflowEngine.makeAdoptionDecision(
  workflow.metadata.workflowId,
  'adopted',
  'product-owner',
  undefined
);

// 9. ワークフロー完了
workflowEngine.completePhase(workflow.metadata.workflowId, 'trial');
workflowEngine.startPhase(workflow.metadata.workflowId, 'adoption');
workflowEngine.completePhase(workflow.metadata.workflowId, 'adoption');

// 10. 進捗確認
const progress = workflowEngine.getWorkflowProgress(workflow.metadata.workflowId);
console.log(`Progress: ${progress.percentage}% (${progress.completed}/${progress.total} phases)`);
```

### カスタムバリデーションルール

```typescript
import { ValidationEngine } from './avatar-templates/workflow';

const validationEngine = new ValidationEngine();

// カスタムルールの追加
validationEngine.addRule({
  id: 'custom-escalation-path',
  name: 'エスカレーションパス設定',
  description: 'エスカレーション先が設定されているか',
  type: 'integration',
  severity: 'error',
  phase: ['build', 'validation'],
  check: (template) => {
    const t = template as any;
    return t.collaboration?.escalationPath && t.collaboration.escalationPath.length > 0;
  },
  message: 'エスカレーション先を設定してください',
});

// 検証実行
const result = validationEngine.validate(template, 'build', ['integration']);

console.log(`Status: ${result.status}`);
result.results.forEach(r => {
  console.log(`${r.passed ? '✅' : '❌'} ${r.ruleName}: ${r.message}`);
});

// ルールの取得
const allRules = validationEngine.getRules();
const securityRules = validationEngine.getRulesByType('security');
const buildPhaseRules = validationEngine.getRulesByPhase('build');

console.log(`Total Rules: ${allRules.length}`);
console.log(`Security Rules: ${securityRules.length}`);
console.log(`Build Phase Rules: ${buildPhaseRules.length}`);
```

### 条件付き採用

```typescript
// トライアル結果が良好だが、一部改善が必要な場合
workflowEngine.makeAdoptionDecision(
  workflow.metadata.workflowId,
  'conditional',
  'product-owner',
  [
    '専門用語の説明を強化すること',
    'エスカレーション基準を明確化すること',
    '2週間後にレビューを実施すること',
  ]
);

const wf = workflowEngine.getWorkflow(workflow.metadata.workflowId);
console.log('Conditions:', wf!.finalStatus?.conditions);
```

### ワークフローのキャンセル

```typescript
// 重大な問題が発覚した場合
workflowEngine.cancelWorkflow(
  workflow.metadata.workflowId,
  'セキュリティ上の重大な欠陥が発見されたため'
);

const wf = workflowEngine.getWorkflow(workflow.metadata.workflowId);
console.log(`Status: ${wf!.metadata.status}`); // 'cancelled'
```

## バリデーションルール

### デフォルトルール

| ルールID | タイプ | 重要度 | 説明 |
|---------|--------|--------|------|
| `schema-persona-required` | schema | error | ペルソナ必須フィールドチェック |
| `schema-knowledge-exists` | schema | warning | 知識ドメイン存在チェック |
| `capability-core-enabled` | capability | error | コア機能有効化チェック |
| `quality-response-time` | quality | warning | 応答時間設定チェック |
| `quality-satisfaction-target` | quality | info | 満足度目標チェック |
| `security-restricted-db` | security | critical | アクセス制限設定チェック |
| `integration-reporting` | integration | warning | レポート先設定チェック |

### 検証タイプ

- **schema**: スキーマ構造の検証
- **capability**: 機能設定の検証
- **quality**: 品質基準の検証
- **security**: セキュリティ設定の検証
- **integration**: 統合設定の検証

### 重要度レベル

- **info**: 情報提供（警告なし）
- **warning**: 警告（推奨事項）
- **error**: エラー（修正必須）
- **critical**: 致命的（即時対応必須）

## トライアルメトリクス

### 収集メトリクス

| メトリクス | 説明 | 目標値 |
|-----------|------|--------|
| `sessionsCount` | セッション数 | - |
| `avgResponseTime` | 平均応答時間（秒） | < 3.0 |
| `satisfactionScore` | 満足度スコア（1-5） | ≥ 4.0 |
| `successRate` | 成功率（%） | ≥ 90 |
| `errorRate` | エラー率（%） | ≤ 5 |
| `escalationRate` | エスカレーション率（%） | < 10 |

### チェックポイント評価

- **on-track**: すべてのメトリクスが目標達成
- **at-risk**: 一部メトリクスが目標に近い（許容範囲内）
- **failing**: 複数のメトリクスが目標未達

## 承認フロー

### 承認タイプ

- **phase-exit**: フェーズ完了承認
- **quality-check**: 品質チェック承認
- **stakeholder**: ステークホルダー承認

### デフォルト承認者

| フェーズ | 承認者 |
|---------|--------|
| requirements | Product Owner |
| design | Tech Lead, Product Owner |
| build | Tech Lead |
| validation | QA Lead |
| trial | Product Owner, Client Success |
| adoption | Product Owner, Tech Lead |

## アーキテクチャ

```
┌─────────────────────────────────────────┐
│         WorkflowEngine                  │
│  - ワークフロー管理                      │
│  - フェーズ進行制御                      │
│  - 承認フロー管理                        │
│  - トライアル期間管理                     │
└───────────┬─────────────────────────────┘
            │
            │ uses
            ↓
┌─────────────────────────────────────────┐
│       ValidationEngine                  │
│  - ルールベース検証                      │
│  - カスタムルール追加                     │
│  - 検証結果レポート                      │
└─────────────────────────────────────────┘
```

## ベストプラクティス

### 1. フェーズの適切な進行

```typescript
// ❌ 悪い例: フェーズをスキップ
workflowEngine.startPhase(workflowId, 'build');
workflowEngine.startPhase(workflowId, 'trial'); // validation をスキップ

// ✅ 良い例: 順次進行
workflowEngine.completePhase(workflowId, 'build');
workflowEngine.startPhase(workflowId, 'validation');
workflowEngine.runValidation(workflowId, template);
workflowEngine.completePhase(workflowId, 'validation');
workflowEngine.startPhase(workflowId, 'trial');
```

### 2. バリデーションの活用

```typescript
// ❌ 悪い例: バリデーションを実行しない
workflowEngine.completePhase(workflowId, 'build');

// ✅ 良い例: フェーズごとにバリデーション
const validations = workflowEngine.runValidation(workflowId, template);
const hasErrors = validations.some(v => v.status === 'failed');

if (hasErrors) {
  console.error('Validation failed, fix issues before proceeding');
} else {
  workflowEngine.completePhase(workflowId, 'build');
}
```

### 3. トライアルメトリクスの定期更新

```typescript
// ✅ 良い例: 定期的なメトリクス更新とチェックポイント
const trialDays = [7, 14, 21, 30];

trialDays.forEach(day => {
  // メトリクス更新
  workflowEngine.updateTrialMetrics(workflowId, getMetricsForDay(day));

  // チェックポイント作成
  workflowEngine.createTrialCheckpoint(workflowId, day);
});
```

## トラブルシューティング

### Q: バリデーションが失敗する

A: バリデーション結果を確認し、提案に従って修正してください。

```typescript
const validations = workflowEngine.runValidation(workflowId, template);

validations.forEach(v => {
  v.results.filter(r => !r.passed).forEach(result => {
    console.log(`Issue: ${result.message}`);
    console.log(`Suggestion: ${result.suggestion}`);
  });
});
```

### Q: 承認が進まない

A: すべての必須承認者が承認したか確認してください。

```typescript
const workflow = workflowEngine.getWorkflow(workflowId);
const approval = workflow!.approvals.find(a => a.id === approvalId);

console.log('Required:', approval!.requiredApprovers);
console.log('Approved by:', approval!.approvals.map(a => a.approver));
```

### Q: トライアルメトリクスが at-risk または failing になる

A: メトリクスを改善するか、条件付き採用を検討してください。

```typescript
const workflow = workflowEngine.getWorkflow(workflowId);
const latestCheckpoint = workflow!.trial?.checkpoints.slice(-1)[0];

if (latestCheckpoint?.status === 'at-risk') {
  console.log('Improvement areas:', latestCheckpoint.notes);
  // 改善アクションを実施
}
```

## 関連モジュール

- [Builder System](../builder/README.md) - アバターテンプレート構築
- [Base Types](../base/README.md) - 基本型定義
- [Categories](../categories/README.md) - カテゴリー別テンプレート
