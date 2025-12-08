/**
 * 営業コンサルアバター「営業」のテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EigyoAvatar, EIGYO_PERSONA, SALES_PROCESSES, OBJECTION_PATTERNS } from '../../../src/avatars/eigyo/index.js';
import { getProcessByPhase, getNextPhase } from '../../../src/avatars/eigyo/sales-process.js';

// Anthropic APIをモック
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: 'モックレスポンス: 具体的なアドバイスを提供します。',
            },
          ],
        }),
      };
    },
  };
});

describe('EigyoAvatar', () => {
  let avatar: EigyoAvatar;

  beforeEach(() => {
    avatar = new EigyoAvatar();
  });

  describe('ペルソナ', () => {
    it('正しいペルソナ情報を持つ', () => {
      const persona = avatar.getPersona();

      expect(persona.id).toBe('eigyo');
      expect(persona.name).toBe('営業');
      expect(persona.role).toBe('営業コンサルタント');
      expect(persona.communicationStyle.tone).toBe('情熱的で実践的');
      expect(persona.values).toContain('営業は顧客への価値提供');
    });

    it('行動原則を定義している', () => {
      const persona = avatar.getPersona();

      expect(persona.behaviorPrinciples).toHaveLength(4);
      expect(persona.behaviorPrinciples).toContain('具体的な行動に落とし込む');
    });
  });

  describe('セッション管理', () => {
    it('新しいセッションを開始できる', () => {
      const session = avatar.startSession('test-sales-person-1');

      expect(session.sessionId).toMatch(/^eigyo-/);
      expect(session.salesPersonId).toBe('test-sales-person-1');
      expect(session.skillsAssessment.overallScore).toBe(0);
      expect(session.actionPlan).toEqual([]);
      expect(session.heroMoments).toEqual([]);
    });

    it('セッションを取得できる', () => {
      const session = avatar.startSession('test-sales-person-2');
      const retrieved = avatar.getSession(session.sessionId);

      expect(retrieved).toBeDefined();
      expect(retrieved?.sessionId).toBe(session.sessionId);
    });

    it('存在しないセッションはundefinedを返す', () => {
      const retrieved = avatar.getSession('non-existent-session');

      expect(retrieved).toBeUndefined();
    });
  });

  describe('スキル診断', () => {
    it('スキル診断を実行できる', async () => {
      const session = avatar.startSession('test-sales-person-3');

      const assessment = await avatar.assessSkills(session.sessionId, {
        approach: 85,
        discovery: 90,
        presentation: 70,
        handling: 55,
        closing: 75,
        relationship: 80,
      });

      expect(assessment.overallScore).toBeGreaterThan(0);
      expect(assessment.strengths).toContain('アプローチ');
      expect(assessment.strengths).toContain('ニーズ発見');
      expect(assessment.developmentAreas).toContain('反論対応');
    });

    it('総合スコアを正しく計算する', async () => {
      const session = avatar.startSession('test-sales-person-4');

      const assessment = await avatar.assessSkills(session.sessionId, {
        approach: 80,
        discovery: 80,
        presentation: 80,
        handling: 80,
        closing: 80,
        relationship: 80,
      });

      expect(assessment.overallScore).toBe(80);
    });
  });

  describe('案件コンテキスト', () => {
    it('案件コンテキストを設定できる', () => {
      const session = avatar.startSession('test-sales-person-5');

      avatar.setDealContext(session.sessionId, {
        customerName: 'テスト株式会社',
        dealSize: 1000000,
        currentPhase: 'discovery',
        keyStakeholders: [
          {
            name: '山田太郎',
            role: '部長',
            influence: 'decision-maker',
            attitude: 'neutral',
            needs: ['コスト削減', '業務効率化'],
          },
        ],
        competitorSituation: '他社と比較検討中',
        timeline: '3ヶ月以内',
        challenges: ['予算制約', '社内承認プロセス'],
      });

      const retrieved = avatar.getSession(session.sessionId);
      expect(retrieved?.dealContext?.customerName).toBe('テスト株式会社');
      expect(retrieved?.dealContext?.currentPhase).toBe('discovery');
    });
  });

  describe('ヒーローストーリー', () => {
    it('ヒーローストーリーを追加できる', () => {
      const story = {
        id: 'story-1',
        salesPerson: '田中一郎',
        situation: '大型案件の最終プレゼン',
        challenge: '競合3社との競争',
        action: 'カスタマイズ提案で差別化',
        result: '3000万円受注',
        lessons: ['顧客理解の重要性', '差別化戦略'],
        applicableScenarios: ['大型案件', '競合状況'],
      };

      avatar.addHeroStory(story);

      const found = avatar.findRelevantStories('大型案件のクロージング');
      expect(found).toHaveLength(1);
      expect(found[0].id).toBe('story-1');
    });
  });
});

describe('営業プロセスフレームワーク', () => {
  describe('SALES_PROCESSES', () => {
    it('6つのフェーズを定義している', () => {
      expect(SALES_PROCESSES).toHaveLength(6);

      const phases = SALES_PROCESSES.map(p => p.phase);
      expect(phases).toEqual([
        'approach',
        'discovery',
        'presentation',
        'handling',
        'closing',
        'follow',
      ]);
    });

    it('各フェーズに目標・アクション・成功基準がある', () => {
      SALES_PROCESSES.forEach(process => {
        expect(process.objectives.length).toBeGreaterThan(0);
        expect(process.keyActions.length).toBeGreaterThan(0);
        expect(process.successCriteria.length).toBeGreaterThan(0);
      });
    });
  });

  describe('OBJECTION_PATTERNS', () => {
    it('6種類の反論パターンを定義している', () => {
      expect(OBJECTION_PATTERNS).toHaveLength(6);

      const types = OBJECTION_PATTERNS.map(o => o.objectionType);
      expect(types).toEqual([
        'price',
        'timing',
        'competitor',
        'authority',
        'trust',
        'need',
      ]);
    });

    it('各パターンに応答戦略とサンプルがある', () => {
      OBJECTION_PATTERNS.forEach(pattern => {
        expect(pattern.objection).toBeTruthy();
        expect(pattern.responseStrategy).toBeTruthy();
        expect(pattern.sampleResponse).toBeTruthy();
        expect(pattern.followUpQuestions.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Helper関数', () => {
    it('getProcessByPhase: フェーズからプロセスを取得', () => {
      const discovery = getProcessByPhase('discovery');

      expect(discovery).toBeDefined();
      expect(discovery?.name).toBe('ニーズ発見');
    });

    it('getNextPhase: 次のフェーズを取得', () => {
      expect(getNextPhase('approach')).toBe('discovery');
      expect(getNextPhase('discovery')).toBe('presentation');
      expect(getNextPhase('follow')).toBeNull();
    });
  });
});
