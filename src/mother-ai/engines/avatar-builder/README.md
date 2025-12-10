# Avatar Builder Engine

新規アバターの必要性検証から構築・デプロイまでを自動化するエンジン

## 概要

Avatar Builder Engineは、市場ニーズやギャップ分析に基づいて新規AIアバターの構築を自動化します。Claude Sonnet 4を活用してペルソナ設計、ナレッジ構築、デプロイまでを一貫して実行します。

## 主な機能

### 1. トリガー検出
- 市場ニーズ分析
- 能力ギャップ分析
- クライアント要望検知
- 定期的なレビュー

### 2. 構築リクエスト管理
- リクエスト作成と追跡
- 優先度自動計算
- ステータス管理

### 3. AI駆動分析・承認
- Claude Sonnet 4による要件分析
- 既存アバターとの重複チェック
- ビジネス価値評価
- 技術的実現可能性検証

### 4. ブループリント生成
- ペルソナ仕様の自動生成
- ナレッジベース設計
- コミュニケーションスタイル定義
- 統合設定

### 5. 構築パイプライン
- 6段階の自動パイプライン実行
- ログ記録
- エラーハンドリング

### 6. 品質バリデーション
- 機能チェック
- 品質評価
- セキュリティスキャン
- パフォーマンス測定

## 使用方法

```typescript
import { AvatarBuilderEngine } from '@/mother-ai/engines/avatar-builder';
import type { AvatarRequirements, BuildTrigger } from '@/mother-ai/engines/avatar-builder';

// エンジンを初期化
const builder = new AvatarBuilderEngine();

// 構築トリガーを作成
const trigger: BuildTrigger = {
  type: 'client_request',
  source: 'カスタマーサポート部門',
  data: { department: 'support' },
  detectedAt: new Date(),
  confidence: 0.85,
};

// 要件を定義
const requirements: AvatarRequirements = {
  purpose: 'カスタマーサポート',
  targetAudience: ['顧客', 'サポート担当者'],
  domain: 'eコマース',
  capabilities: ['問い合わせ対応', 'FAQ検索', '注文状況確認'],
  communicationStyle: {
    tone: '親しみやすい',
    formality: 'semi-formal',
    empathy: 'high',
    directness: 'balanced',
  },
  knowledgeSources: ['FAQ', '製品カタログ'],
  integrations: ['CRM', 'チャットbot'],
};

// リクエストを作成
const request = builder.createBuildRequest(trigger, requirements);

// 分析・承認
const approval = await builder.analyzeAndApprove(request.requestId);

if (approval.approved) {
  // ブループリント生成
  const blueprint = await builder.generateBlueprint(request.requestId);

  // バリデーション
  const validation = await builder.validateBlueprint(blueprint.blueprintId);

  if (validation.passed) {
    // パイプライン実行
    const pipeline = await builder.executeBuildPipeline(blueprint.blueprintId);

    console.log('デプロイ完了:', pipeline.status);
  }
}
```

## パイプラインステージ

1. **validate-blueprint** - ブループリント検証
2. **generate-code** - コード生成
3. **setup-knowledge** - ナレッジセットアップ
4. **configure-integrations** - 統合設定
5. **run-tests** - テスト実行
6. **deploy** - デプロイ

## 型定義

すべての型定義は `types.ts` で管理されています:

- `AvatarBuildRequest` - 構築リクエスト
- `BuildTrigger` - 構築トリガー
- `AvatarBlueprint` - アバター設計図
- `BuildPipeline` - 構築パイプライン
- `BuildValidation` - バリデーション結果

## テスト

```bash
# ユニットテスト実行
npx vitest run src/mother-ai/engines/avatar-builder/index.test.ts

# カバレッジレポート
npx vitest run --coverage src/mother-ai/engines/avatar-builder/
```

## 品質基準

- TypeScriptエラー: 0件
- ESLintエラー: 0件
- テストカバレッジ: 目標80%以上
- 24個のユニットテスト（全パス）

## 技術仕様

- **言語**: TypeScript (Strict mode)
- **AIモデル**: Claude Sonnet 4 (claude-sonnet-4-20250514)
- **テストフレームワーク**: Vitest
- **コード品質**: ESLint

## 実装ファイル

```
avatar-builder/
├── index.ts           # メインエンジン実装
├── types.ts           # 型定義
├── index.test.ts      # ユニットテスト
└── README.md          # このファイル
```

## Issue

関連Issue: #84

## ライセンス

MITライセンス
