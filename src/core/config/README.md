# Configuration and Environment Management

設定管理と環境変数システム

## Overview

このモジュールは、Shinkai プロジェクトの設定管理、環境変数の読み込み、バリデーション、およびロギング機能を提供します。

## Features

- 環境変数からの設定読み込み
- デフォルト設定とマージ
- 環境別設定（development/staging/production/test）
- 設定バリデーション
- 構造化ロギング
- Feature flags管理
- シングルトンパターンによるグローバルアクセス

## Usage

### Basic Configuration

```typescript
import { getConfig, createLogger } from './core/config/index.js';

// Get configuration instance
const config = getConfig();

// Access configuration sections
const apiSettings = config.get('api');
console.log(`API running on port: ${apiSettings.port}`);

// Check feature flags
if (config.isFeatureEnabled('enableAvatarDialogue')) {
  // Initialize avatar dialogue system
}

// Environment checks
if (config.isProduction()) {
  // Production-specific logic
}
```

### Custom Configuration

```typescript
import { createConfig } from './core/config/index.js';

// Create config with custom overrides
const config = createConfig({
  api: {
    port: 8080,
  },
  features: {
    enableMetrics: false,
  },
});

// Validate configuration
const validation = config.validate();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
  process.exit(1);
}

if (validation.warnings.length > 0) {
  console.warn('Configuration warnings:', validation.warnings);
}
```

### Logging

```typescript
import { createLogger } from './core/config/index.js';

// Create logger instance
const logger = createLogger('MyService');

// Log at different levels
logger.debug('Debug message', { detail: 'value' });
logger.info('Service started');
logger.warn('Deprecated API usage detected');
logger.error('Failed to process request', { error: errorDetails });

// Create child logger
const dbLogger = logger.child('database');
dbLogger.info('Connection established');
```

### Environment Variables

Configuration can be controlled via environment variables with the `SHINKAI_` prefix:

```bash
# App settings
NODE_ENV=production
SHINKAI_DEBUG=false

# API settings
SHINKAI_API_PORT=8080
SHINKAI_API_HOST=localhost

# Database
SHINKAI_DATABASE_URL=postgresql://user:pass@host:5432/db

# AI settings
ANTHROPIC_API_KEY=sk-ant-xxxxx
SHINKAI_AI_MODEL=claude-sonnet-4-20250514

# Security
SHINKAI_JWT_SECRET=your-secret-key

# Logging
SHINKAI_LOG_LEVEL=info
```

### Feature Flags

```typescript
import { getConfig } from './core/config/index.js';

const config = getConfig();

// Check if feature is enabled
if (config.isFeatureEnabled('enableMotherAi')) {
  // Initialize Mother AI
}

// Enable/disable features programmatically
config.setFeature('enableMetrics', true);
```

## Configuration Sections

### App Settings

```typescript
{
  name: 'Shinkai',
  version: '1.0.0',
  environment: 'development',
  debug: true
}
```

### API Settings

```typescript
{
  port: 3000,
  host: '0.0.0.0',
  basePath: '/api/v1',
  corsOrigins: ['http://localhost:3000'],
  rateLimit: {
    windowMs: 900000,  // 15 minutes
    maxRequests: 100
  },
  timeout: 30000
}
```

### Database Settings

```typescript
{
  url: 'postgresql://localhost:5432/shinkai',
  poolSize: 10,
  timeout: 5000,
  ssl: false
}
```

### AI Settings

```typescript
{
  anthropicApiKey: '',
  model: 'claude-sonnet-4-20250514',
  maxTokens: 1000,
  temperature: 0.7,
  timeout: 60000
}
```

### Feature Flags

```typescript
{
  enableAvatarDialogue: true,
  enableProtocols: true,
  enableMotherAi: true,
  enableTemplateBuilder: true,
  enableEventBus: true,
  enableApiServer: true,
  enableMetrics: true,
  enableAuditLog: true
}
```

### Logging Settings

```typescript
{
  level: 'info',
  format: 'text',
  destination: 'console',
  includeTimestamp: true,
  includeSource: true
}
```

### Security Settings

```typescript
{
  jwtSecret: 'change-me-in-production',
  jwtExpiresIn: '24h',
  apiKeyHeader: 'X-API-Key',
  enableRateLimit: true,
  enableCors: true
}
```

## Environment-Specific Defaults

### Production

