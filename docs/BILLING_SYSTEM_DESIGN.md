# SaaS課金・サブスクリプション基盤 設計書

**Status**: Draft
**Date**: 2025-11-30
**Related Issue**: #10 (Parent: #2 カクシン進化)
**Repository**: NozomuTajiri/shinka
**Version**: 1.0.0

---

## エグゼクティブサマリー

本設計書は、Miyabi SaaSプラットフォームの課金・サブスクリプション基盤の詳細設計を定義します。Stripe Billingを基盤とし、エンタープライズグレードの課金管理、使用量計測、請求書自動生成、アップグレード/ダウングレードフローを実現します。

### 主要目標

- 4つの価格体系（Starter/Growth/Enterprise/Strategic）の完全サポート
- リアルタイム使用量計測（Issue数、Agent実行数、API呼び出し数）
- 自動請求書生成・配信
- 柔軟なプラン変更フロー（アップグレード/ダウングレード）
- SLA保証とクレジット/返金処理
- セキュアなWebhook処理とイベント駆動アーキテクチャ

---

## 1. 価格体系とプラン設計

### 1.1 プラン定義

BUSINESS_PLAN_DETAILED.mdで定義された4層構造を実装します。

| Tier | 月額料金 | 年間料金（割引率） | 想定顧客 | 主な制限 |
|------|---------|------------------|---------|---------|
| **Starter** | ¥50,000 | ¥600,000 (-16.7%) | スタートアップ、試験導入 | 5 Issues/月、1 Agent、5 Projects |
| **Growth** | ¥200,000 | ¥2,400,000 (-16.7%) | 成長企業、部門導入 | 50 Issues/月、3 Agents、20 Projects |
| **Enterprise** | ¥1,000,000 | ¥12,000,000 (-16.7%) | 大企業、全社導入 | 無制限 Issues、全7 Agents、無制限 Projects、SLA 99.9% |
| **Strategic** | 個別見積 | ¥30,000,000〜 | 超大手、戦略パートナー | 専用環境、カスタマイズ、専任CSM、SLA 99.99% |

### 1.2 使用量計測項目（Metering）

#### 1.2.1 コア計測項目

```typescript
interface UsageMetrics {
  // Agent実行数
  agentExecutions: {
    coordinator: number;
    codegen: number;
    review: number;
    issue: number;
    pr: number;
    deployment: number;
    test: number;
  };

  // Issue処理数
  issuesProcessed: number;

  // API呼び出し数
  apiCalls: {
    total: number;
    byEndpoint: Record<string, number>;
  };

  // ストレージ使用量（GB）
  storageUsed: number;

  // AI Token使用量（Claude API）
  aiTokensUsed: {
    inputTokens: number;
    outputTokens: number;
  };

  // 計測期間
  periodStart: string; // ISO 8601
  periodEnd: string;   // ISO 8601
}
```

#### 1.2.2 従量課金項目（Overage Charges）

Enterprise以上のプランで超過分課金が可能：

| 項目 | Starter | Growth | Enterprise | Strategic |
|------|---------|--------|-----------|-----------|
| **追加Agent実行** | 不可（上限で停止） | 不可（上限で停止） | ¥10,000/100実行 | カスタム |
| **追加Issue処理** | ¥5,000/Issue | ¥3,000/Issue | ¥1,000/Issue | カスタム |
| **追加ストレージ** | ¥500/GB | ¥300/GB | ¥100/GB | カスタム |
| **追加AI Tokens** | 不可 | 不可 | ¥5/1M tokens | カスタム |

---

## 2. Stripe連携アーキテクチャ

### 2.1 アーキテクチャ概要

```
┌───────────────────────────────────────────────────────────────┐
│                      Client (Web App)                         │
└─────────────────────────┬─────────────────────────────────────┘
                          │
                          │ 1. Checkout Request
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Billing Service (Node.js/TypeScript)            │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Stripe SDK                                            │ │
│  │  - Create Checkout Session                             │ │
│  │  - Create Customer                                     │ │
│  │  - Create Subscription                                 │ │
│  │  - Create Usage Record                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ 2. API Calls
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Stripe API                                │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Customers │  │ Subscriptions│ │  Invoices  │           │
│  └────────────┘  └────────────┘  └────────────┘            │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Products  │  │   Prices   │  │  Usage     │           │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ 3. Webhooks (Events)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Webhook Handler Service                         │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Event Types:                                          │ │
│  │  - customer.subscription.created                       │ │
│  │  - customer.subscription.updated                       │ │
│  │  - customer.subscription.deleted                       │ │
│  │  - invoice.payment_succeeded                           │ │
│  │  - invoice.payment_failed                              │ │
│  │  - invoice.finalized                                   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ 4. Update DB
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              PostgreSQL (Billing Schema)                     │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Tables:                                               │ │
│  │  - subscriptions                                       │ │
│  │  - invoices                                            │ │
│  │  - payments                                            │ │
│  │  - usage_records                                       │ │
│  │  - billing_events                                      │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Stripe製品構成

#### 2.2.1 Product定義（Stripe Dashboard設定）

```typescript
// Stripe Product Configuration
const stripeProducts = [
  {
    id: 'prod_miyabi_starter',
    name: 'Miyabi Starter',
    description: 'スタートアップ向けプラン',
    metadata: {
      plan_tier: 'starter',
      agent_limit: '1',
      issue_limit: '5',
      project_limit: '5',
    }
  },
  {
    id: 'prod_miyabi_growth',
    name: 'Miyabi Growth',
    description: '成長企業向けプラン',
    metadata: {
      plan_tier: 'growth',
      agent_limit: '3',
      issue_limit: '50',
      project_limit: '20',
    }
  },
  {
    id: 'prod_miyabi_enterprise',
    name: 'Miyabi Enterprise',
    description: '大企業向けプラン',
    metadata: {
      plan_tier: 'enterprise',
      agent_limit: 'unlimited',
      issue_limit: 'unlimited',
      project_limit: 'unlimited',
      sla: '99.9',
    }
  },
  {
    id: 'prod_miyabi_strategic',
    name: 'Miyabi Strategic',
    description: '戦略パートナー向けプラン',
    metadata: {
      plan_tier: 'strategic',
      dedicated_environment: 'true',
      sla: '99.99',
    }
  }
];
```

#### 2.2.2 Price定義

```typescript
// Monthly Prices
const monthlyPrices = [
  {
    product: 'prod_miyabi_starter',
    unit_amount: 5000000, // ¥50,000 in cents
    currency: 'jpy',
    recurring: { interval: 'month' },
    metadata: { billing_period: 'monthly' }
  },
  {
    product: 'prod_miyabi_growth',
    unit_amount: 20000000, // ¥200,000
    currency: 'jpy',
    recurring: { interval: 'month' }
  },
  // ... Enterprise, Strategic
];

// Annual Prices (with 16.7% discount)
const annualPrices = [
  {
    product: 'prod_miyabi_starter',
    unit_amount: 60000000, // ¥600,000
    currency: 'jpy',
    recurring: { interval: 'year' },
    metadata: { billing_period: 'annual', discount: '16.7%' }
  },
  // ...
];

// Metered Prices (Usage-based)
const meteredPrices = [
  {
    product: 'prod_miyabi_usage_agent',
    unit_amount: 100000, // ¥1,000 per 10 executions
    currency: 'jpy',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
      aggregate_usage: 'sum',
    },
    metadata: { unit: '10_agent_executions' }
  },
  {
    product: 'prod_miyabi_usage_issue',
    unit_amount: 100000, // ¥1,000 per issue
    currency: 'jpy',
    recurring: {
      interval: 'month',
      usage_type: 'metered',
    }
  },
];
```

### 2.3 データベース設計（PostgreSQL）

#### 2.3.1 Billing Schema

```sql
-- Platform-level billing schema
CREATE SCHEMA billing;

