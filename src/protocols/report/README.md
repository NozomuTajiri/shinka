# Report Protocol

アバター間の報告・アラート・成果記録プロトコル

## Overview

Report Protocolは、複数のAIアバターが協力してクライアントにサービスを提供する際に、互いの活動を報告・共有するための標準化されたプロトコルです。

## Features

- **4種類のレポートタイプ**
  - Weekly Report: 週次活動報告
  - Alert Report: 緊急アラート通知
  - Achievement Report: 成果・マイルストーン報告
  - Status Report: プロジェクト状態報告

- **柔軟なテンプレートシステム**
  - カスタマイズ可能なレポートテンプレート
  - 必須・任意フィールドの定義
  - タイプ別のセクション管理

- **サブスクリプション通知**
  - レポートタイプ別の購読
  - フィルタリング（アバター、クライアント、重要度）
  - 配信頻度の選択（即座、日次、週次）

## Installation

```typescript
import { ReportEngine } from '@/protocols/report';

const reportEngine = new ReportEngine();
```

## Usage

### 週次レポートの作成

```typescript
import { ReportEngine, ActivityRecord } from '@/protocols/report';

const engine = new ReportEngine();

// 活動記録の準備
const activities: ActivityRecord[] = [
  {
    id: 'act-1',
    date: new Date('2025-12-03'),
    type: 'session',
    description: '初回コンサルテーション',
    outcome: 'クライアントの目標を明確化',
    duration: 60,
  },
  {
    id: 'act-2',
    date: new Date('2025-12-05'),
    type: 'analysis',
    description: '現状分析レポート作成',
    outcome: '3つの改善領域を特定',
    duration: 90,
  },
];

// 週次レポート作成
const weeklyReport = engine.createWeeklyReport(
  'avatar-nutritionist-001',           // 報告元アバター
  ['avatar-fitness-001', 'avatar-mental-001'], // 報告先アバター
  'client-123',                        // クライアントID
  activities,                          // 活動記録
  [
    'クライアントは朝食の重要性を理解した',
    '運動習慣の障壁は時間管理にある',
  ],                                   // 洞察
  [
    '食事プラン v2.0 の提案',
    'フィットネスアバターとの連携セッション',
  ]                                    // 来週の計画
);

console.log(weeklyReport);
// {
//   metadata: {
//     reportId: 'rpt-1733875200000-abc123',
//     type: 'weekly',
//     fromAvatarId: 'avatar-nutritionist-001',
//     toAvatarIds: ['avatar-fitness-001', 'avatar-mental-001'],
//     clientId: 'client-123',
//     createdAt: 2025-12-10T12:00:00.000Z,
//     status: 'draft'
//   },
//   period: {
//     startDate: 2025-12-08T00:00:00.000Z,
//     endDate: 2025-12-14T23:59:59.999Z
//   },
//   summary: '今週は2回のセッションを実施し、0件の提案を行いました。平均セッション時間は75分でした。',
//   activities: [...],
//   metrics: {
//     sessionsCount: 2,
//     avgSessionDuration: 75,
//     recommendationsGiven: 0,
//     recommendationsImplemented: 0,
//     progressScore: 20
//   },
//   insights: [...],
//   nextWeekPlan: [...],
//   blockers: []
// }
```

### アラートレポートの作成

```typescript
// 緊急アラートの作成（即座に送信される）
const alertReport = engine.createAlertReport(
  'avatar-mental-001',
  ['avatar-coordinator-001', 'avatar-nutritionist-001'],
  'client-123',
  'critical',  // 'info' | 'warning' | 'critical'
  'クライアントのメンタルヘルス急変',
  'クライアントが3日連続でセッションをキャンセル。過去のパターンから重度のストレス状態と推測される。',
  [
    '24時間以内に直接連絡を試みる',
    '栄養・運動の両面からサポート強化',
    '必要に応じて専門家への紹介を検討',
  ]
);

console.log(alertReport.recommendedResponse);
// '即座に以下のアクションを検討してください: 24時間以内に直接連絡を試みる, 栄養・運動の両面からサポート強化, 必要に応じて専門家への紹介を検討'
```

### 成果レポートの作成

