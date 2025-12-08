# CEOコンサルアバター「戦略」(SENRYAKU)

経営層の思考パートナーとして、戦略的意思決定を支援し、統合的な経営報告を作成するAIアバター。

## 概要

「戦略」は、経営者が複雑な意思決定を行う際の思考パートナーとして機能します。付加価値経営®フレームワークをベースに、俯瞰的な視点から本質的な問いを投げかけ、戦略的な対話を通じて意思決定を支援します。

## 主な機能

### 1. 戦略的対話

- 本質的な問いを投げかける
- フレームワークを活用した思考整理
- 選択肢を広げてから絞り込む対話プロセス
- リスクと機会の両面提示

### 2. 3つの戦略フレームワーク

#### 付加価値経営®フレームワーク
6つの価値軸で経営を統合的に設計:
- ビジョン価値の明確化
- 戦略価値の設計
- 実行価値の強化
- 人材価値の最大化
- イノベーション価値の創出
- 顧客価値の深化

#### 戦略的意思決定マトリクス
複雑な意思決定を構造化:
- 選択肢の明確化
- 評価基準の設定
- リスク分析
- 統合評価

#### シナリオプランニング
不確実な未来に備える:
- 不確実性要因の特定
- シナリオ構築
- 戦略オプション設計
- モニタリング設計

### 3. 統合報告書生成

対話内容を基に、経営層向けの統合報告書を自動生成:
- エグゼクティブサマリー
- 戦略分析（現状認識・課題・機会）
- 優先順位付き推奨事項
- 実行可能なアクションプラン
- KPI設定

## 使用方法

### 基本的な使い方

```typescript
import { SenryakuAvatar } from './avatars/senryaku/index.js';

// アバターを初期化
const avatar = new SenryakuAvatar();

// セッションを開始
const session = avatar.startSession('client-123', 'strategy');

// 対話を処理
const result = await avatar.processMessage(
  session.sessionId,
  '中期経営計画の策定について相談したい'
);

console.log('応答:', result.response);
console.log('推奨フレームワーク:', result.suggestedFrameworks);
console.log('インサイト:', result.insights);
```

### 意思決定支援

```typescript
import type { DecisionContext } from './avatars/senryaku/types.js';

// 意思決定コンテキストを設定
const context: DecisionContext = {
  situation: '新規事業への投資判断',
  options: [
    {
      id: 'opt-1',
      name: '投資する',
      description: '1億円を投資して新規事業を立ち上げる',
      pros: ['市場拡大の可能性', '先行者利益'],
      cons: ['リスクが高い', '既存事業へのリソース配分'],
      risks: [
        {
          type: 'financial',
          probability: 'medium',
          impact: 'high',
          mitigation: '段階的投資でリスクを分散',
        },
      ],
      expectedOutcome: '3年後に黒字化、5年後に10億円規模',
    },
    {
      id: 'opt-2',
      name: '見送る',
      description: '既存事業に集中する',
      pros: ['リスク回避', '既存事業の強化'],
      cons: ['機会損失', '市場シェア低下リスク'],
      risks: [],
      expectedOutcome: '既存事業の安定成長',
    },
  ],
  constraints: ['予算制約（1億円以内）', '人材不足'],
  timeframe: 'medium',
  stakeholders: ['経営陣', '株主', '現場社員'],
};

avatar.setDecisionContext(session.sessionId, context);

// 対話を続ける
await avatar.processMessage(
  session.sessionId,
  'この投資判断について、どう考えるべきでしょうか？'
);
```

### 統合報告書生成

```typescript
// 対話を重ねた後、統合報告書を生成
const report = await avatar.generateIntegratedReport(session.sessionId);

console.log('エグゼクティブサマリー:', report.executiveSummary);
console.log('推奨事項:', report.recommendations);
console.log('アクションプラン:', report.actionPlan);
console.log('KPI:', report.kpis);
```

## ペルソナ特性

### コミュニケーションスタイル
- **トーン**: 知的で戦略的
- **アプローチ**: 俯瞰的視点・長期思考
- **原則**: 意思決定支援（最終判断は経営者に委ねる）

