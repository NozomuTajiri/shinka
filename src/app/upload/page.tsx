'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileDropzone } from '@/components/upload/FileDropzone';
import { useUploadFinancialStatement } from '@/hooks/useAnalysis';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

/**
 * 決算書アップロードページ
 *
 * ファイルドロップゾーンを表示し、決算書のアップロードを処理。
 * アップロード成功後、分析結果ページにリダイレクト。
 *
 * @returns アップロードページコンポーネント
 */
export default function UploadPage() {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [fiscalYear, setFiscalYear] = useState('');
  const [progress, setProgress] = useState(0);

  const uploadMutation = useUploadFinancialStatement();

  /**
   * ファイル選択ハンドラ
   */
  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
  };

  /**
   * アップロード実行ハンドラ
   */
  const handleUpload = async () => {
    if (!selectedFile || !companyName || !fiscalYear) {
      return;
    }

    // 進捗をシミュレート（実際のAPIでは不要）
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    try {
      const result = await uploadMutation.mutateAsync({
        file: selectedFile,
        companyName,
        fiscalYear,
      });

      // 完了
      clearInterval(progressInterval);
      setProgress(100);

      // 2秒後に分析結果ページへリダイレクト
      setTimeout(() => {
        router.push(`/analysis/${result.analysisId}`);
      }, 2000);
    } catch (error) {
      clearInterval(progressInterval);
      setProgress(0);
    }
  };

  /**
   * フォームバリデーション
   */
  const isFormValid = selectedFile && companyName.trim() && fiscalYear.trim();

  return (
    <div className="container max-w-4xl py-10">
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          決算書アップロード
        </h1>
        <p className="text-muted-foreground">
          決算書をアップロードして、AI財務分析を開始します
        </p>
      </div>

      {/* アップロードフォーム */}
      <div className="space-y-8">
        {/* 企業情報入力 */}
        <div className="rounded-lg border bg-card p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">企業情報</h2>

          {/* 企業名 */}
          <div className="space-y-2">
            <label
              htmlFor="companyName"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              企業名
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              id="companyName"
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="株式会社サンプル"
              disabled={uploadMutation.isPending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          {/* 決算年度 */}
          <div className="space-y-2">
            <label
              htmlFor="fiscalYear"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              決算年度
              <span className="text-destructive ml-1">*</span>
            </label>
            <input
              id="fiscalYear"
              type="text"
              value={fiscalYear}
              onChange={(e) => setFiscalYear(e.target.value)}
              placeholder="2023年度"
              disabled={uploadMutation.isPending}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        {/* ファイルアップロード */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">決算書ファイル</h2>
          <FileDropzone
            onFileSelect={handleFileSelect}
            isUploading={uploadMutation.isPending}
            progress={progress}
          />
        </div>

        {/* エラーメッセージ */}
        {uploadMutation.isError && (
          <div className="flex items-center gap-2 text-destructive border border-destructive/50 rounded-lg p-4 bg-destructive/5">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">アップロードに失敗しました</p>
              <p className="text-sm">
                {uploadMutation.error?.message ||
                  '不明なエラーが発生しました'}
              </p>
            </div>
          </div>
        )}

        {/* 成功メッセージ */}
        {uploadMutation.isSuccess && (
          <div className="flex items-center gap-2 text-green-600 border border-green-600/50 rounded-lg p-4 bg-green-600/5">
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">アップロードが完了しました</p>
              <p className="text-sm">分析結果ページにリダイレクトします...</p>
            </div>
          </div>
        )}

        {/* アップロードボタン */}
        <button
          onClick={handleUpload}
          disabled={!isFormValid || uploadMutation.isPending}
          className={`
            w-full inline-flex items-center justify-center rounded-md px-8 py-3 text-sm font-medium shadow transition-colors
            ${
              !isFormValid || uploadMutation.isPending
                ? 'bg-muted text-muted-foreground cursor-not-allowed'
                : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }
          `}
        >
          {uploadMutation.isPending
            ? 'アップロード中...'
            : '分析を開始する'}
        </button>
      </div>
    </div>
  );
}
