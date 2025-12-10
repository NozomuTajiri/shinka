/**
 * 設定マネージャー
 * 環境変数・設定ファイル・バリデーション
 */

import type {
  AppConfig,
  Environment,
  LogLevel,
  FeatureFlags,
  ConfigValidationResult,
  ConfigError,
  ConfigWarning,
} from './types.js';

const DEFAULT_CONFIG: AppConfig = {
  app: {
    name: 'Shinkai',
    version: '1.0.0',
    environment: 'development',
    debug: true,
  },
  api: {
    port: 3000,
    host: '0.0.0.0',
    basePath: '/api/v1',
    corsOrigins: ['http://localhost:3000'],
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
    },
    timeout: 30000,
  },
  database: {
    url: 'postgresql://localhost:5432/shinkai',
    poolSize: 10,
    timeout: 5000,
    ssl: false,
  },
  ai: {
    anthropicApiKey: '',
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1000,
    temperature: 0.7,
    timeout: 60000,
  },
  features: {
    enableAvatarDialogue: true,
    enableProtocols: true,
    enableMotherAi: true,
    enableTemplateBuilder: true,
    enableEventBus: true,
    enableApiServer: true,
    enableMetrics: true,
    enableAuditLog: true,
  },
  logging: {
    level: 'info',
    format: 'text',
    destination: 'console',
    includeTimestamp: true,
    includeSource: true,
  },
  security: {
    jwtSecret: 'change-me-in-production',
    jwtExpiresIn: '24h',
    apiKeyHeader: 'X-API-Key',
    enableRateLimit: true,
    enableCors: true,
  },
};

export class ConfigManager {
  private config: AppConfig;
  private envPrefix: string = 'SHINKAI_';

  constructor(initialConfig: Partial<AppConfig> = {}) {
    this.config = this.mergeConfig(DEFAULT_CONFIG, initialConfig);
    this.loadFromEnvironment();
  }

  private mergeConfig(base: AppConfig, override: Partial<AppConfig>): AppConfig {
    return {
      app: { ...base.app, ...override.app },
      api: { ...base.api, ...override.api },
      database: { ...base.database, ...override.database },
      ai: { ...base.ai, ...override.ai },
      features: { ...base.features, ...override.features },
      logging: { ...base.logging, ...override.logging },
      security: { ...base.security, ...override.security },
    };
  }

  private loadFromEnvironment(): void {
    // App settings
    if (process.env.NODE_ENV) {
      this.config.app.environment = process.env.NODE_ENV as Environment;
    }
    if (process.env[`${this.envPrefix}DEBUG`]) {
      this.config.app.debug = process.env[`${this.envPrefix}DEBUG`] === 'true';
    }

    // API settings
    if (process.env[`${this.envPrefix}API_PORT`]) {
      this.config.api.port = parseInt(process.env[`${this.envPrefix}API_PORT`]!, 10);
    }
    if (process.env[`${this.envPrefix}API_HOST`]) {
      this.config.api.host = process.env[`${this.envPrefix}API_HOST`]!;
    }

    // Database settings
    if (process.env[`${this.envPrefix}DATABASE_URL`] || process.env.DATABASE_URL) {
      this.config.database.url = process.env[`${this.envPrefix}DATABASE_URL`] ?? process.env.DATABASE_URL!;
    }

    // AI settings
    if (process.env.ANTHROPIC_API_KEY) {
      this.config.ai.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
    }
    if (process.env[`${this.envPrefix}AI_MODEL`]) {
      this.config.ai.model = process.env[`${this.envPrefix}AI_MODEL`]!;
    }

    // Security settings
    if (process.env[`${this.envPrefix}JWT_SECRET`]) {
      this.config.security.jwtSecret = process.env[`${this.envPrefix}JWT_SECRET`]!;
    }

    // Logging settings
    if (process.env[`${this.envPrefix}LOG_LEVEL`]) {
      this.config.logging.level = process.env[`${this.envPrefix}LOG_LEVEL`] as LogLevel;
    }

    // Apply environment-specific defaults
    this.applyEnvironmentDefaults();
  }

