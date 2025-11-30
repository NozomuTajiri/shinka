# 価値主義AI診断モジュール 設計ドキュメント

**Issue**: #4
**親Issue**: #2 カクシン進化
**バージョン**: 1.0.0
**作成日**: 2024年11月30日
**ステータス**: 設計フェーズ

---

## 目次

1. [概要](#1-概要)
2. [診断指標設計](#2-診断指標設計)
3. [スコアリングロジック](#3-スコアリングロジック)
4. [AI分析エンジン](#4-ai分析エンジン)
5. [レポート構成](#5-レポート構成)
6. [入力フォーム設計](#6-入力フォーム設計)
7. [技術アーキテクチャ](#7-技術アーキテクチャ)
8. [実装優先順位](#8-実装優先順位)

---

## 1. 概要

### 1.1 目的

田尻望著「付加価値のつくりかた」に基づく「価値主義経営®」の実践度を、AI駆動で診断・分析し、具体的な改善提言を生成するモジュール。

### 1.2 価値主義経営の核心指標

```
付加価値 = 売上 - 外部購入価値
付加価値率 = 付加価値 / 売上
労働生産性 = 付加価値 / 従業員数
```

**時間の概念**:
- **価値創造時間**: 顧客価値を生む時間
- **コスト時間**: 付加価値を生まない時間（削減対象）

### 1.3 診断対象

- **経営者**: 経営戦略・意思決定プロセス
- **企業**: 組織全体の価値創造体質
- **事業部/部門**: 部門単位の付加価値貢献度

### 1.4 成功指標

| 指標 | 目標値 |
|------|--------|
| 診断完了時間 | 15分以内 |
| スコア精度 | ±5点以内（人間専門家との比較） |
| レポート生成時間 | 30秒以内 |
| ユーザー満足度（NPS） | +50以上 |

---

## 2. 診断指標設計

### 2.1 診断カテゴリー（5カテゴリー×2〜3問 = 合計12問）

#### Category A: 付加価値理解度（20点）

**Q1. 自社の付加価値率を把握していますか？**

- [ ] **A. 正確に把握している（+10点）**
  毎月/四半期で付加価値率を計算し、経営会議で議論している。直近の付加価値率を即答できる。

- [ ] **B. おおよそ把握している（+7点）**
  年に数回は計算している。±5%程度の誤差で把握している。

- [ ] **C. 計算したことがあるが定期的ではない（+3点）**
  過去に1〜2回計算したが、現在は追跡していない。

- [ ] **D. 把握していない（0点）**
  付加価値率を計算したことがない、または計算方法を知らない。

**Q2. 売上と付加価値、どちらをより重視していますか？**

- [ ] **A. 付加価値を最優先している（+10点）**
  売上が減っても付加価値率が上がれば良しとする判断基準がある。

- [ ] **B. 付加価値を意識しているが売上も重視（+7点）**
  両方を見ているが、意思決定時に葛藤がある。

- [ ] **C. どちらかというと売上重視（+3点）**
  売上目標がKGIで、付加価値は参考程度。

- [ ] **D. 売上のみを追求している（0点）**
  売上成長が最優先で、付加価値は考慮していない。

---

#### Category B: シン・マーケットイン実践度（20点）

**Q3. 新商品・サービス開発のプロセスは？**

- [ ] **A. 徹底的な顧客課題調査から開始（+10点）**
  顧客へのインタビュー・観察を最低30時間以上実施してから開発開始。

- [ ] **B. 顧客ニーズを調査してから開発（+7点）**
  アンケートやヒアリングを実施しているが、深さは不十分。

- [ ] **C. 市場トレンドを参考に開発（+3点）**
  競合分析やマーケットレポートを参考にしている。

- [ ] **D. 自社の技術シーズから開発（0点）**
  「作れるから作る」「面白そうだから作る」で開発している。

**Q4. 顧客接点の時間配分は？**

- [ ] **A. 経営陣が毎週顧客と直接対話（+10点）**
  経営者・幹部が週5時間以上、顧客と直接対話している。

- [ ] **B. 月に数回は顧客と対話（+7点）**
  月1〜2回程度、顧客訪問や商談に同席している。

- [ ] **C. 営業から報告を受ける程度（+3点）**
  営業部門からの報告で顧客の声を聞いている。

- [ ] **D. ほとんど顧客と接していない（0点）**
  経営陣は顧客と直接対話する機会がほぼない。

---

#### Category C: 仕組み化・標準化レベル（20点）

**Q5. 営業プロセスの標準化状況は？**

- [ ] **A. 完全に標準化され、誰でも再現可能（+10点）**
  営業プロセスがマニュアル化され、新人でも3ヶ月で一人前になる。

- [ ] **B. ある程度標準化されている（+7点）**
  基本的なフローはあるが、個人のスキルに依存する部分も多い。

- [ ] **C. 属人的だが、暗黙知は共有している（+3点）**
  ベテランの背中を見て学ぶスタイル。

- [ ] **D. 完全に属人的（0点）**
  各営業が独自のやり方で活動している。

**Q6. 業務プロセスのムダ取り活動は？**

- [ ] **A. 定期的にムダ取り会議を実施（+10点）**
  月1回以上、全社でムダ取り会議を行い、改善を実行している。

- [ ] **B. 年に数回は見直しを実施（+7点）**
  年2〜3回、業務改善プロジェクトを実施している。

- [ ] **C. 気づいたら改善する程度（+3点）**
  ボトムアップで改善提案があれば対応している。

- [ ] **D. ムダ取り活動はしていない（0点）**
  「今までのやり方」を踏襲している。

---

#### Category D: 労働生産性への意識（20点）

**Q7. 従業員1人当たりの付加価値を把握していますか？**

- [ ] **A. 毎月計測し、部門別に管理（+10点）**
  部門別・個人別の労働生産性を可視化し、目標設定している。

- [ ] **B. 全社の平均値は把握している（+7点）**
  全社ベースでは計算しているが、部門別ではない。

- [ ] **C. 年に1回程度計算している（+3点）**
  決算時期などに計算する程度。

- [ ] **D. 把握していない（0点）**
  労働生産性を計算したことがない。

**Q8. 残業時間削減の取り組みは？**

- [ ] **A. 残業ゼロを目標に仕組み化（+10点）**
  残業ゼロを前提に業務設計し、自動化・標準化を推進している。

- [ ] **B. 残業削減目標を設定している（+7点）**
  月20時間以内などの目標があり、実績をモニタリングしている。

- [ ] **C. 意識はしているが具体策なし（+3点）**
  「早く帰りましょう」と呼びかけている。

- [ ] **D. 残業は当たり前（0点）**
  残業時間を削減する意識がない。

---

#### Category E: 価値創造時間の最大化（20点）

**Q9. 会議時間の管理状況は？**

- [ ] **A. 会議は週5時間以内、全て議事録あり（+10点）**
  会議時間の上限を設定し、目的・議事録・決定事項を明確化している。

- [ ] **B. 会議時間は意識している（+7点）**
  会議時間削減の方針はあるが、厳格には運用されていない。

- [ ] **C. 会議は多いが必要と考えている（+3点）**
  週10時間以上会議があるが、情報共有には必要と考えている。

- [ ] **D. 会議時間を管理していない（0点）**
  会議の時間・頻度に制限がない。

**Q10. 社内業務（経理・総務・人事）の効率化状況は？**

- [ ] **A. ほぼ完全自動化/外部委託（+10点）**
  RPA・SaaS・アウトソースで90%以上自動化/外注化している。

- [ ] **B. 一部自動化している（+7点）**
  クラウド会計、勤怠管理システムなどを導入済み。

- [ ] **C. 手作業が多いが改善意欲あり（+3点）**
  Excelベースだが、システム化を検討中。

- [ ] **D. 全て手作業（0点）**
  紙ベース・Excelベースで、システム化の予定なし。

---

### 2.2 補助質問（2問、定量データ入力）

**Q11. 直近1年間の売上と外部購入価値（外注費・材料費など）を入力してください**

```
売上: __________ 万円
外部購入価値: __________ 万円

→ 自動計算: 付加価値 = 売上 - 外部購入価値
→ 自動計算: 付加価値率 = 付加価値 / 売上 × 100
```

**評価基準**:
- 付加価値率 70%以上: +10点
- 付加価値率 50〜69%: +7点
- 付加価値率 30〜49%: +3点
- 付加価値率 30%未満: 0点

**Q12. 従業員数を入力してください**

```
従業員数: __________ 人

→ 自動計算: 労働生産性 = 付加価値 / 従業員数
```

**評価基準**（1人当たり年間付加価値）:
- 2,000万円以上: +10点
- 1,000万〜1,999万円: +7点
- 500万〜999万円: +3点
- 500万円未満: 0点

---

### 2.3 スコア配点サマリー

| カテゴリー | 配点 | 質問数 |
|-----------|------|--------|
| A. 付加価値理解度 | 20点 | 2問 |
| B. シン・マーケットイン実践度 | 20点 | 2問 |
| C. 仕組み化・標準化レベル | 20点 | 2問 |
| D. 労働生産性への意識 | 20点 | 2問 |
| E. 価値創造時間の最大化 | 20点 | 2問 |
| F. 定量評価（付加価値率・労働生産性） | 20点 | 2問 |
| **合計** | **120点** | **12問** |

※ 100点満点に正規化するため、最終スコア = (合計点 / 120) × 100

---

## 3. スコアリングロジック

### 3.1 総合スコア計算式

```typescript
// 基本スコア（120点満点）
const rawScore =
  categoryA_score +
  categoryB_score +
  categoryC_score +
  categoryD_score +
  categoryE_score +
  categoryF_score;

// 100点満点に正規化
const normalizedScore = (rawScore / 120) * 100;

// 小数点第1位で四捨五入
const finalScore = Math.round(normalizedScore * 10) / 10;
```

### 3.2 評価ランク定義

| スコア範囲 | ランク | 評価 | メッセージ |
|-----------|--------|------|----------|
| 90〜100点 | S | 価値主義経営の模範企業 | あなたの会社は価値主義経営を完璧に実践しています。業界のベンチマークとなる存在です。 |
| 80〜89点 | A | 価値主義経営を高いレベルで実践 | 価値主義経営の核心を理解し、実践しています。さらなる高みを目指せます。 |
| 70〜79点 | B+ | 価値主義経営を実践中 | 価値主義経営の基本を押さえています。弱点を補強すれば飛躍できます。 |
| 60〜69点 | B | 価値主義経営の実践途上 | 価値主義経営への意識はありますが、実践レベルに課題があります。 |
| 50〜59点 | C | 価値主義経営の入り口 | 価値主義経営を学び始めた段階です。改善の余地が大きくあります。 |
| 0〜49点 | D | 売上主義経営 | 売上至上主義の傾向が強く、価値主義経営への転換が必要です。 |

### 3.3 カテゴリー別評価

各カテゴリーのスコアに基づき、強み/弱みを自動判定:

```typescript
interface CategoryEvaluation {
  category: string;
  score: number;
  maxScore: number;
  percentage: number;
  strength: 'strong' | 'moderate' | 'weak';
  message: string;
}

function evaluateCategory(score: number, maxScore: number): CategoryEvaluation {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 80) {
    return {
      strength: 'strong',
      message: 'この領域は強みです。さらに磨きをかけましょう。'
    };
  } else if (percentage >= 50) {
    return {
      strength: 'moderate',
      message: 'この領域は改善の余地があります。'
    };
  } else {
    return {
      strength: 'weak',
      message: 'この領域は優先的に改善すべきです。'
    };
  }
}
```

---

## 4. AI分析エンジン

### 4.1 Claude API統合

**使用モデル**: `claude-sonnet-4-20250514`

**プロンプト設計**:

```typescript
const diagnosticPrompt = `
あなたは田尻望の「価値主義経営®」の専門家です。
以下の診断結果に基づき、具体的な改善提言を生成してください。

# 診断結果

## 総合スコア
- スコア: ${finalScore}点
- ランク: ${rank}

## カテゴリー別スコア
${categoryScores.map(c => `- ${c.category}: ${c.score}/${c.maxScore}点 (${c.percentage}%)`).join('\n')}

## 回答詳細
${answers.map(a => `Q${a.questionNumber}. ${a.question}\n回答: ${a.selectedOption}`).join('\n\n')}

## 定量データ
- 売上: ${revenue}万円
- 外部購入価値: ${externalCosts}万円
- 付加価値: ${addedValue}万円
- 付加価値率: ${addedValueRate}%
- 従業員数: ${employeeCount}人
- 労働生産性: ${laborProductivity}万円/人

# 指示

以下の形式で、具体的かつ実践可能な改善提言を生成してください:

1. **総合評価（100文字以内）**: この企業の価値主義経営の現状を端的に評価
2. **強み（3つ）**: スコアが高いカテゴリーに基づく強み
3. **弱み（3つ）**: スコアが低いカテゴリーに基づく弱み
4. **優先改善施策（3つ）**: 最も効果的な改善施策を具体的に
5. **3ヶ月アクションプラン**: 明日から始められる具体的な行動計画

# 制約

- 田尻望の「付加価値のつくりかた」の理論に忠実に
- 抽象的な提言ではなく、具体的なアクション
- 数値目標を可能な限り含める
- 優先順位を明確に
- 企業規模（従業員数）に応じた現実的な提言
`;
```

### 4.2 AI応答構造

```typescript
interface AIAnalysisResult {
  summary: string; // 総合評価（100文字以内）
  strengths: Array<{
    title: string;
    description: string;
    category: string;
  }>;
  weaknesses: Array<{
    title: string;
    description: string;
    category: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: Array<{
    priority: 1 | 2 | 3;
    title: string;
    description: string;
    expectedImpact: string;
    timeframe: string; // "3ヶ月", "6ヶ月", etc.
    difficulty: 'easy' | 'medium' | 'hard';
  }>;
  actionPlan: {
    week1: string[];
    month1: string[];
    month3: string[];
  };
}
```

### 4.3 フォールバック戦略

Claude APIが利用不可の場合、ルールベース分析を使用:

```typescript
function generateFallbackAnalysis(diagnosticResult: DiagnosticResult): AIAnalysisResult {
  // カテゴリースコアに基づくルールベース分析
  const weakestCategory = findWeakestCategory(diagnosticResult.categoryScores);

  // 事前定義された改善テンプレートを使用
  const recommendations = RECOMMENDATION_TEMPLATES[weakestCategory];

  return {
    summary: generateSummaryFromScore(diagnosticResult.finalScore),
    strengths: generateStrengthsFromScores(diagnosticResult.categoryScores),
    weaknesses: generateWeaknessesFromScores(diagnosticResult.categoryScores),
    recommendations: recommendations,
    actionPlan: generateActionPlanFromRecommendations(recommendations)
  };
}
```

---

## 5. レポート構成

### 5.1 レポート構造

```
価値主義AI診断レポート
===================

企業名: _______________
診断日: 2024年11月30日
診断ID: DIAG-20241130-XXXX

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 総合評価
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

スコア: 72.5点
ランク: B+（価値主義経営を実践中）

[グラフィカルスコア表示]
■■■■■■■■■■■■■■■□□□□□ 72.5/100

総合評価:
あなたの企業は価値主義経営の基本を押さえており、
付加価値への意識は高いです。仕組み化と労働生産性の
向上に取り組むことで、さらなる成長が期待できます。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📈 カテゴリー別評価
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

A. 付加価値理解度: 17/20点 (85%) ✅ 強み
B. シン・マーケットイン実践度: 14/20点 (70%) ⚠️ 改善余地
C. 仕組み化・標準化レベル: 10/20点 (50%) ⚠️ 改善余地
D. 労働生産性への意識: 13/20点 (65%) ⚠️ 改善余地
E. 価値創造時間の最大化: 16/20点 (80%) ✅ 強み
F. 定量評価: 17/20点 (85%) ✅ 強み

[レーダーチャート表示]
      付加価値理解
          /\
         /  \
時間最大化  マーケットイン
       |    |
  生産性  仕組み化

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💪 あなたの強み
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 付加価値への深い理解
   付加価値率を定期的に計測し、経営判断の軸としています。
   この意識の高さが、価値主義経営の基盤となっています。

2. 価値創造時間の意識
   会議時間の削減や社内業務の効率化に取り組んでおり、
   「人の命の時間」を価値創造に振り向ける姿勢があります。

3. 高い付加価値率
   付加価値率78%は業界平均を大きく上回っており、
   外部購入に頼らない強固なビジネスモデルです。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 改善が必要な領域
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 仕組み化・標準化の遅れ（影響度: 高）
   営業プロセスや業務プロセスが属人的で、再現性が低い状態です。
   優秀な人材への依存度が高く、スケールの障壁となっています。

2. シン・マーケットイン実践度の不足（影響度: 中）
   顧客課題への深い洞察が不足しており、プロダクトアウトの
   傾向が見られます。顧客接点を増やす必要があります。

3. 労働生産性の測定・管理不足（影響度: 中）
   全社ベースでは把握していますが、部門別・個人別の
   労働生産性可視化ができておらず、改善施策が打てていません。

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 優先改善施策（3ヶ月プラン）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【優先度1】営業プロセスの標準化・マニュアル化
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
実施内容:
  - トップセールス3名の営業プロセスを可視化
  - 商談フロー、トークスクリプト、提案資料をテンプレート化
  - 営業マニュアル（30ページ）を作成
  - 新人研修プログラムを整備

期待効果:
  - 新人の立ち上がり期間が6ヶ月→3ヶ月に短縮
  - 営業全体の成約率が20%向上
  - 属人性が50%減少

実施期間: 3ヶ月
難易度: 中

【優先度2】顧客接点時間の増加（経営陣）
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
実施内容:
  - 経営陣が週5時間以上、顧客と直接対話するルール化
  - 月1回の「顧客観察デー」を設定
  - 顧客インタビュー30件/四半期を目標化
  - 顧客の声を経営会議で共有する仕組み作り

期待効果:
  - 顧客課題の発見精度が向上
  - プロダクト開発の方向性が明確化
  - 顧客満足度が15%向上

実施期間: 3ヶ月
難易度: 易

【優先度3】労働生産性の可視化ダッシュボード構築
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
実施内容:
  - 部門別・個人別の付加価値を月次で計測
  - Googleスプレッドシート/BIツールでダッシュボード構築
  - 月次経営会議で労働生産性を議題化
  - 改善活動をKPIに組み込む

期待効果:
  - 低生産性部門が明確化され、改善施策が打てる
  - 個人の成果が可視化され、モチベーション向上
  - 全社労働生産性が20%向上

実施期間: 2ヶ月
難易度: 易

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📅 3ヶ月アクションプラン
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

【第1週】
□ トップセールスの営業プロセスヒアリング（3名×2時間）
□ 経営陣の顧客接点時間を週間スケジュールに組み込む
□ 労働生産性計測のデータ収集開始

【第1ヶ月】
□ 営業マニュアル初版作成（20ページ）
□ 顧客インタビュー10件実施
□ 労働生産性ダッシュボード（α版）構築
□ 全社キックオフミーティング開催

【第3ヶ月】
□ 営業マニュアル完成版（30ページ）
□ 新人研修プログラム運用開始
□ 顧客インタビュー30件達成
□ 労働生産性ダッシュボード本格運用
□ 月次レビュー会議で進捗確認

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📚 推奨学習リソース
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

書籍:
- 「付加価値のつくりかた」 田尻望
- 「シン・マーケットイン」 田尻望
- 「識学」 安藤広大

オンラインコース:
- 価値主義AI Academy（準備中）
- カクシンAIコンサルティング無料診断セッション

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✉️ 次のステップ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

このレポートを基に、さらに深い診断やコンサルティングを
ご希望の場合は、以下からお申し込みください:

□ 無料30分戦略セッション予約
□ 価値主義経営コンサルティング詳細資料ダウンロード
□ カクシンAI実装サービス資料請求

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

診断レポート生成: Miyabi AI Diagnosis Engine v1.0
Powered by Claude Sonnet 4 + 価値主義経営®

© 2024 株式会社カクシン. All rights reserved.
```

### 5.2 出力形式

レポートは以下の形式で提供:

1. **Web版**: HTML + CSS（レスポンシブ）
2. **PDF版**: 印刷可能なPDF（A4サイズ）
3. **JSON版**: API経由での取得用

### 5.3 グラフィック要素

- **スコアバー**: CSS Grid + SVG
- **レーダーチャート**: Chart.js または D3.js
- **カテゴリーアイコン**: Heroicons または Lucide React

---

## 6. 入力フォーム設計

### 6.1 フォーム構造

**ページ構成**: マルチステップフォーム（5ページ + 確認ページ）

```
[進捗バー: ━━━━━━━━━━━━━━━━━━━━━━ 1/6]

ページ1: 企業情報入力
ページ2: カテゴリーA+B（付加価値・マーケットイン）
ページ3: カテゴリーC+D（仕組み化・労働生産性）
ページ4: カテゴリーE（価値創造時間）
ページ5: 定量データ入力（売上・従業員数）
ページ6: 確認・送信
```

### 6.2 ページ1: 企業情報入力

```tsx
<Form>
  <Input
    label="企業名"
    name="companyName"
    required
    placeholder="株式会社〇〇"
  />

  <Input
    label="診断者名"
    name="userName"
    required
    placeholder="山田太郎"
  />

  <Input
    label="役職"
    name="position"
    placeholder="代表取締役 / 事業部長 など"
  />

  <Select
    label="業種"
    name="industry"
    options={[
      "製造業",
      "IT・ソフトウェア",
      "コンサルティング",
      "小売・EC",
      "サービス業",
      "その他"
    ]}
  />

  <Select
    label="従業員規模"
    name="employeeRange"
    options={[
      "1〜10名",
      "11〜50名",
      "51〜100名",
      "101〜300名",
      "301〜1000名",
      "1001名以上"
    ]}
  />

  <Button type="submit">次へ</Button>
</Form>
```

### 6.3 ページ2〜5: 診断質問

各質問は以下のフォーマット:

```tsx
<QuestionCard>
  <QuestionNumber>Q1</QuestionNumber>
  <QuestionText>
    自社の付加価値率を把握していますか?
  </QuestionText>

  <OptionGroup>
    <RadioOption value="A" score={10}>
      <OptionLabel>A. 正確に把握している</OptionLabel>
      <OptionDescription>
        毎月/四半期で付加価値率を計算し、経営会議で議論している。
        直近の付加価値率を即答できる。
      </OptionDescription>
      <PointBadge>+10点</PointBadge>
    </RadioOption>

    <RadioOption value="B" score={7}>
      <OptionLabel>B. おおよそ把握している</OptionLabel>
      <OptionDescription>
        年に数回は計算している。±5%程度の誤差で把握している。
      </OptionDescription>
      <PointBadge>+7点</PointBadge>
    </RadioOption>

    {/* 他のオプション */}
  </OptionGroup>

  <NavigationButtons>
    <Button variant="outline" onClick={goBack}>戻る</Button>
    <Button onClick={goNext} disabled={!answered}>次へ</Button>
  </NavigationButtons>
</QuestionCard>
```

### 6.4 ページ6: 確認・送信

```tsx
<ConfirmationPage>
  <SectionTitle>入力内容の確認</SectionTitle>

  <CompanyInfo>
    <Label>企業名:</Label> {companyName}
    <Label>診断者:</Label> {userName}
    {/* 他の企業情報 */}
  </CompanyInfo>

  <AnswerSummary>
    {answers.map((answer, index) => (
      <AnswerRow key={index}>
        <QuestionText>Q{index + 1}. {answer.question}</QuestionText>
        <SelectedAnswer>{answer.selectedOption}</SelectedAnswer>
        <Score>{answer.score}点</Score>
      </AnswerRow>
    ))}
  </AnswerSummary>

  <TotalScorePreview>
    暫定スコア: {calculateTotalScore()}点
  </TotalScorePreview>

  <SubmitButton onClick={generateReport}>
    診断レポートを生成
  </SubmitButton>
</ConfirmationPage>
```

### 6.5 UX要件

| 要件 | 仕様 |
|------|------|
| レスポンシブ | Mobile First（320px〜） |
| アクセシビリティ | WCAG 2.1 AA準拠 |
| 回答保存 | LocalStorageで自動保存 |
| 所要時間表示 | 各ページに「残り〇分」表示 |
| バリデーション | リアルタイム入力検証 |
| プログレスバー | 6ステップ進捗表示 |

---

## 7. 技術アーキテクチャ

### 7.1 システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────┤
│  診断フォーム  │  レポート表示  │  ダッシュボード  │
│  (React)      │  (React+Chart) │  (Admin)        │
└────────┬────────────────────────────────────────────────┘
         │ HTTPS (REST API / GraphQL)
         │
┌────────▼────────────────────────────────────────────────┐
│              Backend API (TypeScript + Express)          │
├─────────────────────────────────────────────────────────┤
│  診断エンジン  │  スコアリング  │  AI分析API  │  認証  │
└────────┬────────────────────────────────────────────────┘
         │
    ┌────┴─────┬──────────┬──────────┐
    │          │          │          │
┌───▼───┐  ┌──▼──┐  ┌───▼────┐  ┌─▼──┐
│Firestore│  │Claude│  │Firebase│  │ GCS│
│(診断結果)│  │API   │  │ Auth   │  │(PDF)│
└─────────┘  └──────┘  └────────┘  └────┘
```

### 7.2 技術スタック

#### Frontend

```json
{
  "framework": "Next.js 15 (App Router)",
  "language": "TypeScript 5.7",
  "ui": "shadcn/ui + Tailwind CSS",
  "charts": "Chart.js / Recharts",
  "forms": "React Hook Form + Zod",
  "state": "Zustand / Jotai",
  "api": "TanStack Query (React Query)"
}
```

#### Backend

```json
{
  "runtime": "Node.js 20 LTS",
  "framework": "Express.js / Fastify",
  "language": "TypeScript 5.7",
  "validation": "Zod",
  "ai": "@anthropic-ai/sdk",
  "database": "Firestore (Firebase)",
  "storage": "Google Cloud Storage",
  "auth": "Firebase Auth",
  "deployment": "Cloud Run / Vercel"
}
```

### 7.3 データモデル

#### DiagnosticSession (Firestore Collection)

```typescript
interface DiagnosticSession {
  // メタデータ
  sessionId: string; // UUID
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: 'in_progress' | 'completed' | 'abandoned';

  // 企業情報
  companyInfo: {
    companyName: string;
    userName: string;
    position?: string;
    industry: string;
    employeeRange: string;
    email?: string;
  };

  // 回答データ
  answers: Array<{
    questionId: string;
    questionText: string;
    selectedOption: string; // "A", "B", "C", "D"
    score: number;
  }>;

  // 定量データ
  quantitativeData: {
    revenue: number; // 万円
    externalCosts: number; // 万円
    employeeCount: number;
    addedValue: number; // 自動計算
    addedValueRate: number; // 自動計算（%）
    laborProductivity: number; // 自動計算（万円/人）
  };

  // スコアリング結果
  scoring: {
    categoryScores: {
      A_addedValueUnderstanding: number;
      B_marketInPractice: number;
      C_systematization: number;
      D_laborProductivity: number;
      E_valueCreationTime: number;
      F_quantitativeEvaluation: number;
    };
    rawScore: number; // 120点満点
    normalizedScore: number; // 100点満点
    finalScore: number; // 四捨五入後
    rank: 'S' | 'A' | 'B+' | 'B' | 'C' | 'D';
  };

  // AI分析結果
  aiAnalysis?: {
    summary: string;
    strengths: Array<{
      title: string;
      description: string;
      category: string;
    }>;
    weaknesses: Array<{
      title: string;
      description: string;
      category: string;
      impact: 'high' | 'medium' | 'low';
    }>;
    recommendations: Array<{
      priority: 1 | 2 | 3;
      title: string;
      description: string;
      expectedImpact: string;
      timeframe: string;
      difficulty: 'easy' | 'medium' | 'hard';
    }>;
    actionPlan: {
      week1: string[];
      month1: string[];
      month3: string[];
    };
    generatedAt: Timestamp;
    model: string; // "claude-sonnet-4-20250514"
  };

  // レポート
  reportUrl?: string; // GCS URL (PDF)
  reportGeneratedAt?: Timestamp;
}
```

### 7.4 API設計

#### POST /api/v1/diagnosis/session

診断セッション作成

```typescript
// Request
{
  companyInfo: {
    companyName: string;
    userName: string;
    position?: string;
    industry: string;
    employeeRange: string;
  }
}

// Response
{
  sessionId: string;
  status: "in_progress";
  createdAt: string;
}
```

#### PUT /api/v1/diagnosis/session/:sessionId/answer

回答を保存

```typescript
// Request
{
  questionId: string;
  selectedOption: string;
  score: number;
}

// Response
{
  sessionId: string;
  totalAnswered: number;
  totalQuestions: number;
  currentScore: number;
}
```

#### POST /api/v1/diagnosis/session/:sessionId/complete

診断完了・レポート生成

```typescript
// Request
{
  quantitativeData: {
    revenue: number;
    externalCosts: number;
    employeeCount: number;
  }
}

// Response
{
  sessionId: string;
  finalScore: number;
  rank: string;
  reportUrl: string;
  aiAnalysis: AIAnalysisResult;
}
```

#### GET /api/v1/diagnosis/report/:sessionId

レポート取得

```typescript
// Response
{
  sessionId: string;
  companyInfo: CompanyInfo;
  scoring: ScoringResult;
  aiAnalysis: AIAnalysisResult;
  reportUrl: string; // PDF
  reportHtml: string; // HTML version
}
```

### 7.5 セキュリティ要件

| 要件 | 実装方法 |
|------|---------|
| 認証 | Firebase Auth (Optional) |
| データ暗号化 | Firestore暗号化（デフォルト） |
| API Rate Limiting | Express Rate Limit (100 req/15min) |
| CORS | ホワイトリスト方式 |
| 個人情報保護 | 90日後自動削除 |
| Claude API Key | Google Secret Manager |

### 7.6 パフォーマンス要件

| 指標 | 目標値 |
|------|--------|
| ページロード時間 | < 2秒 (LCP) |
| API応答時間 | < 500ms (p95) |
| AI分析生成時間 | < 30秒 |
| PDFレポート生成 | < 10秒 |
| 同時セッション | 100+ |

---

## 8. 実装優先順位

### 8.1 Phase 1: MVP（2週間）

**目標**: 基本的な診断フローの実装

- [ ] 診断フォーム（12質問）実装
- [ ] スコアリングエンジン実装
- [ ] 基本レポート表示（テキストのみ）
- [ ] Firestore統合
- [ ] ローカル環境でE2Eテスト

**成果物**:
- 診断フォーム（Web版）
- スコアリング結果（JSON）
- 基本レポート（HTML）

### 8.2 Phase 2: AI統合（1週間）

**目標**: Claude API統合と高度な分析

- [ ] Claude Sonnet 4 API統合
- [ ] プロンプトエンジニアリング
- [ ] AI分析結果の構造化
- [ ] フォールバック分析実装
- [ ] エラーハンドリング

**成果物**:
- AI分析レポート
- 改善提言生成
- アクションプラン

### 8.3 Phase 3: UX改善（1週間）

**目標**: ユーザー体験の向上

- [ ] レーダーチャート実装
- [ ] スコアバー・プログレスバー
- [ ] レスポンシブ対応
- [ ] アニメーション追加
- [ ] アクセシビリティ対応

**成果物**:
- グラフィカルレポート
- モバイル対応
- WCAG 2.1 AA準拠

### 8.4 Phase 4: PDF生成（1週間）

**目標**: PDF出力機能

- [ ] Puppeteer / Playwright統合
- [ ] PDFテンプレート作成
- [ ] GCS連携
- [ ] ダウンロード機能

**成果物**:
- 印刷可能PDFレポート
- ダウンロード機能

### 8.5 Phase 5: 管理画面（1週間）

**目標**: 管理者向けダッシュボード

- [ ] 診断セッション一覧
- [ ] 統計ダッシュボード
- [ ] ユーザー管理
- [ ] CSV/Excelエクスポート

**成果物**:
- 管理画面（shadcn/ui）
- 統計レポート

### 8.6 Phase 6: 本番リリース（1週間）

**目標**: 本番環境デプロイ

- [ ] Vercel/Cloud Runデプロイ
- [ ] 独自ドメイン設定
- [ ] モニタリング設定（Sentry, Google Analytics）
- [ ] パフォーマンスチューニング
- [ ] セキュリティ監査

**成果物**:
- 本番環境URL
- 運用ドキュメント

---

## まとめ

本設計ドキュメントは、田尻望の「価値主義経営®」を忠実にAI診断モジュールとして実装するための詳細な設計書です。

### 設計の特徴

1. **実践的な診断質問**: 抽象論ではなく、具体的な行動・数値で診断
2. **明確なスコアリング**: 100点満点、6ランク評価
3. **AI駆動の提言**: Claude Sonnet 4による具体的アクションプラン
4. **実装可能性**: 6週間で本番リリース可能な現実的設計

### 次のステップ

1. Issue #4 として本設計書を承認
2. サブIssue分割（Phase 1〜6）
3. CoordinatorAgent による並列実行プラン作成
4. CodeGenAgent による実装開始

---

🌸 Miyabi × カクシン - 価値主義AI開発の新時代

Generated by: Miyabi CodeGenAgent
Date: 2024-11-30
