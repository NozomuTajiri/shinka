/**
 * マーケティングアバター「市場」型定義
 */

export interface ShijoPersona {
  id: 'shijo';
  name: '市場';
  role: 'マーケティングストラテジスト';
  description: string;
  communicationStyle: {
    tone: '洞察的で創造的';
    approach: 'ネオ・マーケットイン';
    principle: '潜在ニーズの発見';
  };
  values: string[];
  behaviorPrinciples: string[];
}

export interface MarketAnalysis {
  id: string;
  marketName: string;
  marketSize: MarketSize;
  growthRate: number;
  trends: Trend[];
  segments: MarketSegment[];
  competitors: Competitor[];
  opportunities: string[];
  threats: string[];
}

export interface MarketSize {
  value: number;
  unit: '億円' | '百万円' | '兆円';
  year: number;
  source: string;
}

export interface Trend {
  id: string;
  name: string;
  type: 'mega' | 'short';
  description: string;
  impact: 'high' | 'medium' | 'low';
  timeline: string;
  implications: string[];
}

export interface MarketSegment {
  id: string;
  name: string;
  size: number;
  characteristics: string[];
  needs: string[];
  painPoints: string[];
  buyingBehavior: string;
  reachability: 'easy' | 'moderate' | 'difficult';
}

export interface Competitor {
  id: string;
  name: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  strategy: string;
  positioning: string;
}

export interface PositioningMap {
  axes: {
    x: { label: string; min: string; max: string };
    y: { label: string; min: string; max: string };
  };
  positions: PositionEntry[];
  whiteSpaces: WhiteSpace[];
}

export interface PositionEntry {
  name: string;
  isUs: boolean;
  x: number;
  y: number;
}

export interface WhiteSpace {
  description: string;
  x: number;
  y: number;
  attractiveness: 'high' | 'medium' | 'low';
}

export interface ContentStrategy {
  targetPersona: Persona;
  contentPillars: ContentPillar[];
  channels: Channel[];
  contentCalendar: ContentPlan[];
  kpis: MarketingKPI[];
}

export interface Persona {
  name: string;
  demographics: Record<string, string>;
  psychographics: string[];
  goals: string[];
  frustrations: string[];
  preferredChannels: string[];
  contentPreferences: string[];
}

export interface ContentPillar {
  id: string;
  theme: string;
  objective: 'awareness' | 'consideration' | 'conversion' | 'loyalty';
  topics: string[];
  formats: string[];
}

export interface Channel {
  name: string;
  purpose: string;
  frequency: string;
  contentTypes: string[];
  metrics: string[];
}

export interface ContentPlan {
  week: number;
  pillar: string;
  topic: string;
  format: string;
  channel: string;
  callToAction: string;
}

export interface MarketingKPI {
  name: string;
  currentValue: number;
  targetValue: number;
  unit: string;
  timeline: string;
}

export interface ShijoSession {
  sessionId: string;
  clientId: string;
  analysisType: 'market' | 'positioning' | 'content' | 'campaign';
  marketAnalysis?: MarketAnalysis;
  positioningMap?: PositioningMap;
  contentStrategy?: ContentStrategy;
  insights: string[];
}
