/**
 * アバター対話ページ
 * リアルタイムチャットインターフェース
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { Avatar } from '@/database/types';

export default function AvatarChatPage() {
  const params = useParams();
  const router = useRouter();
  const avatarId = params.avatarId as string;

  const [avatar, setAvatar] = useState<Avatar | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatar = async () => {
      try {
        const response = await fetch(`/api/v1/avatars/${avatarId}`);
        if (!response.ok) {
          throw new Error('アバターが見つかりません');
        }
        const data = await response.json();
        setAvatar(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAvatar();
  }, [avatarId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !avatar) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-4 text-6xl">⚠️</div>
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            エラーが発生しました
          </h2>
          <p className="mb-6 text-gray-600">{error || 'アバターが見つかりません'}</p>
          <button
            onClick={() => router.push('/chat')}
            className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
          >
            アバター選択に戻る
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50">
      {/* ヘッダー */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <button
            onClick={() => router.push('/chat')}
            className="text-gray-600 hover:text-gray-900"
          >
            ← アバター選択に戻る
          </button>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <h2 className="font-bold text-gray-900">{avatar.name}</h2>
              <p className="text-sm text-gray-600">{avatar.description}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">
              {getRoleEmoji(avatar.role)}
            </div>
          </div>
        </div>
      </header>

      {/* チャットインターフェース */}
      <ChatInterface avatar={avatar} />
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
