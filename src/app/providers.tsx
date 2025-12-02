'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

/**
 * プロバイダーコンポーネント
 *
 * React QueryのQueryClientProviderをラップし、
 * クライアントサイドでのデータフェッチ管理を提供。
 *
 * @param props - React子要素を含むプロパティ
 * @returns プロバイダーラッパー
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClientを状態として保持（再レンダリングで新しいインスタンスを作らないため）
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // デフォルトでステイルタイム5分
            staleTime: 5 * 60 * 1000,
            // リトライ回数
            retry: 3,
            // リファレンス時のリフェッチ無効化
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