-- Subscriptions Table
CREATE TABLE billing.subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE,

  -- Stripe IDs
  stripe_customer_id VARCHAR(255) NOT NULL,
  stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_price_id VARCHAR(255) NOT NULL,

  -- Plan details
  plan_tier VARCHAR(50) NOT NULL, -- starter, growth, enterprise, strategic
  billing_period VARCHAR(20) NOT NULL, -- monthly, annual

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, past_due, canceled, incomplete, trialing

  -- Dates
  current_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  current_period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  trial_start TIMESTAMP WITH TIME ZONE,
  trial_end TIMESTAMP WITH TIME ZONE,
  canceled_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,

  -- Pricing
  unit_amount BIGINT NOT NULL, -- in cents (JPY)
  currency VARCHAR(3) DEFAULT 'jpy',

  -- Metadata
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Indexes
  CONSTRAINT unique_tenant_active_subscription UNIQUE (tenant_id, status)
    WHERE status = 'active'
);

CREATE INDEX idx_subscriptions_tenant ON billing.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_stripe_customer ON billing.subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_status ON billing.subscriptions(status);

-- Invoices Table
CREATE TABLE billing.invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id),
  subscription_id UUID REFERENCES billing.subscriptions(subscription_id),

  -- Stripe IDs
  stripe_invoice_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_payment_intent_id VARCHAR(255),

  -- Invoice details
  invoice_number VARCHAR(100) UNIQUE,
  amount_due BIGINT NOT NULL, -- total amount in cents
  amount_paid BIGINT DEFAULT 0,
  amount_remaining BIGINT DEFAULT 0,

  -- Line items (stored as JSON for flexibility)
  line_items JSONB NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL, -- draft, open, paid, void, uncollectible

  -- Dates
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- PDF
  invoice_pdf_url TEXT,
  hosted_invoice_url TEXT,

  -- Metadata
  currency VARCHAR(3) DEFAULT 'jpy',
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_invoices_tenant ON billing.invoices(tenant_id);
CREATE INDEX idx_invoices_subscription ON billing.invoices(subscription_id);
CREATE INDEX idx_invoices_status ON billing.invoices(status);
CREATE INDEX idx_invoices_period ON billing.invoices(period_start, period_end);

-- Payments Table
CREATE TABLE billing.payments (
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES billing.invoices(invoice_id),
  tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id),

  -- Stripe IDs
  stripe_payment_intent_id VARCHAR(255) UNIQUE NOT NULL,
  stripe_charge_id VARCHAR(255),

  -- Payment details
  amount BIGINT NOT NULL,
  currency VARCHAR(3) DEFAULT 'jpy',
  payment_method_type VARCHAR(50), -- card, bank_transfer, etc.

  -- Status
  status VARCHAR(20) NOT NULL, -- succeeded, failed, pending, refunded

  -- Card info (last 4 digits)
  card_last4 VARCHAR(4),
  card_brand VARCHAR(20),

  -- Failure details
  failure_code VARCHAR(50),
  failure_message TEXT,

  -- Refund
  refunded BOOLEAN DEFAULT FALSE,
  refund_amount BIGINT DEFAULT 0,

  -- Timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Metadata
  metadata JSONB
);

CREATE INDEX idx_payments_invoice ON billing.payments(invoice_id);
CREATE INDEX idx_payments_tenant ON billing.payments(tenant_id);
CREATE INDEX idx_payments_status ON billing.payments(status);

-- Usage Records Table (for metered billing)
CREATE TABLE billing.usage_records (
  usage_record_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id),
  subscription_id UUID NOT NULL REFERENCES billing.subscriptions(subscription_id),

  -- Stripe
  stripe_usage_record_id VARCHAR(255),

  -- Usage details
  metric_type VARCHAR(50) NOT NULL, -- agent_executions, issues_processed, api_calls, storage_gb
  quantity INTEGER NOT NULL,

  -- Timestamps
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reporting_period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  reporting_period_end TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Metadata
  metadata JSONB,

  -- Prevent duplicate reporting
  UNIQUE (tenant_id, metric_type, reporting_period_start, reporting_period_end)
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE billing.usage_records_2025_12 PARTITION OF billing.usage_records
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE INDEX idx_usage_records_tenant ON billing.usage_records(tenant_id);
CREATE INDEX idx_usage_records_subscription ON billing.usage_records(subscription_id);
CREATE INDEX idx_usage_records_metric ON billing.usage_records(metric_type);
CREATE INDEX idx_usage_records_period ON billing.usage_records(reporting_period_start, reporting_period_end);

-- Billing Events Table (Webhook event log)
CREATE TABLE billing.billing_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stripe
  stripe_event_id VARCHAR(255) UNIQUE NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- Associated resources
  tenant_id UUID REFERENCES platform.tenants(tenant_id),
  subscription_id UUID REFERENCES billing.subscriptions(subscription_id),
  invoice_id UUID REFERENCES billing.invoices(invoice_id),

  -- Event payload
  event_data JSONB NOT NULL,

  -- Processing status
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE billing.billing_events_2025_12 PARTITION OF billing.billing_events
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

CREATE INDEX idx_billing_events_stripe_event ON billing.billing_events(stripe_event_id);
CREATE INDEX idx_billing_events_type ON billing.billing_events(event_type);
CREATE INDEX idx_billing_events_tenant ON billing.billing_events(tenant_id);
CREATE INDEX idx_billing_events_processed ON billing.billing_events(processed);

-- Credits and Refunds Table
CREATE TABLE billing.credits (
  credit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id),
  invoice_id UUID REFERENCES billing.invoices(invoice_id),

  -- Credit details
  amount BIGINT NOT NULL, -- in cents
  currency VARCHAR(3) DEFAULT 'jpy',
  reason VARCHAR(100) NOT NULL, -- sla_breach, service_issue, goodwill, refund

  -- SLA breach details (if applicable)
  sla_breach_type VARCHAR(50), -- downtime, performance, support_response
  breach_start TIMESTAMP WITH TIME ZONE,
  breach_end TIMESTAMP WITH TIME ZONE,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, approved, applied, rejected

  -- Approval
  approved_by UUID REFERENCES platform.users(user_id),
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Application
  applied_to_invoice_id UUID REFERENCES billing.invoices(invoice_id),
  applied_at TIMESTAMP WITH TIME ZONE,

  -- Notes
  description TEXT,
  internal_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_credits_tenant ON billing.credits(tenant_id);
CREATE INDEX idx_credits_status ON billing.credits(status);
CREATE INDEX idx_credits_reason ON billing.credits(reason);
```

---

## 3. サブスクリプション管理フロー

### 3.1 新規サブスクリプション作成フロー

```typescript
// Service: BillingService.ts
import Stripe from 'stripe';

class BillingService {
  private stripe: Stripe;

  constructor() {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  /**
   * 新規サブスクリプション作成
   */
  async createSubscription(params: {
    tenantId: string;
    email: string;
    planTier: 'starter' | 'growth' | 'enterprise' | 'strategic';
    billingPeriod: 'monthly' | 'annual';
    paymentMethodId: string;
    trialDays?: number;
  }): Promise<SubscriptionResult> {
    const { tenantId, email, planTier, billingPeriod, paymentMethodId, trialDays } = params;

    // 1. Get or create Stripe customer
    let customer = await this.getOrCreateCustomer(tenantId, email);

    // 2. Attach payment method
    await this.stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.id,
    });

