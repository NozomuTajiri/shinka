/**
 * APIルート定義
 */

import type { RouteDefinition } from './types.js';

export const API_ROUTES: RouteDefinition[] = [
  // Health & Status
  {
    method: 'GET',
    path: '/health',
    handler: 'healthCheck',
    description: 'Health check endpoint',
  },
  {
    method: 'GET',
    path: '/status',
    handler: 'getSystemStatus',
    description: 'Get system status',
  },

  // Sessions
  {
    method: 'POST',
    path: '/sessions',
    handler: 'createSession',
    description: 'Create new client session',
  },
  {
    method: 'GET',
    path: '/sessions/:sessionId',
    handler: 'getSession',
    description: 'Get session details',
  },
  {
    method: 'POST',
    path: '/sessions/:sessionId/messages',
    handler: 'sendMessage',
    description: 'Send message to avatar',
  },
  {
    method: 'POST',
    path: '/sessions/:sessionId/complete',
    handler: 'completeSession',
    description: 'Complete session',
  },
  {
    method: 'POST',
    path: '/sessions/:sessionId/switch-avatar',
    handler: 'switchAvatar',
    description: 'Switch to different avatar',
  },

  // Avatars
  {
    method: 'GET',
    path: '/avatars',
    handler: 'listAvatars',
    description: 'List available avatars',
  },
  {
    method: 'GET',
    path: '/avatars/:avatarId',
    handler: 'getAvatar',
    description: 'Get avatar details',
  },
  {
    method: 'GET',
    path: '/avatars/recommend',
    handler: 'recommendAvatar',
    description: 'Get avatar recommendation',
  },

  // Reports
  {
    method: 'GET',
    path: '/reports',
    handler: 'listReports',
    description: 'List reports',
  },
  {
    method: 'POST',
    path: '/reports',
    handler: 'createReport',
    description: 'Create new report',
  },

  // Insights
  {
    method: 'GET',
    path: '/insights',
    handler: 'listInsights',
    description: 'List insights',
  },
  {
    method: 'GET',
    path: '/insights/recommended',
    handler: 'getRecommendedInsights',
    description: 'Get recommended insights',
  },
];

export function getRoutesByMethod(method: RouteDefinition['method']): RouteDefinition[] {
  return API_ROUTES.filter(r => r.method === method);
}

export function findRoute(method: string, path: string): RouteDefinition | undefined {
  return API_ROUTES.find(r => r.method === method && matchPath(r.path, path));
}

function matchPath(routePath: string, requestPath: string): boolean {
  const routeParts = routePath.split('/');
  const requestParts = requestPath.split('/');

  if (routeParts.length !== requestParts.length) return false;

  for (let i = 0; i < routeParts.length; i++) {
    if (routeParts[i].startsWith(':')) continue;
    if (routeParts[i] !== requestParts[i]) return false;
  }

  return true;
}
