/**
 * カクシン ナレッジDB統合管理システム
 * 付加価値経営®フレームワーク準拠
 *
 * 13種類のナレッジDBを統合管理し、高速検索・類似度検索を提供
 */

import type {
  KnowledgeEntry,
  KnowledgeDBType,
  ProductEntry,
  HeroStoryEntry,
  DeepNeedsEntry,
  ElevatorPitchEntry,
  ValueTemplateEntry,
  ObjectionHandlingEntry,
  SuccessInfoEntry,
  TechnologySeedEntry,
  MegatrendEntry,
  ShortTermTrendEntry,
  PartnerEntry,
  CompetitorEntry,
  ChannelEntry,
  SearchQuery,
  SearchResult,
} from './types.js';

/**
 * カクシンナレッジDB - 13種類のナレッジを統合管理
 */
export class KakushinKnowledgeDB {
  private productDB: Map<string, ProductEntry> = new Map();
  private heroStoryDB: Map<string, HeroStoryEntry> = new Map();
  private deepNeedsDB: Map<string, DeepNeedsEntry> = new Map();
  private elevatorPitchDB: Map<string, ElevatorPitchEntry> = new Map();
  private valueTemplateDB: Map<string, ValueTemplateEntry> = new Map();
  private objectionHandlingDB: Map<string, ObjectionHandlingEntry> = new Map();
  private successInfoDB: Map<string, SuccessInfoEntry> = new Map();
  private technologySeedDB: Map<string, TechnologySeedEntry> = new Map();
  private megatrendDB: Map<string, MegatrendEntry> = new Map();
  private shortTermTrendDB: Map<string, ShortTermTrendEntry> = new Map();
  private partnerDB: Map<string, PartnerEntry> = new Map();
  private competitorDB: Map<string, CompetitorEntry> = new Map();
  private channelDB: Map<string, ChannelEntry> = new Map();

  constructor() {
    console.log('🗄️  カクシンナレッジDB初期化完了');
  }

  /**
   * 指定されたDBタイプに対応するMapを取得
   */
  private getDB(type: KnowledgeDBType): Map<string, KnowledgeEntry> {
    switch (type) {
      case 'product':
        return this.productDB as Map<string, KnowledgeEntry>;
      case 'heroStory':
        return this.heroStoryDB as Map<string, KnowledgeEntry>;
      case 'deepNeeds':
        return this.deepNeedsDB as Map<string, KnowledgeEntry>;
      case 'elevatorPitch':
        return this.elevatorPitchDB as Map<string, KnowledgeEntry>;
      case 'valueTemplate':
        return this.valueTemplateDB as Map<string, KnowledgeEntry>;
      case 'objectionHandling':
        return this.objectionHandlingDB as Map<string, KnowledgeEntry>;
      case 'successInfo':
        return this.successInfoDB as Map<string, KnowledgeEntry>;
      case 'technologySeed':
        return this.technologySeedDB as Map<string, KnowledgeEntry>;
      case 'megatrend':
        return this.megatrendDB as Map<string, KnowledgeEntry>;
      case 'shortTermTrend':
        return this.shortTermTrendDB as Map<string, KnowledgeEntry>;
      case 'partner':
        return this.partnerDB as Map<string, KnowledgeEntry>;
      case 'competitor':
        return this.competitorDB as Map<string, KnowledgeEntry>;
      case 'channel':
        return this.channelDB as Map<string, KnowledgeEntry>;
    }
  }

  /**
   * エントリを追加
   */
  add<T extends KnowledgeEntry>(
    type: KnowledgeDBType,
    entry: Omit<T, 'createdAt' | 'updatedAt'>
  ): T {
    const db = this.getDB(type);
    const now = new Date();
    const fullEntry = {
      ...entry,
      createdAt: now,
      updatedAt: now,
    } as T;

    db.set(fullEntry.id, fullEntry);
    console.log(`✅ [${type}] エントリ追加: ${fullEntry.id} - ${fullEntry.title}`);
    return fullEntry;
  }

  /**
   * エントリを更新
   */
  update<T extends KnowledgeEntry>(
    type: KnowledgeDBType,
    id: string,
    updates: Partial<Omit<T, 'id' | 'createdAt' | 'updatedAt'>>
  ): T | null {
    const db = this.getDB(type);
    const existing = db.get(id) as T | undefined;

    if (!existing) {
      console.warn(`⚠️  [${type}] エントリが見つかりません: ${id}`);
      return null;
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    } as T;

    db.set(id, updated);
    console.log(`🔄 [${type}] エントリ更新: ${id} - ${updated.title}`);
    return updated;
  }

