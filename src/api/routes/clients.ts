/**
 * クライアント管理APIルート
 * クライアント企業の登録と情報管理
 */

import { NextRequest, NextResponse } from 'next/server';
import { getClientDatabase } from '@/database/client-db';
import {
  ApiResponse,
  ClientProfile,
  Challenge,
  DialogSession,
} from '@/database/types';

/**
 * POST /api/v1/clients - クライアント登録
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    const { companyName, industry, size } = body;

    if (!companyName || !industry || !size) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'INVALID_REQUEST',
          message: 'companyName, industry, and size are required',
        },
      };
      return NextResponse.json(response, { status: 400 });
    }

    const clientDb = getClientDatabase();
    const client = await clientDb.createClient({
      companyName,
      industry,
      size,
      challenges: [],
      dialogHistory: [],
    });

    const response: ApiResponse<ClientProfile> = {
      success: true,
      data: client,
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
 * GET /api/v1/clients/:id - クライアント詳細取得
 */
export async function getClient(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const clientDb = getClientDatabase();
    const client = await clientDb.getClient(params.id);

    if (!client) {
      const response: ApiResponse<never> = {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Client not found',
        },
      };
      return NextResponse.json(response, { status: 404 });
    }

    const response: ApiResponse<ClientProfile> = {
      success: true,
      data: client,
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
 * GET /api/v1/clients - クライアント一覧取得
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const size = searchParams.get('size');

    const clientDb = getClientDatabase();

    let clients: ClientProfile[];

    if (industry) {
      clients = await clientDb.getClientsByIndustry(industry);
    } else if (size) {
      clients = await clientDb.getClientsBySize(size as any);
    } else {
      clients = await clientDb.getAllClients();
    }

    const response: ApiResponse<ClientProfile[]> = {
      success: true,
      data: clients,
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
 * PATCH /api/v1/clients/:id - クライアント情報更新
 */
export async function updateClient(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const body = await request.json();

    const clientDb = getClientDatabase();
    const client = await clientDb.updateClient(params.id, body);

    const response: ApiResponse<ClientProfile> = {
      success: true,
      data: client,
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
 * POST /api/v1/clients/:id/challenges - 課題追加
 */
export async function addChallenge(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const body = await request.json();

    const challenge: Challenge = {
      id: `challenge-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...body,
      identifiedAt: new Date(),
    };

    const clientDb = getClientDatabase();
    await clientDb.addChallenge(params.id, challenge);

    const response: ApiResponse<Challenge> = {
      success: true,
      data: challenge,
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
 * GET /api/v1/clients/:id/challenges - クライアントの課題一覧取得
 */
export async function getClientChallenges(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const status = searchParams.get('status');

    const filters: any = {};
    if (category) filters.category = category;
    if (status) filters.status = status;

    const clientDb = getClientDatabase();
    const challenges = await clientDb.getClientChallenges(params.id, filters);

    const response: ApiResponse<Challenge[]> = {
      success: true,
      data: challenges,
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
 * GET /api/v1/clients/:id/sessions - クライアントのセッション一覧取得
 */
export async function getClientSessions(
  request: NextRequest,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const clientDb = getClientDatabase();
    const sessions = await clientDb.getClientSessions(
      params.id,
      status as any
    );

    const response: ApiResponse<DialogSession[]> = {
      success: true,
      data: sessions,
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
 * GET /api/v1/clients/stats - クライアント統計情報取得
 */
export async function getClientStats(
  request: NextRequest
): Promise<NextResponse> {
  try {
    const clientDb = getClientDatabase();
    const stats = await clientDb.getStats();

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
  console.error('Client API Error:', error);

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
