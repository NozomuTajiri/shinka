/**
 * チャットAPI - ストリーミング送信
 * POST /api/v1/chat/:sessionId/stream
 */

import { NextRequest } from 'next/server';
import { streamMessage } from '@/api/routes/chat';

export async function POST(
  request: NextRequest,
  context: { params: { sessionId: string } }
) {
  return streamMessage(request, context);
}
