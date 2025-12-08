/**
 * データベースモジュール エントリポイント
 * 価値共創情報基盤の統合エクスポート
 */

// 型定義
export * from './types.js';

// ナレッジベース
export { KnowledgeBase, getKnowledgeBase } from './knowledge-base.js';

// クライアントデータベース
export { ClientDatabase, getClientDatabase } from './client-db.js';

// アバターデータベース
export { AvatarDatabase, getAvatarDatabase } from './avatar-db.js';
