/**
 * コアモジュール
 * @module core
 *
 * システム基盤コンポーネント:
 * - session: クライアントセッション管理
 * - events: イベントバス・コンポーネント間通信
 * - config: 設定・環境管理
 */

// Session Management
export * from './session/index.js';

// Event Bus
export * from './events/index.js';

// Configuration
export * from './config/index.js';
