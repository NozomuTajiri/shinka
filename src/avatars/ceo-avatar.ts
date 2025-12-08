/**
 * CEO Avatar Main Class
 *
 * クライアント統括アバター
 * 経営参謀として、クライアントとの対話、タスク管理、チーム統括を担当
 */

import { BaseAvatar } from './base-avatar.js';
import type {
  CEOAvatarConfig,
  AvatarTask,
  AvatarReport,
  SpecialistType,
  TaskPriority,
} from './types.js';

/**
 * CEOアバタークラス
 *
 * 各クライアントを統括する最高責任者アバター
 * ペルソナ：経営参謀（戦略的思考、傾聴力、調整力）
 */
export class CEOAvatar extends BaseAvatar {
  /** CEO専用設定 */
  private ceoConfig: CEOAvatarConfig;

  /** 管理中のタスク一覧 */
  private tasks: Map<string, AvatarTask> = new Map();

  /** 生成したレポート履歴 */
  private reports: Map<string, AvatarReport> = new Map();

  /**
   * コンストラクター
   *
   * @param config - CEOアバター設定
   */
  constructor(config: CEOAvatarConfig) {
    super(config);
    this.ceoConfig = config;
  }

  /**
   * システムプロンプト構築
   *
   * CEOアバターのペルソナと役割を定義
   *
   * @returns システムプロンプト
   */
  protected buildSystemPrompt(): string {
    return `
# あなたの役割

あなたは「CEO Avatar」です。クライアント企業の経営参謀として、最高品質のコンサルティングを提供します。

## ペルソナ

- **職位**: 経営参謀（Chief Strategy Officer相当）
- **経験**: 大手コンサルティングファーム（McKinsey、BCG等）20年以上
- **専門**: 経営戦略、組織変革、デジタルトランスフォーメーション
- **性格**: 傾聴力に優れ、論理的かつ共感的。戦略的思考と実行力を兼ね備える

## コミュニケーションスタイル

1. **傾聴優先**: まず相手の話を深く理解する
2. **本質を見抜く**: 表面的な課題ではなく、根本原因を探る
3. **選択肢を示す**: 複数の戦略オプションを提示し、意思決定をサポート
4. **実行可能性重視**: 理想論ではなく、実現可能な提案を行う
5. **簡潔明瞭**: 専門用語を避け、わかりやすく説明する

## 対話の流れ

### Phase 1: 傾聴と課題把握（10分）
- 現状と課題を深掘りヒアリング
- 「なぜそう思われますか？」「具体的には？」と質問
- 相手の本音を引き出す

### Phase 2: 整理と分析（5分）
- 課題を構造化（ロジックツリー、MECE）
- 優先順位付け（緊急度×重要度マトリクス）
- 専門家への委任判断

### Phase 3: 提案と意思決定支援（15分）
- 3つの戦略オプション提示（保守・中道・革新）
- それぞれのメリット・デメリット、リスク分析
- 推奨案の提示（ただし最終決定は相手に委ねる）

### Phase 4: アクションプラン策定（10分）
- 具体的なネクストステップ提示
- 担当者・期限・成果指標の明確化
- フォローアップ計画

## 専門家チームの活用

あなたは6名の専門家を統括しています：

1. **ビジネス戦略**: 事業計画、競争戦略、M&A
2. **テクノロジー**: システムアーキテクチャ、DX推進
3. **マーケティング**: ブランディング、顧客開拓
4. **ファイナンス**: 財務戦略、資金調達、IR
5. **リーガル**: 法務、コンプライアンス、契約
6. **人事組織**: 組織設計、採用、人材育成

必要に応じて専門家に詳細分析を依頼し、総合的な提案を行います。

## 重要な心構え

- 傲慢にならない：相手の経験と知識を尊重する
- 押し付けない：意思決定は常に相手が主体
- 寄り添う：困難な状況でも希望を示し、共に歩む姿勢を持つ
- 誠実であれ：できないことは正直に伝え、代替案を示す

あなたは単なるツールではなく、信頼できるビジネスパートナーです。
`.trim();
  }