    // 3. Set as default payment method
    await this.stripe.customers.update(customer.id, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    });

    // 4. Get price ID based on plan and billing period
    const priceId = this.getPriceId(planTier, billingPeriod);

    // 5. Create subscription
    const subscription = await this.stripe.subscriptions.create({
      customer: customer.id,
      items: [
        {
          price: priceId,
        },
      ],
      trial_period_days: trialDays,
      payment_behavior: 'default_incomplete',
      payment_settings: {
        save_default_payment_method: 'on_subscription',
      },
      expand: ['latest_invoice.payment_intent'],
      metadata: {
        tenant_id: tenantId,
        plan_tier: planTier,
        billing_period: billingPeriod,
      },
    });

    // 6. Save to database
    await this.saveSubscriptionToDB(subscription, tenantId);

    return {
      subscriptionId: subscription.id,
      status: subscription.status,
      clientSecret: (subscription.latest_invoice as any)?.payment_intent?.client_secret,
    };
  }

  /**
   * Stripe Customerの取得または作成
   */
  private async getOrCreateCustomer(tenantId: string, email: string): Promise<Stripe.Customer> {
    // Check if customer exists in DB
    const existingCustomer = await db.query(
      `SELECT stripe_customer_id FROM billing.subscriptions WHERE tenant_id = $1 LIMIT 1`,
      [tenantId]
    );

    if (existingCustomer.rows.length > 0) {
      return await this.stripe.customers.retrieve(existingCustomer.rows[0].stripe_customer_id) as Stripe.Customer;
    }

    // Create new customer
    const tenant = await db.query(
      `SELECT display_name FROM platform.tenants WHERE tenant_id = $1`,
      [tenantId]
    );

    return await this.stripe.customers.create({
      email,
      name: tenant.rows[0].display_name,
      metadata: {
        tenant_id: tenantId,
      },
    });
  }

  /**
   * プランとサイクルに基づくPrice IDの取得
   */
  private getPriceId(planTier: string, billingPeriod: string): string {
    const priceMap = {
      starter_monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY!,
      starter_annual: process.env.STRIPE_PRICE_STARTER_ANNUAL!,
      growth_monthly: process.env.STRIPE_PRICE_GROWTH_MONTHLY!,
      growth_annual: process.env.STRIPE_PRICE_GROWTH_ANNUAL!,
      enterprise_monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY!,
      enterprise_annual: process.env.STRIPE_PRICE_ENTERPRISE_ANNUAL!,
      strategic_monthly: process.env.STRIPE_PRICE_STRATEGIC_MONTHLY!,
      strategic_annual: process.env.STRIPE_PRICE_STRATEGIC_ANNUAL!,
    };

    const key = `${planTier}_${billingPeriod}` as keyof typeof priceMap;
    return priceMap[key];
  }

  /**
   * DBへのサブスクリプション保存
   */
  private async saveSubscriptionToDB(subscription: Stripe.Subscription, tenantId: string): Promise<void> {
    await db.query(
      `
      INSERT INTO billing.subscriptions (
        tenant_id,
        stripe_customer_id,
        stripe_subscription_id,
        stripe_price_id,
        plan_tier,
        billing_period,
        status,
        current_period_start,
        current_period_end,
        trial_start,
        trial_end,
        unit_amount,
        metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (stripe_subscription_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        current_period_start = EXCLUDED.current_period_start,
        current_period_end = EXCLUDED.current_period_end,
        updated_at = NOW()
      `,
      [
        tenantId,
        subscription.customer as string,
        subscription.id,
        subscription.items.data[0].price.id,
        subscription.metadata.plan_tier,
        subscription.metadata.billing_period,
        subscription.status,
        new Date(subscription.current_period_start * 1000),
        new Date(subscription.current_period_end * 1000),
        subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
        subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
        subscription.items.data[0].price.unit_amount,
        JSON.stringify(subscription.metadata),
      ]
    );
  }
}
```

### 3.2 プラン変更フロー（アップグレード/ダウングレード）

```typescript
/**
 * サブスクリプションプラン変更
 */
async updateSubscriptionPlan(params: {
  tenantId: string;
  newPlanTier: string;
  newBillingPeriod: string;
  proration: 'always' | 'create_prorations' | 'none';
}): Promise<void> {
  const { tenantId, newPlanTier, newBillingPeriod, proration } = params;

  // 1. Get current subscription
  const currentSub = await db.query(
    `SELECT stripe_subscription_id, plan_tier FROM billing.subscriptions
     WHERE tenant_id = $1 AND status = 'active'`,
    [tenantId]
  );

  if (currentSub.rows.length === 0) {
    throw new Error('No active subscription found');
  }

  const stripeSubscriptionId = currentSub.rows[0].stripe_subscription_id;
  const currentPlanTier = currentSub.rows[0].plan_tier;

  // 2. Get new price ID
  const newPriceId = this.getPriceId(newPlanTier, newBillingPeriod);

  // 3. Retrieve current subscription from Stripe
  const subscription = await this.stripe.subscriptions.retrieve(stripeSubscriptionId);

  // 4. Update subscription
  const updatedSubscription = await this.stripe.subscriptions.update(stripeSubscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: proration,
    metadata: {
      ...subscription.metadata,
      plan_tier: newPlanTier,
      billing_period: newBillingPeriod,
      previous_plan_tier: currentPlanTier,
      upgraded_at: new Date().toISOString(),
    },
  });

  // 5. Update database
  await db.query(
    `UPDATE billing.subscriptions
     SET plan_tier = $1,
         billing_period = $2,
         stripe_price_id = $3,
         unit_amount = $4,
         updated_at = NOW()
     WHERE stripe_subscription_id = $5`,
    [newPlanTier, newBillingPeriod, newPriceId, updatedSubscription.items.data[0].price.unit_amount, stripeSubscriptionId]
  );

  // 6. Log event
  await this.logBillingEvent({
    type: 'subscription.plan_changed',
    tenantId,
    metadata: {
      from: currentPlanTier,
      to: newPlanTier,
      proration,
    },
  });
}
```

#### 3.2.1 Proration（日割り計算）ポリシー

| シナリオ | Prorationポリシー | 動作 |
|---------|-----------------|------|
| **アップグレード（即時）** | `create_prorations` | 残期間分をクレジット、新プラン差額を即時請求 |
| **ダウングレード（期末適用）** | `none` | 次回更新時に新プランへ変更、クレジットなし |
| **年間→月間への変更** | `create_prorations` | 未使用分をクレジット、月間プランで再開 |
| **トライアル期間中の変更** | `none` | トライアル終了時に新プランで請求開始 |

---

## 4. 使用量計測設計（Usage Metering）

### 4.1 リアルタイム計測アーキテクチャ

```
┌───────────────────────────────────────────────────────────┐
│             Agent Execution (K8s Pod)                     │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          │ 1. Emit Usage Event
                          ▼
┌───────────────────────────────────────────────────────────┐
│              Redis Stream (Usage Events)                  │
│  Key: usage_events:{tenant_id}                            │
│  Entry: { metric: "agent_execution",                      │
│           agent_type: "codegen",                           │
│           timestamp: 1234567890,                           │
│           execution_id: "xxx" }                            │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          │ 2. Consume Events
                          ▼
┌───────────────────────────────────────────────────────────┐
│         Usage Aggregator Service (Worker)                 │
│  - Aggregate events every 1 hour                          │
│  - Group by tenant_id, metric_type                        │
│  - Calculate totals                                       │
└─────────────────────────┬─────────────────────────────────┘
                          │
                          │ 3. Store & Report to Stripe
                          ▼
┌───────────────────────────────────────────────────────────┐
│         PostgreSQL (billing.usage_records)                │
│  + Stripe API (Create Usage Record)                       │
└───────────────────────────────────────────────────────────┘
```

### 4.2 使用量イベント記録

```typescript
// Service: UsageMeteringService.ts
class UsageMeteringService {
  private redis: Redis;
  private stripe: Stripe;

  /**
   * 使用量イベントの記録
   */
  async recordUsage(params: {
    tenantId: string;
    metricType: 'agent_execution' | 'issue_processed' | 'api_call' | 'storage_gb';
    quantity: number;
    metadata?: Record<string, any>;
  }): Promise<void> {
    const { tenantId, metricType, quantity, metadata } = params;

    // 1. Emit to Redis Stream
    await this.redis.xadd(
      `usage_events:${tenantId}`,
      '*',
      'metric_type', metricType,
      'quantity', quantity.toString(),
      'timestamp', Date.now().toString(),
      'metadata', JSON.stringify(metadata || {})
    );

    // 2. Update in-memory counter (for rate limiting)
    await this.redis.hincrby(
      `usage_counter:${tenantId}:${this.getCurrentPeriod()}`,
      metricType,
      quantity
    );

    // 3. Set TTL (expire after 32 days)
    await this.redis.expire(`usage_counter:${tenantId}:${this.getCurrentPeriod()}`, 86400 * 32);
  }

