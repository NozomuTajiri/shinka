/**
 * API型定義
 */

export interface ApiRequest<T = unknown> {
  body: T;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: Record<string, string>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  duration: number;
}

// Session API Types
export interface CreateSessionRequest {
  clientId: string;
  avatarId?: string;
  context?: {
    objectives?: string[];
    constraints?: string[];
  };
}

export interface CreateSessionResponse {
  sessionId: string;
  avatarId: string;
  status: string;
}

export interface SendMessageRequest {
  content: string;
}

export interface SendMessageResponse {
  turnId: string;
  avatarId: string;
  content: string;
  responseTime: number;
}

export interface GetSessionResponse {
  sessionId: string;
  clientId: string;
  avatarId: string;
  status: string;
  turnCount: number;
  createdAt: string;
  updatedAt: string;
}

// Avatar API Types
export interface ListAvatarsResponse {
  avatars: AvatarInfo[];
}

export interface AvatarInfo {
  id: string;
  name: string;
  nameJa: string;
  role: string;
  description: string;
  status: 'available' | 'busy' | 'offline';
}

// System API Types
export interface SystemStatusResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  environment: string;
  uptime: number;
  components: ComponentInfo[];
}

export interface ComponentInfo {
  name: string;
  status: string;
  lastCheck: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

// Route Definition
export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  handler: string;
  middleware?: string[];
  description?: string;
}
