'use client';

import {
  Radar,
  RadarChart as RechartsRadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

/**
 * レーダーチャートデータポイント型
 */
interface RadarDataPoint {
  /** 指標名 */
  subject: string;
  /** 自社値 (0-100) */
  company: number;
  /** 業界平均値 (0-100) */
  industryAverage: number;
  /** 上位25%値 (0-100) */
  topQuartile: number;
}

/**
 * レーダーチャートプロパティ
 */
interface RadarChartProps {
  /** チャートデータ */
  data: RadarDataPoint[];
  /** 高さ（オプション、デフォルト400px） */
  height?: number;
}

/**
 * レーダーチャートコンポーネント
 *
 * 財務指標の4つの視点（収益性、安全性、効率性、成長性）を
 * レーダーチャートで可視化。
 *
 * @param props - コンポーネントプロパティ
 * @returns レーダーチャート
 */
export function RadarChart({ data, height = 400 }: RadarChartProps) {
  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={height}>
        <RechartsRadarChart data={data}>
          {/* グリッド */}
          <PolarGrid strokeDasharray="3 3" />

          {/* 角度軸（指標名） */}
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
          />

          {/* 半径軸（0-100） */}
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: 'hsl(var(--muted-foreground))' }}
          />

          {/* ツールチップ */}
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '0.5rem',
              padding: '0.75rem',
            }}
            labelStyle={{
              color: 'hsl(var(--foreground))',
              fontWeight: 600,
              marginBottom: '0.5rem',
            }}
            formatter={(value: number) => `${value.toFixed(1)}点`}
          />

          {/* 凡例 */}
          <Legend
            wrapperStyle={{
              paddingTop: '1rem',
            }}
          />

          {/* 上位25%ライン */}
          <Radar
            name="上位25%"
            dataKey="topQuartile"
            stroke="hsl(var(--muted-foreground))"
            fill="hsl(var(--muted))"
            fillOpacity={0.3}
            strokeDasharray="5 5"
          />

          {/* 業界平均ライン */}
          <Radar
            name="業界平均"
            dataKey="industryAverage"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.3}
          />

          {/* 自社ライン */}
          <Radar
            name="自社"
            dataKey="company"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.5}
            strokeWidth={2}
          />
        </RechartsRadarChart>
      </ResponsiveContainer>

      {/* 補足情報 */}
      <div className="mt-4 text-sm text-muted-foreground">
        <p>
          各指標は0-100点で正規化されています。
          青色が自社、オレンジ色が業界平均、グレーが上位25%の値を示します。
        </p>
      </div>
    </div>
  );
}
