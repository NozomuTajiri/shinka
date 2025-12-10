/**
 * Shinkai AI Consulting System
 *
 * 5つのコンサルタントアバター + Mother AI による
 * AIコンサルティングプラットフォーム
 *
 * @module shinkai
 */

// System
export * from './types.js';
export {
  ShinkaiSystem,
  getSystem,
  createSystem,
  initializeSystem,
} from './system.js';

// Avatars
export { HirakuAvatar } from './avatars/hiraku/index.js';
export { SenryakuAvatar } from './avatars/senryaku/index.js';
export { EigyoAvatar } from './avatars/eigyo/index.js';
export { ShijoAvatar } from './avatars/shijo/index.js';
export { KanriAvatar } from './avatars/kanri/index.js';

// Protocols
export {
  ReportEngine,
  RequestEngine,
  ArbitrationEngine,
  SessionEngine,
  InsightEngine as ProtocolInsightEngine,
  initializeProtocols,
} from './protocols/index.js';

// Avatar Templates
export {
  AvatarBuilder,
  createAvatarBuilder,
  ValidationEngine,
  WorkflowEngine,
  CATEGORY_TEMPLATES,
  initializeTemplateSystem,
} from './avatar-templates/index.js';

// Mother AI Engines
export { AvatarBuilderEngine } from './mother-ai/engines/avatar-builder/index.js';
export { ConsolidationEngine } from './mother-ai/engines/consolidation/index.js';
export { InsightEngine as MotherAIInsightEngine } from './mother-ai/engines/insight/index.js';
export { QualityEngine } from './mother-ai/engines/quality/index.js';

/**
 * クイックスタート
 *
 * @example
 * ```typescript
 * import { initializeSystem, getSystem } from 'shinkai';
 *
 * // システム初期化
 * const result = await initializeSystem({
 *   environment: 'development',
 *   logLevel: 'debug',
 * });
 *
 * if (result.success) {
 *   const system = getSystem();
 *   const hiraku = system.getComponent('hiraku');
 *   // アバターを使用...
 * }
 * ```
 */
