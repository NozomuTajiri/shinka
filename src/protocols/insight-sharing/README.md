# Insight Sharing Protocol

インサイト共有プロトコル - Avatar間のベストプラクティス・学習共有システム

## 概要

Insight Sharing Protocolは、複数のAvatarが実務経験から得た知見（インサイト）を組織全体で共有・活用するためのプロトコルです。ベストプラクティス、学んだ教訓、成功パターン、失敗パターン、革新的アプローチなどを体系的に管理し、組織学習を促進します。

## 主要機能

### 1. インサイト管理

- **作成**: Avatarが実務から得た知見を記録
- **レビュー**: 専門家による検証
- **公開**: 組織全体への共有
- **アーカイブ**: 古い情報の整理

### 2. カタログ管理

- **ベストプラクティス集**: 検証済みの効果的なアプローチ
- **学んだ教訓集**: 失敗や課題から得られた学び
- **イノベーション事例集**: 新しいアプローチや革新的な解決策

### 3. 配信システム

- **Push配信**: 重要なインサイトを即座に通知
- **Digest配信**: 定期的なまとめ配信
- **On-demand配信**: 必要時に検索・取得

### 4. 学習統合

- **統合レベル**: awareness → understanding → application → mastery
- **適用ログ**: 実際の適用結果を記録
- **成功率追跡**: インサイトの有効性を測定

### 5. エンゲージメント

- **評価**: 5段階評価システム
- **コメント**: 質問・フィードバック・追加情報
- **関連リンク**: 関連するインサイトの紐付け

## アーキテクチャ

```
InsightEngine
├── Insight Management
│   ├── Capture (取得)
│   ├── Review (レビュー)
│   ├── Validate (検証)
│   ├── Publish (公開)
│   └── Archive (アーカイブ)
├── Distribution System
│   ├── Push Delivery
│   ├── Digest Delivery
│   └── On-demand Delivery
├── Learning Integration
│   ├── Integration Tracking
│   ├── Application Logging
│   └── Progress Monitoring
├── Catalog Management
│   ├── Best Practices
│   ├── Lessons Learned
│   └── Innovations
└── Engagement Tracking
    ├── Rating System
    ├── Comment System
    └── Analytics
```

## 使用例

### 基本的な使用例

```typescript
import { InsightEngine } from './protocols/insight-sharing';

// エンジン初期化
const engine = new InsightEngine();

// 1. インサイト作成
const insight = engine.captureInsight(
  'best-practice',
  'session',
  'senryaku',
  '市場参入戦略の成功パターン',
  '新規市場参入時の効果的なアプローチ手法',
  {
    industry: 'technology',
    companySize: 'startup',
    anonymized: true,
  },
  {
    problem: '新規市場参入時の認知度不足',
    solution: 'インフルエンサーマーケティングとコンテンツマーケティングの組み合わせ',
    implementation: [
      {
        order: 1,
        action: '業界インフルエンサーのリストアップ',
        duration: '1週間',
        prerequisites: [],
        tips: ['既存顧客からの紹介を活用'],
      },
      {
        order: 2,
        action: '価値提供型のコンテンツ作成',
        duration: '2週間',
        prerequisites: ['ターゲット顧客のペインポイント分析'],
        tips: ['具体的な数値データを含める'],
      },
    ],
    expectedOutcome: '3ヶ月で認知度30%向上',
    caveats: ['業界によって効果が異なる', '一定の予算が必要'],
  },
  {
    level: 'domain-specific',
    conditions: ['B2B市場', '予算50万円以上'],
    targetAvatars: ['shijo', 'eigyo'],
    industries: ['technology', 'consulting'],
    excludedScenarios: ['大企業の新規事業'],
  },
  [
    {
      id: 'ev-001',
      type: 'case-study',
      description: 'SaaS企業A社での成功事例',
      data: { growthRate: 0.35, timeframe: '3months' },
      source: 'internal',
      credibility: 'high',
    },
  ],
  ['marketing', 'growth', 'b2b']
);

// 2. レビューと検証
engine.submitForReview(insight.metadata.insightId);
engine.validateInsight(insight.metadata.insightId, 'mother-ai');
engine.publishInsight(insight.metadata.insightId);

// 3. 配信
const distribution = engine.distributeInsight(
  insight.metadata.insightId,
  ['shijo', 'eigyo', 'senryaku'],
  'push'
);

// 4. 受信確認
engine.acknowledgeDistribution(distribution!.distributionId, 'shijo');

// 5. 学習統合
const integration = engine.integrateInsight(insight.metadata.insightId, 'shijo');

// 6. 適用ログ
engine.logApplication(
  integration!.integrationId,
  'client-123',
  '新規SaaS市場参入プロジェクト',
  'success',
  'インフルエンサー経由で初月100件のリード獲得'
);

// 7. 評価
engine.rateInsight(insight.metadata.insightId, 'shijo', 5);

// 8. コメント
engine.addComment(
  insight.metadata.insightId,
  'eigyo',
  'エンタープライズ向けにも応用可能か？',
  'question'
);
```