```typescript
const achievementReport = engine.createAchievementReport(
  'avatar-fitness-001',
  ['avatar-nutritionist-001', 'avatar-mental-001'],
  'client-123',
  'milestone',  // 'milestone' | 'goal' | 'breakthrough' | 'improvement'
  '初マラソン完走達成',
  'クライアントが3ヶ月のトレーニングプログラムを完遂し、初マラソンを完走しました。',
  [
    { name: '週間走行距離', before: 5, after: 40 },
    { name: '安静時心拍数', before: 75, after: 58 },
    { name: '体脂肪率', before: 28, after: 22 },
  ],
  [
    '段階的な負荷増加プログラム',
    '栄養アバターとの連携による最適な食事管理',
    'メンタルアバターによるモチベーション維持',
    '定期的なフォームチェックと怪我予防',
  ],
  [
    '小さな目標を積み重ねることで大きな成果につながる',
    'アバター間の連携が成功の鍵',
    'クライアントの生活リズムに合わせた柔軟なプラン調整が重要',
  ]
);

console.log(achievementReport.replicability);
// 'high' (4つ以上の成功要因が文書化されているため)
```

### ステータスレポートの作成

```typescript
const statusReport = engine.createStatusReport(
  'avatar-coordinator-001',
  ['avatar-nutritionist-001', 'avatar-fitness-001', 'avatar-mental-001'],
  'client-123',
  'Phase 2: 習慣化期',
  75,  // 進捗率 (0-100)
  [
    '3週間連続で運動目標達成',
    '食事記録の継続率 95%',
    '睡眠の質スコア改善（6.5 → 8.2）',
  ],
  [
    '仕事の繁忙期による時間制約',
  ],
  {
    name: 'Phase 3: 自律期への移行',
    targetDate: new Date('2025-12-31'),
  }
);

console.log(statusReport.health);
// 'healthy' (進捗率 75%, 懸念事項 1件)
```

### レポートの送信と承認

```typescript
// レポートを送信
const submitted = engine.submitReport(weeklyReport.metadata.reportId);
console.log(submitted); // true

// レポートを承認
const acknowledged = engine.acknowledgeReport(weeklyReport.metadata.reportId);
console.log(acknowledged); // true

// レポート状態の確認
const report = engine.getReport(weeklyReport.metadata.reportId);
console.log(report?.metadata.status); // 'acknowledged'
console.log(report?.metadata.submittedAt); // Date
console.log(report?.metadata.acknowledgedAt); // Date
```

### サブスクリプションの設定

```typescript
import { ReportSubscription } from '@/protocols/report';

// 特定のレポートタイプを購読
const subscription: ReportSubscription = {
  subscriberId: 'avatar-coordinator-001',
  reportTypes: ['alert', 'achievement'],
  filters: {
    clientIds: ['client-123', 'client-456'],
    severities: ['warning', 'critical'],
  },
  deliveryPreference: 'immediate',
};

engine.addSubscription(subscription);

// アラート作成時に自動的に通知される
const alert = engine.createAlertReport(
  'avatar-nutritionist-001',
  ['avatar-coordinator-001'],
  'client-123',
  'critical',
  'テストアラート',
  'これはテストです',
  ['アクション1', 'アクション2']
);
// Console: "Notifying 1 subscribers about report rpt-..."
```

### レポートの検索

```typescript
// アバター別のレポート取得
const avatarReports = engine.getReportsByAvatar('avatar-nutritionist-001');
console.log(`Found ${avatarReports.length} reports for this avatar`);

// クライアント別のレポート取得
const clientReports = engine.getReportsByClient('client-123');
console.log(`Found ${clientReports.length} reports for this client`);

// 特定のレポート取得
const report = engine.getReport('rpt-1733875200000-abc123');
if (report) {
  console.log(`Report type: ${report.metadata.type}`);
  console.log(`Status: ${report.metadata.status}`);
}
```

### テンプレートの利用

