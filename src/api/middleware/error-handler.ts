/**
 * エラーハンドリングミドルウェア
 *
 * @module api/middleware/error-handler
 * @description
 * - グローバルエラーハンドラ
 * - カスタムエラークラス定義
 * - 詳細なエラーレスポンス生成
 * - 開発/本番環境での出力切り替え
 * - zodバリデーションエラー処理
 */

import { type Request, type Response, type NextFunction } from 'express';
import { ZodError } from 'zod';

/**
 * HTTPエラーステータスコード型
 */
export type HttpStatusCode = 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 503;

/**
 * エラーレスポンス型
 */
export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: string | Record<string, unknown>;
    timestamp: string;
    path?: string;
    stack?: string; // 開発環境のみ
  };
}

/**
 * カスタムアプリケーションエラークラス
 */
export class AppError extends Error {
  public readonly statusCode: HttpStatusCode;
  public readonly code: string;
  public readonly details?: string | Record<string, unknown>;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: HttpStatusCode = 500,
    code: string = 'INTERNAL_ERROR',
    details?: string | Record<string, unknown>,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // TypeScriptのインスタンス判定を正しく行うため
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * バリデーションエラー（400 Bad Request）
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: string | Record<string, unknown>) {
    super(message, 400, 'VALIDATION_ERROR', details);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * 認証エラー（401 Unauthorized）
 */
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: string) {
    super(message, 401, 'UNAUTHORIZED', details);
    Object.setPrototypeOf(this, UnauthorizedError.prototype);
  }
}

/**
 * 認可エラー（403 Forbidden）
 */
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: string) {
    super(message, 403, 'FORBIDDEN', details);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}

/**
 * 未検出エラー（404 Not Found）
 */
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * 競合エラー（409 Conflict）
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: string) {
    super(message, 409, 'CONFLICT', details);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * zodエラーをバリデーションエラーに変換
 *
 * @param error - ZodError
 * @returns ValidationError
 */
export function zodErrorToValidationError(error: ZodError): ValidationError {
  const details = error.issues.map((err) => ({
    path: err.path.join('.'),
    message: err.message,
    code: err.code,
  }));

  return new ValidationError('Request validation failed', {
    errors: details,
  });
}

/**
 * グローバルエラーハンドラミドルウェア
 *
 * 全てのエラーをキャッチし、適切なレスポンスを返す
 *
 * @example
 * // app.ts の最後に配置
 * app.use(errorHandler);
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  // デフォルト値
  let statusCode: HttpStatusCode = 500;
  let code = 'INTERNAL_ERROR';
  let message = 'An unexpected error occurred';
  let details: string | Record<string, unknown> | undefined;

  // AppErrorインスタンスの場合
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;

    // 運用エラー（想定内）はログレベルを下げる
    if (err.isOperational) {
      console.warn(`Operational error: ${err.message}`, {
        code: err.code,
        path: req.path,
      });
    } else {
      // プログラミングエラー（想定外）は詳細ログ
      console.error('Programming error:', err);
    }
  }
  // zodバリデーションエラー
  else if (err instanceof ZodError) {
    const validationError = zodErrorToValidationError(err);
    statusCode = validationError.statusCode;
    code = validationError.code;
    message = validationError.message;
    details = validationError.details;

    console.warn('Validation error:', details);
  }
  // その他のエラー
  else {
    console.error('Unhandled error:', err);
  }

  // エラーレスポンス構築
  const errorResponse: ErrorResponse = {
    error: {
      code,
      message,
      timestamp: new Date().toISOString(),
      path: req.path,
    },
  };

  // 詳細情報を追加
  if (details) {
    errorResponse.error.details = details;
  }

  // 開発環境のみスタックトレースを含める
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // レスポンス送信
  res.status(statusCode).json(errorResponse);
}

/**
 * 非同期ルートハンドラのラッパー
 *
 * try-catchを省略し、エラーを自動的にnext()に渡す
 *
 * @param fn - 非同期ルートハンドラ
 * @returns Expressミドルウェア
 *
 * @example
 * router.get('/statements/:id', asyncHandler(async (req, res) => {
 *   const statement = await getStatement(req.params.id);
 *   res.json(statement);
 * }));
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 404エラーハンドラ
 *
 * ルートが見つからない場合に呼び出される
 *
 * @example
 * // 全ルート定義後に配置
 * app.use(notFoundHandler);
 * app.use(errorHandler);
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
}
