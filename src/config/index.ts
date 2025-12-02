/**
 * アプリケーション設定
 *
 * @module config
 * @description
 * - 環境変数の管理
 * - 型安全な設定オブジェクト
 * - バリデーション
 */

/**
 * アプリケーション設定型
 */
export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  host: string;
  apiVersion: string;
  jwt: {
    secret: string;
    expiration: string;
  };
  upload: {
    maxFileSize: number; // バイト単位
    allowedTypes: string[];
    uploadDir: string;
  };
  anthropic: {
    apiKey: string;
    model: string;
  };
}

/**
 * 環境変数から設定を読み込む
 */
export const config: AppConfig = {
  env: (process.env.NODE_ENV as AppConfig['env']) || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  apiVersion: 'v1',
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiration: process.env.JWT_EXPIRATION || '24h',
  },
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10), // 10MB
    allowedTypes: ['application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
    uploadDir: process.env.UPLOAD_DIR || './uploads',
  },
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514',
  },
};
