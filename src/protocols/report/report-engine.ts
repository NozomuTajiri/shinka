/**
 * レポートエンジン
 * レポート生成・配信・管理
 */

import type {
  ReportMetadata,
  WeeklyReport,
  AlertReport,
  AchievementReport,
  StatusReport,
  ReportType,
  ReportStatus,
  AlertSeverity,
  ActivityRecord,
  ReportMetrics,
  ReportTemplate,
  ReportSubscription,
} from './types.js';

export class ReportEngine {
  private reports: Map<string, WeeklyReport | AlertReport | AchievementReport | StatusReport> = new Map();
  private templates: Map<string, ReportTemplate> = new Map();
  private subscriptions: ReportSubscription[] = [];

  constructor() {
    this.initializeDefaultTemplates();
  }

  private initializeDefaultTemplates(): void {
    // Weekly report template
    this.templates.set('weekly-default', {
      id: 'weekly-default',
      type: 'weekly',
      name: '週次レポート標準テンプレート',
      sections: [
        { id: 'summary', name: '概要', description: '今週の活動概要', fieldType: 'text', required: true },
        { id: 'activities', name: '活動記録', description: '実施したセッション・分析', fieldType: 'list', required: true },
        { id: 'metrics', name: '指標', description: '定量的な成果指標', fieldType: 'metrics', required: true },
        { id: 'insights', name: '洞察', description: '得られた気づき', fieldType: 'list', required: false },
        { id: 'plan', name: '来週の予定', description: '来週の活動計画', fieldType: 'list', required: true },
      ],
      requiredFields: ['summary', 'activities', 'metrics', 'plan'],
      optionalFields: ['insights', 'blockers'],
    });

    // Alert template
    this.templates.set('alert-default', {
      id: 'alert-default',
      type: 'alert',
      name: 'アラートテンプレート',
      sections: [
        { id: 'title', name: 'タイトル', description: 'アラートの件名', fieldType: 'text', required: true },
        { id: 'description', name: '詳細', description: 'アラートの詳細説明', fieldType: 'text', required: true },
        { id: 'actions', name: '推奨アクション', description: '即座に取るべきアクション', fieldType: 'list', required: true },
      ],
      requiredFields: ['title', 'description', 'actions'],
      optionalFields: ['deadline'],
    });
  }

