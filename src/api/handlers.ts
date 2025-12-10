/**
 * APIハンドラー
 */

import type {
  ApiResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  GetSessionResponse,
  ListAvatarsResponse,
  AvatarInfo,
  SystemStatusResponse,
  HealthCheckResponse,
} from './types.js';

// Import managers (will be injected)
type SessionManagerType = {
  createSession: (clientId: string, options: unknown) => unknown;
  getSession: (sessionId: string) => unknown;
  addTurn: (sessionId: string, role: string, content: string, metadata?: unknown) => unknown;
  completeSession: (sessionId: string, score?: number) => unknown;
  switchAvatar: (sessionId: string, avatarId: string) => boolean;
  recommendAvatar: (profile?: unknown, context?: unknown) => unknown;
};

type SystemType = {
  getStatus: () => unknown;
  isInitialized: () => boolean;
};

let sessionManager: SessionManagerType | null = null;
let system: SystemType | null = null;

export function setSessionManager(manager: SessionManagerType): void {
  sessionManager = manager;
}

export function setSystem(sys: SystemType): void {
  system = sys;
}

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

function createResponse<T>(data: T, startTime: number): ApiResponse<T> {
  return {
    success: true,
    data,
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    },
  };
}

function createErrorResponse<T = never>(code: string, message: string, startTime: number): ApiResponse<T> {
  return {
    success: false,
    error: { code, message },
    meta: {
      requestId: generateRequestId(),
      timestamp: new Date().toISOString(),
      duration: Date.now() - startTime,
    },
  };
}

// Health & Status Handlers
export function healthCheck(): ApiResponse<HealthCheckResponse> {
  const startTime = Date.now();
  return createResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, startTime);
}

export function getSystemStatus(): ApiResponse<SystemStatusResponse> {
  const startTime = Date.now();

  if (!system) {
    return createErrorResponse('SYSTEM_NOT_INITIALIZED', 'System not initialized', startTime);
  }

  const status = system.getStatus() as {
    health: string;
    version: string;
    environment: string;
    startedAt: Date;
    components: Array<{ name: string; status: string; lastCheck: Date }>;
  };

  return createResponse({
    status: status.health as SystemStatusResponse['status'],
    version: status.version,
    environment: status.environment,
    uptime: Math.round((Date.now() - status.startedAt.getTime()) / 1000),
    components: status.components.map(c => ({
      name: c.name,
      status: c.status,
      lastCheck: c.lastCheck.toISOString(),
    })),
  }, startTime);
}

// Session Handlers
export function createSession(request: CreateSessionRequest): ApiResponse<CreateSessionResponse> {
  const startTime = Date.now();

  if (!sessionManager) {
    return createErrorResponse('MANAGER_NOT_INITIALIZED', 'Session manager not initialized', startTime);
  }

  try {
    const session = sessionManager.createSession(request.clientId, {
      avatarId: request.avatarId,
      context: request.context,
    }) as { metadata: { sessionId: string; assignedAvatarId: string; status: string } };

    return createResponse({
      sessionId: session.metadata.sessionId,
      avatarId: session.metadata.assignedAvatarId,
      status: session.metadata.status,
    }, startTime);
  } catch (error) {
    return createErrorResponse('SESSION_CREATE_FAILED', `Failed to create session: ${error}`, startTime);
  }
}

export function getSession(sessionId: string): ApiResponse<GetSessionResponse> {
  const startTime = Date.now();

  if (!sessionManager) {
    return createErrorResponse('MANAGER_NOT_INITIALIZED', 'Session manager not initialized', startTime);
  }

  const session = sessionManager.getSession(sessionId) as {
    metadata: {
      sessionId: string;
      clientId: string;
      assignedAvatarId: string;
      status: string;
      createdAt: Date;
      updatedAt: Date;
    };
    history: unknown[];
  } | undefined;

  if (!session) {
    return createErrorResponse('SESSION_NOT_FOUND', 'Session not found', startTime);
  }

  return createResponse({
    sessionId: session.metadata.sessionId,
    clientId: session.metadata.clientId,
    avatarId: session.metadata.assignedAvatarId,
    status: session.metadata.status,
    turnCount: session.history.length,
    createdAt: session.metadata.createdAt.toISOString(),
    updatedAt: session.metadata.updatedAt.toISOString(),
  }, startTime);
}

