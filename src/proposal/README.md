# コンサルティング提案生成エンジン

Claude API（Sonnet 4）を使用した、AI駆動のコンサルティング提案書自動生成システム。

## 特徴

- Claude Sonnet 4 による高品質な提案書生成
- 価値主義経営®の6つの価値を反映
- ストリーミング生成対応（リアルタイム進捗表示）
- 複数フォーマット対応（Markdown / PDF / Excel）
- Server-Sent Events (SSE) サポート
- 自動リトライ・レート制限対応
- 詳細なエラーハンドリング

## 価値主義経営®の6つの価値

1. **顧客価値** (Customer Value): 顧客に提供する価値の最大化
2. **社員価値** (Employee Value): 社員の成長と幸福度の向上
3. **事業価値** (Business Value): 事業の持続的成長と収益性
4. **組織価値** (Organization Value): 組織能力と生産性の向上
5. **ブランド価値** (Brand Value): 市場における認知度と信頼性
6. **株主価値** (Shareholder Value): 企業価値と株主利益の最大化

## インストール

```bash
npm install @anthropic-ai/sdk jspdf exceljs
```

## 使用方法

### 基本的な使用例

```typescript
import { createProposalGenerator } from './src/proposal/index.js';

const generator = createProposalGenerator({
  apiKey: process.env.ANTHROPIC_API_KEY!,
  model: 'claude-sonnet-4-20250514',
  maxTokens: 8000,
  verbose: true,
});

const request = {
  clientName: '株式会社サンプル',
  industry: '製造業',
  companySize: '従業員500名',
  mainChallenges: 'デジタル化の遅れ、人材不足、収益性の低下...',
  focusValues: ['business_value', 'organization_value'],
};

const result = await generator.generate(request);
console.log(result.proposal);
```

### ストリーミング生成

```typescript
const streamGenerator = generator.generateStreaming(request);

for await (const event of streamGenerator) {
  switch (event.type) {
    case 'start':
      console.log('生成開始');
      break;
    case 'progress':
      console.log(`進捗: ${event.progress}%`);
      break;
    case 'complete':
      console.log('完了:', event.proposal);
      break;
  }
}
```

### エクスポート

```typescript
import {
  createMarkdownFormatter,
  createPDFFormatter,
  createExcelFormatter,
} from './src/proposal/index.js';

// Markdown
const mdFormatter = createMarkdownFormatter();
await mdFormatter.saveToFile(proposal, './proposal.md');

// PDF
const pdfFormatter = createPDFFormatter({ pageSize: 'A4' });
await pdfFormatter.saveToFile(proposal, './proposal.pdf');

// Excel
const excelFormatter = createExcelFormatter();
await excelFormatter.saveToFile(proposal, './proposal.xlsx');
```

## 提案書の構造

生成される提案書には以下のセクションが含まれます：

1. **エグゼクティブサマリー**: 経営課題と提案の概要
2. **現状分析**: 業界動向、企業の現状、SWOT分析
3. **課題抽出**: 主要な経営課題の特定
4. **改善施策**: 具体的な解決策と実行計画
5. **実行計画**: フェーズ分け、スケジュール、体制
6. **期待効果**: 短期・中期・長期の効果と定量目標
7. **投資計画**: 初期投資、運用コスト、ROI試算

## API リファレンス

### ProposalGenerator

提案書生成のメインクラス。

**メソッド:**

- `generate(request)`: 非ストリーミングで提案書を生成
- `generateStreaming(request)`: ストリーミングで提案書を生成
- `generateSSE(request)`: SSE形式でストリーミング生成

### Formatters

- `MarkdownFormatter`: Markdown形式に変換
- `PDFFormatter`: PDF形式に変換
- `ExcelFormatter`: Excel形式に変換

## 環境変数

```bash
# .env ファイルに設定
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## 使用例の実行

```bash
# TypeScriptで直接実行
npx tsx examples/proposal-example.ts

# ビルド後に実行
npm run build
node dist/examples/proposal-example.js
```

## トークン使用量

- モデル: `claude-sonnet-4-20250514`
- 平均入力トークン: 2,000-3,000
- 平均出力トークン: 5,000-7,000
- 生成時間: 30-60秒

## エラーハンドリング

- 自動リトライ（最大3回、エクスポネンシャルバックオフ）
- レート制限エラーの自動検出と待機
- JSON パースエラーの詳細ログ
- タイムアウト設定（デフォルト: 2分）

## 品質保証

- TypeScript strict mode 完全対応
- 詳細な型定義
- JSDoc コメント
- エラーハンドリング完備

## ライセンス

MIT

---

🤖 Generated with Claude Code
