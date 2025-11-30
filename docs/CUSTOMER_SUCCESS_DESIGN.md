# カスタマーサクセス体制構築設計書

## ドキュメント情報

| 項目 | 内容 |
|------|------|
| ドキュメントID | CS-DESIGN-001 |
| バージョン | 1.0.0 |
| 作成日 | 2025-11-30 |
| 関連Issue | #14 カスタマーサクセス体制構築 |
| 親Issue | #2 カクシン進化 |
| ステータス | Draft |

## エグゼクティブサマリー

本設計書は、Miyabi SaaSプラットフォームにおけるカスタマーサクセス（CS）体制の構築を目的とし、**チャーン率5%以下**を達成するための包括的な戦略とシステム設計を定義します。

### 主要目標

- **チャーン率**: 5%以下（年間）
- **NPS（Net Promoter Score）**: 50以上
- **オンボーディング完了率**: 90%以上
- **ヘルススコアGreen比率**: 75%以上
- **アップセル/クロスセル成功率**: 20%以上

---

## 目次

1. [CS組織設計](#1-cs組織設計)
2. [ヘルススコア設計](#2-ヘルススコア設計)
3. [オンボーディングプロセス](#3-オンボーディングプロセス)
4. [チャーン予防施策](#4-チャーン予防施策)
5. [NPS計測システム](#5-nps計測システム)
6. [KPI定義とモニタリング](#6-kpi定義とモニタリング)
7. [技術スタック](#7-技術スタック)
8. [実装ロードマップ](#8-実装ロードマップ)

---

## 1. CS組織設計

### 1.1 組織構造

```
Head of Customer Success
│
├── Customer Success Management（CSM）チーム
│   ├── Enterprise CSM（顧客50社まで/人）
│   ├── Mid-Market CSM（顧客100社まで/人）
│   └── SMB CSM（デジタルタッチ+一部ハイタッチ）
│
├── Customer Onboarding チーム
│   ├── Onboarding Specialist（新規顧客専門）
│   └── Implementation Engineer（技術導入支援）
│
├── Customer Education チーム
│   ├── Academy Manager（学習コンテンツ管理）
│   └── Webinar Coordinator（ウェビナー企画・運営）
│
├── Customer Analytics チーム
│   ├── CS Analyst（データ分析・インサイト）
│   └── BI Engineer（ダッシュボード構築）
│
└── Customer Support（カスタマーサポート）
    ├── L1 Support（基本的な問い合わせ対応）
    ├── L2 Support（技術的な問題解決）
    └── L3 Support（高度な技術支援・エスカレーション）
```

### 1.2 役割と責任（RACI）

| タスク | CSM | Onboarding | Education | Analytics | Support |
|--------|-----|------------|-----------|-----------|---------|
| 契約更新交渉 | A/R | C | I | I | I |
| オンボーディング | C | A/R | C | I | C |
| 健全性モニタリング | A/R | I | I | R | C |
| 利用促進施策 | A/R | C | R | R | I |
| エスカレーション対応 | R | C | I | I | A/R |
| 教育コンテンツ作成 | C | C | A/R | I | C |
| データ分析・レポート | C | I | I | A/R | I |
| 技術サポート | I | C | I | I | A/R |

**凡例**: A=Accountable（説明責任）, R=Responsible（実行責任）, C=Consulted（相談）, I=Informed（報告）

### 1.3 カスタマーセグメント別アプローチ

#### Enterprise（月額50万円以上）

- **担当**: Dedicated CSM（1:50）
- **タッチポイント**: 月次QBR（Quarterly Business Review）、週次チェックイン
- **サポート**: 専用Slackチャネル、優先サポート（SLA 2時間）
- **特典**: カスタム開発相談、ロードマップ優先反映

#### Mid-Market（月額10-50万円）

- **担当**: Shared CSM（1:100）
- **タッチポイント**: 四半期レビュー、月次ヘルスチェック
- **サポート**: 標準サポート（SLA 8時間）
- **特典**: グループウェビナー、ベストプラクティス共有

#### SMB（月額10万円未満）

- **担当**: デジタルタッチ + Pool CSM
- **タッチポイント**: 自動化メール、セルフサービスポータル
- **サポート**: コミュニティサポート（SLA 24時間）
- **特典**: オンラインアカデミー、コミュニティアクセス

### 1.4 採用計画（フェーズ別）

#### Phase 1（最初の6ヶ月）

- Head of Customer Success × 1
- Enterprise CSM × 2
- Onboarding Specialist × 1
- CS Analyst × 1
- L1/L2 Support × 2

**合計**: 7名

#### Phase 2（7-12ヶ月）

- Mid-Market CSM × 2
- Implementation Engineer × 1
- Academy Manager × 1
- L2/L3 Support × 2

**追加**: 6名（累計13名）

#### Phase 3（13-18ヶ月）

- SMB CSM × 2
- Webinar Coordinator × 1
- BI Engineer × 1
- L1 Support × 1

**追加**: 5名（累計18名）

### 1.5 トレーニングプログラム

#### 新規CSM向け（最初の30日間）

| Week | 内容 | 成果物 |
|------|------|--------|
| 1 | 製品理解（Miyabi操作、主要機能、技術スタック） | 製品デモ実施 |
| 2 | 顧客理解（ペルソナ、ユースケース、業界知識） | 顧客プロファイル作成 |
| 3 | プロセス習得（Playbook、ツール、エスカレーション） | 模擬QBR実施 |
| 4 | シャドーイング＋顧客引き継ぎ | 初回顧客ミーティング |

#### 継続的学習

- **週次**: 製品アップデート勉強会
- **月次**: CS Best Practice共有会
- **四半期**: 業界トレンド研修
- **年次**: CS資格取得支援（SaaS Academy、Gainsightなど）

---

## 2. ヘルススコア設計

### 2.1 ヘルススコア算出ロジック

ヘルススコアは**0-100点**のスコアで顧客の健全性を可視化します。

#### スコアリング要素（重み付き）

| カテゴリ | 指標 | 重み | 測定方法 |
|---------|------|------|---------|
| **利用状況** | アクティブユーザー率 | 25% | MAU / ライセンス数 |
| | 主要機能利用率 | 15% | コア機能の利用頻度 |
| | ログイン頻度 | 10% | 過去30日間の平均ログイン日数 |
| **エンゲージメント** | サポートチケット解決率 | 10% | 解決数 / 総チケット数 |
| | NPS回答スコア | 10% | 最新NPS調査結果 |
| | コミュニティ参加度 | 5% | フォーラム投稿、イベント参加 |
| **ビジネス成果** | ROI達成度 | 15% | 顧客が定義したKPI達成率 |
| | 導入完了率 | 10% | オンボーディングマイルストーン達成 |

#### 計算式

```
ヘルススコア =
  (アクティブユーザー率 × 0.25) +
  (主要機能利用率 × 0.15) +
  (ログイン頻度スコア × 0.10) +
  (サポートチケット解決率 × 0.10) +
  (NPS正規化スコア × 0.10) +
  (コミュニティ参加度 × 0.05) +
  (ROI達成度 × 0.15) +
  (導入完了率 × 0.10)
```

### 2.2 ヘルスステータス定義

| スコア範囲 | ステータス | アクション | オーナー |
|-----------|----------|----------|---------|
| 80-100 | Green（健全） | 定期タッチポイント、アップセル機会探索 | CSM |
| 60-79 | Yellow（注意） | 週次チェックイン、利用促進施策 | CSM |
| 40-59 | Orange（警告） | 即座にミーティング設定、課題ヒアリング | CSM + Manager |
| 0-39 | Red（危機） | エグゼクティブエスカレーション、救済プラン作成 | Head of CS + CXO |

### 2.3 ヘルススコアダッシュボード

#### リアルタイムモニタリング

- **全体ビュー**: ステータス別顧客数（Green/Yellow/Orange/Red）
- **トレンド**: 過去90日間のスコア推移
- **セグメント別**: Enterprise/Mid-Market/SMB別の平均スコア
- **CSM別**: 担当CSMごとのポートフォリオヘルス

#### アラート設定

- **Red Alert**: スコアが40未満に低下した場合、即座にSlack + Email通知
- **Yellow Alert**: スコアが20ポイント以上急降下した場合
- **Churn Risk Alert**: 契約更新90日前でスコア60未満の場合

### 2.4 データソース統合

```
┌─────────────────┐
│ Miyabi Platform │ → ログイン、機能利用データ
└────────┬────────┘
         │
┌────────▼────────┐
│ Analytics DB    │ → BigQuery/Snowflake
└────────┬────────┘
         │
┌────────▼────────┐   ┌──────────────┐
│ CS Platform     │←──│ Salesforce   │ 契約・商談データ
│ (Gainsight/     │   └──────────────┘
│  ChurnZero)     │   ┌──────────────┐
│                 │←──│ Zendesk      │ サポートデータ
│                 │   └──────────────┘
└────────┬────────┘   ┌──────────────┐
         │            │ Intercom     │ ユーザーコミュニケーション
         └────────────┤              │
                      └──────────────┘
```

---

## 3. オンボーディングプロセス

### 3.1 オンボーディングジャーニー（90日間）

#### Phase 1: Kickoff（Day 1-7）

**目標**: 初期設定完了、チーム招待、初回ログイン

| タスク | 担当 | 完了条件 |
|--------|------|---------|
| キックオフミーティング | Onboarding Specialist | ゴール設定、スケジュール合意 |
| ワークスペース作成 | 顧客（ガイド付き） | 初回ログイン成功 |
| チームメンバー招待 | 顧客 | 5名以上招待完了 |
| 初期設定ウィザード完了 | 顧客 | プロジェクト1件作成 |
| Slack連携設定 | Implementation Engineer | 通知受信確認 |

**成功指標**: 7日以内に全タスク完了 → 90%以上

#### Phase 2: Foundation（Day 8-30）

**目標**: コア機能習得、初期データ投入

| タスク | 担当 | 完了条件 |
|--------|------|---------|
| 製品トレーニング（基礎編） | Academy Manager | 動画視聴 + クイズ合格 |
| 初回Agent実行 | 顧客（サポート付き） | 1つ以上のAgent実行成功 |
| GitHub連携設定 | 顧客 | リポジトリ接続完了 |
| カスタムWorkflow作成 | Implementation Engineer | 顧客特有のワークフロー1件 |
| 初回成果レビュー | Onboarding Specialist | 小さな成功事例の確認 |

**成功指標**: 30日以内に80%以上のタスク完了

#### Phase 3: Adoption（Day 31-60）

**目標**: 日常業務への組み込み、チーム全体への展開

| タスク | 担当 | 完了条件 |
|--------|------|---------|
| 製品トレーニング（応用編） | Academy Manager | 高度な機能の習得 |
| ベストプラクティス共有 | CSM | 他社事例の適用 |
| チーム拡大支援 | CSM | 追加ユーザー10名以上 |
| KPI設定 | CSM | 測定可能なKPI 3つ設定 |
| 月次レビュー | CSM | 初回QBR実施 |

**成功指標**: アクティブユーザー率50%以上

#### Phase 4: Value Realization（Day 61-90）

**目標**: ビジネス成果の実現、ROI証明

| タスク | 担当 | 完了条件 |
|--------|------|---------|
| ROI計測 | CS Analyst | 定量的な成果レポート作成 |
| 成功事例作成 | CSM | ケーススタディドラフト |
| エグゼクティブレビュー | CSM + Manager | CxOへの報告実施 |
| オンボーディング完了認定 | Onboarding Specialist | 全マイルストーン達成 |
| CSMへの引き継ぎ | Onboarding → CSM | 継続的な成功管理へ移行 |

**成功指標**:
- オンボーディング完了率 90%以上
- 初期NPS 40以上
- ヘルススコア 70以上

### 3.2 オンボーディング自動化

#### 自動化ツール

- **プロジェクト管理**: Asana / Monday.com（オンボーディングテンプレート）
- **コミュニケーション**: Intercom（プロダクトツアー、チャットボット）
- **教育**: Lessonly / Pendo（インタラクティブガイド）
- **トラッキング**: Gainsight（マイルストーン管理）

#### 自動化シーケンス例

**Day 1**: ウェルカムメール + キックオフミーティング招待
**Day 3**: 初回ログイン未実施の場合 → リマインダー
**Day 7**: 基礎トレーニング動画送付
**Day 14**: チェックインミーティング自動予約
**Day 30**: 初回成果レビュー招待
**Day 60**: NPS調査実施
**Day 90**: オンボーディング完了証明書発行

### 3.3 Early Warning System（早期警告システム）

オンボーディング中の離脱リスクを検知：

| リスク指標 | 閾値 | アクション |
|-----------|------|----------|
| 7日以内に未ログイン | Day 7経過 | Onboarding Specialistから電話 |
| チームメンバー招待0件 | Day 14経過 | Implementation Engineerがハンズオン支援 |
| Agent実行0件 | Day 30経過 | 緊急ミーティング設定 |
| トレーニング未完了 | Day 45経過 | Managerエスカレーション |
| NPS < 30 | Day 60調査 | 救済プラン作成 |

---

## 4. チャーン予防施策

### 4.1 チャーン予測モデル

#### 予測因子（機械学習モデル）

| カテゴリ | 特徴量 | 重要度 |
|---------|--------|--------|
| **利用状況** | 過去30日間のログイン日数 | High |
| | アクティブユーザー率の推移 | High |
| | 主要機能利用率 | Medium |
| **エンゲージメント** | サポートチケット数（増加傾向） | Medium |
| | NPS推移 | High |
| | コミュニティ参加度 | Low |
| **ビジネス** | 契約更新履歴 | High |
| | 支払い遅延 | Medium |
| | 組織変更（担当者変更） | Medium |
| **外部要因** | 市場トレンド | Low |
| | 競合動向 | Low |

#### 予測精度目標

- **Precision（適合率）**: 70%以上（予測がチャーンの場合、実際にチャーンする確率）
- **Recall（再現率）**: 85%以上（実際のチャーンのうち、予測できた割合）
- **F1 Score**: 0.75以上

### 4.2 チャーン予防Playbook

#### Red Alert（チャーン確率 > 70%）

**即座のアクション（24時間以内）**:
1. Head of CSがエグゼクティブにエスカレーション
2. 緊急ミーティング設定（CxO同席）
3. 課題の徹底ヒアリング
4. 90日間の救済プラン作成

**救済プラン例**:
- 専任Implementation Engineerのアサイン（2週間）
- カスタム機能開発の優先対応
- 一時的な割引提供（契約延長条件付き）
- エグゼクティブスポンサープログラム

#### Orange Alert（チャーン確率 40-70%）

**48時間以内のアクション**:
1. CSM Managerがレビュー
2. 顧客とのミーティング設定
3. ヘルススコア低下要因の分析
4. 改善計画の策定

**改善計画例**:
- 利用促進ワークショップ（1日）
- ベストプラクティス共有セッション
- 追加トレーニングの提供
- ROI再計算とビジネスケース再確認

#### Yellow Alert（チャーン確率 20-40%）

**1週間以内のアクション**:
1. CSMが顧客と定期チェックイン
2. 利用状況の詳細レビュー
3. クイックウィンの提案

**施策例**:
- 新機能の紹介
- 他社成功事例の共有
- コミュニティイベントへの招待

### 4.3 Retention Campaigns（定着化キャンペーン）

#### 月次Value Check-in

**対象**: 全顧客（セグメント別にカスタマイズ）
**頻度**: 月次
**内容**:
- 利用状況サマリーレポート
- ROI計測（コスト削減、時間削減）
- 新機能ハイライト
- ベストプラクティスTips

#### Quarterly Business Review（QBR）

**対象**: Enterprise / Mid-Market
**頻度**: 四半期
**アジェンダ**:
1. 前四半期の成果レビュー
2. KPI達成状況
3. 課題と改善策
4. 次四半期の目標設定
5. ロードマップ共有

**成果物**:
- QBRレポート（PDF）
- アクションアイテムリスト
- Success Plan更新

#### Customer Advisory Board（CAB）

**対象**: Top 20%顧客（エンゲージメント高）
**頻度**: 半年
**目的**:
- 製品ロードマップへのフィードバック
- 業界トレンドの共有
- ピアネットワーキング

**特典**:
- 新機能の早期アクセス
- 専用コミュニティ
- 年次カンファレンス招待

### 4.4 Win-back Program（復帰プログラム）

チャーンした顧客の再獲得戦略：

| タイミング | アクション | オファー |
|-----------|----------|---------|
| チャーン直後 | Exit Interview（離脱理由ヒアリング） | フィードバックへの感謝 |
| 3ヶ月後 | 製品アップデート情報の共有 | 無料トライアル（1ヶ月） |
| 6ヶ月後 | 新機能紹介ウェビナー招待 | 再契約時の割引（20% off） |
| 12ヶ月後 | 競合比較レポート送付 | カスタム導入支援 |

**成功指標**: Win-back率 10%以上

---

## 5. NPS計測システム

### 5.1 NPS調査設計

#### 調査頻度とタイミング

| セグメント | 頻度 | タイミング |
|-----------|------|-----------|
| Enterprise | 四半期 | QBR直後 |
| Mid-Market | 半年 | 契約記念日の1ヶ月前 |
| SMB | 年次 | オンボーディング完了後60日 |

#### 質問項目

**主要質問（NPS）**:
> Q1: Miyabiを友人や同僚に薦める可能性は、0-10点でどのくらいですか？

**フォローアップ質問**:
> Q2: その理由を教えてください（自由記述）
> Q3: Miyabiの最も価値ある機能は何ですか？（選択式）
> Q4: 改善してほしい点は何ですか？（自由記述）
> Q5: 今後期待する機能は何ですか？（自由記述）

### 5.2 NPSスコア算出と分類

#### スコア分類

- **Promoters（推奨者）**: 9-10点 → アップセル、リファラル促進
- **Passives（中立者）**: 7-8点 → エンゲージメント向上施策
- **Detractors（批判者）**: 0-6点 → 即座にフォローアップ、チャーンリスク

#### NPS計算式

```
NPS = (Promoters % - Detractors %) × 100
```

**目標**: NPS 50以上（SaaS業界ベンチマーク: 30-40）

### 5.3 NPSフォローアップフロー

#### Promoters（9-10点）への対応

**48時間以内**:
- 感謝メール送付
- ケーススタディ協力依頼
- G2/Capterra レビュー依頼
- リファラルプログラム紹介

**1週間以内**:
- アップセル機会の探索（追加ライセンス、上位プラン）
- Customer Advisory Board招待

#### Passives（7-8点）への対応

**1週間以内**:
- CSMから個別フォローアップ
- 改善点のヒアリング
- クイックウィン施策の提案

#### Detractors（0-6点）への対応

**24時間以内**:
- 緊急フラグ設定（Churn Risk）
- CSM Managerがエスカレーション
- 即座にミーティング設定

**1週間以内**:
- 課題解決アクションプラン作成
- エグゼクティブレビュー実施

### 5.4 NPSデータ活用

#### 製品開発へのフィードバックループ

```
NPS調査
   ↓
テキスト分析（AI）
   ↓
主要テーマ抽出
   ↓
プロダクトチームへ共有
   ↓
ロードマップ優先度調整
   ↓
新機能リリース
   ↓
改善後NPS再測定
```

#### 組織横断での共有

- **週次**: CS週次ミーティングでDetractorsレビュー
- **月次**: 全社ミーティングでNPSトレンド報告
- **四半期**: 経営会議でNPS目標達成状況レビュー

---

## 6. KPI定義とモニタリング

### 6.1 CS部門の主要KPI

#### Tier 1 KPI（最重要指標）

| KPI | 目標値 | 測定頻度 | オーナー |
|-----|--------|---------|---------|
| Gross Revenue Retention（GRR） | 95%以上 | 月次 | Head of CS |
| Net Revenue Retention（NRR） | 120%以上 | 月次 | Head of CS |
| Churn Rate（年間） | 5%以下 | 月次 | Head of CS |
| NPS | 50以上 | 四半期 | Head of CS |

#### Tier 2 KPI（重要指標）

| KPI | 目標値 | 測定頻度 | オーナー |
|-----|--------|---------|---------|
| Onboarding Completion Rate | 90%以上 | 月次 | Onboarding Manager |
| Health Score Green Ratio | 75%以上 | 週次 | CSM Team |
| Time to First Value | 14日以内 | 月次 | Onboarding Manager |
| QBR Completion Rate | 95%以上 | 四半期 | CSM Manager |
| Product Adoption Rate（コア機能） | 70%以上 | 月次 | CSM Team |

#### Tier 3 KPI（運用指標）

| KPI | 目標値 | 測定頻度 | オーナー |
|-----|--------|---------|---------|
| Support Ticket Resolution Time | SLA準拠 | 週次 | Support Manager |
| CSM Portfolio Size | セグメント別基準値 | 月次 | Head of CS |
| Expansion Revenue（既存顧客アップセル） | 20%成長/年 | 月次 | CSM Team |
| Customer Engagement Score | 60以上 | 週次 | CSM Team |
| Academy Completion Rate | 50%以上 | 月次 | Education Team |

### 6.2 KPIダッシュボード

#### リアルタイムダッシュボード（Tableau/Looker）

**CS Executive Dashboard**:
- Churn Rate（月次トレンド）
- NRR/GRR（月次）
- Health Score分布（Green/Yellow/Orange/Red）
- NPS推移（四半期）
- Top 10 Churn Risks

**CSM Daily Dashboard**:
- 担当顧客のHealth Score
- 今週のアクションアイテム
- 未完了タスク
- 契約更新リスト（90日以内）

**Onboarding Dashboard**:
- オンボーディング中の顧客数
- フェーズ別進捗状況
- 遅延しているタスク
- 完了率トレンド

### 6.3 アラート設定

#### Critical Alerts（即座対応）

- Churn Rateが月間1%超過
- Enterprise顧客がRedステータス
- NPS Detractorが5件/週以上

#### High Priority Alerts（24時間以内対応）

- Health Score 20ポイント急降下
- 契約更新60日前でYellowステータス
- オンボーディング30日経過で進捗50%未満

---

## 7. 技術スタック

### 7.1 CS Platform

#### 主要候補

| ツール | 用途 | 価格帯 | 推奨理由 |
|--------|------|--------|---------|
| **Gainsight** | CS Platform統合 | $$$$ | エンタープライズ向け、高機能 |
| **ChurnZero** | CS + Automation | $$$ | 中堅企業向け、コスパ良 |
| **Totango** | Health Scoring | $$ | シンプル、導入容易 |
| **Catalyst** | Lightweight CS | $$ | スタートアップ向け |

**推奨**: Phase 1は**ChurnZero**（コスパと機能のバランス）、Phase 3で**Gainsight**に移行

### 7.2 統合ツール

```
┌──────────────────────────────────────────────┐
│          Customer Success Platform           │
│              (ChurnZero/Gainsight)           │
└──────────────┬───────────────────────────────┘
               │
       ┌───────┴───────┐
       │               │
┌──────▼──────┐ ┌─────▼──────┐
│ Salesforce  │ │  HubSpot   │  CRM（顧客情報、契約）
└──────┬──────┘ └─────┬──────┘
       │               │
┌──────▼───────────────▼──────┐
│     Segment（CDP）           │  顧客データ統合
└──────┬───────────────────────┘
       │
   ┌───┴───┐
┌──▼──┐ ┌──▼──┐
│Zendesk Intercom│  サポート、コミュニケーション
└──┬──┘ └──┬──┘
   │       │
┌──▼───────▼──┐
│   Slack      │  内部コミュニケーション
└──────────────┘

┌──────────────┐
│ Pendo/Appcues│  プロダクト内ガイド
└──────┬───────┘
       │
┌──────▼───────┐
│ Google Analytics/Mixpanel│  利用状況分析
└──────────────┘
```

### 7.3 データパイプライン

```sql
-- ヘルススコア計算（日次バッチ）
WITH user_activity AS (
  SELECT
    tenant_id,
    COUNT(DISTINCT user_id) AS active_users,
    COUNT(DISTINCT DATE(login_at)) AS login_days,
    COUNT(DISTINCT feature_used) AS features_used
  FROM miyabi.usage_logs
  WHERE login_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY tenant_id
),
support_metrics AS (
  SELECT
    tenant_id,
    COUNT(*) AS total_tickets,
    SUM(CASE WHEN status = 'resolved' THEN 1 ELSE 0 END) AS resolved_tickets
  FROM miyabi.support_tickets
  WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 30 DAY)
  GROUP BY tenant_id
)
SELECT
  c.tenant_id,
  c.tenant_name,
  -- アクティブユーザー率（25%）
  SAFE_DIVIDE(ua.active_users, c.license_count) * 25 AS active_user_score,
  -- ログイン頻度（10%）
  LEAST(ua.login_days / 20.0, 1.0) * 10 AS login_frequency_score,
  -- サポート解決率（10%）
  SAFE_DIVIDE(sm.resolved_tickets, sm.total_tickets) * 10 AS support_score,
  -- 総合スコア
  (SAFE_DIVIDE(ua.active_users, c.license_count) * 25) +
  (LEAST(ua.login_days / 20.0, 1.0) * 10) +
  (SAFE_DIVIDE(sm.resolved_tickets, sm.total_tickets) * 10) AS health_score
FROM miyabi.customers c
LEFT JOIN user_activity ua ON c.tenant_id = ua.tenant_id
LEFT JOIN support_metrics sm ON c.tenant_id = sm.tenant_id
```

### 7.4 セキュリティとプライバシー

- **データ暗号化**: すべての顧客データはAES-256で暗号化
- **アクセス制御**: Role-Based Access Control（RBAC）
- **監査ログ**: すべてのデータアクセスを記録
- **GDPR準拠**: 顧客データの削除リクエストに対応
- **定期監査**: 四半期ごとのセキュリティレビュー

---

## 8. 実装ロードマップ

### 8.1 Phase 1: Foundation（Month 1-3）

#### Month 1: 組織立ち上げ

- [ ] Head of CS採用
- [ ] CS Platformツール選定・契約（ChurnZero）
- [ ] 基本Playbook作成（Onboarding、QBR）
- [ ] CRM連携（Salesforce/HubSpot）

#### Month 2: プロセス構築

- [ ] Enterprise CSM採用（2名）
- [ ] Onboarding Specialist採用（1名）
- [ ] ヘルススコアロジック実装
- [ ] オンボーディングテンプレート作成
- [ ] 初回NPS調査実施

#### Month 3: 初期運用

- [ ] CS Analyst採用（1名）
- [ ] Support体制構築（L1/L2）
- [ ] ダッシュボード構築（Health Score、NPS）
- [ ] 初回QBR実施（既存顧客）
- [ ] チャーン予測モデルプロトタイプ

**成功指標**:
- オンボーディング完了率: 70%以上
- 初回NPS測定完了
- Health Score可視化完了

### 8.2 Phase 2: Scale（Month 4-9）

#### Month 4-6: チーム拡大

- [ ] Mid-Market CSM採用（2名）
- [ ] Implementation Engineer採用（1名）
- [ ] Academy Manager採用（1名）
- [ ] 学習コンテンツ作成（動画10本、ガイド20本）
- [ ] Customer Advisory Board立ち上げ

#### Month 7-9: 自動化・高度化

- [ ] プロダクト内ガイド実装（Pendo/Appcues）
- [ ] チャーン予測モデル本番稼働
- [ ] Win-backキャンペーン開始
- [ ] 四半期QBR完了率90%達成

**成功指標**:
- オンボーディング完了率: 85%以上
- NPS: 40以上
- Churn Rate: 7%以下

### 8.3 Phase 3: Optimization（Month 10-18）

#### Month 10-12: デジタルタッチ強化

- [ ] SMB CSM採用（2名）
- [ ] セルフサービスポータル構築
- [ ] コミュニティフォーラム立ち上げ
- [ ] ウェビナープログラム開始（月2回）

#### Month 13-18: 成熟化

- [ ] Gainsightへの移行（検討）
- [ ] AI活用（チャーン予測精度向上、自動レスポンス）
- [ ] グローバル展開準備（多言語対応）
- [ ] Customer Marketing連携（ケーススタディ、イベント）

**成功指標**:
- オンボーディング完了率: 90%以上
- NPS: 50以上
- Churn Rate: 5%以下
- NRR: 120%以上

### 8.4 投資計画

#### 人件費（18ヶ月累計）

| 役割 | 人数 | 平均年俸 | 合計（18ヶ月） |
|------|------|---------|---------------|
| Head of CS | 1 | ¥12M | ¥18M |
| CSM（Enterprise/Mid/SMB） | 6 | ¥8M | ¥72M |
| Onboarding/Implementation | 2 | ¥7M | ¥21M |
| Academy/Education | 2 | ¥6M | ¥18M |
| Analyst/BI | 2 | ¥7M | ¥21M |
| Support | 5 | ¥5M | ¥37.5M |

**小計**: ¥187.5M

#### ツール費用（18ヶ月累計）

| ツール | 月額 | 合計（18ヶ月） |
|--------|------|---------------|
| ChurnZero | ¥300K | ¥5.4M |
| Salesforce | ¥200K | ¥3.6M |
| Zendesk | ¥150K | ¥2.7M |
| Intercom | ¥100K | ¥1.8M |
| Pendo | ¥200K | ¥3.6M |
| その他 | ¥100K | ¥1.8M |

**小計**: ¥18.9M

#### 総投資額（18ヶ月）

**¥206.4M**（約2億円）

#### ROI試算

- **Churn削減効果**: 年間チャーン15% → 5%（10%改善）
  - ARR ¥500M × 10% = ¥50M/年の収益保護
- **アップセル効果**: NRR 120%達成
  - 既存顧客からの追加収益 ¥100M/年
- **新規獲得コスト削減**: リファラル増加
  - CAC削減 ¥20M/年

**年間効果**: ¥170M
**投資回収期間**: 約14ヶ月

---

## 9. リスクと緩和策

### 9.1 主要リスク

| リスク | 影響度 | 発生確率 | 緩和策 |
|--------|--------|---------|--------|
| 優秀なCS人材の採用難 | High | Medium | リクルーターと提携、リモート採用、トレーニング強化 |
| ツール統合の複雑さ | Medium | High | 専門ベンダーサポート契約、段階的ロールアウト |
| 顧客抵抗（データ提供） | Medium | Medium | プライバシーポリシー透明化、オプトイン方式 |
| Churn目標未達 | High | Low | 早期警告システム、エスカレーションプロセス |
| NPS向上が遅い | Medium | Medium | クイックウィン施策、製品改善の優先度調整 |

### 9.2 成功要因（Critical Success Factors）

1. **経営層のコミットメント**: CS部門への十分な投資とリソース配分
2. **製品品質**: 優れた製品なしにCSは成功しない
3. **データドリブン文化**: ヘルススコア、NPS等のデータに基づく意思決定
4. **部門間連携**: Sales、Product、Engineeringとの緊密な協力
5. **顧客中心主義**: 全社的なカスタマーファースト文化の醸成

---

## 10. 次のステップ

### 10.1 即座に着手すべきアクション（Week 1-4）

1. **Week 1**: Head of CS候補者リスト作成、面接開始
2. **Week 2**: CS Platformデモ実施（ChurnZero、Gainsight）
3. **Week 3**: 既存顧客へのNPS調査実施（ベースライン測定）
4. **Week 4**: オンボーディングPlaybook v0.1作成

### 10.2 承認が必要な事項

- [ ] 18ヶ月投資計画の承認（¥206.4M）
- [ ] Head of CS採用の承認（年俸¥12M）
- [ ] CS Platformツール契約の承認（月額¥300K〜）
- [ ] KPI目標の正式承認（Churn 5%、NPS 50）

### 10.3 関連ドキュメント

- [#2 カクシン進化 - 親Issue](/docs/KAKUSHIN_MIYABI_PROJECT_PLAN.md)
- [#10 マルチテナント設計](/docs/MULTI_TENANT_DESIGN.md)
- [#11 課金システム設計](/docs/BILLING_SYSTEM_DESIGN.md)
- [#12 エンタープライズセキュリティ](/docs/ENTERPRISE_SECURITY_DESIGN.md)

---

## Appendix

### A. 用語集

| 用語 | 定義 |
|------|------|
| **Churn Rate** | 解約率。一定期間に解約した顧客の割合 |
| **NPS** | Net Promoter Score。顧客推奨度を測る指標 |
| **GRR** | Gross Revenue Retention。既存顧客からの収益維持率（ダウングレード・解約を含む） |
| **NRR** | Net Revenue Retention。既存顧客からの収益成長率（アップセル・クロスセルを含む） |
| **QBR** | Quarterly Business Review。四半期ごとの顧客との戦略レビュー |
| **Health Score** | 顧客の健全性を数値化した指標 |
| **Time to Value** | 顧客が製品から価値を実感するまでの時間 |

### B. 参考資料

- [SaaS Customer Success Playbook](https://www.gainsight.com/guides/the-essential-guide-to-saas-customer-success/)
- [The Definitive Guide to Net Revenue Retention](https://www.geckoboard.com/best-practice/kpi-examples/net-revenue-retention/)
- [Customer Health Score Best Practices](https://www.totango.com/customer-health-score/)
- [Onboarding Best Practices for SaaS](https://www.appcues.com/blog/saas-onboarding)

### C. 変更履歴

| バージョン | 日付 | 変更内容 | 承認者 |
|-----------|------|---------|--------|
| 1.0.0 | 2025-11-30 | 初版作成 | - |

---

**Document Owner**: Head of Customer Success (TBD)
**Last Updated**: 2025-11-30
**Next Review**: 2025-12-30

---

**Status**: Draft - Review Pending
**Related Issues**: #14, #2
**Tags**: `customer-success`, `cs-design`, `churn-prevention`, `nps`, `onboarding`