  private applyEnvironmentDefaults(): void {
    const env = this.config.app.environment;

    if (env === 'production') {
      this.config.app.debug = false;
      this.config.logging.level = 'warn';
      this.config.logging.format = 'json';
      this.config.database.ssl = true;
      this.config.security.enableRateLimit = true;
    } else if (env === 'development') {
      this.config.app.debug = true;
      this.config.logging.level = 'debug';
      this.config.security.enableRateLimit = false;
    } else if (env === 'test') {
      this.config.logging.level = 'silent';
      this.config.features.enableApiServer = false;
    }
  }

  validate(): ConfigValidationResult {
    const errors: ConfigError[] = [];
    const warnings: ConfigWarning[] = [];

    // Required fields validation
    if (!this.config.ai.anthropicApiKey && this.config.features.enableAvatarDialogue) {
      errors.push({
        path: 'ai.anthropicApiKey',
        message: 'Anthropic API key is required when avatar dialogue is enabled',
      });
    }

    // Security validation
    if (this.config.app.environment === 'production') {
      if (this.config.security.jwtSecret === 'change-me-in-production') {
        errors.push({
          path: 'security.jwtSecret',
          message: 'JWT secret must be changed in production',
        });
      }

      if (!this.config.database.ssl) {
        warnings.push({
          path: 'database.ssl',
          message: 'SSL is disabled for database in production',
          suggestion: 'Enable SSL for secure database connections',
        });
      }
    }

    // Port validation
    if (this.config.api.port < 1 || this.config.api.port > 65535) {
      errors.push({
        path: 'api.port',
        message: 'Invalid port number',
        value: this.config.api.port,
      });
    }

    // AI settings validation
    if (this.config.ai.maxTokens < 1 || this.config.ai.maxTokens > 100000) {
      warnings.push({
        path: 'ai.maxTokens',
        message: 'Max tokens value may be outside optimal range',
        suggestion: 'Recommended range: 100-4000',
      });
    }

    if (this.config.ai.temperature < 0 || this.config.ai.temperature > 2) {
      errors.push({
        path: 'ai.temperature',
        message: 'Temperature must be between 0 and 2',
        value: this.config.ai.temperature,
      });
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  get<K extends keyof AppConfig>(section: K): AppConfig[K] {
    return { ...this.config[section] };
  }

  getAll(): AppConfig {
    return JSON.parse(JSON.stringify(this.config));
  }

  set<K extends keyof AppConfig>(section: K, value: Partial<AppConfig[K]>): void {
    this.config[section] = { ...this.config[section], ...value };
  }

  setFeature(feature: keyof FeatureFlags, enabled: boolean): void {
    this.config.features[feature] = enabled;
  }

  isFeatureEnabled(feature: keyof FeatureFlags): boolean {
    return this.config.features[feature];
  }

  getEnvironment(): Environment {
    return this.config.app.environment;
  }

  isDevelopment(): boolean {
    return this.config.app.environment === 'development';
  }

  isProduction(): boolean {
    return this.config.app.environment === 'production';
  }

  isDebug(): boolean {
    return this.config.app.debug;
  }

  toEnvString(): string {
    const lines: string[] = [
      `# Shinkai Configuration`,
      `# Generated at ${new Date().toISOString()}`,
      ``,
      `# App`,
      `NODE_ENV=${this.config.app.environment}`,
      `${this.envPrefix}DEBUG=${this.config.app.debug}`,
      ``,
      `# API`,
      `${this.envPrefix}API_PORT=${this.config.api.port}`,
      `${this.envPrefix}API_HOST=${this.config.api.host}`,
      ``,
      `# Database`,
      `${this.envPrefix}DATABASE_URL=${this.config.database.url}`,
      ``,
      `# AI`,
      `ANTHROPIC_API_KEY=${this.config.ai.anthropicApiKey}`,
      `${this.envPrefix}AI_MODEL=${this.config.ai.model}`,
      ``,
      `# Security`,
      `${this.envPrefix}JWT_SECRET=${this.config.security.jwtSecret}`,
      ``,
      `# Logging`,
      `${this.envPrefix}LOG_LEVEL=${this.config.logging.level}`,
    ];

    return lines.join('\n');
  }
}

// Singleton instance
let configInstance: ConfigManager | null = null;

export function getConfig(): ConfigManager {
  if (!configInstance) {
    configInstance = new ConfigManager();
  }
  return configInstance;
}

export function createConfig(initialConfig?: Partial<AppConfig>): ConfigManager {
  configInstance = new ConfigManager(initialConfig);
  return configInstance;
}

export function loadConfig(): AppConfig {
  return getConfig().getAll();
}
