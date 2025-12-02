# Shinka - フロントエンド実装

Next.js 14 (App Router) で構築された財務分析システムのフロントエンド。

## 技術スタック

- **Next.js 14**: App Router採用
- **React 18**: クライアントサイドレンダリング
- **TypeScript**: Strict mode完全対応
- **Tailwind CSS**: ユーティリティファーストCSS
- **shadcn/ui**: UIコンポーネントライブラリ
- **React Query (TanStack Query)**: データフェッチング・キャッシング
- **Recharts**: データビジュアライゼーション
- **react-dropzone**: ファイルドラッグ&ドロップ
- **Lucide React**: アイコンライブラリ

## ディレクトリ構造

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx               # ルートレイアウト
│   ├── page.tsx                 # トップページ（ダッシュボード）
│   ├── globals.css              # グローバルスタイル
│   ├── providers.tsx            # React Queryプロバイダー
│   ├── upload/
│   │   └── page.tsx             # 決算書アップロードページ
│   ├── analysis/[id]/
│   │   └── page.tsx             # 分析結果ページ
│   └── proposals/[id]/
│       └── page.tsx             # 提案レポートページ
├── components/                   # Reactコンポーネント
│   ├── dashboard/
│   │   ├── MetricsCard.tsx      # 財務指標カード
│   │   ├── RadarChart.tsx       # レーダーチャート
│   │   └── BenchmarkChart.tsx   # ベンチマーク比較チャート
│   ├── upload/
│   │   └── FileDropzone.tsx     # ファイルドロップゾーン
│   └── proposal/
│       └── ProposalViewer.tsx   # 提案書ビューアー
├── hooks/                        # カスタムフック
│   ├── useAnalysis.ts           # 分析データフック
│   └── useProposal.ts           # 提案書データフック
└── lib/
    └── utils.ts                 # ユーティリティ関数

設定ファイル:
├── next.config.mjs              # Next.js設定
├── tailwind.config.ts           # Tailwind CSS設定
├── postcss.config.mjs           # PostCSS設定
└── tsconfig.json                # TypeScript設定
```

## 主要機能

### 1. トップページ（ダッシュボード）

**ファイル**: `src/app/page.tsx`

- ヒーローセクション
- 主要機能の紹介カード
- 最近の分析結果一覧（サンプルデータ）

### 2. 決算書アップロードページ

**ファイル**: `src/app/upload/page.tsx`

- 企業情報入力フォーム（企業名、決算年度）
- ドラッグ&ドロップファイルアップロード
- アップロード進捗表示
- バリデーション機能

**対応ファイル形式**:
- PDF (.pdf)
- Excel (.xlsx, .xls)
- CSV (.csv)

**最大ファイルサイズ**: 10MB

### 3. 分析結果ページ

**ファイル**: `src/app/analysis/[id]/page.tsx`

**表示内容**:
- 品質スコア（0-100点）
- アラート一覧（重要度別）
- 主要財務指標カード（ROE、自己資本比率、総資本回転率、売上高成長率）
- レーダーチャート（4つの視点: 収益性、安全性、効率性、成長性）
- ベンチマーク比較チャート（業界平均、上位25%との比較）

**機能**:
- 提案書生成ボタン
- 業界平均との比較
- 条件付きカラーリング（良好=緑、要改善=赤）

### 4. 提案レポートページ

**ファイル**: `src/app/proposals/[id]/page.tsx`

**表示内容**:
- エグゼクティブサマリー
- 詳細提案セクション（重要度順）
- 生成日時

**機能**:
- PDFエクスポート
- Excelエクスポート
- リアルタイム生成進捗表示（SSE対応）

## カスタムフック

### useAnalysis

**ファイル**: `src/hooks/useAnalysis.ts`

**提供機能**:
- `useAnalysis(id)`: 分析結果取得
- `useBenchmark(id)`: ベンチマークデータ取得
- `useUploadFinancialStatement()`: 決算書アップロード
- `useAnalyses()`: 分析一覧取得

**特徴**:
- React Query使用
- 自動リトライ（3回）
- キャッシング（5-10分）
- 楽観的更新

### useProposal

**ファイル**: `src/hooks/useProposal.ts`

**提供機能**:
- `useProposal(id)`: 提案書取得（ポーリング付き）
- `useProposalStream(id)`: SSEリアルタイム生成
- `useGenerateProposal()`: 提案書生成
- `useExportProposal(id)`: PDF/Excelエクスポート

**特徴**:
- 生成中は5秒ごとにポーリング
- Server-Sent Events (SSE) 対応
- ファイルダウンロード機能

## コンポーネント

### MetricsCard

財務指標を視覚的に表示するカードコンポーネント。

**プロパティ**:
- `title`: 指標名
- `value`: 指標値
- `unit`: 単位
- `change`: 前年比（オプション）
- `industryAverage`: 業界平均（オプション）
- `variant`: カラーテーマ（success/warning/danger）

### RadarChart

4つの財務視点（収益性、安全性、効率性、成長性）をレーダーチャートで可視化。

**特徴**:
- 自社、業界平均、上位25%を同時表示
- インタラクティブツールチップ
- レスポンシブデザイン

### BenchmarkChart

業界ベンチマークとの比較を棒グラフで表示。

**特徴**:
- 条件付きカラー（自社が平均より良い=緑、悪い=赤）
- カスタムツールチップ
- 3つのデータセット比較

### FileDropzone

ドラッグ&ドロップ対応のファイルアップロードコンポーネント。

**特徴**:
- ドラッグ&ドロップ対応
- ファイル形式バリデーション
- ファイルサイズ制限（10MB）
- アップロード進捗表示
- エラーハンドリング

### ProposalViewer

提案書の全文を表示するコンポーネント。

**特徴**:
- エグゼクティブサマリー
- 重要度順セクション表示
- PDF/Excelエクスポートボタン
- レスポンシブレイアウト

## スタイリング

### Tailwind CSS設定

**ファイル**: `tailwind.config.ts`

**カスタムカラー**:
- `primary`: メインカラー（青）
- `secondary`: セカンダリカラー
- `destructive`: 破壊的アクション（赤）
- `muted`: ミュートカラー（グレー）
- `accent`: アクセントカラー

**ダークモード**: クラスベース（`.dark`）

### グローバルスタイル

**ファイル**: `src/app/globals.css`

- CSS変数でカラーテーマ定義
- ライトモード/ダークモード対応
- Tailwindレイヤー（base/components/utilities）

## 開発コマンド

```bash
# フロントエンド開発サーバー起動
npm run dev

