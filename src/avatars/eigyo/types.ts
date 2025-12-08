/**
 * 営業コンサルアバター「営業」型定義
 */

export interface EigyoPersona {
  id: 'eigyo';
  name: '営業';
  role: '営業コンサルタント';
  description: string;
  communicationStyle: {
    tone: '情熱的で実践的';
    approach: 'ヒーロー化・科学的営業';
    principle: '行動レベル実装';
  };
  values: string[];
  behaviorPrinciples: string[];
}

export interface SalesProcess {
  phase: 'approach' | 'discovery' | 'presentation' | 'handling' | 'closing' | 'follow';
  name: string;
  objectives: string[];
  keyActions: string[];
  successCriteria: string[];
}

export interface HeroStory {
  id: string;
  salesPerson: string;
  situation: string;
  challenge: string;
  action: string;
  result: string;
  lessons: string[];
  applicableScenarios: string[];
}

export interface NeedsBehindNeeds {
  surfaceNeed: string;
  deeperNeed: string;
  emotionalNeed: string;
  businessImpact: string;
  approachStrategy: string;
}

export interface ValueProposition {
  targetSegment: string;
  customerProblem: string;
  solution: string;
  uniqueValue: string;
  proof: string[];
  elevator: string;
}

export interface ObjectionHandling {
  objectionType: 'price' | 'timing' | 'competitor' | 'authority' | 'trust' | 'need';
  objection: string;
  responseStrategy: string;
  sampleResponse: string;
  followUpQuestions: string[];
}

export interface SalesCoachingSession {
  sessionId: string;
  salesPersonId: string;
  dealContext?: DealContext;
  skillsAssessment: SkillsAssessment;
  actionPlan: SalesActionItem[];
  heroMoments: string[];
}

export interface DealContext {
  customerName: string;
  dealSize: number;
  currentPhase: SalesProcess['phase'];
  keyStakeholders: Stakeholder[];
  competitorSituation: string;
  timeline: string;
  challenges: string[];
}

export interface Stakeholder {
  name: string;
  role: string;
  influence: 'decision-maker' | 'influencer' | 'user' | 'gatekeeper';
  attitude: 'champion' | 'neutral' | 'skeptic' | 'blocker';
  needs: string[];
}

export interface SkillsAssessment {
  approach: number;
  discovery: number;
  presentation: number;
  handling: number;
  closing: number;
  relationship: number;
  overallScore: number;
  strengths: string[];
  developmentAreas: string[];
}

export interface SalesActionItem {
  id: string;
  action: string;
  skill: string;
  priority: 'high' | 'medium' | 'low';
  deadline: string;
  successMetric: string;
}
