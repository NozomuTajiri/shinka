# Shijo Avatar - マーケティングアバター「市場」

## 概要

**Shijo（市場）** は、ネオ・マーケットイン思想で潜在ニーズを発見し、収益システムを設計するマーケティングストラテジストアバターです。

## 特徴

- ネオ・マーケットイン思想による潜在ニーズ発見
- 3C分析、STP分析などの実践的フレームワーク
- AI駆動の市場分析とインサイト生成
- ポジショニングマップ自動作成
- コンテンツ戦略の策定

## ペルソナ

- **名前**: 市場（SHIJO）
- **役割**: マーケティングストラテジスト
- **コミュニケーションスタイル**: 洞察的で創造的
- **アプローチ**: ネオ・マーケットイン
- **原則**: 潜在ニーズの発見

## 主要機能

### 1. セッション管理

```typescript
import { ShijoAvatar } from './avatars/shijo/index.js';

const shijo = new ShijoAvatar();

// セッション開始
const session = shijo.startSession('client-123', 'market');
console.log(session.sessionId); // shijo-1234567890-abc123
```

### 2. 対話処理

```typescript
// ユーザーとの対話
const result = await shijo.processMessage(
  session.sessionId,
  '新しい市場機会を探しています'
);

console.log(result.response); // AIによる応答
console.log(result.suggestedFramework); // 推奨フレームワーク（例: '3c-analysis'）
console.log(result.insights); // 抽出されたインサイト
```

### 3. 市場分析

```typescript
// 包括的な市場分析
const analysis = await shijo.analyzeMarket(
  session.sessionId,
  'クラウドサービス市場',
  {
    marketSize: {
      value: 1000,
      unit: '億円',
      year: 2024,
      source: '業界レポート',
    },
  }
);

console.log(analysis.trends); // 市場トレンド（メガ・ショート）
console.log(analysis.segments); // 市場セグメント
console.log(analysis.competitors); // 主要競合
console.log(analysis.opportunities); // 機会
console.log(analysis.threats); // 脅威
```

### 4. ポジショニングマップ作成

```typescript
// ポジショニングマップの作成
const map = await shijo.createPositioningMap(
  session.sessionId,
  { label: '価格', min: '低価格', max: '高価格' },
  { label: '品質', min: '標準', max: '高品質' },
  [
    { name: '自社', isUs: true },
    { name: '競合A', isUs: false },
    { name: '競合B', isUs: false },
  ]
);

console.log(map.positions); // 各エンティティの位置（x, y座標）
console.log(map.whiteSpaces); // ホワイトスペース（空白地帯）
```

### 5. コンテンツ戦略策定

```typescript
// コンテンツ戦略の策定
const strategy = await shijo.createContentStrategy(
  session.sessionId,
  {
    name: 'マーケティング担当者',
    demographics: { age: '30-40', occupation: 'マーケター' },
    psychographics: ['データ重視', '効率志向'],
    goals: ['成果向上', 'スキルアップ'],
    frustrations: ['時間不足', '情報過多'],
    preferredChannels: ['ブログ', 'SNS'],
    contentPreferences: ['実践的', '事例ベース'],
  },
  ['認知度向上', 'リード獲得', 'ブランド構築']
);

console.log(strategy.contentPillars); // コンテンツの柱
console.log(strategy.channels); // 配信チャネル
console.log(strategy.contentCalendar); // コンテンツカレンダー
console.log(strategy.kpis); // KPI設定
```

### 6. 潜在ニーズ発見

```typescript
// ネオ・マーケットイン分析
const needs = await shijo.discoverLatentNeeds(
  ['効率化したい', 'コストを削減したい', '品質を向上したい'],
  'B2B SaaS企業のマーケティング部門'
);

console.log(needs.latentNeeds); // 潜在ニーズ
console.log(needs.jobsToBeDone); // ジョブ・トゥ・ビー・ダン
console.log(needs.newValuePropositions); // 新しい価値提案
```

## 分析フレームワーク

### 1. 3C分析

顧客・競合・自社の3視点から市場を分析

- **Customer（顧客）分析**: ターゲット顧客とニーズ
- **Competitor（競合）分析**: 競合の強み・弱み
- **Company（自社）分析**: 自社の強み・差別化

### 2. STP分析

セグメンテーション・ターゲティング・ポジショニング

- **Segmentation（市場細分化）**: 市場をセグメントに分割
- **Targeting（標的市場選定）**: ターゲットセグメント選定
- **Positioning（ポジショニング）**: 競合との差別化

### 3. ネオ・マーケットイン

潜在ニーズを発見し、新市場を創造

- **表層ニーズの把握**: 顧客が言葉にしているニーズ
- **深層ニーズの発見**: 本当に解決したいこと
- **新価値の創造**: 今までにない解決策

## フレームワークの取得

```typescript
import { MARKET_FRAMEWORKS, getFramework } from './avatars/shijo/market-analysis.js';

// すべてのフレームワークを取得
console.log(MARKET_FRAMEWORKS);

// 特定のフレームワークを取得
const framework = getFramework('3c-analysis');
console.log(framework?.steps); // フレームワークのステップ
```