  /**
   * 定期的な集計とStripe報告（Cron Job: 毎時実行）
   */
  async aggregateAndReportUsage(): Promise<void> {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    // 1. Get all tenants with active subscriptions
    const tenants = await db.query(`
      SELECT tenant_id, stripe_subscription_id
      FROM billing.subscriptions
      WHERE status = 'active'
        AND plan_tier IN ('enterprise', 'strategic')
    `);

    for (const tenant of tenants.rows) {
      const { tenant_id, stripe_subscription_id } = tenant;

      // 2. Read events from Redis Stream
      const events = await this.redis.xrange(
        `usage_events:${tenant_id}`,
        periodStart.getTime().toString(),
        periodEnd.getTime().toString()
      );

      if (events.length === 0) continue;

      // 3. Aggregate by metric type
      const aggregated = this.aggregateEvents(events);

      // 4. Report each metric to Stripe
      for (const [metricType, quantity] of Object.entries(aggregated)) {
        // Get subscription item ID for this metric
        const subscription = await this.stripe.subscriptions.retrieve(stripe_subscription_id);
        const usageItem = subscription.items.data.find(
          item => item.price.metadata.metric_type === metricType
        );

        if (!usageItem) continue;

        // Create usage record in Stripe
        await this.stripe.subscriptionItems.createUsageRecord(usageItem.id, {
          quantity,
          timestamp: Math.floor(periodEnd.getTime() / 1000),
          action: 'increment',
        });

        // 5. Save to database
        await db.query(
          `INSERT INTO billing.usage_records
           (tenant_id, subscription_id, metric_type, quantity, reporting_period_start, reporting_period_end)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (tenant_id, metric_type, reporting_period_start, reporting_period_end)
           DO UPDATE SET quantity = billing.usage_records.quantity + EXCLUDED.quantity`,
          [tenant_id, stripe_subscription_id, metricType, quantity, periodStart, periodEnd]
        );
      }

      // 6. Trim old events from Redis Stream (keep last 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      await this.redis.xtrim(`usage_events:${tenant_id}`, 'MINID', sevenDaysAgo.toString());
    }
  }

  private aggregateEvents(events: any[]): Record<string, number> {
    const aggregated: Record<string, number> = {};

    for (const [id, fields] of events) {
      const metricType = fields[fields.indexOf('metric_type') + 1];
      const quantity = parseInt(fields[fields.indexOf('quantity') + 1]);

      aggregated[metricType] = (aggregated[metricType] || 0) + quantity;
    }

    return aggregated;
  }

  private getCurrentPeriod(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }
}
```

### 4.3 使用量表示ダッシュボード

```typescript
/**
 * テナントの現在の使用量を取得
 */
async getCurrentUsage(tenantId: string): Promise<UsageReport> {
  const subscription = await db.query(
    `SELECT subscription_id, current_period_start, current_period_end, plan_tier
     FROM billing.subscriptions
     WHERE tenant_id = $1 AND status = 'active'`,
    [tenantId]
  );

  if (subscription.rows.length === 0) {
    throw new Error('No active subscription');
  }

  const { current_period_start, current_period_end, plan_tier } = subscription.rows[0];

  // Get aggregated usage for current period
  const usage = await db.query(
    `SELECT metric_type, SUM(quantity) as total
     FROM billing.usage_records
     WHERE tenant_id = $1
       AND reporting_period_start >= $2
       AND reporting_period_end <= $3
     GROUP BY metric_type`,
    [tenantId, current_period_start, current_period_end]
  );

  // Get plan limits
  const limits = this.getPlanLimits(plan_tier);

  return {
    periodStart: current_period_start,
    periodEnd: current_period_end,
    metrics: usage.rows.map(row => ({
      type: row.metric_type,
      used: parseInt(row.total),
      limit: limits[row.metric_type],
      percentage: limits[row.metric_type] === 'unlimited'
        ? null
        : (parseInt(row.total) / limits[row.metric_type]) * 100,
    })),
  };
}

private getPlanLimits(planTier: string): Record<string, number | 'unlimited'> {
  const limits = {
    starter: {
      agent_execution: 100, // 5 issues * ~20 avg executions
      issue_processed: 5,
      api_call: 10000,
      storage_gb: 5,
    },
    growth: {
      agent_execution: 1000,
      issue_processed: 50,
      api_call: 100000,
      storage_gb: 50,
    },
    enterprise: {
      agent_execution: 'unlimited',
      issue_processed: 'unlimited',
      api_call: 'unlimited',
      storage_gb: 'unlimited',
    },
    strategic: {
      agent_execution: 'unlimited',
      issue_processed: 'unlimited',
      api_call: 'unlimited',
      storage_gb: 'unlimited',
    },
  };

  return limits[planTier as keyof typeof limits];
}
```

---

## 5. 請求書自動生成フロー

### 5.1 Webhook処理（invoice.finalized）

```typescript
// WebhookHandler.ts
class WebhookHandler {
  async handleInvoiceFinalized(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    // 1. Extract tenant info
    const subscription = await this.stripe.subscriptions.retrieve(invoice.subscription as string);
    const tenantId = subscription.metadata.tenant_id;

    // 2. Save invoice to database
    await db.query(
      `INSERT INTO billing.invoices (
        tenant_id,
        subscription_id,
        stripe_invoice_id,
        invoice_number,
        amount_due,
        amount_paid,
        amount_remaining,
        line_items,
        status,
        period_start,
        period_end,
        due_date,
        invoice_pdf_url,
        hosted_invoice_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (stripe_invoice_id)
      DO UPDATE SET
        status = EXCLUDED.status,
        amount_paid = EXCLUDED.amount_paid,
        amount_remaining = EXCLUDED.amount_remaining,
        invoice_pdf_url = EXCLUDED.invoice_pdf_url,
        updated_at = NOW()`,
      [
        tenantId,
        subscription.id,
        invoice.id,
        invoice.number,
        invoice.amount_due,
        invoice.amount_paid,
        invoice.amount_remaining,
        JSON.stringify(invoice.lines.data),
        invoice.status,
        new Date(invoice.period_start * 1000),
        new Date(invoice.period_end * 1000),
        invoice.due_date ? new Date(invoice.due_date * 1000) : null,
        invoice.invoice_pdf,
        invoice.hosted_invoice_url,
      ]
    );

    // 3. Send email notification to tenant
    await this.sendInvoiceEmail(tenantId, invoice);
  }

  async handlePaymentSucceeded(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;
    const paymentIntent = invoice.payment_intent as string;

    // Update invoice status
    await db.query(
      `UPDATE billing.invoices
       SET status = 'paid',
           amount_paid = $1,
           amount_remaining = 0,
           paid_at = NOW()
       WHERE stripe_invoice_id = $2`,
      [invoice.amount_paid, invoice.id]
    );

    // Record payment
    await db.query(
      `INSERT INTO billing.payments (
        invoice_id,
        tenant_id,
        stripe_payment_intent_id,
        amount,
        status,
        paid_at
      )
      SELECT
        invoice_id,
        tenant_id,
        $1,
        $2,
        'succeeded',
        NOW()
      FROM billing.invoices
      WHERE stripe_invoice_id = $3`,
      [paymentIntent, invoice.amount_paid, invoice.id]
    );

    // Send payment confirmation email
    const tenantId = await this.getTenantIdFromInvoice(invoice.id);
    await this.sendPaymentConfirmationEmail(tenantId, invoice);
  }

