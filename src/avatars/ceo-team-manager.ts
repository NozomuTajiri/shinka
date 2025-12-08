/**
 * CEO Team Manager Module
 *
 * 専門アバターチーム管理モジュール
 * タスク割当、進捗管理、報告集約、調整・調停を担当
 */

import type { CEOAvatar } from './ceo-avatar.js';
import type { AvatarTask, SpecialistType, TaskPriority } from './types.js';

/**
 * タスク割当結果
 */
export interface TaskAssignment {
  /** タスクID */
  taskId: string;
  /** 担当専門家 */
  assignedTo: SpecialistType;
  /** 割当理由 */
  reason: string;
  /** 期待される成果 */
  expectedOutcome: string;
}

/**
 * チーム進捗レポート
 */
export interface TeamProgressReport {
  /** レポート生成日時 */
  generatedAt: Date;
  /** 総タスク数 */
  totalTasks: number;
  /** 完了タスク数 */
  completedTasks: number;
  /** 進行中タスク数 */
  inProgressTasks: number;
  /** ブロック中タスク数 */
  blockedTasks: number;
  /** 専門家別の進捗 */
  specialistProgress: Map<SpecialistType, {
    assigned: number;
    completed: number;
    inProgress: number;
    blocked: number;
  }>;
  /** 遅延タスク */
  delayedTasks: AvatarTask[];
  /** リスクアラート */
  riskAlerts: string[];
}

/**
 * CEOチーム管理モジュール
 *
 * 専門アバターへのタスク割当と進捗管理
 */
export class CEOTeamManager {
  /** 親CEOアバター */
  private ceo: CEOAvatar;

  /** 専門家のスキルマップ */
  private readonly specialistSkills: Map<SpecialistType, string[]>;

  /**
   * コンストラクター
   *
   * @param ceo - CEOアバターインスタンス
   */
  constructor(ceo: CEOAvatar) {
    this.ceo = ceo;

    // 各専門家のスキル定義
    this.specialistSkills = new Map([
      [
        'business',
        [
          '事業戦略立案',
          '競争分析',
          'M&A',
          '新規事業開発',
          'ビジネスモデル設計',
          '収益構造分析',
        ],
      ],
      [
        'technology',
        [
          'システムアーキテクチャ',
          'DX推進',
          'セキュリティ',
          'インフラ設計',
          'AI/ML導入',
          '技術選定',
        ],
      ],
      [
        'marketing',
        [
          'ブランディング',
          '顧客開拓',
          'デジタルマーケティング',
          'PR戦略',
          '市場調査',
          'カスタマージャーニー',
        ],
      ],
      [
        'finance',
        [
          '財務戦略',
          '資金調達',
          'IPO準備',
          '予算管理',
          '投資判断',
          'IR',
        ],
      ],
      [
        'legal',
        [
          '契約書作成',
          'コンプライアンス',
          '知財戦略',
          'リスク管理',
          '法令対応',
          '訴訟対応',
        ],
      ],
      [
        'hr',
        [
          '組織設計',
          '採用戦略',
          '人材育成',
          '評価制度',
          '労務管理',
          '組織文化',
        ],
      ],
    ]);
  }

  /**
   * タスクを最適な専門家に自動割当
   *
   * @param task - 割当対象タスク
   * @returns 割当結果
   */
  public async assignTask(task: AvatarTask): Promise<TaskAssignment> {
    // タスク内容から最適な専門家を判定
    const specialist = await this.determineSpecialist(task);

    // タスクを更新
    this.ceo.updateTask(task.id, {
      assignedTo: specialist,
      status: 'pending',
    });

    const assignment: TaskAssignment = {
      taskId: task.id,
      assignedTo: specialist,
      reason: `タスク「${task.title}」は${specialist}分野の専門知識が必要と判断しました`,
      expectedOutcome: `${specialist}専門家による詳細分析と実行可能な提案`,
    };

    this.log(`タスク割当: ${task.title} → ${specialist}`);

    return assignment;
  }

  /**
   * 複数タスクを一括割当
   *
   * @param tasks - タスク配列
   * @returns 割当結果配列
   */
  public async assignMultipleTasks(
    tasks: AvatarTask[]
  ): Promise<TaskAssignment[]> {
    const assignments: TaskAssignment[] = [];

    for (const task of tasks) {
      if (!task.assignedTo) {
        // 未割当のタスクのみ処理
        const assignment = await this.assignTask(task);
        assignments.push(assignment);
      }
    }

    return assignments;
  }

  /**
   * チーム進捗レポート生成
   *
   * @returns 進捗レポート
   */
  public generateProgressReport(): TeamProgressReport {
    const allTasks = this.ceo.getAllTasks();

    // 基本統計
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter((t) => t.status === 'completed').length;
    const inProgressTasks = allTasks.filter((t) => t.status === 'in_progress').length;
    const blockedTasks = allTasks.filter((t) => t.status === 'blocked').length;

    // 専門家別の進捗
    const specialistProgress = new Map<
      SpecialistType,
      {
        assigned: number;
        completed: number;
        inProgress: number;
        blocked: number;
      }
    >();

    const specialists: SpecialistType[] = [
      'business',
      'technology',
      'marketing',
      'finance',
      'legal',
      'hr',
    ];

    for (const specialist of specialists) {
      const tasks = allTasks.filter((t) => t.assignedTo === specialist);
      specialistProgress.set(specialist, {
        assigned: tasks.length,
        completed: tasks.filter((t) => t.status === 'completed').length,
        inProgress: tasks.filter((t) => t.status === 'in_progress').length,
        blocked: tasks.filter((t) => t.status === 'blocked').length,
      });
    }

    // 遅延タスク検出
    const now = new Date();
    const delayedTasks = allTasks.filter((t) => {
      if (!t.dueDate || t.status === 'completed') return false;
      return t.dueDate < now;
    });

    // リスクアラート生成
    const riskAlerts: string[] = [];

    if (blockedTasks > 0) {
      riskAlerts.push(`${blockedTasks}件のタスクがブロック状態です`);
    }

    if (delayedTasks.length > 0) {
      riskAlerts.push(`${delayedTasks.length}件のタスクが期限を過ぎています`);
    }

    const urgentPendingTasks = allTasks.filter(
      (t) => t.priority === 'urgent' && t.status === 'pending'
    );
    if (urgentPendingTasks.length > 0) {
      riskAlerts.push(`${urgentPendingTasks.length}件の緊急タスクが未着手です`);
    }

    return {
      generatedAt: now,
      totalTasks,
      completedTasks,
      inProgressTasks,
      blockedTasks,
      specialistProgress,
      delayedTasks,
      riskAlerts,
    };
  }

