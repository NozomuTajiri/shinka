/**
 * システム初期化・管理
 */

import type {
  SystemConfig,
  SystemStatus,
  ComponentStatus,
  InitializationResult,
  Environment,
  FeatureFlags,
} from './types.js';

const DEFAULT_CONFIG: SystemConfig = {
  environment: 'development',
  version: '1.0.0',
  logLevel: 'info',
  apiPort: 3000,
  enabledFeatures: {
    avatarDialogue: true,
    protocolCommunication: true,
    motherAiEngines: true,
    templateBuilder: true,
    eventBus: true,
    apiServer: true,
  },
};

export class ShinkaiSystem {
  private config: SystemConfig;
  private status: SystemStatus;
  private components: Map<string, unknown> = new Map();

  constructor(config: Partial<SystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.status = {
      initialized: false,
      startedAt: new Date(),
      environment: this.config.environment,
      version: this.config.version,
      components: [],
      health: 'unhealthy',
    };
  }

  async initialize(): Promise<InitializationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    const componentStatuses: ComponentStatus[] = [];

    console.log(`[Shinkai] Initializing system v${this.config.version} in ${this.config.environment} mode...`);

    // Initialize avatars
    if (this.config.enabledFeatures.avatarDialogue) {
      try {
        const avatarStatus = await this.initializeAvatars();
        componentStatuses.push(avatarStatus);
      } catch (error) {
        const errorMsg = `Avatars initialization failed: ${error}`;
        errors.push(errorMsg);
        componentStatuses.push({
          name: 'avatars',
          status: 'error',
          lastCheck: new Date(),
          error: errorMsg,
        });
      }
    }

    // Initialize protocols
    if (this.config.enabledFeatures.protocolCommunication) {
      try {
        const protocolStatus = await this.initializeProtocols();
        componentStatuses.push(protocolStatus);
      } catch (error) {
        const errorMsg = `Protocols initialization failed: ${error}`;
        errors.push(errorMsg);
        componentStatuses.push({
          name: 'protocols',
          status: 'error',
          lastCheck: new Date(),
          error: errorMsg,
        });
      }
    }

    // Initialize Mother AI engines
    if (this.config.enabledFeatures.motherAiEngines) {
      try {
        const motherAiStatus = await this.initializeMotherAI();
        componentStatuses.push(motherAiStatus);
      } catch (error) {
        const errorMsg = `Mother AI initialization failed: ${error}`;
        errors.push(errorMsg);
        componentStatuses.push({
          name: 'mother-ai',
          status: 'error',
          lastCheck: new Date(),
          error: errorMsg,
        });
      }
    }

    // Initialize template system
    if (this.config.enabledFeatures.templateBuilder) {
      try {
        const templateStatus = await this.initializeTemplates();
        componentStatuses.push(templateStatus);
      } catch (error) {
        const errorMsg = `Templates initialization failed: ${error}`;
        errors.push(errorMsg);
        componentStatuses.push({
          name: 'templates',
          status: 'error',
          lastCheck: new Date(),
          error: errorMsg,
        });
      }
    }

    // Update system status
    this.status.components = componentStatuses;
    this.status.initialized = errors.length === 0;
    this.status.health = this.calculateHealth(componentStatuses);

    const duration = Date.now() - startTime;
    console.log(`[Shinkai] System initialization ${this.status.initialized ? 'completed' : 'failed'} in ${duration}ms`);

    return {
      success: this.status.initialized,
      duration,
      components: componentStatuses,
      errors,
    };
  }

  private async initializeAvatars(): Promise<ComponentStatus> {
    // Dynamic import to avoid circular dependencies
    const { HirakuAvatar } = await import('./avatars/hiraku/index.js');
    const { SenryakuAvatar } = await import('./avatars/senryaku/index.js');
    const { EigyoAvatar } = await import('./avatars/eigyo/index.js');
    const { ShijoAvatar } = await import('./avatars/shijo/index.js');
    const { KanriAvatar } = await import('./avatars/kanri/index.js');

    this.components.set('hiraku', new HirakuAvatar());
    this.components.set('senryaku', new SenryakuAvatar());
    this.components.set('eigyo', new EigyoAvatar());
    this.components.set('shijo', new ShijoAvatar());
    this.components.set('kanri', new KanriAvatar());

    console.log('[Shinkai] Avatars initialized: hiraku, senryaku, eigyo, shijo, kanri');

    return {
      name: 'avatars',
      status: 'ready',
      lastCheck: new Date(),
    };
  }

  private async initializeProtocols(): Promise<ComponentStatus> {
    const { initializeProtocols } = await import('./protocols/index.js');
    const protocols = await initializeProtocols();
    this.components.set('protocols', protocols);

    console.log('[Shinkai] Protocols initialized: report, request, arbitration, session, insight');

    return {
      name: 'protocols',
      status: 'ready',
      lastCheck: new Date(),
    };
  }

  private async initializeMotherAI(): Promise<ComponentStatus> {
    const { AvatarBuilderEngine } = await import('./mother-ai/engines/avatar-builder/index.js');
    const { ConsolidationEngine } = await import('./mother-ai/engines/consolidation/index.js');
    const { InsightEngine } = await import('./mother-ai/engines/insight/index.js');
    const { QualityEngine } = await import('./mother-ai/engines/quality/index.js');

    this.components.set('mother-ai', {
      avatarBuilder: new AvatarBuilderEngine(),
      consolidation: new ConsolidationEngine(),
      insight: new InsightEngine(),
      quality: new QualityEngine(),
    });

    console.log('[Shinkai] Mother AI engines initialized: builder, consolidation, insight, quality');

    return {
      name: 'mother-ai',
      status: 'ready',
      lastCheck: new Date(),
    };
  }

  private async initializeTemplates(): Promise<ComponentStatus> {
    const { initializeTemplateSystem } = await import('./avatar-templates/index.js');
    const templates = await initializeTemplateSystem();
    this.components.set('templates', templates);

    console.log('[Shinkai] Template system initialized: validation, workflow, builder, categories');

    return {
      name: 'templates',
      status: 'ready',
      lastCheck: new Date(),
    };
  }

  private calculateHealth(components: ComponentStatus[]): SystemStatus['health'] {
    const errorCount = components.filter(c => c.status === 'error').length;
    const total = components.length;

    if (errorCount === 0) return 'healthy';
    if (errorCount < total / 2) return 'degraded';
    return 'unhealthy';
  }

  getStatus(): SystemStatus {
    return { ...this.status };
  }

  getConfig(): SystemConfig {
    return { ...this.config };
  }

  getComponent<T>(name: string): T | undefined {
    return this.components.get(name) as T | undefined;
  }

  isInitialized(): boolean {
    return this.status.initialized;
  }

  async shutdown(): Promise<void> {
    console.log('[Shinkai] Shutting down system...');
    this.components.clear();
    this.status.initialized = false;
    this.status.health = 'unhealthy';
    console.log('[Shinkai] System shutdown complete');
  }
}

// Singleton instance
let systemInstance: ShinkaiSystem | null = null;

export function getSystem(): ShinkaiSystem {
  if (!systemInstance) {
    systemInstance = new ShinkaiSystem();
  }
  return systemInstance;
}

export function createSystem(config?: Partial<SystemConfig>): ShinkaiSystem {
  systemInstance = new ShinkaiSystem(config);
  return systemInstance;
}

export async function initializeSystem(config?: Partial<SystemConfig>): Promise<InitializationResult> {
  const system = createSystem(config);
  return system.initialize();
}