  async handlePaymentFailed(event: Stripe.Event): Promise<void> {
    const invoice = event.data.object as Stripe.Invoice;

    // Update invoice status
    await db.query(
      `UPDATE billing.invoices
       SET status = 'open'
       WHERE stripe_invoice_id = $1`,
      [invoice.id]
    );

    // Update subscription status
    await db.query(
      `UPDATE billing.subscriptions
       SET status = 'past_due'
       WHERE stripe_subscription_id = $1`,
      [invoice.subscription]
    );

    // Send payment failure email
    const tenantId = await this.getTenantIdFromInvoice(invoice.id);
    await this.sendPaymentFailedEmail(tenantId, invoice);
  }

  private async sendInvoiceEmail(tenantId: string, invoice: Stripe.Invoice): Promise<void> {
    const tenant = await db.query(
      `SELECT t.display_name, u.email
       FROM platform.tenants t
       JOIN platform.tenant_memberships tm ON t.tenant_id = tm.tenant_id
       JOIN platform.users u ON tm.user_id = u.user_id
       WHERE t.tenant_id = $1 AND tm.role IN ('owner', 'admin')`,
      [tenantId]
    );

    for (const row of tenant.rows) {
      await emailService.send({
        to: row.email,
        subject: `[Miyabi] 請求書発行のお知らせ - ${invoice.number}`,
        template: 'invoice_finalized',
        data: {
          tenantName: row.display_name,
          invoiceNumber: invoice.number,
          amountDue: this.formatCurrency(invoice.amount_due),
          dueDate: new Date(invoice.due_date! * 1000).toLocaleDateString('ja-JP'),
          invoiceUrl: invoice.hosted_invoice_url,
          pdfUrl: invoice.invoice_pdf,
        },
      });
    }
  }

  private formatCurrency(amountInCents: number): string {
    return new Intl.NumberFormat('ja-JP', {
      style: 'currency',
      currency: 'JPY',
    }).format(amountInCents / 100);
  }
}
```

### 5.2 請求書カスタマイズ

Stripe Dashboardで以下をカスタマイズ：

```yaml
# Stripe Invoice Settings
company_info:
  name: "株式会社カクシン"
  address: "東京都〇〇区〇〇 1-2-3"
  tax_id: "T1234567890123" # 適格請求書発行事業者番号（インボイス制度）

invoice_branding:
  logo: "https://miyabi.kakushin.biz/logo.png"
  primary_color: "#5469D4"

invoice_footer:
  text: |
    お支払いは請求書発行日より30日以内にお願いいたします。
    ご不明点がございましたら、billing@kakushin.biz までお問い合わせください。

email_settings:
  from_name: "Miyabi Billing"
  from_email: "billing@miyabi.kakushin.biz"
  reply_to: "support@kakushin.biz"
```

---

## 6. アップグレード/ダウングレードフロー

### 6.1 セルフサービスポータル

Stripe Customer Portalを統合し、顧客が自分でプラン変更できるようにします。

```typescript
/**
 * Customer Portal Session作成
 */
async createCustomerPortalSession(tenantId: string): Promise<string> {
  // Get Stripe customer ID
  const subscription = await db.query(
    `SELECT stripe_customer_id FROM billing.subscriptions
     WHERE tenant_id = $1 AND status = 'active'`,
    [tenantId]
  );

  if (subscription.rows.length === 0) {
    throw new Error('No active subscription');
  }

  const customerId = subscription.rows[0].stripe_customer_id;

  // Create portal session
  const session = await this.stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `https://miyabi.kakushin.biz/dashboard/billing`,
  });

  return session.url;
}
```

#### 6.1.1 Customer Portal設定

Stripe Dashboardで以下の機能を有効化：

- プラン変更（アップグレード/ダウングレード）
- 支払い方法の更新
- 請求履歴の表示・ダウンロード
- サブスクリプションのキャンセル（保留期間設定）

### 6.2 管理者主導のプラン変更

```typescript
/**
 * 管理者がテナントのプランを変更（カスタマーサクセス向け）
 */
async adminUpdateSubscription(params: {
  tenantId: string;
  newPlanTier: string;
  newBillingPeriod: string;
  applyImmediately: boolean;
  addDiscount?: {
    percentOff?: number;
    amountOff?: number;
    duration: 'once' | 'repeating' | 'forever';
    durationInMonths?: number;
  };
  adminUserId: string;
  reason: string;
}): Promise<void> {
  const { tenantId, newPlanTier, newBillingPeriod, applyImmediately, addDiscount, adminUserId, reason } = params;

  // 1. Get current subscription
  const currentSub = await db.query(
    `SELECT stripe_subscription_id FROM billing.subscriptions
     WHERE tenant_id = $1 AND status = 'active'`,
    [tenantId]
  );

  if (currentSub.rows.length === 0) {
    throw new Error('No active subscription');
  }

  const stripeSubscriptionId = currentSub.rows[0].stripe_subscription_id;

  // 2. Apply discount if specified
  if (addDiscount) {
    const coupon = await this.stripe.coupons.create({
      percent_off: addDiscount.percentOff,
      amount_off: addDiscount.amountOff,
      currency: 'jpy',
      duration: addDiscount.duration,
      duration_in_months: addDiscount.durationInMonths,
      metadata: {
        admin_user_id: adminUserId,
        reason,
      },
    });

    await this.stripe.subscriptions.update(stripeSubscriptionId, {
      coupon: coupon.id,
    });
  }

  // 3. Update subscription plan
  const proration = applyImmediately ? 'create_prorations' : 'none';
  await this.updateSubscriptionPlan({
    tenantId,
    newPlanTier,
    newBillingPeriod,
    proration,
  });

  // 4. Log admin action
  await db.query(
    `INSERT INTO audit.access_logs (
      tenant_id, user_id, action, resource_type, metadata
    ) VALUES ($1, $2, 'admin_subscription_update', 'subscription', $3)`,
    [
      tenantId,
      adminUserId,
      JSON.stringify({
        new_plan_tier: newPlanTier,
        new_billing_period: newBillingPeriod,
        discount: addDiscount,
        reason,
      }),
    ]
  );
}
```

---

## 7. 課金ダッシュボード設計

### 7.1 顧客向けダッシュボード

```typescript
// API Endpoint: GET /api/billing/dashboard
interface BillingDashboard {
  subscription: {
    planTier: string;
    billingPeriod: string;
    status: string;
    currentPeriodStart: string;
    currentPeriodEnd: string;
    nextBillingDate: string;
    amount: number;
  };

  usage: {
    metricType: string;
    used: number;
    limit: number | 'unlimited';
    percentage: number | null;
    overageCharges: number;
  }[];

  upcomingInvoice: {
    amountDue: number;
    dueDate: string;
    lineItems: {
      description: string;
      amount: number;
    }[];
  } | null;

  invoiceHistory: {
    invoiceNumber: string;
    date: string;
    amount: number;
    status: string;
    pdfUrl: string;
  }[];

  paymentMethods: {
    type: string;
    last4: string;
    expiryMonth: number;
    expiryYear: number;
    isDefault: boolean;
  }[];
}

