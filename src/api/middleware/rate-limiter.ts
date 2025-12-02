/**
 * レート制限ミドルウェア
 *
 * @module api/middleware/rate-limiter
 * @description
 * - express-rate-limitを使用したレート制限
 * - IPアドレスベースの制限
 * - カスタマイズ可能なウィンドウ時間と最大リクエスト数
 * - 429 Too Many Requests レスポンス
 */

import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';

/**
 * グローバルレート制限設定
 *
 * デフォルト: 15分間に100リクエストまで
 *
 * @example
 * app.use('/api', rateLimiter);
 */
export const rateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 100, // 最大100リクエスト
  standardHeaders: true, // RateLimit-* ヘッダーを返す
  legacyHeaders: false, // X-RateLimit-* ヘッダーを無効化
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later',
      details: 'You have exceeded the rate limit of 100 requests per 15 minutes',
    },
  },
  // キーの生成（IPアドレスベース）
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  // カスタムハンドラ（ログ出力）
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP, please try again later',
        details: 'You have exceeded the rate limit of 100 requests per 15 minutes',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
  // スキップ条件（開発環境では制限しない）
  skip: (req) => {
    return process.env.NODE_ENV === 'development' && req.ip === '127.0.0.1';
  },
});

/**
 * ファイルアップロード用レート制限
 *
 * より厳しい制限: 15分間に10リクエストまで
 *
 * @example
 * router.post('/upload', uploadRateLimiter, uploadHandler);
 */
export const uploadRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 10, // 最大10リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: 'Too many upload requests, please try again later',
      details: 'You have exceeded the upload rate limit of 10 requests per 15 minutes',
    },
  },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    console.warn(`Upload rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: 'Too many upload requests, please try again later',
        details: 'You have exceeded the upload rate limit of 10 requests per 15 minutes',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * AI分析用レート制限
 *
 * 高負荷エンドポイント用: 1時間に20リクエストまで
 *
 * @example
 * router.post('/analysis/run', analysisRateLimiter, runAnalysis);
 */
export const analysisRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 60 * 60 * 1000, // 1時間
  max: 20, // 最大20リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'ANALYSIS_RATE_LIMIT_EXCEEDED',
      message: 'Too many analysis requests, please try again later',
      details: 'You have exceeded the analysis rate limit of 20 requests per hour',
    },
  },
  keyGenerator: (req) => {
    // 認証済みユーザーの場合はユーザーIDを使用
    const authHeader = req.headers.authorization;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        // 簡易的にトークンの一部をキーとして使用（本番環境ではuserIdを使用）
        return token.substring(0, 20);
      } catch {
        return req.ip || 'unknown';
      }
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    console.warn(`Analysis rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'ANALYSIS_RATE_LIMIT_EXCEEDED',
        message: 'Too many analysis requests, please try again later',
        details: 'You have exceeded the analysis rate limit of 20 requests per hour',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * エクスポート用レート制限
 *
 * PDFエクスポートなど: 15分間に20リクエストまで
 *
 * @example
 * router.get('/proposals/:id/export', exportRateLimiter, exportProposal);
 */
export const exportRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 20, // 最大20リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'EXPORT_RATE_LIMIT_EXCEEDED',
      message: 'Too many export requests, please try again later',
      details: 'You have exceeded the export rate limit of 20 requests per 15 minutes',
    },
  },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    console.warn(`Export rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'EXPORT_RATE_LIMIT_EXCEEDED',
        message: 'Too many export requests, please try again later',
        details: 'You have exceeded the export rate limit of 20 requests per 15 minutes',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});

/**
 * ストリーミング用レート制限
 *
 * SSEエンドポイント用: 5分間に10リクエストまで
 *
 * @example
 * router.get('/analysis/:id/stream', streamRateLimiter, streamAnalysis);
 */
export const streamRateLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 5 * 60 * 1000, // 5分
  max: 10, // 最大10リクエスト
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'STREAM_RATE_LIMIT_EXCEEDED',
      message: 'Too many streaming requests, please try again later',
      details: 'You have exceeded the streaming rate limit of 10 requests per 5 minutes',
    },
  },
  keyGenerator: (req) => {
    return req.ip || req.socket.remoteAddress || 'unknown';
  },
  handler: (req, res) => {
    console.warn(`Stream rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      error: {
        code: 'STREAM_RATE_LIMIT_EXCEEDED',
        message: 'Too many streaming requests, please try again later',
        details: 'You have exceeded the streaming rate limit of 10 requests per 5 minutes',
        retryAfter: res.getHeader('Retry-After'),
      },
    });
  },
});
