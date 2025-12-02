'use client';

import { use } from 'react';
import Link from 'next/link';
import { useAnalysis, useBenchmark } from '@/hooks/useAnalysis';
import { useGenerateProposal } from '@/hooks/useProposal';
import { MetricsCard } from '@/components/dashboard/MetricsCard';
import { RadarChart } from '@/components/dashboard/RadarChart';
import { BenchmarkChart } from '@/components/dashboard/BenchmarkChart';
import {
  AlertCircle,
  AlertTriangle,
  Info,
  FileText,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

/**
 * 分析結果ページプロパティ
 */
interface AnalysisPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 分析結果ページ
 *
 * 財務指標ダッシュボード、レーダーチャート、ベンチマーク比較、
 * アラート一覧を表示。提案書生成ボタンも配置。
 *
 * @param props - ページプロパティ
 * @returns 分析結果ページコンポーネント
 */
export default function AnalysisPage({ params }: AnalysisPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: analysis, isLoading, error } = useAnalysis(id);
  const { data: benchmark, isLoading: isBenchmarkLoading } = useBenchmark(id);
  const generateProposalMutation = useGenerateProposal();

  /**
   * 提案書生成ハンドラ
   */
  const handleGenerateProposal = async () => {
    try {
      const result = await generateProposalMutation.mutateAsync({
        analysisId: id,
      });

      // 提案書ページにリダイレクト
      router.push(`/proposals/${result.proposalId}`);
    } catch (error) {
      console.error('提案書生成エラー:', error);
    }
  };

  /**
   * アラートアイコンを取得
   */
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  /**
   * アラート背景色を取得
   */
  const getAlertBgColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex items-center justify-center h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  // エラー状態
  if (error || !analysis) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">データの取得に失敗しました</h2>
          <p className="text-muted-foreground mb-4">
            {error?.message || '不明なエラーが発生しました'}
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    );
  }

  /**
   * レーダーチャート用データ変換
   */
  const radarData = benchmark
    ? [
        {
          subject: '収益性',
          company: analysis.metrics.profitability.roe,
          industryAverage: benchmark.industryAverage.profitability.roe,
          topQuartile: benchmark.topQuartile.profitability.roe,
        },
        {
          subject: '安全性',
          company: analysis.metrics.safety.equityRatio,
          industryAverage: benchmark.industryAverage.safety.equityRatio,
          topQuartile: benchmark.topQuartile.safety.equityRatio,
        },
        {
          subject: '効率性',
          company: analysis.metrics.efficiency.totalAssetTurnover * 20,
          industryAverage:
            benchmark.industryAverage.efficiency.totalAssetTurnover * 20,
          topQuartile:
            benchmark.topQuartile.efficiency.totalAssetTurnover * 20,
        },
        {
          subject: '成長性',
          company: analysis.metrics.growth.revenueGrowth + 50,
          industryAverage:
            benchmark.industryAverage.growth.revenueGrowth + 50,
          topQuartile: benchmark.topQuartile.growth.revenueGrowth + 50,
        },
      ]
    : [];

  /**
   * ベンチマークチャート用データ変換
   */
  const benchmarkData = benchmark
    ? [
        {
          name: 'ROE',
          company: analysis.metrics.profitability.roe,
          industryAverage: benchmark.industryAverage.profitability.roe,
          topQuartile: benchmark.topQuartile.profitability.roe,
        },
        {
          name: '自己資本比率',
          company: analysis.metrics.safety.equityRatio,
          industryAverage: benchmark.industryAverage.safety.equityRatio,
          topQuartile: benchmark.topQuartile.safety.equityRatio,
        },
        {
          name: '総資本回転率',
          company: analysis.metrics.efficiency.totalAssetTurnover,
          industryAverage:
            benchmark.industryAverage.efficiency.totalAssetTurnover,
          topQuartile: benchmark.topQuartile.efficiency.totalAssetTurnover,
        },
        {
          name: '売上高成長率',
          company: analysis.metrics.growth.revenueGrowth,
          industryAverage: benchmark.industryAverage.growth.revenueGrowth,
          topQuartile: benchmark.topQuartile.growth.revenueGrowth,
        },
      ]
    : [];

  return (
    <div className="container py-10">
      {/* ページヘッダー */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            {analysis.companyName} - {analysis.fiscalYear}
          </h1>
          <p className="text-muted-foreground">
            分析完了日時: {new Date(analysis.completedAt).toLocaleString('ja-JP')}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* 品質スコア */}
          <div className="text-right">
            <p className="text-sm text-muted-foreground">品質スコア</p>
            <p
              className={`text-3xl font-bold ${
                analysis.qualityScore >= 80
                  ? 'text-green-600'
                  : analysis.qualityScore >= 60
                    ? 'text-yellow-600'
                    : 'text-red-600'
              }`}
            >
              {analysis.qualityScore}点
            </p>
          </div>

          {/* 提案書生成ボタン */}
          <button
            onClick={handleGenerateProposal}
            disabled={generateProposalMutation.isPending}
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generateProposalMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <FileText className="mr-2 h-4 w-4" />
                提案書を生成
              </>
            )}
          </button>
        </div>
      </div>

      {/* アラート一覧 */}
      {analysis.alerts.length > 0 && (
        <div className="mb-8 space-y-2">
          {analysis.alerts.map((alert, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 rounded-lg border p-4 ${getAlertBgColor(alert.severity)}`}
            >
              {getAlertIcon(alert.severity)}
              <p className="text-sm font-medium">{alert.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* 財務指標カード */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6">主要財務指標</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <MetricsCard
            title="ROE（自己資本利益率）"
            value={analysis.metrics.profitability.roe}
            unit="%"
            industryAverage={benchmark?.industryAverage.profitability.roe}
            variant={
              analysis.metrics.profitability.roe > 10
                ? 'success'
                : analysis.metrics.profitability.roe > 5
                  ? 'warning'
                  : 'danger'
            }
          />
          <MetricsCard
            title="自己資本比率"
            value={analysis.metrics.safety.equityRatio}
            unit="%"
            industryAverage={benchmark?.industryAverage.safety.equityRatio}
            variant={
              analysis.metrics.safety.equityRatio > 40
                ? 'success'
                : analysis.metrics.safety.equityRatio > 20
                  ? 'warning'
                  : 'danger'
            }
          />
          <MetricsCard
            title="総資本回転率"
            value={analysis.metrics.efficiency.totalAssetTurnover}
            unit="回"
            industryAverage={
              benchmark?.industryAverage.efficiency.totalAssetTurnover
            }
          />
          <MetricsCard
            title="売上高成長率"
            value={analysis.metrics.growth.revenueGrowth}
            unit="%"
            industryAverage={benchmark?.industryAverage.growth.revenueGrowth}
            variant={
              analysis.metrics.growth.revenueGrowth > 5
                ? 'success'
                : analysis.metrics.growth.revenueGrowth > 0
                  ? 'warning'
                  : 'danger'
            }
          />
        </div>
      </section>

      {/* レーダーチャート */}
      {!isBenchmarkLoading && radarData.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            4つの視点からの分析
          </h2>
          <div className="rounded-lg border bg-card p-6">
            <RadarChart data={radarData} />
          </div>
        </section>
      )}

      {/* ベンチマーク比較チャート */}
      {!isBenchmarkLoading && benchmarkData.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            業界ベンチマーク比較
          </h2>
          <div className="rounded-lg border bg-card p-6">
            <BenchmarkChart data={benchmarkData} />
          </div>
        </section>
      )}
    </div>
  );
}
