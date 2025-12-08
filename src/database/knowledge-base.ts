/**
 * ナレッジベースシステム
 * 付加価値経営®メソドロジーの検索と管理
 */

import {
  KnowledgeEntry,
  SearchQuery,
  SearchResult,
  KnowledgeCategory,
} from './types.js';

/**
 * ナレッジベースクラス
 * ベクトル類似度検索のシミュレーション実装
 */
export class KnowledgeBase {
  private entries: Map<string, KnowledgeEntry>;

  constructor() {
    this.entries = new Map();
    this.initializeDefaultKnowledge();
  }

  /**
   * 初期ナレッジの登録
   */
  private initializeDefaultKnowledge(): void {
    const defaultEntries: KnowledgeEntry[] = [
      {
        id: 'kb-001',
        title: '付加価値経営®の基本原則',
        content: `
付加価値経営®は、企業の持続的成長を実現するための経営手法です。

【核心原則】
1. 顧客価値の最大化
2. 組織能力の向上
3. イノベーションの推進
4. ステークホルダーとの価値共創

【実践ステップ】
- 現状分析と課題特定
- 価値創造戦略の策定
- 実行計画の立案
- PDCAサイクルの運用
        `,
        category: 'methodology',
        tags: ['基本', '原則', '戦略'],
        metadata: {
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
          author: '付加価値経営研究所',
          version: '1.0',
        },
      },
      {
        id: 'kb-002',
        title: '組織変革のフレームワーク',
        content: `
組織変革を成功に導くための体系的アプローチ。

【変革の3段階】
1. 解凍（Unfreezing）：現状認識と変革の必要性共有
2. 変革（Changing）：新しい行動様式の導入
3. 再凍結（Refreezing）：新しい文化の定着

【成功要因】
- トップのコミットメント
- ビジョンの明確化
- コミュニケーション強化
- 早期の成功体験創出
        `,
        category: 'framework',
        tags: ['組織変革', '変革管理', 'チェンジマネジメント'],
        metadata: {
          createdAt: new Date('2025-01-05'),
          updatedAt: new Date('2025-01-05'),
          author: '組織開発チーム',
          version: '1.0',
        },
      },
      {
        id: 'kb-003',
        title: 'デジタルトランスフォーメーション事例',
        content: `
製造業A社のDX推進事例。

【背景】
- 従来型の業務プロセス
- デジタル化の遅れ
- 競争力の低下

【施策】
1. IoTセンサーによる生産ライン可視化
2. AIによる需要予測システム導入
3. クラウド基盤への移行
4. データドリブン意思決定の推進

【成果】
- 生産効率 30%向上
- 在庫コスト 25%削減
- 意思決定スピード 2倍
        `,
        category: 'case-study',
        tags: ['DX', '製造業', 'IoT', 'AI'],
        metadata: {
          createdAt: new Date('2025-01-10'),
          updatedAt: new Date('2025-01-10'),
          author: 'DXコンサルティング部',
          version: '1.0',
        },
      },
      {
        id: 'kb-004',
        title: '財務健全性診断のベストプラクティス',
        content: `
企業の財務健全性を評価するための実践的手法。

【診断項目】
1. 収益性：ROE, ROA, 売上高利益率
2. 安全性：自己資本比率, 流動比率
3. 効率性：総資産回転率, 棚卸資産回転率
4. 成長性：売上成長率, 利益成長率

【分析手法】
- トレンド分析：時系列での推移確認
- 同業比較：業界平均との比較
- デュポン分析：ROEの要因分解
- キャッシュフロー分析：資金繰り評価
        `,
        category: 'best-practice',
        tags: ['財務分析', '経営指標', '診断'],
        metadata: {
          createdAt: new Date('2025-01-15'),
          updatedAt: new Date('2025-01-15'),
          author: '財務アドバイザリー',
          version: '1.0',
        },
      },
      {
        id: 'kb-005',
        title: '顧客価値創造のインサイト',
        content: `
現代ビジネスにおける顧客価値創造の本質。

【価値創造の4つの軸】
1. 機能的価値：製品・サービスの基本性能
2. 経済的価値：コストパフォーマンス
3. 感情的価値：顧客体験と満足度
4. 社会的価値：サステナビリティと社会貢献

【実践ポイント】
- カスタマージャーニーマッピング
- ペルソナ設計
- 継続的なフィードバック収集
- データに基づく価値検証
        `,
        category: 'insight',
        tags: ['顧客価値', 'CX', 'マーケティング'],
        metadata: {
          createdAt: new Date('2025-01-20'),
          updatedAt: new Date('2025-01-20'),
          author: 'マーケティング研究室',
          version: '1.0',
        },
      },
    ];

    defaultEntries.forEach((entry) => {
      this.entries.set(entry.id, entry);
    });
  }

