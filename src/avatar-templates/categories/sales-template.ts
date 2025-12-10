/**
 * 営業系カテゴリテンプレート
 */

import type { CategoryTemplate, Subcategory } from './types.js';
import type { KnowledgeDomain } from '../base/types.js';

const SALES_KNOWLEDGE: KnowledgeDomain[] = [
  {
    id: 'sales-methodology',
    name: '営業手法',
    description: '科学的営業プロセス',
    expertiseLevel: 'expert',
    topics: ['商談プロセス', 'ニーズ把握', '提案構築', 'クロージング'],
    frameworks: ['SPIN営業', 'ソリューション営業', 'チャレンジャーセールス', 'MEDDIC'],
    sources: [
      { id: 'sales-best', type: 'internal', name: '営業ベストプラクティス', priority: 1, refreshInterval: 14 },
    ],
    updatedAt: new Date(),
  },
  {
    id: 'customer-psychology',
    name: '顧客心理',
    description: '購買心理と意思決定',
    expertiseLevel: 'advanced',
    topics: ['購買決定プロセス', 'ステークホルダー分析', '反論処理', '信頼構築'],
    frameworks: ['購買センター分析', 'BANT', 'ペインポイント分析'],
    sources: [],
    updatedAt: new Date(),
  },
  {
    id: 'account-management',
    name: 'アカウント管理',
    description: '顧客関係の構築と維持',
    expertiseLevel: 'advanced',
    topics: ['関係構築', 'アップセル', 'クロスセル', 'リテンション'],
    frameworks: ['アカウントプランニング', 'カスタマーサクセス', 'NPS'],
    sources: [],
    updatedAt: new Date(),
  },
];

const SALES_SUBCATEGORIES: Subcategory[] = [
  {
    id: 'sales-consultant',
    name: 'Sales Consultant',
    nameJa: '営業コンサルタント',
    description: '営業組織の強化支援',
    specializations: ['営業プロセス改善', '商談支援', '営業トレーニング'],
    additionalKnowledge: ['営業組織論', 'セールスイネーブルメント'],
  },
  {
    id: 'technical-sales',
    name: 'Technical Sales',
    nameJa: '技術営業',
    description: '技術的な営業支援',
    specializations: ['技術説明', 'PoC支援', 'RFP対応'],
    additionalKnowledge: ['製品知識', 'システム設計'],
  },
  {
    id: 'customer-success',
    name: 'Customer Success',
    nameJa: 'カスタマーサクセス',
    description: '顧客の成功実現支援',
    specializations: ['オンボーディング', '活用促進', 'チャーン防止'],
    additionalKnowledge: ['プロダクト知識', 'ユーザー行動分析'],
  },
  {
    id: 'inside-sales',
    name: 'Inside Sales',
    nameJa: 'インサイドセールス',
    description: '非対面営業の効率化',
    specializations: ['リード育成', 'アポイント獲得', 'デジタル営業'],
    additionalKnowledge: ['MA/SFA', 'コミュニケーション'],
  },
];

export const SALES_TEMPLATE: CategoryTemplate = {
  category: 'sales',
  name: 'Sales',
  nameJa: '営業系',
  description: '営業活動の効率化と成果向上を支援するアバターカテゴリ',
  defaultKnowledge: SALES_KNOWLEDGE,
  defaultCapabilities: ['sales-coaching', 'deal-analysis', 'customer-insight'],
  suggestedProtocols: ['report', 'request', 'insight-sharing'],
  subcategories: SALES_SUBCATEGORIES,
};
