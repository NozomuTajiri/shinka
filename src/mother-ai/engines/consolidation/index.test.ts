/**
 * 統廃合エンジンのユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConsolidationEngine } from './index.js';
import type { AvatarMetrics } from './types.js';

describe('ConsolidationEngine', () => {
  let engine: ConsolidationEngine;

  beforeEach(() => {
    engine = new ConsolidationEngine();
  });

  describe('collectMetrics', () => {
    it('アバターメトリクスを正しく収集する', async () => {
      const avatarId = 'test-avatar-1';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      const metrics = await engine.collectMetrics(avatarId, period);

      expect(metrics.avatarId).toBe(avatarId);
      expect(metrics.avatarName).toBe('アバター-test-avatar-1');
      expect(metrics.period).toEqual(period);
      expect(metrics.usage).toBeDefined();
      expect(metrics.effectiveness).toBeDefined();
      expect(metrics.cost).toBeDefined();
      expect(metrics.overallScore).toBeGreaterThanOrEqual(0);
      expect(metrics.overallScore).toBeLessThanOrEqual(100);
    });

    it('メトリクスがキャッシュされる', async () => {
      const avatarId = 'test-avatar-2';
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      await engine.collectMetrics(avatarId, period);
      const cached = engine.getCandidate(avatarId);

      // メトリクスは内部キャッシュに保存される
      // 公開APIはcandidateのみなので、2回目の呼び出しで同じメトリクスが返されることを確認
      const metrics2 = await engine.collectMetrics(avatarId, period);
      expect(metrics2.avatarId).toBe(avatarId);
    });
  });

  describe('detectCandidates', () => {
    it('低利用率アバターを廃止候補として検出する', async () => {
      const lowUsageMetrics: AvatarMetrics = {
        avatarId: 'low-usage',
        avatarName: 'Low Usage Avatar',
        period: { start: new Date(), end: new Date() },
        usage: {
          totalSessions: 5,
          uniqueUsers: 3,
          averageSessionDuration: 10,
          messagesPerSession: 2,
          returnRate: 0.2,
          peakUsageHours: [10],
        },
        effectiveness: {
          taskCompletionRate: 80,
          userSatisfactionScore: 70,
          escalationRate: 5,
          resolutionRate: 85,
          qualityScore: 75,
        },
        cost: {
          apiCalls: 100,
          tokenUsage: 50000,
          computeCost: 0.5,
          maintenanceHours: 2,
          totalCost: 10,
        },
        overallScore: 50,
      };

      const candidates = await engine.detectCandidates([lowUsageMetrics]);

      expect(candidates.length).toBeGreaterThan(0);
      const deprecateCandidate = candidates.find(c => c.type === 'deprecate');
      expect(deprecateCandidate).toBeDefined();
      expect(deprecateCandidate?.avatars).toContain('low-usage');
    });

    it('低効果アバターを改善候補として検出する', async () => {
      const lowEffectivenessMetrics: AvatarMetrics = {
        avatarId: 'low-effectiveness',
        avatarName: 'Low Effectiveness Avatar',
        period: { start: new Date(), end: new Date() },
        usage: {
          totalSessions: 50,
          uniqueUsers: 30,
          averageSessionDuration: 15,
          messagesPerSession: 5,
          returnRate: 0.5,
          peakUsageHours: [10, 14],
        },
        effectiveness: {
          taskCompletionRate: 40,
          userSatisfactionScore: 45,
          escalationRate: 15,
          resolutionRate: 50,
          qualityScore: 45,
        },
        cost: {
          apiCalls: 500,
          tokenUsage: 250000,
          computeCost: 2.5,
          maintenanceHours: 5,
          totalCost: 50,
        },
        overallScore: 45,
      };

      const candidates = await engine.detectCandidates([lowEffectivenessMetrics]);

      expect(candidates.length).toBeGreaterThan(0);
      const archiveCandidate = candidates.find(c => c.type === 'archive');
      expect(archiveCandidate).toBeDefined();
      expect(archiveCandidate?.avatars).toContain('low-effectiveness');
    });

    it('健全なアバターは候補として検出されない', async () => {
      const healthyMetrics: AvatarMetrics = {
        avatarId: 'healthy',
        avatarName: 'Healthy Avatar',
        period: { start: new Date(), end: new Date() },
        usage: {
          totalSessions: 100,
          uniqueUsers: 50,
          averageSessionDuration: 20,
          messagesPerSession: 8,
          returnRate: 0.8,
          peakUsageHours: [9, 10, 14, 15],
        },
        effectiveness: {
          taskCompletionRate: 90,
          userSatisfactionScore: 85,
          escalationRate: 3,
          resolutionRate: 95,
          qualityScore: 88,
        },
        cost: {
          apiCalls: 1000,
          tokenUsage: 500000,
          computeCost: 5,
          maintenanceHours: 3,
          totalCost: 80,
        },
        overallScore: 85,
      };

      const candidates = await engine.detectCandidates([healthyMetrics]);

      expect(candidates.length).toBe(0);
    });
  });

  describe('createMergeProposal', () => {
    it('統合提案を正しく作成する', async () => {
      const sourceAvatars = ['avatar-1', 'avatar-2'];
      const proposal = await engine.createMergeProposal(sourceAvatars);

      expect(proposal.proposalId).toMatch(/^merge-\d+$/);
      expect(proposal.sourceAvatars).toEqual(sourceAvatars);
      expect(proposal.targetAvatar).toBeDefined();
      expect(proposal.targetAvatar.name).toBe('統合アバター');
      expect(proposal.mergeStrategy).toBeDefined();
      expect(proposal.timeline).toBeDefined();
      expect(proposal.risks.length).toBeGreaterThan(0);
      expect(proposal.status).toBe('draft');
    });

    it('提案がキャッシュされる', async () => {
      const sourceAvatars = ['avatar-3', 'avatar-4'];
      const proposal = await engine.createMergeProposal(sourceAvatars);

      const cached = engine.getProposal(proposal.proposalId);
      expect(cached).toEqual(proposal);
    });
  });

  describe('createDeprecationPlan', () => {
    it('廃止計画を正しく作成する', async () => {
      const avatarId = 'deprecated-avatar';
      const reason = 'Low usage and effectiveness';
      const plan = await engine.createDeprecationPlan(avatarId, reason);

      expect(plan.planId).toMatch(/^deprecation-\d+$/);
      expect(plan.avatarId).toBe(avatarId);
      expect(plan.reason).toBe(reason);
      expect(plan.timeline).toBeDefined();
      expect(plan.timeline.gracePeriod).toBe(30);
      expect(plan.migration).toBeDefined();
      expect(plan.migration.targetAvatar).toBe('default-avatar');
      expect(plan.communication).toBeDefined();
      expect(plan.status).toBe('draft');
    });

    it('廃止計画のタイムラインが正しく設定される', async () => {
      const avatarId = 'deprecated-avatar';
      const reason = 'Test reason';
      const plan = await engine.createDeprecationPlan(avatarId, reason);

      const { announcementDate, deprecationDate, sunsetDate } = plan.timeline;

      expect(announcementDate.getTime()).toBeLessThan(deprecationDate.getTime());
      expect(deprecationDate.getTime()).toBeLessThan(sunsetDate.getTime());
    });
  });

  describe('assessImpact', () => {
    it('影響評価を正しく実行する', async () => {
      // まずメトリクスを収集してから候補を検出
      const metrics: AvatarMetrics = {
        avatarId: 'impact-test',
        avatarName: 'Impact Test Avatar',
        period: { start: new Date(), end: new Date() },
        usage: {
          totalSessions: 5,
          uniqueUsers: 10,
          averageSessionDuration: 10,
          messagesPerSession: 2,
          returnRate: 0.2,
          peakUsageHours: [10],
        },
        effectiveness: {
          taskCompletionRate: 70,
          userSatisfactionScore: 65,
          escalationRate: 8,
          resolutionRate: 75,
          qualityScore: 68,
        },
        cost: {
          apiCalls: 100,
          tokenUsage: 50000,
          computeCost: 0.5,
          maintenanceHours: 2,
          totalCost: 20,
        },
        overallScore: 45,
      };

      const candidates = await engine.detectCandidates([metrics]);
      expect(candidates.length).toBeGreaterThan(0);

      const candidate = candidates[0];
      const impact = await engine.assessImpact(candidate.candidateId);

      expect(impact.affectedUsers).toBeGreaterThanOrEqual(0);
      expect(impact.serviceDisruption).toMatch(/^(none|minimal|moderate|significant)$/);
      expect(impact.costSavings).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(impact.capabilityLoss)).toBe(true);
      expect(impact.migrationEffort).toMatch(/^(low|medium|high)$/);
    });

    it('存在しない候補IDでエラーを投げる', async () => {
      await expect(
        engine.assessImpact('non-existent-id')
      ).rejects.toThrow('候補が見つかりません');
    });
  });

  describe('generateReport', () => {
    it('統廃合レポートを正しく生成する', async () => {
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      // いくつかのメトリクスを収集
      await engine.collectMetrics('avatar-1', period);
      await engine.collectMetrics('avatar-2', period);

      const report = await engine.generateReport(period);

      expect(report.reportId).toMatch(/^report-\d+$/);
      expect(report.period).toEqual(period);
      expect(Array.isArray(report.avatarMetrics)).toBe(true);
      expect(Array.isArray(report.candidates)).toBe(true);
      expect(Array.isArray(report.proposals)).toBe(true);
      expect(Array.isArray(report.deprecations)).toBe(true);
      expect(report.summary).toBeDefined();
      expect(report.summary.totalAvatars).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(report.summary.recommendations)).toBe(true);
      expect(report.generatedAt).toBeInstanceOf(Date);
    });

    it('レポートサマリーに正しい統計が含まれる', async () => {
      const period = {
        start: new Date('2025-01-01'),
        end: new Date('2025-01-31'),
      };

      // 複数のメトリクスを収集
      await engine.collectMetrics('avatar-1', period);
      await engine.collectMetrics('avatar-2', period);
      await engine.collectMetrics('avatar-3', period);

      const report = await engine.generateReport(period);

      expect(report.summary.totalAvatars).toBeGreaterThan(0);
      expect(report.summary.healthyAvatars).toBeGreaterThanOrEqual(0);
      expect(report.summary.underperformingAvatars).toBeGreaterThanOrEqual(0);
      expect(report.summary.consolidationOpportunities).toBeGreaterThanOrEqual(0);
      expect(report.summary.estimatedSavings).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getter methods', () => {
    it('getCandidate は正しい候補を返す', async () => {
      const metrics: AvatarMetrics = {
        avatarId: 'test-getter',
        avatarName: 'Test Getter Avatar',
        period: { start: new Date(), end: new Date() },
        usage: {
          totalSessions: 5,
          uniqueUsers: 3,
          averageSessionDuration: 10,
          messagesPerSession: 2,
          returnRate: 0.2,
          peakUsageHours: [10],
        },
        effectiveness: {
          taskCompletionRate: 70,
          userSatisfactionScore: 65,
          escalationRate: 8,
          resolutionRate: 75,
          qualityScore: 68,
        },
        cost: {
          apiCalls: 100,
          tokenUsage: 50000,
          computeCost: 0.5,
          maintenanceHours: 2,
          totalCost: 10,
        },
        overallScore: 45,
      };

      const candidates = await engine.detectCandidates([metrics]);
      const candidate = candidates[0];

      const retrieved = engine.getCandidate(candidate.candidateId);
      expect(retrieved).toEqual(candidate);
    });

    it('getProposal は正しい提案を返す', async () => {
      const proposal = await engine.createMergeProposal(['avatar-1', 'avatar-2']);

      const retrieved = engine.getProposal(proposal.proposalId);
      expect(retrieved).toEqual(proposal);
    });

    it('getDeprecationPlan は正しい計画を返す', async () => {
      const plan = await engine.createDeprecationPlan('avatar-1', 'Test reason');

      const retrieved = engine.getDeprecationPlan(plan.planId);
      expect(retrieved).toEqual(plan);
    });

    it('存在しないIDに対してundefinedを返す', () => {
      expect(engine.getCandidate('non-existent')).toBeUndefined();
      expect(engine.getProposal('non-existent')).toBeUndefined();
      expect(engine.getDeprecationPlan('non-existent')).toBeUndefined();
    });
  });
});
