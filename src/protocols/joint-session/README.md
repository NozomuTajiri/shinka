# Joint Session Protocol

複数アバターの協働セッションを管理するプロトコル実装

## 概要

Joint Session Protocolは、複数のAIアバターが参加する構造化されたコラボレーションセッションを管理します。戦略策定、問題解決、危機対応など、様々なタイプのセッションをサポートします。

## 主要機能

- **セッション管理**: スケジューリング、開始、一時停止、再開、終了
- **議題進行**: 構造化された議題に従ったセッション進行
- **発言管理**: ターン制発言、反応、参照の管理
- **意思決定記録**: 決定事項、根拠、賛否の記録
- **アクションアイテム**: タスク割り当て、期限、優先度管理
- **セッションサマリー**: 自動的な要約生成と評価

## セッションタイプ

### 1. Strategy (戦略策定)
- 中長期的な戦略を策定するセッション
- 推奨参加者: 戦略、市場、営業アバター
- 標準時間: 90分

### 2. Problem Solving (問題解決)
- 特定の問題に対する解決策を見つけるセッション
- 推奨参加者: 開発、戦略、管理アバター
- 標準時間: 60分

### 3. Planning (計画立案)
- プロジェクトやイベントの計画を策定するセッション
- 標準時間: 60分

### 4. Review (レビュー)
- 過去の成果や進捗をレビューするセッション
- 標準時間: 45分

### 5. Crisis (危機対応)
- 緊急事態や危機的状況に対応するセッション
- 推奨参加者: 戦略、管理、営業アバター
- 標準時間: 45分

## 使用例

### 基本的なセッション作成と実行

```typescript
import { SessionEngine } from './protocols/joint-session';

// エンジン初期化
const engine = new SessionEngine();

// 戦略策定セッション作成
const session = engine.createSession(
  'strategy',
  'client-123',
  '2025年度事業戦略策定',
  'Q1-Q4の重点施策と目標KPI設定',
  new Date('2025-12-15T10:00:00'),
  'senryaku',
  [
    { avatarId: 'senryaku', role: 'lead', expertise: ['戦略立案', 'KPI設計'] },
    { avatarId: 'shijo', role: 'contributor', expertise: ['市場分析', '競合調査'] },
    { avatarId: 'eigyo', role: 'contributor', expertise: ['営業戦略', '顧客対応'] },
  ]
);

console.log(`セッションID: ${session.metadata.sessionId}`);

// セッション開始
engine.startSession(session.metadata.sessionId);

// 発言追加
const turn1 = engine.addTurn(
  session.metadata.sessionId,
  'senryaku',
  'statement',
  '本日は2025年度の事業戦略を策定します。まず現状分析から始めましょう。'
);

const turn2 = engine.addTurn(
  session.metadata.sessionId,
  'shijo',
  'statement',
  '市場調査の結果、競合A社が新規参入を発表しました。これは重要な環境変化です。'
);

// 反応追加
engine.addReaction(session.metadata.sessionId, turn2!.id, 'senryaku', 'agree');

// 意思決定を記録
const decision = engine.recordDecision(
  session.metadata.sessionId,
  '新規市場セグメント進出',
  'セグメントXへ2025年Q2から進出する',
  '競合参入前にポジションを確立する必要があるため',
  ['senryaku', 'shijo', 'eigyo'],
  [],
  []
);

// アクションアイテム追加
engine.addActionItem(
  session.metadata.sessionId,
  'セグメントX進出計画書を作成',
  'senryaku',
  new Date('2025-12-20'),
  'high',
  decision!.id
);

// 議題を進める
engine.advanceAgenda(session.metadata.sessionId);

// セッション終了とサマリー生成
const summary = engine.endSession(session.metadata.sessionId);

console.log('セッションサマリー:', summary);
```

### カスタム議題でのセッション作成

```typescript
const customSession = engine.createSession(
  'problem-solving',
  'client-456',
  'システムパフォーマンス改善',
  'レスポンスタイム遅延問題の解決',
  new Date('2025-12-12T14:00:00'),
  'hiraku',
  [
    { avatarId: 'hiraku', role: 'lead', expertise: ['システム設計', 'パフォーマンス'] },
    { avatarId: 'kanri', role: 'contributor', expertise: ['インフラ', 'モニタリング'] },
  ],
  [
    { order: 1, topic: '問題の詳細確認', duration: 10, lead: 'hiraku', expectedOutcome: '問題の定量化' },
    { order: 2, topic: 'ボトルネック特定', duration: 20, lead: 'hiraku', expectedOutcome: '根本原因の特定' },
    { order: 3, topic: '改善策の検討', duration: 15, lead: 'kanri', expectedOutcome: '実施可能な改善策リスト' },
    { order: 4, topic: '実施計画策定', duration: 15, lead: 'hiraku', expectedOutcome: '具体的な実施計画' },
  ]
);
```

