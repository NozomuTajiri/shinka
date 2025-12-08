/**
 * チャット用カスタムフック
 * メッセージ送受信とストリーミング対応
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { Message } from '@/database/types';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  streamingContent: string;
  sessionId: string | null;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

/**
 * チャット機能フック
 */
export function useChat(avatarId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);

  // セッション初期化
  useEffect(() => {
    const initSession = async () => {
      try {
        // 既存のセッションがあるかチェック（sessionStorageから）
        const storedSessionId = sessionStorage.getItem(`chat-session-${avatarId}`);

        if (storedSessionId) {
          // 既存セッションを取得
          const response = await fetch(`/api/v1/chat/${storedSessionId}`);
          if (response.ok) {
            const data = await response.json();
            setSessionId(storedSessionId);
            setMessages(data.data.messages || []);
            return;
          }
        }

        // 新規セッション作成
        const response = await fetch('/api/v1/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            avatarId,
            clientId: 'demo-client', // TODO: 実際のクライアントID
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const newSessionId = data.data.sessionId;
          setSessionId(newSessionId);
          sessionStorage.setItem(`chat-session-${avatarId}`, newSessionId);
        }
      } catch (error) {
        console.error('Failed to initialize session:', error);
      }
    };

    initSession();
  }, [avatarId]);

  /**
   * メッセージ送信
   */
  const sendMessage = useCallback(
    async (content: string) => {
      if (!sessionId || !content.trim()) return;

      setIsLoading(true);
      setIsStreaming(false);
      setStreamingContent('');

      try {
        // ユーザーメッセージを即座に追加
        const userMessage: Message = {
          id: `msg-${Date.now()}`,
          sessionId,
          role: 'user',
          content,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, userMessage]);

        // ストリーミングレスポンスを受信
        const response = await fetch(`/api/v1/chat/${sessionId}/stream`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content }),
        });

        if (!response.ok) {
          throw new Error('Failed to send message');
        }

        // Server-Sent Eventsでストリーミング受信
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error('No response body');
        }

        setIsStreaming(true);
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);

              if (data === '[DONE]') {
                // ストリーミング完了
                setIsStreaming(false);

                // 完全なメッセージを追加
                const avatarMessage: Message = {
                  id: `msg-${Date.now()}`,
                  sessionId,
                  role: 'avatar',
                  content: fullContent,
                  timestamp: new Date(),
                };

                setMessages((prev) => [...prev, avatarMessage]);
                setStreamingContent('');
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullContent += parsed.content;
                  setStreamingContent(fullContent);
                }
              } catch (e) {
                console.error('Failed to parse streaming data:', e);
              }
            }
          }
        }
      } catch (error) {
        console.error('Failed to send message:', error);

        // エラーメッセージを表示
        const errorMessage: Message = {
          id: `msg-error-${Date.now()}`,
          sessionId,
          role: 'avatar',
          content: '申し訳ございません。エラーが発生しました。もう一度お試しください。',
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
      }
    },
    [sessionId]
  );

  /**
   * メッセージクリア
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingContent('');

    if (sessionId) {
      sessionStorage.removeItem(`chat-session-${avatarId}`);
    }
  }, [sessionId, avatarId]);

  return {
    messages,
    isLoading,
    isStreaming,
    streamingContent,
    sessionId,
    sendMessage,
    clearMessages,
  };
}
