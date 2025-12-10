# Category-specific Avatar Templates

This module provides category-specific templates for creating specialized business avatars in the Shinka framework.

## Overview

The category templates define pre-configured avatar setups for six major business domains:

1. **Management** - Executive leadership and strategic decision-making
2. **Sales** - Sales process optimization and customer acquisition
3. **Marketing** - Market strategy and brand development
4. **Operations** - Business process optimization and quality management
5. **Organization** - HR, talent management, and organizational development
6. **Specialized** - Industry, functional, and project-specific expertise

## Structure

Each category template includes:

- **Default Knowledge Domains**: Pre-configured expertise areas with topics and frameworks
- **Default Capabilities**: Core abilities for the category
- **Suggested Protocols**: Recommended interaction protocols
- **Subcategories**: Specialized roles within the category

## Usage

### Getting a Category Template

```typescript
import { getCategoryTemplate } from './categories/index.js';

const managementTemplate = getCategoryTemplate('management');
console.log(managementTemplate.name); // "Management"
console.log(managementTemplate.subcategories); // Array of subcategories
```

### Listing All Categories

```typescript
import { getAllCategories } from './categories/index.js';

const categories = getAllCategories();
// ['management', 'sales', 'marketing', 'operations', 'organization', 'specialized']
```

### Getting Subcategories

```typescript
import { getSubcategories } from './categories/index.js';

const salesSubcategories = getSubcategories('sales');
// ['sales-consultant', 'technical-sales', 'customer-success', 'inside-sales']
```

### Accessing Individual Templates

```typescript
import {
  MANAGEMENT_TEMPLATE,
  SALES_TEMPLATE,
  MARKETING_TEMPLATE,
  OPERATIONS_TEMPLATE,
  ORGANIZATION_TEMPLATE,
  SPECIALIZED_TEMPLATE,
} from './categories/index.js';

// Use individual templates directly
console.log(SALES_TEMPLATE.defaultKnowledge);
```

## Category Details

### 1. Management (経営系)

**Purpose**: Support executive decision-making and strategic execution

**Subcategories**:
- CEO Advisor - Executive decision support
- CFO Advisor - Financial strategy and funding
- Strategy Consultant - Strategic planning and execution
- M&A Advisor - M&A strategy and execution

**Key Knowledge**:
- Strategic Management
- Financial Management
- Corporate Governance

### 2. Sales (営業系)

**Purpose**: Optimize sales activities and improve outcomes

**Subcategories**:
- Sales Consultant - Sales organization strengthening
- Technical Sales - Technical sales support
- Customer Success - Customer success enablement
- Inside Sales - Remote sales efficiency

**Key Knowledge**:
- Sales Methodology
- Customer Psychology
- Account Management

### 3. Marketing (マーケティング系)

**Purpose**: Market development and marketing optimization

**Subcategories**:
- Marketing Strategist - Marketing strategy planning
- Brand Consultant - Brand building support
- Digital Marketer - Digital campaign optimization
- PR Specialist - Public relations and PR strategy

**Key Knowledge**:
- Marketing Strategy
- Digital Marketing
- Brand Management

### 4. Operations (業務系)

**Purpose**: Business efficiency and operational improvement

**Subcategories**:
- Operations Consultant - Business process improvement
- DX Promoter - Digital transformation support
- Process Engineer - Process design and optimization
- Quality Manager - Quality improvement support

**Key Knowledge**:
- Process Optimization
- Digital Transformation
- Quality Management

### 5. Organization (組織系)

**Purpose**: Organizational development and talent management

**Subcategories**:
- OD Consultant - Organizational transformation support
- HR Consultant - HR systems and recruitment
- Talent Developer - Talent development support
- Engagement Specialist - Employee engagement improvement

**Key Knowledge**:
- Organization Development
- Talent Management
- Engagement

### 6. Specialized (専門系)

**Purpose**: Industry, functional, and project-specific expertise

**Subcategories**:
- Industry Specialist - Industry-specific support
- Function Specialist - Functional expertise support
- Project Specialist - Large-scale project support
- Hybrid Specialist - Cross-domain integration support

**Key Knowledge**:
- Industry Expertise
- Functional Expertise
- Project Methodology

## Template Structure

### CategoryTemplate Type

```typescript
interface CategoryTemplate {
  category: AvatarCategory;
  name: string;
  nameJa: string;
  description: string;
  defaultKnowledge: KnowledgeDomain[];
  defaultCapabilities: string[];
  suggestedProtocols: string[];
  subcategories: Subcategory[];
}
```

### Subcategory Type

```typescript
interface Subcategory {
  id: string;
  name: string;
  nameJa: string;
  description: string;
  specializations: string[];
  additionalKnowledge: string[];
}
```

## Extending Templates

To add a new category:

1. Create a new template file (e.g., `new-category-template.ts`)
2. Define the knowledge domains, subcategories, and capabilities
3. Export the template constant
4. Add it to `index.ts` exports and `CATEGORY_TEMPLATES` map
5. Update the `AvatarCategory` type in `base/types.ts`

## Integration with Avatar System

Category templates are used during avatar creation to:

1. Initialize default knowledge domains
2. Set up appropriate capabilities
3. Configure communication protocols
4. Provide role-specific configurations

These templates serve as starting points that can be customized for specific organizational needs.

## Best Practices

1. **Knowledge Domains**: Include 2-4 core domains per category
2. **Subcategories**: Provide 3-5 specialized roles per category
3. **Capabilities**: List 3-5 key capabilities that align with the domain
4. **Protocols**: Suggest protocols that match typical interaction patterns
5. **Sources**: Define external and internal knowledge sources with appropriate refresh intervals

## Related Modules

- `../base/types.ts` - Core avatar type definitions
- `../factory/` - Avatar factory for creating instances
- `../knowledge/` - Knowledge management system
- `../protocols/` - Communication protocol implementations
