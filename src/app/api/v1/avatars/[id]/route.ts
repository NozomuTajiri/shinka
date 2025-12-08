/**
 * アバター管理API - 詳細・更新・削除
 * GET /api/v1/avatars/:id
 * PATCH /api/v1/avatars/:id
 * DELETE /api/v1/avatars/:id
 */

import { NextRequest } from 'next/server';
import {
  getAvatarById,
  updateAvatar,
  deleteAvatar,
} from '@/api/routes/avatars';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return getAvatarById(request, context);
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return updateAvatar(request, context);
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  return deleteAvatar(request, context);
}
