/**
 * アバターテンプレートシステム
 * @module avatar-templates
 *
 * 追加アバター構築のためのテンプレート設計システム:
 * - base: 全アバター共通のベーステンプレート
 * - categories: 6カテゴリ別テンプレート
 * - builder: Fluent APIによるアバター構築
 * - workflow: 検証・承認・トライアルワークフロー
 */

// Base Template System
export * from './base/index.js';

// Category Templates
export * from './categories/index.js';

// Avatar Builder
export * from './builder/index.js';

// Validation & Workflow
export * from './workflow/index.js';

/**
 * アバターテンプレートシステムの完全初期化
 */
export async function initializeTemplateSystem() {
  const { ValidationEngine } = await import('./workflow/validation-engine.js');
  const { WorkflowEngine } = await import('./workflow/workflow-engine.js');
  const { AvatarBuilder } = await import('./builder/avatar-builder.js');
  const { CATEGORY_TEMPLATES } = await import('./categories/index.js');

  return {
    validation: new ValidationEngine(),
    workflow: new WorkflowEngine(),
    builder: new AvatarBuilder(),
    categories: CATEGORY_TEMPLATES,
  };
}
