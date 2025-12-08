/**
 * マザーAI「ORIGIN」
 * システム全体を統括する頭脳
 * 4つのエンジンを統括し、運用サイクルを管理
 */

import Anthropic from '@anthropic-ai/sdk';
import { EventEmitter } from 'events';
import { AvatarBuilder } from './avatar-builder.js';
import { AvatarMerger } from './avatar-merger.js';
import { InsightEngine } from './insight-engine.js';
import { QualityMonitor } from './quality-monitor.js';
import {
  Avatar,
  AvatarBuildRequest,
  AvatarBuildResult,
  CrossInsight,
  QualityAlert,
  MotherAIConfig,
  MotherAIEvent,
  EventHandler,
  OperationCycle,
} from './types.js';

/**
 * デフォルト設定
 */
const DEFAULT_CONFIG: MotherAIConfig = {
  avatarBuilder: {
    similarityThreshold: 0.7,
    trialPeriodDays: 30,
    minROI: 1.5,
  },
  avatarMerger: {
    inactivityDays: 30,
    minSatisfaction: 3.0,
    mergeThreshold: 0.7,
  },
  insightEngine: {
    minOccurrences: 3,
    minSuccessRate: 0.7,
    confidenceThreshold: 0.8,
  },
  qualityMonitor: {
    criticalThresholds: {
      satisfaction: 2.0,
      errorRate: 0.2,
      responseTimeMs: 5000,
      personaConsistency: 0.5,
    },
    warningThresholds: {
      satisfaction: 3.0,
      errorRate: 0.1,
      responseTimeMs: 3000,
      personaConsistency: 0.7,
    },
  },
  cycles: {
    daily: {
      enabled: true,
      schedule: '0 0 * * *', // 毎日0時
      tasks: ['quality_monitor', 'system_health_check'],
    },
    weekly: {
      enabled: true,
      schedule: '0 0 * * 0', // 毎週日曜0時
      tasks: ['insight_generation', 'trial_evaluation'],
    },
    monthly: {
      enabled: true,
      schedule: '0 0 1 * *', // 毎月1日0時
      tasks: ['avatar_merge_check', 'deprecation_check'],
    },
    quarterly: {
      enabled: true,
      schedule: '0 0 1 1,4,7,10 *', // 四半期初日0時
      tasks: ['strategic_review', 'roi_analysis'],
    },
  },
};

/**
 * マザーAI「ORIGIN」メインクラス
 */
export class OriginMotherAI extends EventEmitter {
  private anthropic: Anthropic;
  private config: MotherAIConfig;
  private avatarBuilder: AvatarBuilder;
  private avatarMerger: AvatarMerger;
  private insightEngine: InsightEngine;
  private qualityMonitor: QualityMonitor;
  private avatars: Map<string, Avatar> = new Map();
  private cycleTimers: Map<OperationCycle, NodeJS.Timeout> = new Map();

  constructor(apiKey: string, config?: Partial<MotherAIConfig>) {
    super();

    this.anthropic = new Anthropic({ apiKey });
    this.config = { ...DEFAULT_CONFIG, ...config };

    // 4つのエンジンを初期化
    this.avatarBuilder = new AvatarBuilder(
      this.anthropic,
      this.config.avatarBuilder
    );
    this.avatarMerger = new AvatarMerger(this.config.avatarMerger);
    this.insightEngine = new InsightEngine(
      this.anthropic,
      this.config.insightEngine
    );
    this.qualityMonitor = new QualityMonitor(this.config.qualityMonitor);

    console.log('[ORIGIN] マザーAI「ORIGIN」を初期化しました');
  }

  /**
   * マザーAI起動
   */
  async start(): Promise<void> {
    console.log('[ORIGIN] マザーAI「ORIGIN」を起動します...');

    // 運用サイクルをスケジュール
    this.scheduleCycles();

    console.log('[ORIGIN] マザーAI「ORIGIN」が稼働開始しました');
  }

  /**
   * 運用サイクルをスケジュール
   */
  private scheduleCycles(): void {
    const cycles: OperationCycle[] = ['daily', 'weekly', 'monthly', 'quarterly'];

    for (const cycle of cycles) {
      const cycleConfig = this.config.cycles[cycle];

      if (!cycleConfig.enabled) {
        continue;
      }

      // 簡易版: 固定間隔で実行
      const interval = this.getIntervalMs(cycle);
      const timer = setInterval(() => {
        this.executeCycle(cycle).catch((error) => {
          console.error(`[ORIGIN] ${cycle}サイクル実行エラー:`, error);
        });
      }, interval);

      this.cycleTimers.set(cycle, timer);
      console.log(`[ORIGIN] ${cycle}サイクルをスケジュールしました`);
    }
  }

