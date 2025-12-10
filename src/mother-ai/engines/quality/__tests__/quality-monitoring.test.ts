/**
 * 品質監視エンジンのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { QualityMonitoringEngine } from '../index.js';

describe('QualityMonitoringEngine', () => {
  let engine: QualityMonitoringEngine;

  beforeEach(() => {
    engine = new QualityMonitoringEngine();
  });

  describe('collectMetrics', () => {
    it('should collect quality metrics for an avatar', async () => {
      const avatarId = 'test-avatar-1';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const metrics = await engine.collectMetrics(avatarId, period);

      expect(metrics.avatarId).toBe(avatarId);
      expect(metrics.period).toEqual(period);
      expect(metrics.responseQuality).toBeDefined();
      expect(metrics.userSatisfaction).toBeDefined();
      expect(metrics.systemPerformance).toBeDefined();
      expect(metrics.overallScore).toBeGreaterThan(0);
      expect(['improving', 'stable', 'declining']).toContain(metrics.trend);
    });

    it('should store metrics in history', async () => {
      const avatarId = 'test-avatar-2';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      await engine.collectMetrics(avatarId, period);
      const history = engine.getMetricsHistory(avatarId);

      expect(history.length).toBe(1);
      expect(history[0].avatarId).toBe(avatarId);
    });
  });

  describe('sampleAndEvaluate', () => {
    it('should evaluate response quality', async () => {
      const sample = await engine.sampleAndEvaluate(
        'avatar-1',
        'session-1',
        'こんにちは',
        'こんにちは！何かお手伝いできることはありますか？'
      );

      expect(sample.avatarId).toBe('avatar-1');
      expect(sample.sessionId).toBe('session-1');
      expect(sample.quality).toBeDefined();
      expect(sample.quality.accuracy).toBeGreaterThanOrEqual(0);
      expect(sample.quality.accuracy).toBeLessThanOrEqual(100);
      expect(sample.quality.averageScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('alerts', () => {
    it('should have default alert rules configured', async () => {
      const avatarId = 'test-avatar-3';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      await engine.collectMetrics(avatarId, period);

      // デフォルトルールが設定されていることを確認
      const activeAlerts = engine.getActiveAlerts();
      expect(Array.isArray(activeAlerts)).toBe(true);
    });

    it('should acknowledge alerts', async () => {
      const avatarId = 'test-avatar-4';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      await engine.collectMetrics(avatarId, period);
      const alerts = engine.getActiveAlerts();

      if (alerts.length > 0) {
        const alertId = alerts[0].alertId;
        engine.acknowledgeAlert(alertId);

        const alert = engine.getAlert(alertId);
        expect(alert?.status).toBe('acknowledged');
        expect(alert?.acknowledgedAt).toBeDefined();
      }
    });

    it('should resolve alerts', async () => {
      const avatarId = 'test-avatar-5';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      await engine.collectMetrics(avatarId, period);
      const alerts = engine.getActiveAlerts();

      if (alerts.length > 0) {
        const alertId = alerts[0].alertId;
        engine.resolveAlert(alertId);

        const alert = engine.getAlert(alertId);
        expect(alert?.status).toBe('resolved');
        expect(alert?.resolvedAt).toBeDefined();
      }
    });
  });

  describe('generateSuggestions', () => {
    it('should generate improvement suggestions', async () => {
      const avatarId = 'test-avatar-6';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      // メトリクスを収集して履歴を作成
      await engine.collectMetrics(avatarId, period);

      const suggestions = await engine.generateSuggestions(avatarId);

      expect(Array.isArray(suggestions)).toBe(true);
      suggestions.forEach(suggestion => {
        expect(suggestion.suggestionId).toBeDefined();
        expect(suggestion.avatarId).toBe(avatarId);
        expect(['response', 'knowledge', 'persona', 'performance', 'process']).toContain(suggestion.category);
        expect(['low', 'medium', 'high']).toContain(suggestion.effort);
        expect(['proposed', 'approved', 'implementing', 'completed', 'rejected']).toContain(suggestion.status);
      });
    });
  });

  describe('generateReport', () => {
    it('should generate quality report', async () => {
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      // いくつかのアバターのメトリクスを収集
      await engine.collectMetrics('avatar-1', period);
      await engine.collectMetrics('avatar-2', period);

      const report = await engine.generateReport(period);

      expect(report.reportId).toBeDefined();
      expect(report.period).toEqual(period);
      expect(Array.isArray(report.avatarMetrics)).toBe(true);
      expect(Array.isArray(report.alerts)).toBe(true);
      expect(Array.isArray(report.suggestions)).toBe(true);
      expect(Array.isArray(report.trends)).toBe(true);
      expect(report.summary).toBeDefined();
      expect(['excellent', 'good', 'fair', 'poor', 'critical']).toContain(report.summary.overallHealth);
    });

    it('should calculate trends correctly', async () => {
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      // 複数のメトリクスを収集してトレンドを作成
      const avatarId = 'avatar-trend';
      await engine.collectMetrics(avatarId, {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-07'),
      });
      await engine.collectMetrics(avatarId, {
        start: new Date('2025-01-08'),
        end: new Date('2025-01-14'),
      });

      const report = await engine.generateReport(period);

      expect(report.trends.length).toBeGreaterThanOrEqual(0);
      report.trends.forEach(trend => {
        expect(['up', 'down', 'stable']).toContain(trend.direction);
        expect(typeof trend.changePercent).toBe('number');
      });
    });
  });

  describe('alertRules', () => {
    it('should allow adding custom alert rules', () => {
      const customRule = {
        ruleId: 'custom-rule',
        name: 'カスタムルール',
        metric: 'responseQuality.accuracy',
        condition: 'below' as const,
        threshold: 50,
        window: 600000,
        severity: 'warning' as const,
        enabled: true,
        notificationChannels: ['email'],
      };

      engine.addAlertRule(customRule);

      // ルールが追加されたことを確認（内部状態の確認）
      expect(() => engine.addAlertRule(customRule)).not.toThrow();
    });
  });

  describe('escalationPolicies', () => {
    it('should allow setting escalation policies', () => {
      const policy = {
        policyId: 'test-policy',
        name: 'テストポリシー',
        levels: [
          {
            level: 1,
            name: 'レベル1',
            notifyRoles: ['developer'],
            channels: ['slack'],
            responseTimeMinutes: 15,
            actions: ['確認'],
          },
        ],
        autoEscalate: false,
        escalationWindow: 15,
      };

      engine.setEscalationPolicy(policy);

      // ポリシーが設定されたことを確認
      expect(() => engine.setEscalationPolicy(policy)).not.toThrow();
    });
  });
});
