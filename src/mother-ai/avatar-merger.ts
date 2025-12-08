/**
 * アバター統廃合エンジン
 * 稼働率・パフォーマンス・重複度を監視し、統廃合を実行
 */

import {
  Avatar,
  MergeCandidate,
  MergeResult,
  MotherAIConfig,
} from './types.js';

export class AvatarMerger {
  private config: MotherAIConfig['avatarMerger'];

  constructor(config: MotherAIConfig['avatarMerger']) {
    this.config = config;
  }

  /**
   * 廃止候補のアバターを検出
   */
  async findDeprecationCandidates(avatars: Avatar[]): Promise<Avatar[]> {
    const candidates: Avatar[] = [];
    const now = Date.now();

    for (const avatar of avatars) {
      if (avatar.status === 'deprecated') continue;

      // 稼働率チェック: 30日以上セッションなし
      if (this.isInactive(avatar, now)) {
        console.log(
          `[AvatarMerger] ${avatar.id} は${this.config.inactivityDays}日間非稼働`
        );
        candidates.push(avatar);
        continue;
      }

      // パフォーマンスチェック: 満足度3.0未満が3ヶ月継続
      if (this.isUnderperforming(avatar)) {
        console.log(
          `[AvatarMerger] ${avatar.id} はパフォーマンス基準未達（満足度: ${avatar.metrics.averageSatisfaction}）`
        );
        candidates.push(avatar);
        continue;
      }
    }

    return candidates;
  }

