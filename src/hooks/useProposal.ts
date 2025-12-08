'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

/**
 * 提案セクション型
 */
interface ProposalSection {
  /** セクションタイトル */
  title: string;
  /** セクション内容 */
  content: string;
  /** 重要度 (1-5) */
  priority: number;
}

/**
 * 提案書データ型
 */
export interface Proposal {
  /** 提案書ID */
  id: string;
  /** 分析ID */
  analysisId: string;
  /** 企業名 */
  companyName: string;
  /** 生成ステータス */
  status: 'generating' | 'completed' | 'failed';
  /** エグゼクティブサマリー */
  executiveSummary: string;
  /** 提案セクション一覧 */
  sections: ProposalSection[];
  /** 生成完了日時 */
  completedAt?: string;
  /** エラーメッセージ */
  error?: string;
}

/**
 * 提案書取得フック
 *
 * React Queryを使用して提案書データをフェッチ。
 *
 * @param proposalId - 提案書ID
 * @returns 提案書クエリ
 */
export function useProposal(proposalId: string) {
  return useQuery<Proposal>({
    queryKey: ['proposal', proposalId],
    queryFn: async () => {
      const response = await fetch(`/api/proposals/${proposalId}`);

      if (!response.ok) {
        throw new Error('提案書の取得に失敗しました');
      }

      return response.json();
    },
    // 生成中の場合は5秒ごとにポーリング
    refetchInterval: (query) => {
      return query.state.data?.status === 'generating' ? 5000 : false;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * SSE（Server-Sent Events）による提案書リアルタイム生成フック
 *
 * Server-Sent Eventsを使用して、提案書の生成進捗をリアルタイムで受信。
 *
 * @param proposalId - 提案書ID
 * @returns 提案書データと進捗状態
 */
export function useProposalStream(proposalId: string) {
  const [proposal, setProposal] = useState<Partial<Proposal> | null>(null);
  const [progress, setProgress] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // EventSource（SSE）接続
    const eventSource = new EventSource(
      `/api/proposals/${proposalId}/stream`
    );

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    // 進捗イベント
    eventSource.addEventListener('progress', (event) => {
      const data = JSON.parse(event.data);
      setProgress(data.progress);
    });

    // 提案書更新イベント
    eventSource.addEventListener('proposal', (event) => {
      const data = JSON.parse(event.data);
      setProposal(data);
    });

    // 完了イベント
    eventSource.addEventListener('complete', (event) => {
      const data = JSON.parse(event.data);
      setProposal(data);
      setProgress(100);
      eventSource.close();
    });

    // エラーハンドリング
    eventSource.onerror = () => {
      setError('接続が切断されました');
      setIsConnected(false);
      eventSource.close();
    };

    // クリーンアップ
    return () => {
      eventSource.close();
    };
  }, [proposalId]);

  return {
    proposal,
    progress,
    isConnected,
    error,
  };
}

/**
 * 提案書生成ミューテーション変数型
 */
interface GenerateProposalVariables {
  /** 分析ID */
  analysisId: string;
}

/**
 * 提案書生成フック
 *
 * 分析結果から提案書を生成するミューテーション。
 *
 * @returns 提案書生成ミューテーション
 */
export function useGenerateProposal() {
  return useMutation<{ proposalId: string }, Error, GenerateProposalVariables>({
    mutationFn: async ({ analysisId }) => {
      const response = await fetch('/api/proposals/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysisId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || '提案書生成に失敗しました');
      }

      return response.json();
    },
  });
}

/**
 * 提案書エクスポートフック
 *
 * 提案書をPDF/Excel形式でエクスポート。
 *
 * @param proposalId - 提案書ID
 * @returns エクスポート関数
 */
export function useExportProposal(proposalId: string) {
  const exportToPDF = async () => {
    const response = await fetch(`/api/proposals/${proposalId}/export/pdf`);

    if (!response.ok) {
      throw new Error('PDFエクスポートに失敗しました');
    }

    // Blobとしてダウンロード
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${proposalId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const exportToExcel = async () => {
    const response = await fetch(`/api/proposals/${proposalId}/export/excel`);

    if (!response.ok) {
      throw new Error('Excelエクスポートに失敗しました');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proposal-${proposalId}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return {
    exportToPDF,
    exportToExcel,
  };
}