```typescript
// デフォルトテンプレートの取得
const weeklyTemplate = engine.getTemplate('weekly-default');
console.log(weeklyTemplate?.name);
// '週次レポート標準テンプレート'

console.log(weeklyTemplate?.sections);
// [
//   { id: 'summary', name: '概要', ... },
//   { id: 'activities', name: '活動記録', ... },
//   ...
// ]

// タイプ別のテンプレート一覧
const alertTemplates = engine.getTemplatesByType('alert');
console.log(`Found ${alertTemplates.length} alert templates`);
```

## Report Types

### WeeklyReport
週次活動報告。定期的なチーム内情報共有に使用。

**主要フィールド:**
- `period`: 報告期間（開始日・終了日）
- `activities`: 活動記録の配列
- `metrics`: 定量的な成果指標
- `insights`: 得られた洞察
- `nextWeekPlan`: 来週の計画
- `blockers`: 障害・ブロッカー

### AlertReport
緊急アラート通知。重要な問題や変化を即座に共有。

**主要フィールド:**
- `severity`: 重要度（info/warning/critical）
- `title`: アラートタイトル
- `description`: 詳細説明
- `immediateActions`: 即座に取るべきアクション
- `deadline`: 対応期限（任意）

### AchievementReport
成果・マイルストーン報告。達成事項の共有と学習の促進。

**主要フィールド:**
- `achievementType`: 成果タイプ（milestone/goal/breakthrough/improvement）
- `metrics`: ビフォー・アフターの数値
- `contributingFactors`: 成功要因
- `lessonsLearned`: 得られた教訓
- `replicability`: 再現性（high/medium/low）

### StatusReport
プロジェクト状態報告。全体的な進捗と健全性の可視化。

**主要フィールド:**
- `currentPhase`: 現在のフェーズ
- `progress`: 進捗率（0-100）
- `health`: 健全性（healthy/at-risk/critical）
- `highlights`: ハイライト
- `concerns`: 懸念事項
- `nextMilestone`: 次のマイルストーン

## Best Practices

### 1. 定期的な週次レポート
```typescript
// 毎週金曜日に自動生成
const generateWeeklyReport = () => {
  const activities = collectWeekActivities();
  const insights = extractKeyInsights(activities);
  const nextWeekPlan = planNextWeek();

  return engine.createWeeklyReport(
    avatarId,
    teamAvatarIds,
    clientId,
    activities,
    insights,
    nextWeekPlan
  );
};
```

### 2. 重要度に応じたアラート
```typescript
// 軽微な情報は info、注意が必要な場合は warning、緊急時は critical
const sendAlert = (issue: Issue) => {
  const severity = assessSeverity(issue);

  return engine.createAlertReport(
    avatarId,
    getRelevantAvatars(issue),
    clientId,
    severity,
    issue.title,
    issue.description,
    generateActions(issue)
  );
};
```

### 3. 成果の文書化
```typescript
// 再現性を高めるため、成功要因を詳細に記録
const documentAchievement = (achievement: Achievement) => {
  return engine.createAchievementReport(
    avatarId,
    teamAvatarIds,
    clientId,
    achievement.type,
    achievement.title,
    achievement.description,
    achievement.metrics,
    achievement.factors,  // できるだけ多くの要因を記録
    achievement.lessons   // 学びを明確に記述
  );
};
```

### 4. サブスクリプションの最適化
```typescript
// 役割に応じた購読設定
const coordinatorSubscription: ReportSubscription = {
  subscriberId: 'coordinator',
  reportTypes: ['alert', 'achievement', 'status'],
  filters: { severities: ['warning', 'critical'] },
  deliveryPreference: 'immediate',
};

const teamMemberSubscription: ReportSubscription = {
  subscriberId: 'team-member',
  reportTypes: ['weekly', 'achievement'],
  filters: {},
  deliveryPreference: 'weekly-digest',
};
```

## Architecture

```
ReportEngine
├── reports: Map<reportId, Report>
├── templates: Map<templateId, Template>
└── subscriptions: ReportSubscription[]

Report Types
├── WeeklyReport (定期報告)
├── AlertReport (緊急通知)
├── AchievementReport (成果共有)
└── StatusReport (状態可視化)

Workflow
1. Create Report (draft)
2. Submit Report (submitted) → Notify Subscribers
3. Acknowledge Report (acknowledged)
4. Archive Report (archived)
```

## API Reference

### ReportEngine

