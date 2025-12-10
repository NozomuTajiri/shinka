/**
 * システム共通型定義
 */

export type Environment = 'development' | 'staging' | 'production';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface SystemConfig {
  environment: Environment;
  version: string;
  logLevel: LogLevel;
  apiPort: number;
  enabledFeatures: FeatureFlags;
  anthropicApiKey?: string;
  databaseUrl?: string;
}

export interface FeatureFlags {
  avatarDialogue: boolean;
  protocolCommunication: boolean;
  motherAiEngines: boolean;
  templateBuilder: boolean;
  eventBus: boolean;
  apiServer: boolean;
}

export interface SystemStatus {
  initialized: boolean;
  startedAt: Date;
  environment: Environment;
  version: string;
  components: ComponentStatus[];
  health: 'healthy' | 'degraded' | 'unhealthy';
}

export interface ComponentStatus {
  name: string;
  status: 'ready' | 'initializing' | 'error' | 'disabled';
  lastCheck: Date;
  error?: string;
}

export interface InitializationResult {
  success: boolean;
  duration: number;
  components: ComponentStatus[];
  errors: string[];
}
