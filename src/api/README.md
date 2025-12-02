# Shinka Financial Analysis API

Express + TypeScriptで実装されたRESTful API

## 概要

決算書分析・コンサルティング提案生成のためのフルスタックAPI実装

### 主要機能

- **決算書管理**: PDF/Excel/CSVファイルのアップロード・パース
- **財務分析**: AI駆動の包括的財務分析（Claude Sonnet 4）
- **提案生成**: コンサルティング提案書の自動生成
- **ベンチマーク**: 業界基準値との比較
- **リアルタイム通知**: Server-Sent Events (SSE) による進捗配信

## ディレクトリ構造

```
src/api/
├── index.ts                    # Expressアプリケーションエントリーポイント
├── middleware/
│   ├── auth.ts                # JWT認証ミドルウェア
│   ├── rate-limiter.ts        # レート制限ミドルウェア
│   └── error-handler.ts       # エラーハンドリングミドルウェア
├── routes/
│   ├── statements.ts          # 決算書エンドポイント
│   ├── analysis.ts            # 分析エンドポイント
│   ├── proposals.ts           # 提案エンドポイント
│   └── benchmarks.ts          # ベンチマークエンドポイント
├── openapi.yaml               # OpenAPI 3.0仕様書
└── README.md                  # このファイル
```

## API仕様

### ベースURL

- **開発環境**: `http://localhost:3000/api/v1`
- **本番環境**: `https://api.shinka.example.com/api/v1`

### 認証

JWT Bearer認証を使用します。

```bash
Authorization: Bearer <JWT_TOKEN>
```

### エンドポイント

#### 決算書管理 (`/statements`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/statements/upload` | ファイルアップロード | 必須 |
| GET | `/statements/:id` | 決算書詳細取得 | 必須 |
| GET | `/statements` | 決算書一覧取得 | 必須 |
| DELETE | `/statements/:id` | 決算書削除（管理者のみ） | 必須 |

#### 財務分析 (`/analysis`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/analysis/run` | 分析実行（非同期） | 必須 |
| GET | `/analysis/:id` | 分析結果取得 | 必須 |
| GET | `/analysis/:id/stream` | 分析進捗SSE | 必須 |

#### コンサルティング提案 (`/proposals`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| POST | `/proposals/generate` | 提案生成（非同期） | 必須 |
| GET | `/proposals/:id` | 提案詳細取得 | 必須 |
| GET | `/proposals/:id/stream` | 生成進捗SSE | 必須 |
| GET | `/proposals/:id/export` | エクスポート（PDF/Excel/Markdown） | 必須 |

#### 業界ベンチマーク (`/benchmarks`)

| メソッド | パス | 説明 | 認証 |
|---------|------|------|------|
| GET | `/benchmarks` | 全業界一覧取得 | 不要 |
| GET | `/benchmarks/:industryCode` | 業界基準値取得 | 不要 |
| GET | `/benchmarks/:industryCode/metrics` | 詳細データ取得 | 必須 |

## クイックスタート

### 1. 環境変数設定

`.env` ファイルを作成：

```bash
# サーバー設定
PORT=3000
HOST=0.0.0.0
NODE_ENV=development

# JWT設定
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRATION=24h

# Anthropic API
ANTHROPIC_API_KEY=sk-ant-xxxxx

# アップロード設定
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# CORS設定
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

### 2. サーバー起動

```bash
# 開発モード（ホットリロード）
npm run dev

# 本番ビルド
npm run build

# 本番起動
node dist/api/index.js
```

### 3. ヘルスチェック

```bash
curl http://localhost:3000/health
```

レスポンス：

```json
{
  "status": "ok",
  "timestamp": "2024-12-02T10:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

## 使用例

### 決算書アップロード

```bash
curl -X POST http://localhost:3000/api/v1/statements/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@financial_statement.pdf" \
  -F "companyName=株式会社サンプル" \
  -F "fiscalYear=2023"
```

### 財務分析実行

```bash
curl -X POST http://localhost:3000/api/v1/analysis/run \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "statementId": "stmt_1234567890_abc123",
    "options": {
      "includeBenchmark": true,
      "includeAnomalyDetection": true
    }
  }'
```

### 分析進捗監視（SSE）

```bash
curl -N http://localhost:3000/api/v1/analysis/job_1234567890_abc123/stream \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 提案生成

```bash
curl -X POST http://localhost:3000/api/v1/proposals/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "株式会社サンプル",
    "industry": "情報通信業",
    "companySize": "中小企業（従業員100名）",
    "mainChallenges": "売上高は伸びているが利益率が低い"
  }'
```

### 提案書エクスポート（PDF）

```bash
curl http://localhost:3000/api/v1/proposals/proposal_1234567890_abc123/export?format=pdf \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -o proposal.pdf
```

### 業界ベンチマーク取得

```bash
# 業界一覧
curl http://localhost:3000/api/v1/benchmarks

