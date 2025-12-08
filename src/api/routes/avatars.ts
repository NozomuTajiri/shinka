/**
 * アバター管理APIルート
 * アバターの取得、作成、更新
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAvatarDatabase } from '@/database/avatar-db';
import { ApiResponse, Avatar } from '@/database/types';

/**
 * GET /api/v1/avatars - アバター一覧取得
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') !== 'false';

    const avatarDb = getAvatarDatabase();
    const avatars = await avatarDb.getAllAvatars(activeOnly);

    const response: ApiResponse<Avatar[]> = {
      success: true,
      data: avatars,
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
 * POST /api/v1/avatars - アバター作成
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const avatarDb = getAvatarDatabase();
    const avatar = await avatarDb.createAvatar(body);

    const response: ApiResponse<Avatar> = {
      success: true,
      data: avatar,
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
 * GET /api/v1/avatars/:id - アバター詳細取得
 */
export async function getAvatarById(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const avatarDb = getAvatarDatabase();
    const avatar = await avatarDb.getAvatar(params.id);

    if (!avatar) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Avatar not found',
        },
        metadata: {
          timestamp: new Date(),
          requestId: generateRequestId(),
        },
      };

      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<Avatar> = {
      success: true,
      data: avatar,
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
 * PATCH /api/v1/avatars/:id - アバター更新
 */
export async function updateAvatar(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const body = await request.json();

    const avatarDb = getAvatarDatabase();
    const avatar = await avatarDb.updateAvatar(params.id, body);

    const response: ApiResponse<Avatar> = {
      success: true,
      data: avatar,
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
 * DELETE /api/v1/avatars/:id - アバター無効化
 */
export async function deleteAvatar(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const avatarDb = getAvatarDatabase();
    await avatarDb.deactivateAvatar(params.id);

    const response: ApiResponse<{ success: boolean }> = {
      success: true,
      data: { success: true },
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
 * GET /api/v1/avatars/stats - アバター統計情報取得
 */
export async function getAvatarStats(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const avatarDb = getAvatarDatabase();
    const stats = await avatarDb.getStats();

    const response: ApiResponse<typeof stats> = {
      success: true,
      data: stats,
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
 * エラーハンドリング
 */
function handleError(error: unknown): NextResponse {
  console.error('Avatar API Error:', error);

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
