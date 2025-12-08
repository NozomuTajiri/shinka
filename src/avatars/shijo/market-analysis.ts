/**
 * 市場分析フレームワーク
 */

import type { MarketAnalysis, Trend, MarketSegment, Competitor } from './types.js';

export interface AnalysisFramework {
  id: string;
  name: string;
  description: string;
  steps: AnalysisStep[];
}

export interface AnalysisStep {
  order: number;
  name: string;
  questions: string[];
  outputs: string[];
}

export const MARKET_FRAMEWORKS: AnalysisFramework[] = [
  {
    id: '3c-analysis',
    name: '3C分析',
    description: '顧客・競合・自社の3視点から市場を分析',
    steps: [
      {
        order: 1,
        name: 'Customer（顧客）分析',
        questions: [
          'ターゲット顧客は誰ですか？',
          '顧客の主要なニーズは何ですか？',
          '購買決定のプロセスは？',
        ],
        outputs: ['顧客セグメント', 'ニーズマップ'],
      },
      {
        order: 2,
        name: 'Competitor（競合）分析',
        questions: [
          '主要な競合は誰ですか？',
          '競合の強み・弱みは？',
          '競合の戦略は何ですか？',
        ],
        outputs: ['競合マップ', '競合比較表'],
      },
      {
        order: 3,
        name: 'Company（自社）分析',
        questions: [
          '自社の強み・弱みは？',
          '独自の資産・能力は？',
          'どこで差別化できますか？',
        ],
        outputs: ['強み・弱み分析', '差別化ポイント'],
      },
    ],
  },
  {
    id: 'stp-analysis',
    name: 'STP分析',
    description: 'セグメンテーション・ターゲティング・ポジショニング',
    steps: [
      {
        order: 1,
        name: 'Segmentation（市場細分化）',
        questions: [
          '市場をどのような軸で分けられますか？',
          '各セグメントの規模・成長性は？',
          'セグメントごとのニーズの違いは？',
        ],
        outputs: ['セグメント定義', 'セグメント評価'],
      },
      {
        order: 2,
        name: 'Targeting（標的市場選定）',
        questions: [
          'どのセグメントを狙いますか？',
          'なぜそのセグメントなのですか？',
          'リソースは十分ですか？',
        ],
        outputs: ['ターゲットセグメント', '選定理由'],
      },
      {
        order: 3,
        name: 'Positioning（ポジショニング）',
        questions: [
          '顧客にどう認識されたいですか？',
          '競合との違いは何ですか？',
          'その違いは持続可能ですか？',
        ],
        outputs: ['ポジショニングマップ', 'ポジショニングステートメント'],
      },
    ],
  },
  {
    id: 'neo-market-in',
    name: 'ネオ・マーケットイン',
    description: '潜在ニーズを発見し、新市場を創造する',
    steps: [
      {
        order: 1,
        name: '表層ニーズの把握',
        questions: [
          '顧客が言葉にしているニーズは？',
          '既存製品・サービスへの不満は？',
          '代替手段として何を使っていますか？',
        ],
        outputs: ['表層ニーズリスト', '不満・課題リスト'],
      },
      {
        order: 2,
        name: '深層ニーズの発見',
        questions: [
          'なぜそのニーズがあるのですか？',
          '本当に解決したいことは何ですか？',
          '理想の状態とは？',
        ],
        outputs: ['深層ニーズ仮説', 'ジョブ・トゥ・ビー・ダン'],
      },
      {
        order: 3,
        name: '新価値の創造',
        questions: [
          '今までにない解決策は？',
          '顧客が気づいていない価値は？',
          '新しい市場カテゴリを作れますか？',
        ],
        outputs: ['新価値提案', '新市場定義'],
      },
    ],
  },
];

export function getFramework(id: string): AnalysisFramework | undefined {
  return MARKET_FRAMEWORKS.find(f => f.id === id);
}

export function analyzeTrendImpact(trend: Trend, business: string): {
  opportunities: string[];
  threats: string[];
  recommendations: string[];
} {
  // トレンドのビジネスへの影響を分析
  return {
    opportunities: [`${trend.name}を活用した新サービス開発`],
    threats: [`${trend.name}への対応遅れによる競争力低下`],
    recommendations: [`${trend.timeline}までに${trend.name}対応の戦略を策定`],
  };
}

export function evaluateSegmentAttractiveness(segment: MarketSegment): {
  score: number;
  factors: Record<string, number>;
  recommendation: string;
} {
  // セグメントの魅力度を評価
  const factors: Record<string, number> = {
    size: segment.size > 100 ? 5 : segment.size > 50 ? 4 : 3,
    needs: segment.needs.length > 3 ? 5 : 3,
    reachability: segment.reachability === 'easy' ? 5 : segment.reachability === 'moderate' ? 3 : 1,
    painPoints: segment.painPoints.length > 2 ? 5 : 3,
  };

  const score = Object.values(factors).reduce((a, b) => a + b, 0) / Object.keys(factors).length;

  return {
    score: Math.round(score * 20), // 100点満点に変換
    factors,
    recommendation: score >= 4 ? '優先ターゲット' : score >= 3 ? '検討対象' : '優先度低',
  };
}

export function compareCompetitors(competitors: Competitor[]): {
  leader: Competitor | null;
  ourPosition: string;
  gaps: string[];
  opportunities: string[];
} {
  const sorted = [...competitors].sort((a, b) => b.marketShare - a.marketShare);
  const leader = sorted[0] || null;

  return {
    leader,
    ourPosition: 'チャレンジャー', // 実際は自社データと比較
    gaps: leader ? leader.strengths : [],
    opportunities: sorted.flatMap(c => c.weaknesses),
  };
}