  /**
   * タスクの優先順位を再評価
   *
   * @param taskId - タスクID
   * @param newPriority - 新しい優先度
   * @param reason - 変更理由
   */
  public reprioritizeTask(
    taskId: string,
    newPriority: TaskPriority,
    reason: string
  ): void {
    const task = this.ceo.getTask(taskId);
    if (!task) {
      throw new Error(`タスクが見つかりません: ${taskId}`);
    }

    this.ceo.updateTask(taskId, { priority: newPriority });

    this.log(
      `タスク優先度変更: ${task.title} (${task.priority} → ${newPriority})\n理由: ${reason}`
    );
  }

  /**
   * ブロックされたタスクの解決支援
   *
   * @param taskId - タスクID
   * @returns 解決策提案
   */
  public async resolveBlockedTask(taskId: string): Promise<string> {
    const task = this.ceo.getTask(taskId);
    if (!task) {
      throw new Error(`タスクが見つかりません: ${taskId}`);
    }

    if (task.status !== 'blocked') {
      return 'このタスクはブロック状態ではありません';
    }

    // CEOがブロック解除の提案を生成
    const prompt = `
以下のタスクがブロック状態です。解決策を提案してください。

## タスク情報
- タイトル: ${task.title}
- 説明: ${task.description}
- 担当: ${task.assignedTo || 'CEO'}
- 優先度: ${task.priority}

## 提案内容

1. **ブロック原因の推定**（3つ程度）
2. **解決策オプション**（優先度順に3つ）
3. **必要なリソース・サポート**
4. **推奨アクション**（今すぐできること）

簡潔に、実行可能な提案をお願いします。
`.trim();

    return this.ceo.sendMessage(prompt);
  }

  /**
   * 専門家間の調整・調停
   *
   * @param issue - 調整が必要な問題
   * @param involvedSpecialists - 関係する専門家
   * @returns 調停案
   */
  public async mediateConflict(
    issue: string,
    involvedSpecialists: SpecialistType[]
  ): Promise<string> {
    const prompt = `
専門家チーム間で調整が必要な問題が発生しました。調停案を提示してください。

## 問題
${issue}

## 関係する専門家
${involvedSpecialists.join(', ')}

## 調停方針

1. **各専門家の立場を理解**
2. **共通の目標を確認**
3. **Win-Winの解決策を模索**
4. **具体的な行動計画**

公平かつ建設的な調停案を提示してください。
`.trim();

    return this.ceo.sendMessage(prompt);
  }

  /**
   * タスク内容から最適な専門家を判定
   *
   * @param task - タスク
   * @returns 専門家タイプ
   */
  private async determineSpecialist(task: AvatarTask): Promise<SpecialistType> {
    // すでに割り当てられている場合はそれを返す
    if (task.assignedTo) {
      return task.assignedTo;
    }

    // 簡易的なキーワードマッチング
    const taskText = `${task.title} ${task.description}`.toLowerCase();

    const keywords: Record<SpecialistType, string[]> = {
      business: ['戦略', '事業', 'ビジネス', '収益', '競争', 'マーケット'],
      technology: ['技術', 'システム', 'IT', 'DX', 'セキュリティ', 'インフラ'],
      marketing: ['マーケティング', 'ブランド', '顧客', '広告', 'PR'],
      finance: ['財務', '資金', '予算', '投資', 'IPO', 'IR'],
      legal: ['法務', '契約', 'コンプライアンス', '知財', 'リスク'],
      hr: ['人事', '採用', '組織', '育成', '評価', '労務'],
    };

    const scores: Record<SpecialistType, number> = {
      business: 0,
      technology: 0,
      marketing: 0,
      finance: 0,
      legal: 0,
      hr: 0,
    };

    // キーワードマッチングでスコアリング
    for (const [specialist, words] of Object.entries(keywords)) {
      for (const word of words) {
        if (taskText.includes(word)) {
          scores[specialist as SpecialistType] += 1;
        }
      }
    }

    // 最高スコアの専門家を返す
    let maxScore = 0;
    let bestSpecialist: SpecialistType = 'business'; // デフォルト

    for (const [specialist, score] of Object.entries(scores)) {
      if (score > maxScore) {
        maxScore = score;
        bestSpecialist = specialist as SpecialistType;
      }
    }

    // スコアが0の場合（キーワードマッチなし）はビジネス戦略に割り当て
    if (maxScore === 0) {
      return 'business';
    }

    return bestSpecialist;
  }

  /**
   * ログ出力
   *
   * @param message - ログメッセージ
   */
  private log(message: string): void {
    console.log(`[CEOTeamManager] ${message}`);
  }
}
