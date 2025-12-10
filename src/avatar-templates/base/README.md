# Avatar Base Template System

全アバター共通の基盤構造を定義するベーステンプレートシステムです。

## 概要

このモジュールは、Shinkaプロジェクトにおける全てのアバターが継承する基本設定とテンプレート構造を提供します。

## ファイル構成

```
base/
├── types.ts           # 型定義（全アバター共通の型システム）
├── base-template.ts   # デフォルトベーステンプレート実装
├── index.ts           # モジュールエクスポート
└── README.md          # このファイル
```

## 主要コンポーネント

### 1. 型定義 (types.ts)

#### 基本型

- `AvatarCategory`: アバターのカテゴリ分類
  - `management` - 経営管理系
  - `sales` - 営業系
  - `marketing` - マーケティング系
  - `operations` - 業務運用系
  - `organization` - 組織管理系
  - `specialized` - 専門特化系

- `AvatarStatus`: アバターのライフサイクル状態
  - `draft` - 草案
  - `review` - レビュー中
  - `trial` - トライアル
  - `active` - 稼働中
  - `deprecated` - 非推奨

- `CommunicationStyle`: コミュニケーションスタイル
  - `formal` - フォーマル
  - `friendly` - フレンドリー
  - `coaching` - コーチング
  - `directive` - 指示的
  - `collaborative` - 協調的

- `ExpertiseLevel`: 専門性レベル
  - `basic` - 基礎
  - `intermediate` - 中級
  - `advanced` - 上級
  - `expert` - エキスパート

#### 主要インターフェース

##### BaseAvatarTemplate

アバターテンプレートの完全な構造定義：

```typescript
interface BaseAvatarTemplate {
  metadata: AvatarTemplateMetadata;      // メタデータ
  persona: AvatarPersona;                // ペルソナ定義
  knowledge: KnowledgeDomain[];          // 知識ドメイン
  capabilities: AvatarCapabilities;      // 能力定義
  database: DatabasePermissions;         // DB権限
  collaboration: CollaborationSettings;  // 協調設定
  quality: QualityStandards;            // 品質基準
  learning: LearningMechanism;          // 学習機構
}
```

##### AvatarPersona

アバターのペルソナ（性格・特性）定義：

```typescript
interface AvatarPersona {
  id: string;
  name: string;                          // 英語名
  nameJa: string;                        // 日本語名
  role: string;                          // 役割
  description: string;                   // 説明
  background: string;                    // 背景
  communicationStyle: CommunicationStyle;
  tone: string[];                        // トーン
  principles: string[];                  // 行動原則
  strengths: string[];                   // 強み
  limitations: string[];                 // 制限事項
}
```

##### KnowledgeDomain

アバターが持つ知識領域の定義：

```typescript
interface KnowledgeDomain {
  id: string;
  name: string;
  description: string;
  expertiseLevel: ExpertiseLevel;
  topics: string[];                      // トピック一覧
  frameworks: string[];                  // フレームワーク
  sources: KnowledgeSource[];           // 知識ソース
  updatedAt: Date;
}
```

##### AvatarCapabilities

アバターの能力定義（コア能力と拡張能力）：

```typescript
interface AvatarCapabilities {
  core: CoreCapability[];                // コア能力
  extended: ExtendedCapability[];        // 拡張能力
  limitations: string[];                 // 制限事項
  integrations: Integration[];           // 統合設定
}
```

##### DatabasePermissions

データベースアクセス権限：

```typescript
interface DatabasePermissions {
  read: DatabaseAccess[];                // 読取権限
  write: DatabaseAccess[];               // 書込権限
  restricted: string[];                  // 制限対象
}
```

##### CollaborationSettings

他アバターとの協調設定：

```typescript
interface CollaborationSettings {
  canInitiate: string[];                 // 連携開始可能対象
  canRespond: string[];                  // 応答可能対象
  reportingTo: string[];                 // 報告先
  supervisedBy?: string;                 // 監督者
  protocols: ProtocolConfig[];          // プロトコル設定
}
```

##### QualityStandards

品質基準定義：

