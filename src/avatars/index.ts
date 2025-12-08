/**
 * Avatar System - Main Export
 *
 * CEOアバターシステムのメインエクスポート
 */

// 型定義
export type {
  // Avatar Types
  AvatarType,
  AvatarStatus,
  SpecialistType,
  TaskPriority,
  // Message & Session
  AvatarMessage,
  AvatarSession,
  // Task & Report
  AvatarTask,
  AvatarTaskResult,
  AvatarReport,
  ReportSection,
  StrategicOption,
  RiskAnalysis,
  ActionItem,
  // Config
  BaseAvatarConfig,
  CEOAvatarConfig,
  SpecialistAvatarConfig,
  // Streaming
  StreamChunk,
  // Knowledge
  KnowledgeEntry,
  // Claude API
  Message,
  MessageParam,
} from './types.js';

// 基底クラス
export { BaseAvatar } from './base-avatar.js';

// CEOアバター
export { CEOAvatar } from './ceo-avatar.js';

// CEOモジュール
export { CEODialogue } from './ceo-dialogue.js';
export type { DialoguePhase, DialogueContext } from './ceo-dialogue.js';

export { CEOTeamManager } from './ceo-team-manager.js';
export type { TaskAssignment, TeamProgressReport } from './ceo-team-manager.js';

export { CEOReporter } from './ceo-reporter.js';
export type { ReportConfig } from './ceo-reporter.js';