### インサイト検索

```typescript
// カテゴリー別検索
const bestPractices = engine.getInsightsByCategory('best-practice');

// 詳細検索
const searchResults = engine.searchInsights({
  keywords: ['marketing', 'growth'],
  categories: ['best-practice', 'innovation'],
  targetAvatar: 'shijo',
  industry: 'technology',
  minRating: 4.0,
  status: ['published'],
});

// 推奨インサイト取得
const recommended = engine.getRecommendedInsights('shijo', 5);

// カタログから取得
const catalog = engine.getCatalog('best-practices');
const catalogInsights = engine.getCatalogInsights('best-practices');
```

### 統計情報

```typescript
const stats = engine.getInsightStatistics();
console.log('総インサイト数:', stats.total);
console.log('カテゴリー別:', stats.byCategory);
console.log('ステータス別:', stats.byStatus);
console.log('平均評価:', stats.avgRating);
console.log('総適用回数:', stats.totalApplications);
console.log('平均成功率:', stats.avgSuccessRate, '%');
```

## インサイトライフサイクル

```
Draft (下書き)
    ↓ submitForReview()
Review (レビュー中)
    ↓ validateInsight()
Validated (検証済み)
    ↓ publishInsight()
Published (公開済み)
    ↓ archiveInsight() または継続使用
Archived (アーカイブ)
```

## データ型

### InsightCategory

- `best-practice`: 検証済みのベストプラクティス
- `lesson-learned`: 失敗や課題から得た教訓
- `pattern`: 成功パターン
- `anti-pattern`: 避けるべきパターン
- `innovation`: 革新的なアプローチ

### InsightSource

- `session`: セッションから得られた知見
- `analysis`: 分析から導出された知見
- `feedback`: フィードバックベース
- `observation`: 観察から得られた知見
- `external`: 外部ソース

### InsightStatus

- `draft`: 下書き
- `review`: レビュー中
- `validated`: 検証済み
- `published`: 公開済み
- `archived`: アーカイブ

### ApplicabilityLevel

- `universal`: 普遍的に適用可能
- `domain-specific`: 特定領域に適用
- `context-specific`: 特定の文脈でのみ有効
- `experimental`: 実験段階

## 統合レベル

1. **Awareness** (認知): インサイトを知っている
2. **Understanding** (理解): インサイトを理解している
3. **Application** (適用): 実際に使用している (3回以上の成功適用)
4. **Mastery** (習得): 熟練して使いこなせる (5回以上の成功適用)

## ベストプラクティス

### インサイト作成時

1. **具体性**: 抽象的でなく、具体的なアクションを記述
2. **証拠**: 可能な限り定量データや事例を添付
3. **文脈**: 適用条件や制約を明確に記載
4. **匿名化**: クライアント情報は必ず匿名化

### 配信時

1. **ターゲティング**: 関連性の高いAvatarにのみ配信
2. **タイミング**: 緊急度に応じた配信方法を選択
3. **フォローアップ**: 適用結果のフィードバックを促進

### 評価時

1. **客観性**: 個人的な好みでなく、有用性を評価
2. **建設的**: 改善提案をコメントで共有
3. **継続的**: 複数回の適用後に再評価

## セキュリティとプライバシー

- すべてのクライアント情報は匿名化必須
- 機密情報は含めない
- 公開前に必ず検証プロセスを経る
- アクセス制御は配信システムで管理

## パフォーマンス最適化

- インデックス: カテゴリー、タグ、評価でインデックス化
- キャッシング: 頻繁にアクセスされるインサイトはキャッシュ
- ページネーション: 大量データは分割して取得
- 非同期配信: バックグラウンドで配信処理

## 今後の拡張予定

- [ ] AIによる自動インサイト抽出
- [ ] インサイト間の関連性自動検出
- [ ] 成功予測モデルの統合
- [ ] 外部ナレッジベース連携
- [ ] マルチメディアサポート（動画、画像）
- [ ] バージョン管理と変更履歴
- [ ] コラボレーション編集機能

## 関連プロトコル

- **Context Transfer Protocol**: セッション文脈の引き継ぎ
- **Escalation Protocol**: 複雑な問題のエスカレーション
- **Quality Standards Protocol**: 品質基準の維持

## ライセンス

This protocol is part of the Miyabi Framework.
