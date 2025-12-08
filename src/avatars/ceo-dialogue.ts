/**
 * CEO Avatar Dialogue Module
 *
 * CEOアバターの対話機能
 * 経営者との傾聴型対話、課題ヒアリング、優先順位付けを担当
 */

import type { CEOAvatar } from './ceo-avatar.js';
import type { StreamChunk } from './types.js';

/**
 * 対話フェーズ
 */
export type DialoguePhase =
  | 'greeting'       // 挨拶・関係構築
  | 'hearing'        // 課題ヒアリング
  | 'analysis'       // 課題分析
  | 'proposal'       // 提案
  | 'action_plan';   // アクションプラン策定

/**
 * 対話コンテキスト
 */
export interface DialogueContext {
  /** 現在のフェーズ */
  currentPhase: DialoguePhase;
  /** ヒアリング内容 */
  hearingNotes: string[];
  /** 抽出された課題 */
  identifiedIssues: string[];
  /** クライアント情報 */
  clientInfo?: {
    companyName?: string;
    industry?: string;
    size?: string;
    challenges?: string[];
  };
}

/**
 * CEOアバター対話モジュール
 *
 * 経営者との効果的な対話をサポート
 */
export class CEODialogue {
  /** 親CEOアバター */
  private ceo: CEOAvatar;

  /** 対話コンテキスト */
  private context: DialogueContext;

  /**
   * コンストラクター
   *
   * @param ceo - CEOアバターインスタンス
   */
  constructor(ceo: CEOAvatar) {
    this.ceo = ceo;
    this.context = {
      currentPhase: 'greeting',
      hearingNotes: [],
      identifiedIssues: [],
    };
  }

  /**
   * 対話開始
   *
   * @param clientName - クライアント名（会社名または個人名）
   * @param onChunk - ストリーミングコールバック
   * @returns 開始メッセージ
   */
  public async start(
    clientName: string,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    this.context.currentPhase = 'greeting';

    const greetingPrompt = `
初対面のクライアント「${clientName}」様との対話を開始します。

以下の方針で挨拶してください：

1. 温かく、しかし尊敬を持った挨拶
2. 自己紹介（経営参謀としての役割）
3. 今日の対話の目的を簡潔に説明
4. 相手のお話を伺う姿勢を示す
5. 最初の質問を投げかける（現状について）

**重要**:
- 長すぎないこと（3-4段落程度）
- 相手に話してもらうことを優先
- 専門用語は避ける
`.trim();

    return this.ceo.sendMessage(greetingPrompt, onChunk);
  }

  /**
   * ヒアリング質問生成
   *
   * 現在のコンテキストに基づいて、次の質問を生成
   *
   * @param onChunk - ストリーミングコールバック
   * @returns 質問
   */
  public async generateNextQuestion(
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    this.context.currentPhase = 'hearing';

    const questionPrompt = `
これまでのヒアリング内容：
${this.context.hearingNotes.join('\n- ')}

次の質問を生成してください：

## 質問生成の方針

1. **深掘り優先**: 表面的な回答には「具体的には？」「なぜそう思われますか？」
2. **本音を引き出す**: 遠慮せず率直に話せる雰囲気づくり
3. **構造化**: MECE（漏れなく重複なく）を意識
4. **優先順位**: 重要な課題から順に掘り下げる

## 質問タイプ

- オープン質問（「どのように〜」「何が〜」）を優先
- クローズド質問は確認時のみ
- 仮説検証型質問（「〜ということでしょうか？」）も適宜使用

1つの質問を、簡潔に（2-3文）生成してください。
`.trim();

    return this.ceo.sendMessage(questionPrompt, onChunk);
  }

  /**
   * ヒアリング内容を記録
   *
   * @param note - ヒアリングノート
   */
  public recordHearing(note: string): void {
    this.context.hearingNotes.push(note);
  }

  /**
   * 課題分析フェーズへ移行
   *
   * @param onChunk - ストリーミングコールバック
   * @returns 分析結果サマリー
   */
  public async moveToAnalysis(
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    this.context.currentPhase = 'analysis';

    const analysisPrompt = `
これまでのヒアリング内容を総合的に分析してください：

## ヒアリング内容
${this.context.hearingNotes.join('\n\n')}

## 分析フレームワーク

### 1. 課題の構造化
- 表面的な課題 vs 根本原因
- ロジックツリーで整理

### 2. 優先順位付け
- 緊急度 × 重要度マトリクス
- Quick Win vs 長期施策

### 3. 専門家への委任判断
- どの課題に、どの専門家が必要か
- CEO自身で対応可能な課題はどれか

## 出力形式

以下の形式で、クライアントに伝えます：

1. **お伺いした内容のサマリー**（2-3文）
2. **特定した主要課題**（3-5つ、優先順位順）
3. **次のステップ提案**（専門家への委任 or CEO自身での対応）

専門用語を避け、わかりやすく説明してください。
`.trim();

    const response = await this.ceo.sendMessage(analysisPrompt, onChunk);

    // 課題を自動抽出してコンテキストに保存
    await this.extractIssuesFromAnalysis(response);

    return response;
  }

