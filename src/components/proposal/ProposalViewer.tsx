'use client';

import { Download, FileText } from 'lucide-react';
import { Proposal } from '@/hooks/useProposal';

/**
 * 提案書ビューアープロパティ
 */
interface ProposalViewerProps {
  /** 提案書データ */
  proposal: Proposal;
  /** PDFエクスポートハンドラ */
  onExportPDF: () => void;
  /** Excelエクスポートハンドラ */
  onExportExcel: () => void;
}

/**
 * 提案書ビューアーコンポーネント
 *
 * 提案書の全文を表示し、エクスポート機能を提供。
 *
 * @param props - コンポーネントプロパティ
 * @returns 提案書ビューアー
 */
export function ProposalViewer({
  proposal,
  onExportPDF,
  onExportExcel,
}: ProposalViewerProps) {
  return (
    <div className="space-y-8">
      {/* ヘッダー */}
      <div className="flex items-center justify-between pb-6 border-b">
        <div>
          <h1 className="text-3xl font-bold mb-2">経営改善提案書</h1>
          <p className="text-muted-foreground">{proposal.companyName}</p>
        </div>

        {/* エクスポートボタン */}
        <div className="flex gap-3">
          <button
            onClick={onExportPDF}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            PDFエクスポート
          </button>
          <button
            onClick={onExportExcel}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            <Download className="mr-2 h-4 w-4" />
            Excelエクスポート
          </button>
        </div>
      </div>

      {/* エグゼクティブサマリー */}
      <section>
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <FileText className="h-6 w-6 text-primary" />
            <h2 className="text-2xl font-bold">エグゼクティブサマリー</h2>
          </div>
          <div className="prose prose-slate max-w-none">
            <p className="text-base leading-relaxed whitespace-pre-wrap">
              {proposal.executiveSummary}
            </p>
          </div>
        </div>
      </section>

      {/* 提案セクション一覧 */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold">詳細提案</h2>

        {proposal.sections
          .sort((a, b) => b.priority - a.priority)
          .map((section, index) => (
            <div
              key={index}
              className="rounded-lg border bg-card p-6 shadow-sm"
            >
              {/* セクションヘッダー */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">{section.title}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    重要度
                  </span>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-2 w-2 rounded-full ${
                          i < section.priority
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* セクション内容 */}
              <div className="prose prose-slate max-w-none">
                <p className="text-base leading-relaxed whitespace-pre-wrap">
                  {section.content}
                </p>
              </div>
            </div>
          ))}
      </section>

      {/* フッター */}
      <div className="pt-6 border-t text-center text-sm text-muted-foreground">
        <p>
          この提案書は AI により自動生成されています。
          実行前に専門家のレビューを受けることを推奨します。
        </p>
        {proposal.completedAt && (
          <p className="mt-2">
            生成日時: {new Date(proposal.completedAt).toLocaleString('ja-JP')}
          </p>
        )}
      </div>
    </div>
  );
}
