# CEO Avatar System

AI駆動のクライアント統括アバターシステム

## 概要

CEO Avatarは、各クライアントを統括する経営参謀AIアバターです。Claude Sonnet 4を活用し、以下の機能を提供します：

- 経営者との傾聴型対話
- 課題分析とタスク分解
- 専門アバターチームの統括
- 総合分析レポート生成

## アーキテクチャ

```
CEOAvatar（統括）
├── BaseAvatar（基底クラス）
├── CEODialogue（対話管理）
├── CEOTeamManager（チーム管理）
└── CEOReporter（レポート生成）
```

## 使用例

### 基本的な使い方

```typescript
import { CEOAvatar, CEODialogue, CEOTeamManager, CEOReporter } from '@/avatars';

// CEOアバター初期化
const ceo = new CEOAvatar({
  type: 'ceo',
  displayName: 'CEO Avatar',
  persona: '経営参謀として、戦略的思考と実行力を兼ね備えた存在',
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// セッション開始
const session = ceo.startSession('client-123');

// 対話開始
const dialogue = new CEODialogue(ceo);
const greeting = await dialogue.start('株式会社サンプル');
console.log(greeting);

// ユーザーメッセージ送信
const response = await ceo.sendMessage(
  '売上が伸び悩んでいます。何か良い打開策はありますか？'
);
console.log(response);
```

### ストリーミング対応

```typescript
// ストリーミングで応答を受け取る
await ceo.sendMessage(
  'DX推進について相談したいです',
  (chunk) => {
    if (chunk.type === 'content') {
      process.stdout.write(chunk.content);
    }
  }
);
```

### 対話フロー（推奨パターン）

```typescript
const dialogue = new CEODialogue(ceo);

// 1. 挨拶・関係構築
await dialogue.start('クライアント名');

// 2. ヒアリング
dialogue.recordHearing('売上が3ヶ月連続で減少している');
dialogue.recordHearing('競合他社のシェアが拡大している');

const question = await dialogue.generateNextQuestion();
console.log(question);

// 3. 課題分析
const analysis = await dialogue.moveToAnalysis();
console.log(analysis);

// 4. 提案
const proposal = await dialogue.moveToProposal();
console.log(proposal);

// 5. アクションプラン
const actionPlan = await dialogue.moveToActionPlan('バランス型アプローチ');
console.log(actionPlan);
```

### タスク管理

```typescript
// タスク作成
const task = ceo.createTask(
  'DX戦略の策定',
  '今後3年間のDX推進ロードマップを作成',
  'high',
  'technology'
);

// チーム管理
const teamManager = new CEOTeamManager(ceo);

// タスクを最適な専門家に割当
const assignment = await teamManager.assignTask(task);
console.log(`割当: ${assignment.assignedTo}`);

// 進捗レポート取得
const progress = teamManager.generateProgressReport();
console.log(`完了率: ${progress.completedTasks}/${progress.totalTasks}`);
```

### レポート生成

```typescript
const reporter = new CEOReporter(ceo);

// 総合分析レポート生成
const report = await reporter.generateReport({
  title: '2025年Q4 経営戦略レポート',
  includeSections: {
    executiveSummary: true,
    situation: true,
    analysis: true,
    options: true,
    risks: true,
    actionItems: true,
  },
  numberOfOptions: 3,
  detailLevel: 4,
});

// Markdownエクスポート
const markdown = reporter.exportToMarkdown(report);
console.log(markdown);
```

## 主要機能

### 1. 対話管理（CEODialogue）

- **傾聴型対話**: 相手の本音を引き出す質問生成
- **フェーズ管理**: 挨拶→ヒアリング→分析→提案→アクションプラン
- **コンテキスト保持**: 会話履歴から文脈を理解

### 2. チーム管理（CEOTeamManager）

- **最適割当**: タスク内容から最適な専門家を自動判定
- **進捗管理**: リアルタイムで全タスクの進捗を把握
- **調整・調停**: 専門家間の調整や意見対立の解決

### 3. レポート生成（CEOReporter）

- **エグゼクティブサマリー**: 経営層向けの簡潔なサマリー
- **戦略オプション**: 複数の選択肢を提示（保守・中道・革新）
- **リスク分析**: 発生確率×影響度マトリクス
- **アクションアイテム**: 具体的な実行計画

## 設定

### 環境変数

```bash
# .env ファイル
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

### CEOアバター設定例

```typescript
const config: CEOAvatarConfig = {
  type: 'ceo',
  displayName: 'CEO Avatar',
  persona: '経営参謀として、戦略的思考と実行力を兼ね備えた存在',
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514', // デフォルト
  maxTokens: 8000,
  temperature: 0.7,
  specialists: {
    // 将来的に専門アバターを追加
  },
};
```

## ペルソナ設計

CEOアバターは以下のペルソナで設計されています：

- **職位**: 経営参謀（Chief Strategy Officer相当）
- **経験**: 大手コンサルティングファーム20年以上
- **専門**: 経営戦略、組織変革、DX
- **性格**: 傾聴力に優れ、論理的かつ共感的

## 専門アバターチーム

CEOは以下の6名の専門家を統括：

| 専門家 | 専門分野 |
|--------|----------|
| business | 事業戦略、競争分析、M&A |
| technology | システムアーキテクチャ、DX推進 |
| marketing | ブランディング、顧客開拓 |
| finance | 財務戦略、資金調達、IR |
| legal | 法務、コンプライアンス、契約 |
| hr | 組織設計、採用、人材育成 |

## テスト

```bash
# 型チェック
npm run typecheck

# ユニットテスト（今後実装）
npm test
```

## ライセンス

MIT

## 作者

Miyabi Framework Team

---

**Note**: このシステムはClaude Sonnet 4を使用します。APIキーが必要です。
