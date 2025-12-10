/**
 * 経営系カテゴリテンプレート
 */

import type { CategoryTemplate, Subcategory } from './types.js';
import type { KnowledgeDomain } from '../base/types.js';

const MANAGEMENT_KNOWLEDGE: KnowledgeDomain[] = [
  {
    id: 'strategic-management',
    name: '戦略経営',
    description: '経営戦略の立案と実行',
    expertiseLevel: 'expert',
    topics: ['経営ビジョン', '中長期計画', '事業ポートフォリオ', 'M&A戦略'],
    frameworks: ['バランススコアカード', 'SWOT分析', 'ポーターの競争戦略', 'アンゾフマトリクス'],
    sources: [
      { id: 'mgt-theory', type: 'external', name: '経営理論DB', priority: 1, refreshInterval: 30 },
    ],
    updatedAt: new Date(),
  },
  {
    id: 'financial-management',
    name: '財務経営',
    description: '財務戦略と資金管理',
    expertiseLevel: 'advanced',
    topics: ['財務分析', '資金調達', '投資判断', 'リスク管理'],
    frameworks: ['DCF法', 'ROE分析', 'キャッシュフロー経営', 'EVA'],
    sources: [
      { id: 'finance-data', type: 'external', name: '財務指標DB', priority: 1, refreshInterval: 7 },
    ],
    updatedAt: new Date(),
  },
  {
    id: 'governance',
    name: 'コーポレートガバナンス',
    description: '企業統治と内部統制',
    expertiseLevel: 'advanced',
    topics: ['取締役会運営', 'コンプライアンス', 'リスクマネジメント', 'ESG経営'],
    frameworks: ['COSO', 'J-SOX', 'コーポレートガバナンスコード'],
    sources: [],
    updatedAt: new Date(),
  },
];

const MANAGEMENT_SUBCATEGORIES: Subcategory[] = [
  {
    id: 'ceo-advisor',
    name: 'CEO Advisor',
    nameJa: 'CEO顧問',
    description: '経営者の意思決定支援',
    specializations: ['経営ビジョン策定', '組織変革', 'ステークホルダー管理'],
    additionalKnowledge: ['リーダーシップ', '組織心理学'],
  },
  {
    id: 'cfo-advisor',
    name: 'CFO Advisor',
    nameJa: 'CFO顧問',
    description: '財務戦略と資金管理支援',
    specializations: ['財務戦略', '資金調達', 'IR戦略'],
    additionalKnowledge: ['会計基準', '税務戦略'],
  },
  {
    id: 'strategy-consultant',
    name: 'Strategy Consultant',
    nameJa: '経営戦略コンサルタント',
    description: '戦略立案と実行支援',
    specializations: ['成長戦略', '新規事業', '事業再編'],
    additionalKnowledge: ['業界分析', '競合分析'],
  },
  {
    id: 'ma-advisor',
    name: 'M&A Advisor',
    nameJa: 'M&Aアドバイザー',
    description: 'M&A戦略と実行支援',
    specializations: ['企業価値評価', 'デューデリジェンス', 'PMI'],
    additionalKnowledge: ['法務', 'バリュエーション'],
  },
];

export const MANAGEMENT_TEMPLATE: CategoryTemplate = {
  category: 'management',
  name: 'Management',
  nameJa: '経営系',
  description: '経営層の意思決定と戦略実行を支援するアバターカテゴリ',
  defaultKnowledge: MANAGEMENT_KNOWLEDGE,
  defaultCapabilities: ['strategic-analysis', 'financial-modeling', 'decision-support'],
  suggestedProtocols: ['report', 'request', 'joint-session'],
  subcategories: MANAGEMENT_SUBCATEGORIES,
};
