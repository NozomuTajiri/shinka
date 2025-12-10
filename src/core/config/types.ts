/**
 * 設定管理型定義
 */

export type Environment = 'development' | 'staging' | 'production' | 'test';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';

export interface AppConfig {
  app: AppSettings;
  api: ApiSettings;
  database: DatabaseSettings;
  ai: AiSettings;
  features: FeatureFlags;
  logging: LoggingSettings;
  security: SecuritySettings;
}

export interface AppSettings {
  name: string;
  version: string;
  environment: Environment;
  debug: boolean;
}

export interface ApiSettings {
  port: number;
  host: string;
  basePath: string;
  corsOrigins: string[];
  rateLimit: {
    windowMs: number;
    maxRequests: number;
  };
  timeout: number;
}

export interface DatabaseSettings {
  url: string;
  poolSize: number;
  timeout: number;
  ssl: boolean;
}

export interface AiSettings {
  anthropicApiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface FeatureFlags {
  enableAvatarDialogue: boolean;
  enableProtocols: boolean;
  enableMotherAi: boolean;
  enableTemplateBuilder: boolean;
  enableEventBus: boolean;
  enableApiServer: boolean;
  enableMetrics: boolean;
  enableAuditLog: boolean;
}

export interface LoggingSettings {
  level: LogLevel;
  format: 'json' | 'text';
  destination: 'console' | 'file' | 'both';
  filePath?: string;
  includeTimestamp: boolean;
  includeSource: boolean;
}

export interface SecuritySettings {
  jwtSecret: string;
  jwtExpiresIn: string;
  apiKeyHeader: string;
  enableRateLimit: boolean;
  enableCors: boolean;
}

export interface ConfigValidationResult {
  valid: boolean;
  errors: ConfigError[];
  warnings: ConfigWarning[];
}

export interface ConfigError {
  path: string;
  message: string;
  value?: unknown;
}

export interface ConfigWarning {
  path: string;
  message: string;
  suggestion?: string;
}
