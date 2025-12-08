/**
 * チャットインターフェース
 * メッセージ送受信とストリーミング表示
 */

'use client';

import { useRef, useEffect } from 'react';
import { Avatar, Message } from '@/database/types';
import { useChat } from '@/hooks/useChat';
import { MessageBubble } from './MessageBubble';

interface ChatInterfaceProps {
  avatar: Avatar;
}

export function ChatInterface({ avatar }: ChatInterfaceProps) {
  const {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sendMessage,
    sessionId,
  } = useChat(avatar.id);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 新しいメッセージが追加されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const input = inputRef.current;
    if (!input || !input.value.trim()) return;

    const content = input.value.trim();
    input.value = '';
    input.style.height = 'auto';

    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    target.style.height = 'auto';
    target.style.height = `${Math.min(target.scrollHeight, 200)}px`;
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto bg-gray-50 px-4 py-6">
        <div className="container mx-auto max-w-4xl">
          {messages.length === 0 && !isStreaming && (
            <div className="text-center text-gray-500">
              <div className="mb-4 text-6xl">{getRoleEmoji(avatar.role)}</div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">
                {avatar.name}と対話を始めましょう
              </h3>
              <p className="mb-6 text-gray-600">{avatar.description}</p>

              <div className="rounded-lg bg-white p-6 text-left shadow-sm">
                <p className="mb-3 font-semibold text-gray-900">
                  こんなことができます：
                </p>
                <ul className="space-y-2 text-sm text-gray-600">
                  {avatar.expertise.map((exp, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{exp}に関する相談</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} avatar={avatar} />
          ))}

          {isStreaming && streamingContent && (
            <MessageBubble
              message={{
                id: 'streaming',
                sessionId: sessionId || '',
                role: 'avatar',
                content: streamingContent,
                timestamp: new Date(),
              }}
              avatar={avatar}
              isStreaming
            />
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="border-t border-gray-200 bg-white px-4 py-4">
        <div className="container mx-auto max-w-4xl">
          <form onSubmit={handleSubmit} className="flex items-end space-x-4">
            <div className="flex-1">
              <textarea
                ref={inputRef}
                onKeyDown={handleKeyDown}
                onInput={handleInput}
                placeholder="メッセージを入力... (Shift+Enterで改行)"
                disabled={isLoading}
                rows={1}
                className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  送信中...
                </span>
              ) : (
                '送信'
              )}
            </button>
          </form>

          <p className="mt-2 text-xs text-gray-500">
            Shift+Enterで改行、Enterで送信
          </p>
        </div>
      </div>
    </div>
  );
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
