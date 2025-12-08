/**
 * Prisma 7.x 設定ファイル
 *
 * データソースの接続設定とマイグレーション設定を管理
 * @see https://pris.ly/d/prisma7-client-config
 */

import { defineConfig } from '@prisma/client';

export default defineConfig({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/customer_cloud?schema=public',
    },
  },
});