  /**
   * エントリを削除
   */
  delete(type: KnowledgeDBType, id: string): boolean {
    const db = this.getDB(type);
    const deleted = db.delete(id);
    if (deleted) {
      console.log(`🗑️  [${type}] エントリ削除: ${id}`);
    } else {
      console.warn(`⚠️  [${type}] 削除対象が見つかりません: ${id}`);
    }
    return deleted;
  }

  /**
   * IDでエントリを取得
   */
  get<T extends KnowledgeEntry>(type: KnowledgeDBType, id: string): T | null {
    const db = this.getDB(type);
    return (db.get(id) as T) || null;
  }

  /**
   * 全エントリを取得
   */
  getAll<T extends KnowledgeEntry>(type: KnowledgeDBType): T[] {
    const db = this.getDB(type);
    return Array.from(db.values()) as T[];
  }

  /**
   * エントリ数を取得
   */
  count(type: KnowledgeDBType): number {
    const db = this.getDB(type);
    return db.size;
  }

  /**
   * 全文検索
   */
  search<T extends KnowledgeEntry>(
    type: KnowledgeDBType,
    query: SearchQuery
  ): SearchResult<T> {
    const startTime = Date.now();
    const db = this.getDB(type);
    let results = Array.from(db.values()) as T[];

    // キーワード検索
    if (query.keyword) {
      const keyword = query.keyword.toLowerCase();
      results = results.filter((entry) => {
        const searchText = JSON.stringify(entry).toLowerCase();
        return searchText.includes(keyword);
      });
    }

    // カテゴリフィルタ
    if (query.category) {
      results = results.filter((entry) => entry.category === query.category);
    }

    // タグフィルタ
    if (query.tags && query.tags.length > 0) {
      results = results.filter((entry) =>
        query.tags!.some((tag) => entry.tags.includes(tag))
      );
    }

    // 優先度フィルタ
    if (query.priority !== undefined) {
      results = results.filter((entry) => entry.priority === query.priority);
    }

    // 結果数制限
    const total = results.length;
    if (query.limit) {
      results = results.slice(0, query.limit);
    }

    const executionTimeMs = Date.now() - startTime;

    console.log(
      `🔍 [${type}] 検索完了: ${results.length}/${total}件 (${executionTimeMs}ms)`
    );

    return {
      entries: results,
      total,
      executionTimeMs,
    };
  }

  /**
   * 類似度検索（シミュレート版）
   * タグの一致数と説明文のキーワード一致で類似度を計算
   */
  findSimilar<T extends KnowledgeEntry>(
    type: KnowledgeDBType,
    targetId: string,
    limit: number = 5
  ): T[] {
    const startTime = Date.now();
    const db = this.getDB(type);
    const target = db.get(targetId) as T | undefined;

    if (!target) {
      console.warn(`⚠️  [${type}] 対象エントリが見つかりません: ${targetId}`);
      return [];
    }

    const allEntries = Array.from(db.values()).filter(
      (e) => e.id !== targetId
    ) as T[];

    // 類似度計算
    const scored = allEntries.map((entry) => {
      let score = 0;

      // タグの一致（1つあたり10点）
      const matchingTags = entry.tags.filter((tag) =>
        target.tags.includes(tag)
      ).length;
      score += matchingTags * 10;

      // カテゴリ一致（20点）
      if (entry.category === target.category) {
        score += 20;
      }

      // 説明文の共通キーワード（簡易版）
      const targetWords = target.description
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const entryWords = entry.description
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3);
      const commonWords = targetWords.filter((w) => entryWords.includes(w));
      score += commonWords.length * 5;

      return { entry, score };
    });

    // スコア順にソート
    scored.sort((a, b) => b.score - a.score);

    const results = scored.slice(0, limit).map((s) => s.entry);
    const executionTimeMs = Date.now() - startTime;

    console.log(
      `🎯 [${type}] 類似検索完了: ${results.length}件 (${executionTimeMs}ms)`
    );

