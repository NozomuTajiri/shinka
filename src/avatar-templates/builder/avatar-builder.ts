/**
 * ¢Ð¿üÓëÀü
 * Fluent APIkˆ‹¢Ð¿üËÉ
 */

import type {
  BuilderConfig,
  BuildResult,
  BuildError,
  BuildWarning,
  TemplateSource,
  PersonaOverride,
  KnowledgeOverride,
  CapabilityOverride,
  BuildStep,
  BuildContext,
} from './types.js';
import type {
  BaseAvatarTemplate,
  AvatarCategory,
  AvatarInstance,
  AvatarPersona,
  KnowledgeDomain,
  CollaborationSettings,
  QualityStandards,
  CoreCapability,
  ExtendedCapability,
} from '../base/types.js';
import { createBaseTemplate, mergeTemplates } from '../base/base-template.js';
import { getCategoryTemplate } from '../categories/index.js';

export class AvatarBuilder {
  private config: BuilderConfig;
  private template: BaseAvatarTemplate | null = null;
  private category: AvatarCategory = 'specialized';
  private personaOverride: PersonaOverride = {};
  private knowledgeOverride: KnowledgeOverride = {};
  private capabilityOverride: CapabilityOverride = {};
  private collaborationOverride: Partial<CollaborationSettings> = {};
  private qualityOverride: Partial<QualityStandards> = {};
  private clientId?: string;
  private errors: BuildError[] = [];
  private warnings: BuildWarning[] = [];
  private context: BuildContext | null = null;

  constructor(config: Partial<BuilderConfig> = {}) {
    this.config = {
      strictValidation: true,
      autoFillDefaults: true,
      allowCustomFields: false,
      ...config,
    };
  }

  /**
   * «Æ´êÆó×ìüÈK‰‹Ë
   */
  fromCategory(category: AvatarCategory): AvatarBuilder {
    this.category = category;
    const categoryTemplate = getCategoryTemplate(category);
    const baseTemplate = createBaseTemplate(`${category}-${Date.now()}`, 'builder');

    // Merge category defaults into base
    baseTemplate.metadata.category = category;
    baseTemplate.knowledge = [...categoryTemplate.defaultKnowledge];

    this.template = baseTemplate;
    this.initContext(baseTemplate.metadata.templateId, category);
    return this;
  }

  /**
   * âXÆó×ìüÈK‰‹Ë
   */
  fromTemplate(template: BaseAvatarTemplate): AvatarBuilder {
    this.template = { ...template };
    this.category = template.metadata.category;
    this.initContext(template.metadata.templateId, template.metadata.category);
    return this;
  }

  /**
   * YAML/JSON½ü¹K‰‹Ë
   */
  fromSource(source: TemplateSource): AvatarBuilder {
    try {
      let parsed: Partial<BaseAvatarTemplate>;

      if (source.type === 'object') {
        parsed = source.source as Partial<BaseAvatarTemplate>;
      } else if (source.type === 'json') {
        parsed = JSON.parse(source.source as string);
      } else if (source.type === 'yaml') {
        // Simplified YAML parsing (in real impl, use yaml library)
        this.addWarning('YAML_PARSE', 'source', 'YAML parsing requires yaml library');
        return this;
      } else {
        parsed = {};
      }

      const category = parsed.metadata?.category ?? 'specialized';
      this.fromCategory(category);

      if (this.template && parsed) {
        this.template = mergeTemplates(this.template, parsed);
      }
    } catch (error) {
      this.addError('PARSE_ERROR', 'source', `Failed to parse source: ${error}`);
    }

    return this;
  }

  private initContext(templateId: string, category: AvatarCategory): void {
    this.context = {
      templateId,
      category,
      steps: [
        { order: 1, name: 'Initialize', status: 'completed' },
        { order: 2, name: 'Apply Overrides', status: 'pending' },
        { order: 3, name: 'Validate', status: 'pending' },
        { order: 4, name: 'Build Instance', status: 'pending' },
      ],
      startedAt: new Date(),
    };
  }

  /**
   * Úë½Ê-š
   */
  withPersona(override: PersonaOverride): AvatarBuilder {
    this.personaOverride = { ...this.personaOverride, ...override };
    return this;
  }

