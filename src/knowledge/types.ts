/**
 * カクシン ナレッジDB 型定義
 * 付加価値経営®フレームワーク準拠
 */

/**
 * 共通のナレッジエントリベース型
 */
export interface KnowledgeEntry {
  /** 一意識別子 */
  id: string;
  /** タイトル/名称 */
  title: string;
  /** 説明/詳細 */
  description: string;
  /** カテゴリ */
  category: string;
  /** タグ（検索用） */
  tags: string[];
  /** 作成日時 */
  createdAt: Date;
  /** 更新日時 */
  updatedAt: Date;
  /** 優先度 (1-5) */
  priority?: number;
}

/**
 * 1. 商品DB - 商品・サービス情報
 */
export interface ProductEntry extends KnowledgeEntry {
  /** 商品コード */
  productCode: string;
  /** 価格 */
  price?: number;
  /** 提供形態 */
  deliveryFormat: 'product' | 'service' | 'subscription' | 'license';
  /** ターゲット顧客 */
  targetCustomer: string;
  /** 主要機能/特徴 */
  features: string[];
  /** 差別化ポイント */
  differentiators: string[];
}

/**
 * 2. ヒーローメイクトークDB - 成功事例のストーリー
 */
export interface HeroStoryEntry extends KnowledgeEntry {
  /** 顧客名/企業名 */
  customerName: string;
  /** 業種 */
  industry: string;
  /** 課題（Before） */
  challengeBefore: string;
  /** 解決策（What we did） */
  solution: string;
  /** 成果（After） */
  resultsAfter: string;
  /** 定量的効果 */
  quantitativeResults?: {
    metric: string;
    value: string;
  }[];
  /** 顧客の声 */
  testimonial?: string;
}

/**
 * 3. ニーズの裏のニーズDB - 顧客の深層ニーズ
 */
export interface DeepNeedsEntry extends KnowledgeEntry {
  /** 表面的ニーズ */
  surfaceNeed: string;
  /** 深層ニーズ */
  deepNeed: string;
  /** 顧客セグメント */
  customerSegment: string;
  /** 心理的背景 */
  psychologicalContext: string;
  /** 対応するソリューション */
  recommendedSolutions: string[];
  /** 発見のきっかけ */
  discoveryTrigger?: string;
}

/**
 * 4. エレベータピッチDB - 30秒で伝える価値提案
 */
export interface ElevatorPitchEntry extends KnowledgeEntry {
  /** 対象顧客/シーン */
  targetAudience: string;
  /** 課題提起 */
  problemStatement: string;
  /** ソリューション */
  solution: string;
  /** 独自性 */
  uniqueness: string;
  /** 行動喚起 */
  callToAction: string;
  /** 推定所要時間（秒） */
  estimatedSeconds: number;
}

/**
 * 5. バリューテンプレートDB - 価値提案テンプレート
 */
export interface ValueTemplateEntry extends KnowledgeEntry {
  /** テンプレートタイプ */
  templateType: 'canvas' | 'proposition' | 'messaging' | 'positioning';
  /** 顧客セグメント */
  customerSegment: string;
  /** 提供価値 */
  valueProposition: string;
  /** 価値要素 */
  valueElements: {
    functional?: string[];
    emotional?: string[];
    social?: string[];
  };
  /** 証拠・根拠 */
  evidence: string[];
  /** 活用シーン */
  usageScenario: string;
}

/**
 * 6. 反論処理DB - 想定反論とその対処法
 */
export interface ObjectionHandlingEntry extends KnowledgeEntry {
  /** 反論内容 */
  objection: string;
  /** 反論カテゴリ */
  objectionCategory: 'price' | 'timing' | 'authority' | 'need' | 'trust' | 'competition';
  /** 対処法 */
  response: string;
  /** 代替アプローチ */
  alternativeApproaches: string[];
  /** 成功確率 */
  successRate?: number;
  /** 注意点 */
  cautions?: string[];
}

/**
 * 7. 成功情報DB - 成功事例データベース
 */
export interface SuccessInfoEntry extends KnowledgeEntry {
  /** プロジェクト名 */
  projectName: string;
  /** 顧客企業 */
  clientCompany: string;
  /** 期間 */
  duration: string;
  /** 成功要因 */
  successFactors: string[];
  /** KPI達成状況 */
  kpiAchievements: {
    kpi: string;
    target: string;
    actual: string;
    achievementRate: number;
  }[];
  /** 学び・教訓 */
  lessonsLearned: string[];
  /** 再現性 */
  reproducibility: 'high' | 'medium' | 'low';
}

/**
 * 8. シーズDB - 技術・能力のシーズ情報
 */
