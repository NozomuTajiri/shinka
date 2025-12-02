'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * 財務指標データ型
 */
export interface FinancialMetrics {
  /** 収益性指標 */
  profitability: {
    /** 売上高営業利益率 (%) */
    operatingProfitMargin: number;
    /** ROE (%) */
    roe: number;
    /** ROA (%) */
    roa: number;
  };
  /** 安全性指標 */
  safety: {
    /** 自己資本比率 (%) */
    equityRatio: number;
    /** 流動比率 (%) */
    currentRatio: number;
    /** 固定比率 (%) */
    fixedRatio: number;
  };
  /** 効率性指標 */
  efficiency: {
    /** 総資本回転率 (回) */
    totalAssetTurnover: number;
    /** 棚卸資産回転率 (回) */
    inventoryTurnover: number;
    /** 売上債権回転率 (回) */
    receivablesTurnover: number;
  };
  /** 成長性指標 */
  growth: {
    /** 売上高成長率 (%) */
    revenueGrowth: number;
    /** 営業利益成長率 (%) */
    operatingProfitGrowth: number;
    /** 総資産成長率 (%) */
    totalAssetGrowth: number;
  };
}

/**
 * 分析結果データ型
 */
export interface AnalysisResult {
  /** 分析ID */
  id: string;
  /** 企業名 */
  companyName: string;
  /** 決算年度 */
  fiscalYear: string;
  /** 財務指標 */
  metrics: FinancialMetrics;
  /** 品質スコア (0-100) */
  qualityScore: number;
  /** 分析完了日時 */
  completedAt: string;
  /** アラート一覧 */
  alerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
  }>;
}

/**
 * ベンチマークデータ型
 */
export interface BenchmarkData {
  /** 業界平均 */
  industryAverage: FinancialMetrics;
  /** 上位25%値 */
  topQuartile: FinancialMetrics;
  /** 自社値 */
  company: FinancialMetrics;
}

/**
 * 分析結果取得フック
 *
 * React Queryを使用して分析結果をフェッチ。
 * 自動リトライ、キャッシング、リフェッチングを提供。
 *
 * @param analysisId - 分析ID
 * @returns 分析結果クエリ
 */
export function useAnalysis(analysisId: string) {
  return useQuery<AnalysisResult>({
    queryKey: ['analysis', analysisId],
    queryFn: async () => {
      const response = await fetch(`/api/analysis/${analysisId}`);

      if (!response.ok) {
        throw new Error('分析結果の取得に失敗しました');
      }

      return response.json();
    },
    // 分析結果は変わらないため、ステイルタイムを長めに設定
    staleTime: 10 * 60 * 1000, // 10分
    // エラー時は3回リトライ
    retry: 3,
  });
}

/**
 * ベンチマークデータ取得フック
 *
 * 業界ベンチマークとの比較データをフェッチ。
 *
 * @param analysisId - 分析ID
 * @returns ベンチマークデータクエリ
 */
export function useBenchmark(analysisId: string) {
  return useQuery<BenchmarkData>({
    queryKey: ['benchmark', analysisId],
    queryFn: async () => {
      const response = await fetch(`/api/analysis/${analysisId}/benchmark`);

      if (!response.ok) {
        throw new Error('ベンチマークデータの取得に失敗しました');
      }

      return response.json();
    },
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * 決算書アップロードミューテーション型
 */
interface UploadMutationVariables {
  /** アップロードファイル */
  file: File;
  /** 企業名 */
  companyName: string;
  /** 決算年度 */
  fiscalYear: string;
}

/**
 * 決算書アップロードフック
 *
 * 決算書ファイルをアップロードし、分析を開始。
 *
 * @returns アップロードミューテーション
 */
export function useUploadFinancialStatement() {
  const queryClient = useQueryClient();

  return useMutation<
    { analysisId: string },
    Error,
    UploadMutationVariables
  >({
    mutationFn: async ({ file, companyName, fiscalYear }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('companyName', companyName);
      formData.append('fiscalYear', fiscalYear);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'アップロードに失敗しました');
      }

      return response.json();
    },
    // 成功時、分析一覧を無効化して再フェッチ
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analyses'] });
    },
  });
}

/**
 * 分析一覧取得フック
 *
 * 全分析結果の一覧を取得。
 *
 * @returns 分析一覧クエリ
 */
export function useAnalyses() {
  return useQuery<AnalysisResult[]>({
    queryKey: ['analyses'],
    queryFn: async () => {
      const response = await fetch('/api/analyses');

      if (!response.ok) {
        throw new Error('分析一覧の取得に失敗しました');
      }

      return response.json();
    },
    staleTime: 1 * 60 * 1000, // 1分
  });
}
