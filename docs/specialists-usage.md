# 専門アバター群 使用ガイド

## 概要

6つの専門領域に特化したAIアバターを提供します。各アバターはClaude Sonnet 4を搭載し、付加価値経営®フレームワークに基づいた専門的なコンサルティングを提供します。

## アバター一覧

| アバター | 名前 | 専門領域 | 主な価値領域 |
|---------|------|---------|-------------|
| SalesAvatar | TAKUMI（タクミ） | 営業改革 | 顧客価値・事業価値 |
| MarketingAvatar | AKARI（アカリ） | マーケティング戦略 | 顧客価値・ブランド価値 |
| ManagementAvatar | MEGUMI（メグミ） | マネジメント改善 | 社員価値・組織価値 |
| FinanceAvatar | KAZUKI（カズキ） | 財務分析 | 事業価値・株主価値 |
| OrganizationAvatar | HARUKA（ハルカ） | 組織開発 | 社員価値・組織価値 |
| OperationsAvatar | KENJI（ケンジ） | オペレーション改善 | 事業価値・社員価値 |

## 基本的な使い方

### 1. ファクトリーを使用した初期化

```typescript
import { SpecialistAvatarFactory } from '@/avatars/specialists';

// API Keyを使用してファクトリーを初期化
const factory = new SpecialistAvatarFactory(process.env.ANTHROPIC_API_KEY!);

// 全アバターを一括作成
const avatars = factory.createAllAvatars();

// または個別に作成
const salesAvatar = factory.createSalesAvatar();
const marketingAvatar = factory.createMarketingAvatar();
```

### 2. アバターへの相談

```typescript
import type { ConsultationRequest } from '@/avatars/specialists';

// 相談リクエストを作成
const request: ConsultationRequest = {
  query: '営業プロセスを改善したいが、どこから手をつけるべきか？',
  companyContext: {
    industry: '製造業',
    size: '中小企業（従業員100名）',
    challenges: ['受注率の低下', '営業担当の属人化'],
  },
  focusValues: ['customer_value', 'business_value'],
};

// アバターに相談
const response = await salesAvatar.consult(request);

console.log(response.answer); // マークダウン形式の回答
console.log(response.recommendations); // 具体的な推奨アクション
console.log(response.confidenceScore); // 信頼度スコア（0-1）
```

### 3. CEOへの報告

重要な洞察やリスクを検出した場合、アバターは自動的にCEOへ報告します：

```typescript
// 相談結果にCEO報告が含まれる場合
if (response.requiresCEOReport && response.ceoReport) {
  console.log('カテゴリー:', response.ceoReport.category);
  console.log('重要度:', response.ceoReport.severity);
  console.log('サマリー:', response.ceoReport.summary);
  console.log('推奨アクション:', response.ceoReport.recommendedAction);
}
```

### 4. 他アバターとの連携

アバターは必要に応じて他の専門アバターとの連携を提案します：

```typescript
// 連携提案がある場合
if (response.collaborationSuggestions) {
  for (const suggestion of response.collaborationSuggestions) {
    console.log(`連携先: ${suggestion.targetAvatar}`);
    console.log(`理由: ${suggestion.reason}`);
    console.log(`期待される成果: ${suggestion.expectedOutcome}`);

    // 連携先アバターを呼び出す
    const targetAvatar = factory.createByDomain(suggestion.targetAvatar);
    const followUpResponse = await targetAvatar.consult({
      query: suggestion.reason,
      companyContext: request.companyContext,
    });
  }
}
```

## 各アバターの特徴

### SalesAvatar（営業改革）

```typescript
// 営業KPI分析
const kpiAnalysis = await salesAvatar.analyzeSalesKPI({
  leads: 1000,
  opportunities: 200,
  closedWon: 50,
  revenue: 50000000,
  period: '2025年1月',
});

console.log('コンバージョン率:', kpiAnalysis.metrics.conversionRate);
console.log('インサイト:', kpiAnalysis.insights);
console.log('推奨アクション:', kpiAnalysis.recommendations);
```

