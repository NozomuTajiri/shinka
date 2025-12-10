/**
 * ¢Ð¿üÓëÀü‹š©
 */

import type {
  BaseAvatarTemplate,
  AvatarCategory,
  AvatarPersona,
  KnowledgeDomain,
  AvatarInstance,
  CollaborationSettings,
  QualityStandards,
} from '../base/types.js';

export interface BuilderConfig {
  strictValidation: boolean;
  autoFillDefaults: boolean;
  allowCustomFields: boolean;
}

export interface BuildResult {
  success: boolean;
  instance?: AvatarInstance;
  template?: BaseAvatarTemplate;
  errors: BuildError[];
  warnings: BuildWarning[];
}

export interface BuildError {
  code: string;
  field: string;
  message: string;
  severity: 'error' | 'critical';
}

export interface BuildWarning {
  code: string;
  field: string;
  message: string;
  suggestion?: string;
}

export interface TemplateSource {
  type: 'builtin' | 'yaml' | 'json' | 'object';
  source: string | object;
}

export interface PersonaOverride {
  name?: string;
  nameJa?: string;
  role?: string;
  description?: string;
  background?: string;
  communicationStyle?: AvatarPersona['communicationStyle'];
  tone?: string[];
  principles?: string[];
  strengths?: string[];
}

export interface KnowledgeOverride {
  add?: KnowledgeDomain[];
  remove?: string[];
  update?: Partial<KnowledgeDomain>[];
}

export interface CapabilityOverride {
  enable?: string[];
  disable?: string[];
  addCustom?: { id: string; name: string; description: string }[];
}

export interface BuildStep {
  order: number;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  duration?: number;
  error?: string;
}

export interface BuildContext {
  templateId: string;
  category: AvatarCategory;
  clientId?: string;
  steps: BuildStep[];
  startedAt: Date;
  completedAt?: Date;
}