#### Constructor
```typescript
constructor()
```

#### Methods

**createWeeklyReport**
```typescript
createWeeklyReport(
  fromAvatarId: string,
  toAvatarIds: string[],
  clientId: string,
  activities: ActivityRecord[],
  insights: string[],
  nextWeekPlan: string[]
): WeeklyReport
```

**createAlertReport**
```typescript
createAlertReport(
  fromAvatarId: string,
  toAvatarIds: string[],
  clientId: string,
  severity: AlertSeverity,
  title: string,
  description: string,
  immediateActions: string[]
): AlertReport
```

**createAchievementReport**
```typescript
createAchievementReport(
  fromAvatarId: string,
  toAvatarIds: string[],
  clientId: string,
  achievementType: 'milestone' | 'goal' | 'breakthrough' | 'improvement',
  title: string,
  description: string,
  metrics: { name: string; before: number; after: number }[],
  contributingFactors: string[],
  lessonsLearned: string[]
): AchievementReport
```

**createStatusReport**
```typescript
createStatusReport(
  fromAvatarId: string,
  toAvatarIds: string[],
  clientId: string,
  currentPhase: string,
  progress: number,
  highlights: string[],
  concerns: string[],
  nextMilestone: { name: string; targetDate: Date }
): StatusReport
```

**submitReport**
```typescript
submitReport(reportId: string): boolean
```

**acknowledgeReport**
```typescript
acknowledgeReport(reportId: string): boolean
```

**addSubscription**
```typescript
addSubscription(subscription: ReportSubscription): void
```

**getReport**
```typescript
getReport(reportId: string): Report | undefined
```

**getReportsByAvatar**
```typescript
getReportsByAvatar(avatarId: string): Report[]
```

**getReportsByClient**
```typescript
getReportsByClient(clientId: string): Report[]
```

**getTemplate**
```typescript
getTemplate(templateId: string): ReportTemplate | undefined
```

**getTemplatesByType**
```typescript
getTemplatesByType(type: ReportType): ReportTemplate[]
```

## Integration Example

```typescript
// コーディネーターアバターによる統合利用例
import { ReportEngine } from '@/protocols/report';

class CoordinatorAvatar {
  private reportEngine: ReportEngine;

  constructor() {
    this.reportEngine = new ReportEngine();
    this.setupSubscriptions();
  }

  private setupSubscriptions() {
    // 全アラートを即座に受信
    this.reportEngine.addSubscription({
      subscriberId: this.id,
      reportTypes: ['alert'],
      filters: {},
      deliveryPreference: 'immediate',
    });

    // 成果とステータスは週次でまとめて受信
    this.reportEngine.addSubscription({
      subscriberId: this.id,
      reportTypes: ['achievement', 'status'],
      filters: {},
      deliveryPreference: 'weekly-digest',
    });
  }

  async handleClientProgress(clientId: string) {
    // 各アバターからの週次レポートを収集
    const reports = this.reportEngine.getReportsByClient(clientId);

    // 統合ステータスレポートを作成
    const statusReport = this.reportEngine.createStatusReport(
      this.id,
      this.getTeamAvatarIds(),
      clientId,
      this.assessCurrentPhase(reports),
      this.calculateOverallProgress(reports),
      this.extractHighlights(reports),
      this.identifyConcerns(reports),
      this.determineNextMilestone(clientId)
    );

    // レポートを送信
    this.reportEngine.submitReport(statusReport.metadata.reportId);
  }

  async handleEmergency(issue: EmergencyIssue) {
    // 緊急アラートを送信
    const alert = this.reportEngine.createAlertReport(
      this.id,
      this.getAllAvatarIds(),
      issue.clientId,
      'critical',
      issue.title,
      issue.description,
      issue.immediateActions
    );

    // アラートは作成時に自動送信される
    console.log(`Emergency alert ${alert.metadata.reportId} sent`);
  }
}
```

## Future Enhancements

- レポート自動生成（AI支援）
- レポート間の関連付け（参照機能）
- レポートのバージョン管理
- カスタムテンプレートのUI作成ツール
- レポートアナリティクス（トレンド分析、パターン検出）
- 外部システムとの連携（Slack、Email等）

## License

MIT
