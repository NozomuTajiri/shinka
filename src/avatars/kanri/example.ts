/**
 * KANRI Avatar 使用例
 *
 * マネジメント課題の相談から具体的なアクションプランまでの完全な流れ
 */

import { KanriAvatar } from './index.js';
import type { TeamMember } from './types.js';

/**
 * 例1: 権限委譲の相談
 */
async function exampleDelegation() {
  console.log('=== 例1: 権限委譲の相談 ===\n');

  const kanri = new KanriAvatar();
  const session = kanri.startSession('mgr-001', 'delegation');

  // チームメンバー情報を登録
  const member: TeamMember = {
    id: 'member-001',
    name: '田中太郎',
    role: 'ジュニアエンジニア',
    tenure: '6ヶ月',
    strengths: ['フロントエンド開発', 'デザインセンス', '学習意欲が高い'],
    developmentAreas: ['バックエンド知識', '設計スキル', '自律性'],
    motivators: ['新しい技術習得', '裁量を持つ', '成果が見える'],
    communicationStyle: '質問が多い、確認を求める傾向',
    currentProjects: ['LP改修', 'コンポーネント実装'],
    oneOnOneNotes: [],
  };

  kanri.addTeamMember(session.sessionId, member);

  // 対話1: 悩みの共有
  const response1 = await kanri.processMessage(
    session.sessionId,
    '新人にもっとタスクを任せたいのですが、失敗が怖くて自分でやってしまいます'
  );

  console.log('マネージャー: 新人にもっとタスクを任せたいのですが、失敗が怖くて自分でやってしまいます\n');
  console.log(`管理: ${response1.response}\n`);
  console.log(`推奨フレームワーク: ${response1.framework}\n`);

  // 対話2: 具体的なタスクの相談
  const response2 = await kanri.processMessage(
    session.sessionId,
    'ユーザー一覧画面の実装を任せようかと思っています'
  );

  console.log('マネージャー: ユーザー一覧画面の実装を任せようかと思っています\n');
  console.log(`管理: ${response2.response}\n`);

  // 権限委譲プランを作成
  const delegationPlan = await kanri.createDelegationPlan(
    session.sessionId,
    'ユーザー一覧画面の実装',
    'APIからユーザーデータを取得し、一覧表示する画面を作成。検索・ソート機能も含む。'
  );

  console.log('【権限委譲プラン】');
  console.log(`委譲先: ${delegationPlan.delegateTo}`);
  console.log(`理由: ${delegationPlan.reason}`);
  console.log(`サポートレベル: ${delegationPlan.supportLevel}`);
  console.log('成功基準:');
  delegationPlan.successCriteria.forEach((c, i) => console.log(`  ${i + 1}. ${c}`));
  console.log('リスク軽減策:');
  delegationPlan.riskMitigation.forEach((r, i) => console.log(`  ${i + 1}. ${r}`));
  console.log('\n');
}

/**
 * 例2: チームのモチベーション低下
 */
async function exampleTeamMotivation() {
  console.log('=== 例2: チームのモチベーション低下 ===\n');

  const kanri = new KanriAvatar();
  const session = kanri.startSession('mgr-002', 'motivation');

  // 対話
  const response = await kanri.processMessage(
    session.sessionId,
    '最近チームのモチベーションが下がっている気がします。ミーティングでも発言が少なくて...'
  );

  console.log('マネージャー: 最近チームのモチベーションが下がっている気がします。ミーティングでも発言が少なくて...\n');
  console.log(`管理: ${response.response}\n`);

  // チーム開発プランを作成
  const teamPlan = await kanri.createTeamDevelopmentPlan(
    session.sessionId,
    '開発チームA',
    {
      psychologicalSafety: 55,
      clarity: 70,
      engagement: 60,
      collaboration: 65,
      performance: 75,
    }
  );

  console.log('【チーム開発プラン】');
  console.log(`チーム名: ${teamPlan.teamName}`);
  console.log(`現在の総合スコア: ${teamPlan.currentState.overallScore}/100`);
  console.log(`目標スコア（3ヶ月後）: ${teamPlan.targetState.overallScore}/100`);
  console.log('\n改善施策:');
  teamPlan.initiatives.forEach((init, i) => {
    console.log(`\n${i + 1}. ${init.name}`);
    console.log(`   目的: ${init.objective}`);
    console.log(`   担当: ${init.owner}`);
    console.log(`   期間: ${init.timeline}`);
    console.log('   アクション:');
    init.actions.forEach(action => console.log(`     - ${action}`));
  });
  console.log('\n');
}