export interface TechnologySeedEntry extends KnowledgeEntry {
  /** シーズタイプ */
  seedType: 'technology' | 'capability' | 'expertise' | 'resource' | 'platform';
  /** 技術名/能力名 */
  seedName: string;
  /** 成熟度 */
  maturityLevel: 'research' | 'prototype' | 'production' | 'mature';
  /** 応用可能な領域 */
  applicableDomains: string[];
  /** 競争優位性 */
  competitiveAdvantage: string;
  /** 必要リソース */
  requiredResources?: string[];
}

/**
 * 9. メガトレンドDB - 長期トレンド情報
 */
export interface MegatrendEntry extends KnowledgeEntry {
  /** トレンド領域 */
  trendDomain: 'technology' | 'social' | 'economic' | 'environmental' | 'political';
  /** 時間軸（年） */
  timeHorizon: number;
  /** 影響度 */
  impact: 'high' | 'medium' | 'low';
  /** ビジネス機会 */
  businessOpportunities: string[];
  /** リスク */
  risks: string[];
  /** 情報源 */
  sources: string[];
}

/**
 * 10. 短期トレンドDB - 直近のトレンド
 */
export interface ShortTermTrendEntry extends KnowledgeEntry {
  /** トレンド種別 */
  trendType: 'market' | 'technology' | 'consumer' | 'regulation' | 'competition';
  /** 期間（月） */
  durationMonths: number;
  /** 影響を受ける業界 */
  affectedIndustries: string[];
  /** アクション推奨 */
  recommendedActions: string[];
  /** 緊急度 */
  urgency: 'critical' | 'high' | 'medium' | 'low';
  /** 観測開始日 */
  observedSince: Date;
}

/**
 * 11. パートナーDB - パートナー企業情報
 */
export interface PartnerEntry extends KnowledgeEntry {
  /** パートナー企業名 */
  companyName: string;
  /** パートナータイプ */
  partnerType: 'strategic' | 'technology' | 'distribution' | 'reseller' | 'alliance';
  /** 提携内容 */
  partnershipScope: string;
  /** 強み */
  strengths: string[];
  /** 提携による価値 */
  partnershipValue: string;
  /** 契約状況 */
  contractStatus: 'active' | 'negotiating' | 'expired' | 'prospect';
  /** 連絡先情報 */
  contactInfo?: {
    name: string;
    role: string;
    email?: string;
    phone?: string;
  };
}

/**
 * 12. 競合情報DB - 競合分析情報
 */
export interface CompetitorEntry extends KnowledgeEntry {
  /** 競合企業名 */
  companyName: string;
  /** 競合レベル */
  competitionLevel: 'direct' | 'indirect' | 'potential' | 'substitute';
  /** 強み */
  strengths: string[];
  /** 弱み */
  weaknesses: string[];
  /** 市場シェア */
  marketShare?: number;
  /** 価格帯 */
  priceRange?: string;
  /** 差別化戦略 */
  differentiationStrategy: string;
  /** 対抗戦略 */
  counterStrategy: string[];
}

/**
 * 13. チャネルDB - 販売チャネル情報
 */
export interface ChannelEntry extends KnowledgeEntry {
  /** チャネル名 */
  channelName: string;
  /** チャネルタイプ */
  channelType: 'direct' | 'partner' | 'online' | 'retail' | 'hybrid';
  /** 対象顧客セグメント */
  targetSegments: string[];
  /** コスト構造 */
  costStructure?: {
    fixedCost?: number;
    variableCost?: number;
    commissionRate?: number;
  };
  /** パフォーマンス指標 */
  performanceMetrics?: {
    conversionRate?: number;
    avgDealSize?: number;
    salesCycle?: number;
  };
  /** 最適な活用シーン */
  optimalUseCases: string[];
}

/**
 * ナレッジDB種別
 */
export type KnowledgeDBType =
  | 'product'
  | 'heroStory'
  | 'deepNeeds'
  | 'elevatorPitch'
  | 'valueTemplate'
  | 'objectionHandling'
  | 'successInfo'
  | 'technologySeed'
  | 'megatrend'
  | 'shortTermTrend'
  | 'partner'
  | 'competitor'
  | 'channel';

/**
 * 検索条件
 */
export interface SearchQuery {
  /** キーワード（全文検索） */
  keyword?: string;
  /** カテゴリフィルタ */
  category?: string;
  /** タグフィルタ */
  tags?: string[];
  /** 優先度フィルタ */
  priority?: number;
  /** 結果数制限 */
  limit?: number;
}

/**
 * 検索結果
 */
export interface SearchResult<T extends KnowledgeEntry> {
  /** 検索結果エントリ */
  entries: T[];
  /** 総件数 */
  total: number;
  /** 実行時間（ミリ秒） */
  executionTimeMs: number;
}
