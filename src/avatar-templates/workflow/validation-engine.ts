/**
 * バリデーションエンジン
 * アバターテンプレートの検証
 */

import type {
  ValidationRecord,
  ValidationResult,
  ValidationRule,
  ValidationSeverity,
  WorkflowPhase,
} from './types.js';
import type { BaseAvatarTemplate } from '../base/types.js';

export class ValidationEngine {
  private rules: ValidationRule[] = [];

  constructor() {
    this.initializeDefaultRules();
  }

  private initializeDefaultRules(): void {
    // Schema validation rules
    this.rules.push({
      id: 'schema-persona-required',
      name: 'ペルソナ必須フィールド',
      description: 'ペルソナの必須フィールドが設定されているか',
      type: 'schema',
      severity: 'error',
      phase: ['design', 'build'],
      check: (template: unknown) => {
        const t = template as BaseAvatarTemplate;
        return !!(t.persona?.name && t.persona?.role && t.persona?.description);
      },
      message: 'ペルソナのname, role, descriptionは必須です',
    });

    this.rules.push({
      id: 'schema-knowledge-exists',
      name: '知識ドメイン存在',
      description: '少なくとも1つの知識ドメインが定義されているか',
      type: 'schema',
      severity: 'warning',
      phase: ['design', 'build', 'validation'],
      check: (template: unknown) => {
        const t = template as BaseAvatarTemplate;
        return t.knowledge && t.knowledge.length > 0;
      },
      message: '知識ドメインが定義されていません',
    });

    // Capability validation rules
    this.rules.push({
      id: 'capability-core-enabled',
      name: 'コア機能有効化',
      description: '必須のコア機能が有効化されているか',
      type: 'capability',
      severity: 'error',
      phase: ['build', 'validation'],
      check: (template: unknown) => {
        const t = template as BaseAvatarTemplate;
        const dialogue = t.capabilities?.core?.find(c => c.id === 'dialogue');
        return dialogue?.enabled === true;
      },
      message: '対話機能（dialogue）は必須です',
    });

    // Quality validation rules
    this.rules.push({
      id: 'quality-response-time',
      name: '応答時間設定',
      description: '応答時間の設定が適切か',
      type: 'quality',
      severity: 'warning',
      phase: ['build', 'validation'],
      check: (template: unknown) => {
        const t = template as BaseAvatarTemplate;
        const rt = t.quality?.responseTime;
        return rt && rt.targetSeconds > 0 && rt.maxSeconds > rt.targetSeconds;
      },
      message: '応答時間の設定が不適切です',
    });

    this.rules.push({
      id: 'quality-satisfaction-target',
      name: '満足度目標',
      description: '満足度目標が適切に設定されているか',
      type: 'quality',
      severity: 'info',
      phase: ['validation'],
      check: (template: unknown) => {
        const t = template as BaseAvatarTemplate;
        const sat = t.quality?.satisfaction;
        return sat && sat.targetScore >= 4.0;
      },
      message: '満足度目標は4.0以上を推奨します',
    });

    // Security validation rules
    this.rules.push({
      id: 'security-restricted-db',
      name: '制限データベース設定',
      description: 'センシティブデータへのアクセス制限が設定されているか',
      type: 'security',
      severity: 'critical',
      phase: ['build', 'validation'],
      check: (template: unknown) => {
        const t = template as BaseAvatarTemplate;
        return t.database?.restricted && t.database.restricted.length > 0;
      },
      message: 'センシティブデータへのアクセス制限を設定してください',
    });

    // Integration validation rules
    this.rules.push({
      id: 'integration-reporting',
      name: 'レポート先設定',
      description: 'レポート先が設定されているか',
      type: 'integration',
      severity: 'warning',
      phase: ['build', 'validation'],
      check: (template: unknown) => {
        const t = template as BaseAvatarTemplate;
        return t.collaboration?.reportingTo && t.collaboration.reportingTo.length > 0;
      },
      message: 'レポート先（reportingTo）を設定してください',
    });
  }

  addRule(rule: ValidationRule): void {
    this.rules.push(rule);
  }

  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index >= 0) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }

  validate(
    template: BaseAvatarTemplate,
    phase: WorkflowPhase,
    types?: ValidationRecord['type'][]
  ): ValidationRecord {
    const applicableRules = this.rules.filter(r => {
      if (!r.phase.includes(phase)) return false;
      if (types && !types.includes(r.type)) return false;
      return true;
    });

    const results: ValidationResult[] = applicableRules.map(rule => {
      const passed = rule.check(template);
      return {
        ruleId: rule.id,
        ruleName: rule.name,
        passed,
        severity: rule.severity,
        message: passed ? 'OK' : rule.message,
        suggestion: passed ? undefined : this.getSuggestion(rule.id),
      };
    });

    const hasCritical = results.some(r => !r.passed && r.severity === 'critical');
    const hasError = results.some(r => !r.passed && r.severity === 'error');
    const hasWarning = results.some(r => !r.passed && r.severity === 'warning');

    let status: ValidationRecord['status'];
    if (hasCritical || hasError) {
      status = 'failed';
    } else if (hasWarning) {
      status = 'warning';
    } else {
      status = 'passed';
    }

    return {
      id: `val-${Date.now()}`,
      phase,
      type: types?.[0] ?? 'schema',
      status,
      results,
      executedAt: new Date(),
      executedBy: 'validation-engine',
    };
  }

  validateAll(template: BaseAvatarTemplate, phase: WorkflowPhase): ValidationRecord[] {
    const types: ValidationRecord['type'][] = ['schema', 'capability', 'quality', 'security', 'integration'];
    return types.map(type => this.validate(template, phase, [type]));
  }

  private getSuggestion(ruleId: string): string {
    const suggestions: Record<string, string> = {
      'schema-persona-required': 'withPersona({ name: "...", role: "...", description: "..." }) を使用してください',
      'schema-knowledge-exists': 'withKnowledge({ add: [...] }) で知識ドメインを追加してください',
      'capability-core-enabled': '対話機能を無効化しないでください',
      'quality-response-time': 'targetSeconds < maxSeconds となるよう設定してください',
      'quality-satisfaction-target': 'targetScore を 4.0 以上に設定することを推奨します',
      'security-restricted-db': 'client-financials, personal-data などを restricted に追加してください',
      'integration-reporting': 'withCollaboration({ reportingTo: ["mother-ai"] }) を設定してください',
    };
    return suggestions[ruleId] ?? '設定を見直してください';
  }

  getRules(): ValidationRule[] {
    return [...this.rules];
  }

  getRulesByType(type: ValidationRecord['type']): ValidationRule[] {
    return this.rules.filter(r => r.type === type);
  }

  getRulesByPhase(phase: WorkflowPhase): ValidationRule[] {
    return this.rules.filter(r => r.phase.includes(phase));
  }
}