/**
 * 例3: コンフリクト解決
 */
async function exampleConflictResolution() {
  console.log('=== 例3: コンフリクト解決 ===\n');

  const kanri = new KanriAvatar();

  const resolution = await kanri.createConflictResolutionPlan(
    ['田中エンジニア', '佐藤エンジニア'],
    'コードレビューの指摘方法で対立。田中さんは細かい指摘が多く、佐藤さんは指摘が厳しすぎると感じている。'
  );

  console.log('【コンフリクト解決プラン】');
  console.log(`当事者: ${resolution.parties.join(' & ')}`);
  console.log(`コンフリクトの性質: ${resolution.nature}`);
  console.log(`根本原因: ${resolution.rootCause}`);
  console.log(`解決アプローチ: ${resolution.approach}`);
  console.log('\n解決ステップ:');
  resolution.steps.forEach(step => {
    console.log(`\nステップ${step.order}: ${step.action}`);
    console.log(`  担当: ${step.responsible}`);
    console.log(`  期限: ${step.timeline}`);
    console.log(`  状態: ${step.status}`);
  });
  console.log('\n');
}

/**
 * 例4: 1on1の準備
 */
async function exampleOneOnOnePreparation() {
  console.log('=== 例4: 1on1の準備 ===\n');

  const kanri = new KanriAvatar();
  const session = kanri.startSession('mgr-003', 'general');

  // チームメンバー登録（1on1履歴あり）
  const member: TeamMember = {
    id: 'member-002',
    name: '鈴木花子',
    role: 'シニアエンジニア',
    tenure: '3年',
    strengths: ['技術力', 'メンタリング', '問題解決力'],
    developmentAreas: ['リーダーシップ', '対外発信'],
    motivators: ['技術的挑戦', 'チーム貢献', '裁量'],
    communicationStyle: '簡潔、結論から話す',
    currentProjects: ['基盤改善', 'メンバー育成'],
    oneOnOneNotes: [
      {
        date: new Date('2024-11-08'),
        topics: ['新しいアーキテクチャ導入', 'キャリアパス'],
        actionItems: ['技術選定資料作成', 'テックリード面談設定'],
        mood: 'positive',
        followUp: ['技術選定の進捗確認', 'テックリード面談の感想'],
      },
    ],
  };

  kanri.addTeamMember(session.sessionId, member);

  const agenda = await kanri.generateOneOnOneAgenda(session.sessionId, member.id);

  console.log('【1on1アジェンダ】');
  console.log(`対象: ${member.name}\n`);
  console.log('前回のアクションアイテム:');
  agenda.previousActionItems.forEach((item, i) => console.log(`  ${i + 1}. ${item}`));
  console.log('\n今回のトピック:');
  agenda.topics.forEach((topic, i) => console.log(`  ${i + 1}. ${topic}`));
  console.log('\n質問例:');
  agenda.questions.forEach((q, i) => console.log(`  ${i + 1}. ${q}`));
  console.log('\n');
}

/**
 * すべての例を実行
 */
async function runAllExamples() {
  try {
    await exampleDelegation();
    await exampleTeamMotivation();
    await exampleConflictResolution();
    await exampleOneOnOnePreparation();

    console.log('=== 完了 ===');
    console.log('すべての例が正常に実行されました。');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行（必要に応じてコメントを外す）
// runAllExamples();

export {
  exampleDelegation,
  exampleTeamMotivation,
  exampleConflictResolution,
  exampleOneOnOnePreparation,
};