  /**
   * 提案フェーズへ移行
   *
   * @param onChunk - ストリーミングコールバック
   * @returns 提案内容
   */
  public async moveToProposal(
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    this.context.currentPhase = 'proposal';

    const proposalPrompt = `
特定した課題に対して、3つの戦略オプションを提案してください。

## 特定した課題
${this.context.identifiedIssues.join('\n- ')}

## 提案フレームワーク

### Option 1: 保守的アプローチ
- リスク最小化
- 既存リソース活用
- 短期間で実現可能

### Option 2: バランス型アプローチ
- リスクとリターンのバランス
- 段階的な変革
- 中期的な視点

### Option 3: 革新的アプローチ
- 高リターン追求
- 新規投資・体制変更
- 長期的な競争優位確立

## 各オプションに含めるべき情報

1. **概要**（2-3文）
2. **メリット**（3つ程度）
3. **デメリット・リスク**（3つ程度）
4. **推定コスト・期間**
5. **推奨度**（★1-5）

最後に、CEO自身の推奨案と理由を述べてください。
ただし、最終決定は必ずクライアントに委ねる姿勢を示すこと。
`.trim();

    return this.ceo.sendMessage(proposalPrompt, onChunk);
  }

  /**
   * アクションプランフェーズへ移行
   *
   * @param selectedOption - クライアントが選択したオプション
   * @param onChunk - ストリーミングコールバック
   * @returns アクションプラン
   */
  public async moveToActionPlan(
    selectedOption: string,
    onChunk?: (chunk: StreamChunk) => void
  ): Promise<string> {
    this.context.currentPhase = 'action_plan';

    const actionPlanPrompt = `
クライアントが選択したオプション：${selectedOption}

このオプションに基づいて、具体的なアクションプランを策定してください。

## アクションプランに含める要素

### 1. 今後30日のアクション
- Week 1-2: 〇〇
- Week 3-4: 〇〇

### 2. 担当者・チーム
- 各タスクの担当を明確化
- 専門家への委任が必要なもの

### 3. 成果指標（KPI）
- 定量指標（売上、コスト等）
- 定性指標（顧客満足度等）

### 4. リスク対策
- 想定されるリスクと対策

### 5. フォローアップ計画
- 週次・月次のチェックポイント
- CEO自身によるサポート体制

## 出力形式

箇条書きベースで、実行可能なアクションプランを提示してください。
専門用語は避け、誰が読んでもわかるように。
`.trim();

    const response = await this.ceo.sendMessage(actionPlanPrompt, onChunk);

    // アクションプランからタスクを自動生成
    await this.createTasksFromActionPlan(response);

    return response;
  }

  /**
   * 分析結果から課題を抽出
   *
   * @param analysisText - 分析テキスト
   */
  private async extractIssuesFromAnalysis(analysisText: string): Promise<void> {
    try {
      const result = await this.ceo.analyzeIssues(analysisText);
      this.context.identifiedIssues = result.issues;
    } catch (error) {
      console.error('課題抽出エラー:', error);
      // エラーでも処理は継続
    }
  }

  /**
   * アクションプランからタスクを自動生成
   *
   * @param actionPlanText - アクションプランテキスト
   */
  private async createTasksFromActionPlan(actionPlanText: string): Promise<void> {
    try {
      // ヒアリング内容全体を使ってタスク生成
      const fullContext = [
        ...this.context.hearingNotes,
        `特定した課題: ${this.context.identifiedIssues.join(', ')}`,
        `アクションプラン: ${actionPlanText}`,
      ].join('\n\n');

      await this.ceo.analyzeIssues(fullContext);
    } catch (error) {
      console.error('タスク生成エラー:', error);
      // エラーでも処理は継続
    }
  }

  /**
   * 現在のコンテキスト取得
   *
   * @returns 対話コンテキスト
   */
  public getContext(): DialogueContext {
    return { ...this.context };
  }

  /**
   * コンテキストリセット
   */
  public reset(): void {
    this.context = {
      currentPhase: 'greeting',
      hearingNotes: [],
      identifiedIssues: [],
    };
  }
}
