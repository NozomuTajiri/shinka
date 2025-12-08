/**
 * クライアント管理API - 詳細・更新
 * GET /api/v1/clients/:id
 * PATCH /api/v1/clients/:id
 */

import { NextRequest } from 'next/server';
import { getClient, updateClient } from '@/api/routes/clients';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return getClient(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return updateClient(request, context);
}
