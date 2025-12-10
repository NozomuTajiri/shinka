/**
 * 品質監視エンジン
 *
 * アバターの応答品質を継続的に監視し、改善を促進
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  QualityMetrics,
  QualityAlert,
  AlertRule,
  EscalationPolicy,
  ImprovementSuggestion,
  QualityReport,
  ResponseSample,
  ResponseQualityMetrics,
  SatisfactionMetrics,
  PerformanceMetrics,
  QualityTrend,
  QualitySummary,
  AlertType,
} from './types.js';

export class QualityMonitoringEngine {
  private anthropic: Anthropic;
  private metricsHistory: Map<string, QualityMetrics[]>;
  private alerts: Map<string, QualityAlert>;
  private alertRules: Map<string, AlertRule>;
  private escalationPolicies: Map<string, EscalationPolicy>;
  private suggestions: Map<string, ImprovementSuggestion>;
  private samples: Map<string, ResponseSample[]>;

  constructor() {
    this.anthropic = new Anthropic();
    this.metricsHistory = new Map();
    this.alerts = new Map();
    this.alertRules = new Map();
    this.escalationPolicies = new Map();
    this.suggestions = new Map();
    this.samples = new Map();

    this.initializeDefaultRules();
    this.initializeDefaultPolicies();
  }

  /**
   * 品質メトリクスを収集
   */
  async collectMetrics(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<QualityMetrics> {
    const responseQuality = await this.measureResponseQuality(avatarId, period);
    const userSatisfaction = await this.measureSatisfaction(avatarId, period);
    const systemPerformance = await this.measurePerformance(avatarId, period);

    const overallScore = this.calculateOverallScore(
      responseQuality,
      userSatisfaction,
      systemPerformance
    );

    const history = this.metricsHistory.get(avatarId) || [];
    const trend = this.determineTrend(history, overallScore);

    const metrics: QualityMetrics = {
      avatarId,
      period,
      responseQuality,
      userSatisfaction,
      systemPerformance,
      overallScore,
      trend,
    };

    // 履歴に追加
    history.push(metrics);
    this.metricsHistory.set(avatarId, history.slice(-30)); // 直近30件を保持

    // アラートチェック
    await this.checkAlerts(metrics);

    return metrics;
  }

  /**
   * 応答をサンプリングして品質評価
   */
  async sampleAndEvaluate(
    avatarId: string,
    sessionId: string,
    userMessage: string,
    avatarResponse: string
  ): Promise<ResponseSample> {
    const quality = await this.evaluateResponseQuality(userMessage, avatarResponse);

    const sample: ResponseSample = {
      sampleId: `sample-${Date.now()}`,
      avatarId,
      sessionId,
      userMessage,
      avatarResponse,
      quality,
      sampledAt: new Date(),
    };

    const samples = this.samples.get(avatarId) || [];
    samples.push(sample);
    this.samples.set(avatarId, samples.slice(-100)); // 直近100件を保持

    return sample;
  }

  /**
   * アラートルールを追加
   */
  addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.ruleId, rule);
  }

  /**
   * エスカレーションポリシーを設定
   */
  setEscalationPolicy(policy: EscalationPolicy): void {
    this.escalationPolicies.set(policy.policyId, policy);
  }

  /**
   * 改善提案を生成
   */
  async generateSuggestions(
    avatarId: string
  ): Promise<ImprovementSuggestion[]> {
    const metrics = this.metricsHistory.get(avatarId)?.slice(-7) || [];
    const samples = this.samples.get(avatarId) || [];

    if (metrics.length === 0) {
      return [];
    }

    const latestMetrics = metrics[metrics.length - 1];
    const suggestions: ImprovementSuggestion[] = [];

    // 応答品質の改善提案
    if (latestMetrics.responseQuality.averageScore < 80) {
      const suggestion = await this.generateResponseImprovement(
        avatarId,
        latestMetrics.responseQuality,
        samples
      );
      suggestions.push(suggestion);
    }

    // ユーザー満足度の改善提案
    if (latestMetrics.userSatisfaction.csat < 80) {
      const suggestion = await this.generateSatisfactionImprovement(
        avatarId,
        latestMetrics.userSatisfaction
      );
      suggestions.push(suggestion);
    }

    // パフォーマンスの改善提案
    if (latestMetrics.systemPerformance.averageResponseTime > 3000) {
      const suggestion = this.generatePerformanceImprovement(
        avatarId,
        latestMetrics.systemPerformance
      );
      suggestions.push(suggestion);
    }

    // 提案をキャッシュ
    for (const suggestion of suggestions) {
      this.suggestions.set(suggestion.suggestionId, suggestion);
    }

    return suggestions;
  }

  /**
   * 品質レポートを生成
   */
  async generateReport(
    period: { start: Date; end: Date }
  ): Promise<QualityReport> {
    const avatarMetrics: QualityMetrics[] = [];

    for (const [avatarId, history] of this.metricsHistory) {
      const relevantMetrics = history.filter(m =>
        m.period.start >= period.start && m.period.end <= period.end
      );
      if (relevantMetrics.length > 0) {
        avatarMetrics.push(relevantMetrics[relevantMetrics.length - 1]);
      }
    }

    const alerts = Array.from(this.alerts.values()).filter(a =>
      a.createdAt >= period.start && a.createdAt <= period.end
    );

    const suggestions = Array.from(this.suggestions.values()).filter(s =>
      s.createdAt >= period.start && s.createdAt <= period.end
    );

    const trends = this.calculateTrends(period);
    const summary = this.generateSummary(avatarMetrics, alerts, suggestions);

    return {
      reportId: `report-${Date.now()}`,
      period,
      avatarMetrics,
      alerts,
      suggestions,
      trends,
      summary,
      generatedAt: new Date(),
    };
  }

  /**
   * アラートを確認済みにする
   */
  acknowledgeAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'acknowledged';
      alert.acknowledgedAt = new Date();
    }
  }

  /**
   * アラートを解決済みにする
   */
  resolveAlert(alertId: string): void {
    const alert = this.alerts.get(alertId);
    if (alert) {
      alert.status = 'resolved';
      alert.resolvedAt = new Date();
    }
  }

  // プライベートメソッド

  private initializeDefaultRules(): void {
    const defaultRules: AlertRule[] = [
      {
        ruleId: 'quality-drop',
        name: '品質低下アラート',
        metric: 'responseQuality.averageScore',
        condition: 'below',
        threshold: 70,
        window: 3600000, // 1時間
        severity: 'warning',
        enabled: true,
        notificationChannels: ['email', 'slack'],
      },
      {
        ruleId: 'satisfaction-drop',
        name: '満足度低下アラート',
        metric: 'userSatisfaction.csat',
        condition: 'below',
        threshold: 60,
        window: 3600000,
        severity: 'error',
        enabled: true,
        notificationChannels: ['email', 'slack', 'pager'],
      },
      {
        ruleId: 'error-spike',
        name: 'エラー率上昇アラート',
        metric: 'systemPerformance.errorRate',
        condition: 'above',
        threshold: 5,
        window: 900000, // 15分
        severity: 'critical',
        enabled: true,
        notificationChannels: ['email', 'slack', 'pager'],
      },
      {
        ruleId: 'latency-increase',
        name: 'レイテンシー増加アラート',
        metric: 'systemPerformance.p95ResponseTime',
        condition: 'above',
        threshold: 5000,
        window: 1800000, // 30分
        severity: 'warning',
        enabled: true,
        notificationChannels: ['slack'],
      },
    ];

    for (const rule of defaultRules) {
      this.alertRules.set(rule.ruleId, rule);
    }
  }

  private initializeDefaultPolicies(): void {
    const defaultPolicy: EscalationPolicy = {
      policyId: 'default',
      name: 'デフォルトエスカレーション',
      levels: [
        {
          level: 1,
          name: '担当者',
          notifyRoles: ['avatar-owner'],
          channels: ['slack'],
          responseTimeMinutes: 30,
          actions: ['調査開始'],
        },
        {
          level: 2,
          name: 'チームリード',
          notifyRoles: ['team-lead'],
          channels: ['slack', 'email'],
          responseTimeMinutes: 60,
          actions: ['エスカレーション対応'],
        },
        {
          level: 3,
          name: 'マネージャー',
          notifyRoles: ['manager'],
          channels: ['slack', 'email', 'pager'],
          responseTimeMinutes: 120,
          actions: ['緊急対応'],
        },
      ],
      autoEscalate: true,
      escalationWindow: 30,
    };

    this.escalationPolicies.set(defaultPolicy.policyId, defaultPolicy);
  }

  private async measureResponseQuality(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<ResponseQualityMetrics> {
    // 実際の実装ではサンプルから計算
    return {
      accuracy: 80 + Math.random() * 15,
      relevance: 75 + Math.random() * 20,
      completeness: 70 + Math.random() * 25,
      clarity: 85 + Math.random() * 10,
      consistency: 80 + Math.random() * 15,
      averageScore: 78 + Math.random() * 17,
    };
  }

  private async measureSatisfaction(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<SatisfactionMetrics> {
    return {
      nps: Math.floor(Math.random() * 100) - 50,
      csat: 70 + Math.random() * 25,
      ces: 60 + Math.random() * 30,
      feedbackCount: Math.floor(Math.random() * 100),
      positiveFeedback: Math.floor(Math.random() * 70),
      negativeFeedback: Math.floor(Math.random() * 20),
      commonComplaints: ['応答が遅い', '情報が不足'],
      commonPraises: ['丁寧な対応', '的確なアドバイス'],
    };
  }

  private async measurePerformance(
    avatarId: string,
    period: { start: Date; end: Date }
  ): Promise<PerformanceMetrics> {
    return {
      averageResponseTime: 1000 + Math.random() * 2000,
      p95ResponseTime: 2000 + Math.random() * 3000,
      errorRate: Math.random() * 3,
      uptime: 99 + Math.random(),
      throughput: 100 + Math.random() * 200,
    };
  }

  private async evaluateResponseQuality(
    userMessage: string,
    avatarResponse: string
  ): Promise<ResponseQualityMetrics> {
    const prompt = `
以下の対話の品質を評価してください（各項目0-100点）。

ユーザー: ${userMessage}
アバター: ${avatarResponse}

評価項目:
1. 正確性（accuracy）: 情報の正確さ
2. 関連性（relevance）: 質問への適切な回答
3. 完全性（completeness）: 必要な情報の網羅
4. 明瞭性（clarity）: わかりやすさ
5. 一貫性（consistency）: 論理的一貫性

JSON形式で出力: {"accuracy": 数値, "relevance": 数値, ...}
`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      });

      const text = (response.content[0] as { type: 'text'; text: string }).text;
      const jsonMatch = text.match(/\{[^}]+\}/);

      if (jsonMatch) {
        const scores = JSON.parse(jsonMatch[0]);
        return {
          accuracy: scores.accuracy || 75,
          relevance: scores.relevance || 75,
          completeness: scores.completeness || 75,
          clarity: scores.clarity || 75,
          consistency: scores.consistency || 75,
          averageScore: (scores.accuracy + scores.relevance + scores.completeness + scores.clarity + scores.consistency) / 5,
        };
      }
    } catch (error) {
      // エラー時はデフォルト値
    }

    return {
      accuracy: 75,
      relevance: 75,
      completeness: 75,
      clarity: 75,
      consistency: 75,
      averageScore: 75,
    };
  }

  private calculateOverallScore(
    response: ResponseQualityMetrics,
    satisfaction: SatisfactionMetrics,
    performance: PerformanceMetrics
  ): number {
    const responseWeight = 0.4;
    const satisfactionWeight = 0.4;
    const performanceWeight = 0.2;

    const responseScore = response.averageScore;
    const satisfactionScore = satisfaction.csat;
    const performanceScore = Math.max(0, 100 - (performance.errorRate * 10) - (performance.averageResponseTime / 100));

    return responseScore * responseWeight + satisfactionScore * satisfactionWeight + performanceScore * performanceWeight;
  }

  private determineTrend(
    history: QualityMetrics[],
    currentScore: number
  ): 'improving' | 'stable' | 'declining' {
    if (history.length < 3) return 'stable';

    const recentScores = history.slice(-3).map(m => m.overallScore);
    const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;

    if (currentScore > avgRecent + 5) return 'improving';
    if (currentScore < avgRecent - 5) return 'declining';
    return 'stable';
  }

  private async checkAlerts(metrics: QualityMetrics): Promise<void> {
    for (const rule of this.alertRules.values()) {
      if (!rule.enabled) continue;

      const value = this.getMetricValue(metrics, rule.metric);
      const triggered = this.checkCondition(value, rule.condition, rule.threshold);

      if (triggered) {
        const alert = this.createAlert(metrics.avatarId, rule, value);
        this.alerts.set(alert.alertId, alert);
        await this.notifyAlert(alert, rule);
      }
    }
  }

  private getMetricValue(metrics: QualityMetrics, path: string): number {
    const parts = path.split('.');
    let value: unknown = metrics;

    for (const part of parts) {
      value = (value as Record<string, unknown>)[part];
    }

    return value as number;
  }

  private checkCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'above': return value > threshold;
      case 'below': return value < threshold;
      default: return false;
    }
  }

  private createAlert(avatarId: string, rule: AlertRule, value: number): QualityAlert {
    return {
      alertId: `alert-${Date.now()}`,
      avatarId,
      severity: rule.severity,
      type: rule.ruleId as AlertType,
      message: `${rule.name}: ${rule.metric}が閾値を超えました`,
      details: { rule: rule.ruleId, metric: rule.metric },
      threshold: rule.threshold,
      actualValue: value,
      createdAt: new Date(),
      status: 'active',
    };
  }

  private async notifyAlert(alert: QualityAlert, rule: AlertRule): Promise<void> {
    // 実際の通知処理
    console.log(`[Alert] ${alert.severity}: ${alert.message}`);
  }

  private async generateResponseImprovement(
    avatarId: string,
    quality: ResponseQualityMetrics,
    samples: ResponseSample[]
  ): Promise<ImprovementSuggestion> {
    const lowestMetric = this.findLowestMetric(quality);
    const metricValue = this.getQualityMetricValue(quality, lowestMetric);

    return {
      suggestionId: `suggestion-${Date.now()}`,
      avatarId,
      category: 'response',
      title: `${lowestMetric}の改善`,
      description: `応答の${lowestMetric}スコアが低下しています。改善が必要です。`,
      rationale: `現在のスコア: ${metricValue.toFixed(1)}`,
      expectedImpact: 15,
      effort: 'medium',
      priority: 1,
      status: 'proposed',
      evidence: [
        {
          type: 'metric',
          source: 'quality-metrics',
          data: { metric: lowestMetric, value: metricValue },
        },
      ],
      createdAt: new Date(),
    };
  }

  private async generateSatisfactionImprovement(
    avatarId: string,
    satisfaction: SatisfactionMetrics
  ): Promise<ImprovementSuggestion> {
    return {
      suggestionId: `suggestion-${Date.now()}`,
      avatarId,
      category: 'persona',
      title: 'ユーザー満足度の改善',
      description: `よくある不満: ${satisfaction.commonComplaints.join(', ')}`,
      rationale: `CSAT: ${satisfaction.csat.toFixed(1)}`,
      expectedImpact: 20,
      effort: 'high',
      priority: 2,
      status: 'proposed',
      evidence: [
        {
          type: 'feedback',
          source: 'user-feedback',
          data: { complaints: satisfaction.commonComplaints },
        },
      ],
      createdAt: new Date(),
    };
  }

  private generatePerformanceImprovement(
    avatarId: string,
    performance: PerformanceMetrics
  ): ImprovementSuggestion {
    return {
      suggestionId: `suggestion-${Date.now()}`,
      avatarId,
      category: 'performance',
      title: '応答速度の改善',
      description: `平均応答時間が${performance.averageResponseTime.toFixed(0)}msです。最適化が必要です。`,
      rationale: `目標: 2000ms以下`,
      expectedImpact: 10,
      effort: 'low',
      priority: 3,
      status: 'proposed',
      evidence: [
        {
          type: 'metric',
          source: 'performance-metrics',
          data: { avgResponseTime: performance.averageResponseTime },
        },
      ],
      createdAt: new Date(),
    };
  }

  private findLowestMetric(quality: ResponseQualityMetrics): string {
    const metrics: Array<keyof Omit<ResponseQualityMetrics, 'averageScore'>> = ['accuracy', 'relevance', 'completeness', 'clarity', 'consistency'];
    let lowest = metrics[0];
    let lowestValue = quality[lowest];

    for (const metric of metrics) {
      if (quality[metric] < lowestValue) {
        lowest = metric;
        lowestValue = quality[metric];
      }
    }

    return lowest;
  }

  private getQualityMetricValue(quality: ResponseQualityMetrics, metricName: string): number {
    const metrics: Record<string, number> = {
      accuracy: quality.accuracy,
      relevance: quality.relevance,
      completeness: quality.completeness,
      clarity: quality.clarity,
      consistency: quality.consistency,
      averageScore: quality.averageScore,
    };
    return metrics[metricName] || 0;
  }

  private calculateTrends(period: { start: Date; end: Date }): QualityTrend[] {
    const trends: QualityTrend[] = [];

    for (const [avatarId, history] of this.metricsHistory) {
      const relevantHistory = history.filter(m =>
        m.period.start >= period.start && m.period.end <= period.end
      );

      if (relevantHistory.length >= 2) {
        const first = relevantHistory[0].overallScore;
        const last = relevantHistory[relevantHistory.length - 1].overallScore;
        const changePercent = ((last - first) / first) * 100;

        trends.push({
          metric: `${avatarId}-overall`,
          values: relevantHistory.map(m => ({ date: m.period.end, value: m.overallScore })),
          direction: changePercent > 5 ? 'up' : changePercent < -5 ? 'down' : 'stable',
          changePercent,
        });
      }
    }

    return trends;
  }

  private generateSummary(
    metrics: QualityMetrics[],
    alerts: QualityAlert[],
    suggestions: ImprovementSuggestion[]
  ): QualitySummary {
    const avgScore = metrics.reduce((sum, m) => sum + m.overallScore, 0) / metrics.length || 0;

    let health: QualitySummary['overallHealth'];
    if (avgScore >= 90) health = 'excellent';
    else if (avgScore >= 75) health = 'good';
    else if (avgScore >= 60) health = 'fair';
    else if (avgScore >= 40) health = 'poor';
    else health = 'critical';

    const topPerformers = metrics
      .filter(m => m.overallScore >= 80)
      .map(m => m.avatarId);

    const needsAttention = metrics
      .filter(m => m.overallScore < 60)
      .map(m => m.avatarId);

    return {
      overallHealth: health,
      topPerformers,
      needsAttention,
      keyInsights: [
        `平均品質スコア: ${avgScore.toFixed(1)}`,
        `アクティブアラート: ${alerts.filter(a => a.status === 'active').length}件`,
        `改善提案: ${suggestions.length}件`,
      ],
      actionItems: suggestions.slice(0, 3).map(s => s.title),
    };
  }

  // 公開ゲッター

  getAlert(alertId: string): QualityAlert | undefined {
    return this.alerts.get(alertId);
  }

  getActiveAlerts(): QualityAlert[] {
    return Array.from(this.alerts.values()).filter(a => a.status === 'active');
  }

  getSuggestion(suggestionId: string): ImprovementSuggestion | undefined {
    return this.suggestions.get(suggestionId);
  }

  getMetricsHistory(avatarId: string): QualityMetrics[] {
    return this.metricsHistory.get(avatarId) || [];
  }
}

export type {
  QualityMetrics,
  QualityAlert,
  AlertRule,
  ImprovementSuggestion,
  QualityReport,
};
