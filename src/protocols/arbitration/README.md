# Arbitration Protocol

アバター間のコンフリクト検知・調停・解決を行う裁定プロトコル

## 概要

Arbitration Protocolは、複数のAIアバターが協働する際に発生する意見の相違や優先順位の競合を体系的に解決するためのプロトコルです。

## 主要コンポーネント

### ArbitrationEngine

コンフリクトのライフサイクル全体を管理するコアエンジン

#### 主な機能

- **コンフリクト検知**: アバター間の意見の相違を自動検出
- **影響度評価**: コンフリクトの重要度とビジネスインパクトを分析
- **調停セッション**: 当事者間の合意形成を支援
- **エスカレーション**: 解決困難な場合の上位権限への移譲
- **解決記録**: 教訓の蓄積と再発防止

## コンフリクトタイプ

| タイプ | 説明 | 推奨戦略 | 自動解決 |
|--------|------|----------|----------|
| `recommendation` | 異なるアバターが相反する提案を行う | consensus | No |
| `priority` | リソース・時間の優先順位で意見が分かれる | authority | Yes |
| `resource` | 同じリソースに対する競合 | compromise | Yes |
| `approach` | 問題解決アプローチが根本的に異なる | consensus | No |
| `scope` | 担当範囲・責任の境界が曖昧 | authority | Yes |

## 重要度レベル

- **low**: 影響範囲が限定的、柔軟な当事者
- **medium**: 複数の領域に影響、中程度の緊急性
- **high**: 広範な影響、複数の剛直な立場
- **critical**: 2名以上の剛直な当事者、ビジネスクリティカル

## エスカレーションパス

### Level 1: 戦略アバター (Senryaku)
- **タイムアウト**: 24時間
- **権限**: Advisory（助言）
- **トリガー**: 当事者間で合意に至らない

### Level 2: Mother AI
- **タイムアウト**: 48時間
- **権限**: Binding（拘束力あり）
- **トリガー**: クライアントへの影響が高い

### Level 3: Human Supervisor
- **タイムアウト**: 72時間
- **権限**: Binding（最終決定）
- **トリガー**: 重大なビジネス影響、AIでは判断困難

## 使用例

### 基本的な使い方

```typescript
import { ArbitrationEngine } from './protocols/arbitration';

// エンジン初期化
const engine = new ArbitrationEngine();

// コンフリクト検知
const conflict = engine.detectConflict(
  'recommendation',
  [
    {
      avatarId: 'keihi-avatar',
      position: 'クラウド移行を優先すべき',
      rationale: ['コスト削減効果が大きい', '保守性向上'],
      supportingEvidence: ['ROI分析レポート', '類似事例'],
      flexibility: 'moderate',
    },
    {
      avatarId: 'hr-avatar',
      position: '人事システム刷新を優先すべき',
      rationale: ['従業員満足度向上', '採用競争力強化'],
      supportingEvidence: ['従業員アンケート', '離職率データ'],
      flexibility: 'rigid',
    },
  ],
  'client-abc-123',
  '2025年Q1の優先プロジェクトについて意見が分かれています',
  'クライアントは両方のプロジェクトを希望していますが、予算制約により1つしか実施できません'
);

console.log(`Conflict ID: ${conflict.metadata.conflictId}`);
console.log(`Severity: ${conflict.metadata.severity}`);
console.log(`Recommended Strategy: ${engine.recommendStrategy(conflict.metadata.conflictId)}`);
```

### 分析と調停

```typescript
// 分析開始
engine.startAnalysis(conflict.metadata.conflictId);

// 戦略アバターによる調停セッション
const session = engine.startMediation(
  conflict.metadata.conflictId,
  'senryaku-avatar'
);

if (session) {
  console.log(`Mediation Session: ${session.sessionId}`);
  console.log(`Agenda: ${session.agenda.join(', ')}`);

  // 調停結果の記録
  engine.completeMediationSession(session.sessionId, {
    success: true,
    agreements: [
      'Q1はクラウド移行を優先',
      'Q2に人事システム刷新を実施',
      '両プロジェクトの段階的実施計画を策定',
    ],
    remainingIssues: [],
    nextSteps: [
      '詳細実施計画の作成',
      'クライアントへの提案',
    ],
  });
}
```

### エスカレーション

```typescript
// 調停が失敗した場合のエスカレーション
const escalationPath = engine.escalate(conflict.metadata.conflictId);

if (escalationPath) {
  console.log(`Escalated to: ${escalationPath.escalateTo}`);
  console.log(`Authority: ${escalationPath.authority}`);
  console.log(`Timeout: ${escalationPath.timeoutHours} hours`);
}
```

### 解決と記録

```typescript
// コンフリクト解決
engine.resolveConflict(
  conflict.metadata.conflictId,
  'consensus',
  'Q1はクラウド移行、Q2は人事システム刷新を実施する段階的アプローチを採用',
  '両プロジェクトの重要性を認識しつつ、リスク分散とリソース最適化の観点から段階実施が最適',
  ['keihi-avatar', 'hr-avatar', 'senryaku-avatar'],
  [],
  [
    'Q1終了時にQ2プロジェクトの再評価を実施',
    '予算状況により優先順位を見直す可能性あり',
  ],
  [
    '早期の合意形成には客観的なROIデータが有効',
    '段階的アプローチは両立困難な要求に対する有力な選択肢',
  ]
);

// コンフリクトクローズ
engine.closeConflict(conflict.metadata.conflictId);
```

