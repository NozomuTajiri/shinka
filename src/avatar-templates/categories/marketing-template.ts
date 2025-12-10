/**
 * マーケティング系カテゴリテンプレート
 */

import type { CategoryTemplate, Subcategory } from './types.js';
import type { KnowledgeDomain } from '../base/types.js';

const MARKETING_KNOWLEDGE: KnowledgeDomain[] = [
  {
    id: 'marketing-strategy',
    name: 'マーケティング戦略',
    description: '市場戦略の立案と実行',
    expertiseLevel: 'expert',
    topics: ['市場分析', 'ターゲティング', 'ポジショニング', 'ブランド戦略'],
    frameworks: ['3C分析', 'STP', '4P/4C', 'カスタマージャーニー'],
    sources: [
      { id: 'market-data', type: 'external', name: '市場データDB', priority: 1, refreshInterval: 7 },
    ],
    updatedAt: new Date(),
  },
  {
    id: 'digital-marketing',
    name: 'デジタルマーケティング',
    description: 'デジタルチャネル活用',
    expertiseLevel: 'advanced',
    topics: ['SEO/SEM', 'SNSマーケティング', 'コンテンツマーケティング', 'マーケティングオートメーション'],
    frameworks: ['AISAS', 'ファネル分析', 'アトリビューション'],
    sources: [],
    updatedAt: new Date(),
  },
  {
    id: 'brand-management',
    name: 'ブランド管理',
    description: 'ブランド価値の構築と維持',
    expertiseLevel: 'advanced',
    topics: ['ブランドアイデンティティ', 'ブランド体験', 'ブランド資産', 'レピュテーション'],
    frameworks: ['ブランドエクイティ', 'ブランドピラミッド'],
    sources: [],
    updatedAt: new Date(),
  },
];

const MARKETING_SUBCATEGORIES: Subcategory[] = [
  {
    id: 'marketing-strategist',
    name: 'Marketing Strategist',
    nameJa: 'マーケティング戦略家',
    description: 'マーケティング戦略の立案支援',
    specializations: ['市場戦略', 'GTM戦略', 'プロダクトマーケティング'],
    additionalKnowledge: ['市場調査', '競合分析'],
  },
  {
    id: 'brand-consultant',
    name: 'Brand Consultant',
    nameJa: 'ブランドコンサルタント',
    description: 'ブランド構築支援',
    specializations: ['ブランド戦略', 'CI/VI', 'ブランドコミュニケーション'],
    additionalKnowledge: ['デザイン思考', 'ストーリーテリング'],
  },
  {
    id: 'digital-marketer',
    name: 'Digital Marketer',
    nameJa: 'デジタルマーケター',
    description: 'デジタル施策の最適化',
    specializations: ['Web戦略', 'SNS運用', '広告運用'],
    additionalKnowledge: ['データ分析', 'UX設計'],
  },
  {
    id: 'pr-specialist',
    name: 'PR Specialist',
    nameJa: 'PR専門家',
    description: '広報・PR戦略支援',
    specializations: ['メディアリレーション', '危機管理広報', 'インナーコミュニケーション'],
    additionalKnowledge: ['メディア分析', 'ステークホルダー管理'],
  },
];

export const MARKETING_TEMPLATE: CategoryTemplate = {
  category: 'marketing',
  name: 'Marketing',
  nameJa: 'マーケティング系',
  description: 'マーケティング活動と市場開拓を支援するアバターカテゴリ',
  defaultKnowledge: MARKETING_KNOWLEDGE,
  defaultCapabilities: ['market-analysis', 'campaign-planning', 'brand-strategy'],
  suggestedProtocols: ['report', 'request', 'insight-sharing'],
  subcategories: MARKETING_SUBCATEGORIES,
};
