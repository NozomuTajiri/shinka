# API Layer Documentation

## Overview

The API layer provides a lightweight HTTP server implementation for the Shinka project. It includes type-safe request/response handling, routing, and integration with the session management system.

## Architecture

```
api/
├── types.ts          # TypeScript type definitions
├── routes.ts         # Route definitions and matching
├── handlers.ts       # Request handlers
├── server.ts         # HTTP server implementation
└── index-new.ts      # Module exports
```

## Core Components

### 1. Types (`types.ts`)

Defines all API request/response types:

- `ApiRequest<T>` - Generic request structure
- `ApiResponse<T>` - Generic response structure
- `ApiError` - Error response format
- `ResponseMeta` - Request metadata (ID, timestamp, duration)
- Session API types (CreateSession, SendMessage, etc.)
- Avatar API types (ListAvatars, AvatarInfo, etc.)
- System API types (SystemStatus, HealthCheck, etc.)

### 2. Routes (`routes.ts`)

Defines all API endpoints:

```typescript
export const API_ROUTES: RouteDefinition[] = [
  {
    method: 'GET',
    path: '/health',
    handler: 'healthCheck',
    description: 'Health check endpoint',
  },
  // ... more routes
];
```

**Available Routes:**

- `GET /health` - Health check
- `GET /status` - System status
- `POST /sessions` - Create session
- `GET /sessions/:sessionId` - Get session details
- `POST /sessions/:sessionId/messages` - Send message
- `POST /sessions/:sessionId/complete` - Complete session
- `POST /sessions/:sessionId/switch-avatar` - Switch avatar
- `GET /avatars` - List avatars
- `GET /avatars/:avatarId` - Get avatar details
- `GET /avatars/recommend` - Get avatar recommendation

### 3. Handlers (`handlers.ts`)

Implements request handlers for each route:

```typescript
export function healthCheck(): ApiResponse<HealthCheckResponse> {
  const startTime = Date.now();
  return createResponse({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, startTime);
}
```

**Handler Categories:**

- Health & Status: `healthCheck()`, `getSystemStatus()`
- Sessions: `createSession()`, `getSession()`, `sendMessage()`, `completeSession()`, `switchAvatar()`
- Avatars: `listAvatars()`, `getAvatar()`, `recommendAvatar()`

### 4. Server (`server.ts`)

Implements a simple HTTP server using Node.js `http` module:

```typescript
const server = new ApiServer({
  port: 3000,
  host: '0.0.0.0',
  basePath: '/api/v1',
});

await server.start();
```

**Features:**

- CORS support
- JSON request/response handling
- Path parameter extraction
- Error handling with appropriate status codes
- Graceful shutdown

## Usage

### Starting the Server

```typescript
import { createApiServer, handlers } from './api/index-new.js';

// Set up dependencies
handlers.setSessionManager(sessionManager);
handlers.setSystem(system);

// Create and start server
const server = createApiServer({
  port: 3000,
  host: '0.0.0.0',
  basePath: '/api/v1',
});

await server.start();
// Server running at http://0.0.0.0:3000/api/v1
```

### Making Requests

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Create session
curl -X POST http://localhost:3000/api/v1/sessions \
  -H "Content-Type: application/json" \
  -d '{"clientId": "client-123", "avatarId": "hiraku"}'

# Send message
curl -X POST http://localhost:3000/api/v1/sessions/sess-123/messages \
  -H "Content-Type: application/json" \
  -d '{"content": "こんにちは"}'

# List avatars
curl http://localhost:3000/api/v1/avatars
```

### Response Format

All responses follow a consistent format:

```typescript
{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "req-1234567890-abc123",
    "timestamp": "2025-12-10T00:00:00.000Z",
    "duration": 42
  }
}
```

Error responses:

```typescript
{
  "success": false,
  "error": {
    "code": "SESSION_NOT_FOUND",
    "message": "Session not found"
  },
  "meta": {
    "requestId": "req-1234567890-abc123",
    "timestamp": "2025-12-10T00:00:00.000Z",
    "duration": 15
  }
}
```

## Integration with Session Manager

The API layer requires a session manager to be injected:

```typescript
import { handlers } from './api/index-new.js';

