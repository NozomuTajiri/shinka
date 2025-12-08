/**
 * 専門アバター群 デモンストレーション
 *
 * このファイルは専門アバター群の使用例を示します。
 * 実行するには ANTHROPIC_API_KEY 環境変数が必要です。
 */

import { SpecialistAvatarFactory } from '../src/avatars/specialists';
import type { ConsultationRequest } from '../src/avatars/specialists';

async function demonstrateSpecialistAvatars() {
  // API Keyの確認
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('❌ ANTHROPIC_API_KEY環境変数が設定されていません');
    process.exit(1);
  }

  console.log('🌸 専門アバター群デモンストレーション\n');

  // ファクトリーの初期化
  const factory = new SpecialistAvatarFactory(apiKey);

  // 全アバターを作成
  const avatars = factory.createAllAvatars();

  console.log('✅ 6つの専門アバターを初期化しました\n');

  // ========================================
  // 1. SalesAvatar デモ
  // ========================================
  console.log('📊 SalesAvatar（TAKUMI）デモ\n');

  const salesRequest: ConsultationRequest = {
    query: '受注率を向上させるための営業プロセス改善について教えてください',
    companyContext: {
      industry: '製造業',
      size: '中小企業（従業員100名）',
      challenges: ['受注率15%と低い', '営業活動が属人化している'],
    },
    focusValues: ['customer_value', 'business_value'],
  };

  console.log('相談内容:', salesRequest.query);
  const salesResponse = await avatars.sales.consult(salesRequest);
  console.log('\n回答サマリー:');
  console.log(salesResponse.answer.substring(0, 300) + '...\n');
  console.log('推奨アクション:');
  salesResponse.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log(`\n信頼度スコア: ${(salesResponse.confidenceScore * 100).toFixed(1)}%\n`);

  // ========================================
  // 2. MarketingAvatar デモ
  // ========================================
  console.log('📢 MarketingAvatar（AKARI）デモ\n');

  const marketingRequest: ConsultationRequest = {
    query: '新製品のブランドポジショニング戦略を検討したい',
    companyContext: {
      industry: 'IT',
      size: 'スタートアップ（従業員30名）',
      challenges: ['競合が多い', 'ブランド認知度が低い'],
    },
    focusValues: ['brand_value', 'customer_value'],
  };

  console.log('相談内容:', marketingRequest.query);
  const marketingResponse = await avatars.marketing.consult(marketingRequest);
  console.log('\n回答サマリー:');
  console.log(marketingResponse.answer.substring(0, 300) + '...\n');

  // ========================================
  // 3. FinanceAvatar デモ - 財務分析
  // ========================================
  console.log('💰 FinanceAvatar（KAZUKI）デモ - 財務分析\n');

  const financialAnalysis = await avatars.finance.analyzeFinancials({
    revenue: 1000000000, // 10億円
    grossProfit: 400000000,
    operatingProfit: 100000000,
    netProfit: 70000000,
    totalAssets: 800000000,
    totalEquity: 400000000,
    currentAssets: 300000000,
    currentLiabilities: 150000000,
    operatingCashFlow: 120000000,
  });

  console.log('収益性指標:');
  console.log(`  - 売上総利益率: ${financialAnalysis.profitability.grossProfitMargin}%`);
  console.log(`  - 営業利益率: ${financialAnalysis.profitability.operatingProfitMargin}%`);
  console.log(`  - ROE: ${financialAnalysis.profitability.roe}%`);

  console.log('\n安全性指標:');
  console.log(`  - 自己資本比率: ${financialAnalysis.safety.equityRatio}%`);
  console.log(`  - 流動比率: ${financialAnalysis.safety.currentRatio}%`);

  if (financialAnalysis.warnings.length > 0) {
    console.log('\n⚠️ 警告:');
    financialAnalysis.warnings.forEach(warning => {
      console.log(`  - ${warning}`);
    });
  }

  console.log('\n推奨アクション:');
  financialAnalysis.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log('');

  // ========================================
  // 4. ManagementAvatar デモ - チーム健全性
  // ========================================
  console.log('👥 ManagementAvatar（MEGUMI）デモ - チーム健全性診断\n');

  const teamHealth = await avatars.management.calculateTeamHealth({
    engagementScore: 3.5,
    turnoverRate: 0.15,
    productivityIndex: 75,
    collaborationScore: 4.0,
    satisfactionScore: 3.8,
  });

  console.log(`チーム健全性スコア: ${(teamHealth.healthScore * 100).toFixed(1)}点`);
  console.log(`ステータス: ${teamHealth.status}`);

  if (teamHealth.insights.length > 0) {
    console.log('\nインサイト:');
    teamHealth.insights.forEach(insight => {
      console.log(`  - ${insight}`);
    });
  }

  console.log('\n改善推奨:');
  teamHealth.recommendations.forEach((rec, i) => {
    console.log(`  ${i + 1}. ${rec}`);
  });
  console.log('');

  // ========================================
  // 5. OrganizationAvatar デモ - 組織診断
  // ========================================
  console.log('🏢 OrganizationAvatar（HARUKA）デモ - 組織健全性診断\n');

  const orgDiagnosis = await avatars.organization.diagnoseOrganization({
    employeeCount: 100,
    turnoverRate: 0.12,
    engagementScore: 3.8,
    diversityIndex: 0.4,
    trainingHoursPerEmployee: 30,
    promotionRate: 0.08,
    hasVisionStatement: true,
    hasPerformanceReview: true,
  });

  console.log(`組織健全性スコア: ${orgDiagnosis.overallScore}点`);
  console.log(`ステータス: ${orgDiagnosis.status}`);

  if (orgDiagnosis.strengths.length > 0) {
    console.log('\n強み:');
    orgDiagnosis.strengths.forEach(strength => {
      console.log(`  ✅ ${strength}`);
    });
  }

  if (orgDiagnosis.weaknesses.length > 0) {
    console.log('\n弱み:');
    orgDiagnosis.weaknesses.forEach(weakness => {
      console.log(`  ⚠️ ${weakness}`);
    });
  }

  if (orgDiagnosis.priorities.length > 0) {
    console.log('\n優先施策:');
    orgDiagnosis.priorities.slice(0, 3).forEach((priority, i) => {
      console.log(`  ${i + 1}. [${priority.urgency}] ${priority.area}: ${priority.action}`);
    });
  }
  console.log('');

  // ========================================
  // 6. OperationsAvatar デモ - プロセス分析
  // ========================================
  console.log('⚙️ OperationsAvatar（KENJI）デモ - 業務プロセス分析\n');

  const processAnalysis = await avatars.operations.analyzeProcess({
    processName: '受注処理プロセス',
    steps: [
      { name: '注文受付', timeMinutes: 10, errorRate: 0.02, isAutomatable: true },
      { name: '在庫確認', timeMinutes: 5, errorRate: 0.05, isAutomatable: true },
      { name: '与信チェック', timeMinutes: 15, errorRate: 0.01, isAutomatable: true },
      { name: '出荷指示', timeMinutes: 8, errorRate: 0.03, isAutomatable: false },
    ],
    monthlyVolume: 500,
  });

  console.log('現状分析:');
  console.log(`  - 1件あたり処理時間: ${processAnalysis.currentState.totalTimePerCase}分`);
  console.log(`  - 月間総処理時間: ${processAnalysis.currentState.monthlyTotalHours}時間`);
  console.log(`  - 平均エラー率: ${processAnalysis.currentState.avgErrorRate}%`);
  console.log(`  - 自動化可能性: ${processAnalysis.currentState.automationPotential}%`);

  if (processAnalysis.bottlenecks.length > 0) {
    console.log('\nボトルネック:');
    processAnalysis.bottlenecks.forEach(bottleneck => {
      console.log(`  - [${bottleneck.impact}] ${bottleneck.step}: ${bottleneck.issue}`);
    });
  }

  console.log('\n削減効果試算:');
  console.log(`  - 月間削減時間: ${processAnalysis.potentialSavings.timeReductionHours}時間`);
  console.log(`  - 年間コスト削減: ${processAnalysis.potentialSavings.costReductionJPY.toLocaleString()}円`);
  console.log(`  - 期待ROI: ${processAnalysis.potentialSavings.roi}倍`);
  console.log('');

  // ========================================
  // まとめ
  // ========================================
  console.log('🎉 デモ完了\n');
  console.log('6つの専門アバターが正常に動作しました。');
  console.log('各アバターは付加価値経営®フレームワークに基づき、');
  console.log('専門的なコンサルティングを提供します。');
}

// デモ実行
if (require.main === module) {
  demonstrateSpecialistAvatars()
    .then(() => {
      console.log('\n✅ すべてのデモが正常に完了しました');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ エラーが発生しました:', error);
      process.exit(1);
    });
}

export { demonstrateSpecialistAvatars };