  /**
   * サイクル間隔取得（ミリ秒）
   */
  private getIntervalMs(cycle: OperationCycle): number {
    switch (cycle) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 1日
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7日
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30日
      case 'quarterly':
        return 90 * 24 * 60 * 60 * 1000; // 90日
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * サイクル実行
   */
  private async executeCycle(cycle: OperationCycle): Promise<void> {
    console.log(`[ORIGIN] ${cycle}サイクルを実行中...`);

    const cycleConfig = this.config.cycles[cycle];
    const tasks = cycleConfig.tasks;

    for (const task of tasks) {
      try {
        await this.executeTask(task);
      } catch (error) {
        console.error(`[ORIGIN] タスク ${task} 実行エラー:`, error);
      }
    }

    this.emit('cycle_completed', {
      type: 'cycle_completed',
      cycle,
      timestamp: new Date(),
    });

    console.log(`[ORIGIN] ${cycle}サイクルが完了しました`);
  }

  /**
   * タスク実行
   */
  private async executeTask(task: string): Promise<void> {
    switch (task) {
      case 'quality_monitor':
        await this.runQualityMonitor();
        break;
      case 'system_health_check':
        await this.runSystemHealthCheck();
        break;
      case 'insight_generation':
        await this.runInsightGeneration();
        break;
      case 'trial_evaluation':
        await this.runTrialEvaluation();
        break;
      case 'avatar_merge_check':
        await this.runAvatarMergeCheck();
        break;
      case 'deprecation_check':
        await this.runDeprecationCheck();
        break;
      case 'strategic_review':
        await this.runStrategicReview();
        break;
      case 'roi_analysis':
        await this.runROIAnalysis();
        break;
      default:
        console.warn(`[ORIGIN] 未知のタスク: ${task}`);
    }
  }

  /**
   * 品質監視実行
   */
  private async runQualityMonitor(): Promise<void> {
    console.log('[ORIGIN] 品質監視を実行中...');

    // 実装例: 各アバターの品質を監視
    // 実際の実装では、セッション評価データを取得して監視
    // ここでは簡易版として省略
  }

  /**
   * システムヘルスチェック実行
   */
  private async runSystemHealthCheck(): Promise<void> {
    console.log('[ORIGIN] システムヘルスチェックを実行中...');

    // 実装例: API応答速度、エラー率などを監視
  }

  /**
   * インサイト生成実行
   */
  private async runInsightGeneration(): Promise<void> {
    console.log('[ORIGIN] インサイト生成を実行中...');

    // 実装例: 週次のセッションデータからインサイトを生成
  }

  /**
   * 試用期間評価実行
   */
  private async runTrialEvaluation(): Promise<void> {
    console.log('[ORIGIN] 試用期間評価を実行中...');

    const avatarList = Array.from(this.avatars.values());
    const result = await this.avatarMerger.evaluateTrialAvatars(avatarList);

    // 本稼働に移行
    for (const avatar of result.activate) {
      avatar.status = 'active';
      this.avatars.set(avatar.id, avatar);
      console.log(`[ORIGIN] ${avatar.id} を本稼働に移行`);
    }

    // 廃止
    for (const avatar of result.deprecate) {
      await this.deprecateAvatar(avatar.id, '試用期間で基準未達');
    }
  }

  /**
   * アバター統合チェック実行
   */
  private async runAvatarMergeCheck(): Promise<void> {
    console.log('[ORIGIN] アバター統合チェックを実行中...');

    const avatarList = Array.from(this.avatars.values());
    const candidates = await this.avatarMerger.findMergeCandidates(avatarList);

    for (const candidate of candidates) {
      if (candidate.recommendedAction === 'merge') {
        console.log(
          `[ORIGIN] 統合推奨: ${candidate.avatarIds.join(' + ')} (類似度: ${Math.round(candidate.similarityScore * 100)}%)`
        );
        // 実際の統合は人間の承認後に実行
      }
    }
  }

  /**
   * 廃止チェック実行
   */
  private async runDeprecationCheck(): Promise<void> {
    console.log('[ORIGIN] 廃止チェックを実行中...');

    const avatarList = Array.from(this.avatars.values());
    const candidates = await this.avatarMerger.findDeprecationCandidates(
      avatarList
    );

    for (const avatar of candidates) {
      console.log(
        `[ORIGIN] 廃止候補: ${avatar.id} (最終セッション: ${avatar.metrics.lastSessionAt})`
      );
      // 実際の廃止は人間の承認後に実行
    }
  }

  /**
   * 戦略レビュー実行
   */
  private async runStrategicReview(): Promise<void> {
    console.log('[ORIGIN] 戦略レビューを実行中...');

    // 実装例: 四半期ごとのKPI分析、戦略見直し
  }

  /**
   * ROI分析実行
   */
  private async runROIAnalysis(): Promise<void> {
    console.log('[ORIGIN] ROI分析を実行中...');

    // 実装例: 各アバターのROIを分析し、投資判断をサポート
  }

  /**
   * アバター構築リクエスト
   */
  async buildAvatar(
    request: AvatarBuildRequest
  ): Promise<AvatarBuildResult> {
    const avatarList = Array.from(this.avatars.values());
    const result = await this.avatarBuilder.build(request, avatarList);

    if (result.decision === 'create' && result.avatar) {
      this.avatars.set(result.avatar.id, result.avatar);
      this.emit('avatar_created', {
        type: 'avatar_created',
        avatar: result.avatar,
      });
    }

    return result;
  }

  /**
   * アバター統合
   */
  async mergeAvatars(avatarIds: string[]): Promise<void> {
    const avatarList = Array.from(this.avatars.values());
    const result = await this.avatarMerger.merge(avatarIds, avatarList);

    // ソースアバターを削除
    for (const sourceId of result.sourceAvatarIds) {
      if (sourceId !== result.mergedAvatarId) {
        this.avatars.delete(sourceId);
      }
    }

    // マージされたアバターを更新
    const mergedAvatar = this.avatars.get(result.mergedAvatarId);
    if (mergedAvatar) {
      mergedAvatar.competencies = result.newCompetencies;
      mergedAvatar.status = 'active';
      this.avatars.set(result.mergedAvatarId, mergedAvatar);
    }

    this.emit('avatar_merged', {
      type: 'avatar_merged',
      result,
    });
  }

  /**
   * アバター廃止
   */
  async deprecateAvatar(avatarId: string, reason: string): Promise<void> {
    const avatar = this.avatars.get(avatarId);
    if (avatar) {
      avatar.status = 'deprecated';
      this.avatars.set(avatarId, avatar);

      this.emit('avatar_deprecated', {
        type: 'avatar_deprecated',
        avatarId,
        reason,
      });

      console.log(`[ORIGIN] ${avatarId} を廃止しました: ${reason}`);
    }
  }

  /**
   * インサイト生成
   */
  async generateInsights(sessions: any[]): Promise<CrossInsight[]> {
    const insights = await this.insightEngine.generateInsights(sessions);

    for (const insight of insights) {
      this.emit('insight_generated', {
        type: 'insight_generated',
        insight,
      });
    }

    return insights;
  }

  /**
   * 品質監視
   */
  async monitorQuality(
    avatarId: string,
    evaluations: any[]
  ): Promise<QualityAlert[]> {
    const avatar = this.avatars.get(avatarId);
    if (!avatar) {
      throw new Error(`Avatar not found: ${avatarId}`);
    }

    const alerts = await this.qualityMonitor.monitor(avatar, evaluations);

    for (const alert of alerts) {
      this.emit('quality_alert', {
        type: 'quality_alert',
        alert,
      });
    }

    return alerts;
  }

  /**
   * イベントリスナー登録
   */
  onEvent(handler: EventHandler): void {
    this.on('avatar_created', handler);
    this.on('avatar_merged', handler);
    this.on('avatar_deprecated', handler);
    this.on('insight_generated', handler);
    this.on('quality_alert', handler);
    this.on('cycle_completed', handler);
  }

  /**
   * アバター一覧取得
   */
  getAvatars(filters?: {
    status?: Avatar['status'];
  }): Avatar[] {
    let avatars = Array.from(this.avatars.values());

    if (filters?.status) {
      avatars = avatars.filter((a) => a.status === filters.status);
    }

    return avatars;
  }

  /**
   * アバター取得
   */
  getAvatar(avatarId: string): Avatar | undefined {
    return this.avatars.get(avatarId);
  }

  /**
   * 品質サマリ取得
   */
  getQualitySummary(avatarId?: string) {
    return this.qualityMonitor.getSummary(avatarId);
  }

  /**
   * アラート取得
   */
  getAlerts(filters?: {
    avatarId?: string;
    severity?: 'critical' | 'warning' | 'info';
    unresolved?: boolean;
  }) {
    return this.qualityMonitor.getAlerts(filters);
  }

  /**
   * マザーAI停止
   */
  async stop(): Promise<void> {
    console.log('[ORIGIN] マザーAI「ORIGIN」を停止します...');

    // サイクルタイマーをクリア
    for (const [cycle, timer] of this.cycleTimers.entries()) {
      clearInterval(timer);
      console.log(`[ORIGIN] ${cycle}サイクルを停止しました`);
    }

    this.cycleTimers.clear();

    console.log('[ORIGIN] マザーAI「ORIGIN」が停止しました');
  }
}