    return results;
  }

  /**
   * カテゴリ一覧を取得
   */
  getCategories(type: KnowledgeDBType): string[] {
    const db = this.getDB(type);
    const categories = new Set<string>();
    for (const entry of db.values()) {
      categories.add(entry.category);
    }
    return Array.from(categories).sort();
  }

  /**
   * タグ一覧を取得
   */
  getTags(type: KnowledgeDBType): string[] {
    const db = this.getDB(type);
    const tags = new Set<string>();
    for (const entry of db.values()) {
      entry.tags.forEach((tag) => tags.add(tag));
    }
    return Array.from(tags).sort();
  }

  /**
   * 統計情報を取得
   */
  getStats(): Record<KnowledgeDBType, number> {
    return {
      product: this.productDB.size,
      heroStory: this.heroStoryDB.size,
      deepNeeds: this.deepNeedsDB.size,
      elevatorPitch: this.elevatorPitchDB.size,
      valueTemplate: this.valueTemplateDB.size,
      objectionHandling: this.objectionHandlingDB.size,
      successInfo: this.successInfoDB.size,
      technologySeed: this.technologySeedDB.size,
      megatrend: this.megatrendDB.size,
      shortTermTrend: this.shortTermTrendDB.size,
      partner: this.partnerDB.size,
      competitor: this.competitorDB.size,
      channel: this.channelDB.size,
    };
  }

  /**
   * 全DBをクリア
   */
  clear(): void {
    this.productDB.clear();
    this.heroStoryDB.clear();
    this.deepNeedsDB.clear();
    this.elevatorPitchDB.clear();
    this.valueTemplateDB.clear();
    this.objectionHandlingDB.clear();
    this.successInfoDB.clear();
    this.technologySeedDB.clear();
    this.megatrendDB.clear();
    this.shortTermTrendDB.clear();
    this.partnerDB.clear();
    this.competitorDB.clear();
    this.channelDB.clear();
    console.log('🧹 全ナレッジDBをクリアしました');
  }

  /**
   * 初期データをロード
   */
  async loadInitialData(data: {
    products?: ProductEntry[];
    heroStories?: HeroStoryEntry[];
    deepNeeds?: DeepNeedsEntry[];
    elevatorPitches?: ElevatorPitchEntry[];
    valueTemplates?: ValueTemplateEntry[];
    objectionHandlings?: ObjectionHandlingEntry[];
    successInfos?: SuccessInfoEntry[];
    technologySeeds?: TechnologySeedEntry[];
    megatrends?: MegatrendEntry[];
    shortTermTrends?: ShortTermTrendEntry[];
    partners?: PartnerEntry[];
    competitors?: CompetitorEntry[];
    channels?: ChannelEntry[];
  }): Promise<void> {
    console.log('📥 初期データをロード中...');

    data.products?.forEach((entry) => this.add('product', entry));
    data.heroStories?.forEach((entry) => this.add('heroStory', entry));
    data.deepNeeds?.forEach((entry) => this.add('deepNeeds', entry));
    data.elevatorPitches?.forEach((entry) => this.add('elevatorPitch', entry));
    data.valueTemplates?.forEach((entry) => this.add('valueTemplate', entry));
    data.objectionHandlings?.forEach((entry) =>
      this.add('objectionHandling', entry)
    );
    data.successInfos?.forEach((entry) => this.add('successInfo', entry));
    data.technologySeeds?.forEach((entry) => this.add('technologySeed', entry));
    data.megatrends?.forEach((entry) => this.add('megatrend', entry));
    data.shortTermTrends?.forEach((entry) => this.add('shortTermTrend', entry));
    data.partners?.forEach((entry) => this.add('partner', entry));
    data.competitors?.forEach((entry) => this.add('competitor', entry));
    data.channels?.forEach((entry) => this.add('channel', entry));

    console.log('✅ 初期データロード完了');
    console.log('📊 ナレッジDB統計:', this.getStats());
  }

  /**
   * JSONにエクスポート
   */
  exportToJSON(): string {
    const data = {
      products: Array.from(this.productDB.values()),
      heroStories: Array.from(this.heroStoryDB.values()),
      deepNeeds: Array.from(this.deepNeedsDB.values()),
      elevatorPitches: Array.from(this.elevatorPitchDB.values()),
      valueTemplates: Array.from(this.valueTemplateDB.values()),
      objectionHandlings: Array.from(this.objectionHandlingDB.values()),
      successInfos: Array.from(this.successInfoDB.values()),
      technologySeeds: Array.from(this.technologySeedDB.values()),
      megatrends: Array.from(this.megatrendDB.values()),
      shortTermTrends: Array.from(this.shortTermTrendDB.values()),
      partners: Array.from(this.partnerDB.values()),
      competitors: Array.from(this.competitorDB.values()),
      channels: Array.from(this.channelDB.values()),
      exportedAt: new Date().toISOString(),
      stats: this.getStats(),
    };

    return JSON.stringify(data, null, 2);
  }
}

/**
 * デフォルトインスタンス（シングルトン）
 */
export const kakushinDB = new KakushinKnowledgeDB();
