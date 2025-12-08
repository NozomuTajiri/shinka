/**
 * データベース型定義
 * 価値共創情報基盤のための型システム
 */

/**
 * ナレッジベースエントリ
 */
export interface KnowledgeEntry {
  id: string;
  title: string;
  content: string;
  category: KnowledgeCategory;
  tags: string[];
  vector?: number[]; // ベクトル表現（実装時に追加）
  metadata: {
    createdAt: Date;
    updatedAt: Date;
    author: string;
    version: string;
  };
}

/**
 * ナレッジカテゴリ
 */
export type KnowledgeCategory =
  | 'methodology' // 付加価値経営®メソドロジー
  | 'case-study' // 事例
  | 'framework' // フレームワーク
  | 'best-practice' // ベストプラクティス
  | 'insight'; // インサイト

/**
 * 検索クエリ
 */
export interface SearchQuery {
  text: string;
  category?: KnowledgeCategory;
  tags?: string[];
  limit?: number;
}

/**
 * 検索結果
 */
export interface SearchResult {
  entry: KnowledgeEntry;
  score: number; // 類似度スコア（0-1）
  highlights?: string[]; // ハイライト箇所
}

/**
 * クライアント企業プロファイル
 */
export interface ClientProfile {
  id: string;
  companyName: string;
  industry: string;
  size: CompanySize;
  challenges: Challenge[];
  dialogHistory: DialogSession[];
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 企業規模
 */
export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';

/**
 * 課題情報
 */
export interface Challenge {
  id: string;
  title: string;
  description: string;
  category: ChallengeCategory;
  status: ChallengeStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  identifiedAt: Date;
  resolvedAt?: Date;
}

/**
 * 課題カテゴリ
 */
export type ChallengeCategory =
  | 'strategy' // 戦略
  | 'operation' // 業務
  | 'organization' // 組織
  | 'technology' // 技術
  | 'finance' // 財務
  | 'marketing' // マーケティング
  | 'hr'; // 人事

/**
 * 課題ステータス
 */
export type ChallengeStatus = 'identified' | 'analyzing' | 'planning' | 'implementing' | 'resolved';

/**
 * 対話セッション
 */
export interface DialogSession {
  id: string;
  clientId: string;
  avatarId: string;
  messages: Message[];
  insights: Insight[];
  startedAt: Date;
  endedAt?: Date;
  status: SessionStatus;
}

/**
 * セッションステータス
 */
export type SessionStatus = 'active' | 'paused' | 'completed' | 'archived';

/**
 * メッセージ
 */
export interface Message {
  id: string;
  sessionId: string;
  role: 'user' | 'avatar';
  content: string;
  timestamp: Date;
  metadata?: {
    knowledgeReferences?: string[]; // 参照したナレッジID
    confidence?: number; // 応答の信頼度
  };
}

/**
 * インサイト（対話から得られた洞察）
 */
export interface Insight {
  id: string;
  sessionId: string;
  type: InsightType;
  content: string;
  relatedChallenges?: string[]; // 関連課題ID
  actionItems?: ActionItem[];
  extractedAt: Date;
}

/**
 * インサイトタイプ
 */
export type InsightType =
  | 'pain-point' // 痛点
  | 'opportunity' // 機会
  | 'risk' // リスク
  | 'requirement' // 要求
  | 'feedback'; // フィードバック

/**
 * アクションアイテム
 */
export interface ActionItem {
  id: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  dueDate?: Date;
  status: 'pending' | 'in-progress' | 'completed';
}

/**
 * アバター定義
 */
export interface Avatar {
  id: string;
  name: string;
  role: AvatarRole;
  description: string;
  expertise: string[];
  personality: Personality;
  systemPrompt: string;
  modelConfig: ModelConfig;
  performanceMetrics: PerformanceMetrics;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * アバター役割
 */
export type AvatarRole =
  | 'ceo' // CEO
  | 'strategy' // 戦略コンサルタント
  | 'finance' // 財務アドバイザー
  | 'marketing' // マーケティングスペシャリスト
  | 'tech' // テクノロジーエキスパート
  | 'hr' // 人事コンサルタント
  | 'operations'; // オペレーション最適化

/**
 * パーソナリティ特性
 */
export interface Personality {
  tone: 'formal' | 'friendly' | 'professional' | 'casual';
  verbosity: 'concise' | 'balanced' | 'detailed';
  empathy: 'low' | 'medium' | 'high';
  assertiveness: 'low' | 'medium' | 'high';
}

/**
 * モデル設定
 */
export interface ModelConfig {
  provider: 'anthropic' | 'openai';
  model: string;
  temperature: number;
  maxTokens: number;
  streaming: boolean;
}

/**
 * パフォーマンスメトリクス
 */
export interface PerformanceMetrics {
  totalSessions: number;
  averageSessionDuration: number; // 秒
  averageResponseTime: number; // ミリ秒
  userSatisfactionScore: number; // 0-5
  insightsGenerated: number;
  lastUpdated: Date;
}

/**
 * API レスポンス型
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: {
    timestamp: Date;
    requestId: string;
  };
}

/**
 * API エラー型
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * ページネーション情報
 */
export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

/**
 * ページネーション付きレスポンス
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: PaginationInfo;
}
