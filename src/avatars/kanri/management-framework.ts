/**
 * マネジメントフレームワーク
 */

import type { CoachingQuestion, TeamHealth } from './types.js';

export interface ManagementFramework {
  id: string;
  name: string;
  description: string;
  applicableScenarios: string[];
  steps: FrameworkStep[];
}

export interface FrameworkStep {
  order: number;
  name: string;
  description: string;
  questions: string[];
  tools: string[];
}

export const MANAGEMENT_FRAMEWORKS: ManagementFramework[] = [
  {
    id: 'situational-leadership',
    name: '状況対応型リーダーシップ',
    description: 'メンバーの成熟度に応じてリーダーシップスタイルを変える',
    applicableScenarios: ['新人育成', '権限委譲', 'パフォーマンス管理'],
    steps: [
      {
        order: 1,
        name: 'メンバーの成熟度診断',
        description: 'スキルとモチベーションの両面から評価',
        questions: [
          'このタスクに必要なスキルをどの程度持っていますか？',
          'このタスクへのモチベーションはどうですか？',
          '過去の類似タスクの経験は？',
        ],
        tools: ['成熟度マトリクス'],
      },
      {
        order: 2,
        name: 'リーダーシップスタイル選択',
        description: '指示型/コーチ型/支援型/委任型から選択',
        questions: [
          '現在どの程度の指示が必要ですか？',
          'どの程度のサポートを求めていますか？',
        ],
        tools: ['リーダーシップスタイル診断'],
      },
      {
        order: 3,
        name: 'アプローチ実行とフィードバック',
        description: '選択したスタイルを実行し、調整',
        questions: [
          'このアプローチはうまくいっていますか？',
          '調整が必要な点はありますか？',
        ],
        tools: ['1on1ガイド'],
      },
    ],
  },
  {
    id: 'psychological-safety',
    name: '心理的安全性の構築',
    description: 'チームメンバーが安心して発言できる環境を作る',
    applicableScenarios: ['チーム開発', 'コミュニケーション改善', '失敗からの学習'],
    steps: [
      {
        order: 1,
        name: '現状の心理的安全性を診断',
        description: 'チームの発言のしやすさを評価',
        questions: [
          'ミーティングで全員が発言していますか？',
          '失敗を報告しやすい雰囲気ですか？',
          '反対意見を言いやすいですか？',
        ],
        tools: ['心理的安全性サーベイ'],
      },
      {
        order: 2,
        name: 'リーダー行動の見直し',
        description: '自身の行動が安全性に与える影響を確認',
        questions: [
          '失敗にどう反応していますか？',
          '質問や意見をどう受け止めていますか？',
          '自分の弱みを見せていますか？',
        ],
        tools: ['リーダー行動チェックリスト'],
      },
      {
        order: 3,
        name: '安全性を高める施策実行',
        description: '具体的な行動変容を実践',
        questions: [
          'どんな小さな一歩から始めますか？',
          '定期的なフィードバックの仕組みは？',
        ],
        tools: ['施策実行プラン'],
      },
    ],
  },
  {
    id: 'effective-delegation',
    name: '効果的な権限委譲',
    description: '成長を促しながら成果を出す委譲の方法',
    applicableScenarios: ['権限委譲', '人材育成', '業務効率化'],
    steps: [
      {
        order: 1,
        name: '委譲タスクの選定',
        description: '委譲に適したタスクを特定',
        questions: [
          'どのタスクを委譲できますか？',
          'なぜそのタスクを選びましたか？',
          '委譲することの効果は？',
        ],
        tools: ['委譲可能性マトリクス'],
      },
      {
        order: 2,
        name: '適任者の選定',
        description: '誰に委譲するかを決定',
        questions: [
          '誰が適任ですか？',
          'その人の成長機会になりますか？',
          '必要なサポートは何ですか？',
        ],
        tools: ['メンバースキルマップ'],
      },
      {
        order: 3,
        name: '委譲の実行とフォロー',
        description: '明確な期待設定とサポート',
        questions: [
          '期待値は明確に伝わりましたか？',
          'チェックインのタイミングは？',
          'いつでも相談できる環境ですか？',
        ],
        tools: ['委譲チェックリスト'],
      },
    ],
  },
  {
    id: 'one-on-one-mastery',
    name: '1on1ミーティングの極意',
    description: 'メンバーの成長を促す1on1の進め方',
    applicableScenarios: ['1on1', 'キャリア開発', 'モチベーション管理'],
    steps: [
      {
        order: 1,
        name: '準備と目的設定',
        description: '効果的な1on1のための準備',
        questions: [
          '前回のアクションアイテムの進捗は？',
          '今回話し合いたいテーマは？',
          'メンバーの最近の様子は？',
        ],
        tools: ['1on1準備シート'],
      },
      {
        order: 2,
        name: '傾聴と質問',
        description: 'メンバーの話を引き出す',
        questions: [
          '最近どんなことがありましたか？',
          '何がうまくいっていますか？',
          '困っていることはありますか？',
        ],
        tools: ['質問リスト'],
      },
      {
        order: 3,
        name: 'アクションと成長支援',
        description: '具体的な次のステップを決める',
        questions: [
          '次に取り組みたいことは？',
          '私からのサポートは何が必要ですか？',
          'いつまでに何を達成しますか？',
        ],
        tools: ['アクションプランテンプレート'],
      },
    ],
  },
];

