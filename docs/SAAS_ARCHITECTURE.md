# ADR: Miyabi SaaS Platform Architecture

**Status**: Proposed
**Date**: 2025-11-30
**Related Issue**: #3 (Parent: #2 カクシン進化)
**Repository**: NozomuTajiri/shinka

---

## Context

Miyabiフレームワークは、7つの自律型Agent（Coordinator, CodeGen, Review, Issue, PR, Deploy, Test）を持つAI駆動の開発フレームワークです。これをマルチテナント対応のSaaSプラットフォームとして展開するため、エンタープライズグレードのアーキテクチャ設計が必要です。

### 要件

- 複数テナントの完全な論理的・物理的分離
- スケーラブルなAgent実行環境
- エンタープライズレベルの認証・認可
- 高可用性・耐障害性
- セキュリティとコンプライアンス準拠
- リソース使用量の公平な分配

---

## Decision

### 1. システムアーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │ Web App  │  │ CLI Tool │  │ IDE Ext  │  │ API Client│      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘       │
└───────┼────────────┼────────────┼────────────┼─────────────────┘
        │            │            │            │
        └────────────┴────────────┴────────────┘
                         │
┌────────────────────────┼────────────────────────────────────────┐
│                API Gateway Layer                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Kong API Gateway / AWS API Gateway                      │  │
│  │  - Rate Limiting                                          │  │
│  │  - Authentication (JWT Validation)                        │  │
│  │  - Tenant Resolution (Header/Subdomain)                   │  │
│  │  - Request Routing                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────────┐
│              Application Services Layer                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Tenant    │  │    User     │  │   Agent     │            │
│  │  Management │  │  Management │  │  Orchestrator│           │
│  │   Service   │  │   Service   │  │   Service   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Billing   │  │   Audit     │  │   Monitoring│            │
│  │   Service   │  │    Log      │  │   & Metrics │            │
│  │             │  │   Service   │  │   Service   │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────────┐
│              Agent Execution Layer (K8s)                        │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Kubernetes Cluster (EKS)                                │  │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐         │  │
│  │  │ Namespace  │  │ Namespace  │  │ Namespace  │  ...    │  │
│  │  │ tenant-001 │  │ tenant-002 │  │ tenant-003 │         │  │
│  │  │            │  │            │  │            │         │  │
│  │  │ ┌────────┐ │  │ ┌────────┐ │  │ ┌────────┐ │         │  │
│  │  │ │ Coord  │ │  │ │ Coord  │ │  │ │ Coord  │ │         │  │
│  │  │ │CodeGen │ │  │ │CodeGen │ │  │ │CodeGen │ │         │  │
│  │  │ │ Review │ │  │ │ Review │ │  │ │ Review │ │         │  │
│  │  │ │  etc.  │ │  │ │  etc.  │ │  │ │  etc.  │ │         │  │
│  │  │ └────────┘ │  │ └────────┘ │  │ └────────┘ │         │  │
│  │  │            │  │            │  │            │         │  │
│  │  │ Resource   │  │ Resource   │  │ Resource   │         │  │
│  │  │ Quotas     │  │ Quotas     │  │ Quotas     │         │  │
│  │  │ Network    │  │ Network    │  │ Network    │         │  │
│  │  │ Policies   │  │ Policies   │  │ Policies   │         │  │
│  │  └────────────┘  └────────────┘  └────────────┘         │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────────┐
│                   Queue Layer                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Redis / BullMQ                                          │  │
│  │  - Agent Task Queue (per tenant)                         │  │
│  │  - Job Prioritization                                    │  │
│  │  - Retry Logic                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬───────────────────────────────────────┘
                         │