// Inject session manager
handlers.setSessionManager({
  createSession: (clientId, options) => { ... },
  getSession: (sessionId) => { ... },
  addTurn: (sessionId, role, content, metadata) => { ... },
  completeSession: (sessionId, score) => { ... },
  switchAvatar: (sessionId, avatarId) => { ... },
  recommendAvatar: (profile, context) => { ... },
});

// Inject system
handlers.setSystem({
  getStatus: () => { ... },
  isInitialized: () => true,
});
```

## Available Avatars

The API includes 5 predefined avatars:

1. **HIRAKU (ひらく)** - 初回相談コンサルタント
2. **SENRYAKU (戦略)** - CEOコンサルタント
3. **EIGYO (営業)** - 営業コンサルタント
4. **SHIJO (市場)** - マーケティングコンサルタント
5. **KANRI (管理)** - マネジメントコンサルタント

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `NOT_FOUND` | 404 | Route or resource not found |
| `SESSION_NOT_FOUND` | 404 | Session not found |
| `AVATAR_NOT_FOUND` | 404 | Avatar not found |
| `NOT_IMPLEMENTED` | 501 | Handler not implemented |
| `MANAGER_NOT_INITIALIZED` | 503 | Session manager not initialized |
| `SYSTEM_NOT_INITIALIZED` | 503 | System not initialized |
| `SESSION_CREATE_FAILED` | 400 | Failed to create session |
| `SESSION_COMPLETE_FAILED` | 400 | Failed to complete session |
| `AVATAR_SWITCH_FAILED` | 400 | Failed to switch avatar |
| `INTERNAL_ERROR` | 500 | Internal server error |

## TypeScript Support

All types are fully typed and exported:

```typescript
import type {
  ApiRequest,
  ApiResponse,
  CreateSessionRequest,
  CreateSessionResponse,
  SendMessageRequest,
  SendMessageResponse,
  // ... more types
} from './api/index-new.js';
```

## Testing

Example test structure:

```typescript
import { describe, it, expect } from 'vitest';
import { createApiServer, handlers } from '../src/api/index-new.js';

describe('API Server', () => {
  it('should start and respond to health check', async () => {
    const server = createApiServer({ port: 3001 });
    await server.start();

    const response = await fetch('http://localhost:3001/api/v1/health');
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(data.data.status).toBe('ok');

    await server.stop();
  });
});
```

## Configuration

Server configuration options:

```typescript
interface ServerConfig {
  port: number;        // Default: 3000
  host: string;        // Default: '0.0.0.0'
  basePath: string;    // Default: '/api/v1'
}
```

## Performance Considerations

- Request duration is tracked automatically in `meta.duration`
- Simple path matching (no regex) for better performance
- Minimal middleware overhead
- Direct handler invocation

## Security

- CORS enabled with wildcard origin (configure as needed)
- JSON body parsing with size limits (handled by http module)
- Path parameter validation via route matching
- Error messages sanitized (no stack traces exposed)

## Migration from Express

This implementation is lighter than the existing Express-based API. Key differences:

1. **No Express dependency** - Uses native Node.js `http` module
2. **Simplified middleware** - CORS only, no helmet/compression
3. **Type-safe handlers** - All handlers are strictly typed
4. **Consistent responses** - Unified `ApiResponse<T>` format
5. **Dependency injection** - Session manager and system injected

To migrate, replace Express routes with the new handler system and inject dependencies.

## Future Enhancements

Potential improvements:

- [ ] Add request validation middleware
- [ ] Implement rate limiting
- [ ] Add authentication/authorization
- [ ] WebSocket support for real-time messages
- [ ] OpenAPI/Swagger documentation generation
- [ ] Request/response logging
- [ ] Metrics collection
- [ ] Caching layer

## Related Files

- Original API: `/src/api/index.ts` (Express-based)
- Session types: `/src/types/session.ts`
- Avatar definitions: `/src/avatars/`
- OpenAPI spec: `/src/api/openapi.yaml`
