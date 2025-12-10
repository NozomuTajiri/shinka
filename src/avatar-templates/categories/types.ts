/**
 * カテゴリ別テンプレート型定義
 */

import type { AvatarCategory, BaseAvatarTemplate, KnowledgeDomain } from '../base/types.js';

export interface CategoryTemplate {
  category: AvatarCategory;
  name: string;
  nameJa: string;
  description: string;
  defaultKnowledge: KnowledgeDomain[];
  defaultCapabilities: string[];
  suggestedProtocols: string[];
  subcategories: Subcategory[];
}

export interface Subcategory {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  specializations: string[];
  additionalKnowledge: string[];
}

export type CategoryTemplateMap = Record<AvatarCategory, CategoryTemplate>;