export const COACHING_QUESTIONS: CoachingQuestion[] = [
  {
    category: 'exploration',
    question: '今一番気になっていることは何ですか？',
    purpose: '課題の特定',
    followUps: ['それについてもう少し詳しく教えてください', 'いつ頃からそう感じていますか？'],
  },
  {
    category: 'exploration',
    question: '理想の状態はどのようなものですか？',
    purpose: 'ゴールの明確化',
    followUps: ['それが実現したら何が変わりますか？', '理想の状態を10点とすると今は何点ですか？'],
  },
  {
    category: 'options',
    question: 'どのような選択肢がありそうですか？',
    purpose: '可能性の探索',
    followUps: ['他にはありますか？', 'もし制約がなかったら何をしますか？'],
  },
  {
    category: 'options',
    question: '過去にうまくいった方法はありますか？',
    purpose: '成功体験の活用',
    followUps: ['それを今回に応用できますか？', '何が成功の要因でしたか？'],
  },
  {
    category: 'action',
    question: '最初の一歩として何ができますか？',
    purpose: '行動への落とし込み',
    followUps: ['いつまでにやりますか？', '障害になりそうなことは？'],
  },
  {
    category: 'action',
    question: '私からのサポートで必要なことはありますか？',
    purpose: 'サポートの確認',
    followUps: ['具体的にどんなサポートが欲しいですか？', 'それがあると何が変わりますか？'],
  },
  {
    category: 'reflection',
    question: 'この対話を通じて気づいたことはありますか？',
    purpose: '内省の促進',
    followUps: ['その気づきをどう活かしますか？', '今の気持ちはどうですか？'],
  },
];

export function getFramework(id: string): ManagementFramework | undefined {
  return MANAGEMENT_FRAMEWORKS.find(f => f.id === id);
}

export function getApplicableFrameworks(scenario: string): ManagementFramework[] {
  return MANAGEMENT_FRAMEWORKS.filter(f =>
    f.applicableScenarios.some(s =>
      s.includes(scenario) || scenario.includes(s)
    )
  );
}

export function getCoachingQuestions(category?: string): CoachingQuestion[] {
  if (!category) return COACHING_QUESTIONS;
  return COACHING_QUESTIONS.filter(q => q.category === category);
}

export function assessTeamHealth(scores: Partial<TeamHealth>): TeamHealth {
  const health: TeamHealth = {
    psychologicalSafety: scores.psychologicalSafety ?? 0,
    clarity: scores.clarity ?? 0,
    engagement: scores.engagement ?? 0,
    collaboration: scores.collaboration ?? 0,
    performance: scores.performance ?? 0,
    overallScore: 0,
  };

  const values = [
    health.psychologicalSafety,
    health.clarity,
    health.engagement,
    health.collaboration,
    health.performance,
  ];

  health.overallScore = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  return health;
}

export function suggestDevelopmentFocus(health: TeamHealth): string[] {
  const suggestions: string[] = [];

  if (health.psychologicalSafety < 60) {
    suggestions.push('心理的安全性の向上が最優先です');
  }
  if (health.clarity < 60) {
    suggestions.push('役割と期待値の明確化が必要です');
  }
  if (health.engagement < 60) {
    suggestions.push('メンバーのモチベーション向上に取り組みましょう');
  }
  if (health.collaboration < 60) {
    suggestions.push('チーム内コラボレーションの強化を検討してください');
  }
  if (health.performance < 60) {
    suggestions.push('成果創出のプロセス改善が求められます');
  }

  return suggestions.length > 0 ? suggestions : ['チームは健全な状態です。維持・向上に努めましょう'];
}
