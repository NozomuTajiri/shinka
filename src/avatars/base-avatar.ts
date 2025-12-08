/**
 * Base Avatar Class
 *
 * すべてのアバターの基底クラス
 * Claude API連携、対話管理、履歴管理を提供
 */

import Anthropic from '@anthropic-ai/sdk';
import type {
  BaseAvatarConfig,
  AvatarSession,
  AvatarMessage,
  AvatarStatus,
  StreamChunk,
  MessageParam,
} from './types.js';

/**
 * 基底アバタークラス
 *
 * すべてのアバター（CEO、専門家）の共通機能を提供
 */
export abstract class BaseAvatar {
  /** アバター設定 */
  protected config: BaseAvatarConfig;

  /** Anthropic クライアント */
  protected client: Anthropic;

  /** 現在のステータス */
  protected status: AvatarStatus = 'idle';

  /** アクティブなセッション */
  protected activeSession: AvatarSession | null = null;

  /** セッション履歴（メモリ内保持） */
  protected sessionHistory: Map<string, AvatarSession> = new Map();

  /**
   * コンストラクター
   *
   * @param config - アバター設定
   */
  constructor(config: BaseAvatarConfig) {
    this.config = {
      model: 'claude-sonnet-4-20250514',
      maxTokens: 8000,
      temperature: 0.7,
      ...config,
    };

    this.client = new Anthropic({
      apiKey: this.config.apiKey,
    });
  }

  /**
   * セッション開始
   *
   * @param clientId - クライアントID
   * @returns セッション情報
   */
  public startSession(clientId: string): AvatarSession {
    const session: AvatarSession = {
      id: this.generateSessionId(),
      clientId,
      startedAt: new Date(),
      updatedAt: new Date(),
      messages: [],
      context: {},
    };

    this.activeSession = session;
    this.sessionHistory.set(session.id, session);
    this.status = 'idle';

    this.log(`セッション開始: ${session.id} (クライアント: ${clientId})`);

    return session;
  }

  /**
   * セッション終了
   *
   * @param sessionId - セッションID
   */
  public endSession(sessionId: string): void {
    const session = this.sessionHistory.get(sessionId);
    if (!session) {
      throw new Error(`セッションが見つかりません: ${sessionId}`);
    }

    if (this.activeSession?.id === sessionId) {
      this.activeSession = null;
    }

    this.status = 'idle';
    this.log(`セッション終了: ${sessionId}`);
  }

  /**
   * メッセージ送信（ストリーミング対応）
   *
   * @param userMessage - ユーザーメッセージ
   * @param onChunk - ストリーミングチャンクコールバック
   * @returns アシスタントの応答
   */
  public async sendMessage(
    userMessage: string,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    if (!this.activeSession) {
      throw new Error('アクティブなセッションがありません。startSession() を先に呼び出してください。');
    }

    // ユーザーメッセージを履歴に追加
    const userMsg: AvatarMessage = {
      id: this.generateMessageId(),
      timestamp: new Date(),
      role: 'user',
      content: userMessage,
    };

    this.activeSession.messages.push(userMsg);
    this.activeSession.updatedAt = new Date();
    this.status = 'thinking';

    try {
      // Claude APIに送信
      const response = await this.callClaudeAPI(userMessage, onChunk);

      // アシスタント応答を履歴に追加
      const assistantMsg: AvatarMessage = {
        id: this.generateMessageId(),
        timestamp: new Date(),
        role: 'assistant',
        content: response,
      };

      this.activeSession.messages.push(assistantMsg);
      this.activeSession.updatedAt = new Date();
      this.status = 'idle';

      return response;
    } catch (error) {
      this.status = 'idle';
      this.logError('メッセージ送信エラー', error);
      throw error;
    }
  }

  /**
   * Claude API呼び出し（ストリーミング対応）
   *
   * @param userMessage - ユーザーメッセージ
   * @param onChunk - ストリーミングチャンクコールバック
   * @returns Claude応答
   */
  protected async callClaudeAPI(
    userMessage: string,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    const messages = this.buildMessageHistory(userMessage);
    const systemPrompt = this.buildSystemPrompt();

    if (onChunk) {
      // ストリーミングモード
      return this.streamResponse(systemPrompt, messages, onChunk);
    } else {
      // 通常モード
      return this.regularResponse(systemPrompt, messages);
    }
  }

  /**
   * 通常応答（非ストリーミング）
   *
   * @param systemPrompt - システムプロンプト
   * @param messages - メッセージ履歴
   * @returns 応答テキスト
   */
  protected async regularResponse(
    systemPrompt: string,
    messages: MessageParam[]
  ): Promise<string> {
    const response = await this.client.messages.create({
      model: this.config.model!,
      max_tokens: this.config.maxTokens!,
      temperature: this.config.temperature,
      system: systemPrompt,
      messages,
    });

    const content = response.content[0];
    if (content.type === 'text') {
      return content.text;
    }

    throw new Error('予期しない応答形式です');
  }

  /**
   * ストリーミング応答
   *
   * @param systemPrompt - システムプロンプト
   * @param messages - メッセージ履歴
   * @param onChunk - チャンクコールバック
   * @returns 完全な応答テキスト
   */
  protected async streamResponse(
    systemPrompt: string,
    messages: MessageParam[],
    onChunk: (chunk: StreamChunk) => void
  ): Promise<string> {
    let fullResponse = '';

    try {
      const stream = await this.client.messages.stream({
        model: this.config.model!,
        max_tokens: this.config.maxTokens!,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages,
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk: StreamChunk = {
            type: 'content',
            content: event.delta.text,
          };
          onChunk(chunk);
          fullResponse += event.delta.text;
        }
      }

      onChunk({ type: 'complete' });
      return fullResponse;
    } catch (error) {
      onChunk({
        type: 'error',
        error: error as Error,
      });
      throw error;
    }
  }

  /**
   * メッセージ履歴構築
   *
   * @param currentMessage - 現在のメッセージ
   * @returns Claude API用メッセージ配列
   */
  protected buildMessageHistory(currentMessage: string): MessageParam[] {
    const messages: MessageParam[] = [];

    // 過去のメッセージを追加（直近10件程度）
    if (this.activeSession) {
      const recentMessages = this.activeSession.messages.slice(-10);
      for (const msg of recentMessages) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // 現在のメッセージを追加
    messages.push({
      role: 'user',
      content: currentMessage,
    });

    return messages;
  }

  /**
   * システムプロンプト構築（サブクラスでオーバーライド）
   *
   * @returns システムプロンプト
   */
  protected abstract buildSystemPrompt(): string;

  /**
   * セッション取得
   *
   * @param sessionId - セッションID
   * @returns セッション情報
   */
  public getSession(sessionId: string): AvatarSession | undefined {
    return this.sessionHistory.get(sessionId);
  }

  /**
   * 現在のステータス取得
   *
   * @returns 現在のステータス
   */
  public getStatus(): AvatarStatus {
    return this.status;
  }

  /**
   * セッションID生成
   *
   * @returns ユニークなセッションID
   */
  protected generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * メッセージID生成
   *
   * @returns ユニークなメッセージID
   */
  protected generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }

  /**
   * ログ出力
   *
   * @param message - ログメッセージ
   */
  protected log(message: string): void {
    console.log(`[${this.config.displayName}] ${message}`);
  }

  /**
   * エラーログ出力
   *
   * @param message - エラーメッセージ
   * @param error - エラーオブジェクト
   */
  protected logError(message: string, error: unknown): void {
    console.error(`[${this.config.displayName}] エラー: ${message}`, error);
  }
}
