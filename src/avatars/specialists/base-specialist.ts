/**
 * 専門アバター基底クラス
 * 各領域に特化したアバターの共通機能を提供
 */

import type { Avatar, AvatarPersona } from '@/mother-ai/types';
import type { CoreValue } from '@/types/proposal';

/**
 * 専門領域種別
 */
export type SpecialistDomain =
  | 'sales'
  | 'marketing'
  | 'management'
  | 'finance'
  | 'organization'
  | 'operations';

/**
 * アバター相談リクエスト
 */
export interface ConsultationRequest {
  /** 相談内容 */
  query: string;
  /** 企業コンテキスト */
  companyContext?: {
    industry?: string;
    size?: string;
    challenges?: string[];
  };
  /** 優先する価値領域 */
  focusValues?: CoreValue[];
  /** 追加コンテキスト */
  additionalContext?: string;
}

/**
 * アバター相談レスポンス
 */
export interface ConsultationResponse {
  /** 回答 */
  answer: string;
  /** 推奨アクション */
  recommendations: string[];
  /** 関連する価値領域 */
  relatedValues: CoreValue[];
  /** 参照したナレッジ */
  knowledgeReferences: string[];
  /** CEOへの報告が必要か */
  requiresCEOReport: boolean;
  /** CEOへの報告内容 */
  ceoReport?: CEOReport;
  /** 他アバター連携の提案 */
  collaborationSuggestions?: CollaborationSuggestion[];
  /** 信頼度スコア (0-1) */
  confidenceScore: number;
}

/**
 * CEOへの報告
 */
export interface CEOReport {
  /** 報告カテゴリー */
  category: 'insight' | 'risk' | 'opportunity' | 'decision_required';
  /** 重要度 */
  severity: 'high' | 'medium' | 'low';
  /** サマリー */
  summary: string;
  /** 詳細 */
  details: string;
  /** 推奨アクション */
  recommendedAction: string;
}

/**
 * 他アバター連携提案
 */
export interface CollaborationSuggestion {
  /** 連携先アバター */
  targetAvatar: SpecialistDomain;
  /** 連携理由 */
  reason: string;
  /** 期待される成果 */
  expectedOutcome: string;
}

/**
 * ナレッジベースエントリー
 */
export interface KnowledgeEntry {
  /** ID */
  id: string;
  /** カテゴリー */
  category: string;
  /** タイトル */
  title: string;
  /** 内容 */
  content: string;
  /** タグ */
  tags: string[];
  /** 関連する価値領域 */
  relatedValues: CoreValue[];
}

/**
 * 専門アバター基底クラス
 */
export abstract class BaseSpecialist {
  protected avatar: Avatar;
  protected domain: SpecialistDomain;
  protected knowledgeBase: KnowledgeEntry[];

  constructor(
    domain: SpecialistDomain,
    persona: AvatarPersona,
    knowledgeBase: KnowledgeEntry[] = []
  ) {
    this.domain = domain;
    this.knowledgeBase = knowledgeBase;
    this.avatar = {
      id: `specialist-${domain}`,
      name: this.getAvatarName(),
      competencies: this.getCompetencies(),
      persona,
      status: 'active',
      createdAt: new Date(),
      metrics: {
        totalSessions: 0,
        averageSatisfaction: 0,
        taskCompletionRate: 0,
        responseTimeMs: 0,
        errorRate: 0,
      },
    };
  }

  /**
   * アバター名を取得
   */
  protected abstract getAvatarName(): string;

  /**
   * 専門能力一覧を取得
   */
  protected abstract getCompetencies(): string[];

  /**
   * システムプロンプトを生成
   */
  protected abstract generateSystemPrompt(request: ConsultationRequest): string;

  /**
   * 相談に回答
   */
  async consult(request: ConsultationRequest): Promise<ConsultationResponse> {
    const startTime = Date.now();

    try {
      // ナレッジベースから関連情報を検索
      const relevantKnowledge = this.searchKnowledge(request);

      // システムプロンプトを生成
      const systemPrompt = this.generateSystemPrompt(request);

      // AI応答を生成（実装は各サブクラスで）
      const response = await this.generateResponse(
        request,
        relevantKnowledge,
        systemPrompt
      );

      // メトリクス更新
      this.updateMetrics(Date.now() - startTime, true);

      return response;
    } catch (error) {
      // エラー時のメトリクス更新
      this.updateMetrics(Date.now() - startTime, false);
      throw error;
    }
  }

