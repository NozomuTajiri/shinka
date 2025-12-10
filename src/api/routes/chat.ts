/**
 * チャットAPIルート
 * メッセージ送受信とストリーミング対応
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientDatabase } from '@/database/client-db';
import { getAvatarDatabase } from '@/database/avatar-db';
import { getKnowledgeBase } from '@/database/knowledge-base';
import { ApiResponse, DialogSession, Message } from '@/database/types';
import Anthropic from '@anthropic-ai/sdk';

/**
 * POST /api/v1/chat - 新規チャットセッション作成
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { avatarId, clientId } = await request.json();

    if (!avatarId || !clientId) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'avatarId and clientId are required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const clientDb = getClientDatabase();
    const session = await clientDb.createSession(clientId, avatarId);

    const response: ApiResponse<{ sessionId: string }> = {
      success: true,
      data: { sessionId: session.id },
      metadata: {
        timestamp: new Date(),
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * GET /api/v1/chat/:sessionId - セッション取得
 */
export async function getSession(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  try {
    const clientDb = getClientDatabase();
    const session = await clientDb.getSession(params.sessionId);

    if (!session) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<DialogSession> = {
      success: true,
      data: session,
      metadata: {
        timestamp: new Date(),
        requestId: generateRequestId(),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * POST /api/v1/chat/:sessionId/stream - ストリーミングメッセージ送信
 */
export async function streamMessage(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
): Promise<NextResponse> {
  try {
    const { content } = await request.json();
    const sessionId = params.sessionId;

    if (!content || typeof content !== 'string') {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'content is required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const clientDb = getClientDatabase();
    const session = await clientDb.getSession(sessionId);

    if (!session) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Session not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    // ユーザーメッセージを保存
    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      role: 'user',
      content,
      timestamp: new Date(),
    };

    await clientDb.addMessage(sessionId, userMessage);

    // アバター情報取得
    const avatarDb = getAvatarDatabase();
    const avatar = await avatarDb.getAvatar(session.avatarId);

    if (!avatar) {
      throw new Error('Avatar not found');
    }

    // ナレッジベース検索
    const knowledgeBase = getKnowledgeBase();
    const searchResults = await knowledgeBase.search({
      text: content,
      limit: 3,
    });

    // コンテキスト構築
    const context = buildContext(session.messages, searchResults);

    // Claude API呼び出し（ストリーミング）
    const stream = await createStreamingResponse(
      avatar,
      content,
      context,
      sessionId,
      clientDb
    );

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Streaming error:', error);
    return handleError(error);
  }
}

/**
 * ストリーミングレスポンス生成
 */
async function createStreamingResponse(
  avatar: any,
  userMessage: string,
  context: string,
  sessionId: string,
  clientDb: any
): Promise<ReadableStream> {
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        // Anthropic SDK初期化
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          throw new Error('ANTHROPIC_API_KEY not configured');
        }

        const anthropic = new Anthropic({ apiKey });

        // メッセージ構築
        const messages = [
          {
            role: 'user' as const,
            content: `${context}\n\nユーザーからの質問: ${userMessage}`,
          },
        ];

        // ストリーミング開始
        const stream = await anthropic.messages.stream({
          model: avatar.modelConfig.model,
          max_tokens: avatar.modelConfig.maxTokens,
          temperature: avatar.modelConfig.temperature,
          system: avatar.systemPrompt,
          messages,
        });

        let fullContent = '';

        // ストリーミングデータ処理
        for await (const event of stream) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const chunk = event.delta.text;
            fullContent += chunk;

            // クライアントにチャンク送信
            const data = JSON.stringify({ content: chunk });
            controller.enqueue(encoder.encode(`data: ${data}\n\n`));
          }
        }

        // 完了メッセージ送信
        controller.enqueue(encoder.encode('data: [DONE]\n\n'));

        // アバターメッセージを保存
        const avatarMessage: Message = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          sessionId,
          role: 'avatar',
          content: fullContent,
          timestamp: new Date(),
          metadata: {
            confidence: 0.85, // TODO: 実際の信頼度計算
          },
        };

        await clientDb.addMessage(sessionId, avatarMessage);

        controller.close();
      } catch (error) {
        console.error('Streaming error:', error);

        const errorData = JSON.stringify({
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        controller.close();
      }
    },
  });
}

/**
 * コンテキスト構築
 */
function buildContext(
  messages: Message[],
  searchResults: any[]
): string {
  let context = '';

  // ナレッジベース情報
  if (searchResults.length > 0) {
    context += '【参考情報（付加価値経営®ナレッジベース）】\n\n';
    searchResults.forEach((result, index) => {
      context += `${index + 1}. ${result.entry.title}\n`;
      context += `${result.entry.content.substring(0, 500)}...\n\n`;
    });
  }

  // 対話履歴（直近5件）
  const recentMessages = messages.slice(-5);
  if (recentMessages.length > 0) {
    context += '【対話履歴】\n\n';
    recentMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'ユーザー' : 'アバター';
      context += `${role}: ${msg.content}\n\n`;
    });
  }

  return context;
}

/**
 * エラーハンドリング
 */
function handleError(error: unknown): NextResponse {
  console.error('Chat API Error:', error);

  const response: ApiResponse<never> = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      details: error,
    },
    metadata: {
      timestamp: new Date(),
      requestId: generateRequestId(),
    },
  };

  return NextResponse.json(response, { status: 500 });
}

/**
 * リクエストID生成
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
