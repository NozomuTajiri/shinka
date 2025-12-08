/**
 * チャットトップページ
 * アバター選択画面
 */

import { AvatarSelector } from '@/components/chat/AvatarSelector';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            価値共創対話プラットフォーム
          </h1>
          <p className="text-lg text-gray-600">
            専門アバターがあなたのビジネス課題解決をサポートします
          </p>
        </header>

        <AvatarSelector />
      </div>
    </div>
  );
}