┌────────────────────────┼───────────────────────────────────────┐
│                  Data Layer                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌──────────────┐   │
│  │  PostgreSQL     │  │  Redis Cache    │  │ Object Store │   │
│  │  (Multi-schema) │  │                 │  │  (S3/GCS)    │   │
│  │                 │  │  - Session      │  │              │   │
│  │  ┌───────────┐  │  │  - Rate Limit   │  │  - Artifacts │   │
│  │  │  Platform │  │  │  - Tenant Cache │  │  - Logs      │   │
│  │  │   Schema  │  │  └─────────────────┘  │  - Backups   │   │
│  │  └───────────┘  │                        └──────────────┘   │
│  │  ┌───────────┐  │                                           │
│  │  │  Tenant   │  │  ┌─────────────────┐                     │
│  │  │  Schema   │  │  │  Audit DB       │                     │
│  │  │  (001)    │  │  │  (Immutable)    │                     │
│  │  └───────────┘  │  │                 │                     │
│  │  ┌───────────┐  │  │  - All API Calls│                     │
│  │  │  Tenant   │  │  │  - Data Access  │                     │
│  │  │  Schema   │  │  │  - User Actions │                     │
│  │  │  (002)    │  │  └─────────────────┘                     │
│  │  └───────────┘  │                                           │
│  │      ...        │                                           │
│  └─────────────────┘                                           │
└─────────────────────────────────────────────────────────────────┘
```

**Why**: レイヤー分離により、各層の独立したスケーリング、障害の局所化、セキュリティ境界の明確化が可能になります。

---

### 2. マルチテナントDB設計

#### 選択: **Schema-per-Tenant** アプローチ

```sql
-- Platform Schema (共通メタデータ)
CREATE SCHEMA platform;

CREATE TABLE platform.tenants (
  tenant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_slug VARCHAR(63) UNIQUE NOT NULL, -- DNS-safe
  display_name VARCHAR(255) NOT NULL,
  plan_tier VARCHAR(50) NOT NULL, -- free, pro, enterprise
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, suspended, deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB
);

