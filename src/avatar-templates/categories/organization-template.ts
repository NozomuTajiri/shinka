/**
 * 組織系カテゴリテンプレート
 */

import type { CategoryTemplate, Subcategory } from './types.js';
import type { KnowledgeDomain } from '../base/types.js';

const ORGANIZATION_KNOWLEDGE: KnowledgeDomain[] = [
  {
    id: 'organization-development',
    name: '組織開発',
    description: '組織の健全な成長',
    expertiseLevel: 'expert',
    topics: ['組織設計', '組織文化', 'チームビルディング', '組織変革'],
    frameworks: ['組織診断', 'チェンジマネジメント', 'OD介入'],
    sources: [],
    updatedAt: new Date(),
  },
  {
    id: 'talent-management',
    name: '人材管理',
    description: '人材の獲得と育成',
    expertiseLevel: 'advanced',
    topics: ['採用戦略', '人材育成', 'キャリア開発', 'サクセッション'],
    frameworks: ['コンピテンシーモデル', '70-20-10', 'タレントレビュー'],
    sources: [],
    updatedAt: new Date(),
  },
  {
    id: 'engagement',
    name: 'エンゲージメント',
    description: '従業員エンゲージメントの向上',
    expertiseLevel: 'advanced',
    topics: ['モチベーション', 'リテンション', 'ウェルビーイング', 'DEI'],
    frameworks: ['エンゲージメントサーベイ', 'パルスチェック', 'eNPS'],
    sources: [],
    updatedAt: new Date(),
  },
];

const ORGANIZATION_SUBCATEGORIES: Subcategory[] = [
  {
    id: 'od-consultant',
    name: 'OD Consultant',
    nameJa: '組織開発コンサルタント',
    description: '組織の変革と成長支援',
    specializations: ['組織診断', '組織設計', 'チーム開発'],
    additionalKnowledge: ['組織心理学', 'ファシリテーション'],
  },
  {
    id: 'hr-consultant',
    name: 'HR Consultant',
    nameJa: '人事コンサルタント',
    description: '人事制度と採用支援',
    specializations: ['人事制度設計', '採用戦略', '労務管理'],
    additionalKnowledge: ['労働法', '報酬設計'],
  },
  {
    id: 'talent-developer',
    name: 'Talent Developer',
    nameJa: '人材開発担当',
    description: '人材育成の支援',
    specializations: ['研修設計', 'コーチング', 'メンタリング'],
    additionalKnowledge: ['成人学習理論', '教育設計'],
  },
  {
    id: 'engagement-specialist',
    name: 'Engagement Specialist',
    nameJa: 'エンゲージメント専門家',
    description: '従業員エンゲージメント向上',
    specializations: ['エンゲージメント施策', 'ウェルビーイング', 'DEI推進'],
    additionalKnowledge: ['組織サーベイ', '心理学'],
  },
];

export const ORGANIZATION_TEMPLATE: CategoryTemplate = {
  category: 'organization',
  name: 'Organization',
  nameJa: '組織系',
  description: '組織開発と人材マネジメントを支援するアバターカテゴリ',
  defaultKnowledge: ORGANIZATION_KNOWLEDGE,
  defaultCapabilities: ['org-diagnosis', 'talent-assessment', 'engagement-analysis'],
  suggestedProtocols: ['report', 'request', 'joint-session'],
  subcategories: ORGANIZATION_SUBCATEGORIES,
};
