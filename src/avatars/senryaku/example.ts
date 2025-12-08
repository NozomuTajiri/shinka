/**
 * CEOコンサルアバター「戦略」使用例
 *
 * このファイルは実装の使い方を示すサンプルコードです。
 */

import { SenryakuAvatar } from './index.js';
import type { DecisionContext } from './types.js';

/**
 * 例1: 中期経営計画の策定支援
 */
async function example1_StrategicPlanning() {
  console.log('=== 例1: 中期経営計画の策定支援 ===\n');

  const avatar = new SenryakuAvatar();

  // セッション開始
  const session = avatar.startSession('ceo-001', 'planning');
  console.log(`セッション開始: ${session.sessionId}`);
  console.log(`トピック: ${session.topic}\n`);

  // 対話1: 目標設定の相談
  console.log('CEO: 3年後の売上目標を100億円に設定したいのですが、どう思われますか？');
  let result = await avatar.processMessage(
    session.sessionId,
    '3年後の売上目標を100億円に設定したいのですが、どう思われますか？'
  );
  console.log(`戦略: ${result.response}`);
  console.log(`推奨フレームワーク: ${result.suggestedFrameworks.join(', ')}\n`);

  // 対話2: 現状分析
  console.log('CEO: 現在の主力事業は成熟期にあり、新規事業の立ち上げが必要です');
  result = await avatar.processMessage(
    session.sessionId,
    '現在の主力事業は成熟期にあり、新規事業の立ち上げが必要です'
  );
  console.log(`戦略: ${result.response}`);
  console.log(`インサイト数: ${result.insights.length}\n`);

  // 統合報告書生成
  console.log('統合報告書を生成中...\n');
  const report = await avatar.generateIntegratedReport(session.sessionId);
  console.log('エグゼクティブサマリー:');
  console.log(report.executiveSummary);
  console.log(`\n推奨事項: ${report.recommendations.length}件`);
  console.log(`アクションプラン: ${report.actionPlan.length}項目`);
  console.log(`KPI: ${report.kpis.length}指標\n`);
}

/**
 * 例2: M&A意思決定支援
 */
async function example2_MandADecision() {
  console.log('=== 例2: M&A意思決定支援 ===\n');

  const avatar = new SenryakuAvatar();

  // セッション開始
  const session = avatar.startSession('ceo-002', 'decision');

  // 意思決定コンテキストを設定
  const context: DecisionContext = {
    situation: '競合企業A社の買収検討。業界シェア10%を持つ中堅企業。',
    options: [
      {
        id: 'opt-1',
        name: '買収を実行する',
        description: '20億円で買収し、事業統合を進める',
        pros: [
          '市場シェアが15%→25%に拡大',
          '技術・人材の獲得',
          'スケールメリットによるコスト削減',
        ],
        cons: [
          '統合リスク（文化の違い）',
          '既存事業への投資が遅れる',
          'キャッシュフローの悪化',
        ],
        risks: [
          {
            type: 'financial',
            probability: 'medium',
            impact: 'high',
            mitigation: '段階的統合で初期投資を抑える',
          },
          {
            type: 'operational',
            probability: 'high',
            impact: 'medium',
            mitigation: '統合チームを早期に立ち上げ',
          },
        ],
        expectedOutcome: '2年後に統合完了、3年後から収益貢献',
      },
      {
        id: 'opt-2',
        name: '買収を見送る',
        description: '有機的成長に注力する',
        pros: [
          'リスク回避',
          '既存事業への集中投資',
          '財務の健全性維持',
        ],
        cons: [
          '市場シェア拡大の機会損失',
          '競合に先を越される可能性',
        ],
        risks: [
          {
            type: 'strategic',
            probability: 'medium',
            impact: 'medium',
            mitigation: '自社での技術開発を加速',
          },
        ],
        expectedOutcome: '安定成長、年率5-7%成長',
      },
    ],
    constraints: [
      '買収資金20億円（借入含む）',
      'デューデリジェンス期間3ヶ月',
      '取締役会の承認が必要',
    ],
    timeframe: 'short',
    stakeholders: ['取締役会', '主要株主', '金融機関', '現場社員'],
  };

  avatar.setDecisionContext(session.sessionId, context);
  console.log('意思決定コンテキストを設定しました\n');

  // 対話
  console.log('CEO: この買収案件をどう評価すべきでしょうか？');
  const result = await avatar.processMessage(
    session.sessionId,
    'この買収案件をどう評価すべきでしょうか？'
  );
  console.log(`戦略: ${result.response}`);
  console.log(`推奨フレームワーク: ${result.suggestedFrameworks.join(', ')}\n`);
}

/**
 * 例3: シナリオプランニング
 */
async function example3_ScenarioPlanning() {
  console.log('=== 例3: シナリオプランニング ===\n');

  const avatar = new SenryakuAvatar();
  const session = avatar.startSession('ceo-003', 'strategy');

  console.log('CEO: 市場環境が不透明な中、どのように備えるべきでしょうか？');
  const result = await avatar.processMessage(
    session.sessionId,
    '市場環境が不透明な中、どのように備えるべきでしょうか？'
  );
  console.log(`戦略: ${result.response}`);
  console.log(`推奨フレームワーク: ${result.suggestedFrameworks.join(', ')}\n`);
}

/**
 * 例4: ペルソナ情報の確認
 */
function example4_PersonaInfo() {
  console.log('=== 例4: ペルソナ情報の確認 ===\n');

  const avatar = new SenryakuAvatar();
  const persona = avatar.getPersona();

  console.log(`ID: ${persona.id}`);
  console.log(`名前: ${persona.name}`);
  console.log(`役割: ${persona.role}`);
  console.log(`説明: ${persona.description}`);
  console.log('\nコミュニケーションスタイル:');
  console.log(`  トーン: ${persona.communicationStyle.tone}`);
  console.log(`  アプローチ: ${persona.communicationStyle.approach}`);
  console.log(`  原則: ${persona.communicationStyle.principle}`);
  console.log('\n価値観:');
  persona.values.forEach((value, i) => {
    console.log(`  ${i + 1}. ${value}`);
  });
  console.log('\n行動原則:');
  persona.behaviorPrinciples.forEach((principle, i) => {
    console.log(`  ${i + 1}. ${principle}`);
  });
  console.log();
}

/**
 * メイン実行
 */
async function main() {
  try {
    // 例4は同期処理なので最初に実行
    example4_PersonaInfo();

    // APIキーが設定されている場合のみ、AI対話の例を実行
    if (process.env.ANTHROPIC_API_KEY) {
      await example1_StrategicPlanning();
      await example2_MandADecision();
      await example3_ScenarioPlanning();
    } else {
      console.log('注意: ANTHROPIC_API_KEYが設定されていないため、AI対話の例はスキップされます。\n');
      console.log('環境変数を設定して再度実行してください:');
      console.log('export ANTHROPIC_API_KEY=your-api-key\n');
    }
  } catch (error) {
    console.error('エラーが発生しました:', error);
  }
}

// このファイルが直接実行された場合
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  example1_StrategicPlanning,
  example2_MandADecision,
  example3_ScenarioPlanning,
  example4_PersonaInfo,
};