  /**
   * åXÉá¤ó-š
   */
  withKnowledge(override: KnowledgeOverride): AvatarBuilder {
    this.knowledgeOverride = {
      add: [...(this.knowledgeOverride.add ?? []), ...(override.add ?? [])],
      remove: [...(this.knowledgeOverride.remove ?? []), ...(override.remove ?? [])],
      update: [...(this.knowledgeOverride.update ?? []), ...(override.update ?? [])],
    };
    return this;
  }

  /**
   * ý›-š
   */
  withCapabilities(override: CapabilityOverride): AvatarBuilder {
    this.capabilityOverride = {
      enable: [...(this.capabilityOverride.enable ?? []), ...(override.enable ?? [])],
      disable: [...(this.capabilityOverride.disable ?? []), ...(override.disable ?? [])],
      addCustom: [...(this.capabilityOverride.addCustom ?? []), ...(override.addCustom ?? [])],
    };
    return this;
  }

  /**
   * T¿-š
   */
  withCollaboration(settings: Partial<CollaborationSettings>): AvatarBuilder {
    this.collaborationOverride = { ...this.collaborationOverride, ...settings };
    return this;
  }

  /**
   * Áêú–-š
   */
  withQualityStandards(standards: Partial<QualityStandards>): AvatarBuilder {
    this.qualityOverride = { ...this.qualityOverride, ...standards };
    return this;
  }

  /**
   * ¯é¤¢óÈØQ
   */
  forClient(clientId: string): AvatarBuilder {
    this.clientId = clientId;
    if (this.context) {
      this.context.clientId = clientId;
    }
    return this;
  }

