/**
 * Claude API クライアント
 * ストリーミング対応、リトライ、レート制限機能を実装
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages.js';

/**
 * Claude クライアント設定
 */
export interface ClaudeClientConfig {
  /** Anthropic API Key */
  apiKey: string;
  /** 使用するモデル（デフォルト: claude-sonnet-4-20250514） */
  model?: string;
  /** 最大トークン数（デフォルト: 8000） */
  maxTokens?: number;
  /** リトライ回数（デフォルト: 3） */
  maxRetries?: number;
  /** リトライ間隔（ミリ秒、デフォルト: 1000） */
  retryDelay?: number;
  /** タイムアウト（ミリ秒、デフォルト: 120000 = 2分） */
  timeout?: number;
}

/**
 * ストリーミングメッセージオプション
 */
export interface StreamMessageOptions {
  /** システムプロンプト */
  systemPrompt: string;
  /** ユーザープロンプト */
  userPrompt: string;
  /** 温度パラメータ（0.0-1.0、デフォルト: 0.7） */
  temperature?: number;
  /** Top-p サンプリング（デフォルト: 0.9） */
  topP?: number;
}

/**
 * Claude クライアントのレスポンス
 */
export interface ClaudeResponse {
  /** 生成されたテキスト */
  content: string;
  /** 使用した入力トークン数 */
  inputTokens: number;
  /** 使用した出力トークン数 */
  outputTokens: number;
  /** リクエスト時刻 */
  requestTime: Date;
  /** レスポンス時刻 */
  responseTime: Date;
}

/**
 * レート制限エラー
 */
export class RateLimitError extends Error {
  constructor(
    message: string,
    public retryAfter?: number
  ) {
    super(message);
    this.name = 'RateLimitError';
  }
}

/**
 * Claude API クライアント
 */
export class ClaudeClient {
  private client: Anthropic;
  private config: Required<ClaudeClientConfig>;
  private requestCount = 0;
  private lastRequestTime = 0;

