/**
 * カテゴリ別テンプレート
 * @module avatar-templates/categories
 */

import type { AvatarCategory } from '../base/types.js';
import type { CategoryTemplate, CategoryTemplateMap } from './types.js';

export * from './types.js';
export { MANAGEMENT_TEMPLATE } from './management-template.js';
export { SALES_TEMPLATE } from './sales-template.js';
export { MARKETING_TEMPLATE } from './marketing-template.js';
export { OPERATIONS_TEMPLATE } from './operations-template.js';
export { ORGANIZATION_TEMPLATE } from './organization-template.js';
export { SPECIALIZED_TEMPLATE } from './specialized-template.js';

import { MANAGEMENT_TEMPLATE } from './management-template.js';
import { SALES_TEMPLATE } from './sales-template.js';
import { MARKETING_TEMPLATE } from './marketing-template.js';
import { OPERATIONS_TEMPLATE } from './operations-template.js';
import { ORGANIZATION_TEMPLATE } from './organization-template.js';
import { SPECIALIZED_TEMPLATE } from './specialized-template.js';

export const CATEGORY_TEMPLATES: CategoryTemplateMap = {
  management: MANAGEMENT_TEMPLATE,
  sales: SALES_TEMPLATE,
  marketing: MARKETING_TEMPLATE,
  operations: OPERATIONS_TEMPLATE,
  organization: ORGANIZATION_TEMPLATE,
  specialized: SPECIALIZED_TEMPLATE,
};

export function getCategoryTemplate(category: AvatarCategory): CategoryTemplate {
  return CATEGORY_TEMPLATES[category];
}

export function getAllCategories(): AvatarCategory[] {
  return Object.keys(CATEGORY_TEMPLATES) as AvatarCategory[];
}

export function getSubcategories(category: AvatarCategory): string[] {
  return CATEGORY_TEMPLATES[category].subcategories.map(s => s.id);
}
