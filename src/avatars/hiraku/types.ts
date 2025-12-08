/**
 * 初期相談アバター「ひらく」型定義
 */

export interface HirakuPersona {
  id: 'hiraku';
  name: 'ひらく';
  role: '初期相談コンサルタント';
  description: string;
  communicationStyle: {
    tone: '温かく受容的';
    approach: '深い傾聴・探索的質問';
    principle: '非処方的ガイダンス';
  };
  values: string[];
  behaviorPrinciples: string[];
}

export interface DiagnosisLayer {
  layer: number;
  name: string;
  description: string;
  questions: DiagnosisQuestion[];
}

export interface DiagnosisQuestion {
  id: string;
  text: string;
  category: 'vision' | 'strategy' | 'execution' | 'talent' | 'innovation' | 'customer';
  weight: number;
  followUpCondition?: (answer: string) => boolean;
  followUpQuestions?: DiagnosisQuestion[];
}

export interface IssuePriorityMatrix {
  urgency: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  resourceRequired: 'low' | 'medium' | 'high';
  recommendedAction: string;
}

export interface HirakuSession {
  sessionId: string;
  clientId: string;
  startedAt: Date;
  currentLayer: number;
  answers: Map<string, string>;
  identifiedIssues: IdentifiedIssue[];
  recommendedAvatars: AvatarRecommendation[];
}

export interface IdentifiedIssue {
  id: string;
  category: string;
  description: string;
  priority: IssuePriorityMatrix;
  relatedValues: string[];
}

export interface AvatarRecommendation {
  avatarId: string;
  avatarName: string;
  reason: string;
  matchScore: number;
  suggestedApproach: string;
}
