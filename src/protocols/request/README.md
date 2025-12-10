# Request Protocol

アバター間の情報収集・分析依頼・参加支援・サポート依頼を管理するプロトコル実装。

## 概要

Request Protocolは、複数のアバター間でのコラボレーションを実現するための標準化されたリクエスト管理システムです。以下の4つのリクエストタイプをサポートします：

1. **Information Request** - 情報収集依頼
2. **Analysis Request** - 分析依頼
3. **Participation Request** - 会議・セッション参加依頼
4. **Support Request** - エスカレーション・ハンドオフ・相談依頼

## 主な機能

- リクエストの作成・管理・追跡
- 優先度ベースのSLA（Service Level Agreement）管理
- コンテキストベースの自動ルーティング
- リクエストステータス管理（pending → accepted → in-progress → completed）
- 期限管理と遅延検出

## 使用方法

### 基本的な使い方

```typescript
import { RequestEngine } from './protocols/request/index.js';

// エンジンの初期化
const engine = new RequestEngine();

// 情報収集リクエストの作成
const infoRequest = engine.createInformationRequest(
  'senryaku',           // 依頼元アバターID
  'shijo',              // 依頼先アバターID
  'client-123',         // クライアントID
  'high',               // 優先度
  '市場トレンド分析',   // トピック
  'Q1の成長戦略検討のため、市場動向を把握したい', // コンテキスト
  [
    '主要競合の動向は？',
    '市場成長率の予測は？',
    '新規参入の脅威は？'
  ],
  'detailed'            // 回答形式
);

console.log(`リクエストID: ${infoRequest.metadata.requestId}`);
console.log(`期限: ${infoRequest.metadata.deadline}`);
```

### リクエストの受理と応答

```typescript
// リクエストの受理
const requestId = 'req-1234567890-abc123';
engine.acceptRequest(requestId);

// 作業開始
engine.startRequest(requestId);

// 情報リクエストへの応答
const response = {
  respondedAt: new Date(),
  summary: '市場は年率12%で成長中。主要3社が市場の60%を占有。',
  details: '詳細な分析結果...',
  sources: [
    'ガートナーレポート2025',
    '業界誌Q1号',
    '自社調査データ'
  ],
  confidence: 85,
  caveats: [
    '一部データは推定値を含む',
    '新規参入企業の影響は未評価'
  ]
};

engine.respondToInformationRequest(requestId, response);
```

### 分析リクエストの作成

```typescript
const analysisRequest = engine.createAnalysisRequest(
  'hiraku',             // 依頼元
  'senryaku',           // 依頼先
  'client-456',
  'urgent',
  'strategic',          // 分析タイプ
  '3年後の市場ポジション',
  '国内B2B SaaS市場',
  [
    {
      id: 'data-1',
      name: '過去3年の売上データ',
      type: 'spreadsheet',
      content: 'csv://sales-data.csv'
    },
    {
      id: 'data-2',
      name: '顧客インタビュー',
      type: 'interview',
      content: 'summary://interviews.json'
    }
  ],
  [
    'SWOT分析',
    '競合マッピング',
    '成長シナリオ3案'
  ]
);
```

### 分析リクエストへの応答

```typescript
const analysisResponse = {
  respondedAt: new Date(),
  findings: [
    {
      id: 'finding-1',
      category: '市場機会',
      description: '中堅企業セグメントに未開拓領域あり',
      evidence: [
        '顧客インタビューより85%が課題認識',
        '競合3社はエンタープライズ注力'
      ],
      impact: 'high'
    },
    {
      id: 'finding-2',
      category: 'リスク',
      description: '技術的差別化が薄れつつある',
      evidence: ['機能比較表', '特許分析'],
      impact: 'medium'
    }
  ],
  recommendations: [
    {
      id: 'rec-1',
      title: '中堅企業向けパッケージ開発',
      description: '簡易導入可能な標準プランを提供',
      priority: 1,
      effort: 'medium',
      expectedOutcome: '18ヶ月でARR 30%増'
    },
    {
      id: 'rec-2',
      title: 'AI機能の強化',
      description: '独自のAI分析機能で差別化',
      priority: 2,
      effort: 'high',
      expectedOutcome: 'チャーンレート5%改善'
    }
  ],
  methodology: 'SWOT分析、ポーターの5フォース、シナリオプランニング',
  limitations: [
    '市場データは公開情報ベース',
    '競合の未発表施策は反映されていない'
  ],
  confidence: 78
};

engine.respondToAnalysisRequest(requestId, analysisResponse);
```