  generateReportId(): string {
    return `rpt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  createWeeklyReport(
    fromAvatarId: string,
    toAvatarIds: string[],
    clientId: string,
    activities: ActivityRecord[],
    insights: string[],
    nextWeekPlan: string[]
  ): WeeklyReport {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const metrics = this.calculateMetrics(activities);

    const report: WeeklyReport = {
      metadata: {
        reportId: this.generateReportId(),
        type: 'weekly',
        fromAvatarId,
        toAvatarIds,
        clientId,
        createdAt: now,
        status: 'draft',
      },
      period: { startDate: weekStart, endDate: weekEnd },
      summary: this.generateSummary(activities, metrics),
      activities,
      metrics,
      insights,
      nextWeekPlan,
      blockers: [],
    };

    this.reports.set(report.metadata.reportId, report);
    return report;
  }

  private calculateMetrics(activities: ActivityRecord[]): ReportMetrics {
    const sessions = activities.filter(a => a.type === 'session');
    const recommendations = activities.filter(a => a.type === 'recommendation');

    return {
      sessionsCount: sessions.length,
      avgSessionDuration: sessions.length > 0
        ? sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length
        : 0,
      recommendationsGiven: recommendations.length,
      recommendationsImplemented: Math.floor(recommendations.length * 0.7), // Estimate
      progressScore: Math.min(100, activities.length * 10),
    };
  }

  private generateSummary(activities: ActivityRecord[], metrics: ReportMetrics): string {
    return `今週は${metrics.sessionsCount}回のセッションを実施し、${metrics.recommendationsGiven}件の提案を行いました。平均セッション時間は${Math.round(metrics.avgSessionDuration)}分でした。`;
  }

  createAlertReport(
    fromAvatarId: string,
    toAvatarIds: string[],
    clientId: string,
    severity: AlertSeverity,
    title: string,
    description: string,
    immediateActions: string[]
  ): AlertReport {
    const report: AlertReport = {
      metadata: {
        reportId: this.generateReportId(),
        type: 'alert',
        fromAvatarId,
        toAvatarIds,
        clientId,
        createdAt: new Date(),
        status: 'submitted', // Alerts are immediately submitted
      },
      severity,
      title,
      description,
      affectedAreas: [],
      immediateActions,
      recommendedResponse: this.generateRecommendedResponse(severity, immediateActions),
    };

    this.reports.set(report.metadata.reportId, report);
    this.notifySubscribers(report);
    return report;
  }

  private generateRecommendedResponse(severity: AlertSeverity, actions: string[]): string {
    const urgency = severity === 'critical' ? '即座に' : severity === 'warning' ? '24時間以内に' : '適宜';
    return `${urgency}以下のアクションを検討してください: ${actions.join(', ')}`;
  }

  createAchievementReport(
    fromAvatarId: string,
    toAvatarIds: string[],
    clientId: string,
    achievementType: AchievementReport['achievementType'],
    title: string,
    description: string,
    metrics: AchievementReport['metrics'],
    contributingFactors: string[],
    lessonsLearned: string[]
  ): AchievementReport {
    const report: AchievementReport = {
      metadata: {
        reportId: this.generateReportId(),
        type: 'achievement',
        fromAvatarId,
        toAvatarIds,
        clientId,
        createdAt: new Date(),
        status: 'draft',
      },
      achievementType,
      title,
      description,
      metrics,
      contributingFactors,
      lessonsLearned,
      replicability: this.assessReplicability(contributingFactors),
    };

    this.reports.set(report.metadata.reportId, report);
    return report;
  }

  private assessReplicability(factors: string[]): 'high' | 'medium' | 'low' {
    // Simple heuristic: more documented factors = higher replicability
    if (factors.length >= 5) return 'high';
    if (factors.length >= 3) return 'medium';
    return 'low';
  }

  createStatusReport(
    fromAvatarId: string,
    toAvatarIds: string[],
    clientId: string,
    currentPhase: string,
    progress: number,
    highlights: string[],
    concerns: string[],
    nextMilestone: StatusReport['nextMilestone']
  ): StatusReport {
    const health = this.assessHealth(progress, concerns);

    const report: StatusReport = {
      metadata: {
        reportId: this.generateReportId(),
        type: 'status',
        fromAvatarId,
        toAvatarIds,
        clientId,
        createdAt: new Date(),
        status: 'draft',
      },
      currentPhase,
      progress,
      health,
      highlights,
      concerns,
      nextMilestone,
    };

    this.reports.set(report.metadata.reportId, report);
    return report;
  }

  private assessHealth(progress: number, concerns: string[]): StatusReport['health'] {
    if (concerns.length >= 3 || progress < 30) return 'critical';
    if (concerns.length >= 1 || progress < 60) return 'at-risk';
    return 'healthy';
  }

  submitReport(reportId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report || report.metadata.status !== 'draft') return false;

    report.metadata.status = 'submitted';
    report.metadata.submittedAt = new Date();
    this.notifySubscribers(report);
    return true;
  }

  acknowledgeReport(reportId: string): boolean {
    const report = this.reports.get(reportId);
    if (!report || report.metadata.status !== 'submitted') return false;

    report.metadata.status = 'acknowledged';
    report.metadata.acknowledgedAt = new Date();
    return true;
  }

  addSubscription(subscription: ReportSubscription): void {
    this.subscriptions.push(subscription);
  }

  private notifySubscribers(report: WeeklyReport | AlertReport | AchievementReport | StatusReport): void {
    const relevantSubscribers = this.subscriptions.filter(sub => {
      if (!sub.reportTypes.includes(report.metadata.type)) return false;
      if (sub.filters.avatarIds && !sub.filters.avatarIds.includes(report.metadata.fromAvatarId)) return false;
      if (sub.filters.clientIds && !sub.filters.clientIds.includes(report.metadata.clientId)) return false;
      if ('severity' in report && sub.filters.severities && !sub.filters.severities.includes(report.severity)) return false;
      return true;
    });

    // In real implementation, would send notifications
    console.log(`Notifying ${relevantSubscribers.length} subscribers about report ${report.metadata.reportId}`);
  }

  getReport(reportId: string): WeeklyReport | AlertReport | AchievementReport | StatusReport | undefined {
    return this.reports.get(reportId);
  }

  getReportsByAvatar(avatarId: string): (WeeklyReport | AlertReport | AchievementReport | StatusReport)[] {
    return Array.from(this.reports.values()).filter(
      r => r.metadata.fromAvatarId === avatarId || r.metadata.toAvatarIds.includes(avatarId)
    );
  }

  getReportsByClient(clientId: string): (WeeklyReport | AlertReport | AchievementReport | StatusReport)[] {
    return Array.from(this.reports.values()).filter(r => r.metadata.clientId === clientId);
  }

  getTemplate(templateId: string): ReportTemplate | undefined {
    return this.templates.get(templateId);
  }

  getTemplatesByType(type: ReportType): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(t => t.type === type);
  }
}