### 統計とモニタリング

```typescript
// アクティブなコンフリクトを取得
const activeConflicts = engine.getActiveConflicts();
console.log(`Active conflicts: ${activeConflicts.length}`);

// 特定アバターに関連するコンフリクトを取得
const avatarConflicts = engine.getConflictsByParty('keihi-avatar');
console.log(`Conflicts involving keihi-avatar: ${avatarConflicts.length}`);

// 統計情報
const stats = engine.getConflictStatistics();
console.log(`Total conflicts: ${stats.total}`);
console.log(`Average resolution time: ${stats.avgResolutionTimeHours} hours`);
console.log('By status:', stats.byStatus);
console.log('By type:', stats.byType);
```

## ベストプラクティス

### 1. 早期検知

```typescript
// コンフリクトの兆候を早期に検知
// 例: 異なるアバターが同じトピックに対して異なる結論を出した場合
if (avatar1.conclusion !== avatar2.conclusion) {
  const conflict = engine.detectConflict(/* ... */);
}
```

### 2. 柔軟性の評価

```typescript
// 当事者の柔軟性を正確に評価
const partyInfo = {
  avatarId: 'avatar-id',
  position: '...',
  rationale: ['...'],
  supportingEvidence: ['...'],
  flexibility: position.isNegotiable ? 'flexible' : 'rigid',
};
```

### 3. 影響度の評価

```typescript
// ビジネスインパクトを考慮
const conflict = engine.detectConflict(
  type,
  parties,
  clientId,
  description,
  `緊急度: 高, 影響範囲: 全社, 予算: $100K`
);
```

### 4. 教訓の活用

```typescript
// 解決時に必ず教訓を記録
engine.resolveConflict(
  conflictId,
  strategy,
  decision,
  rationale,
  acceptedBy,
  rejectedBy,
  conditions,
  [
    '同様のコンフリクトを防ぐために事前の合意形成プロセスを導入',
    'ROI分析を標準化してデータに基づく意思決定を促進',
  ]
);
```

## アーキテクチャ設計

### 状態遷移

```
detected → analyzing → mediation → resolved → closed
              ↓             ↓
           escalated → escalated (Level 2, 3)
```

### データ永続化

現在の実装はインメモリですが、本番環境では以下を推奨:

```typescript
// データベースへの永続化
import { ConflictRepository } from './repositories/conflict-repository';

class ArbitrationEngine {
  constructor(private repository: ConflictRepository) {
    // ...
  }

  async detectConflict(/* ... */): Promise<ConflictCase> {
    const conflict = /* create conflict */;
    await this.repository.save(conflict);
    return conflict;
  }
}
```

### イベント駆動アーキテクチャ

```typescript
// イベント発行
class ArbitrationEngine {
  private eventBus: EventBus;

  detectConflict(/* ... */): ConflictCase {
    const conflict = /* create conflict */;
    this.eventBus.emit('conflict.detected', conflict);
    return conflict;
  }

  resolveConflict(/* ... */): boolean {
    // ...
    this.eventBus.emit('conflict.resolved', conflict);
    return true;
  }
}
```

## 拡張性

### カスタムルールの追加

```typescript
// 組織固有のルールを追加
engine.addRule({
  id: 'custom-rule-1',
  conflictType: 'recommendation',
  condition: 'セキュリティ関連の場合',
  recommendedStrategy: 'authority',
  escalationThreshold: 6, // 6時間で即エスカレーション
  autoResolvable: false,
});
```

### カスタムエスカレーションパス

```typescript
// 組織階層に合わせたエスカレーションパス
engine.addEscalationPath({
  level: 4,
  escalateTo: 'cto',
  triggerConditions: ['技術的に重大な決定', 'アーキテクチャ変更'],
  timeoutHours: 96,
  authority: 'binding',
});
```

## トラブルシューティング

### Q: コンフリクトが自動解決されない

A: `autoResolvable: false` のルールが適用されています。調停セッションを開始してください。

### Q: エスカレーションパスが見つからない

A: 最大エスカレーションレベル（Level 3）に達しています。人間の介入が必要です。

### Q: 調停セッションが完了できない

A: セッションIDが正しいか、アウトカムが適切に設定されているか確認してください。

## 関連プロトコル

- **Feedback Protocol**: アバター間のフィードバック共有
- **Collaboration Protocol**: タスク協働プロトコル
- **Escalation Protocol**: 一般的なエスカレーション手順

## メンテナンス

### ログ分析

```typescript
// 定期的にコンフリクト統計を分析
const stats = engine.getConflictStatistics();
if (stats.avgResolutionTimeHours > 48) {
  console.warn('平均解決時間が長すぎます。プロセス改善が必要です。');
}
```

### ルールの見直し

```typescript
// 四半期ごとにルールの有効性を評価
const resolvedConflicts = engine.getConflictsByStatus('resolved');
const ruleEffectiveness = analyzeRuleEffectiveness(resolvedConflicts);
```

## ライセンス

MIT License

## 貢献

プルリクエストを歓迎します。主要な変更については、まずIssueを開いて変更内容を議論してください。

---

Generated by Miyabi Framework