async getBillingDashboard(tenantId: string): Promise<BillingDashboard> {
  // 1. Get subscription
  const subscription = await this.getActiveSubscription(tenantId);

  // 2. Get current usage
  const usage = await this.getCurrentUsage(tenantId);

  // 3. Get upcoming invoice from Stripe
  const upcomingInvoice = await this.stripe.invoices.retrieveUpcoming({
    customer: subscription.stripe_customer_id,
  });

  // 4. Get invoice history
  const invoices = await db.query(
    `SELECT invoice_number, period_end, amount_due, status, invoice_pdf_url
     FROM billing.invoices
     WHERE tenant_id = $1
     ORDER BY period_end DESC
     LIMIT 12`,
    [tenantId]
  );

  // 5. Get payment methods
  const customer = await this.stripe.customers.retrieve(subscription.stripe_customer_id, {
    expand: ['invoice_settings.default_payment_method'],
  });

  const paymentMethods = await this.stripe.paymentMethods.list({
    customer: subscription.stripe_customer_id,
    type: 'card',
  });

  return {
    subscription: {
      planTier: subscription.plan_tier,
      billingPeriod: subscription.billing_period,
      status: subscription.status,
      currentPeriodStart: subscription.current_period_start.toISOString(),
      currentPeriodEnd: subscription.current_period_end.toISOString(),
      nextBillingDate: subscription.current_period_end.toISOString(),
      amount: subscription.unit_amount / 100,
    },
    usage: usage.metrics,
    upcomingInvoice: upcomingInvoice ? {
      amountDue: upcomingInvoice.amount_due / 100,
      dueDate: new Date(upcomingInvoice.due_date! * 1000).toISOString(),
      lineItems: upcomingInvoice.lines.data.map(line => ({
        description: line.description || '',
        amount: line.amount / 100,
      })),
    } : null,
    invoiceHistory: invoices.rows.map(inv => ({
      invoiceNumber: inv.invoice_number,
      date: inv.period_end.toISOString(),
      amount: inv.amount_due / 100,
      status: inv.status,
      pdfUrl: inv.invoice_pdf_url,
    })),
    paymentMethods: paymentMethods.data.map(pm => ({
      type: pm.type,
      last4: pm.card!.last4,
      expiryMonth: pm.card!.exp_month,
      expiryYear: pm.card!.exp_year,
      isDefault: (customer as any).invoice_settings.default_payment_method === pm.id,
    })),
  };
}
```

### 7.2 管理者向けダッシュボード

```typescript
// Admin Dashboard: Revenue Analytics
interface RevenueDashboard {
  mrr: number; // Monthly Recurring Revenue
  arr: number; // Annual Recurring Revenue
  churn: {
    rate: number;
    count: number;
  };

  planDistribution: {
    planTier: string;
    count: number;
    revenue: number;
  }[];

  revenueByMonth: {
    month: string;
    revenue: number;
    newMRR: number;
    churnedMRR: number;
    expansionMRR: number;
  }[];

  upcomingRenewals: {
    tenantId: string;
    tenantName: string;
    renewalDate: string;
    amount: number;
  }[];
}

async getRevenueDashboard(): Promise<RevenueDashboard> {
  // 1. Calculate MRR
  const mrr = await db.query(`
    SELECT SUM(
      CASE
        WHEN billing_period = 'monthly' THEN unit_amount / 100
        WHEN billing_period = 'annual' THEN unit_amount / 100 / 12
      END
    ) as mrr
    FROM billing.subscriptions
    WHERE status = 'active'
  `);

  // 2. Calculate ARR
  const arr = mrr.rows[0].mrr * 12;

  // 3. Calculate churn (last 30 days)
  const churn = await db.query(`
    SELECT COUNT(*) as churned_count,
           AVG(unit_amount / 100) as avg_churn_amount
    FROM billing.subscriptions
    WHERE status = 'canceled'
      AND canceled_at >= NOW() - INTERVAL '30 days'
  `);

  // 4. Plan distribution
  const planDist = await db.query(`
    SELECT plan_tier,
           COUNT(*) as count,
           SUM(unit_amount / 100) as revenue
    FROM billing.subscriptions
    WHERE status = 'active'
    GROUP BY plan_tier
  `);

  // 5. Revenue by month (last 12 months)
  const revenueByMonth = await db.query(`
    SELECT
      TO_CHAR(period_start, 'YYYY-MM') as month,
      SUM(amount_due / 100) as revenue
    FROM billing.invoices
    WHERE period_start >= NOW() - INTERVAL '12 months'
      AND status = 'paid'
    GROUP BY month
    ORDER BY month
  `);

  // 6. Upcoming renewals (next 30 days)
  const renewals = await db.query(`
    SELECT
      s.tenant_id,
      t.display_name,
      s.current_period_end as renewal_date,
      s.unit_amount / 100 as amount
    FROM billing.subscriptions s
    JOIN platform.tenants t ON s.tenant_id = t.tenant_id
    WHERE s.status = 'active'
      AND s.current_period_end >= NOW()
      AND s.current_period_end <= NOW() + INTERVAL '30 days'
    ORDER BY s.current_period_end
  `);

  return {
    mrr: mrr.rows[0].mrr,
    arr,
    churn: {
      rate: churn.rows[0].churned_count / (mrr.rows[0].mrr / 100), // approximate
      count: churn.rows[0].churned_count,
    },
    planDistribution: planDist.rows,
    revenueByMonth: revenueByMonth.rows,
    upcomingRenewals: renewals.rows,
  };
}
```

---

## 8. クレジット/返金処理

### 8.1 SLA違反時の自動クレジット

```typescript
/**
 * SLA違反時の自動クレジット計算
 */
async processSlaBreach(params: {
  tenantId: string;
  breachType: 'downtime' | 'performance' | 'support_response';
  breachStart: Date;
  breachEnd: Date;
  affectedServices: string[];
}): Promise<void> {
  const { tenantId, breachType, breachStart, breachEnd, affectedServices } = params;

  // 1. Get subscription and SLA terms
  const subscription = await db.query(
    `SELECT s.subscription_id, s.unit_amount, s.plan_tier
     FROM billing.subscriptions s
     WHERE s.tenant_id = $1 AND s.status = 'active'`,
    [tenantId]
  );

  if (subscription.rows.length === 0) return;

  const { subscription_id, unit_amount, plan_tier } = subscription.rows[0];

  // 2. Calculate credit based on SLA
  const slaTerms = this.getSlaCreditPolicy(plan_tier);
  const downtimeMinutes = (breachEnd.getTime() - breachStart.getTime()) / 1000 / 60;

  let creditPercentage = 0;
  for (const tier of slaTerms) {
    if (downtimeMinutes >= tier.minDowntime && downtimeMinutes < tier.maxDowntime) {
      creditPercentage = tier.creditPercentage;
      break;
    }
  }

  const creditAmount = Math.floor((unit_amount * creditPercentage) / 100);

  if (creditAmount === 0) return;

  // 3. Create credit record
  await db.query(
    `INSERT INTO billing.credits (
      tenant_id,
      amount,
      reason,
      sla_breach_type,
      breach_start,
      breach_end,
      description,
      status
    ) VALUES ($1, $2, 'sla_breach', $3, $4, $5, $6, 'approved')`,
    [
      tenantId,
      creditAmount,
      breachType,
      breachStart,
      breachEnd,
      `SLA違反によるクレジット: ${breachType}, ${downtimeMinutes.toFixed(0)}分間の停止`,
    ]
  );

  // 4. Apply credit to next invoice
  const stripeSubscription = await db.query(
    `SELECT stripe_subscription_id, stripe_customer_id
     FROM billing.subscriptions
     WHERE subscription_id = $1`,
    [subscription_id]
  );

  await this.stripe.customers.createBalanceTransaction(
    stripeSubscription.rows[0].stripe_customer_id,
    {
      amount: -creditAmount, // negative = credit
      currency: 'jpy',
      description: `SLA Credit: ${breachType}`,
    }
  );

  // 5. Notify tenant
  await this.sendCreditNotificationEmail(tenantId, creditAmount, breachType);
}

/**
 * SLAクレジットポリシー定義
 */
private getSlaCreditPolicy(planTier: string) {
  const policies = {
    enterprise: [
      { minDowntime: 0, maxDowntime: 10, creditPercentage: 0 },      // < 10min: no credit
      { minDowntime: 10, maxDowntime: 60, creditPercentage: 10 },    // 10-60min: 10%
      { minDowntime: 60, maxDowntime: 360, creditPercentage: 25 },   // 1-6h: 25%
      { minDowntime: 360, maxDowntime: Infinity, creditPercentage: 50 }, // > 6h: 50%
    ],
    strategic: [
      { minDowntime: 0, maxDowntime: 5, creditPercentage: 0 },
      { minDowntime: 5, maxDowntime: 30, creditPercentage: 15 },
      { minDowntime: 30, maxDowntime: 180, creditPercentage: 35 },
      { minDowntime: 180, maxDowntime: Infinity, creditPercentage: 75 },
    ],
  };

  return policies[planTier as keyof typeof policies] || policies.enterprise;
}
```

### 8.2 返金処理

```typescript
/**
 * 手動返金処理（カスタマーサクセス用）
 */