  /**
   * ナレッジベースを検索
   */
  protected searchKnowledge(request: ConsultationRequest): KnowledgeEntry[] {
    const query = request.query.toLowerCase();
    const contextTags = [
      ...(request.companyContext?.industry ? [request.companyContext.industry] : []),
      ...(request.companyContext?.challenges || []),
      ...(request.focusValues || []),
    ];

    return this.knowledgeBase
      .filter((entry) => {
        // クエリに関連するか
        const matchesQuery =
          entry.title.toLowerCase().includes(query) ||
          entry.content.toLowerCase().includes(query);

        // タグに関連するか
        const matchesTags = entry.tags.some((tag) =>
          contextTags.some((contextTag) =>
            tag.toLowerCase().includes(contextTag.toLowerCase())
          )
        );

        // 価値領域に関連するか
        const matchesValues =
          request.focusValues?.some((value) =>
            entry.relatedValues.includes(value)
          ) || false;

        return matchesQuery || matchesTags || matchesValues;
      })
      .sort((a, b) => {
        // 関連度でソート（簡易実装）
        const scoreA = this.calculateRelevanceScore(a, request);
        const scoreB = this.calculateRelevanceScore(b, request);
        return scoreB - scoreA;
      })
      .slice(0, 5); // 上位5件
  }

  /**
   * 関連度スコアを計算
   */
  private calculateRelevanceScore(
    entry: KnowledgeEntry,
    request: ConsultationRequest
  ): number {
    let score = 0;
    const query = request.query.toLowerCase();

    // タイトルマッチ
    if (entry.title.toLowerCase().includes(query)) score += 3;

    // 内容マッチ
    if (entry.content.toLowerCase().includes(query)) score += 2;

    // タグマッチ
    const contextTags = [
      ...(request.companyContext?.industry ? [request.companyContext.industry] : []),
      ...(request.companyContext?.challenges || []),
      ...(request.focusValues || []),
    ];
    score += entry.tags.filter((tag) =>
      contextTags.some((contextTag) =>
        tag.toLowerCase().includes(contextTag.toLowerCase())
      )
    ).length;

    // 価値領域マッチ
    if (request.focusValues) {
      score += entry.relatedValues.filter((value) =>
        request.focusValues?.includes(value)
      ).length * 2;
    }

    return score;
  }

  /**
   * AI応答を生成（サブクラスで実装）
   */
  protected abstract generateResponse(
    request: ConsultationRequest,
    knowledge: KnowledgeEntry[],
    systemPrompt: string
  ): Promise<ConsultationResponse>;

  /**
   * CEOへ報告
   */
  protected async reportToCEO(report: CEOReport): Promise<void> {
    // CEOアバターへの通知実装（将来的に実装）
    console.log('📊 CEO Report:', {
      avatar: this.avatar.name,
      category: report.category,
      severity: report.severity,
      summary: report.summary,
    });
  }

  /**
   * 他アバターと連携
   */
  protected async collaborateWith(
    targetDomain: SpecialistDomain,
    context: string
  ): Promise<void> {
    // アバター間連携実装（将来的に実装）
    console.log('🤝 Collaboration:', {
      from: this.domain,
      to: targetDomain,
      context,
    });
  }

  /**
   * メトリクス更新
   */
  private updateMetrics(durationMs: number, success: boolean): void {
    const metrics = this.avatar.metrics;
    metrics.totalSessions += 1;
    metrics.lastSessionAt = new Date();

    // 応答時間の移動平均
    metrics.responseTimeMs =
      (metrics.responseTimeMs * (metrics.totalSessions - 1) + durationMs) /
      metrics.totalSessions;

    // エラー率の更新
    if (!success) {
      metrics.errorRate =
        (metrics.errorRate * (metrics.totalSessions - 1) + 1) /
        metrics.totalSessions;
    } else {
      metrics.errorRate =
        (metrics.errorRate * (metrics.totalSessions - 1)) /
        metrics.totalSessions;
    }
  }

  /**
   * アバター情報を取得
   */
  getAvatar(): Avatar {
    return this.avatar;
  }

  /**
   * ナレッジベースを追加
   */
  addKnowledge(entry: KnowledgeEntry): void {
    this.knowledgeBase.push(entry);
  }

  /**
   * ナレッジベースを一括追加
   */
  addKnowledgeBulk(entries: KnowledgeEntry[]): void {
    this.knowledgeBase.push(...entries);
  }

  /**
   * ナレッジベースを取得
   */
  getKnowledgeBase(): KnowledgeEntry[] {
    return this.knowledgeBase;
  }
}
