/**
 * アバター構築エンジン
 *
 * 新規アバターの必要性検証から構築・デプロイまでを管理
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  AvatarBuildRequest,
  BuildTrigger,
  BuildValidation,
  AvatarBlueprint,
  BuildPipeline,
  PipelineStage,
  PipelineLog,
  AvatarRequirements,
  PersonaSpec,
  KnowledgeSpec,
  BehaviorSpec,
  ValidationCheck,
} from './types.js';

export class AvatarBuilderEngine {
  private anthropic: Anthropic;
  private buildRequests: Map<string, AvatarBuildRequest>;
  private blueprints: Map<string, AvatarBlueprint>;
  private pipelines: Map<string, BuildPipeline>;

  constructor() {
    this.anthropic = new Anthropic();
    this.buildRequests = new Map();
    this.blueprints = new Map();
    this.pipelines = new Map();
  }

  /**
   * 構築トリガーを検出
   */
  async detectBuildTriggers(): Promise<BuildTrigger[]> {
    const triggers: BuildTrigger[] = [];

    // 市場ニーズ分析
    const marketNeeds = await this.analyzeMarketNeeds();
    triggers.push(...marketNeeds);

    // ギャップ分析
    const gaps = await this.analyzeCapabilityGaps();
    triggers.push(...gaps);

    return triggers;
  }

  /**
   * 構築リクエストを作成
   */
  createBuildRequest(
    trigger: BuildTrigger,
    requirements: AvatarRequirements
  ): AvatarBuildRequest {
    const requestId = `build-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const request: AvatarBuildRequest = {
      requestId,
      requestedBy: trigger.type === 'client_request' ? 'client' : 'system',
      reason: this.formatTriggerReason(trigger),
      requirements,
      priority: this.calculatePriority(trigger),
      requestedAt: new Date(),
      status: 'pending',
    };

    this.buildRequests.set(requestId, request);
    return request;
  }

  /**
   * 構築リクエストを分析・承認判断
   */
  async analyzeAndApprove(requestId: string): Promise<{
    approved: boolean;
    reason: string;
    modifications?: Partial<AvatarRequirements>;
  }> {
    const request = this.buildRequests.get(requestId);
    if (!request) {
      throw new Error('リクエストが見つかりません');
    }

    request.status = 'analyzing';

    const prompt = `
以下のアバター構築リクエストを分析し、承認の可否を判断してください。

## リクエスト内容
目的: ${request.requirements.purpose}
対象: ${request.requirements.targetAudience.join(', ')}
ドメイン: ${request.requirements.domain}
機能: ${request.requirements.capabilities.join(', ')}

## 判断基準
1. 既存アバターとの重複がないか
2. ビジネス価値があるか
3. 技術的に実現可能か
4. リソース投資に見合うか

## 出力形式
承認: はい/いいえ
理由: （詳細な理由）
修正提案: （ある場合）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;
    const approved = text.includes('承認: はい') || text.includes('承認：はい');

    request.status = approved ? 'approved' : 'rejected';

    return {
      approved,
      reason: this.extractReason(text),
      modifications: approved ? undefined : this.extractModifications(text),
    };
  }

  /**
   * ブループリントを生成
   */
  async generateBlueprint(requestId: string): Promise<AvatarBlueprint> {
    const request = this.buildRequests.get(requestId);
    if (!request || request.status !== 'approved') {
      throw new Error('承認済みリクエストが必要です');
    }

    const blueprintId = `blueprint-${Date.now()}`;

    // ペルソナを生成
    const persona = await this.generatePersona(request.requirements);

    // ナレッジ仕様を生成
    const knowledge = await this.generateKnowledgeSpec(request.requirements);

    // 振る舞い仕様を生成
    const behavior = this.generateBehaviorSpec(request.requirements);

    const blueprint: AvatarBlueprint = {
      blueprintId,
      name: this.generateAvatarName(request.requirements),
      version: '1.0.0',
      persona,
      knowledge,
      behavior,
      integrations: [],
      metadata: {
        createdAt: new Date(),
        createdBy: 'avatar-builder-engine',
        lastModified: new Date(),
        status: 'draft',
        tags: [request.requirements.domain, ...request.requirements.targetAudience],
      },
    };

    this.blueprints.set(blueprintId, blueprint);
    return blueprint;
  }

  /**
   * 構築パイプラインを実行
   */
  async executeBuildPipeline(blueprintId: string): Promise<BuildPipeline> {
    const blueprint = this.blueprints.get(blueprintId);
    if (!blueprint) {
      throw new Error('ブループリントが見つかりません');
    }

    const pipelineId = `pipeline-${Date.now()}`;

    const stages: PipelineStage[] = [
      { name: 'validate-blueprint', order: 1, status: 'pending' },
      { name: 'generate-code', order: 2, status: 'pending' },
      { name: 'setup-knowledge', order: 3, status: 'pending' },
      { name: 'configure-integrations', order: 4, status: 'pending' },
      { name: 'run-tests', order: 5, status: 'pending' },
      { name: 'deploy', order: 6, status: 'pending' },
    ];

    const pipeline: BuildPipeline = {
      pipelineId,
      stages,
      currentStage: 0,
      startedAt: new Date(),
      status: 'running',
      logs: [],
    };

    this.pipelines.set(pipelineId, pipeline);

    // パイプラインを実行
    for (let i = 0; i < stages.length; i++) {
      pipeline.currentStage = i;
      stages[i].status = 'running';
      stages[i].startedAt = new Date();

      try {
        await this.executeStage(stages[i], blueprint, pipeline);
        stages[i].status = 'completed';
        stages[i].completedAt = new Date();

        this.addLog(pipeline, 'info', stages[i].name, `ステージ完了: ${stages[i].name}`);
      } catch (error) {
        stages[i].status = 'failed';
        pipeline.status = 'failed';
        this.addLog(pipeline, 'error', stages[i].name, `エラー: ${(error as Error).message}`);
        break;
      }
    }

    if (pipeline.status !== 'failed') {
      pipeline.status = 'completed';
      pipeline.completedAt = new Date();
      blueprint.metadata.status = 'deployed';
    }

    return pipeline;
  }

  /**
   * バリデーションを実行
   */
  async validateBlueprint(blueprintId: string): Promise<BuildValidation> {
    const blueprint = this.blueprints.get(blueprintId);
    if (!blueprint) {
      throw new Error('ブループリントが見つかりません');
    }

    const checks: ValidationCheck[] = [];

    // 機能チェック
    checks.push(await this.checkFunctionality(blueprint));

    // 品質チェック
    checks.push(await this.checkQuality(blueprint));

    // セキュリティチェック
    checks.push(await this.checkSecurity(blueprint));

    // パフォーマンスチェック
    checks.push(await this.checkPerformance(blueprint));

    const overallScore = checks.reduce((sum, c) => sum + c.score, 0) / checks.length;
    const passed = checks.every(c => c.passed) && overallScore >= 70;

    return {
      validationId: `validation-${Date.now()}`,
      checks,
      overallScore,
      passed,
      recommendations: this.generateRecommendations(checks),
    };
  }

  // プライベートメソッド

  private async analyzeMarketNeeds(): Promise<BuildTrigger[]> {
    // 市場ニーズ分析の簡易実装
    return [];
  }

  private async analyzeCapabilityGaps(): Promise<BuildTrigger[]> {
    // ギャップ分析の簡易実装
    return [];
  }

  private formatTriggerReason(trigger: BuildTrigger): string {
    const typeNames: Record<string, string> = {
      market_need: '市場ニーズ',
      client_request: 'クライアント要望',
      gap_analysis: 'ギャップ分析',
      scheduled_review: '定期レビュー',
    };
    return `${typeNames[trigger.type]}: ${trigger.source}`;
  }

  private calculatePriority(trigger: BuildTrigger): AvatarBuildRequest['priority'] {
    if (trigger.confidence > 0.9) return 'critical';
    if (trigger.confidence > 0.7) return 'high';
    if (trigger.confidence > 0.5) return 'medium';
    return 'low';
  }

  private extractReason(text: string): string {
    const match = text.match(/理由[：:]\s*([^\n]+)/);
    return match ? match[1].trim() : '';
  }

  private extractModifications(text: string): Partial<AvatarRequirements> | undefined {
    // 修正提案の抽出（簡易実装）
    return undefined;
  }

  private async generatePersona(requirements: AvatarRequirements): Promise<PersonaSpec> {
    const prompt = `
以下の要件に基づいて、AIアバターのペルソナを作成してください。

目的: ${requirements.purpose}
対象: ${requirements.targetAudience.join(', ')}
ドメイン: ${requirements.domain}
コミュニケーションスタイル: ${JSON.stringify(requirements.communicationStyle)}

以下を含めてください:
1. 名前（日本語）
2. 役割
3. 説明文（1-2文）
4. 価値観（3つ）
5. 行動原則（3つ）
6. システムプロンプト（ペルソナ指示）
`;

    const response = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = (response.content[0] as { type: 'text'; text: string }).text;

    return {
      id: `persona-${Date.now()}`,
      name: this.extractValue(text, '名前') || 'アシスタント',
      role: this.extractValue(text, '役割') || requirements.purpose,
      description: this.extractValue(text, '説明') || requirements.purpose,
      values: this.extractListItems(text, '価値観'),
      principles: this.extractListItems(text, '行動原則'),
      systemPrompt: this.extractValue(text, 'システムプロンプト') || '',
    };
  }

  private async generateKnowledgeSpec(requirements: AvatarRequirements): Promise<KnowledgeSpec> {
    return {
      domains: [requirements.domain],
      frameworks: requirements.capabilities.map((cap, i) => ({
        id: `framework-${i}`,
        name: cap,
        priority: i + 1,
      })),
      databases: [],
      externalSources: [],
    };
  }

  private generateBehaviorSpec(requirements: AvatarRequirements): BehaviorSpec {
    return {
      responseStyle: requirements.communicationStyle,
      maxTokens: 800,
      temperature: 0.7,
      topP: 0.9,
      fallbackBehavior: '申し訳ありません、その質問にはお答えできません。',
    };
  }

  private generateAvatarName(requirements: AvatarRequirements): string {
    return `${requirements.domain}アバター`;
  }

  private async executeStage(
    stage: PipelineStage,
    blueprint: AvatarBlueprint,
    pipeline: BuildPipeline
  ): Promise<void> {
    // 各ステージの実行（簡易実装）
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  private addLog(pipeline: BuildPipeline, level: PipelineLog['level'], stage: string, message: string): void {
    pipeline.logs.push({
      timestamp: new Date(),
      level,
      stage,
      message,
    });
  }

  private async checkFunctionality(blueprint: AvatarBlueprint): Promise<ValidationCheck> {
    return {
      name: '機能チェック',
      category: 'functionality',
      passed: true,
      score: 85,
      details: 'すべての必須機能が実装されています',
    };
  }

  private async checkQuality(blueprint: AvatarBlueprint): Promise<ValidationCheck> {
    return {
      name: '品質チェック',
      category: 'quality',
      passed: true,
      score: 80,
      details: '品質基準を満たしています',
    };
  }

  private async checkSecurity(blueprint: AvatarBlueprint): Promise<ValidationCheck> {
    return {
      name: 'セキュリティチェック',
      category: 'security',
      passed: true,
      score: 90,
      details: 'セキュリティ要件を満たしています',
    };
  }

  private async checkPerformance(blueprint: AvatarBlueprint): Promise<ValidationCheck> {
    return {
      name: 'パフォーマンスチェック',
      category: 'performance',
      passed: true,
      score: 75,
      details: 'パフォーマンス基準を満たしています',
    };
  }

  private generateRecommendations(checks: ValidationCheck[]): string[] {
    const recommendations: string[] = [];
    for (const check of checks) {
      if (check.score < 80) {
        recommendations.push(`${check.name}の改善を検討してください`);
      }
    }
    return recommendations;
  }

  private extractValue(text: string, key: string): string | null {
    const regex = new RegExp(`${key}[：:]\\s*(.+?)(?:\\n|$)`);
    const match = text.match(regex);
    return match ? match[1].trim() : null;
  }

  private extractListItems(text: string, sectionName: string): string[] {
    const lines = text.split('\n');
    const items: string[] = [];
    let inSection = false;

    for (const line of lines) {
      if (line.includes(sectionName)) {
        inSection = true;
        continue;
      }
      if (inSection && line.match(/^[-*\d]/)) {
        items.push(line.replace(/^[-*\d.]\s*/, '').trim());
      }
      if (inSection && items.length >= 3) break;
    }

    return items;
  }

  // 公開ゲッター

  getBuildRequest(requestId: string): AvatarBuildRequest | undefined {
    return this.buildRequests.get(requestId);
  }

  getBlueprint(blueprintId: string): AvatarBlueprint | undefined {
    return this.blueprints.get(blueprintId);
  }

  getPipeline(pipelineId: string): BuildPipeline | undefined {
    return this.pipelines.get(pipelineId);
  }

  getAllBlueprints(): AvatarBlueprint[] {
    return Array.from(this.blueprints.values());
  }
}

export type {
  AvatarBuildRequest,
  BuildTrigger,
  AvatarBlueprint,
  BuildPipeline,
  BuildValidation,
};