async processRefund(params: {
  tenantId: string;
  invoiceId: string;
  amount: number;
  reason: string;
  adminUserId: string;
}): Promise<void> {
  const { tenantId, invoiceId, amount, reason, adminUserId } = params;

  // 1. Get invoice and payment
  const invoice = await db.query(
    `SELECT i.stripe_invoice_id, p.stripe_payment_intent_id, p.payment_id
     FROM billing.invoices i
     JOIN billing.payments p ON i.invoice_id = p.invoice_id
     WHERE i.invoice_id = $1 AND i.tenant_id = $2 AND p.status = 'succeeded'`,
    [invoiceId, tenantId]
  );

  if (invoice.rows.length === 0) {
    throw new Error('No paid invoice found');
  }

  const { stripe_payment_intent_id, payment_id } = invoice.rows[0];

  // 2. Create refund in Stripe
  const refund = await this.stripe.refunds.create({
    payment_intent: stripe_payment_intent_id,
    amount: amount * 100, // convert to cents
    reason: 'requested_by_customer',
    metadata: {
      admin_user_id: adminUserId,
      refund_reason: reason,
    },
  });

  // 3. Update payment record
  await db.query(
    `UPDATE billing.payments
     SET refunded = TRUE,
         refund_amount = $1,
         metadata = jsonb_set(
           COALESCE(metadata, '{}'),
           '{refund}',
           $2::jsonb
         )
     WHERE payment_id = $3`,
    [
      amount * 100,
      JSON.stringify({
        refund_id: refund.id,
        refund_date: new Date().toISOString(),
        reason,
      }),
      payment_id,
    ]
  );

  // 4. Log audit event
  await db.query(
    `INSERT INTO audit.access_logs (
      tenant_id, user_id, action, resource_type, metadata
    ) VALUES ($1, $2, 'refund_processed', 'payment', $3)`,
    [
      tenantId,
      adminUserId,
      JSON.stringify({
        payment_id,
        refund_amount: amount,
        reason,
      }),
    ]
  );

  // 5. Send confirmation email
  await this.sendRefundConfirmationEmail(tenantId, amount, reason);
}
```

---

## 9. セキュリティとコンプライアンス

### 9.1 Webhook署名検証

```typescript
// Webhook endpoint: POST /api/webhooks/stripe
import { Request, Response } from 'express';
import Stripe from 'stripe';

export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;

  try {
    // 1. Verify webhook signature
    event = this.stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // 2. Store event for idempotency
  const existingEvent = await db.query(
    `SELECT event_id FROM billing.billing_events WHERE stripe_event_id = $1`,
    [event.id]
  );

  if (existingEvent.rows.length > 0) {
    console.log(`Event ${event.id} already processed`);
    res.json({ received: true });
    return;
  }

  // 3. Save event
  await db.query(
    `INSERT INTO billing.billing_events (
      stripe_event_id, event_type, event_data
    ) VALUES ($1, $2, $3)`,
    [event.id, event.type, JSON.stringify(event.data.object)]
  );

  // 4. Process event asynchronously
  setImmediate(async () => {
    try {
      await this.processWebhookEvent(event);

      // Mark as processed
      await db.query(
        `UPDATE billing.billing_events
         SET processed = TRUE, processed_at = NOW()
         WHERE stripe_event_id = $1`,
        [event.id]
      );
    } catch (err) {
      console.error(`Error processing event ${event.id}:`, err);

      // Mark error
      await db.query(
        `UPDATE billing.billing_events
         SET error_message = $1, retry_count = retry_count + 1
         WHERE stripe_event_id = $2`,
        [err.message, event.id]
      );
    }
  });

  // 5. Return 200 immediately
  res.json({ received: true });
}
```

### 9.2 PCI DSS準拠

Stripe Elements/Stripe Checkoutを使用することで、カード情報を直接扱わず、PCI DSS SAQ Aレベルで準拠可能：

```typescript
// Frontend: Stripe Elements統合
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    // Create payment method (card data never touches our server)
    const { error, paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement(CardElement)!,
    });

    if (error) {
      console.error(error);
      return;
    }

    // Send payment method ID to our backend
    const response = await fetch('/api/billing/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        paymentMethodId: paymentMethod.id,
        planTier: 'growth',
        billingPeriod: 'annual',
      }),
    });

    const result = await response.json();

    // Handle 3D Secure if required
    if (result.clientSecret) {
      const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret);
      if (confirmError) {
        console.error(confirmError);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button type="submit" disabled={!stripe}>Subscribe</button>
    </form>
  );
}
```

### 9.3 データ暗号化

```typescript
// 請求書データの暗号化（GDPR準拠）
import crypto from 'crypto';

class BillingEncryption {
  private algorithm = 'aes-256-gcm';

  /**
   * テナント固有の暗号化キーで請求書データを暗号化
   */
  async encryptInvoiceData(tenantId: string, data: any): Promise<Buffer> {
    // Get tenant-specific DEK from KMS
    const dek = await this.getTenantDEK(tenantId);

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, dek, iv);

    const encrypted = Buffer.concat([
      cipher.update(JSON.stringify(data), 'utf8'),
      cipher.final(),
    ]);

    const authTag = cipher.getAuthTag();

    // Return: IV (16) + AuthTag (16) + Encrypted Data
    return Buffer.concat([iv, authTag, encrypted]);
  }

  async decryptInvoiceData(tenantId: string, encryptedData: Buffer): Promise<any> {
    const dek = await this.getTenantDEK(tenantId);

    const iv = encryptedData.slice(0, 16);
    const authTag = encryptedData.slice(16, 32);
    const data = encryptedData.slice(32);

    const decipher = crypto.createDecipheriv(this.algorithm, dek, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(data),
      decipher.final(),
    ]);

    return JSON.parse(decrypted.toString('utf8'));
  }

  private async getTenantDEK(tenantId: string): Promise<Buffer> {
    // Retrieve from AWS KMS/GCP Secret Manager
    // Implementation depends on cloud provider
    return Buffer.from(process.env[`TENANT_${tenantId}_DEK`]!, 'base64');
  }
}
```

---

## 10. テスト戦略

### 10.1 ユニットテスト

```typescript
// tests/billing.service.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BillingService } from '../src/services/BillingService';

describe('BillingService', () => {
  let billingService: BillingService;
  let mockStripe: any;

  beforeEach(() => {
    mockStripe = {
      customers: {
        create: vi.fn(),
        retrieve: vi.fn(),
      },
      subscriptions: {
        create: vi.fn(),
        update: vi.fn(),
      },
    };

    billingService = new BillingService(mockStripe);
  });

  it('should create subscription with correct pricing', async () => {
    mockStripe.customers.create.mockResolvedValue({
      id: 'cus_test123',
    });

    mockStripe.subscriptions.create.mockResolvedValue({
      id: 'sub_test123',
      status: 'active',
      items: {
        data: [
          {
            price: {
              id: 'price_growth_annual',
              unit_amount: 240000000, // ¥2,400,000
            },
          },
        ],
      },
    });

    const result = await billingService.createSubscription({
      tenantId: 'tenant-123',
      email: 'test@example.com',
      planTier: 'growth',
      billingPeriod: 'annual',
      paymentMethodId: 'pm_test123',
    });

    expect(result.subscriptionId).toBe('sub_test123');
    expect(mockStripe.subscriptions.create).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          plan_tier: 'growth',
          billing_period: 'annual',
        }),
      })
    );
  });

  it('should calculate SLA credit correctly', () => {
    const creditPercentage = billingService.calculateSlaCredit({
      planTier: 'enterprise',
      downtimeMinutes: 120, // 2 hours
    });

    expect(creditPercentage).toBe(25); // 1-6h = 25%
  });
});
```

### 10.2 Webhookテスト

```typescript
// tests/webhook.handler.test.ts
import { describe, it, expect } from 'vitest';
import { WebhookHandler } from '../src/services/WebhookHandler';