### MarketingAvatar（マーケティング戦略）

```typescript
// ブランドポジショニング分析
const positioning = await marketingAvatar.analyzePositioning({
  companyName: '株式会社ABC',
  industry: 'IT',
  competitors: ['競合A', '競合B'],
  strengths: ['技術力', '顧客満足度'],
  weaknesses: ['知名度', 'マーケティング予算'],
});

console.log('ポジショニング:', positioning.positioning);
console.log('差別化ポイント:', positioning.differentiators);
console.log('メッセージング:', positioning.messagingPillars);
```

### ManagementAvatar（マネジメント改善）

```typescript
// チーム健全性診断
const teamHealth = await managementAvatar.calculateTeamHealth({
  engagementScore: 3.5,
  turnoverRate: 0.15,
  productivityIndex: 75,
  collaborationScore: 4.0,
  satisfactionScore: 3.8,
});

console.log('健全性スコア:', teamHealth.healthScore);
console.log('ステータス:', teamHealth.status);
console.log('改善提案:', teamHealth.recommendations);

// 1on1テンプレート生成
const template = await managementAvatar.generate1on1Template({
  teamSize: 5,
  frequency: 'weekly',
  focusAreas: ['キャリア開発', '課題解決'],
});

console.log(template.template);
console.log('Tips:', template.tips);
```

### FinanceAvatar（財務分析）

```typescript
// 財務諸表分析
const financials = await financeAvatar.analyzeFinancials({
  revenue: 1000000000,
  grossProfit: 400000000,
  operatingProfit: 100000000,
  netProfit: 70000000,
  totalAssets: 800000000,
  totalEquity: 400000000,
  currentAssets: 300000000,
  currentLiabilities: 150000000,
  operatingCashFlow: 120000000,
});

console.log('収益性:', financials.profitability);
console.log('安全性:', financials.safety);
console.log('警告:', financials.warnings);

// 投資判断分析
const investment = await financeAvatar.evaluateInvestment({
  initialInvestment: 10000000,
  annualCashFlows: [3000000, 4000000, 5000000, 5000000],
  discountRate: 0.1,
});

console.log('NPV:', investment.npv);
console.log('IRR:', investment.irr);
console.log('判定:', investment.recommendation);
```

### OrganizationAvatar（組織開発）

```typescript
// 組織健全性診断
const orgDiagnosis = await organizationAvatar.diagnoseOrganization({
  employeeCount: 100,
  turnoverRate: 0.12,
  engagementScore: 3.8,
  diversityIndex: 0.4,
  trainingHoursPerEmployee: 30,
  promotionRate: 0.08,
  hasVisionStatement: true,
  hasPerformanceReview: true,
});

console.log('総合スコア:', orgDiagnosis.overallScore);
console.log('ステータス:', orgDiagnosis.status);
console.log('優先施策:', orgDiagnosis.priorities);

// 採用戦略提案
const recruitment = await organizationAvatar.proposeRecruitmentStrategy({
  targetRoles: ['エンジニア', '営業'],
  hiringGoals: 20,
  budget: 10000000,
  timeline: '6ヶ月',
  companyStage: 'growth',
});

console.log('戦略:', recruitment.strategy);
console.log('採用チャネル:', recruitment.channels);
```

### OperationsAvatar（オペレーション改善）