- `debug: false`
- `logging.level: 'warn'`
- `logging.format: 'json'`
- `database.ssl: true`
- `security.enableRateLimit: true`

### Development

- `debug: true`
- `logging.level: 'debug'`
- `security.enableRateLimit: false`

### Test

- `logging.level: 'silent'`
- `features.enableApiServer: false`

## Validation

The config manager validates critical settings:

**Errors** (will fail validation):
- Missing Anthropic API key when avatar dialogue is enabled
- Invalid JWT secret in production
- Port number out of range (1-65535)
- Temperature outside valid range (0-2)

**Warnings** (will pass validation):
- SSL disabled in production
- Max tokens outside optimal range

```typescript
const validation = config.validate();

if (!validation.valid) {
  validation.errors.forEach(error => {
    console.error(`${error.path}: ${error.message}`);
  });
  process.exit(1);
}

validation.warnings.forEach(warning => {
  console.warn(`${warning.path}: ${warning.message}`);
  if (warning.suggestion) {
    console.warn(`  Suggestion: ${warning.suggestion}`);
  }
});
```

## Export Configuration

Generate `.env` file from current configuration:

```typescript
const config = getConfig();
const envString = config.toEnvString();

// Write to file
import { writeFileSync } from 'fs';
writeFileSync('.env', envString);
```

## Logging Formats

### Text Format (Development)

```
[2025-12-10T10:30:45.123Z] [INFO] [MyService] Service started
[2025-12-10T10:30:45.456Z] [ERROR] [MyService] Failed to connect {"host":"localhost","port":5432}
```

### JSON Format (Production)

```json
{"timestamp":"2025-12-10T10:30:45.123Z","level":"info","source":"MyService","message":"Service started"}
{"timestamp":"2025-12-10T10:30:45.456Z","level":"error","source":"MyService","message":"Failed to connect","data":{"host":"localhost","port":5432}}
```

## Best Practices

1. **Environment Variables**: Use environment variables for secrets and deployment-specific settings
2. **Feature Flags**: Use feature flags for gradual rollouts and A/B testing
3. **Validation**: Always validate configuration on startup
4. **Logging**: Use appropriate log levels (debug < info < warn < error)
5. **Child Loggers**: Create child loggers for subsystems to maintain context
6. **Singleton**: Use `getConfig()` for global access, `createConfig()` only for testing

## Testing

```typescript
import { createConfig, createLogger } from './core/config/index.js';

describe('Configuration', () => {
  it('should load custom config', () => {
    const config = createConfig({
      api: { port: 9999 },
    });

    expect(config.get('api').port).toBe(9999);
  });

  it('should validate config', () => {
    const config = createConfig({
      ai: { temperature: 3.0 }, // Invalid
    });

    const result = config.validate();
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });
});

describe('Logger', () => {
  it('should respect log level', () => {
    const logger = createLogger('test', { level: 'warn' });

    // This should not output anything
    logger.debug('debug message');
    logger.info('info message');

    // These should output
    logger.warn('warning');
    logger.error('error');
  });
});
```

## Architecture

```
ConfigManager
├── Default Config (hardcoded defaults)
├── Initial Config (constructor parameter)
├── Environment Variables (process.env)
└── Environment-Specific Defaults (based on NODE_ENV)

Logger
├── Log Level Filtering
├── Format Selection (text/json)
├── Destination Routing (console/file/both)
└── Child Logger Creation
```

## Type Safety

All configuration is fully typed with TypeScript:

```typescript
// Strongly typed section access
const apiConfig: ApiSettings = config.get('api');

// Type-safe feature flags
type FeatureName = keyof FeatureFlags;
const enabled: boolean = config.isFeatureEnabled('enableMotherAi');

// Compile-time validation
config.set('api', { port: 8080 }); // OK
config.set('api', { invalidKey: true }); // TypeScript error
```

## Integration

```typescript
// Initialize at application startup
import { getConfig, createLogger } from './core/config/index.js';

const config = getConfig();
const logger = createLogger('App');

// Validate configuration
const validation = config.validate();
if (!validation.valid) {
  logger.error('Invalid configuration', { errors: validation.errors });
  process.exit(1);
}

logger.info('Configuration loaded', {
  environment: config.getEnvironment(),
  debug: config.isDebug(),
  features: config.get('features'),
});

// Start application
startServer(config.get('api'));
```

## License

MIT
