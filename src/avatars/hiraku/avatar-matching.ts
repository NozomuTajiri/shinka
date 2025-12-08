/**
 * アバターマッチングエンジン
 *
 * 診断結果に基づいて最適なアバターを推薦
 */

import type { IdentifiedIssue, AvatarRecommendation } from './types.js';

interface AvatarProfile {
  id: string;
  name: string;
  japaneseName: string;
  specialties: string[];
  targetIssues: string[];
  valueCategories: string[];
}

const AVATAR_PROFILES: AvatarProfile[] = [
  {
    id: 'senryaku',
    name: 'SENRYAKU',
    japaneseName: '戦略',
    specialties: ['経営戦略', '意思決定', '統合報告'],
    targetIssues: ['vision', 'strategy'],
    valueCategories: ['ビジョン', '戦略'],
  },
  {
    id: 'eigyo',
    name: 'EIGYO',
    japaneseName: '営業',
    specialties: ['営業プロセス', 'ヒーロー化', '価値提案'],
    targetIssues: ['sales', 'customer'],
    valueCategories: ['顧客価値', '実行力'],
  },
  {
    id: 'shijo',
    name: 'SHIJO',
    japaneseName: '市場',
    specialties: ['マーケティング', '市場分析', 'ブランディング'],
    targetIssues: ['marketing', 'customer', 'innovation'],
    valueCategories: ['イノベーション', '顧客価値'],
  },
  {
    id: 'kanri',
    name: 'KANRI',
    japaneseName: '管理',
    specialties: ['組織開発', 'マネジメント', '人材育成'],
    targetIssues: ['organization', 'talent', 'execution'],
    valueCategories: ['人材', '実行力'],
  },
];

export function matchAvatarsToIssues(issues: IdentifiedIssue[]): AvatarRecommendation[] {
  const recommendations: AvatarRecommendation[] = [];

  for (const profile of AVATAR_PROFILES) {
    const matchingIssues = issues.filter(issue =>
      profile.targetIssues.includes(issue.category) ||
      issue.relatedValues.some(v => profile.valueCategories.includes(v))
    );

    if (matchingIssues.length > 0) {
      const totalScore = matchingIssues.reduce((sum, issue) => {
        const urgencyScore = issue.priority.urgency * 2;
        const impactScore = issue.priority.impact * 2;
        return sum + urgencyScore + impactScore;
      }, 0);

      const normalizedScore = Math.min(100, (totalScore / matchingIssues.length) * 10);

      recommendations.push({
        avatarId: profile.id,
        avatarName: `${profile.japaneseName}（${profile.name}）`,
        reason: generateRecommendationReason(profile, matchingIssues),
        matchScore: normalizedScore,
        suggestedApproach: generateApproachSuggestion(profile, matchingIssues),
      });
    }
  }

  return recommendations.sort((a, b) => b.matchScore - a.matchScore);
}

function generateRecommendationReason(profile: AvatarProfile, issues: IdentifiedIssue[]): string {
  const issueDescriptions = issues.slice(0, 2).map(i => i.description).join('、');
  return `${issueDescriptions}に対して、${profile.specialties.join('・')}の専門知識で支援可能です。`;
}

function generateApproachSuggestion(profile: AvatarProfile, issues: IdentifiedIssue[]): string {
  const highPriorityIssues = issues.filter(i => i.priority.urgency >= 4 || i.priority.impact >= 4);

  if (highPriorityIssues.length > 0) {
    return `まず${highPriorityIssues[0].description}から着手することを推奨します。`;
  }

  return `段階的なアプローチで${profile.specialties[0]}から始めることを推奨します。`;
}

export function getAvatarProfile(avatarId: string): AvatarProfile | undefined {
  return AVATAR_PROFILES.find(p => p.id === avatarId);
}