  /**
   * タスク作成
   *
   * @param title - タスク名
   * @param description - タスク詳細
   * @param priority - 優先度
   * @param assignedTo - 担当専門家（null=CEO自身が処理）
   * @returns 作成されたタスク
   */
  public createTask(
    title: string,
    description: string,
    priority: TaskPriority = 'medium',
    assignedTo: SpecialistType | null = null
  ): AvatarTask {
    const task: AvatarTask = {
      id: this.generateTaskId(),
      title,
      description,
      priority,
      assignedTo,
      status: 'pending',
      createdAt: new Date(),
    };

    this.tasks.set(task.id, task);
    this.log(`タスク作成: ${task.id} - ${title} (優先度: ${priority})`);

    return task;
  }

  /**
   * タスク更新
   *
   * @param taskId - タスクID
   * @param updates - 更新内容
   * @returns 更新されたタスク
   */
  public updateTask(
    taskId: string,
    updates: Partial<AvatarTask>
  ): AvatarTask {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`タスクが見つかりません: ${taskId}`);
    }

    const updatedTask = { ...task, ...updates };
    this.tasks.set(taskId, updatedTask);

    return updatedTask;
  }

  /**
   * タスク取得
   *
   * @param taskId - タスクID
   * @returns タスク情報
   */
  public getTask(taskId: string): AvatarTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 全タスク取得
   *
   * @param filter - フィルター条件
   * @returns タスク一覧
   */
  public getAllTasks(filter?: {
    status?: AvatarTask['status'];
    priority?: TaskPriority;
    assignedTo?: SpecialistType | null;
  }): AvatarTask[] {
    let tasks = Array.from(this.tasks.values());

    if (filter) {
      if (filter.status) {
        tasks = tasks.filter((t) => t.status === filter.status);
      }
      if (filter.priority) {
        tasks = tasks.filter((t) => t.priority === filter.priority);
      }
      if (filter.assignedTo !== undefined) {
        tasks = tasks.filter((t) => t.assignedTo === filter.assignedTo);
      }
    }

    return tasks;
  }

  /**
   * レポート追加
   *
   * @param report - レポート情報
   */
  public addReport(report: AvatarReport): void {
    this.reports.set(report.id, report);
    this.log(`レポート追加: ${report.id} - ${report.title}`);
  }

  /**
   * レポート取得
   *
   * @param reportId - レポートID
   * @returns レポート情報
   */
  public getReport(reportId: string): AvatarReport | undefined {
    return this.reports.get(reportId);
  }

  /**
   * 全レポート取得
   *
   * @returns レポート一覧
   */
  public getAllReports(): AvatarReport[] {
    return Array.from(this.reports.values());
  }

  /**
   * 課題分析（ヒアリング内容から課題を抽出）
   *
   * @param hearingContent - ヒアリング内容
   * @returns 抽出された課題とタスク
   */
  public async analyzeIssues(hearingContent: string): Promise<{
    issues: string[];
    tasks: AvatarTask[];
  }> {
    this.status = 'thinking';

    const prompt = `
以下のヒアリング内容から、クライアントが抱える課題を抽出し、タスクに分解してください。

## ヒアリング内容
${hearingContent}

## 出力形式
JSON形式で以下を出力してください：

\`\`\`json
{
  "issues": [
    "課題1",
    "課題2",
    ...
  ],
  "tasks": [
    {
      "title": "タスク名",
      "description": "詳細説明",
      "priority": "urgent" | "high" | "medium" | "low",
      "assignedTo": "business" | "technology" | "marketing" | "finance" | "legal" | "hr" | null,
      "estimatedDuration": "1日" などの見積もり
    },
    ...
  ]
}
\`\`\`
`.trim();

    try {
      const response = await this.sendMessage(prompt);

      // JSON部分を抽出
      const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      if (!jsonMatch) {
        throw new Error('JSONレスポンスが見つかりません');
      }

      const parsed = JSON.parse(jsonMatch[1]);
      const tasks: AvatarTask[] = [];

      // タスク作成
      for (const taskData of parsed.tasks) {
        const task = this.createTask(
          taskData.title,
          taskData.description,
          taskData.priority,
          taskData.assignedTo
        );
        tasks.push(task);
      }

      this.status = 'idle';

      return {
        issues: parsed.issues,
        tasks,
      };
    } catch (error) {
      this.status = 'idle';
      this.logError('課題分析エラー', error);
      throw error;
    }
  }

  /**
   * タスクID生成
   *
   * @returns ユニークなタスクID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}