CREATE TABLE platform.users (
  user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255), -- nullable for SSO-only users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE platform.tenant_memberships (
  membership_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE,
  user_id UUID REFERENCES platform.users(user_id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL, -- owner, admin, developer, viewer
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

CREATE TABLE platform.tenant_quotas (
  tenant_id UUID PRIMARY KEY REFERENCES platform.tenants(tenant_id),
  max_agent_executions_per_hour INTEGER DEFAULT 100,
  max_concurrent_agents INTEGER DEFAULT 5,
  max_storage_gb INTEGER DEFAULT 10,
  max_api_calls_per_minute INTEGER DEFAULT 60
);

-- Tenant-specific Schema (Example: tenant_abc123)
CREATE SCHEMA tenant_abc123;

CREATE TABLE tenant_abc123.projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  repository_url TEXT,
  created_by UUID NOT NULL, -- references platform.users(user_id)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tenant_abc123.agent_executions (
  execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES tenant_abc123.projects(project_id),
  agent_type VARCHAR(50) NOT NULL, -- coordinator, codegen, review, etc.
  status VARCHAR(20) NOT NULL, -- pending, running, success, failed
  input_data JSONB,
  output_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE tenant_abc123.github_integrations (
  integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES tenant_abc123.projects(project_id),
  github_token_encrypted BYTEA NOT NULL, -- encrypted with tenant-specific key
  repository_owner VARCHAR(255),
  repository_name VARCHAR(255),
  webhook_secret_encrypted BYTEA
);
```

**Why Schema-per-Tenant**:

| アプローチ | メリット | デメリット | 選択理由 |
|-----------|---------|----------|---------|
| **Database per Tenant** | 完全分離、最高セキュリティ | コスト高、運用複雑 | 小規模テナント数には過剰 |
| **Schema per Tenant** | 良好な分離、バックアップ容易、パフォーマンス予測可能 | 1DBあたりのスキーマ数制限 | **最適バランス** |
| **Row-level (Single Schema)** | 最も安価、スケール容易 | データ漏洩リスク、複雑なクエリ | SaaS初期には不適 |

**選択**: Schema-per-Tenantは、セキュリティとコストのバランスが取れており、PostgreSQLの論理バックアップ機能でスキーマ単位のバックアップ/リストアが可能です。

#### データ暗号化戦略

```typescript
// Tenant-specific encryption keys (stored in AWS KMS/GCP Secret Manager)
interface TenantEncryption {
  tenantId: string;
  dataEncryptionKey: string; // DEK (Data Encryption Key) - AES-256
  keyEncryptionKey: string;  // KEK (Key Encryption Key) - wrapped by KMS
  rotationSchedule: string;  // ISO 8601 duration
}

// Example: Encrypt GitHub token before storage
async function encryptSensitiveData(
  plaintext: string,
  tenantId: string
): Promise<Buffer> {
  const dek = await getTenantDEK(tenantId);
  const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final()
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]);
}
```

**Why**: テナントごとの暗号化キーにより、テナント間のデータ漏洩リスクを最小化し、コンプライアンス要件（GDPR Article 32）に準拠します。

---

### 3. 認証・認可基盤設計

#### アーキテクチャ

```
┌───────────┐
│  Client   │
└─────┬─────┘
      │ 1. Login Request
      ▼
┌─────────────────────────────────────┐
│  Authentication Service             │
│  ┌───────────┐  ┌────────────────┐ │
│  │  OAuth2   │  │  SAML 2.0      │ │
│  │  /OIDC    │  │  (Enterprise)  │ │
│  │  Provider │  │  IdP           │ │
│  └───────────┘  └────────────────┘ │
└─────┬───────────────────────────────┘
      │ 2. Issue JWT
      ▼
┌─────────────────────────────────────┐
│  JWT Token                          │
│  {                                  │
│    "sub": "user-uuid",              │
│    "tenant_id": "tenant-uuid",      │
│    "email": "user@example.com",     │
│    "role": "admin",                 │
│    "permissions": ["agent:execute", │
│                    "project:write"], │
│    "iat": 1234567890,               │
│    "exp": 1234571490                │
│  }                                  │
└─────┬───────────────────────────────┘
      │ 3. API Request (Bearer Token)
      ▼
┌─────────────────────────────────────┐
│  API Gateway                        │
│  - Validate JWT Signature           │
│  - Check Token Expiry               │
│  - Extract tenant_id from claims    │
│  - Set X-Tenant-ID header           │
└─────┬───────────────────────────────┘
      │ 4. Forwarded Request
      ▼
┌─────────────────────────────────────┐
│  Application Service                │
│  - Read X-Tenant-ID header          │
│  - Switch to tenant schema          │
│  - Check RBAC permissions           │
│  - Execute business logic           │
└─────────────────────────────────────┘
```

#### RBAC モデル

```typescript
// Role definitions
enum Role {
  OWNER = 'owner',       // Full tenant admin
  ADMIN = 'admin',       // Manage users, projects
  DEVELOPER = 'developer', // Execute agents, view results
  VIEWER = 'viewer'      // Read-only access
}

// Permission definitions
enum Permission {
  // Tenant management
  'tenant:update' = 'tenant:update',
  'tenant:delete' = 'tenant:delete',

  // User management
  'user:invite' = 'user:invite',
  'user:remove' = 'user:remove',

  // Project management
  'project:create' = 'project:create',
  'project:delete' = 'project:delete',

  // Agent execution
  'agent:execute' = 'agent:execute',
  'agent:view' = 'agent:view',
  'agent:cancel' = 'agent:cancel',

  // Billing
  'billing:view' = 'billing:view',
  'billing:manage' = 'billing:manage'
}

// Role-Permission mapping
const rolePermissions: Record<Role, Permission[]> = {
  [Role.OWNER]: Object.values(Permission), // All permissions
  [Role.ADMIN]: [
    Permission['user:invite'],
    Permission['user:remove'],
    Permission['project:create'],
    Permission['project:delete'],
    Permission['agent:execute'],
    Permission['agent:view'],
    Permission['agent:cancel'],
    Permission['billing:view']
  ],
  [Role.DEVELOPER]: [
    Permission['project:create'],
    Permission['agent:execute'],
    Permission['agent:view'],
    Permission['agent:cancel']
  ],
  [Role.VIEWER]: [
    Permission['agent:view']
  ]
};

// Authorization middleware
async function authorize(
  userId: string,
  tenantId: string,
  requiredPermission: Permission
): Promise<boolean> {
  const membership = await db.query(`
    SELECT role FROM platform.tenant_memberships
    WHERE user_id = $1 AND tenant_id = $2
  `, [userId, tenantId]);

  if (!membership) return false;

  const userPermissions = rolePermissions[membership.role];
  return userPermissions.includes(requiredPermission);
}
```

#### SSO統合 (SAML 2.0 for Enterprise)

```yaml
# SAML Configuration (per tenant)
saml:
  entityId: "https://miyabi.example.com/saml/metadata/{tenant-slug}"
  assertionConsumerService:
    url: "https://miyabi.example.com/saml/acs"
    binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
  singleLogoutService:
    url: "https://miyabi.example.com/saml/sls"
    binding: "urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect"

  # IdP Metadata (stored per tenant)
  idpMetadataUrl: "https://customer-idp.example.com/metadata.xml"

  # Attribute mapping
  attributeMapping:
    email: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    firstName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
    lastName: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
```

**Why**: OAuth2/OIDCで標準的なB2B SaaS要件をカバーし、SAMLでエンタープライズ顧客のActive Directory/Oktaとの統合を実現します。JWTによりステートレスな認証が可能になります。

---

### 4. API Gateway設計

#### Kong API Gateway構成

```yaml
# Kong Configuration (kong.yml)
_format_version: "3.0"

services:
  - name: tenant-service
    url: http://tenant-service:3000
    routes:
      - name: tenant-routes
        paths:
          - /api/v1/tenants
        strip_path: false
    plugins:
      - name: jwt
        config:
          claims_to_verify:
            - exp
      - name: rate-limiting
        config:
          minute: 60
          policy: local
      - name: correlation-id
        config:
          header_name: X-Request-ID
          generator: uuid
      - name: request-transformer
        config:
          add:
            headers:
              - "X-Tenant-ID:$(jwt.tenant_id)"

  - name: agent-service
    url: http://agent-orchestrator:3001
    routes:
      - name: agent-routes
        paths:
          - /api/v1/agents
    plugins:
      - name: jwt
      - name: rate-limiting
        config:
          minute: 30  # Lower limit for agent execution
      - name: request-size-limiting
        config:
          allowed_payload_size: 10  # 10MB max
      - name: request-transformer
        config:
          add:
            headers:
              - "X-Tenant-ID:$(jwt.tenant_id)"
              - "X-User-ID:$(jwt.sub)"

plugins:
  - name: prometheus
    config:
      per_consumer: true

  - name: zipkin
    config:
      http_endpoint: http://zipkin:9411/api/v2/spans
      sample_ratio: 0.1
```

#### テナント解決戦略

```typescript
// Tenant Resolution Strategy
enum TenantResolutionMethod {
  SUBDOMAIN = 'subdomain',     // tenant1.miyabi.example.com
  HEADER = 'header',           // X-Tenant-Slug: tenant1
  JWT_CLAIM = 'jwt_claim',     // Extract from JWT token
  PATH_PREFIX = 'path_prefix'  // /tenants/tenant1/api/...
}

// Kong Lua plugin: tenant-resolver.lua
function resolveTenant(conf)
  local tenant_id = nil

  -- Method 1: JWT claim (most reliable after auth)
  local jwt = kong.ctx.shared.jwt_keyset_payload
  if jwt and jwt.tenant_id then
    tenant_id = jwt.tenant_id
  end

  -- Method 2: Subdomain (for initial auth requests)
  if not tenant_id then
    local host = kong.request.get_host()
    local subdomain = host:match("^([^.]+)%.miyabi%.example%.com$")
    if subdomain then
      tenant_id = lookupTenantBySlug(subdomain)
    end
  end

  -- Method 3: Header (for CLI/API clients)
  if not tenant_id then
    local tenant_slug = kong.request.get_header("X-Tenant-Slug")
    if tenant_slug then
      tenant_id = lookupTenantBySlug(tenant_slug)
    end
  end

  if not tenant_id then
    return kong.response.exit(400, {
      message = "Tenant identification failed"
    })
  end

  kong.service.request.set_header("X-Tenant-ID", tenant_id)
end
```

**Why**: Kong provides enterprise-grade API management with plugin ecosystem. Multiple tenant resolution methods ensure flexibility for different client types (web, CLI, API).

---

### 5. Agent実行環境の分離設計

#### Kubernetes Namespace分離

```yaml
# Namespace per tenant
apiVersion: v1
kind: Namespace
metadata:
  name: tenant-abc123
  labels:
    tenant-id: "abc123"
    plan-tier: "enterprise"
---
# Resource Quotas
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-abc123
spec:
  hard:
    requests.cpu: "4"
    requests.memory: 8Gi
    limits.cpu: "8"
    limits.memory: 16Gi
    persistentvolumeclaims: "5"
    pods: "20"
---
# Limit Ranges (per pod)
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-limits
  namespace: tenant-abc123
spec:
  limits:
    - max:
        cpu: "2"
        memory: 4Gi
      min:
        cpu: "100m"
        memory: 128Mi
      default:
        cpu: "500m"
        memory: 512Mi
      defaultRequest:
        cpu: "250m"
        memory: 256Mi
      type: Container
---
# Network Policy (deny all cross-namespace traffic)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-isolation
  namespace: tenant-abc123
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
      - namespaceSelector:
          matchLabels:
            name: tenant-abc123
      - namespaceSelector:
          matchLabels:
            name: platform-services  # Allow platform services
  egress:
    - to:
      - namespaceSelector:
          matchLabels:
            name: platform-services
    - to:  # Allow external GitHub API
      - podSelector: {}
      ports:
        - protocol: TCP
          port: 443
```

#### Agent Pod Template

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: codegen-agent-{execution-id}
  namespace: tenant-abc123
  labels:
    app: miyabi-agent
    agent-type: codegen
    tenant-id: abc123
spec:
  serviceAccountName: miyabi-agent-sa
  securityContext:
    runAsNonRoot: true
    runAsUser: 1000
    fsGroup: 1000
    seccompProfile:
      type: RuntimeDefault

  containers:
    - name: agent
      image: miyabi/codegen-agent:v1.0.0
      imagePullPolicy: IfNotPresent

      resources:
        requests:
          cpu: 500m
          memory: 1Gi
        limits:
          cpu: 2
          memory: 4Gi

      env:
        - name: TENANT_ID
          value: "abc123"
        - name: EXECUTION_ID
          value: "{execution-id}"
        - name: ANTHROPIC_API_KEY
          valueFrom:
            secretKeyRef:
              name: anthropic-api-key
              key: api-key
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: tenant-abc123-db-creds
              key: connection-string

      volumeMounts:
        - name: workspace
          mountPath: /workspace
        - name: tmp
          mountPath: /tmp

      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop:
            - ALL

  volumes:
    - name: workspace
      emptyDir:
        sizeLimit: 5Gi
    - name: tmp
      emptyDir:
        sizeLimit: 1Gi

  restartPolicy: Never
  activeDeadlineSeconds: 3600  # 1 hour timeout
```

**Why**: Namespace分離により、Kubernetesのネイティブな機能でリソースクォータ、ネットワークポリシー、RBAC分離を実現します。Pod単位のセキュリティコンテキストでコンテナエスケープを防止します。

---

### 6. スケーラビリティ設計

#### 水平スケーリング戦略

```
┌─────────────────────────────────────────────────────────────┐
│  Load Balancer (ALB/NLB)                                    │
└────────────┬────────────────────────────────────────────────┘
             │
      ┌──────┴──────┐
      │             │
┌─────▼─────┐ ┌────▼──────┐
│ API GW 1  │ │ API GW 2  │  ... (Auto-scaling based on RPS)
└─────┬─────┘ └────┬──────┘
      │            │
      └──────┬─────┘
             │
      ┌──────▼──────────────────────────────────────┐
      │  Application Service Layer                  │
      │  (Stateless, can scale independently)       │
      │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
      │  │ Service  │  │ Service  │  │ Service  │  │
      │  │ Pod 1    │  │ Pod 2    │  │ Pod 3    │  │
      │  └──────────┘  └──────────┘  └──────────┘  │
      └─────────────────┬───────────────────────────┘
                        │
      ┌─────────────────▼───────────────────────────┐
      │  Queue Layer (Redis/BullMQ)                 │
      │  ┌──────────────────────────────────────┐   │
      │  │  Agent Task Queue (Sharded by Tenant)│   │
      │  │  Shard 1: tenants 000-333            │   │
      │  │  Shard 2: tenants 334-666            │   │
      │  │  Shard 3: tenants 667-999            │   │
      │  └──────────────────────────────────────┘   │
      └─────────────────┬───────────────────────────┘
                        │
      ┌─────────────────▼───────────────────────────┐
      │  Agent Worker Pool (K8s)                    │
      │  ┌────────────┐  ┌────────────┐             │
      │  │ Worker 1   │  │ Worker 2   │  ...        │
      │  │ (polls     │  │ (polls     │             │
      │  │ queue)     │  │ queue)     │             │
      │  └────────────┘  └────────────┘             │
      │  Auto-scaling: HPA based on queue depth     │
      └─────────────────────────────────────────────┘
```

#### キューイング設計

```typescript
// BullMQ Queue Configuration
import { Queue, QueueScheduler, Worker } from 'bullmq';

// Create queue per agent type with priority support
const codegenQueue = new Queue('codegen-tasks', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 86400, // 24 hours
      count: 1000
    },
    removeOnFail: {
      age: 604800 // 7 days
    }
  }
});

// Priority levels
enum TaskPriority {
  CRITICAL = 1,  // Enterprise plan
  HIGH = 2,      // Pro plan
  NORMAL = 3,    // Standard plan
  LOW = 4        // Free plan
}

// Add task to queue
async function enqueueAgentTask(
  tenantId: string,
  agentType: string,
  taskData: any,
  priority: TaskPriority
) {
  const jobId = `${tenantId}:${agentType}:${Date.now()}`;

  await codegenQueue.add(
    agentType,
    {
      tenantId,
      taskData,
      enqueuedAt: new Date().toISOString()
    },
    {
      jobId,
      priority,
      timeout: 3600000 // 1 hour
    }
  );

  return jobId;
}

// Worker process
const worker = new Worker(
  'codegen-tasks',
  async (job) => {
    const { tenantId, taskData } = job.data;

    // Launch K8s pod in tenant namespace
    const pod = await launchAgentPod(tenantId, 'codegen', taskData);

    // Wait for completion
    const result = await waitForPodCompletion(pod);

    return result;
  },
  {
    connection: redisConnection,
    concurrency: 10, // Process 10 jobs concurrently per worker
    limiter: {
      max: 100, // Max 100 jobs per 1 minute
      duration: 60000
    }
  }
);

// Horizontal Pod Autoscaler (HPA) for workers
// kubectl apply -f -
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agent-worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agent-worker
  minReplicas: 3
  maxReplicas: 50
  metrics:
    - type: External
      external:
        metric:
          name: bullmq_queue_waiting
          selector:
            matchLabels:
              queue: codegen-tasks
        target:
          type: AverageValue
          averageValue: "10"  # Scale up if >10 waiting jobs per pod
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

**Why**: Redis/BullMQによる永続キューで、タスクの損失を防ぎ、優先度ベースのスケジューリングでSLA保証を実現します。HPAで需要に応じて自動スケールします。

---

### 7. セキュリティアーキテクチャ

#### データ暗号化

```
┌─────────────────────────────────────────────────────────────┐
│  Encryption at Rest                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  PostgreSQL                                         │   │
│  │  - Transparent Data Encryption (TDE)                │   │
│  │  - pgcrypto for column-level encryption             │   │
│  │                                                      │   │
│  │  Example:                                            │   │
│  │  CREATE TABLE secrets (                             │   │
│  │    id UUID PRIMARY KEY,                             │   │
│  │    data BYTEA NOT NULL  -- encrypted with AES-256   │   │
│  │  );                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Object Storage (S3/GCS)                            │   │
│  │  - Server-Side Encryption (SSE-KMS)                 │   │
│  │  - Customer-Managed Keys (CMK) per tenant           │   │
│  │  - Encryption key rotation (annual)                 │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Encryption in Transit                                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  TLS 1.3 everywhere                                 │   │
│  │  - Client <-> API Gateway: TLS 1.3                  │   │
│  │  - API Gateway <-> Services: mTLS                   │   │
│  │  - Service <-> Database: TLS 1.3                    │   │
│  │                                                      │   │
│  │  Certificate Management:                             │   │
│  │  - Let's Encrypt for public endpoints              │   │
│  │  - Private CA (Vault/cert-manager) for internal    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Key Management                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  AWS KMS / Google Cloud KMS                         │   │
│  │                                                      │   │
│  │  Key Hierarchy:                                      │   │
│  │  - Root Key (KMS-managed, auto-rotated)            │   │
│  │  - Tenant KEK (per tenant, annual rotation)        │   │
│  │  - Data DEK (per data object, ephemeral)           │   │
│  │                                                      │   │
│  │  Access Control:                                     │   │
│  │  - IAM policies restrict key access                │   │
│  │  - Audit all key operations                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 監査ログ設計

```sql
-- Immutable audit log table
CREATE TABLE audit.access_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Request context
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  request_id VARCHAR(36) NOT NULL,

  -- Action details
  resource_type VARCHAR(50) NOT NULL, -- project, agent_execution, etc.
  resource_id UUID,
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, execute

  -- Request metadata
  ip_address INET,
  user_agent TEXT,
  api_endpoint TEXT,
  http_method VARCHAR(10),

  -- Response
  status_code INTEGER,
  response_time_ms INTEGER,

  -- Security
  auth_method VARCHAR(50), -- jwt, saml, api_key
  permission_checked VARCHAR(100),
  authorization_result BOOLEAN,

  -- Additional context
  metadata JSONB
) PARTITION BY RANGE (timestamp);

-- Create monthly partitions
CREATE TABLE audit.access_logs_2025_01 PARTITION OF audit.access_logs
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

-- Prevent updates/deletes (append-only)
CREATE RULE audit_no_update AS ON UPDATE TO audit.access_logs
  DO INSTEAD NOTHING;

CREATE RULE audit_no_delete AS ON DELETE TO audit.access_logs
  DO INSTEAD NOTHING;

-- Indexes for common queries
CREATE INDEX idx_access_logs_tenant_time
  ON audit.access_logs (tenant_id, timestamp DESC);

CREATE INDEX idx_access_logs_user_time
  ON audit.access_logs (user_id, timestamp DESC);

CREATE INDEX idx_access_logs_resource
  ON audit.access_logs (resource_type, resource_id);
```

```typescript
// Audit logging middleware
async function auditLog(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now();

  // Capture original res.send
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;

    // Log after response sent
    setImmediate(async () => {
      const responseTime = Date.now() - startTime;

      await db.query(`
        INSERT INTO audit.access_logs (
          tenant_id, user_id, request_id,
          resource_type, action,
          ip_address, user_agent, api_endpoint, http_method,
          status_code, response_time_ms,
          auth_method, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      `, [
        req.tenantId,
        req.userId,
        req.id,
        req.resourceType,
        req.action,
        req.ip,
        req.get('user-agent'),
        req.path,
        req.method,
        res.statusCode,
        responseTime,
        req.authMethod,
        JSON.stringify({
          request_body_size: JSON.stringify(req.body).length,
          query_params: req.query
        })
      ]);
    });

    return originalSend.call(this, data);
  };

  next();
}
```

#### Security Controls Summary

| Control | Implementation | Purpose |
|---------|---------------|---------|
| **Network Segmentation** | K8s NetworkPolicy, VPC subnets | Isolate tenant workloads |
| **Data Encryption (Rest)** | AES-256, PostgreSQL TDE, S3 SSE-KMS | Protect stored data |
| **Data Encryption (Transit)** | TLS 1.3, mTLS | Protect data in motion |
| **Secret Management** | AWS Secrets Manager / HashiCorp Vault | Centralized secret storage |
| **RBAC** | Custom RBAC + K8s RBAC | Least privilege access |
| **Audit Logging** | Immutable append-only logs | Compliance & forensics |
| **DDoS Protection** | Cloudflare / AWS Shield | Availability |
| **WAF** | AWS WAF / Cloudflare | Application-layer attacks |
| **Container Security** | Readonly FS, non-root user, seccomp | Container escape prevention |
| **Secrets Scanning** | GitGuardian, Gitleaks | Prevent credential leaks |

**Why**: 多層防御（Defense in Depth）アプローチにより、単一障害点を排除し、コンプライアンス要件（SOC 2, ISO 27001, GDPR）に対応します。

---

## Consequences

### Positive

1. **セキュリティ**: Schema分離とNamespace分離により、テナント間のデータ漏洩リスクを最小化
2. **スケーラビリティ**: ステートレスな設計により、各レイヤーを独立してスケール可能
3. **運用性**: K8sネイティブな機能で自動スケーリング、自己修復、ローリングアップデート実現
4. **コンプライアンス**: 暗号化、監査ログ、RBAC により主要な規制要件に対応
5. **柔軟性**: マルチクラウド対応（EKS, GKE, AKS）可能なポータブルアーキテクチャ

### Negative

1. **複雑性**: マイクロサービス、K8s、キューシステムの運用には専門知識が必要
2. **コスト**: 初期構築コストが高い（特にK8sクラスタの最小構成）
3. **レイテンシ**: レイヤー分離により、単純なモノリスと比較してネットワークホップが増加
4. **データベース制限**: PostgreSQLのスキーマ数上限（理論的には無制限だが、実用上は数千程度が推奨）

### Mitigation

1. **複雑性**: IaC（Terraform）とGitOpsでインフラをコード化、再現性を確保
2. **コスト**: 段階的移行戦略（初期はモノリス、段階的にマイクロサービス化）
3. **レイテンシ**: サービスメッシュ（Istio/Linkerd）でトレーシング・最適化
4. **DBスキーマ制限**: 1000テナント超過時にDatabase-per-Tenantへの段階的移行パス設計

---

## Alternatives Considered

### Alternative 1: Serverless Architecture (Lambda/Cloud Functions)

**Pros**:
- ゼロ運用コスト
- 自動スケーリング
- 従量課金

**Cons**:
- コールドスタート（Agent実行に不適）
- 実行時間制限（15分）
- ステートフル処理が困難

**Decision**: Agentの長時間実行（最大1時間）要件により不適格

### Alternative 2: Database-per-Tenant

**Pros**:
- 完全な物理分離
- テナント単位の簡単なバックアップ/リストア
- 最高レベルのセキュリティ

**Cons**:
- 運用複雑性（DB接続数の管理）
- コスト高（数百テナントで非現実的）
- スキーママイグレーションの複雑さ

**Decision**: 初期フェーズには過剰、Schema-per-Tenantで開始し、必要に応じてエンタープライズプランで採用

### Alternative 3: Single-Schema with Row-Level Security (RLS)

**Pros**:
- 最もシンプル
- 低コスト
- 無制限のテナント数

**Cons**:
- データ漏洩リスク（クエリミスで全テナントデータ流出）
- パフォーマンス（RLS条件が全クエリに付与）
- バックアップの粒度が粗い

**Decision**: セキュリティリスクが高すぎるため却下

---

## Implementation Roadmap

### Phase 1: MVP (3 months)
- [ ] PostgreSQL Schema-per-Tenant実装
- [ ] OAuth2/OIDC認証基盤
- [ ] Kong API Gateway基本設定
- [ ] K8s Namespace分離（単一クラスタ）
- [ ] Redis/BullMQキュー実装
- [ ] 基本的な監査ログ

### Phase 2: Production-Ready (6 months)
- [ ] SAML 2.0統合
- [ ] マルチリージョン展開
- [ ] HPA/VPAによる自動スケーリング
- [ ] 暗号化（TDE, KMS統合）
- [ ] WAF/DDoS防御
- [ ] SLO/SLI監視ダッシュボード

### Phase 3: Enterprise Features (12 months)
- [ ] Database-per-Tenantオプション
- [ ] プライベートクラスタ（dedicated K8s）
- [ ] カスタムドメイン対応
- [ ] 高度な監査ログ（SIEM連携）
- [ ] Disaster Recovery（multi-region failover）
- [ ] コンプライアンス認証（SOC 2 Type II）

---

## References

- [Multi-tenancy Architecture Patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-api-access-authorization/welcome.html)
- [PostgreSQL Schema-based Multi-tenancy](https://www.citusdata.com/blog/2017/03/09/multi-tenant-sharding-tutorial/)
- [Kubernetes Multi-Tenancy Best Practices](https://kubernetes.io/docs/concepts/security/multi-tenancy/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [OWASP SaaS Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Multitenant_Security_Cheat_Sheet.html)

---

**Reviewers**: @tech-lead, @security-team, @devops-team
**Next Steps**: Review by stakeholders, prototype Phase 1 components