describe('WebhookHandler', () => {
  it('should handle invoice.payment_succeeded event', async () => {
    const handler = new WebhookHandler();

    const mockEvent = {
      id: 'evt_test123',
      type: 'invoice.payment_succeeded',
      data: {
        object: {
          id: 'in_test123',
          subscription: 'sub_test123',
          amount_paid: 240000000,
          status: 'paid',
        },
      },
    };

    await handler.processWebhookEvent(mockEvent);

    // Verify invoice status updated
    const invoice = await db.query(
      `SELECT status, amount_paid FROM billing.invoices WHERE stripe_invoice_id = $1`,
      ['in_test123']
    );

    expect(invoice.rows[0].status).toBe('paid');
    expect(invoice.rows[0].amount_paid).toBe(240000000);
  });
});
```

---

## 11. 監視とアラート

### 11.1 課金関連メトリクス

```yaml
# Prometheus Metrics
metrics:
  - name: miyabi_billing_mrr
    type: gauge
    help: Monthly Recurring Revenue in JPY

  - name: miyabi_billing_arr
    type: gauge
    help: Annual Recurring Revenue in JPY

  - name: miyabi_billing_subscriptions_total
    type: gauge
    labels: [plan_tier, status]
    help: Total number of subscriptions

  - name: miyabi_billing_churn_rate
    type: gauge
    help: Monthly churn rate (percentage)

  - name: miyabi_billing_payment_failures_total
    type: counter
    help: Total number of failed payments

  - name: miyabi_billing_webhook_events_total
    type: counter
    labels: [event_type, status]
    help: Total webhook events processed

  - name: miyabi_billing_usage_records_total
    type: counter
    labels: [metric_type]
    help: Total usage records reported to Stripe
```

### 11.2 アラート設定

```yaml
# alerts/billing.rules.yml
groups:
  - name: billing
    interval: 60s
    rules:
      - alert: HighPaymentFailureRate
        expr: |
          rate(miyabi_billing_payment_failures_total[1h]) > 0.05
        for: 15m
        labels:
          severity: warning
        annotations:
          summary: "High payment failure rate detected"
          description: "Payment failure rate is {{ $value }} per second"

      - alert: WebhookProcessingBacklog
        expr: |
          billing_events_unprocessed > 100
        for: 10m
        labels:
          severity: critical
        annotations:
          summary: "Webhook processing backlog"
          description: "{{ $value }} unprocessed webhook events"

      - alert: ChurnRateIncreasing
        expr: |
          miyabi_billing_churn_rate > 0.10
        for: 24h
        labels:
          severity: warning
        annotations:
          summary: "Churn rate exceeds 10%"
          description: "Current churn rate: {{ $value }}%"
```

---

## 12. 実装ロードマップ

### Phase 1: MVP（3ヶ月）

- [ ] Stripe Basic統合（Customer, Subscription, Payment）
- [ ] 4層価格体系実装
- [ ] Webhook処理基盤（invoice.*, customer.subscription.*）
- [ ] PostgreSQL billing schema構築
- [ ] 基本的な使用量計測（Agent実行数、Issue数）
- [ ] 請求書自動生成・配信
- [ ] 顧客向け課金ダッシュボード

### Phase 2: Production-Ready（6ヶ月）

- [ ] 従量課金（Metered Billing）実装
- [ ] Customer Portal統合
- [ ] SLA違反時の自動クレジット処理
- [ ] 管理者向けRevenue Analytics
- [ ] Webhook再試行ロジック
- [ ] 暗号化・セキュリティ強化
- [ ] エンドツーエンドテスト

### Phase 3: エンタープライズ機能（12ヶ月）

- [ ] 複数通貨対応（USD, EUR）
- [ ] 請求書カスタマイズ（ロゴ、項目）
- [ ] 複雑な契約条件（年間コミットメント、ボリュームディスカウント）
- [ ] クレジット管理システム
- [ ] 高度な使用量分析（AI予測）
- [ ] 税務対応（インボイス制度、源泉徴収）

---

## 13. 参考資料

### 13.1 Stripe公式ドキュメント

- [Stripe Billing Documentation](https://stripe.com/docs/billing)
- [Stripe Subscriptions Guide](https://stripe.com/docs/billing/subscriptions/overview)
- [Metered Billing](https://stripe.com/docs/billing/subscriptions/usage-based)
- [Webhooks Best Practices](https://stripe.com/docs/webhooks/best-practices)

### 13.2 業界ベンチマーク

- [OpenView SaaS Benchmarks 2024](https://openviewpartners.com/saas-benchmarks/)
- [Stripe Sigma: Revenue Analytics Queries](https://stripe.com/docs/sigma/recipes/revenue-analytics)

---

## Appendix: API仕様

### A.1 Billing API Endpoints

```yaml
# OpenAPI 3.0 Specification
openapi: 3.0.0
info:
  title: Miyabi Billing API
  version: 1.0.0

paths:
  /api/billing/subscribe:
    post:
      summary: 新規サブスクリプション作成
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                planTier:
                  type: string
                  enum: [starter, growth, enterprise, strategic]
                billingPeriod:
                  type: string
                  enum: [monthly, annual]
                paymentMethodId:
                  type: string
                trialDays:
                  type: integer
      responses:
        '200':
          description: Subscription created
          content:
            application/json:
              schema:
                type: object
                properties:
                  subscriptionId:
                    type: string
                  clientSecret:
                    type: string

  /api/billing/subscription:
    get:
      summary: 現在のサブスクリプション取得
      responses:
        '200':
          description: Subscription details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Subscription'

    patch:
      summary: サブスクリプション変更
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                newPlanTier:
                  type: string
                newBillingPeriod:
                  type: string
                applyImmediately:
                  type: boolean

  /api/billing/usage:
    get:
      summary: 使用量取得
      responses:
        '200':
          description: Current usage
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UsageReport'

  /api/billing/invoices:
    get:
      summary: 請求書履歴取得
      parameters:
        - name: limit
          in: query
          schema:
            type: integer
            default: 12
      responses:
        '200':
          description: Invoice list
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Invoice'

components:
  schemas:
    Subscription:
      type: object
      properties:
        subscriptionId:
          type: string
        planTier:
          type: string
        billingPeriod:
          type: string
        status:
          type: string
        currentPeriodStart:
          type: string
          format: date-time
        currentPeriodEnd:
          type: string
          format: date-time

    UsageReport:
      type: object
      properties:
        periodStart:
          type: string
          format: date-time
        periodEnd:
          type: string
          format: date-time
        metrics:
          type: array
          items:
            type: object
            properties:
              type:
                type: string
              used:
                type: integer
              limit:
                oneOf:
                  - type: integer
                  - type: string
                    enum: [unlimited]

    Invoice:
      type: object
      properties:
        invoiceNumber:
          type: string
        date:
          type: string
          format: date-time
        amount:
          type: number
        status:
          type: string
        pdfUrl:
          type: string
```

---

## まとめ

本設計書は、Miyabi SaaSプラットフォームの課金基盤を包括的に定義しました。Stripe Billingを活用することで、エンタープライズグレードの課金管理を実現しつつ、開発・運用コストを最小限に抑えます。

### 主要な設計判断

1. **Stripe Billing採用**: 自社実装ではなくStripeを採用し、PCI DSS準拠を容易に
2. **Schema-per-Tenant**: 課金データもテナントごとに論理分離
3. **リアルタイム計測**: Redis Stream + PostgreSQLで高速・正確な使用量計測
4. **自動化重視**: Webhook処理、SLAクレジット、請求書生成を完全自動化
5. **セキュリティファースト**: 暗号化、署名検証、監査ログを標準実装

### 次のステップ

1. Phase 1実装開始（Issue #11〜#15の作成を推奨）
2. Stripe Test環境でのPoC実施
3. 法務・経理部門との連携（請求書フォーマット、税務対応）

---

**Document Owner**: TechLead
**Reviewers**: CFO, Legal, Security Team
**Last Updated**: 2025-11-30
**Status**: Draft → Review Required
