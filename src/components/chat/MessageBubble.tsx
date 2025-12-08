/**
 * メッセージバブルコンポーネント
 * ユーザー/アバターのメッセージ表示
 */

'use client';

import { Message, Avatar } from '@/database/types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
  avatar: Avatar;
  isStreaming?: boolean;
}

export function MessageBubble({
  message,
  avatar,
  isStreaming = false,
}: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`mb-6 flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
      >
        {/* アバター画像 */}
        {!isUser && (
          <div className="mr-3 flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-xl">
              {getRoleEmoji(avatar.role)}
            </div>
          </div>
        )}

        {/* メッセージ内容 */}
        <div className="flex flex-col">
          {/* 送信者名と時刻 */}
          {!isUser && (
            <div className="mb-1 text-sm font-semibold text-gray-700">
              {avatar.name}
            </div>
          )}

          {/* メッセージバブル */}
          <div
            className={`rounded-2xl px-4 py-3 ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-900 shadow-sm'
            }`}
          >
            {isUser ? (
              <p className="whitespace-pre-wrap break-words">{message.content}</p>
            ) : (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // カスタムレンダラー
                    h1: ({ children }) => (
                      <h1 className="mb-2 text-xl font-bold">{children}</h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mb-2 text-lg font-bold">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mb-2 text-base font-bold">{children}</h3>
                    ),
                    p: ({ children }) => (
                      <p className="mb-2 leading-relaxed">{children}</p>
                    ),
                    ul: ({ children }) => (
                      <ul className="mb-2 ml-4 list-disc">{children}</ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="mb-2 ml-4 list-decimal">{children}</ol>
                    ),
                    li: ({ children }) => (
                      <li className="mb-1">{children}</li>
                    ),
                    code: ({ className, children, ...props }) => {
                      const isInline = !className;
                      return isInline ? (
                        <code
                          className="rounded bg-gray-100 px-1 py-0.5 text-sm font-mono text-gray-800"
                          {...props}
                        >
                          {children}
                        </code>
                      ) : (
                        <code
                          className={`block rounded bg-gray-100 p-3 font-mono text-sm ${className}`}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    blockquote: ({ children }) => (
                      <blockquote className="border-l-4 border-blue-500 pl-4 italic text-gray-700">
                        {children}
                      </blockquote>
                    ),
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        {children}
                      </a>
                    ),
                  }}
                >
                  {message.content}
                </ReactMarkdown>

                {isStreaming && (
                  <span className="inline-block h-4 w-1 animate-pulse bg-gray-900">
                    |
                  </span>
                )}
              </div>
            )}
          </div>

          {/* タイムスタンプ */}
          <div
            className={`mt-1 text-xs text-gray-500 ${isUser ? 'text-right' : 'text-left'}`}
          >
            {formatTimestamp(message.timestamp)}
          </div>

          {/* メタデータ（アバターメッセージのみ） */}
          {!isUser && message.metadata && (
            <div className="mt-2 space-y-1">
              {message.metadata.confidence !== undefined && (
                <div className="text-xs text-gray-500">
                  信頼度: {(message.metadata.confidence * 100).toFixed(0)}%
                </div>
              )}

              {message.metadata.knowledgeReferences &&
                message.metadata.knowledgeReferences.length > 0 && (
                  <div className="text-xs text-gray-500">
                    参照: {message.metadata.knowledgeReferences.length}件のナレッジ
                  </div>
                )}
            </div>
          )}
        </div>

        {/* ユーザーアイコン */}
        {isUser && (
          <div className="ml-3 flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 text-xl">
              👤
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * タイムスタンプをフォーマット
 */
function formatTimestamp(timestamp: Date): string {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) {
    return 'たった今';
  } else if (diffMins < 60) {
    return `${diffMins}分前`;
  } else if (diffHours < 24) {
    return `${diffHours}時間前`;
  } else if (diffDays < 7) {
    return `${diffDays}日前`;
  } else {
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

/**
 * 役割に応じた絵文字を取得
 */
function getRoleEmoji(role: Avatar['role']): string {
  const emojiMap: Record<Avatar['role'], string> = {
    ceo: '👔',
    strategy: '📊',
    finance: '💰',
    marketing: '📈',
    tech: '💻',
    hr: '👥',
    operations: '⚙️',
  };
  return emojiMap[role] || '🤖';
}