# バックエンド開発サーバー起動
npm run dev:backend

# フロントエンドビルド
npm run build

# バックエンドビルド
npm run build:backend

# 本番サーバー起動
npm start

# 型チェック
npm run typecheck

# Lint
npm run lint

# テスト
npm run test
```

## API統合

フロントエンドは以下のAPIエンドポイントを想定しています:

### 分析API

- `GET /api/analysis/:id` - 分析結果取得
- `GET /api/analysis/:id/benchmark` - ベンチマークデータ取得
- `GET /api/analyses` - 分析一覧取得
- `POST /api/upload` - 決算書アップロード

### 提案書API

- `GET /api/proposals/:id` - 提案書取得
- `GET /api/proposals/:id/stream` - SSEリアルタイム生成
- `POST /api/proposals/generate` - 提案書生成開始
- `GET /api/proposals/:id/export/pdf` - PDFエクスポート
- `GET /api/proposals/:id/export/excel` - Excelエクスポート

## レスポンシブデザイン

全ページ・コンポーネントはレスポンシブ対応:

- **Mobile**: 320px+
- **Tablet**: 768px+
- **Desktop**: 1024px+

Tailwindのブレークポイント:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

## パフォーマンス最適化

- **コード分割**: 動的インポート使用
- **キャッシング**: React Query で5-10分キャッシュ
- **画像最適化**: Next.js Image コンポーネント使用（必要に応じて）
- **SSR**: Server Componentsでデータフェッチ（一部）
- **Client Components**: インタラクティブなUIのみ

## アクセシビリティ

- セマンティックHTML使用
- キーボードナビゲーション対応
- aria-label適切に設定
- カラーコントラスト比準拠（WCAG 2.1 AA）

## ブラウザサポート

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 今後の拡張

- [ ] ダークモード切り替え
- [ ] 多言語対応（i18n）
- [ ] オフライン対応（PWA）
- [ ] リアルタイムコラボレーション
- [ ] アニメーション強化
- [ ] モバイルアプリ（React Native）

## トラブルシューティング

### ビルドエラー

```bash
# node_modules を削除して再インストール
rm -rf node_modules package-lock.json
npm install

# Next.js キャッシュクリア
rm -rf .next
npm run build
```

### 型エラー

```bash
# 型チェック実行
npm run typecheck
```

### Tailwind CSSが反映されない

```bash
# Tailwind設定確認
npx tailwindcss -i src/app/globals.css -o /dev/null --watch
```

## ライセンス

MIT

---

Powered by Miyabi Framework
