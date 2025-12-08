# データベースセットアップガイド

Issue #62で定義されたDB詳細設計に基づくPrismaスキーマのセットアップ手順

## 前提条件

- Node.js 18.x以上
- PostgreSQL 14.x以上
- npm または yarn

## 環境構築

### 1. PostgreSQLのインストール

#### macOS (Homebrew)

```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Ubuntu/Debian

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

#### Docker

```bash
docker run --name customer-cloud-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=customer_cloud \
  -p 5432:5432 \
  -d postgres:14
```

### 2. データベース作成

PostgreSQLに接続してデータベースを作成：

```bash
psql -U postgres

CREATE DATABASE customer_cloud;
\q
```

### 3. 環境変数設定

`.env` ファイルを作成（`.env.example` をコピー）：

```bash
cp .env.example .env
```

`.env` ファイルを編集してDATABASE_URLを設定：

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/customer_cloud?schema=public
```

## Prismaセットアップ

### 1. Prismaクライアント生成

```bash
npx prisma generate
```

### 2. マイグレーション実行

```bash
# 開発環境でのマイグレーション作成
npx prisma migrate dev --name init

# 本番環境でのマイグレーション適用
npx prisma migrate deploy
```

### 3. Prisma Studio起動（データベース管理UI）

```bash
npx prisma studio
```

ブラウザで `http://localhost:5555` にアクセスしてデータを確認・編集できます。

## データベーススキーマ概要

### 7つの主要テーブル

#### 1. ClientProfile（クライアント企業プロファイル）

クライアント企業の基本情報と経営状況を管理

- 会社名、業種、従業員数、売上高、営業利益率
- 組織構造（JSON形式）
- 経営課題、強み、弱み
- 契約情報

#### 2. KeyPerson（主要担当者）

クライアント企業の主要担当者情報

- 氏名、役職、連絡先
- 対話スタイルメモ
- 決裁権限レベル（executive/manager/member）

#### 3. AvatarActivityLog（アバター活動ログ）

AIアバターの活動記録とインサイト抽出

- 活動種別（面談/提案/分析/レポート/アラート/内部協議）
- セッション時間と参加者
- サマリと全文記録
- 抽出インサイト、アクションアイテム
- 品質評価

#### 4. AvatarConfiguration（アバター構成）

AIアバターの設定と能力定義

- アバター名、カテゴリ、説明
- コアコンピテンシー
- アクセス可能なデータベース/API
- 行動原則、ペルソナ設定
- 学習設定

#### 5. AvatarGenerationRule（アバター生成ルール）

動的アバター生成の条件と判断基準

- トリガー条件
- 生成判断基準
- 生成プロセス定義
- 統廃合ルール

#### 6. DiagnosisScenario（診断質問シナリオ）

クライアント診断用の質問シナリオ管理

- シナリオ構造
- 質問フロー（分岐・条件含む）
- 診断ロジック
- 出力テンプレート

#### 7. CrossClientInsight（横断インサイト）

クライアント横断的なインサイトと事例管理

- インサイト種別
- 匿名化事例集
- 適用条件（業種、企業規模）
- 配信制御（信頼度ベース）
- 品質管理（レビューステータス）

## 使用例

### Prismaクライアントのインポート

```typescript
import { prisma } from '@/database/prisma-client';

// クライアントプロファイル作成
const client = await prisma.clientProfile.create({
  data: {
    companyName: '株式会社サンプル',
    industry: '製造業',
    employeeCount: 500,
    annualRevenue: 10000000000,
    operatingMargin: 5.2,
    contractStatus: 'active',
    businessChallenges: ['売上拡大', 'DX推進'],
    strengths: ['技術力', 'ブランド力'],
    weaknesses: ['マーケティング', '人材不足'],
  },
});

// 主要担当者追加
const keyPerson = await prisma.keyPerson.create({
  data: {
    clientId: client.id,
    fullName: '田中 太郎',
    position: '代表取締役社長',
    email: 'tanaka@example.com',
    authorityLevel: 'executive',
  },
});

// アバター活動ログ作成
const log = await prisma.avatarActivityLog.create({
  data: {
    clientId: client.id,
    avatarId: 'avatar-uuid',
    activityType: 'meeting',
    sessionStart: new Date(),
    summary: '経営課題ヒアリング',
    qualityScore: 85.5,
  },
});
```