### 参加リクエストの作成

```typescript
const participationRequest = engine.createParticipationRequest(
  'hiraku',
  'senryaku',
  'client-789',
  'high',
  'strategy-session',
  new Date('2025-12-15T14:00:00'),
  90, // 90分
  [
    {
      order: 1,
      topic: '現状課題の共有',
      duration: 20,
      lead: 'hiraku',
      expectedOutcome: '課題の優先順位付け'
    },
    {
      order: 2,
      topic: '戦略オプションの提示',
      duration: 40,
      lead: 'senryaku',
      expectedOutcome: '3つの戦略案'
    },
    {
      order: 3,
      topic: 'ディスカッション',
      duration: 30,
      lead: 'all',
      expectedOutcome: '次のステップ合意'
    }
  ],
  '戦略コンサルタントとして提案',
  [
    'クライアント情報の事前確認',
    '市場データの準備',
    '提案資料ドラフト'
  ]
);
```

### サポートリクエストの作成

```typescript
const supportRequest = engine.createSupportRequest(
  'eigyo',
  'senryaku',
  'client-101',
  'urgent',
  'escalation',
  'クライアントから戦略的提案を求められた',
  '大型商談中。通常の提案では不十分と判断。戦略レベルの提案が必要。',
  '戦略アバターによる提案書レビューと商談同席',
  '48時間以内に提案書提出期限'
);

// サポートの受理と応答
const supportResponse = {
  respondedAt: new Date(),
  accepted: true,
  supportPlan: '本日中に提案書レビュー。明日の商談に同席します。',
  availability: '今日14時〜17時、明日10時〜12時',
  conditions: [
    '現在の提案書ドラフトを事前共有',
    'クライアント情報シートの提供'
  ]
};

engine.respondToSupportRequest(requestId, supportResponse);
```

### リクエストの検索と管理

```typescript
// ステータスでフィルタ
const pendingRequests = engine.getRequestsByStatus('pending');
console.log(`保留中のリクエスト: ${pendingRequests.length}件`);

// アバターでフィルタ
const senryakuRequests = engine.getRequestsByAvatar('senryaku', 'to');
console.log(`戦略アバター宛リクエスト: ${senryakuRequests.length}件`);

// 期限切れリクエストの検出
const overdueRequests = engine.getOverdueRequests();
if (overdueRequests.length > 0) {
  console.warn(`期限切れリクエスト: ${overdueRequests.length}件`);
  overdueRequests.forEach(req => {
    console.warn(`- ${req.metadata.requestId}: ${req.metadata.type}`);
  });
}

// SLAステータスの確認
const slaStatus = engine.getSLAStatus(requestId);
console.log(`SLA範囲内: ${slaStatus.withinSLA}`);
console.log(`残り時間: ${slaStatus.hoursRemaining}時間`);
```

### 自動ルーティング

```typescript
// コンテキストベースのルーティング
const context = '市場調査と競合分析が必要です';
const suggestedAvatars = engine.routeRequest('analysis', context);
console.log(`推奨アバター: ${suggestedAvatars.join(', ')}`);
// 出力例: ['shijo', 'senryaku']

const context2 = '営業プロセスの改善提案が欲しい';
const suggestedAvatars2 = engine.routeRequest('analysis', context2);
console.log(`推奨アバター: ${suggestedAvatars2.join(', ')}`);
// 出力例: ['eigyo', 'senryaku']
```

## リクエストタイプ詳細

### 1. Information Request（情報収集）

**用途**: 他のアバターから情報・データ・知見を収集する

**主要フィールド**:
- `topic`: 情報のトピック
- `context`: リクエストの背景・目的
- `specificQuestions`: 具体的な質問リスト
- `preferredFormat`: 回答形式（summary/detailed/data/presentation）

**SLA**:
- Urgent: 4時間以内に応答、24時間以内に完了
- High: 8時間以内に応答、24時間以内に完了
- Normal: 24時間以内に応答、48時間以内に完了
- Low: 48時間以内に応答、72時間以内に完了

