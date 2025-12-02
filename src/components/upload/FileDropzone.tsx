'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * ファイルドロップゾーンプロパティ
 */
interface FileDropzoneProps {
  /** ファイル選択時のコールバック */
  onFileSelect: (file: File) => void;
  /** アップロード中フラグ */
  isUploading?: boolean;
  /** アップロード進捗 (0-100) */
  progress?: number;
}

/**
 * ファイルドロップゾーンコンポーネント
 *
 * ドラッグ&ドロップまたはクリックでファイルを選択可能。
 * PDF、Excel、CSV形式に対応。
 *
 * @param props - コンポーネントプロパティ
 * @returns ファイルドロップゾーン
 */
export function FileDropzone({
  onFileSelect,
  isUploading = false,
  progress = 0,
}: FileDropzoneProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * ファイルドロップハンドラ
   */
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: any[]) => {
      setError(null);

      // 拒否されたファイルがある場合
      if (rejectedFiles.length > 0) {
        const rejection = rejectedFiles[0];
        if (rejection.errors[0]?.code === 'file-too-large') {
          setError('ファイルサイズは10MB以下にしてください');
        } else if (rejection.errors[0]?.code === 'file-invalid-type') {
          setError('PDF、Excel、CSV形式のファイルのみアップロード可能です');
        } else {
          setError('ファイルの選択に失敗しました');
        }
        return;
      }

      // 受け入れられたファイル
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  /**
   * react-dropzone設定
   */
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    // 受け入れるファイルタイプ
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'text/csv': ['.csv'],
    },
    // 最大ファイルサイズ: 10MB
    maxSize: 10 * 1024 * 1024,
    // 1ファイルのみ
    multiple: false,
    // アップロード中は無効化
    disabled: isUploading,
  });

  /**
   * ファイル選択解除ハンドラ
   */
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
  };

  /**
   * ファイルサイズを人間が読みやすい形式に変換
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full">
      {/* ドロップゾーン */}
      {!selectedFile && (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
            transition-colors duration-200
            ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="flex flex-col items-center gap-4">
            <div
              className={`
              rounded-full p-4
              ${isDragActive ? 'bg-primary/20' : 'bg-muted'}
            `}
            >
              <Upload
                className={`h-8 w-8 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </div>

            <div>
              <p className="text-lg font-semibold mb-2">
                {isDragActive
                  ? 'ファイルをドロップしてください'
                  : 'ファイルをドラッグ&ドロップ'}
              </p>
              <p className="text-sm text-muted-foreground">
                またはクリックしてファイルを選択
              </p>
            </div>

            <div className="text-xs text-muted-foreground">
              <p>対応形式: PDF, Excel (.xlsx, .xls), CSV</p>
              <p>最大ファイルサイズ: 10MB</p>
            </div>
          </div>
        </div>
      )}

      {/* 選択されたファイル表示 */}
      {selectedFile && (
        <div className="border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary/10 p-3">
                <File className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>

            {!isUploading && (
              <button
                onClick={handleRemoveFile}
                className="rounded-full p-2 hover:bg-muted transition-colors"
                aria-label="ファイルを削除"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* 進捗バー */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">アップロード中...</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* 完了メッセージ */}
          {!isUploading && progress === 100 && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="text-sm font-medium">
                アップロード完了しました
              </span>
            </div>
          )}
        </div>
      )}

      {/* エラーメッセージ */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-destructive border border-destructive/50 rounded-lg p-4 bg-destructive/5">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