  /**
   * Æó×ìüÈnÓëÉ
   */
  buildTemplate(): BuildResult {
    if (!this.template) {
      this.addError('NO_TEMPLATE', 'template', 'No template initialized');
      return { success: false, errors: this.errors, warnings: this.warnings };
    }

    this.updateStepStatus(2, 'running');

    // Apply persona overrides
    if (Object.keys(this.personaOverride).length > 0) {
      this.template.persona = {
        ...this.template.persona,
        ...this.personaOverride,
      } as AvatarPersona;
    }

    // Apply knowledge overrides
    this.applyKnowledgeOverride();

    // Apply capability overrides
    this.applyCapabilityOverride();

    // Apply collaboration overrides
    if (Object.keys(this.collaborationOverride).length > 0) {
      this.template.collaboration = {
        ...this.template.collaboration,
        ...this.collaborationOverride,
      };
    }

    // Apply quality overrides
    if (Object.keys(this.qualityOverride).length > 0) {
      this.template.quality = {
        ...this.template.quality,
        ...this.qualityOverride,
      };
    }

    this.updateStepStatus(2, 'completed');

    // Validate
    this.updateStepStatus(3, 'running');
    this.validate();
    this.updateStepStatus(3, this.errors.length === 0 ? 'completed' : 'failed');

    return {
      success: this.errors.length === 0,
      template: this.template,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  /**
   * ¤ó¹¿ó¹ÓëÉ
   */
  build(): BuildResult {
    const templateResult = this.buildTemplate();
    if (!templateResult.success || !templateResult.template) {
      return templateResult;
    }

    this.updateStepStatus(4, 'running');

    const instance: AvatarInstance = {
      instanceId: `inst-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      templateId: templateResult.template.metadata.templateId,
      clientId: this.clientId ?? 'default',
      customizations: {},
      createdAt: new Date(),
      lastActiveAt: new Date(),
      status: 'draft',
      metrics: {
        totalSessions: 0,
        avgResponseTime: 0,
        satisfactionScore: 0,
        successRate: 0,
        learningProgress: 0,
      },
    };

    this.updateStepStatus(4, 'completed');

    if (this.context) {
      this.context.completedAt = new Date();
    }

    return {
      success: true,
      instance,
      template: templateResult.template,
      errors: this.errors,
      warnings: this.warnings,
    };
  }

  private applyKnowledgeOverride(): void {
    if (!this.template) return;

    // Remove specified knowledge domains
    if (this.knowledgeOverride.remove) {
      this.template.knowledge = this.template.knowledge.filter(
        k => !this.knowledgeOverride.remove!.includes(k.id)
      );
    }

    // Add new knowledge domains
    if (this.knowledgeOverride.add) {
      this.template.knowledge.push(...this.knowledgeOverride.add);
    }

    // Update existing knowledge domains
    if (this.knowledgeOverride.update) {
      for (const update of this.knowledgeOverride.update) {
        const index = this.template.knowledge.findIndex(k => k.id === update.id);
        if (index >= 0) {
          this.template.knowledge[index] = {
            ...this.template.knowledge[index],
            ...update,
          } as KnowledgeDomain;
        }
      }
    }
  }

  private applyCapabilityOverride(): void {
    if (!this.template) return;

    // Enable capabilities
    if (this.capabilityOverride.enable) {
      for (const capId of this.capabilityOverride.enable) {
        const cap = this.template.capabilities.extended.find(c => c.id === capId);
        if (cap) {
          cap.enabled = true;
        }
      }
    }

    // Disable capabilities
    if (this.capabilityOverride.disable) {
      for (const capId of this.capabilityOverride.disable) {
        const coreCap = this.template.capabilities.core.find(c => c.id === capId);
        if (coreCap) {
          coreCap.enabled = false;
        }
        const extCap = this.template.capabilities.extended.find(c => c.id === capId);
        if (extCap) {
          extCap.enabled = false;
        }
      }
    }

    // Add custom capabilities
    if (this.capabilityOverride.addCustom) {
      for (const custom of this.capabilityOverride.addCustom) {
        this.template.capabilities.extended.push({
          id: custom.id,
          name: custom.name,
          description: custom.description,
          enabled: true,
          conditions: [],
          dependencies: [],
        } as ExtendedCapability);
      }
    }
  }

  private validate(): void {
    if (!this.template) return;

    // Required fields validation
    if (!this.template.persona.name) {
      this.addError('MISSING_FIELD', 'persona.name', 'Avatar name is required');
    }
    if (!this.template.persona.role) {
      this.addError('MISSING_FIELD', 'persona.role', 'Avatar role is required');
    }

    // Knowledge validation
    if (this.template.knowledge.length === 0) {
      this.addWarning('NO_KNOWLEDGE', 'knowledge', 'No knowledge domains defined', 'Add at least one knowledge domain');
    }

    // Collaboration validation
    if (this.template.collaboration.reportingTo.length === 0) {
      this.addWarning('NO_REPORTING', 'collaboration.reportingTo', 'No reporting structure defined');
    }

    // Quality standards validation
    if (this.template.quality.responseTime.targetSeconds <= 0) {
      this.addError('INVALID_VALUE', 'quality.responseTime.targetSeconds', 'Response time must be positive');
    }
  }

  private addError(code: string, field: string, message: string, severity: 'error' | 'critical' = 'error'): void {
    this.errors.push({ code, field, message, severity });
  }

  private addWarning(code: string, field: string, message: string, suggestion?: string): void {
    this.warnings.push({ code, field, message, suggestion });
  }

  private updateStepStatus(order: number, status: BuildStep['status']): void {
    if (this.context) {
      const step = this.context.steps.find(s => s.order === order);
      if (step) {
        step.status = status;
      }
    }
  }

  /**
   * ÓëÉ³óÆ­¹ÈÖ—
   */
  getContext(): BuildContext | null {
    return this.context;
  }

  /**
   * ¨éüÖ—
   */
  getErrors(): BuildError[] {
    return [...this.errors];
  }

  /**
   * fJÖ—
   */
  getWarnings(): BuildWarning[] {
    return [...this.warnings];
  }

  /**
   * ÓëÀüê»ÃÈ
   */
  reset(): AvatarBuilder {
    this.template = null;
    this.category = 'specialized';
    this.personaOverride = {};
    this.knowledgeOverride = {};
    this.capabilityOverride = {};
    this.collaborationOverride = {};
    this.qualityOverride = {};
    this.clientId = undefined;
    this.errors = [];
    this.warnings = [];
    this.context = null;
    return this;
  }
}

/**
 * ÓëÀüÕ¡¯Èêü
 */
export function createAvatarBuilder(config?: Partial<BuilderConfig>): AvatarBuilder {
  return new AvatarBuilder(config);
}
