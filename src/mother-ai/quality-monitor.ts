/**
 * 品質監視エンジン
 * 対話品質、成果品質、システム品質を監視し、アラートを発報
 */

import {
  Avatar,
  QualityAlert,
  QualityMetrics,
  DialogueQuality,
  OutcomeQuality,
  SystemQuality,
  MotherAIConfig,
} from './types.js';

/**
 * セッション評価データ
 */
interface SessionEvaluation {
  avatarId: string;
  sessionId: string;
  timestamp: Date;
  dialogue: {
    personaConsistency: number;
    knowledgeUtilization: number;
    responseRelevance: number;
  };
  outcome: {
    satisfaction: number;
    problemSolved: boolean;
    actionItemsCompleted: number;
    actionItemsTotal: number;
  };
  system: {
    responseTimeMs: number;
    errors: number;
    totalRequests: number;
  };
}

export class QualityMonitor {
  private config: MotherAIConfig['qualityMonitor'];
  private alerts: QualityAlert[] = [];

  constructor(config: MotherAIConfig['qualityMonitor']) {
    this.config = config;
  }

  /**
   * アバターの品質を監視
   */
  async monitor(
    avatar: Avatar,
    recentEvaluations: SessionEvaluation[]
  ): Promise<QualityAlert[]> {
    console.log(`[QualityMonitor] ${avatar.id} の品質を監視中...`);

    const newAlerts: QualityAlert[] = [];

    // 評価データがない場合はスキップ
    if (recentEvaluations.length === 0) {
      return newAlerts;
    }

    // 品質メトリクスを集計
    const metrics = this.aggregateMetrics(recentEvaluations);

    // 対話品質チェック
    const dialogueAlerts = this.checkDialogueQuality(avatar, metrics.dialogue);
    newAlerts.push(...dialogueAlerts);

    // 成果品質チェック
    const outcomeAlerts = this.checkOutcomeQuality(avatar, metrics.outcome);
    newAlerts.push(...outcomeAlerts);

    // システム品質チェック
    const systemAlerts = this.checkSystemQuality(avatar, metrics.system);
    newAlerts.push(...systemAlerts);

    // アラートを保存
    this.alerts.push(...newAlerts);

    if (newAlerts.length > 0) {
      console.log(
        `[QualityMonitor] ${newAlerts.length}件のアラートを発報`
      );
    }

    return newAlerts;
  }

  /**
   * メトリクス集計
   */
  private aggregateMetrics(
    evaluations: SessionEvaluation[]
  ): QualityMetrics {
    const dialogue = {
      personaConsistency:
        evaluations.reduce(
          (sum, e) => sum + e.dialogue.personaConsistency,
          0
        ) / evaluations.length,
      knowledgeUtilization:
        evaluations.reduce(
          (sum, e) => sum + e.dialogue.knowledgeUtilization,
          0
        ) / evaluations.length,
      responseRelevance:
        evaluations.reduce(
          (sum, e) => sum + e.dialogue.responseRelevance,
          0
        ) / evaluations.length,
    };

    const totalSolved = evaluations.filter((e) => e.outcome.problemSolved)
      .length;
    const totalActionItems = evaluations.reduce(
      (sum, e) => sum + e.outcome.actionItemsTotal,
      0
    );
    const completedActionItems = evaluations.reduce(
      (sum, e) => sum + e.outcome.actionItemsCompleted,
      0
    );

    const outcome = {
      satisfaction:
        evaluations.reduce((sum, e) => sum + e.outcome.satisfaction, 0) /
        evaluations.length,
      problemSolutionRate: totalSolved / evaluations.length,
      actionItemCompletionRate:
        totalActionItems > 0 ? completedActionItems / totalActionItems : 0,
    };

    const totalErrors = evaluations.reduce(
      (sum, e) => sum + e.system.errors,
      0
    );
    const totalRequests = evaluations.reduce(
      (sum, e) => sum + e.system.totalRequests,
      0
    );

    const system = {
      averageResponseTimeMs:
        evaluations.reduce((sum, e) => sum + e.system.responseTimeMs, 0) /
        evaluations.length,
      errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
      availability: 1.0, // 簡易版: 固定値
    };

    return { dialogue, outcome, system };
  }