  /**
   * 非稼働判定
   */
  private isInactive(avatar: Avatar, now: number): boolean {
    if (!avatar.metrics.lastSessionAt) {
      // セッション履歴なし
      const daysSinceCreation =
        (now - avatar.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceCreation > this.config.inactivityDays;
    }

    const daysSinceLastSession =
      (now - avatar.metrics.lastSessionAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysSinceLastSession > this.config.inactivityDays;
  }

  /**
   * パフォーマンス不足判定
   */
  private isUnderperforming(avatar: Avatar): boolean {
    // セッション数が少ない場合は判定しない
    if (avatar.metrics.totalSessions < 10) {
      return false;
    }

    return avatar.metrics.averageSatisfaction < this.config.minSatisfaction;
  }

  /**
   * 統合候補を検出
   */
  async findMergeCandidates(avatars: Avatar[]): Promise<MergeCandidate[]> {
    const candidates: MergeCandidate[] = [];
    const activeAvatars = avatars.filter((a) => a.status === 'active');

    // 全ペアを比較
    for (let i = 0; i < activeAvatars.length; i++) {
      for (let j = i + 1; j < activeAvatars.length; j++) {
        const avatar1 = activeAvatars[i];
        const avatar2 = activeAvatars[j];

        const similarity = this.calculateSimilarity(
          avatar1.competencies,
          avatar2.competencies
        );

        // 重複度70%以上で統合検討
        if (similarity >= this.config.mergeThreshold) {
          const candidate: MergeCandidate = {
            avatarIds: [avatar1.id, avatar2.id],
            similarityScore: similarity,
            reason: `コンピテンシー重複度 ${Math.round(similarity * 100)}%`,
            recommendedAction: this.shouldMerge(avatar1, avatar2)
              ? 'merge'
              : 'keep_separate',
          };

          candidates.push(candidate);
          console.log(
            `[AvatarMerger] 統合候補検出: ${avatar1.id} + ${avatar2.id} (類似度: ${Math.round(similarity * 100)}%)`
          );
        }
      }
    }

    return candidates;
  }

  /**
   * コンピテンシー類似度計算（Jaccard係数）
   */
  private calculateSimilarity(comp1: string[], comp2: string[]): number {
    const set1 = new Set(comp1.map((c) => c.toLowerCase()));
    const set2 = new Set(comp2.map((c) => c.toLowerCase()));

    const intersection = new Set([...set1].filter((x) => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  /**
   * 統合推奨判定
   */
  private shouldMerge(avatar1: Avatar, avatar2: Avatar): boolean {
    // どちらかが試用期間中の場合は統合
    if (avatar1.status === 'trial' || avatar2.status === 'trial') {
      return true;
    }

    // 両方の稼働率が低い場合は統合
    const totalSessions =
      avatar1.metrics.totalSessions + avatar2.metrics.totalSessions;
    if (totalSessions < 50) {
      return true;
    }

    // パフォーマンスに大きな差がある場合は高い方を残す
    const perfDiff = Math.abs(
      avatar1.metrics.averageSatisfaction - avatar2.metrics.averageSatisfaction
    );
    if (perfDiff > 1.0) {
      return false; // 性能差が大きいので別々に保持
    }

    return true;
  }

  /**
   * アバターを統合実行
   */
  async merge(avatarIds: string[], avatars: Avatar[]): Promise<MergeResult> {
    const sourceAvatars = avatars.filter((a) => avatarIds.includes(a.id));

    if (sourceAvatars.length < 2) {
      throw new Error('統合には2つ以上のアバターが必要');
    }

    console.log(`[AvatarMerger] ${avatarIds.join(', ')} を統合中...`);

    // 統合後のコンピテンシーを決定（ユニオン）
    const mergedCompetencies = Array.from(
      new Set(sourceAvatars.flatMap((a) => a.competencies))
    );

    // 最もパフォーマンスが高いアバターをベースにする
    const bestAvatar = sourceAvatars.reduce((best, current) =>
      current.metrics.averageSatisfaction > best.metrics.averageSatisfaction
        ? current
        : best
    );

    // セッション数を合算
    const totalSessions = sourceAvatars.reduce(
      (sum, a) => sum + a.metrics.totalSessions,
      0
    );

    // 加重平均で満足度を計算
    const weightedSatisfaction = sourceAvatars.reduce((sum, a) => {
      return (
        sum + a.metrics.averageSatisfaction * a.metrics.totalSessions
      );
    }, 0);
    const averageSatisfaction =
      totalSessions > 0 ? weightedSatisfaction / totalSessions : 0;

    // 統合結果
    const result: MergeResult = {
      mergedAvatarId: bestAvatar.id,
      sourceAvatarIds: avatarIds,
      newCompetencies: mergedCompetencies,
      migratedSessions: totalSessions,
      completedAt: new Date(),
    };

    console.log(
      `[AvatarMerger] 統合完了: ${result.mergedAvatarId} (${mergedCompetencies.length}コンピテンシー、${totalSessions}セッション)`
    );

    return result;
  }

  /**
   * アバターを廃止
   */
  async deprecate(
    avatarId: string,
    reason: string
  ): Promise<{ avatarId: string; reason: string; deprecatedAt: Date }> {
    console.log(`[AvatarMerger] ${avatarId} を廃止: ${reason}`);

    return {
      avatarId,
      reason,
      deprecatedAt: new Date(),
    };
  }

  /**
   * 試用期間終了のアバターを評価
   */
  async evaluateTrialAvatars(avatars: Avatar[]): Promise<{
    activate: Avatar[];
    deprecate: Avatar[];
  }> {
    const now = Date.now();
    const activate: Avatar[] = [];
    const deprecate: Avatar[] = [];

    for (const avatar of avatars) {
      if (avatar.status !== 'trial') continue;
      if (!avatar.trialEndsAt) continue;

      // 試用期間が終了しているか
      if (avatar.trialEndsAt.getTime() > now) continue;

      // 評価基準
      const hasEnoughSessions = avatar.metrics.totalSessions >= 10;
      const hasGoodSatisfaction =
        avatar.metrics.averageSatisfaction >= this.config.minSatisfaction;
      const hasLowErrorRate = avatar.metrics.errorRate < 0.1;

      if (hasEnoughSessions && hasGoodSatisfaction && hasLowErrorRate) {
        console.log(
          `[AvatarMerger] ${avatar.id} の試用期間終了 → 本稼働へ`
        );
        activate.push(avatar);
      } else {
        console.log(
          `[AvatarMerger] ${avatar.id} の試用期間終了 → 基準未達により廃止`
        );
        deprecate.push(avatar);
      }
    }

    return { activate, deprecate };
  }
}