## ユーティリティ関数

### セグメント魅力度評価

```typescript
import { evaluateSegmentAttractiveness } from './avatars/shijo/market-analysis.js';

const segment = {
  id: 'seg-1',
  name: '先進採用層',
  size: 120,
  characteristics: ['新技術に積極的', '予算あり'],
  needs: ['効率化', '競争力強化', '自動化', '最適化'],
  painPoints: ['導入の複雑さ', '運用負荷', 'コスト'],
  buyingBehavior: '価値重視',
  reachability: 'easy',
};

const evaluation = evaluateSegmentAttractiveness(segment);
console.log(evaluation.score); // 100点満点
console.log(evaluation.recommendation); // '優先ターゲット' | '検討対象' | '優先度低'
```

### 競合比較

```typescript
import { compareCompetitors } from './avatars/shijo/market-analysis.js';

const competitors = [
  {
    id: 'c1',
    name: '競合A',
    marketShare: 30,
    strengths: ['ブランド力', '営業力'],
    weaknesses: ['柔軟性不足'],
    strategy: 'シェア維持',
    positioning: '業界リーダー',
  },
  // ... 他の競合
];

const comparison = compareCompetitors(competitors);
console.log(comparison.leader); // トップシェアの競合
console.log(comparison.gaps); // 自社との差分
console.log(comparison.opportunities); // 機会（競合の弱み）
```

### トレンド影響分析

```typescript
import { analyzeTrendImpact } from './avatars/shijo/market-analysis.js';

const trend = {
  id: 't1',
  name: 'DX推進の加速',
  type: 'mega',
  description: 'デジタル変革が全産業で進行',
  impact: 'high',
  timeline: '3-5年',
  implications: ['デジタルサービス需要増加'],
};

const impact = analyzeTrendImpact(trend, 'クラウドサービス事業');
console.log(impact.opportunities); // ビジネス機会
console.log(impact.threats); // 脅威
console.log(impact.recommendations); // 推奨アクション
```

## セッション管理

```typescript
// セッションの取得
const session = shijo.getSession(sessionId);
console.log(session?.marketAnalysis); // 市場分析結果
console.log(session?.positioningMap); // ポジショニングマップ
console.log(session?.contentStrategy); // コンテンツ戦略
console.log(session?.insights); // 累積インサイト
```

## 型定義

すべての型定義は `types.ts` にあります:

- `ShijoPersona`: アバターのペルソナ定義
- `ShijoSession`: セッション情報
- `MarketAnalysis`: 市場分析結果
- `PositioningMap`: ポジショニングマップ
- `ContentStrategy`: コンテンツ戦略
- `MarketSegment`: 市場セグメント
- `Competitor`: 競合情報
- `Trend`: 市場トレンド
- `Persona`: ターゲットペルソナ
- その他多数

## 使用例

### 完全な市場分析フロー

```typescript
import { ShijoAvatar } from './avatars/shijo/index.js';

async function fullMarketAnalysis() {
  const shijo = new ShijoAvatar();

  // 1. セッション開始
  const session = shijo.startSession('company-abc', 'market');

  // 2. 市場分析
  const analysis = await shijo.analyzeMarket(
    session.sessionId,
    'AIツール市場',
    {
      marketSize: { value: 500, unit: '億円', year: 2024, source: 'IDC調査' },
    }
  );

  // 3. ポジショニング分析
  const map = await shijo.createPositioningMap(
    session.sessionId,
    { label: '価格', min: '低', max: '高' },
    { label: '機能性', min: '基本', max: '高度' },
    [
      { name: '自社製品', isUs: true },
      { name: 'ChatGPT', isUs: false },
      { name: 'Copilot', isUs: false },
    ]
  );

  // 4. 潜在ニーズ発見
  const needs = await shijo.discoverLatentNeeds(
    ['作業効率化', '品質向上', 'コスト削減'],
    'AIツールを検討中の中堅企業'
  );

  // 5. コンテンツ戦略
  const strategy = await shijo.createContentStrategy(
    session.sessionId,
    {
      name: '情報システム部門責任者',
      demographics: { age: '40-50', occupation: 'IT部門長' },
      psychographics: ['ROI重視', '安定志向'],
      goals: ['業務効率化', 'コスト最適化'],
      frustrations: ['導入リスク', 'ベンダーロックイン'],
      preferredChannels: ['専門メディア', 'ウェビナー'],
      contentPreferences: ['データ重視', '導入事例'],
    },
    ['認知拡大', 'リード獲得', '導入促進']
  );

  return { analysis, map, needs, strategy };
}
```

## テスト

```bash
# ユニットテスト実行
npm test -- src/avatars/shijo/shijo.test.ts

# カバレッジ付きテスト
npm run test:coverage -- src/avatars/shijo/
```

## ライセンス

このモジュールは Miyabi Framework の一部です。

## 関連ドキュメント

- [Miyabi Framework ドキュメント](../../README.md)
- [Avatar システム概要](../README.md)
- [API リファレンス](./types.ts)
