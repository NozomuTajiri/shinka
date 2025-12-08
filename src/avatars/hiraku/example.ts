/**
 * ひらくアバター使用例
 *
 * このファイルは使用方法を示すサンプルコードです。
 * 実際のプロジェクトでは適切な環境で実行してください。
 */

import { HirakuAvatar } from './index.js';
import { getDiagnosisLayer, getAllQuestions } from './diagnosis-model.js';
import { matchAvatarsToIssues } from './avatar-matching.js';
import type { IdentifiedIssue } from './types.js';

/**
 * 基本的な使用例
 */
async function basicExample() {
  console.log('=== ひらくアバター 基本使用例 ===\n');

  // 1. インスタンス作成
  const hiraku = new HirakuAvatar();

  // 2. ペルソナ情報の取得
  const persona = hiraku.getPersona();
  console.log('アバター名:', persona.name);
  console.log('役割:', persona.role);
  console.log('説明:', persona.description);
  console.log('コミュニケーションスタイル:', persona.communicationStyle);
  console.log('');

  // 3. セッション開始
  const session = hiraku.startSession('example-client-001');
  console.log('セッションID:', session.sessionId);
  console.log('開始時刻:', session.startedAt.toISOString());
  console.log('');

  // 4. 診断情報の表示
  const totalQuestions = getAllQuestions();
  console.log('総質問数:', totalQuestions.length);
  console.log('');

  // 5. レイヤー情報の表示
  for (let i = 1; i <= 5; i++) {
    const layer = getDiagnosisLayer(i);
    if (layer) {
      console.log(`Layer ${layer.layer}: ${layer.name}`);
      console.log(`  説明: ${layer.description}`);
      console.log(`  質問数: ${layer.questions.length}`);
    }
  }
  console.log('');
}

/**
 * 対話処理の例
 */
async function conversationExample() {
  console.log('=== 対話処理の例 ===\n');

  const hiraku = new HirakuAvatar();
  const session = hiraku.startSession('conversation-client');

  // シミュレートされたユーザー回答
  const mockAnswers = [
    '経営理念は社内に浸透しておらず、課題を感じています',
    'ビジョンは明確に言語化できていません',
    '価値観は持っているつもりですが、明文化していません',
  ];

  for (const answer of mockAnswers) {
    console.log('ユーザー:', answer);

    try {
      const result = await hiraku.processMessage(session.sessionId, answer);

      console.log('ひらく:', result.response);
      console.log('現在のレイヤー:', result.currentLayer);
      console.log('進捗:', `${result.progress}%`);
      console.log('完了:', result.isComplete ? 'はい' : 'いいえ');
      console.log('');

      if (result.isComplete) {
        const sessionResult = hiraku.getSessionResult(session.sessionId);
        if (sessionResult) {
          console.log('特定された課題数:', sessionResult.issues.length);
          console.log('推薦アバター数:', sessionResult.recommendations.length);
        }
      }
    } catch (error) {
      console.error('エラー:', (error as Error).message);
      console.log('Note: このエラーは環境変数 ANTHROPIC_API_KEY が設定されていない場合に発生します');
      console.log('');
      break;
    }
  }
}

/**
 * アバターマッチングの例
 */
function avatarMatchingExample() {
  console.log('=== アバターマッチングの例 ===\n');

  // サンプル課題データ
  const sampleIssues: IdentifiedIssue[] = [
    {
      id: 'issue-001',
      category: 'vision',
      description: '経営理念が社員に浸透しておらず、組織の方向性が不明確',
      priority: {
        urgency: 5,
        impact: 5,
        resourceRequired: 'high',
        recommendedAction: '専門アバターによる詳細分析を推奨',
      },
      relatedValues: ['ビジョン'],
    },
    {
      id: 'issue-002',
      category: 'talent',
      description: '後継者育成が進んでおらず、将来のリーダー不足が懸念',
      priority: {
        urgency: 4,
        impact: 5,
        resourceRequired: 'high',
        recommendedAction: '専門アバターによる詳細分析を推奨',
      },
      relatedValues: ['人材'],
    },
    {
      id: 'issue-003',
      category: 'customer',
      description: '顧客フィードバックの収集が体系化されていない',
      priority: {
        urgency: 3,
        impact: 4,
        resourceRequired: 'medium',
        recommendedAction: '専門アバターによる詳細分析を推奨',
      },
      relatedValues: ['顧客価値'],
    },
  ];

  // アバターマッチング実行
  const recommendations = matchAvatarsToIssues(sampleIssues);

  console.log('推薦アバター一覧:');
  console.log('');

  recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.avatarName}`);
    console.log(`   マッチスコア: ${rec.matchScore.toFixed(1)}点`);
    console.log(`   推薦理由: ${rec.reason}`);
    console.log(`   推奨アプローチ: ${rec.suggestedApproach}`);
    console.log('');
  });
}

/**
 * 診断モデルの詳細表示
 */
function diagnosisModelDetails() {
  console.log('=== 5層企業診断モデル詳細 ===\n');

  const layers = [1, 2, 3, 4, 5];

  layers.forEach(layerNum => {
    const layer = getDiagnosisLayer(layerNum);
    if (!layer) return;

    console.log(`\n## Layer ${layer.layer}: ${layer.name}`);
    console.log(`説明: ${layer.description}`);
    console.log('\n質問:');

    layer.questions.forEach((q, index) => {
      console.log(`  ${index + 1}. ${q.text}`);
      console.log(`     カテゴリー: ${q.category}`);
      console.log(`     重み: ${q.weight}`);
    });
  });
  console.log('');
}

/**
 * メイン実行関数
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║  ひらく (HIRAKU) アバター - 使用例デモンストレーション    ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  try {
    // 基本例
    await basicExample();
    console.log('─'.repeat(60));
    console.log('');

    // 診断モデル詳細
    diagnosisModelDetails();
    console.log('─'.repeat(60));
    console.log('');

    // アバターマッチング例
    avatarMatchingExample();
    console.log('─'.repeat(60));
    console.log('');

    // 対話例（API呼び出しあり - スキップ可能）
    console.log('Note: 対話処理の例は ANTHROPIC_API_KEY が設定されている場合のみ実行できます');
    console.log('環境変数が設定されている場合、以下のコメントを解除してください:');
    console.log('// await conversationExample();');
    console.log('');
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// 実行方法:
// ts-node src/avatars/hiraku/example.ts
// または
// tsx src/avatars/hiraku/example.ts

export { basicExample, conversationExample, avatarMatchingExample, diagnosisModelDetails, main };