### トランザクション例

```typescript
import { transaction } from '@/database/prisma-client';

await transaction(async (tx) => {
  // 複数の操作をアトミックに実行
  const client = await tx.clientProfile.create({
    data: { /* ... */ },
  });

  await tx.keyPerson.create({
    data: {
      clientId: client.id,
      /* ... */
    },
  });
});
```

### データベース接続チェック

```typescript
import { checkDatabaseConnection } from '@/database/prisma-client';

const isConnected = await checkDatabaseConnection();
if (!isConnected) {
  console.error('Database connection failed');
}
```

## マイグレーション管理

### 新しいマイグレーション作成

```bash
# スキーマ変更後にマイグレーション作成
npx prisma migrate dev --name add_new_feature
```

### マイグレーション状態確認

```bash
npx prisma migrate status
```

### マイグレーションリセット（開発環境のみ）

```bash
# データベースをリセットして最初からマイグレーション
npx prisma migrate reset
```

## トラブルシューティング

### 接続エラー

```
Error: Can't reach database server at `localhost:5432`
```

**解決策**:

1. PostgreSQLが起動しているか確認
   ```bash
   # macOS
   brew services list | grep postgresql

   # Linux
   sudo systemctl status postgresql
   ```

2. DATABASE_URLが正しいか確認
3. ファイアウォール設定を確認

### マイグレーションエラー

```
Error: P3009 - Migration failed
```

**解決策**:

1. マイグレーションファイルを確認
2. データベースのバックアップを取得
3. `npx prisma migrate reset` でリセット（開発環境のみ）

### Prismaクライアント生成エラー

```
Error: Prisma schema validation failed
```

**解決策**:

1. `prisma/schema.prisma` の文法を確認
2. `npx prisma format` でフォーマット
3. `npx prisma validate` で検証

## ベストプラクティス

### 1. コネクションプール設定

本番環境では `DATABASE_URL` にコネクションプールパラメータを追加：

```env
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public&connection_limit=10&pool_timeout=30
```

### 2. ログ設定

本番環境では必要最小限のログのみ出力：

```typescript
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'production'
    ? ['error']
    : ['query', 'error', 'warn'],
});
```

### 3. バックアップ

定期的なデータベースバックアップを設定：

```bash
# pg_dumpでバックアップ
pg_dump -U postgres customer_cloud > backup_$(date +%Y%m%d).sql

# リストア
psql -U postgres customer_cloud < backup_20250101.sql
```

### 4. インデックス最適化

頻繁にクエリされるカラムにはインデックスを追加：

```prisma
model ClientProfile {
  // ...

  @@index([companyName])
  @@index([industry])
  @@index([contractStatus])
}
```

## セキュリティ考慮事項

1. **環境変数管理**: DATABASE_URLは絶対に `.gitignore` に含める
2. **接続暗号化**: 本番環境では SSL/TLS を使用
   ```env
   DATABASE_URL=postgresql://...?sslmode=require
   ```
3. **最小権限の原則**: アプリケーション用のDBユーザーは必要最小限の権限のみ付与
4. **監査ログ**: 重要な操作はログに記録

## 参考リンク

- [Prisma公式ドキュメント](https://www.prisma.io/docs/)
- [PostgreSQL公式ドキュメント](https://www.postgresql.org/docs/)
- [Prisma Schema Reference](https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference)
- [Issue #62 - DB詳細設計](https://github.com/seiichi-w77/customer_cloud/issues/62)

---

最終更新: 2025-12-08
作成者: CodeGenAgent