```typescript
// 業務プロセス分析
const processAnalysis = await operationsAvatar.analyzeProcess({
  processName: '受注処理',
  steps: [
    { name: '注文受付', timeMinutes: 10, errorRate: 0.02, isAutomatable: true },
    { name: '在庫確認', timeMinutes: 5, errorRate: 0.05, isAutomatable: true },
    { name: '出荷指示', timeMinutes: 8, errorRate: 0.03, isAutomatable: false },
  ],
  monthlyVolume: 500,
});

console.log('現状:', processAnalysis.currentState);
console.log('ボトルネック:', processAnalysis.bottlenecks);
console.log('改善提案:', processAnalysis.improvements);
console.log('削減効果:', processAnalysis.potentialSavings);

// 自動化候補抽出
const automationCandidates = await operationsAvatar.identifyAutomationCandidates([
  {
    name: 'データ入力作業',
    frequency: 'daily',
    timePerExecution: 30,
    complexity: 'low',
    dataStructured: true,
  },
  {
    name: '月次レポート作成',
    frequency: 'monthly',
    timePerExecution: 120,
    complexity: 'medium',
    dataStructured: true,
  },
]);

console.log('自動化候補:', automationCandidates);
```

## ナレッジベースの活用

各アバターにナレッジベースを登録することで、より精度の高い回答が可能になります：

```typescript
import type { KnowledgeEntry } from '@/avatars/specialists';

const knowledgeBase: KnowledgeEntry[] = [
  {
    id: 'kb-001',
    category: '営業戦略',
    title: 'BtoB営業の成功パターン',
    content: '顧客課題の深掘りとソリューション提案が重要...',
    tags: ['BtoB', '営業プロセス', '提案力'],
    relatedValues: ['customer_value', 'business_value'],
  },
  // 他のナレッジエントリー
];

// ナレッジベースを含めてアバター作成
const salesAvatar = factory.createSalesAvatar(knowledgeBase);

// または後から追加
salesAvatar.addKnowledge({
  id: 'kb-002',
  category: '価格戦略',
  title: '価格交渉のテクニック',
  content: '...',
  tags: ['価格', '交渉'],
  relatedValues: ['business_value'],
});
```

## ベストプラクティス

### 1. 適切なアバターの選択

- 営業課題 → SalesAvatar
- マーケティング戦略 → MarketingAvatar
- チームマネジメント → ManagementAvatar
- 財務分析・投資判断 → FinanceAvatar
- 組織設計・人事制度 → OrganizationAvatar
- 業務効率化 → OperationsAvatar

### 2. コンテキストの充実

詳細なコンテキスト情報を提供することで、より的確な回答が得られます：

```typescript
const request: ConsultationRequest = {
  query: '具体的な質問',
  companyContext: {
    industry: '業界を明記',
    size: '企業規模を明記',
    challenges: ['課題を具体的に列挙'],
  },
  focusValues: ['重点を置く価値領域'],
  additionalContext: '追加の背景情報や制約条件など',
};
```

### 3. 連携の活用

複数のアバターを連携させることで、多角的な視点からの分析が可能です：

```typescript
// 営業改善 → マーケティング連携の例
const salesResponse = await salesAvatar.consult({
  query: 'リード獲得を増やしたい',
  companyContext: { industry: 'IT' },
});

// マーケティングアバターと連携
if (salesResponse.collaborationSuggestions?.some(s => s.targetAvatar === 'marketing')) {
  const marketingResponse = await marketingAvatar.consult({
    query: 'リード獲得のためのマーケティング施策',
    companyContext: { industry: 'IT' },
  });
}
```

## トラブルシューティング

### API Keyエラー

```typescript
// エラー: API Key is required
// 解決: 環境変数を設定
process.env.ANTHROPIC_API_KEY = 'your-api-key';
const factory = new SpecialistAvatarFactory(process.env.ANTHROPIC_API_KEY!);
```

### レスポンス取得失敗

```typescript
// フォールバック応答が返される
// response.confidenceScore が低い場合は要注意
if (response.confidenceScore < 0.7) {
  console.warn('回答の信頼度が低いため、追加情報を提供してください');
}
```

## まとめ

専門アバター群は、付加価値経営®の6つの価値領域をカバーする包括的なコンサルティングシステムです。各アバターを単独で使用することも、連携させて多角的な分析を行うことも可能です。

詳細な実装は各アバターのソースコードを参照してください。