  constructor(config: ClaudeClientConfig) {
    this.config = {
      apiKey: config.apiKey,
      model: config.model || 'claude-sonnet-4-20250514',
      maxTokens: config.maxTokens || 8000,
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      timeout: config.timeout || 120000,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
      timeout: this.config.timeout,
    });
  }

  /**
   * レート制限チェック（簡易的な実装）
   * 実際の運用では、より高度なレート制限管理が必要
   */
  private async checkRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    // 最小リクエスト間隔: 100ms
    const MIN_REQUEST_INTERVAL = 100;

    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
      await this.sleep(MIN_REQUEST_INTERVAL - timeSinceLastRequest);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * 指定時間スリープ
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * エクスポネンシャルバックオフでリトライ
   */
  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    attempt = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (attempt >= this.config.maxRetries) {
        throw error;
      }

      // レート制限エラーの場合
      if (this.isRateLimitError(error)) {
        const rateLimitError = error as RateLimitError;
        const retryAfter = rateLimitError.retryAfter || this.config.retryDelay;
        console.warn(
          `Rate limit reached. Retrying after ${retryAfter}ms (attempt ${attempt + 1}/${this.config.maxRetries})`
        );
        await this.sleep(retryAfter);
        return this.retryWithBackoff(operation, attempt + 1);
      }

      // その他のエラーの場合はエクスポネンシャルバックオフ
      const delay = this.config.retryDelay * Math.pow(2, attempt);
      console.warn(
        `Request failed. Retrying after ${delay}ms (attempt ${attempt + 1}/${this.config.maxRetries})`
      );
      console.error(error);

      await this.sleep(delay);
      return this.retryWithBackoff(operation, attempt + 1);
    }
  }

  /**
   * レート制限エラーかどうかを判定
   */
  private isRateLimitError(error: unknown): boolean {
    if (error instanceof RateLimitError) {
      return true;
    }

    // Anthropic SDK のエラーチェック
    if (
      error &&
      typeof error === 'object' &&
      'status' in error &&
      error.status === 429
    ) {
      return true;
    }

    return false;
  }

  /**
   * 非ストリーミングでメッセージを送信
   */
  async sendMessage(options: StreamMessageOptions): Promise<ClaudeResponse> {
    await this.checkRateLimit();

    const requestTime = new Date();

    const response = await this.retryWithBackoff(async () => {
      const message = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        system: options.systemPrompt,
        messages: [
          {
            role: 'user',
            content: options.userPrompt,
          },
        ],
      });

      return message;
    });

    const responseTime = new Date();

    // レスポンスからテキストを抽出
    let content = '';
    if (response.content && response.content.length > 0) {
      const firstContent = response.content[0];
      if (firstContent.type === 'text') {
        content = firstContent.text;
      }
    }

    return {
      content,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      requestTime,
      responseTime,
    };
  }

  /**
   * ストリーミングでメッセージを送信
   * AsyncGenerator を使用してリアルタイムでテキストチャンクを返す
   */
  async *streamMessage(
    options: StreamMessageOptions
  ): AsyncGenerator<string, ClaudeResponse, undefined> {
    await this.checkRateLimit();

    const requestTime = new Date();
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const stream = await this.retryWithBackoff(async () => {
      return this.client.messages.stream({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: options.temperature || 0.7,
        top_p: options.topP || 0.9,
        system: options.systemPrompt,
        messages: [
          {
            role: 'user',
            content: options.userPrompt,
          },
        ],
      });
    });

    try {
      // ストリームからイベントを処理
      for await (const event of stream) {
        // テキストデルタを処理
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          const chunk = event.delta.text;
          fullContent += chunk;
          yield chunk;
        }

        // メッセージ完了時にトークン使用量を取得
        if (event.type === 'message_stop') {
          const finalMessage = await stream.finalMessage();
          inputTokens = finalMessage.usage.input_tokens;
          outputTokens = finalMessage.usage.output_tokens;
        }
      }
    } catch (error) {
      console.error('Streaming error:', error);
      throw error;
    }

    const responseTime = new Date();

    return {
      content: fullContent,
      inputTokens,
      outputTokens,
      requestTime,
      responseTime,
    };
  }

  /**
   * Server-Sent Events (SSE) 形式でストリーミング
   * Web APIやWebSocketで使用する場合に便利
   */
  async *streamAsSSE(
    options: StreamMessageOptions
  ): AsyncGenerator<string, void, undefined> {
    const requestTime = new Date();
    let inputTokens = 0;
    let outputTokens = 0;

    // 開始イベント
    yield this.formatSSE('start', {
      timestamp: requestTime.toISOString(),
      model: this.config.model,
    });

    try {
      // ストリーミング生成
      const generator = this.streamMessage(options);
      let lastValue: ClaudeResponse | undefined;

      for await (const chunk of generator) {
        // コンテンツチャンク
        yield this.formatSSE('content', { chunk });
      }

      // 最終レスポンスを取得（戻り値）
      const finalResponse = await generator.next();
      if (finalResponse.done && finalResponse.value) {
        lastValue = finalResponse.value as ClaudeResponse;
        inputTokens = lastValue.inputTokens;
        outputTokens = lastValue.outputTokens;
      }

      // 完了イベント
      yield this.formatSSE('complete', {
        inputTokens,
        outputTokens,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      // エラーイベント
      yield this.formatSSE('error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  /**
   * SSE フォーマットでデータを整形
   */
  private formatSSE(event: string, data: unknown): string {
    return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  }

  /**
   * 統計情報を取得
   */
  getStats(): {
    requestCount: number;
    lastRequestTime: number;
    model: string;
  } {
    return {
      requestCount: this.requestCount,
      lastRequestTime: this.lastRequestTime,
      model: this.config.model,
    };
  }
}
