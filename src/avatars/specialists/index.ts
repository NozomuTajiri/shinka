/**
 * 専門アバター群エクスポート
 * 各領域に特化した6つのアバターを提供
 */

// 型定義のインポート（内部使用）
import {
  BaseSpecialist,
  type SpecialistDomain,
  type KnowledgeEntry,
} from './base-specialist';
import { SalesAvatar } from './sales-avatar';
import { MarketingAvatar } from './marketing-avatar';
import { ManagementAvatar } from './management-avatar';
import { FinanceAvatar } from './finance-avatar';
import { OrganizationAvatar } from './organization-avatar';
import { OperationsAvatar } from './operations-avatar';

// 基底クラスと型定義のエクスポート
export {
  BaseSpecialist,
  type SpecialistDomain,
  type ConsultationRequest,
  type ConsultationResponse,
  type CEOReport,
  type CollaborationSuggestion,
  type KnowledgeEntry,
} from './base-specialist';

// 専門アバターのエクスポート
export { SalesAvatar } from './sales-avatar';
export { MarketingAvatar } from './marketing-avatar';
export { ManagementAvatar } from './management-avatar';
export { FinanceAvatar } from './finance-avatar';
export { OrganizationAvatar } from './organization-avatar';
export { OperationsAvatar } from './operations-avatar';

/**
 * アバターファクトリー
 * API Keyを受け取り、全アバターを初期化
 */
export class SpecialistAvatarFactory {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API Key is required for SpecialistAvatarFactory');
    }
    this.apiKey = apiKey;
  }

  /**
   * セールスアバターを作成
   */
  createSalesAvatar(knowledgeBase?: KnowledgeEntry[]): SalesAvatar {
    return new SalesAvatar(this.apiKey, knowledgeBase);
  }

  /**
   * マーケティングアバターを作成
   */
  createMarketingAvatar(knowledgeBase?: KnowledgeEntry[]): MarketingAvatar {
    return new MarketingAvatar(this.apiKey, knowledgeBase);
  }

  /**
   * マネジメントアバターを作成
   */
  createManagementAvatar(knowledgeBase?: KnowledgeEntry[]): ManagementAvatar {
    return new ManagementAvatar(this.apiKey, knowledgeBase);
  }

  /**
   * 財務アバターを作成
   */
  createFinanceAvatar(knowledgeBase?: KnowledgeEntry[]): FinanceAvatar {
    return new FinanceAvatar(this.apiKey, knowledgeBase);
  }

  /**
   * 組織開発アバターを作成
   */
  createOrganizationAvatar(knowledgeBase?: KnowledgeEntry[]): OrganizationAvatar {
    return new OrganizationAvatar(this.apiKey, knowledgeBase);
  }

  /**
   * オペレーションアバターを作成
   */
  createOperationsAvatar(knowledgeBase?: KnowledgeEntry[]): OperationsAvatar {
    return new OperationsAvatar(this.apiKey, knowledgeBase);
  }

  /**
   * 全アバターを一括作成
   */
  createAllAvatars(knowledgeBase?: KnowledgeEntry[]): {
    sales: SalesAvatar;
    marketing: MarketingAvatar;
    management: ManagementAvatar;
    finance: FinanceAvatar;
    organization: OrganizationAvatar;
    operations: OperationsAvatar;
  } {
    return {
      sales: this.createSalesAvatar(knowledgeBase),
      marketing: this.createMarketingAvatar(knowledgeBase),
      management: this.createManagementAvatar(knowledgeBase),
      finance: this.createFinanceAvatar(knowledgeBase),
      organization: this.createOrganizationAvatar(knowledgeBase),
      operations: this.createOperationsAvatar(knowledgeBase),
    };
  }

  /**
   * ドメイン名から対応するアバターを作成
   */
  createByDomain(
    domain: SpecialistDomain,
    knowledgeBase?: KnowledgeEntry[]
  ): BaseSpecialist {
    switch (domain) {
      case 'sales':
        return this.createSalesAvatar(knowledgeBase);
      case 'marketing':
        return this.createMarketingAvatar(knowledgeBase);
      case 'management':
        return this.createManagementAvatar(knowledgeBase);
      case 'finance':
        return this.createFinanceAvatar(knowledgeBase);
      case 'organization':
        return this.createOrganizationAvatar(knowledgeBase);
      case 'operations':
        return this.createOperationsAvatar(knowledgeBase);
      default:
        throw new Error(`Unknown specialist domain: ${domain}`);
    }
  }
}
