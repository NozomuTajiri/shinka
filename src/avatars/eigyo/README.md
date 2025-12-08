# 営業コンサルアバター「営業」(EIGYO)

営業チーム変革と個人コーチングを支援するAIアバター

## 概要

**EIGYO**は、営業パーソンを「ヒーロー」として扱い、科学的な営業プロセスに基づいて成長と成果を支援する営業コンサルタントAIです。

### 特徴

- **情熱的で実践的な対話**: 励ましと共感を大切にした対話スタイル
- **科学的営業プロセス**: 6フェーズの営業プロセスフレームワーク
- **行動レベル実装**: 具体的なアクションプランとロールプレイ
- **ヒーロー化アプローチ**: 成功体験を引き出し、自信を高める

## 主要機能

### 1. コーチングセッション

営業パーソンごとにパーソナライズされたコーチングセッションを提供

```typescript
import { EigyoAvatar } from './avatars/eigyo';

const eigyo = new EigyoAvatar();
const session = eigyo.startSession('sales-person-001');

// 対話を処理
const result = await eigyo.processMessage(
  session.sessionId,
  '大型案件のクロージングがうまくいきません'
);

console.log(result.response); // コーチからの励ましとアドバイス
console.log(result.suggestedActions); // 具体的なアクションプラン
console.log(result.rolePlaySuggestion); // ロールプレイ提案
```

### 2. スキル診断

6つのスキル領域を診断し、強みと改善点を明確化

```typescript
const assessment = await eigyo.assessSkills(session.sessionId, {
  approach: 85,      // アプローチ
  discovery: 90,     // ニーズ発見
  presentation: 70,  // プレゼンテーション
  handling: 55,      // 反論対応
  closing: 75,       // クロージング
  relationship: 80,  // 関係構築
});

console.log(`総合スコア: ${assessment.overallScore}点`);
console.log(`強み: ${assessment.strengths.join(', ')}`);
console.log(`改善エリア: ${assessment.developmentAreas.join(', ')}`);
```

### 3. 案件コンテキスト管理

進行中の案件情報を設定し、状況に応じたアドバイスを提供

```typescript
eigyo.setDealContext(session.sessionId, {
  customerName: 'ABC株式会社',
  dealSize: 5000000,
  currentPhase: 'presentation',
  keyStakeholders: [
    {
      name: '山田太郎',
      role: '部長',
      influence: 'decision-maker',
      attitude: 'neutral',
      needs: ['コスト削減', '業務効率化'],
    },
  ],
  competitorSituation: '他社2社と比較検討中',
  timeline: '2ヶ月以内',
  challenges: ['予算制約', '社内承認プロセス'],
});
```

### 4. ニーズビハインドニーズ分析

表面的なニーズから深層ニーズを発見

```typescript
const analysis = await eigyo.analyzeNeedsBehindNeeds(
  'コスト削減したい'
);

console.log('深層ニーズ:', analysis.deeperNeed);
console.log('感情的ニーズ:', analysis.emotionalNeed);
console.log('ビジネス影響:', analysis.businessImpact);
console.log('アプローチ戦略:', analysis.approachStrategy);
```

### 5. 価値提案作成

ターゲットと課題に基づいた価値提案を生成

```typescript
const valueProposition = await eigyo.createValueProposition(
  '中堅製造業',
  '在庫管理の非効率',
  'AI駆動在庫最適化システム'
);

console.log('ユニークな価値:', valueProposition.uniqueValue);
console.log('証拠:', valueProposition.proof);
console.log('エレベーターピッチ:', valueProposition.elevator);
```

### 6. ロールプレイシナリオ生成

営業フェーズと課題に応じたロールプレイシナリオを作成

```typescript
const scenario = await eigyo.generateRolePlayScenario(
  'handling',
  '価格が高いという反論への対応'
);

console.log('シナリオ:', scenario.scenario);
console.log('顧客役:', scenario.customerRole);
console.log('目標:', scenario.objectives);
console.log('ヒント:', scenario.tips);
```

## 科学的営業プロセス（6フェーズ）

### 1. アプローチ (Approach)
- **目標**: 第一印象で信頼を獲得、面談機会の創出
- **KPI**: 返信率30%以上、面談設定率15%以上

### 2. ニーズ発見 (Discovery)
- **目標**: 表面ニーズの把握、本質的課題の発見
- **KPI**: 3つ以上の課題特定、意思決定基準の把握

### 3. プレゼンテーション (Presentation)
- **目標**: 価値提案の明確化、差別化ポイントの訴求
- **KPI**: 次のステップへの合意、追加関係者の紹介

### 4. 反論対応 (Handling)
- **目標**: 懸念点の解消、信頼の深化
- **KPI**: 主要反論の解消、関係性の維持・向上

### 5. クロージング (Closing)
- **目標**: 合意の取り付け、契約条件の確定
- **KPI**: 契約締結、導入日程の確定

