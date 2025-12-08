/**
 * Avatar System Type Definitions
 *
 * CEOアバターおよび専門アバター関連の型定義
 */

import type { Message, MessageParam } from '@anthropic-ai/sdk/resources/messages.js';

/**
 * アバタータイプ
 */
export type AvatarType =
  | 'ceo'           // CEOアバター：クライアント統括
  | 'specialist';   // 専門アバター：特定分野の専門家

/**
 * アバターステータス
 */
export type AvatarStatus =
  | 'idle'          // 待機中
  | 'listening'     // 傾聴中
  | 'thinking'      // 思考中
  | 'speaking'      // 応答中
  | 'delegating'    // 専門家へ委任中
  | 'reporting';    // レポート生成中

/**
 * 専門アバターの種類
 */
export type SpecialistType =
  | 'business'      // ビジネス戦略
  | 'technology'    // 技術アーキテクチャ
  | 'marketing'     // マーケティング
  | 'finance'       // 財務・会計
  | 'legal'         // 法務・コンプライアンス
  | 'hr';           // 人事・組織

/**
 * タスク優先度
 */
export type TaskPriority =
  | 'urgent'        // 緊急
  | 'high'          // 高
  | 'medium'        // 中
  | 'low';          // 低

/**
 * アバターメッセージ
 */
export interface AvatarMessage {
  /** メッセージID */
  id: string;
  /** タイムスタンプ */
  timestamp: Date;
  /** 発言者（user or avatar） */
  role: 'user' | 'assistant';
  /** メッセージ内容 */
  content: string;
  /** メタデータ（任意） */
  metadata?: Record<string, unknown>;
}

/**
 * アバターセッション
 */
export interface AvatarSession {
  /** セッションID */
  id: string;
  /** クライアントID */
  clientId: string;
  /** セッション開始時刻 */
  startedAt: Date;
  /** 最終更新時刻 */
  updatedAt: Date;
  /** 会話履歴 */
  messages: AvatarMessage[];
  /** セッションコンテキスト */
  context?: Record<string, unknown>;
}

/**
 * アバタータスク
 */
export interface AvatarTask {
  /** タスクID */
  id: string;
  /** タスク名 */
  title: string;
  /** タスク詳細 */
  description: string;
  /** 優先度 */
  priority: TaskPriority;
  /** 担当専門家（null=CEOが直接処理） */
  assignedTo: SpecialistType | null;
  /** ステータス */
  status: 'pending' | 'in_progress' | 'completed' | 'blocked';
  /** 作成日時 */
  createdAt: Date;
  /** 期限 */
  dueDate?: Date;
  /** 依存タスクID */
  dependencies?: string[];
  /** タスク結果 */
  result?: AvatarTaskResult;
}

/**
 * タスク結果
 */
export interface AvatarTaskResult {
  /** 完了日時 */
  completedAt: Date;
  /** 結果サマリー */
  summary: string;
  /** 詳細データ */
  details?: Record<string, unknown>;
  /** 次のアクション提案 */
  suggestedActions?: string[];
}

/**
 * アバターレポート
 */
export interface AvatarReport {
  /** レポートID */
  id: string;
  /** レポートタイトル */
  title: string;
  /** 生成日時 */
  generatedAt: Date;
  /** エグゼクティブサマリー */
  executiveSummary: string;
  /** セクション一覧 */
  sections: ReportSection[];
  /** 戦略オプション */
  strategicOptions?: StrategicOption[];
  /** リスク分析 */
  risks?: RiskAnalysis[];
  /** アクションアイテム */
  actionItems?: ActionItem[];
}

/**
 * レポートセクション
 */
export interface ReportSection {
  /** セクションタイトル */
  title: string;
  /** セクション内容 */
  content: string;
  /** 重要度（1-5） */
  importance?: number;
  /** データソース */
  sources?: string[];
}

/**
 * 戦略オプション
 */
export interface StrategicOption {
  /** オプション名 */
  name: string;
  /** 説明 */
  description: string;
  /** メリット */
  benefits: string[];
  /** デメリット・リスク */
  risks: string[];
  /** 推定コスト */
  estimatedCost?: string;
  /** 推定期間 */
  estimatedDuration?: string;
  /** 推奨度（1-5） */
  recommendation?: number;
}

/**
 * リスク分析
 */
export interface RiskAnalysis {
  /** リスク名 */
  name: string;
  /** リスク説明 */
  description: string;
  /** 発生確率（low/medium/high） */
  probability: 'low' | 'medium' | 'high';
  /** 影響度（low/medium/high） */
  impact: 'low' | 'medium' | 'high';
  /** 対策案 */
  mitigation?: string[];
}

/**
 * アクションアイテム
 */
export interface ActionItem {
  /** アイテムID */
  id: string;
  /** アクション内容 */
  action: string;
  /** 担当者・チーム */
  owner: string;
  /** 優先度 */
  priority: TaskPriority;
  /** 期限 */
  deadline?: Date;
  /** ステータス */
  status: 'pending' | 'in_progress' | 'completed';
}

/**
 * 基底アバター設定
 */
export interface BaseAvatarConfig {
  /** アバタータイプ */
  type: AvatarType;
  /** 表示名 */
  displayName: string;
  /** ペルソナ定義 */
  persona: string;
  /** Claude APIキー */
  apiKey: string;
  /** モデル名（デフォルト: claude-sonnet-4-20250514） */
  model?: string;
  /** 最大トークン数 */
  maxTokens?: number;
  /** 温度パラメータ */
  temperature?: number;
}

/**
 * CEOアバター設定
 */
export interface CEOAvatarConfig extends BaseAvatarConfig {
  type: 'ceo';
  /** 専門アバター設定 */
  specialists?: Record<SpecialistType, BaseAvatarConfig>;
  /** ナレッジベースパス */
  knowledgeBasePath?: string;
}

/**
 * 専門アバター設定
 */
export interface SpecialistAvatarConfig extends BaseAvatarConfig {
  type: 'specialist';
  /** 専門分野 */
  specialization: SpecialistType;
  /** 専門知識パス */
  expertisePath?: string;
}

/**
 * ストリーミングチャンク
 */
export interface StreamChunk {
  /** チャンクタイプ */
  type: 'content' | 'thinking' | 'complete' | 'error';
  /** チャンク内容 */
  content?: string;
  /** エラー情報 */
  error?: Error;
}

/**
 * ナレッジベースエントリ
 */
export interface KnowledgeEntry {
  /** エントリID */
  id: string;
  /** カテゴリー */
  category: string;
  /** タイトル */
  title: string;
  /** 内容 */
  content: string;
  /** タグ */
  tags?: string[];
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
}

/**
 * Claude API応答型（再エクスポート）
 */
export type { Message, MessageParam };
