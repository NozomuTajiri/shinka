'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

/**
 * ベンチマークデータポイント型
 */
interface BenchmarkDataPoint {
  /** 指標名 */
  name: string;
  /** 自社値 */
  company: number;
  /** 業界平均値 */
  industryAverage: number;
  /** 上位25%値 */
  topQuartile: number;
}

/**
 * ベンチマーク比較チャートプロパティ
 */
interface BenchmarkChartProps {
  /** チャートデータ */
  data: BenchmarkDataPoint[];
  /** 高さ（オプション、デフォルト400px） */
  height?: number;
}

/**
 * ベンチマーク比較チャートコンポーネント
 *
 * 財務指標を業界平均、上位25%と比較する棒グラフ。
 * 自社が平均より良い場合は緑、悪い場合は赤で表示。
 *
 * @param props - コンポーネントプロパティ
 * @returns ベンチマーク比較チャート
 */
export function BenchmarkChart({ data, height = 400 }: BenchmarkChartProps) {
  /**
   * 自社値の色を決定（業界平均との比較）
   */
  const getCompanyBarColor = (
    companyValue: number,
    industryAverage: number
  ): string => {
    if (companyValue > industryAverage) {
      return '#22c55e'; // 緑（良好）
    } else if (companyValue < industryAverage) {
      return '#ef4444'; // 赤（要改善）
    }
    return '#6b7280'; // グレー（同等）
  };

  /**
   * カスタムツールチップ
   */
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }

    return (
      <div className="rounded-lg border bg-card p-4 shadow-lg">
        <p className="font-semibold mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="text-sm" style={{ color: entry.color }}>
                {entry.name}:
              </span>
              <span className="text-sm font-medium">
                {entry.value.toFixed(1)}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          {/* グリッド */}
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />

          {/* X軸（指標名） */}
          <XAxis
            dataKey="name"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />

          {/* Y軸（値） */}
          <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />

          {/* ツールチップ */}
          <Tooltip content={<CustomTooltip />} />

          {/* 凡例 */}
          <Legend
            wrapperStyle={{
              paddingTop: '1rem',
            }}
          />

          {/* 上位25%バー */}
          <Bar
            name="上位25%"
            dataKey="topQuartile"
            fill="hsl(var(--muted))"
            radius={[4, 4, 0, 0]}
          />

          {/* 業界平均バー */}
          <Bar
            name="業界平均"
            dataKey="industryAverage"
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />

          {/* 自社バー（条件付きカラー） */}
          <Bar
            name="自社"
            dataKey="company"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getCompanyBarColor(entry.company, entry.industryAverage)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {/* 補足情報 */}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          緑色は業界平均を上回る指標、赤色は下回る指標を示します。
          業界平均や上位25%との比較で、改善すべき領域を特定できます。
        </p>
      </div>
    </div>
  );
}
