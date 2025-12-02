'use client';

import { use } from 'react';
import Link from 'next/link';
import { useProposal, useExportProposal } from '@/hooks/useProposal';
import { ProposalViewer } from '@/components/proposal/ProposalViewer';
import { Loader2, AlertCircle } from 'lucide-react';

/**
 * 提案レポートページプロパティ
 */
interface ProposalPageProps {
  params: Promise<{
    id: string;
  }>;
}

/**
 * 提案レポートページ
 *
 * 提案書全文を表示し、PDF/Excelエクスポート機能を提供。
 * 生成中の場合は進捗を表示。
 *
 * @param props - ページプロパティ
 * @returns 提案レポートページコンポーネント
 */
export default function ProposalPage({ params }: ProposalPageProps) {
  const { id } = use(params);
  const { data: proposal, isLoading, error } = useProposal(id);
  const { exportToPDF, exportToExcel } = useExportProposal(id);

  /**
   * PDFエクスポートハンドラ
   */
  const handleExportPDF = async () => {
    try {
      await exportToPDF();
    } catch (error) {
      console.error('PDFエクスポートエラー:', error);
      alert('PDFのエクスポートに失敗しました');
    }
  };

  /**
   * Excelエクスポートハンドラ
   */
  const handleExportExcel = async () => {
    try {
      await exportToExcel();
    } catch (error) {
      console.error('Excelエクスポートエラー:', error);
      alert('Excelのエクスポートに失敗しました');
    }
  };

  // ローディング状態
  if (isLoading) {
    return (
      <div className="container py-10">
        <div className="flex flex-col items-center justify-center h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium text-muted-foreground">
            提案書を読み込んでいます...
          </p>
        </div>
      </div>
    );
  }

  // エラー状態
  if (error || !proposal) {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            提案書の取得に失敗しました
          </h2>
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

  // 生成中状態
  if (proposal.status === 'generating') {
    return (
      <div className="container py-10">
        <div className="rounded-lg border bg-card p-8">
          <div className="text-center mb-8">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">提案書を生成中です</h2>
            <p className="text-muted-foreground">
              AIが経営改善提案書を作成しています。しばらくお待ちください。
            </p>
          </div>

          {/* 進捗バー（簡易版） */}
          <div className="max-w-md mx-auto">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
            </div>
          </div>

          {/* 生成中のヒント */}
          <div className="mt-8 text-sm text-muted-foreground text-center">
            <p>通常、提案書の生成には1-3分かかります</p>
            <p className="mt-2">
              このページを開いたまま、自動的に更新されるまでお待ちください
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 失敗状態
  if (proposal.status === 'failed') {
    return (
      <div className="container py-10">
        <div className="rounded-lg border border-destructive/50 bg-destructive/5 p-8 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">提案書の生成に失敗しました</h2>
          <p className="text-muted-foreground mb-4">
            {proposal.error || '不明なエラーが発生しました'}
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href={`/analysis/${proposal.analysisId}`}
              className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
            >
              分析結果に戻る
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 完了状態 - 提案書表示
  return (
    <div className="container max-w-4xl py-10">
      <ProposalViewer
        proposal={proposal}
        onExportPDF={handleExportPDF}
        onExportExcel={handleExportExcel}
      />
    </div>
  );
}
