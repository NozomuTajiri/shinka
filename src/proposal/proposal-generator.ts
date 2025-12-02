/**
 * コンサルティング提案生成パイプライン
 * ストリーミング、AsyncGenerator を使用したリアルタイム生成
 */

import { ClaudeClient } from './claude-client.js';
import { getSystemPrompt, buildProposalPrompt, getRetryPrompt } from './prompt-templates.js';
import type {
  ConsultingProposal,
  ProposalGenerationRequest,
  ProposalGenerationResult,
  StreamingEvent,
  ClaudeMetadata,
} from '../types/proposal.js';

/**
 * 提案生成器の設定
 */
export interface ProposalGeneratorConfig {
  /** Anthropic API Key */
  apiKey: string;
  /** 使用するモデル（デフォルト: claude-sonnet-4-20250514） */
  model?: string;
  /** 最大トークン数（デフォルト: 8000） */
  maxTokens?: number;
  /** 詳細ログを出力するか */
  verbose?: boolean;
}

/**
 * 提案生成パイプライン
 */
export class ProposalGenerator {
  private claudeClient: ClaudeClient;
  private config: ProposalGeneratorConfig;
  private logs: string[] = [];

  constructor(config: ProposalGeneratorConfig) {
    this.config = config;
    this.claudeClient = new ClaudeClient({
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 8000,
    });
  }

  /**
   * ログを記録
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.logs.push(logMessage);

    if (this.config.verbose) {
      console.log(logMessage);
    }
  }

  /**
   * 提案書を生成（非ストリーミング）
   */
  async generate(
    request: ProposalGenerationRequest
  ): Promise<ProposalGenerationResult> {
    this.log('提案書生成を開始');
    this.log(`クライアント: ${request.clientName}`);
    this.log(`業界: ${request.industry}`);

    const systemPrompt = getSystemPrompt();
    const userPrompt = buildProposalPrompt(request);

    this.log('Claude API にリクエスト送信中...');

    const response = await this.claudeClient.sendMessage({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      topP: 0.9,
    });

    this.log(`レスポンス受信: ${response.content.length} 文字`);
    this.log(`入力トークン: ${response.inputTokens}`);
    this.log(`出力トークン: ${response.outputTokens}`);

    // JSONをパース
    const proposal = this.parseProposal(response.content);

    const metadata: ClaudeMetadata = {
      model: this.claudeClient.getStats().model,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      requestTime: response.requestTime,
      responseTime: response.responseTime,
      durationMs:
        response.responseTime.getTime() - response.requestTime.getTime(),
    };

    this.log('提案書生成完了');

    return {
      proposal,
      metadata,
      logs: [...this.logs],
    };
  }

  /**
   * 提案書をストリーミング生成
   * リアルタイムで進捗を返す AsyncGenerator
   */
  async *generateStreaming(
    request: ProposalGenerationRequest
  ): AsyncGenerator<StreamingEvent, ProposalGenerationResult, undefined> {
    this.log('ストリーミング提案書生成を開始');

    // 開始イベント
    yield {
      type: 'start',
      timestamp: new Date(),
      progress: 0,
    };

    const systemPrompt = getSystemPrompt();
    const userPrompt = buildProposalPrompt(request);

    this.log('Claude API ストリーミングリクエスト送信中...');

    let fullContent = '';
    let lastProgress = 0;

    try {
      // ストリーミング生成
      const generator = this.claudeClient.streamMessage({
        systemPrompt,
        userPrompt,
        temperature: 0.7,
        topP: 0.9,
      });

      for await (const chunk of generator) {
        fullContent += chunk;

        // 進捗を推定（JSONの閉じ括弧の数などから推定）
        const progress = this.estimateProgress(fullContent);

        // 進捗が変化した場合のみイベントを送信
        if (progress > lastProgress) {
          yield {
            type: 'progress',
            content: chunk,
            progress,
            timestamp: new Date(),
          };
          lastProgress = progress;
        }
      }

      // 最終レスポンスを取得
      const finalResponse = await generator.next();
      if (!finalResponse.done || !finalResponse.value) {
        throw new Error('ストリーミング生成が正常に完了しませんでした');
      }

      const claudeResponse = finalResponse.value;

      this.log(`ストリーミング完了: ${fullContent.length} 文字`);
      this.log(`入力トークン: ${claudeResponse.inputTokens}`);
      this.log(`出力トークン: ${claudeResponse.outputTokens}`);

      // JSONをパース
      const proposal = this.parseProposal(fullContent);

      const metadata: ClaudeMetadata = {
        model: this.claudeClient.getStats().model,
        inputTokens: claudeResponse.inputTokens,
        outputTokens: claudeResponse.outputTokens,
        requestTime: claudeResponse.requestTime,
        responseTime: claudeResponse.responseTime,
        durationMs:
          claudeResponse.responseTime.getTime() -
          claudeResponse.requestTime.getTime(),
      };

      // 完了イベント
      yield {
        type: 'complete',
        proposal,
        progress: 100,
        timestamp: new Date(),
      };

      this.log('ストリーミング提案書生成完了');

      return {
        proposal,
        metadata,
        logs: [...this.logs],
      };
    } catch (error) {
      this.log(`エラー発生: ${error instanceof Error ? error.message : 'Unknown error'}`);

      // エラーイベント
      yield {
        type: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        progress: lastProgress,
        timestamp: new Date(),
      };

      throw error;
    }
  }

