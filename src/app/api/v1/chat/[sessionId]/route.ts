/**
 * チャットAPI - セッション取得
 * GET /api/v1/chat/:sessionId
 */

import { NextRequest } from 'next/server';
import { getSession } from '@/api/routes/chat';

export async function GET(
  request: NextRequest,
  context: { params: { sessionId: string } }
) {
  return getSession(request, context);
}