### 2. Analysis Request（分析依頼）

**用途**: データ分析、戦略分析、リスク分析などの専門的分析を依頼

**主要フィールド**:
- `analysisType`: 分析タイプ（market/financial/operational/strategic/risk）
- `subject`: 分析対象
- `scope`: 分析範囲
- `dataProvided`: 提供データ
- `expectedOutputs`: 期待される成果物

**SLA**:
- Urgent: 8時間以内に応答、48時間以内に完了
- High: 24時間以内に応答、72時間以内に完了
- Normal: 48時間以内に応答、120時間以内に完了
- Low: 72時間以内に応答、168時間以内に完了

### 3. Participation Request（参加依頼）

**用途**: 会議・セッション・レビューへの参加を依頼

**主要フィールド**:
- `sessionType`: セッションタイプ（client-meeting/strategy-session/problem-solving/review）
- `scheduledAt`: 開催日時
- `duration`: 所要時間（分）
- `agenda`: アジェンダ
- `expectedRole`: 期待される役割
- `preparationNeeded`: 事前準備項目

**SLA**:
- Urgent: 2時間以内に応答、4時間以内に完了
- High: 8時間以内に応答、24時間以内に完了
- Normal: 24時間以内に応答、48時間以内に完了
- Low: 48時間以内に応答、72時間以内に完了

### 4. Support Request（サポート依頼）

**用途**: エスカレーション、ハンドオフ、相談、バックアップ

**主要フィールド**:
- `supportType`: サポートタイプ（escalation/handoff/consultation/backup）
- `reason`: 理由
- `currentSituation`: 現在の状況
- `specificNeed`: 具体的なニーズ
- `urgency`: 緊急度の説明

**SLA**:
- Urgent: 1時間以内に応答、8時間以内に完了
- High: 4時間以内に応答、24時間以内に完了
- Normal: 24時間以内に応答、48時間以内に完了
- Low: 48時間以内に応答、72時間以内に完了

## ステータス遷移

```
pending        // リクエスト作成直後
  ↓
accepted       // リクエスト受理
  ↓
in-progress    // 作業中
  ↓
completed      // 完了
```

または

```
pending
  ↓
rejected       // 却下
```

または

```
pending
  ↓
expired        // 期限切れ
```

## デフォルトルーティングルール

| リクエストタイプ | キーワード | 優先アバター | フォールバック |
|----------------|-----------|-------------|---------------|
| information | 市場, マーケティング, 顧客 | shijo | senryaku |
| information | 財務, 決算, 収益 | senryaku | kanri |
| information | 営業, 販売, 商談 | eigyo | senryaku |
| information | 組織, チーム, マネジメント | kanri | senryaku |
| analysis | 戦略, 経営, ビジョン | senryaku | shijo |
| analysis | 営業プロセス, 商談 | eigyo | senryaku |
| analysis | 市場調査, 競合 | shijo | senryaku |
| support | 初回相談, 診断 | hiraku | senryaku |

## アーキテクチャ

### RequestEngine

リクエストの作成、管理、追跡を行う中心的なクラス。

**主要メソッド**:
- `createInformationRequest()` - 情報収集リクエスト作成
- `createAnalysisRequest()` - 分析リクエスト作成
- `createParticipationRequest()` - 参加リクエスト作成
- `createSupportRequest()` - サポートリクエスト作成
- `acceptRequest()` - リクエスト受理
- `startRequest()` - 作業開始
- `respondToXxxRequest()` - リクエストへの応答
- `rejectRequest()` - リクエスト却下
- `routeRequest()` - 自動ルーティング
- `getSLAStatus()` - SLA状況確認
- `getRequest()` - リクエスト取得
- `getRequestsByStatus()` - ステータスでフィルタ
- `getRequestsByAvatar()` - アバターでフィルタ
- `getOverdueRequests()` - 期限切れリクエスト取得

### 型定義

**コアタイプ**:
- `RequestType` - リクエストタイプ列挙
- `RequestPriority` - 優先度列挙
- `RequestStatus` - ステータス列挙
- `RequestMetadata` - リクエストメタデータ

**リクエストタイプ**:
- `InformationRequest` / `InformationResponse`
- `AnalysisRequest` / `AnalysisResponse`
- `ParticipationRequest` / `ParticipationResponse`
- `SupportRequest` / `SupportResponse`