```typescript
interface QualityStandards {
  responseTime: ResponseTimeStandard;    // 応答時間基準
  accuracy: AccuracyStandard;           // 正確性基準
  satisfaction: SatisfactionStandard;   // 満足度基準
  metrics: QualityMetric[];             // 品質メトリクス
}
```

##### LearningMechanism

学習機構設定：

```typescript
interface LearningMechanism {
  enabled: boolean;
  mode: 'supervised' | 'reinforcement' | 'hybrid';
  feedbackSources: FeedbackSource[];
  updateFrequency: 'realtime' | 'daily' | 'weekly';
  retentionPolicy: RetentionPolicy;
}
```

### 2. デフォルトテンプレート (base-template.ts)

#### デフォルト設定

全アバターが継承する基本設定値：

- **DEFAULT_PERSONA**: 基本ペルソナ設定
  - コミュニケーションスタイル: `collaborative`
  - トーン: `professional`, `supportive`, `clear`
  - 行動原則: クライアント成功優先、データ重視、継続的価値提供、透明性

- **DEFAULT_CAPABILITIES**: 基本能力設定
  - コア能力: 対話処理、情報分析、提案生成
  - 拡張能力: レポート生成、複数アバター連携（デフォルト無効）

- **DEFAULT_DATABASE_PERMISSIONS**: DB権限設定
  - 読取: knowledge-base（フレームワーク、ベストプラクティス、業界データ）
  - 書込: session-log（会話、インサイト、アクションアイテム）
  - 制限: 財務情報、個人データ、認証情報

- **DEFAULT_COLLABORATION**: 協調設定
  - 連携開始: hiraku（開拓アバター）
  - 応答対象: senryaku、eigyo、shijo、kanri
  - 報告先: mother-ai
  - プロトコル: report、request、insight-sharing

- **DEFAULT_QUALITY_STANDARDS**: 品質基準
  - 応答時間: 目標3秒、最大10秒
  - 正確性: 最小80点、目標95点
  - 満足度: 最小4.0、目標4.5

- **DEFAULT_LEARNING**: 学習設定
  - モード: hybrid（教師あり + 強化学習）
  - フィードバック: 明示的評価、成果追跡、エンゲージメント指標
  - 更新頻度: daily
  - 保持期間: 成功パターン365日、失敗パターン90日

#### ヘルパー関数

##### createBaseTemplate

新規ベーステンプレートを作成：

```typescript
function createBaseTemplate(
  templateId: string,
  author: string
): BaseAvatarTemplate
```

**使用例:**

```typescript
import { createBaseTemplate } from '@/avatar-templates/base';

const template = createBaseTemplate('my-avatar', 'john.doe@example.com');
template.persona.name = 'CustomAvatar';
template.persona.nameJa = 'カスタムアバター';
```

##### mergeTemplates

ベーステンプレートとカスタマイズをマージ：

```typescript
function mergeTemplates(
  base: BaseAvatarTemplate,
  override: Partial<BaseAvatarTemplate>
): BaseAvatarTemplate
```

**使用例:**

```typescript
import { createBaseTemplate, mergeTemplates } from '@/avatar-templates/base';

const base = createBaseTemplate('sales-avatar', 'admin');
const customized = mergeTemplates(base, {
  persona: {
    name: 'SalesExpert',
    nameJa: '営業エキスパート',
    role: '営業支援',
  },
  knowledge: [
    {
      id: 'sales-techniques',
      name: '営業技法',
      description: '効果的な営業手法とテクニック',
      expertiseLevel: 'expert',
      topics: ['SPIN営業', 'ソリューション営業'],
      frameworks: ['BANT', 'MEDDIC'],
      sources: [],
      updatedAt: new Date(),
    },
  ],
});
```

## 使用方法

### 基本的な使い方

