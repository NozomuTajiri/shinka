# ひらく（HIRAKU）アバター

初期相談アバター - 診断コンサルタントとして最適なアバター構成を特定する

## 概要

「ひらく」は深い傾聴と探索的質問を通じて、クライアントの課題を特定し、最適なアバター構成を推薦する初期相談専門のアバターです。

## 特徴

### コミュニケーションスタイル

- **トーン**: 温かく受容的
- **アプローチ**: 深い傾聴・探索的質問
- **原則**: 非処方的ガイダンス

### 行動原則

1. 判断せずに聴く
2. 質問で導く
3. 沈黙を恐れない
4. 感情に寄り添う

## 5層企業診断モデル

ひらくは以下の5層で企業を体系的に診断します:

### Layer 1: 経営理念・ビジョン層
企業の存在意義と将来像を診断
- 経営理念の浸透度
- ビジョンの明確性
- 価値観の言語化

### Layer 2: 戦略・事業計画層
事業の方向性と計画を診断
- 主力事業の収益性
- 新規事業の計画
- 競合との差別化

### Layer 3: 組織・人材層
組織体制と人材を診断
- 後継者育成
- 社員モチベーション
- 権限委譲の状況

### Layer 4: 業務プロセス層
業務効率と実行力を診断
- 業務標準化
- DX推進状況
- PDCAサイクル

### Layer 5: 顧客・市場層
顧客関係と市場ポジションを診断
- 顧客フィードバック
- 市場変化への対応
- 長期的関係構築

## 使用方法

### 基本的な使用

```typescript
import { HirakuAvatar } from '@/avatars/hiraku';

// インスタンス作成
const hiraku = new HirakuAvatar();

// セッション開始
const session = hiraku.startSession('client-123');

// 対話処理
const result = await hiraku.processMessage(
  session.sessionId,
  'ユーザーの回答テキスト'
);

console.log(result.response);         // AIの応答
console.log(result.currentLayer);     // 現在のレイヤー (1-5)
console.log(result.progress);         // 進捗率 (0-100)
console.log(result.isComplete);       // 診断完了フラグ

// 診断結果取得
if (result.isComplete) {
  const sessionResult = hiraku.getSessionResult(session.sessionId);
  console.log(sessionResult?.issues);           // 特定された課題
  console.log(sessionResult?.recommendations);  // 推薦アバター
}
```

### ペルソナ情報取得

```typescript
const persona = hiraku.getPersona();
console.log(persona.name);              // 'ひらく'
console.log(persona.role);              // '初期相談コンサルタント'
console.log(persona.values);            // 行動価値観の配列
console.log(persona.behaviorPrinciples); // 行動原則の配列
```

### 診断レイヤー情報

```typescript
import { getDiagnosisLayer, getAllQuestions, getQuestionsByCategory } from '@/avatars/hiraku/diagnosis-model';

// 特定レイヤーの取得
const layer1 = getDiagnosisLayer(1);
console.log(layer1?.name);              // '経営理念・ビジョン層'
console.log(layer1?.questions);         // 質問の配列

// 全質問の取得
const allQuestions = getAllQuestions(); // 15問（5層 × 3問）

// カテゴリー別質問
const visionQuestions = getQuestionsByCategory('vision');
```

### アバターマッチング

```typescript
import { matchAvatarsToIssues, getAvatarProfile } from '@/avatars/hiraku/avatar-matching';
import type { IdentifiedIssue } from '@/avatars/hiraku/types';

// 課題からアバターをマッチング
const issues: IdentifiedIssue[] = [
  {
    id: 'issue-1',
    category: 'vision',
    description: 'ビジョンが不明確',
    priority: {
      urgency: 5,
      impact: 5,
      resourceRequired: 'high',
      recommendedAction: '専門アバターによる詳細分析を推奨',
    },
    relatedValues: ['ビジョン'],
  },
];

const recommendations = matchAvatarsToIssues(issues);
recommendations.forEach(rec => {
  console.log(rec.avatarName);         // '戦略（SENRYAKU）'
  console.log(rec.matchScore);         // マッチスコア (0-100)
  console.log(rec.reason);             // 推薦理由
  console.log(rec.suggestedApproach);  // 推奨アプローチ
});

// 特定アバターのプロフィール取得
const senryakuProfile = getAvatarProfile('senryaku');
console.log(senryakuProfile?.specialties); // ['経営戦略', '意思決定', '統合報告']
```

## 型定義

### HirakuSession

```typescript
interface HirakuSession {
  sessionId: string;           // セッションID
  clientId: string;            // クライアントID
  startedAt: Date;             // 開始日時
  currentLayer: number;        // 現在のレイヤー (1-5)
  answers: Map<string, string>; // 回答の記録
  identifiedIssues: IdentifiedIssue[]; // 特定された課題
  recommendedAvatars: AvatarRecommendation[]; // 推薦アバター
}
```

### IdentifiedIssue

```typescript
interface IdentifiedIssue {
  id: string;                  // 課題ID
  category: string;            // カテゴリー
  description: string;         // 説明
  priority: IssuePriorityMatrix; // 優先度
  relatedValues: string[];     // 関連する価値観
}
```

### AvatarRecommendation

```typescript
interface AvatarRecommendation {
  avatarId: string;            // アバターID
  avatarName: string;          // アバター名
  reason: string;              // 推薦理由
  matchScore: number;          // マッチスコア (0-100)
  suggestedApproach: string;   // 推奨アプローチ
}
```

## 推薦されるアバター

ひらくは診断結果に基づいて、以下のアバターを推薦します:

### 戦略（SENRYAKU）
- **専門分野**: 経営戦略、意思決定、統合報告
- **対象課題**: ビジョン、戦略

### 営業（EIGYO）
- **専門分野**: 営業プロセス、ヒーロー化、価値提案
- **対象課題**: 営業、顧客

### 市場（SHIJO）
- **専門分野**: マーケティング、市場分析、ブランディング
- **対象課題**: マーケティング、顧客、イノベーション

### 管理（KANRI）
- **専門分野**: 組織開発、マネジメント、人材育成
- **対象課題**: 組織、人材、実行力

## AI モデル

- **Model**: Claude Sonnet 4 (`claude-sonnet-4-20250514`)
- **Max Tokens**: 500
- **用途**: 自然な対話応答の生成

## テスト

```bash
# ユニットテスト実行
npm test src/avatars/hiraku/hiraku.test.ts

# カバレッジレポート
npm run test:coverage -- src/avatars/hiraku
```

## アーキテクチャ

```
hiraku/
├── index.ts              # メインクラス（HirakuAvatar）
├── types.ts              # 型定義
├── diagnosis-model.ts    # 5層診断モデル
├── avatar-matching.ts    # アバターマッチングエンジン
├── hiraku.test.ts        # ユニットテスト
└── README.md             # このファイル
```

## 成功条件

- TypeScriptエラー: 0件
- ESLintエラー: 0件
- テストカバレッジ: 80%以上
- 全15テストケース合格

## ライセンス

このコードはMiyabi Frameworkの一部として提供されています。

---

Created with Claude Sonnet 4.5
Generated with [Claude Code](https://claude.com/claude-code)