  /**
   * ナレッジ検索（ベクトル類似度シミュレーション）
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    // クエリテキストの正規化
    const normalizedQuery = query.text.toLowerCase();

    for (const entry of this.entries.values()) {
      // カテゴリフィルタリング
      if (query.category && entry.category !== query.category) {
        continue;
      }

      // タグフィルタリング
      if (query.tags && query.tags.length > 0) {
        const hasMatchingTag = query.tags.some((tag) =>
          entry.tags.some((entryTag) =>
            entryTag.toLowerCase().includes(tag.toLowerCase())
          )
        );
        if (!hasMatchingTag) {
          continue;
        }
      }

      // 類似度計算（簡易実装：キーワードマッチング）
      const score = this.calculateSimpleSimilarity(normalizedQuery, entry);

      if (score > 0) {
        results.push({
          entry,
          score,
          highlights: this.extractHighlights(normalizedQuery, entry),
        });
      }
    }

    // スコアでソート（降順）
    results.sort((a, b) => b.score - a.score);

    // 上位N件を返す
    const limit = query.limit || 5;
    return results.slice(0, limit);
  }

  /**
   * 簡易類似度計算
   * 実際の実装では、ベクトル埋め込みとコサイン類似度を使用
   */
  private calculateSimpleSimilarity(
    query: string,
    entry: KnowledgeEntry
  ): number {
    const keywords = query.split(/\s+/).filter((k) => k.length > 1);
    const content = `${entry.title} ${entry.content} ${entry.tags.join(' ')}`.toLowerCase();

    let matchCount = 0;
    let totalWeight = 0;

    keywords.forEach((keyword) => {
      // タイトルマッチは高スコア
      if (entry.title.toLowerCase().includes(keyword)) {
        matchCount += 3;
      }
      // タグマッチは中スコア
      if (entry.tags.some((tag) => tag.toLowerCase().includes(keyword))) {
        matchCount += 2;
      }
      // コンテンツマッチは低スコア
      if (entry.content.toLowerCase().includes(keyword)) {
        matchCount += 1;
      }
      totalWeight += 3;
    });

    return totalWeight > 0 ? matchCount / totalWeight : 0;
  }

  /**
   * ハイライト抽出
   */
  private extractHighlights(query: string, entry: KnowledgeEntry): string[] {
    const keywords = query.split(/\s+/).filter((k) => k.length > 1);
    const highlights: string[] = [];

    const lines = entry.content.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine.length === 0) continue;

      for (const keyword of keywords) {
        if (trimmedLine.toLowerCase().includes(keyword)) {
          highlights.push(trimmedLine);
          break;
        }
      }
    }

    return highlights.slice(0, 3); // 最大3件
  }

  /**
   * ナレッジエントリの追加
   */
  async addEntry(entry: KnowledgeEntry): Promise<void> {
    this.entries.set(entry.id, entry);
  }

  /**
   * ナレッジエントリの取得
   */
  async getEntry(id: string): Promise<KnowledgeEntry | undefined> {
    return this.entries.get(id);
  }

  /**
   * カテゴリ別エントリ取得
   */
  async getEntriesByCategory(
    category: KnowledgeCategory
  ): Promise<KnowledgeEntry[]> {
    return Array.from(this.entries.values()).filter(
      (entry) => entry.category === category
    );
  }

  /**
   * 全エントリ取得
   */
  async getAllEntries(): Promise<KnowledgeEntry[]> {
    return Array.from(this.entries.values());
  }

  /**
   * ナレッジエントリの更新
   */
  async updateEntry(id: string, updates: Partial<KnowledgeEntry>): Promise<void> {
    const entry = this.entries.get(id);
    if (!entry) {
      throw new Error(`Knowledge entry not found: ${id}`);
    }

    const updated = {
      ...entry,
      ...updates,
      metadata: {
        ...entry.metadata,
        updatedAt: new Date(),
      },
    };

    this.entries.set(id, updated);
  }

  /**
   * ナレッジエントリの削除
   */
  async deleteEntry(id: string): Promise<void> {
    this.entries.delete(id);
  }

  /**
   * 統計情報取得
   */
  async getStats(): Promise<{
    totalEntries: number;
    categoryCounts: Record<KnowledgeCategory, number>;
    lastUpdated: Date;
  }> {
    const entries = Array.from(this.entries.values());
    const categoryCounts: Record<KnowledgeCategory, number> = {
      methodology: 0,
      'case-study': 0,
      framework: 0,
      'best-practice': 0,
      insight: 0,
    };

    let lastUpdated = new Date(0);

    entries.forEach((entry) => {
      categoryCounts[entry.category]++;
      if (entry.metadata.updatedAt > lastUpdated) {
        lastUpdated = entry.metadata.updatedAt;
      }
    });

    return {
      totalEntries: entries.length,
      categoryCounts,
      lastUpdated,
    };
  }
}

// シングルトンインスタンス
let knowledgeBaseInstance: KnowledgeBase | null = null;

/**
 * ナレッジベースインスタンス取得
 */
export function getKnowledgeBase(): KnowledgeBase {
  if (!knowledgeBaseInstance) {
    knowledgeBaseInstance = new KnowledgeBase();
  }
  return knowledgeBaseInstance;
}
