/**
 * CEOコンサルアバター「戦略」のユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SenryakuAvatar, SENRYAKU_PERSONA } from '../../../src/avatars/senryaku/index.js';
import type { SenryakuSession, DecisionContext } from '../../../src/avatars/senryaku/types.js';

// Anthropic SDKをモック
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [{ type: 'text', text: 'モックレスポンス' }],
        }),
      };
    },
  };
});

describe('SenryakuAvatar', () => {
  let avatar: SenryakuAvatar;

  beforeEach(() => {
    avatar = new SenryakuAvatar();
  });

  describe('セッション管理', () => {
    it('新しいセッションを開始できる', () => {
      const session = avatar.startSession('client-123', 'strategy');

      expect(session).toBeDefined();
      expect(session.sessionId).toMatch(/^senryaku-/);
      expect(session.clientId).toBe('client-123');
      expect(session.topic).toBe('strategy');
      expect(session.conversationHistory).toEqual([]);
      expect(session.insights).toEqual([]);
      expect(session.generatedReports).toEqual([]);
    });

    it('セッションIDが一意である', () => {
      const session1 = avatar.startSession('client-1', 'strategy');
      const session2 = avatar.startSession('client-2', 'decision');

      expect(session1.sessionId).not.toBe(session2.sessionId);
    });

    it('セッションを取得できる', () => {
      const session = avatar.startSession('client-123', 'strategy');
      const retrieved = avatar.getSession(session.sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe(session.sessionId);
    });

    it('存在しないセッションIDの場合undefinedを返す', () => {
      const retrieved = avatar.getSession('non-existent-id');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('意思決定コンテキスト', () => {
    it('意思決定コンテキストを設定できる', () => {
      const session = avatar.startSession('client-123', 'decision');

      const context: DecisionContext = {
        situation: '新規事業への投資判断',
        options: [
          {
            id: 'opt-1',
            name: '投資する',
            description: '1億円を投資',
            pros: ['市場拡大の可能性'],
            cons: ['リスクが高い'],
            risks: [
              {
                type: 'financial',
                probability: 'medium',
                impact: 'high',
                mitigation: '段階的投資',
              },
            ],
            expectedOutcome: '3年後に黒字化',
          },
        ],
        constraints: ['予算制約', '人材不足'],
        timeframe: 'medium',
        stakeholders: ['経営陣', '株主'],
      };

      avatar.setDecisionContext(session.sessionId, context);

      const retrieved = avatar.getSession(session.sessionId);
      expect(retrieved?.context).toEqual(context);
    });
  });

  describe('対話処理', () => {
    it('ユーザーメッセージを処理できる', async () => {
      const session = avatar.startSession('client-123', 'strategy');

      const result = await avatar.processMessage(
        session.sessionId,
        '新規事業の戦略について相談したい'
      );

      expect(result).toBeDefined();
      expect(result.response).toBeDefined();
      expect(result.suggestedFrameworks).toBeDefined();
      expect(result.insights).toBeDefined();
      expect(Array.isArray(result.suggestedFrameworks)).toBe(true);
    });

    it('会話履歴が保存される', async () => {
      const session = avatar.startSession('client-123', 'strategy');

      await avatar.processMessage(session.sessionId, 'テストメッセージ');

      const retrieved = avatar.getSession(session.sessionId);
      expect(retrieved?.conversationHistory.length).toBeGreaterThan(0);
      expect(retrieved?.conversationHistory[0].role).toBe('user');
      expect(retrieved?.conversationHistory[0].content).toBe('テストメッセージ');
    });

    it('存在しないセッションIDでエラーをスローする', async () => {
      await expect(
        avatar.processMessage('non-existent', 'メッセージ')
      ).rejects.toThrow('セッションが見つかりません');
    });
  });

  describe('統合報告書生成', () => {
    it('統合報告書を生成できる', async () => {
      const session = avatar.startSession('client-123', 'strategy');

      // 対話履歴を追加
      await avatar.processMessage(session.sessionId, '中期経営計画について相談したい');
      await avatar.processMessage(session.sessionId, '成長戦略をどう描くべきか？');

      const report = await avatar.generateIntegratedReport(session.sessionId);

      expect(report).toBeDefined();
      expect(report.executiveSummary).toBeDefined();
      expect(report.strategicAnalysis).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(report.actionPlan).toBeDefined();
      expect(report.kpis).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
      expect(Array.isArray(report.actionPlan)).toBe(true);
      expect(Array.isArray(report.kpis)).toBe(true);
    });

    it('存在しないセッションIDでエラーをスローする', async () => {
      await expect(
        avatar.generateIntegratedReport('non-existent')
      ).rejects.toThrow('セッションが見つかりません');
    });
  });

  describe('ペルソナ情報', () => {
    it('ペルソナ情報を取得できる', () => {
      const persona = avatar.getPersona();

      expect(persona).toBeDefined();
      expect(persona.id).toBe('senryaku');
      expect(persona.name).toBe('戦略');
      expect(persona.role).toBe('CEO戦略コンサルタント');
      expect(persona.description).toBeDefined();
      expect(persona.communicationStyle).toBeDefined();
      expect(Array.isArray(persona.values)).toBe(true);
      expect(Array.isArray(persona.behaviorPrinciples)).toBe(true);
    });

    it('ペルソナが定数と一致する', () => {
      const persona = avatar.getPersona();
      expect(persona).toEqual(SENRYAKU_PERSONA);
    });
  });

  describe('型安全性', () => {
    it('セッショントピックが正しい型である', () => {
      const topics: Array<SenryakuSession['topic']> = [
        'strategy',
        'decision',
        'planning',
        'review',
      ];

      topics.forEach(topic => {
        const session = avatar.startSession('client-test', topic);
        expect(session.topic).toBe(topic);
      });
    });

    it('会話履歴のroleが正しい型である', async () => {
      const session = avatar.startSession('client-123', 'strategy');
      await avatar.processMessage(session.sessionId, 'テスト');

      const retrieved = avatar.getSession(session.sessionId);
      const roles = retrieved?.conversationHistory.map(turn => turn.role);

      roles?.forEach(role => {
        expect(['user', 'assistant']).toContain(role);
      });
    });
  });
});
