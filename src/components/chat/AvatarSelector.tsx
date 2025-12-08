/**
 * アバター選択コンポーネント
 * 利用可能なアバターの一覧表示
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/database/types';

export function AvatarSelector() {
  const router = useRouter();
  const [avatars, setAvatars] = useState<Avatar[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvatars = async () => {
      try {
        const response = await fetch('/api/v1/avatars');
        if (!response.ok) {
          throw new Error('アバターの取得に失敗しました');
        }
        const data = await response.json();
        setAvatars(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'エラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchAvatars();
  }, []);

  const handleAvatarSelect = (avatarId: string) => {
    router.push(`/chat/${avatarId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-center">
          <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          <p className="text-gray-600">アバターを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <div className="mb-2 text-4xl">⚠️</div>
        <p className="text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold text-gray-900">
        対話したいアバターを選択してください
      </h2>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {avatars.map((avatar) => (
          <AvatarCard
            key={avatar.id}
            avatar={avatar}
            onClick={() => handleAvatarSelect(avatar.id)}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * アバターカード
 */
interface AvatarCardProps {
  avatar: Avatar;
  onClick: () => void;
}

function AvatarCard({ avatar, onClick }: AvatarCardProps) {
  const roleEmoji = getRoleEmoji(avatar.role);
  const roleLabel = getRoleLabel(avatar.role);

  return (
    <button
      onClick={onClick}
      className="group relative rounded-xl border border-gray-200 bg-white p-6 text-left shadow-sm transition-all hover:border-blue-500 hover:shadow-lg"
    >
      {/* アバターアイコン */}
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-blue-200 text-3xl transition-transform group-hover:scale-110">
        {roleEmoji}
      </div>

      {/* 名前と役割 */}
      <h3 className="mb-2 text-xl font-bold text-gray-900">{avatar.name}</h3>
      <div className="mb-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
        {roleLabel}
      </div>

      {/* 説明 */}
      <p className="mb-4 text-sm text-gray-600">{avatar.description}</p>

      {/* 専門分野 */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-semibold uppercase text-gray-500">
          専門分野
        </p>
        <div className="flex flex-wrap gap-2">
          {avatar.expertise.slice(0, 3).map((exp, index) => (
            <span
              key={index}
              className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700"
            >
              {exp}
            </span>
          ))}
          {avatar.expertise.length > 3 && (
            <span className="rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
              +{avatar.expertise.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* パフォーマンス指標 */}
      {avatar.performanceMetrics.totalSessions > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>セッション数</span>
            <span className="font-semibold">
              {avatar.performanceMetrics.totalSessions}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-gray-600">
            <span>満足度</span>
            <span className="font-semibold">
              {avatar.performanceMetrics.userSatisfactionScore.toFixed(1)} / 5.0
            </span>
          </div>
        </div>
      )}

      {/* ホバー効果 */}
      <div className="absolute bottom-4 right-4 text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
        →
      </div>
    </button>
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

/**
 * 役割ラベルを取得
 */
function getRoleLabel(role: Avatar['role']): string {
  const labelMap: Record<Avatar['role'], string> = {
    ceo: '経営戦略',
    strategy: '戦略コンサルタント',
    finance: '財務アドバイザー',
    marketing: 'マーケティング',
    tech: 'テクノロジー',
    hr: '人事コンサルタント',
    operations: 'オペレーション',
  };
  return labelMap[role] || role;
}
