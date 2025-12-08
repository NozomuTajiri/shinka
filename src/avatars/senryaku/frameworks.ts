/**
 * 戦略フレームワーク集
 *
 * 付加価値経営®に基づく戦略フレームワーク
 */

import type { StrategicFramework } from './types.js';

export const STRATEGIC_FRAMEWORKS: StrategicFramework[] = [
  {
    id: 'value-based-management',
    name: '付加価値経営®フレームワーク',
    description: '6つの価値を軸に経営を統合的に設計する',
    applicableScenarios: ['経営改革', '中期計画策定', '事業再構築'],
    steps: [
      {
        order: 1,
        name: 'ビジョン価値の明確化',
        description: '企業の存在意義と目指す姿を定義',
        questions: [
          '10年後、どのような会社になっていたいですか？',
          '社会にどのような価値を提供し続けたいですか？',
        ],
        outputs: ['ビジョンステートメント', 'パーパス定義'],
      },
      {
        order: 2,
        name: '戦略価値の設計',
        description: 'ビジョン実現のための戦略を構築',
        questions: [
          '主力事業の競争優位性は何ですか？',
          '新たな成長エンジンをどこに求めますか？',
        ],
        outputs: ['戦略マップ', 'ポートフォリオ分析'],
      },
      {
        order: 3,
        name: '実行価値の強化',
        description: '戦略を実行する組織能力を構築',
        questions: [
          '戦略実行の最大のボトルネックは何ですか？',
          'PDCAサイクルは機能していますか？',
        ],
        outputs: ['実行計画', 'KPIツリー'],
      },
      {
        order: 4,
        name: '人材価値の最大化',
        description: '人的資本を戦略資産として活用',
        questions: [
          'どのような人材が今後必要ですか？',
          '人材育成の仕組みは整っていますか？',
        ],
        outputs: ['人材ポートフォリオ', '育成計画'],
      },
      {
        order: 5,
        name: 'イノベーション価値の創出',
        description: '持続的な価値創造の仕組みを構築',
        questions: [
          'イノベーションを阻害する要因は何ですか？',
          '新規事業創出の体制はありますか？',
        ],
        outputs: ['イノベーション戦略', 'R&D計画'],
      },
      {
        order: 6,
        name: '顧客価値の深化',
        description: '顧客との関係を深め収益を最大化',
        questions: [
          '最も大切な顧客セグメントは誰ですか？',
          '顧客ロイヤルティを高める施策は？',
        ],
        outputs: ['顧客戦略', 'CX設計'],
      },
    ],
  },
  {
    id: 'decision-matrix',
    name: '戦略的意思決定マトリクス',
    description: '複雑な意思決定を構造化して分析',
    applicableScenarios: ['重要投資判断', 'M&A検討', '事業撤退判断'],
    steps: [
      {
        order: 1,
        name: '選択肢の明確化',
        description: '検討すべき選択肢を洗い出す',
        questions: [
          '現実的な選択肢は何がありますか？',
          '「何もしない」選択肢のリスクは？',
        ],
        outputs: ['選択肢リスト'],
      },
      {
        order: 2,
        name: '評価基準の設定',
        description: '判断基準と重み付けを決定',
        questions: [
          '最も重視する評価軸は何ですか？',
          '譲れない条件はありますか？',
        ],
        outputs: ['評価基準表'],
      },
      {
        order: 3,
        name: 'リスク分析',
        description: '各選択肢のリスクを評価',
        questions: [
          '最悪のシナリオは何ですか？',
          'リスク軽減策はありますか？',
        ],
        outputs: ['リスクマトリクス'],
      },
      {
        order: 4,
        name: '統合評価',
        description: '総合的に選択肢を比較評価',
        questions: [
          '直感的にどの選択肢に傾いていますか？',
          '決断を妨げているものは何ですか？',
        ],
        outputs: ['意思決定レポート'],
      },
    ],
  },
  {
    id: 'scenario-planning',
    name: 'シナリオプランニング',
    description: '不確実な未来に備える複数シナリオを構築',
    applicableScenarios: ['中長期計画', '危機対応計画', '市場変化対応'],
    steps: [
      {
        order: 1,
        name: '不確実性要因の特定',
        description: '事業に影響を与える外部要因を分析',
        questions: [
          '最も不確実な外部要因は何ですか？',
          'コントロール可能な要因は？',
        ],
        outputs: ['不確実性マップ'],
      },
      {
        order: 2,
        name: 'シナリオ構築',
        description: '複数の未来シナリオを描く',
        questions: [
          '最も楽観的なシナリオは？',
          '最も悲観的なシナリオは？',
        ],
        outputs: ['シナリオ記述書'],
      },
      {
        order: 3,
        name: '戦略オプション設計',
        description: '各シナリオへの対応策を検討',
        questions: [
          '共通して有効な施策はありますか？',
          'シナリオ固有の対応策は？',
        ],
        outputs: ['戦略オプション表'],
      },
      {
        order: 4,
        name: 'モニタリング設計',
        description: 'シナリオ発生の兆候を監視',
        questions: [
          'どの指標を監視すべきですか？',
          '戦略変更のトリガーは？',
        ],
        outputs: ['モニタリング計画'],
      },
    ],
  },
];

export function getFramework(id: string): StrategicFramework | undefined {
  return STRATEGIC_FRAMEWORKS.find(f => f.id === id);
}

export function getApplicableFrameworks(scenario: string): StrategicFramework[] {
  return STRATEGIC_FRAMEWORKS.filter(f =>
    f.applicableScenarios.some(s =>
      s.includes(scenario) || scenario.includes(s)
    )
  );
}

export function getFrameworkQuestions(frameworkId: string, stepOrder: number): string[] {
  const framework = getFramework(frameworkId);
  if (!framework) return [];

  const step = framework.steps.find(s => s.order === stepOrder);
  return step?.questions || [];
}
