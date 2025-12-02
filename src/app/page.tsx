import Link from 'next/link';
import { ArrowRight, Upload, BarChart3, FileText } from 'lucide-react';

/**
 * トップページ（ダッシュボード）
 *
 * 財務分析システムのランディングページ。
 * 最近の分析結果、主要機能へのリンク、クイックアクションを表示。
 *
 * @returns トップページコンポーネント
 */
export default function HomePage() {
  return (
    <div className="container py-10">
      {/* ヒーローセクション */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
          AI駆動の財務分析システム
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          決算書をアップロードするだけで、AIが自動で財務分析を実行し、
          経営改善提案書を生成します。
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/upload"
            className="inline-flex items-center justify-center rounded-md bg-primary px-8 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            <Upload className="mr-2 h-4 w-4" />
            決算書をアップロード
          </Link>
          <Link
            href="#features"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-8 py-3 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          >
            機能を見る
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* 機能セクション */}
      <section id="features" className="mb-12">
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-center">
          主要機能
        </h2>
        <div className="grid gap-6 md:grid-cols-3">
          {/* 機能カード 1: 決算書アップロード */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">
                決算書アップロード
              </h3>
            </div>
            <p className="text-muted-foreground">
              PDF、Excel、CSVに対応。ドラッグ&ドロップで簡単アップロード。
              複数年度の決算書を一括処理可能。
            </p>
          </div>

          {/* 機能カード 2: AI財務分析 */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">
                AI財務分析
              </h3>
            </div>
            <p className="text-muted-foreground">
              収益性、安全性、効率性、成長性の4つの視点から自動分析。
              業界ベンチマークとの比較も実施。
            </p>
          </div>

          {/* 機能カード 3: 提案書自動生成 */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">
                提案書自動生成
              </h3>
            </div>
            <p className="text-muted-foreground">
              AIが経営課題を特定し、改善提案を自動生成。
              PDF/Excelでエクスポート可能。
            </p>
          </div>
        </div>
      </section>

      {/* 最近の分析（デモデータ） */}
      <section>
        <h2 className="text-3xl font-bold tracking-tight mb-8">
          最近の分析
        </h2>
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
          <div className="p-6">
            <div className="space-y-4">
              {/* 分析結果サンプル1 */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <p className="font-medium">株式会社サンプル</p>
                  <p className="text-sm text-muted-foreground">
                    2023年度決算書
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">品質スコア</p>
                    <p className="text-2xl font-bold text-green-600">85点</p>
                  </div>
                  <Link
                    href="/analysis/sample-1"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>

              {/* 分析結果サンプル2 */}
              <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                  <p className="font-medium">テスト株式会社</p>
                  <p className="text-sm text-muted-foreground">
                    2023年度決算書
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">品質スコア</p>
                    <p className="text-2xl font-bold text-yellow-600">72点</p>
                  </div>
                  <Link
                    href="/analysis/sample-2"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>

              {/* 分析結果サンプル3 */}
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-medium">デモ企業株式会社</p>
                  <p className="text-sm text-muted-foreground">
                    2023年度決算書
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium">品質スコア</p>
                    <p className="text-2xl font-bold text-green-600">92点</p>
                  </div>
                  <Link
                    href="/analysis/sample-3"
                    className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  >
                    詳細を見る
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