```typescript
import {
  createBaseTemplate,
  mergeTemplates,
  type BaseAvatarTemplate
} from '@/avatar-templates/base';

// 1. ベーステンプレート作成
const template = createBaseTemplate('new-avatar', 'developer@example.com');

// 2. カスタマイズ
template.persona.name = 'MyAvatar';
template.persona.nameJa = 'マイアバター';
template.persona.role = '専門アドバイザー';
template.persona.description = 'クライアントの課題解決を支援';

// 3. 知識ドメイン追加
template.knowledge.push({
  id: 'domain-expertise',
  name: '専門知識',
  description: '特定領域の専門的知識',
  expertiseLevel: 'advanced',
  topics: ['トピック1', 'トピック2'],
  frameworks: ['フレームワーク1'],
  sources: [],
  updatedAt: new Date(),
});

// 4. 能力拡張
template.capabilities.extended[0].enabled = true; // レポート生成を有効化
```

### 高度な使い方

```typescript
import {
  createBaseTemplate,
  mergeTemplates,
  DEFAULT_CAPABILITIES,
  type CoreCapability
} from '@/avatar-templates/base';

// カスタム能力を追加
const customCapability: CoreCapability = {
  id: 'custom-analysis',
  name: 'カスタム分析',
  description: '特殊な分析機能',
  enabled: true,
  requiredKnowledge: ['domain-expertise'],
};

const base = createBaseTemplate('advanced-avatar', 'admin');
const customized = mergeTemplates(base, {
  capabilities: {
    ...DEFAULT_CAPABILITIES,
    core: [...DEFAULT_CAPABILITIES.core, customCapability],
  },
});
```

## 拡張ポイント

### 新しいアバターカテゴリの追加

`AvatarCategory`型に新しいカテゴリを追加：

```typescript
export type AvatarCategory =
  | 'management'
  | 'sales'
  | 'marketing'
  | 'operations'
  | 'organization'
  | 'specialized'
  | 'custom-category'; // 新しいカテゴリ
```

### カスタムコミュニケーションスタイル

`CommunicationStyle`型に新しいスタイルを追加：

```typescript
export type CommunicationStyle =
  | 'formal'
  | 'friendly'
  | 'coaching'
  | 'directive'
  | 'collaborative'
  | 'analytical'; // 新しいスタイル
```

### 能力の拡張

新しい能力タイプを定義して追加：

```typescript
const newCapability: CoreCapability = {
  id: 'predictive-modeling',
  name: '予測モデリング',
  description: '将来の傾向を予測',
  enabled: true,
  requiredKnowledge: ['statistics', 'machine-learning'],
};
```

## ベストプラクティス

1. **一貫性の維持**: 全アバターがベーステンプレートを継承し、共通の構造を持つ
2. **最小限のカスタマイズ**: デフォルト設定をできるだけ使用し、必要な部分のみカスタマイズ
3. **明確な命名**: ID、名前は明確で一貫性のある命名規則に従う
4. **バージョン管理**: テンプレートのバージョンを適切に管理
5. **ドキュメント化**: カスタマイズ内容を適切にドキュメント化

## 統合例

### カテゴリ別テンプレート作成

```typescript
import { createBaseTemplate, mergeTemplates } from '@/avatar-templates/base';

// 営業カテゴリのベーステンプレート
export function createSalesTemplate(id: string, author: string) {
  const base = createBaseTemplate(id, author);
  return mergeTemplates(base, {
    metadata: {
      ...base.metadata,
      category: 'sales',
    },
    persona: {
      ...base.persona,
      communicationStyle: 'friendly',
      tone: ['enthusiastic', 'persuasive', 'professional'],
    },
  });
}
```

## 関連ドキュメント

- [Avatar Templates Builder](../builder/README.md) - テンプレートビルダー
- [Avatar Categories](../categories/README.md) - カテゴリ別テンプレート
- [Workflow System](../workflow/README.md) - ワークフローシステム

## 技術仕様

- **言語**: TypeScript（Strict mode）
- **モジュールシステム**: ES Modules (.js拡張子)
- **型安全性**: 完全な型定義
- **依存関係**: なし（ピュアな型定義と関数）

## ライセンス

プロジェクトライセンスに準拠

---

**最終更新**: 2025-12-10
**バージョン**: 1.0.0
**メンテナー**: Shinka Development Team