### 価値観
- 長期的な企業価値の最大化
- 論理と直感の統合
- 持続可能な成長
- ステークホルダーとの共創

### 行動原則
- 本質的な問いを投げかける
- データと直感の両方を重視
- 選択肢を広げてから絞り込む
- 実行可能性を常に意識

## 対話トピック

セッション開始時に選択可能なトピック:

- **strategy**: 戦略策定
- **decision**: 意思決定支援
- **planning**: 計画立案
- **review**: 振り返り・評価

## API仕様

### クラス: SenryakuAvatar

#### メソッド

##### startSession(clientId: string, topic: 'strategy' | 'decision' | 'planning' | 'review'): SenryakuSession
新しい戦略対話セッションを開始します。

##### async processMessage(sessionId: string, userMessage: string): Promise<{response: string; suggestedFrameworks: string[]; insights: string[];}>
ユーザーメッセージを処理し、戦略的な応答を生成します。

##### setDecisionContext(sessionId: string, context: DecisionContext): void
意思決定のコンテキストを設定します。

##### async generateIntegratedReport(sessionId: string): Promise<IntegratedReport>
対話内容を基に統合報告書を生成します。

##### getPersona(): SenryakuPersona
アバターのペルソナ情報を取得します。

##### getSession(sessionId: string): SenryakuSession | undefined
セッション情報を取得します。

## テスト

```bash
# テスト実行
npm test -- tests/avatars/senryaku

# カバレッジレポート
npm run test:coverage -- tests/avatars/senryaku
```

テストカバレッジ: 100% (39テスト全て成功)

## 技術仕様

- **言語**: TypeScript (Strict mode)
- **AIモデル**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Max Tokens**: 800 (対話), 2000 (レポート生成)
- **依存**: @anthropic-ai/sdk

## ディレクトリ構造

```
src/avatars/senryaku/
├── index.ts           # メインクラス実装
├── types.ts           # 型定義
├── frameworks.ts      # 戦略フレームワーク集
└── README.md          # このファイル

tests/avatars/senryaku/
├── senryaku.test.ts   # メインクラステスト (14テスト)
└── frameworks.test.ts # フレームワークテスト (25テスト)
```

## 使用例

### 例1: 中期経営計画の策定

```typescript
const avatar = new SenryakuAvatar();
const session = avatar.startSession('ceo-001', 'planning');

// 対話1
let result = await avatar.processMessage(
  session.sessionId,
  '3年後の売上目標を100億円に設定したいのですが、どう思われますか？'
);
console.log(result.response);
// → 「100億円という目標設定の背景にある戦略をお聞かせください...」

// 対話2
result = await avatar.processMessage(
  session.sessionId,
  '現在の主力事業は成熟期にあり、新規事業の立ち上げが必要です'
);
console.log(result.suggestedFrameworks);
// → ['value-based-management', 'scenario-planning']

// 報告書生成
const report = await avatar.generateIntegratedReport(session.sessionId);
```

### 例2: M&A意思決定

```typescript
const avatar = new SenryakuAvatar();
const session = avatar.startSession('ceo-002', 'decision');

const context: DecisionContext = {
  situation: '競合企業の買収検討',
  options: [
    /* ... */
  ],
  constraints: ['買収資金20億円', 'デューデリジェンス期間3ヶ月'],
  timeframe: 'short',
  stakeholders: ['取締役会', '主要株主', '金融機関'],
};

avatar.setDecisionContext(session.sessionId, context);

const result = await avatar.processMessage(
  session.sessionId,
  'この買収案件をどう評価すべきでしょうか？'
);

console.log(result.suggestedFrameworks);
// → ['decision-matrix', 'scenario-planning']
```

## ライセンス

MIT

## 関連ドキュメント

- [付加価値経営®について](https://example.com/value-based-management)
- [戦略フレームワーク詳細](./frameworks.ts)
- [型定義リファレンス](./types.ts)

---

Developed with Claude Sonnet 4 by Miyabi Framework
