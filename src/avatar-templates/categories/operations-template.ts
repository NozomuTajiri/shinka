/**
 * 業務系カテゴリテンプレート
 */

import type { CategoryTemplate, Subcategory } from './types.js';
import type { KnowledgeDomain } from '../base/types.js';

const OPERATIONS_KNOWLEDGE: KnowledgeDomain[] = [
  {
    id: 'process-optimization',
    name: 'プロセス最適化',
    description: '業務プロセスの改善',
    expertiseLevel: 'expert',
    topics: ['業務分析', 'プロセス設計', '自動化', '継続的改善'],
    frameworks: ['BPR', 'リーン', 'シックスシグマ', 'TOC'],
    sources: [],
    updatedAt: new Date(),
  },
  {
    id: 'digital-transformation',
    name: 'DX推進',
    description: 'デジタル変革の推進',
    expertiseLevel: 'advanced',
    topics: ['DX戦略', 'システム導入', 'データ活用', '組織変革'],
    frameworks: ['DXロードマップ', 'アジャイル', 'デザイン思考'],
    sources: [],
    updatedAt: new Date(),
  },
  {
    id: 'quality-management',
    name: '品質管理',
    description: '品質の維持向上',
    expertiseLevel: 'advanced',
    topics: ['品質基準', '検査プロセス', '改善活動', '顧客満足'],
    frameworks: ['TQM', 'ISO9001', 'QCサークル'],
    sources: [],
    updatedAt: new Date(),
  },
];

const OPERATIONS_SUBCATEGORIES: Subcategory[] = [
  {
    id: 'operations-consultant',
    name: 'Operations Consultant',
    nameJa: '業務コンサルタント',
    description: '業務改善の支援',
    specializations: ['業務効率化', 'コスト削減', '生産性向上'],
    additionalKnowledge: ['業務分析手法', '改善ツール'],
  },
  {
    id: 'dx-promoter',
    name: 'DX Promoter',
    nameJa: 'DX推進担当',
    description: 'デジタル変革の推進支援',
    specializations: ['DX企画', 'PoC実施', '定着化支援'],
    additionalKnowledge: ['IT知識', 'チェンジマネジメント'],
  },
  {
    id: 'process-engineer',
    name: 'Process Engineer',
    nameJa: 'プロセスエンジニア',
    description: 'プロセス設計と最適化',
    specializations: ['プロセスマイニング', '自動化設計', 'ワークフロー構築'],
    additionalKnowledge: ['RPA', 'BPMツール'],
  },
  {
    id: 'quality-manager',
    name: 'Quality Manager',
    nameJa: '品質管理者',
    description: '品質向上の支援',
    specializations: ['品質改善', '標準化', '監査対応'],
    additionalKnowledge: ['統計手法', '品質ツール'],
  },
];

export const OPERATIONS_TEMPLATE: CategoryTemplate = {
  category: 'operations',
  name: 'Operations',
  nameJa: '業務系',
  description: '業務効率化とオペレーション改善を支援するアバターカテゴリ',
  defaultKnowledge: OPERATIONS_KNOWLEDGE,
  defaultCapabilities: ['process-analysis', 'automation-design', 'quality-improvement'],
  suggestedProtocols: ['report', 'request', 'arbitration'],
  subcategories: OPERATIONS_SUBCATEGORIES,
};
