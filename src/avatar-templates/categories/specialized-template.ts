/**
 * 専門系カテゴリテンプレート
 */

import type { CategoryTemplate, Subcategory } from './types.js';
import type { KnowledgeDomain } from '../base/types.js';

const SPECIALIZED_KNOWLEDGE: KnowledgeDomain[] = [
  {
    id: 'industry-expertise',
    name: '業界専門知識',
    description: '特定業界の深い理解',
    expertiseLevel: 'expert',
    topics: ['業界構造', '規制環境', '市場動向', '主要プレイヤー'],
    frameworks: ['業界分析', 'バリューチェーン', '5フォース'],
    sources: [
      { id: 'industry-report', type: 'external', name: '業界レポート', priority: 1, refreshInterval: 30 },
    ],
    updatedAt: new Date(),
  },
  {
    id: 'functional-expertise',
    name: '機能専門知識',
    description: '特定機能の専門性',
    expertiseLevel: 'expert',
    topics: ['専門手法', 'ベストプラクティス', '最新トレンド', 'ツール活用'],
    frameworks: [],
    sources: [],
    updatedAt: new Date(),
  },
  {
    id: 'project-methodology',
    name: 'プロジェクト手法',
    description: 'プロジェクト推進の専門性',
    expertiseLevel: 'advanced',
    topics: ['プロジェクト管理', 'ステークホルダー管理', 'リスク管理', '変更管理'],
    frameworks: ['PMBOK', 'アジャイル', 'プリンス2'],
    sources: [],
    updatedAt: new Date(),
  },
];

const SPECIALIZED_SUBCATEGORIES: Subcategory[] = [
  {
    id: 'industry-specialist',
    name: 'Industry Specialist',
    nameJa: '業界専門家',
    description: '特定業界の専門支援',
    specializations: ['業界分析', '規制対応', '業界ネットワーク'],
    additionalKnowledge: ['業界固有知識', '規制法規'],
  },
  {
    id: 'function-specialist',
    name: 'Function Specialist',
    nameJa: '機能専門家',
    description: '特定機能の専門支援',
    specializations: ['専門技術', '最新動向', 'ツール活用'],
    additionalKnowledge: ['専門資格', '実務経験'],
  },
  {
    id: 'project-specialist',
    name: 'Project Specialist',
    nameJa: 'プロジェクト専門家',
    description: '大規模プロジェクト支援',
    specializations: ['PMO', '変革管理', '統合管理'],
    additionalKnowledge: ['プロジェクト手法', 'ツール'],
  },
  {
    id: 'hybrid-specialist',
    name: 'Hybrid Specialist',
    nameJa: 'ハイブリッド専門家',
    description: '複数領域の統合支援',
    specializations: ['領域横断', '統合ソリューション', 'カスタム対応'],
    additionalKnowledge: ['複合知識', '柔軟な対応力'],
  },
];

export const SPECIALIZED_TEMPLATE: CategoryTemplate = {
  category: 'specialized',
  name: 'Specialized',
  nameJa: '専門系',
  description: '業界・機能・プロジェクト特化の専門支援を行うアバターカテゴリ',
  defaultKnowledge: SPECIALIZED_KNOWLEDGE,
  defaultCapabilities: ['deep-expertise', 'custom-solution', 'integration'],
  suggestedProtocols: ['report', 'request', 'insight-sharing', 'joint-session'],
  subcategories: SPECIALIZED_SUBCATEGORIES,
};