# 特定業界の基準値
curl http://localhost:3000/api/v1/benchmarks/IT001
```

## レート制限

| エンドポイント | 制限 |
|---------------|------|
| グローバル | 100リクエスト/15分 |
| ファイルアップロード | 10リクエスト/15分 |
| 分析実行 | 20リクエスト/1時間 |
| エクスポート | 20リクエスト/15分 |
| SSEストリーム | 10リクエスト/5分 |

レート制限超過時のレスポンス（429 Too Many Requests）：

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Too many requests from this IP, please try again later",
    "details": "You have exceeded the rate limit of 100 requests per 15 minutes",
    "retryAfter": "900"
  }
}
```

## エラーハンドリング

全てのエラーレスポンスは統一フォーマット：

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Additional error details or validation errors",
    "timestamp": "2024-12-02T10:00:00.000Z",
    "path": "/api/v1/statements/upload"
  }
}
```

### エラーコード一覧

| コード | HTTPステータス | 説明 |
|-------|---------------|------|
| `VALIDATION_ERROR` | 400 | リクエストバリデーションエラー |
| `UNAUTHORIZED` | 401 | 未認証 |
| `FORBIDDEN` | 403 | 権限不足 |
| `NOT_FOUND` | 404 | リソース未検出 |
| `CONFLICT` | 409 | リソース競合 |
| `RATE_LIMIT_EXCEEDED` | 429 | レート制限超過 |
| `INTERNAL_ERROR` | 500 | サーバー内部エラー |

## Server-Sent Events (SSE)

分析・提案生成の進捗をリアルタイムで受信できます。

### イベントタイプ

#### 分析進捗 (`/analysis/:id/stream`)

- `status`: 初期状態
- `progress`: 進捗更新（0-100%）
- `logs`: ログメッセージ
- `complete`: 分析完了
- `error`: エラー発生

#### 提案生成進捗 (`/proposals/:id/stream`)

- `start`: 生成開始
- `progress`: 進捗更新
- `section_complete`: セクション完了
- `logs`: ログメッセージ
- `complete`: 生成完了
- `error`: エラー発生

### SSE受信例（JavaScript）

```javascript
const eventSource = new EventSource(
  'http://localhost:3000/api/v1/analysis/job_123/stream',
  {
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  }
);

eventSource.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  console.log(`Progress: ${data.progress}%`);
});

eventSource.addEventListener('complete', (event) => {
  const data = JSON.parse(event.data);
  console.log('Analysis complete!', data.result);
  eventSource.close();
});

eventSource.addEventListener('error', (event) => {
  const data = JSON.parse(event.data);
  console.error('Error:', data.error);
  eventSource.close();
});
```

## セキュリティ

- **Helmet**: セキュアなHTTPヘッダー設定
- **CORS**: クロスオリジンリソース共有制御
- **JWT**: トークンベース認証
- **レート制限**: DDoS対策
- **入力バリデーション**: zodによる型安全なバリデーション
- **ファイルサイズ制限**: 最大10MB

## パフォーマンス

- **圧縮**: gzip/brotli圧縮有効
- **非同期処理**: 長時間タスクはバックグラウンド実行
- **ストリーミング**: SSEによるリアルタイム通知
- **並列処理**: 財務分析は8並列実行

## テスト

```bash
# 全テスト実行
npm test

# カバレッジレポート
npm run test:coverage
```

## デプロイ

### Docker

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/api/index.js"]
```

### 環境変数（本番）

```bash
NODE_ENV=production
PORT=3000
JWT_SECRET=<strong-secret-key>
ANTHROPIC_API_KEY=<api-key>
ALLOWED_ORIGINS=https://app.example.com
```

## OpenAPI仕様書

完全なAPI仕様は `openapi.yaml` を参照してください。

Swagger UIで確認：

```bash
# swagger-uiをインストール
npm install -g swagger-ui-watcher

# 仕様書を起動
swagger-ui-watcher src/api/openapi.yaml
```

## トラブルシューティング

### JWT認証エラー

```
401 Unauthorized: Invalid or expired JWT token
```

- トークンの有効期限を確認
- `JWT_SECRET` が正しく設定されているか確認

### ファイルアップロードエラー

```
400 Bad Request: Invalid file type
```

- 許可されているファイル形式: PDF, Excel (.xlsx), CSV
- 最大ファイルサイズ: 10MB

### SSE接続エラー

- ブラウザのCORS設定を確認
- `ALLOWED_ORIGINS` に接続元URLが含まれているか確認
- nginxを使用している場合、バッファリングを無効化（`X-Accel-Buffering: no`）

## ライセンス

MIT

## サポート

Issue報告: [GitHub Issues](https://github.com/your-repo/issues)