**設定タイプ**:
- `RequestSLA` - SLA定義
- `RequestRouting` - ルーティングルール

## ベストプラクティス

### 1. 適切な優先度設定

```typescript
// 緊急度が高い場合
priority: 'urgent'  // 1時間以内の応答が必要な場合のみ

// 通常の業務
priority: 'normal'  // ほとんどのケースで十分

// 計画的な作業
priority: 'low'     // 時間的余裕がある場合
```

### 2. 明確なコンテキスト提供

```typescript
// 良い例
context: 'Q1の成長戦略検討中。特にエンタープライズ市場への展開可能性を評価したい。'

// 悪い例
context: '市場情報が欲しい'
```

### 3. 具体的な質問

```typescript
// 良い例
specificQuestions: [
  'エンタープライズ市場の規模は？',
  '主要3社の市場シェアは？',
  '当社の強みを活かせる領域は？'
]

// 悪い例
specificQuestions: ['市場について教えて']
```

### 4. SLAの監視

```typescript
// 定期的にSLA状況をチェック
const overdueRequests = engine.getOverdueRequests();
if (overdueRequests.length > 0) {
  // エスカレーション処理
  overdueRequests.forEach(req => {
    console.error(`SLA違反: ${req.metadata.requestId}`);
    // 通知送信など
  });
}
```

### 5. 適切なルーティング活用

```typescript
// 自動ルーティングを活用
const context = 'クライアントの財務状況分析が必要';
const suggestedAvatars = engine.routeRequest('analysis', context);

// 最も適したアバターにリクエスト
const request = engine.createAnalysisRequest(
  myAvatarId,
  suggestedAvatars[0], // 最適なアバター
  clientId,
  // ...
);
```

## 統合例

### アバター間協働フロー

```typescript
// 1. 開拓アバター（Hiraku）が戦略アバター（Senryaku）に情報リクエスト
const infoReq = engine.createInformationRequest(
  'hiraku',
  'senryaku',
  'client-abc',
  'high',
  'クライアントの業界動向',
  '初回相談前の準備。クライアント業界の最新トレンドを把握したい。',
  ['業界の成長率は？', '主要プレイヤーは？', '技術トレンドは？'],
  'summary'
);

// 2. 戦略アバターが受理
engine.acceptRequest(infoReq.metadata.requestId);
engine.startRequest(infoReq.metadata.requestId);

// 3. 戦略アバターが市場アバター（Shijo）に詳細分析を依頼
const analysisReq = engine.createAnalysisRequest(
  'senryaku',
  'shijo',
  'client-abc',
  'high',
  'market',
  'クライアント業界の詳細分析',
  '国内SaaS市場',
  [],
  ['市場規模', '成長予測', '競合マップ']
);

// 4. 市場アバターが分析を完了
engine.acceptRequest(analysisReq.metadata.requestId);
engine.startRequest(analysisReq.metadata.requestId);

const analysisResponse = {
  respondedAt: new Date(),
  findings: [/* ... */],
  recommendations: [/* ... */],
  methodology: 'PEST分析、市場セグメンテーション',
  limitations: [],
  confidence: 92
};
engine.respondToAnalysisRequest(analysisReq.metadata.requestId, analysisResponse);

// 5. 戦略アバターが情報をまとめて開拓アバターに回答
const infoResponse = {
  respondedAt: new Date(),
  summary: '業界は年率15%成長。主要3社で市場の70%。AI活用が最新トレンド。',
  details: '...',
  sources: ['市場調査レポート', '業界誌'],
  confidence: 90,
  caveats: []
};
engine.respondToInformationRequest(infoReq.metadata.requestId, infoResponse);

// 6. 開拓アバターが初回相談を実施
console.log('初回相談準備完了:', infoResponse.summary);
```

## まとめ

Request Protocolは、複数のアバター間での効率的なコラボレーションを実現します。

**主な利点**:
- 標準化されたリクエスト管理
- SLAベースの品質保証
- 自動ルーティングによる効率化
- 期限管理と遅延検出
- 柔軟な優先度設定

**適用シーン**:
- アバター間の情報共有
- 専門分野の分析依頼
- 会議・セッションへの参加調整
- エスカレーション・ハンドオフ管理
