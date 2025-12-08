/**
 * 戦略フレームワーク集のユニットテスト
 */

import { describe, it, expect } from 'vitest';
import {
  STRATEGIC_FRAMEWORKS,
  getFramework,
  getApplicableFrameworks,
  getFrameworkQuestions,
} from '../../../src/avatars/senryaku/frameworks.js';

describe('戦略フレームワーク', () => {
  describe('STRATEGIC_FRAMEWORKS', () => {
    it('3つのフレームワークが定義されている', () => {
      expect(STRATEGIC_FRAMEWORKS).toHaveLength(3);
    });

    it('各フレームワークが必須プロパティを持つ', () => {
      STRATEGIC_FRAMEWORKS.forEach(framework => {
        expect(framework.id).toBeDefined();
        expect(framework.name).toBeDefined();
        expect(framework.description).toBeDefined();
        expect(Array.isArray(framework.applicableScenarios)).toBe(true);
        expect(Array.isArray(framework.steps)).toBe(true);
      });
    });

    it('付加価値経営®フレームワークが含まれる', () => {
      const vbm = STRATEGIC_FRAMEWORKS.find(f => f.id === 'value-based-management');
      expect(vbm).toBeDefined();
      expect(vbm?.name).toBe('付加価値経営®フレームワーク');
      expect(vbm?.steps).toHaveLength(6); // 6つの価値軸
    });

    it('戦略的意思決定マトリクスが含まれる', () => {
      const dm = STRATEGIC_FRAMEWORKS.find(f => f.id === 'decision-matrix');
      expect(dm).toBeDefined();
      expect(dm?.name).toBe('戦略的意思決定マトリクス');
    });

    it('シナリオプランニングが含まれる', () => {
      const sp = STRATEGIC_FRAMEWORKS.find(f => f.id === 'scenario-planning');
      expect(sp).toBeDefined();
      expect(sp?.name).toBe('シナリオプランニング');
    });
  });

  describe('getFramework', () => {
    it('IDでフレームワークを取得できる', () => {
      const framework = getFramework('value-based-management');
      expect(framework).toBeDefined();
      expect(framework?.id).toBe('value-based-management');
    });

    it('存在しないIDの場合undefinedを返す', () => {
      const framework = getFramework('non-existent-id');
      expect(framework).toBeUndefined();
    });

    it('すべてのフレームワークIDで取得できる', () => {
      const ids = ['value-based-management', 'decision-matrix', 'scenario-planning'];
      ids.forEach(id => {
        const framework = getFramework(id);
        expect(framework).toBeDefined();
        expect(framework?.id).toBe(id);
      });
    });
  });

  describe('getApplicableFrameworks', () => {
    it('「経営改革」シナリオで付加価値経営®が推奨される', () => {
      const frameworks = getApplicableFrameworks('経営改革');
      expect(frameworks.length).toBeGreaterThan(0);
      expect(frameworks.some(f => f.id === 'value-based-management')).toBe(true);
    });

    it('「M&A検討」シナリオで意思決定マトリクスが推奨される', () => {
      const frameworks = getApplicableFrameworks('M&A検討');
      expect(frameworks.length).toBeGreaterThan(0);
      expect(frameworks.some(f => f.id === 'decision-matrix')).toBe(true);
    });

    it('「中長期計画」シナリオでシナリオプランニングが推奨される', () => {
      const frameworks = getApplicableFrameworks('中長期計画');
      expect(frameworks.length).toBeGreaterThan(0);
      expect(frameworks.some(f => f.id === 'scenario-planning')).toBe(true);
    });

    it('該当しないシナリオで空配列を返す', () => {
      const frameworks = getApplicableFrameworks('該当なし');
      expect(frameworks).toEqual([]);
    });

    it('部分一致でも検索できる', () => {
      const frameworks = getApplicableFrameworks('改革');
      expect(frameworks.some(f => f.id === 'value-based-management')).toBe(true);
    });
  });

  describe('getFrameworkQuestions', () => {
    it('フレームワークのステップの質問を取得できる', () => {
      const questions = getFrameworkQuestions('value-based-management', 1);
      expect(questions.length).toBeGreaterThan(0);
      expect(questions[0]).toContain('10年後');
    });

    it('存在しないフレームワークIDで空配列を返す', () => {
      const questions = getFrameworkQuestions('non-existent', 1);
      expect(questions).toEqual([]);
    });

    it('存在しないステップ番号で空配列を返す', () => {
      const questions = getFrameworkQuestions('value-based-management', 999);
      expect(questions).toEqual([]);
    });

    it('各ステップが適切な質問を持つ', () => {
      const framework = getFramework('value-based-management');
      framework?.steps.forEach(step => {
        const questions = getFrameworkQuestions('value-based-management', step.order);
        expect(questions.length).toBeGreaterThan(0);
        expect(questions).toEqual(step.questions);
      });
    });
  });

  describe('フレームワークステップ構造', () => {
    it('各ステップが必須プロパティを持つ', () => {
      STRATEGIC_FRAMEWORKS.forEach(framework => {
        framework.steps.forEach(step => {
          expect(step.order).toBeDefined();
          expect(typeof step.order).toBe('number');
          expect(step.name).toBeDefined();
          expect(step.description).toBeDefined();
          expect(Array.isArray(step.questions)).toBe(true);
          expect(Array.isArray(step.outputs)).toBe(true);
        });
      });
    });

    it('ステップの順序が連番である', () => {
      STRATEGIC_FRAMEWORKS.forEach(framework => {
        const orders = framework.steps.map(s => s.order);
        const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);
        expect(orders.sort()).toEqual(expectedOrders);
      });
    });

    it('各ステップが少なくとも1つの質問を持つ', () => {
      STRATEGIC_FRAMEWORKS.forEach(framework => {
        framework.steps.forEach(step => {
          expect(step.questions.length).toBeGreaterThan(0);
        });
      });
    });

    it('各ステップが少なくとも1つのアウトプットを持つ', () => {
      STRATEGIC_FRAMEWORKS.forEach(framework => {
        framework.steps.forEach(step => {
          expect(step.outputs.length).toBeGreaterThan(0);
        });
      });
    });
  });

  describe('適用シナリオ', () => {
    it('各フレームワークが適切なシナリオを持つ', () => {
      STRATEGIC_FRAMEWORKS.forEach(framework => {
        expect(framework.applicableScenarios.length).toBeGreaterThan(0);
      });
    });

    it('付加価値経営®が経営改革シナリオを含む', () => {
      const vbm = getFramework('value-based-management');
      expect(vbm?.applicableScenarios).toContain('経営改革');
    });

    it('意思決定マトリクスがM&Aシナリオを含む', () => {
      const dm = getFramework('decision-matrix');
      expect(dm?.applicableScenarios).toContain('M&A検討');
    });

    it('シナリオプランニングが中長期計画を含む', () => {
      const sp = getFramework('scenario-planning');
      expect(sp?.applicableScenarios).toContain('中長期計画');
    });
  });
});