export async function sendMessage(
  sessionId: string,
  request: SendMessageRequest
): Promise<ApiResponse<SendMessageResponse>> {
  const startTime = Date.now();

  if (!sessionManager) {
    return createErrorResponse('MANAGER_NOT_INITIALIZED', 'Session manager not initialized', startTime);
  }

  const session = sessionManager.getSession(sessionId) as {
    metadata: { assignedAvatarId: string };
  } | undefined;

  if (!session) {
    return createErrorResponse('SESSION_NOT_FOUND', 'Session not found', startTime);
  }

  // Add client turn
  sessionManager.addTurn(sessionId, 'client', request.content);

  // Generate avatar response (simplified - in production, call actual avatar)
  const responseStartTime = Date.now();
  const avatarResponse = `[${session.metadata.assignedAvatarId}] ご質問ありがとうございます。「${request.content}」について、さらに詳しくお聞かせいただけますか？`;
  const responseTime = Date.now() - responseStartTime;

  // Add avatar turn
  const turn = sessionManager.addTurn(sessionId, 'avatar', avatarResponse, { responseTime }) as {
    id: string;
    avatarId: string;
  };

  return createResponse({
    turnId: turn.id,
    avatarId: turn.avatarId ?? session.metadata.assignedAvatarId,
    content: avatarResponse,
    responseTime,
  }, startTime);
}

export function completeSession(
  sessionId: string,
  satisfactionScore?: number
): ApiResponse<{ summary: unknown }> {
  const startTime = Date.now();

  if (!sessionManager) {
    return createErrorResponse('MANAGER_NOT_INITIALIZED', 'Session manager not initialized', startTime);
  }

  const summary = sessionManager.completeSession(sessionId, satisfactionScore);

  if (!summary) {
    return createErrorResponse('SESSION_COMPLETE_FAILED', 'Failed to complete session', startTime);
  }

  return createResponse({ summary }, startTime);
}

export function switchAvatar(sessionId: string, avatarId: string): ApiResponse<{ success: boolean }> {
  const startTime = Date.now();

  if (!sessionManager) {
    return createErrorResponse('MANAGER_NOT_INITIALIZED', 'Session manager not initialized', startTime);
  }

  const success = sessionManager.switchAvatar(sessionId, avatarId);

  if (!success) {
    return createErrorResponse('AVATAR_SWITCH_FAILED', 'Failed to switch avatar', startTime);
  }

  return createResponse({ success: true }, startTime);
}

// Avatar Handlers
export function listAvatars(): ApiResponse<ListAvatarsResponse> {
  const startTime = Date.now();

  const avatars: AvatarInfo[] = [
    {
      id: 'hiraku',
      name: 'HIRAKU',
      nameJa: 'ひらく',
      role: '初回相談コンサルタント',
      description: '企業診断と最適なアバターマッチングを行います',
      status: 'available',
    },
    {
      id: 'senryaku',
      name: 'SENRYAKU',
      nameJa: '戦略',
      role: 'CEOコンサルタント',
      description: '経営戦略と付加価値経営を支援します',
      status: 'available',
    },
    {
      id: 'eigyo',
      name: 'EIGYO',
      nameJa: '営業',
      role: '営業コンサルタント',
      description: '科学的営業プロセスで商談を支援します',
      status: 'available',
    },
    {
      id: 'shijo',
      name: 'SHIJO',
      nameJa: '市場',
      role: 'マーケティングコンサルタント',
      description: '市場分析とマーケティング戦略を支援します',
      status: 'available',
    },
    {
      id: 'kanri',
      name: 'KANRI',
      nameJa: '管理',
      role: 'マネジメントコンサルタント',
      description: 'チームマネジメントと組織開発を支援します',
      status: 'available',
    },
  ];

  return createResponse({ avatars }, startTime);
}

export function getAvatar(avatarId: string): ApiResponse<AvatarInfo> {
  const startTime = Date.now();
  const response = listAvatars();

  if (!response.success || !response.data) {
    return createErrorResponse('AVATARS_NOT_FOUND', 'Avatars not found', startTime);
  }

  const avatar = response.data.avatars.find(a => a.id === avatarId);

  if (!avatar) {
    return createErrorResponse('AVATAR_NOT_FOUND', `Avatar ${avatarId} not found`, startTime);
  }

  return createResponse(avatar, startTime);
}

export function recommendAvatar(
  challenges?: string[]
): ApiResponse<{ recommendation: unknown }> {
  const startTime = Date.now();

  if (!sessionManager) {
    return createErrorResponse('MANAGER_NOT_INITIALIZED', 'Session manager not initialized', startTime);
  }

  const recommendation = sessionManager.recommendAvatar(
    challenges ? { challenges } : undefined
  );

  return createResponse({ recommendation }, startTime);
}
