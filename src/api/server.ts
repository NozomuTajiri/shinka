/**
 * APIサーバー
 * シンプルなHTTPサーバー実装
 */

import * as http from 'http';
import type { ApiResponse, CreateSessionRequest, SendMessageRequest } from './types.js';
import * as handlers from './handlers.js';
import { findRoute } from './routes.js';

export interface ServerConfig {
  port: number;
  host: string;
  basePath: string;
}

const DEFAULT_CONFIG: ServerConfig = {
  port: 3000,
  host: '0.0.0.0',
  basePath: '/api/v1',
};

export class ApiServer {
  private server: http.Server | null = null;
  private config: ServerConfig;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = http.createServer(async (req, res) => {
        await this.handleRequest(req, res);
      });

      this.server.listen(this.config.port, this.config.host, () => {
        console.log(`[ApiServer] Server running at http://${this.config.host}:${this.config.port}${this.config.basePath}`);
        resolve();
      });

      this.server.on('error', reject);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('[ApiServer] Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  private async handleRequest(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
    const method = req.method ?? 'GET';
    const url = new URL(req.url ?? '/', `http://${req.headers.host}`);
    const path = url.pathname.replace(this.config.basePath, '');

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    res.setHeader('Content-Type', 'application/json');

    try {
      const response = await this.routeRequest(method, path, req);
      const statusCode = response.success ? 200 : this.getErrorStatusCode(response.error?.code);
      res.writeHead(statusCode);
      res.end(JSON.stringify(response));
    } catch (error) {
      res.writeHead(500);
      res.end(JSON.stringify({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Internal server error: ${error}`,
        },
      }));
    }
  }

  private async routeRequest(
    method: string,
    path: string,
    req: http.IncomingMessage
  ): Promise<ApiResponse> {
    const route = findRoute(method, path);

    if (!route) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route not found: ${method} ${path}`,
        },
      };
    }

    const params = this.extractParams(route.path, path);
    const body = method !== 'GET' ? await this.parseBody(req) : {};

    switch (route.handler) {
      case 'healthCheck':
        return handlers.healthCheck();
      case 'getSystemStatus':
        return handlers.getSystemStatus();
      case 'createSession':
        return handlers.createSession(body as unknown as CreateSessionRequest);
      case 'getSession':
        return handlers.getSession(params.sessionId);
      case 'sendMessage':
        return handlers.sendMessage(params.sessionId, body as unknown as SendMessageRequest);
      case 'completeSession':
        return handlers.completeSession(params.sessionId, body.satisfactionScore as number | undefined);
      case 'switchAvatar':
        return handlers.switchAvatar(params.sessionId, body.avatarId as string);
      case 'listAvatars':
        return handlers.listAvatars();
      case 'getAvatar':
        return handlers.getAvatar(params.avatarId);
      case 'recommendAvatar':
        return handlers.recommendAvatar(body.challenges as string[] | undefined);
      default:
        return {
          success: false,
          error: {
            code: 'NOT_IMPLEMENTED',
            message: `Handler not implemented: ${route.handler}`,
          },
        };
    }
  }

  private extractParams(routePath: string, requestPath: string): Record<string, string> {
    const params: Record<string, string> = {};
    const routeParts = routePath.split('/');
    const requestParts = requestPath.split('/');

    for (let i = 0; i < routeParts.length; i++) {
      if (routeParts[i].startsWith(':')) {
        const paramName = routeParts[i].slice(1);
        params[paramName] = requestParts[i];
      }
    }

    return params;
  }

  private async parseBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          resolve(body ? JSON.parse(body) : {});
        } catch {
          resolve({});
        }
      });
      req.on('error', reject);
    });
  }

  private getErrorStatusCode(code?: string): number {
    switch (code) {
      case 'NOT_FOUND':
      case 'SESSION_NOT_FOUND':
      case 'AVATAR_NOT_FOUND':
        return 404;
      case 'NOT_IMPLEMENTED':
        return 501;
      case 'MANAGER_NOT_INITIALIZED':
      case 'SYSTEM_NOT_INITIALIZED':
        return 503;
      default:
        return 400;
    }
  }

  getConfig(): ServerConfig {
    return { ...this.config };
  }
}

export function createApiServer(config?: Partial<ServerConfig>): ApiServer {
  return new ApiServer(config);
}
