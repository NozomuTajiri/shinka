/**
 * Prismaクライアント初期化モジュール
 *
 * シングルトンパターンでPrismaクライアントを管理し、
 * 開発環境でのホットリロード時の接続数増加を防ぐ。
 */

import { PrismaClient } from '@prisma/client';

/**
 * グローバルオブジェクトにPrismaクライアントを保持するための型定義
 */
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

/**
 * Prismaクライアントのシングルトンインスタンス
 *
 * 開発環境では globalThis.prisma を使用してホットリロード時の
 * 接続数増加を防ぐ。本番環境では通常のインスタンスを使用。
 */
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

// 開発環境の場合はグローバルに保存
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

/**
 * アプリケーション終了時のクリーンアップ処理
 *
 * データベース接続を適切に切断する。
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}

/**
 * データベース接続の健全性チェック
 *
 * @returns 接続が成功した場合は true、失敗した場合は false
 */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

/**
 * トランザクションヘルパー
 *
 * @param callback - トランザクション内で実行するコールバック関数
 * @returns コールバックの戻り値
 */
export async function transaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return prisma.$transaction(async (tx) => {
    return callback(tx as PrismaClient);
  });
}

// プロセス終了時のクリーンアップ
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

// デフォルトエクスポート
export default prisma;