  /**
   * Server-Sent Events 形式でストリーミング生成
   */
  async *generateSSE(
    request: ProposalGenerationRequest
  ): AsyncGenerator<string, void, undefined> {
    const systemPrompt = getSystemPrompt();
    const userPrompt = buildProposalPrompt(request);

    // SSE形式でストリーミング
    const sseGenerator = this.claudeClient.streamAsSSE({
      systemPrompt,
      userPrompt,
      temperature: 0.7,
      topP: 0.9,
    });

    for await (const sseEvent of sseGenerator) {
      yield sseEvent;
    }
  }

  /**
   * JSON レスポンスをパース
   */
  private parseProposal(content: string): ConsultingProposal {
    try {
      // Markdown コードブロックを除去
      let jsonContent = content.trim();

      // ```json ... ``` を除去
      const jsonMatch = jsonContent.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonContent = jsonMatch[1];
      }

      // JSONをパース
      const parsed = JSON.parse(jsonContent);

      // 基本的なバリデーション
      this.validateProposal(parsed);

      // 日付を Date オブジェクトに変換
      if (typeof parsed.createdAt === 'string') {
        parsed.createdAt = new Date(parsed.createdAt);
      }

      return parsed as ConsultingProposal;
    } catch (error) {
      this.log(`JSONパースエラー: ${error instanceof Error ? error.message : 'Unknown error'}`);
      this.log(`受信したコンテンツ: ${content.substring(0, 500)}...`);
      throw new Error(
        `提案書のパースに失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * 提案書の基本的なバリデーション
   */
  private validateProposal(proposal: unknown): void {
    if (!proposal || typeof proposal !== 'object') {
      throw new Error('提案書が無効です: オブジェクトではありません');
    }

    const p = proposal as Record<string, unknown>;

    const requiredFields = [
      'id',
      'title',
      'clientName',
      'executiveSummary',
      'currentState',
      'issues',
      'measures',
      'implementationPlan',
      'expectedEffects',
      'investmentPlan',
    ];

    for (const field of requiredFields) {
      if (!(field in p)) {
        throw new Error(`提案書が無効です: ${field} フィールドが見つかりません`);
      }
    }

    // 配列のバリデーション
    if (!Array.isArray(p.issues) || p.issues.length === 0) {
      throw new Error('提案書が無効です: issues は1つ以上の要素を持つ配列である必要があります');
    }

    if (!Array.isArray(p.measures) || p.measures.length === 0) {
      throw new Error('提案書が無効です: measures は1つ以上の要素を持つ配列である必要があります');
    }
  }

  /**
   * 生成進捗を推定
   * JSONの構造から完成度を推定（簡易実装）
   */
  private estimateProgress(content: string): number {
    // JSONが完全に閉じているかチェック
    const openBraces = (content.match(/{/g) || []).length;
    const closeBraces = (content.match(/}/g) || []).length;
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/]/g) || []).length;

    // 主要セクションの存在をチェック
    const sections = [
      'executiveSummary',
      'currentState',
      'issues',
      'measures',
      'implementationPlan',
      'expectedEffects',
      'investmentPlan',
    ];

    let completedSections = 0;
    for (const section of sections) {
      if (content.includes(`"${section}"`)) {
        completedSections++;
      }
    }

    // 進捗率を計算
    const structureProgress = Math.min(
      ((closeBraces + closeBrackets) / (openBraces + openBrackets)) * 100,
      100
    );
    const sectionProgress = (completedSections / sections.length) * 100;

    // 2つの指標の平均
    return Math.floor((structureProgress + sectionProgress) / 2);
  }

  /**
   * ログを取得
   */
  getLogs(): string[] {
    return [...this.logs];
  }

  /**
   * ログをクリア
   */
  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * 提案生成器のファクトリー関数
 */
export function createProposalGenerator(
  config: ProposalGeneratorConfig
): ProposalGenerator {
  return new ProposalGenerator(config);
}
