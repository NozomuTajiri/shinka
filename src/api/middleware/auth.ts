/**
 * JWT認証ミドルウェア
 *
 * @module api/middleware/auth
 * @description
 * - JWTトークン検証
 * - ユーザー認証状態の確認
 * - Authorization ヘッダーからトークン抽出
 * - リクエストにユーザー情報を注入
 */

import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * JWTペイロード型定義
 */
export interface JWTPayload {
  userId: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  iat?: number;
  exp?: number;
}

/**
 * 認証済みリクエスト型（userプロパティ追加）
 */
export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

/**
 * JWT秘密鍵取得（環境変数）
 */
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

/**
 * JWTトークンの有効期限（デフォルト: 24時間）
 */
const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '24h';

/**
 * JWTトークン生成
 *
 * @param payload - JWTペイロード
 * @returns 署名付きJWTトークン
 *
 * @example
 * const token = generateToken({
 *   userId: '123',
 *   email: 'user@example.com',
 *   role: 'user'
 * });
 */
export function generateToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRATION as string,
    issuer: 'shinka-api',
    audience: 'shinka-client',
  } as jwt.SignOptions);
}

/**
 * JWTトークン検証
 *
 * @param token - JWTトークン文字列
 * @returns デコードされたペイロード
 * @throws トークンが無効な場合
 *
 * @example
 * try {
 *   const payload = verifyToken(token);
 *   console.log(payload.userId);
 * } catch (error) {
 *   console.error('Invalid token');
 * }
 */
export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET, {
    issuer: 'shinka-api',
    audience: 'shinka-client',
  }) as JWTPayload;
}

/**
 * 認証ミドルウェア
 *
 * Authorization ヘッダーからトークンを抽出し、検証後にリクエストにユーザー情報を注入
 *
 * @example
 * // ルートに適用
 * router.get('/protected', authenticate, (req, res) => {
 *   const user = (req as AuthenticatedRequest).user;
 *   res.json({ user });
 * });
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Authorization ヘッダー取得
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header is required',
          details: 'Please provide a valid JWT token in Authorization header',
        },
      });
      return;
    }

    // "Bearer <token>" 形式を想定
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: {
          code: 'INVALID_AUTH_FORMAT',
          message: 'Invalid authorization header format',
          details: 'Expected format: "Bearer <token>"',
        },
      });
      return;
    }

    const token = parts[1];

    // トークン検証
    const payload = verifyToken(token);

    // リクエストにユーザー情報を注入
    (req as AuthenticatedRequest).user = payload;

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired JWT token',
          details: error.message,
        },
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'JWT token has expired',
          details: `Token expired at ${error.expiredAt}`,
        },
      });
      return;
    }

    // その他のエラー
    res.status(500).json({
      error: {
        code: 'AUTHENTICATION_ERROR',
        message: 'Failed to authenticate',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
    });
  }
}

/**
 * ロールベース認可ミドルウェア
 *
 * @param allowedRoles - 許可するロールのリスト
 * @returns Expressミドルウェア関数
 *
 * @example
 * // 管理者のみアクセス可能
 * router.delete('/statements/:id',
 *   authenticate,
 *   authorize(['admin']),
 *   deleteStatement
 * );
 */
export function authorize(allowedRoles: JWTPayload['role'][]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as AuthenticatedRequest).user;

    if (!user) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'User not authenticated',
          details: 'Please authenticate first using the authenticate middleware',
        },
      });
      return;
    }

    if (!allowedRoles.includes(user.role)) {
      res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          details: `Required role: ${allowedRoles.join(' or ')}, your role: ${user.role}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * オプショナル認証ミドルウェア
 *
 * トークンがあれば検証、なくてもエラーにしない
 * 認証済みユーザーと未認証ユーザーで異なるレスポンスを返す場合に使用
 *
 * @example
 * router.get('/statements', optionalAuthenticate, async (req, res) => {
 *   const user = (req as AuthenticatedRequest).user;
 *   // ユーザーが認証済みの場合は追加情報を返す
 *   if (user) {
 *     // 認証済みユーザー専用データ
 *   }
 * });
 */
export function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // トークンがない場合はスキップ
    next();
    return;
  }

  try {
    const parts = authHeader.split(' ');

    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const payload = verifyToken(token);
      (req as AuthenticatedRequest).user = payload;
    }
  } catch (error) {
    // トークンが無効でもエラーにしない（スキップ）
    console.warn('Optional authentication failed:', error);
  }

  next();
}
