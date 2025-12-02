'use client';

import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

/**
 * 指標カードプロパティ
 */
interface MetricsCardProps {
  /** 指標名 */
  title: string;
  /** 指標値 */
  value: number;
  /** 単位 */
  unit: string;
  /** 前年比（オプション） */
  change?: number;
  /** 業界平均（オプション） */
  industryAverage?: number;
  /** カラーテーマ */
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

/**
 * 指標カードコンポーネント
 *
 * 財務指標を視覚的に表示するカードコンポーネント。
 * 前年比、業界平均との比較を含む。
 *
 * @param props - コンポーネントプロパティ
 * @returns 指標カード
 */
export function MetricsCard({
  title,
  value,
  unit,
  change,
  industryAverage,
  variant = 'default',
}: MetricsCardProps) {
  /**
   * トレンドアイコンを取得
   */
  const getTrendIcon = () => {
    if (change === undefined) return null;

    if (change > 0) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (change < 0) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    }
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  /**
   * トレンドテキストカラーを取得
   */
  const getTrendColor = () => {
    if (change === undefined) return '';

    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-muted-foreground';
  };

  /**
   * カードボーダーカラーを取得
   */
  const getBorderColor = () => {
    switch (variant) {
      case 'success':
        return 'border-l-4 border-l-green-600';
      case 'warning':
        return 'border-l-4 border-l-yellow-600';
      case 'danger':
        return 'border-l-4 border-l-red-600';
      default:
        return '';
    }
  };

  return (
    <div
      className={`rounded-lg border bg-card text-card-foreground shadow-sm p-6 ${getBorderColor()}`}
    >
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        {getTrendIcon()}
      </div>

      {/* メイン値 */}
      <div className="mb-4">
        <p className="text-3xl font-bold">
          {value.toLocaleString('ja-JP', {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1,
          })}
          <span className="text-lg text-muted-foreground ml-1">{unit}</span>
        </p>
      </div>

      {/* サブ情報 */}
      <div className="space-y-2">
        {/* 前年比 */}
        {change !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">前年比</span>
            <span className={`font-medium ${getTrendColor()}`}>
              {change > 0 ? '+' : ''}
              {change.toFixed(1)}%
            </span>
          </div>
        )}

        {/* 業界平均 */}
        {industryAverage !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">業界平均</span>
            <span className="font-medium">
              {industryAverage.toFixed(1)}
              {unit}
            </span>
          </div>
        )}

        {/* 業界平均との差分 */}
        {industryAverage !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">業界平均比</span>
              <span
                className={`font-medium ${
                  value > industryAverage
                    ? 'text-green-600'
                    : value < industryAverage
                      ? 'text-red-600'
                      : 'text-muted-foreground'
                }`}
              >
                {value > industryAverage ? '+' : ''}
                {(value - industryAverage).toFixed(1)}
                {unit}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
