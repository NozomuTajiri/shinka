import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '財務分析システム - Shinka',
  description: 'AI駆動の財務分析・提案書自動生成システム',
  icons: {
    icon: '/favicon.ico',
  },
};

/**
 * ルートレイアウトコンポーネント
 *
 * Next.js 14 App Routerのルートレイアウト。
 * 全ページで共有されるHTML構造とプロバイダーを定義。
 *
 * @param props - React子要素を含むプロパティ
 * @returns ルートレイアウト
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          {/* ヘッダー */}
          <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <div className="mr-4 flex">
                <a className="mr-6 flex items-center space-x-2" href="/">
                  <span className="font-bold sm:inline-block">
                    財務分析システム
                  </span>
                </a>
                <nav className="flex items-center space-x-6 text-sm font-medium">
                  <a
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                    href="/"
                  >
                    ダッシュボード
                  </a>
                  <a
                    className="transition-colors hover:text-foreground/80 text-foreground/60"
                    href="/upload"
                  >
                    アップロード
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* メインコンテンツ */}
          <main className="flex-1">{children}</main>

          {/* フッター */}
          <footer className="border-t py-6 md:px-8 md:py-0">
            <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
              <p className="text-center text-sm leading-loose text-muted-foreground md:text-left">
                Powered by Miyabi Framework
              </p>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