### セッション検索

```typescript
// クライアント別セッション取得
const clientSessions = engine.getSessionsByClient('client-123');

// 参加者別セッション取得
const avatarSessions = engine.getSessionsByParticipant('senryaku');

// 今後予定されているセッション取得
const upcomingSessions = engine.getUpcomingSessions('senryaku');

console.log(`今後のセッション数: ${upcomingSessions.length}`);
upcomingSessions.forEach(s => {
  console.log(`- ${s.metadata.title} (${s.metadata.scheduledAt})`);
});
```

### テンプレート利用

```typescript
// 利用可能なテンプレート一覧取得
const templates = engine.getAllTemplates();

templates.forEach(t => {
  console.log(`テンプレート: ${t.name} (${t.type})`);
  console.log(`  推奨時間: ${t.defaultDuration}分`);
  console.log(`  推奨参加者: ${t.suggestedParticipants.join(', ')}`);
});

// 特定のテンプレート取得
const strategyTemplate = engine.getTemplate('strategy-session');
if (strategyTemplate) {
  console.log('戦略セッションのグラウンドルール:');
  strategyTemplate.groundRules.forEach(rule => {
    console.log(`  - ${rule}`);
  });
}
```

### ターン管理設定

```typescript
// ターン管理設定を変更
engine.setTurnConfig({
  maxTurnDuration: 120, // 2分
  turnOrder: 'round-robin',
  allowInterruptions: true,
  requireAcknowledgment: false,
});

// 現在の設定を確認
const config = engine.getTurnConfig();
console.log('ターン管理設定:', config);
```

### セッション一時停止と再開

```typescript
// セッション一時停止
const paused = engine.pauseSession(session.metadata.sessionId);
console.log(`一時停止: ${paused ? '成功' : '失敗'}`);

// セッション再開
const resumed = engine.resumeSession(session.metadata.sessionId);
console.log(`再開: ${resumed ? '成功' : '失敗'}`);
```

## 型定義

### JointSession

完全なセッション情報を含むメインオブジェクト:

- `metadata`: セッションのメタデータ（ID、タイプ、ステータス等）
- `participants`: 参加者リスト
- `agenda`: 議題アイテムのリスト
- `objectives`: セッション目標
- `groundRules`: 基本ルール
- `currentAgendaIndex`: 現在の議題インデックス
- `turns`: 発言履歴
- `decisions`: 決定事項リスト
- `actionItems`: アクションアイテムリスト
- `summary`: セッションサマリー（終了後）

### SessionSummary

セッション終了時に自動生成される要約:

- `duration`: セッション時間（分）
- `participantCount`: 参加者数
- `keyDiscussions`: 主要な議論トピック
- `decisionsCount`: 決定事項数
- `actionItemsCount`: アクションアイテム数
- `outcomes`: 成果リスト
- `nextSteps`: 次のステップ
- `overallAssessment`: 総合評価（highly-productive | productive | moderate | needs-improvement）

## 評価基準

セッションの総合評価は以下の基準で自動判定されます:

- **highly-productive**: 議題達成率90%以上 & 決定事項2件以上
- **productive**: 議題達成率70%以上 & 決定事項1件以上
- **moderate**: 議題達成率50%以上
- **needs-improvement**: 議題達成率50%未満

## アーキテクチャ

```
SessionEngine
  ├── sessions: Map<sessionId, JointSession>
  ├── templates: Map<templateId, SessionTemplate>
  └── turnConfig: TurnManagementConfig

JointSession
  ├── metadata: SessionMetadata
  ├── participants: Participant[]
  ├── agenda: AgendaItem[]
  ├── turns: Turn[]
  ├── decisions: Decision[]
  ├── actionItems: ActionItem[]
  └── summary?: SessionSummary
```

## ベストプラクティス

1. **事前準備**: セッション開始前に明確な議題と期待成果を定義
2. **タイムボックス**: 各議題に適切な時間を割り当て、守る
3. **記録**: 重要な発言、決定、アクションアイテムを漏れなく記録
4. **フォローアップ**: セッション後、アクションアイテムの進捗を追跡
5. **改善**: セッションサマリーの評価を次回の改善に活用

## 統合ポイント

このプロトコルは以下のコンポーネントと統合できます:

- **Avatar System**: 各アバターの役割と専門性に基づいた参加
- **Task Management**: アクションアイテムをタスク管理システムへ連携
- **Analytics**: セッションメトリクスの分析とレポート生成
- **Notification System**: セッション開始、決定事項のリアルタイム通知

## ライセンス

このコードは Shinka プロジェクトの一部です。
