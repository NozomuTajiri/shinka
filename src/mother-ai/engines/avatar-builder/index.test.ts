/**
 * アバター構築エンジン - ユニットテスト
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AvatarBuilderEngine } from './index.js';
import type {
  BuildTrigger,
  AvatarRequirements,
  CommunicationStyleSpec,
} from './types.js';

// Anthropic SDKのモック
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: class MockAnthropic {
      messages = {
        create: vi.fn().mockResolvedValue({
          content: [
            {
              type: 'text',
              text: '承認: はい\n理由: 優れたビジネス価値があります',
            },
          ],
        }),
      };
    },
  };
});

describe('AvatarBuilderEngine', () => {
  let engine: AvatarBuilderEngine;
  let sampleTrigger: BuildTrigger;
  let sampleRequirements: AvatarRequirements;
  let sampleCommunicationStyle: CommunicationStyleSpec;

  beforeEach(() => {
    engine = new AvatarBuilderEngine();

    sampleCommunicationStyle = {
      tone: '親しみやすい',
      formality: 'semi-formal',
      empathy: 'high',
      directness: 'balanced',
    };

    sampleRequirements = {
      purpose: 'カスタマーサポート',
      targetAudience: ['顧客', 'サポート担当者'],
      domain: 'eコマース',
      capabilities: ['問い合わせ対応', 'FAQ検索', '注文状況確認'],
      communicationStyle: sampleCommunicationStyle,
      knowledgeSources: ['FAQ', '製品カタログ'],
      integrations: ['CRM', 'チャットbot'],
    };

    sampleTrigger = {
      type: 'client_request',
      source: 'カスタマーサポート部門',
      data: { department: 'support' },
      detectedAt: new Date(),
      confidence: 0.85,
    };
  });

  describe('detectBuildTriggers', () => {
    it('トリガーリストを返すこと', async () => {
      const triggers = await engine.detectBuildTriggers();
      expect(Array.isArray(triggers)).toBe(true);
    });
  });

  describe('createBuildRequest', () => {
    it('有効な構築リクエストを作成すること', () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);

      expect(request).toBeDefined();
      expect(request.requestId).toMatch(/^build-/);
      expect(request.requestedBy).toBe('client');
      expect(request.requirements).toEqual(sampleRequirements);
      expect(request.status).toBe('pending');
      expect(request.priority).toBe('high');
    });

    it('優先度を正しく計算すること', () => {
      const criticalTrigger: BuildTrigger = { ...sampleTrigger, confidence: 0.95 };
      const criticalRequest = engine.createBuildRequest(criticalTrigger, sampleRequirements);
      expect(criticalRequest.priority).toBe('critical');

      const lowTrigger: BuildTrigger = { ...sampleTrigger, confidence: 0.4 };
      const lowRequest = engine.createBuildRequest(lowTrigger, sampleRequirements);
      expect(lowRequest.priority).toBe('low');
    });

    it('システムリクエストとして正しく分類すること', () => {
      const systemTrigger: BuildTrigger = { ...sampleTrigger, type: 'gap_analysis' };
      const request = engine.createBuildRequest(systemTrigger, sampleRequirements);
      expect(request.requestedBy).toBe('system');
    });
  });

  describe('analyzeAndApprove', () => {
    it('リクエストを分析して承認すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      const result = await engine.analyzeAndApprove(request.requestId);

      expect(result.approved).toBe(true);
      expect(result.reason).toBeTruthy();
      expect(engine.getBuildRequest(request.requestId)?.status).toBe('approved');
    });

    it('存在しないリクエストでエラーをスローすること', async () => {
      await expect(engine.analyzeAndApprove('invalid-id')).rejects.toThrow(
        'リクエストが見つかりません'
      );
    });
  });

  describe('generateBlueprint', () => {
    it('承認済みリクエストからブループリントを生成すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);

      const blueprint = await engine.generateBlueprint(request.requestId);

      expect(blueprint).toBeDefined();
      expect(blueprint.blueprintId).toMatch(/^blueprint-/);
      expect(blueprint.name).toBe('eコマースアバター');
      expect(blueprint.version).toBe('1.0.0');
      expect(blueprint.persona).toBeDefined();
      expect(blueprint.knowledge).toBeDefined();
      expect(blueprint.behavior).toBeDefined();
      expect(blueprint.metadata.status).toBe('draft');
    });

    it('未承認リクエストでエラーをスローすること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await expect(engine.generateBlueprint(request.requestId)).rejects.toThrow(
        '承認済みリクエストが必要です'
      );
    });

    it('ペルソナ仕様を含むこと', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      expect(blueprint.persona.id).toMatch(/^persona-/);
      expect(blueprint.persona.name).toBeTruthy();
      expect(blueprint.persona.role).toBeTruthy();
      expect(blueprint.persona.values).toBeInstanceOf(Array);
      expect(blueprint.persona.principles).toBeInstanceOf(Array);
    });

    it('ナレッジ仕様を含むこと', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      expect(blueprint.knowledge.domains).toContain('eコマース');
      expect(blueprint.knowledge.frameworks).toHaveLength(3);
      expect(blueprint.knowledge.frameworks[0].name).toBe('問い合わせ対応');
    });

    it('振る舞い仕様を含むこと', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      expect(blueprint.behavior.responseStyle).toEqual(sampleCommunicationStyle);
      expect(blueprint.behavior.maxTokens).toBe(800);
      expect(blueprint.behavior.temperature).toBe(0.7);
      expect(blueprint.behavior.topP).toBe(0.9);
    });
  });

  describe('executeBuildPipeline', () => {
    it('パイプラインを実行して完了すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      const pipeline = await engine.executeBuildPipeline(blueprint.blueprintId);

      expect(pipeline.status).toBe('completed');
      expect(pipeline.completedAt).toBeDefined();
      expect(pipeline.stages).toHaveLength(6);
      expect(pipeline.stages.every(s => s.status === 'completed')).toBe(true);
    });

    it('すべてのステージを実行すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      const pipeline = await engine.executeBuildPipeline(blueprint.blueprintId);

      const expectedStages = [
        'validate-blueprint',
        'generate-code',
        'setup-knowledge',
        'configure-integrations',
        'run-tests',
        'deploy',
      ];

      expect(pipeline.stages.map(s => s.name)).toEqual(expectedStages);
    });

    it('ブループリントのステータスをdeployedに更新すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      await engine.executeBuildPipeline(blueprint.blueprintId);

      const updatedBlueprint = engine.getBlueprint(blueprint.blueprintId);
      expect(updatedBlueprint?.metadata.status).toBe('deployed');
    });

    it('存在しないブループリントでエラーをスローすること', async () => {
      await expect(engine.executeBuildPipeline('invalid-id')).rejects.toThrow(
        'ブループリントが見つかりません'
      );
    });

    it('ログを記録すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      const pipeline = await engine.executeBuildPipeline(blueprint.blueprintId);

      expect(pipeline.logs.length).toBeGreaterThan(0);
      expect(pipeline.logs[0]).toHaveProperty('timestamp');
      expect(pipeline.logs[0]).toHaveProperty('level');
      expect(pipeline.logs[0]).toHaveProperty('message');
    });
  });

  describe('validateBlueprint', () => {
    it('バリデーションを実行すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      const validation = await engine.validateBlueprint(blueprint.blueprintId);

      expect(validation.validationId).toMatch(/^validation-/);
      expect(validation.checks).toHaveLength(4);
      expect(validation.overallScore).toBeGreaterThan(0);
      expect(validation.passed).toBe(true);
    });

    it('すべてのカテゴリーをチェックすること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      const validation = await engine.validateBlueprint(blueprint.blueprintId);

      const categories = validation.checks.map(c => c.category);
      expect(categories).toContain('functionality');
      expect(categories).toContain('quality');
      expect(categories).toContain('security');
      expect(categories).toContain('performance');
    });

    it('推奨事項を生成すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      const validation = await engine.validateBlueprint(blueprint.blueprintId);

      expect(Array.isArray(validation.recommendations)).toBe(true);
    });

    it('存在しないブループリントでエラーをスローすること', async () => {
      await expect(engine.validateBlueprint('invalid-id')).rejects.toThrow(
        'ブループリントが見つかりません'
      );
    });
  });

  describe('ゲッターメソッド', () => {
    it('getBuildRequestが正しく動作すること', () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      const retrieved = engine.getBuildRequest(request.requestId);
      expect(retrieved).toEqual(request);
    });

    it('getBlueprintが正しく動作すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);

      const retrieved = engine.getBlueprint(blueprint.blueprintId);
      expect(retrieved).toEqual(blueprint);
    });

    it('getPipelineが正しく動作すること', async () => {
      const request = engine.createBuildRequest(sampleTrigger, sampleRequirements);
      await engine.analyzeAndApprove(request.requestId);
      const blueprint = await engine.generateBlueprint(request.requestId);
      const pipeline = await engine.executeBuildPipeline(blueprint.blueprintId);

      const retrieved = engine.getPipeline(pipeline.pipelineId);
      expect(retrieved).toEqual(pipeline);
    });

    it('getAllBlueprintsが全ブループリントを返すこと', async () => {
      // 新しいエンジンインスタンスを作成して独立性を確保
      const freshEngine = new AvatarBuilderEngine();

      const request1 = freshEngine.createBuildRequest(sampleTrigger, sampleRequirements);
      await freshEngine.analyzeAndApprove(request1.requestId);
      await freshEngine.generateBlueprint(request1.requestId);

      // タイムスタンプベースのIDが重複しないよう少し待機
      await new Promise(resolve => setTimeout(resolve, 10));

      const request2 = freshEngine.createBuildRequest(sampleTrigger, sampleRequirements);
      await freshEngine.analyzeAndApprove(request2.requestId);
      await freshEngine.generateBlueprint(request2.requestId);

      const allBlueprints = freshEngine.getAllBlueprints();
      expect(allBlueprints).toHaveLength(2);
    });
  });
});