  /**
   * 対話品質チェック
   */
  private checkDialogueQuality(
    avatar: Avatar,
    quality: DialogueQuality
  ): QualityAlert[] {
    const alerts: QualityAlert[] = [];

    // ペルソナ一貫性チェック
    if (
      quality.personaConsistency <
      this.config.criticalThresholds.personaConsistency
    ) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'critical',
        category: 'dialogue',
        avatarId: avatar.id,
        message: `ペルソナ一貫性が著しく低下（${Math.round(quality.personaConsistency * 100)}%）`,
        metrics: {
          personaConsistency: quality.personaConsistency,
        },
        recommendedAction:
          'ペルソナ設定を見直し、プロンプトを調整してください',
        createdAt: new Date(),
      });
    } else if (
      quality.personaConsistency <
      this.config.warningThresholds.personaConsistency
    ) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'warning',
        category: 'dialogue',
        avatarId: avatar.id,
        message: `ペルソナ一貫性が低下（${Math.round(quality.personaConsistency * 100)}%）`,
        metrics: {
          personaConsistency: quality.personaConsistency,
        },
        recommendedAction:
          'ペルソナ一貫性を監視し、必要に応じて調整を検討してください',
        createdAt: new Date(),
      });
    }

    // ナレッジ活用適切性チェック
    if (quality.knowledgeUtilization < 0.5) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'info',
        category: 'dialogue',
        avatarId: avatar.id,
        message: `ナレッジ活用率が低い（${Math.round(quality.knowledgeUtilization * 100)}%）`,
        metrics: {
          knowledgeUtilization: quality.knowledgeUtilization,
        },
        recommendedAction:
          'ナレッジベースの拡充、または検索ロジックの改善を検討してください',
        createdAt: new Date(),
      });
    }

    // 応答関連性チェック
    if (quality.responseRelevance < 0.6) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'warning',
        category: 'dialogue',
        avatarId: avatar.id,
        message: `応答の関連性が低い（${Math.round(quality.responseRelevance * 100)}%）`,
        metrics: {
          responseRelevance: quality.responseRelevance,
        },
        recommendedAction:
          '文脈理解の精度向上、またはプロンプト調整が必要です',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * 成果品質チェック
   */
  private checkOutcomeQuality(
    avatar: Avatar,
    quality: OutcomeQuality
  ): QualityAlert[] {
    const alerts: QualityAlert[] = [];

    // 満足度チェック
    if (quality.satisfaction < this.config.criticalThresholds.satisfaction) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'critical',
        category: 'outcome',
        avatarId: avatar.id,
        message: `満足度が著しく低い（${quality.satisfaction.toFixed(1)}/5.0）`,
        metrics: {
          satisfaction: quality.satisfaction,
        },
        recommendedAction:
          '緊急対応が必要。ユーザーフィードバックを詳細分析し、改善策を実施してください',
        createdAt: new Date(),
      });
    } else if (
      quality.satisfaction < this.config.warningThresholds.satisfaction
    ) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'warning',
        category: 'outcome',
        avatarId: avatar.id,
        message: `満足度が低下傾向（${quality.satisfaction.toFixed(1)}/5.0）`,
        metrics: {
          satisfaction: quality.satisfaction,
        },
        recommendedAction:
          'ユーザーフィードバックを確認し、改善ポイントを特定してください',
        createdAt: new Date(),
      });
    }

    // 課題解決率チェック
    if (quality.problemSolutionRate < 0.6) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'warning',
        category: 'outcome',
        avatarId: avatar.id,
        message: `課題解決率が低い（${Math.round(quality.problemSolutionRate * 100)}%）`,
        metrics: {
          problemSolutionRate: quality.problemSolutionRate,
        },
        recommendedAction:
          'アバターの専門性強化、またはエスカレーション基準の見直しが必要です',
        createdAt: new Date(),
      });
    }

    // アクションアイテム完了率チェック
    if (quality.actionItemCompletionRate < 0.5) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'info',
        category: 'outcome',
        avatarId: avatar.id,
        message: `アクションアイテム完了率が低い（${Math.round(quality.actionItemCompletionRate * 100)}%）`,
        metrics: {
          actionItemCompletionRate: quality.actionItemCompletionRate,
        },
        recommendedAction:
          'フォローアップ機能の強化、またはリマインド機能の追加を検討してください',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * システム品質チェック
   */
  private checkSystemQuality(
    avatar: Avatar,
    quality: SystemQuality
  ): QualityAlert[] {
    const alerts: QualityAlert[] = [];

    // 応答速度チェック
    if (
      quality.averageResponseTimeMs >
      this.config.criticalThresholds.responseTimeMs
    ) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'critical',
        category: 'system',
        avatarId: avatar.id,
        message: `応答速度が著しく遅い（${quality.averageResponseTimeMs}ms）`,
        metrics: {
          responseTimeMs: quality.averageResponseTimeMs,
        },
        recommendedAction:
          'インフラのスケーリング、またはキャッシュ戦略の見直しが必要です',
        createdAt: new Date(),
      });
    } else if (
      quality.averageResponseTimeMs >
      this.config.warningThresholds.responseTimeMs
    ) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'warning',
        category: 'system',
        avatarId: avatar.id,
        message: `応答速度が低下（${quality.averageResponseTimeMs}ms）`,
        metrics: {
          responseTimeMs: quality.averageResponseTimeMs,
        },
        recommendedAction:
          'パフォーマンスの監視を継続し、必要に応じて最適化してください',
        createdAt: new Date(),
      });
    }

    // エラー率チェック
    if (quality.errorRate > this.config.criticalThresholds.errorRate) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'critical',
        category: 'system',
        avatarId: avatar.id,
        message: `エラー率が高い（${Math.round(quality.errorRate * 100)}%）`,
        metrics: {
          errorRate: quality.errorRate,
        },
        recommendedAction:
          'エラーログを分析し、根本原因を特定して緊急対応してください',
        createdAt: new Date(),
      });
    } else if (quality.errorRate > this.config.warningThresholds.errorRate) {
      alerts.push({
        id: this.generateAlertId(),
        severity: 'warning',
        category: 'system',
        avatarId: avatar.id,
        message: `エラー率が上昇（${Math.round(quality.errorRate * 100)}%）`,
        metrics: {
          errorRate: quality.errorRate,
        },
        recommendedAction:
          'エラーパターンを分析し、予防的な対策を検討してください',
        createdAt: new Date(),
      });
    }

    return alerts;
  }

  /**
   * アラート履歴取得
   */
  getAlerts(filters?: {
    avatarId?: string;
    severity?: 'critical' | 'warning' | 'info';
    category?: 'dialogue' | 'outcome' | 'system';
    unresolved?: boolean;
  }): QualityAlert[] {
    let filtered = [...this.alerts];

    if (filters?.avatarId) {
      filtered = filtered.filter((a) => a.avatarId === filters.avatarId);
    }

    if (filters?.severity) {
      filtered = filtered.filter((a) => a.severity === filters.severity);
    }

    if (filters?.category) {
      filtered = filtered.filter((a) => a.category === filters.category);
    }

    if (filters?.unresolved) {
      filtered = filtered.filter((a) => !a.resolvedAt);
    }

    return filtered;
  }

  /**
   * アラート解決
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.find((a) => a.id === alertId);
    if (alert) {
      alert.resolvedAt = new Date();
      console.log(`[QualityMonitor] アラート ${alertId} を解決済みに設定`);
    }
  }

  /**
   * アラートID生成
   */
  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 品質ダッシュボード用サマリ
   */
  getSummary(avatarId?: string): {
    total: number;
    critical: number;
    warning: number;
    info: number;
    byCategory: Record<string, number>;
    recentAlerts: QualityAlert[];
  } {
    const alerts = avatarId
      ? this.alerts.filter((a) => a.avatarId === avatarId)
      : this.alerts;

    const unresolvedAlerts = alerts.filter((a) => !a.resolvedAt);

    return {
      total: unresolvedAlerts.length,
      critical: unresolvedAlerts.filter((a) => a.severity === 'critical')
        .length,
      warning: unresolvedAlerts.filter((a) => a.severity === 'warning').length,
      info: unresolvedAlerts.filter((a) => a.severity === 'info').length,
      byCategory: {
        dialogue: unresolvedAlerts.filter((a) => a.category === 'dialogue')
          .length,
        outcome: unresolvedAlerts.filter((a) => a.category === 'outcome')
          .length,
        system: unresolvedAlerts.filter((a) => a.category === 'system').length,
      },
      recentAlerts: unresolvedAlerts
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 10),
    };
  }
}