### 6. フォローアップ (Follow)
- **目標**: 顧客満足度の確保、追加ニーズの発見
- **KPI**: NPS向上、追加受注、紹介獲得

## 反論対応パターン（6種類）

1. **価格 (Price)**: 価値対費用のフレーミング
2. **タイミング (Timing)**: 先延ばしコストの可視化
3. **競合 (Competitor)**: 差別化ポイントの明確化
4. **権限 (Authority)**: キーパーソンへのアクセス支援
5. **信頼 (Trust)**: 社会的証明の提示
6. **ニーズ (Need)**: 潜在課題の可視化

## ヒーローストーリー機能

成功事例を蓄積し、類似シナリオで活用

```typescript
eigyo.addHeroStory({
  id: 'story-001',
  salesPerson: '田中一郎',
  situation: '大型案件の最終プレゼン',
  challenge: '競合3社との競争',
  action: 'カスタマイズ提案で差別化',
  result: '3000万円受注',
  lessons: ['顧客理解の重要性', '差別化戦略'],
  applicableScenarios: ['大型案件', '競合状況'],
});

// 関連ストーリーを検索
const stories = eigyo.findRelevantStories('大型案件のクロージング');
```

## データ型

### EigyoPersona

```typescript
{
  id: 'eigyo',
  name: '営業',
  role: '営業コンサルタント',
  communicationStyle: {
    tone: '情熱的で実践的',
    approach: 'ヒーロー化・科学的営業',
    principle: '行動レベル実装',
  },
  values: [...],
  behaviorPrinciples: [...],
}
```

### SalesCoachingSession

```typescript
{
  sessionId: string,
  salesPersonId: string,
  dealContext?: DealContext,
  skillsAssessment: SkillsAssessment,
  actionPlan: SalesActionItem[],
  heroMoments: string[],
}
```

### SkillsAssessment

```typescript
{
  approach: number,      // 0-100
  discovery: number,     // 0-100
  presentation: number,  // 0-100
  handling: number,      // 0-100
  closing: number,       // 0-100
  relationship: number,  // 0-100
  overallScore: number,  // 平均スコア
  strengths: string[],   // 80点以上のスキル
  developmentAreas: string[], // 60点未満のスキル
}
```

## 使用例

### 完全なコーチングフロー

```typescript
import { EigyoAvatar } from './avatars/eigyo';

async function runCoachingSession() {
  const eigyo = new EigyoAvatar();

  // 1. セッション開始
  const session = eigyo.startSession('yamada-taro');

  // 2. スキル診断
  const skills = await eigyo.assessSkills(session.sessionId, {
    approach: 70,
    discovery: 65,
    presentation: 75,
    handling: 55,
    closing: 60,
    relationship: 80,
  });

  console.log(`総合スコア: ${skills.overallScore}点`);
  console.log(`改善エリア: ${skills.developmentAreas.join(', ')}`);

  // 3. 案件設定
  eigyo.setDealContext(session.sessionId, {
    customerName: 'XYZ株式会社',
    dealSize: 3000000,
    currentPhase: 'handling',
    keyStakeholders: [...],
    competitorSituation: '競合1社と比較中',
    timeline: '1ヶ月以内',
    challenges: ['価格面での懸念'],
  });

  // 4. 対話開始
  const result = await eigyo.processMessage(
    session.sessionId,
    '価格が高いと言われて困っています'
  );

  console.log('コーチ:', result.response);
  console.log('提案アクション:', result.suggestedActions);
  console.log('ロールプレイ提案:', result.rolePlaySuggestion);

  // 5. ロールプレイシナリオ生成
  const rolePlay = await eigyo.generateRolePlayScenario(
    'handling',
    '価格反論への対応'
  );

  console.log('シナリオ:', rolePlay.scenario);
  console.log('達成目標:', rolePlay.objectives);
}
```

## テスト

```bash
npm test -- eigyo
```

全15テストが含まれています:
- ペルソナ情報の検証
- セッション管理
- スキル診断
- 案件コンテキスト
- ヒーローストーリー
- 営業プロセスフレームワーク
- 反論対応パターン

## ファイル構成

```
src/avatars/eigyo/
├── index.ts           # メインクラス
├── types.ts           # 型定義
├── sales-process.ts   # 営業プロセスフレームワーク
└── README.md          # このファイル

tests/avatars/eigyo/
└── eigyo.test.ts      # ユニットテスト
```

## Claude Sonnet 4 統合

EIGYO は Claude Sonnet 4 (`claude-sonnet-4-20250514`) を活用し、以下の機能を提供:

- **対話応答生成**: コンテキストを理解した励ましとアドバイス
- **ニーズ分析**: 表面ニーズから深層ニーズの発見
- **価値提案作成**: ターゲットに最適化された提案文
- **ロールプレイシナリオ**: 実践的なトレーニングシナリオ

## ライセンス

このプロジェクトは Miyabi Framework の一部です。
