# Miyabi Core 2.0 マルチテナント対応 詳細設計書

**Issue**: #8
**Parent Issue**: #2 (カクシン進化)
**Status**: Design Phase
**Version**: 2.0.0
**Date**: 2025-11-30
**Related Document**: [SAAS_ARCHITECTURE.md](./SAAS_ARCHITECTURE.md)

---

## 目次

1. [概要](#概要)
2. [テナントモデル（TypeScript型定義）](#1-テナントモデルtypescript型定義)
3. [テナント分離レイヤー実装設計](#2-テナント分離レイヤー実装設計)
4. [テナント別設定管理](#3-テナント別設定管理)
5. [リソースクォータ制御設計](#4-リソースクォータ制御設計)
6. [テナント間データ分離実装](#5-テナント間データ分離実装)
7. [テナント管理API設計](#6-テナント管理api設計)
8. [テナントライフサイクル管理](#7-テナントライフサイクル管理)
9. [実装ロードマップ](#実装ロードマップ)
10. [セキュリティ考慮事項](#セキュリティ考慮事項)
11. [付録](#付録)

---

## 概要

### 設計目標

Miyabiフレームワークを**Schema-per-Tenant**アーキテクチャでマルチテナント化し、以下を実現する：

- **完全なテナント分離**: PostgreSQL Schemaレベル + Kubernetes Namespaceレベル
- **スケーラビリティ**: 1,000テナント対応（初期目標）
- **セキュリティ**: データ暗号化、監査ログ、RBAC完備
- **運用性**: テナント単位のプロビジョニング、削除、バックアップ

### アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────┐
│                  Client Applications                        │
│  (Web App, CLI, IDE Extensions, API Clients)               │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            API Gateway (Kong / AWS API Gateway)             │
│  - JWT Validation                                            │
│  - Tenant Resolution (Subdomain/Header/JWT)                  │
│  - Rate Limiting (Tenant-specific)                          │
└────────────────────┬────────────────────────────────────────┘
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│ Tenant   │  │  User    │  │  Agent   │
│  Mgmt    │  │  Mgmt    │  │  Orch.   │
│ Service  │  │ Service  │  │ Service  │
└────┬─────┘  └────┬─────┘  └────┬─────┘
     │             │              │
     └─────────────┼──────────────┘
                   ▼
    ┌─────────────────────────────┐
    │  PostgreSQL                 │
    │  ┌────────────────────────┐ │
    │  │ Platform Schema        │ │
    │  │ - tenants              │ │
    │  │ - users                │ │
    │  │ - tenant_memberships   │ │
    │  └────────────────────────┘ │
    │  ┌────────────────────────┐ │
    │  │ Tenant Schema (001)    │ │
    │  │ - projects             │ │
    │  │ - agent_executions     │ │
    │  │ - github_integrations  │ │
    │  └────────────────────────┘ │
    │  ┌────────────────────────┐ │
    │  │ Tenant Schema (002)    │ │
    │  └────────────────────────┘ │
    └─────────────────────────────┘
                   │
                   ▼
    ┌─────────────────────────────┐
    │  Kubernetes Cluster (EKS)   │
    │  ┌────────────────────────┐ │
    │  │ Namespace: tenant-001  │ │
    │  │ - Coordinator Pod      │ │
    │  │ - CodeGen Pod          │ │
    │  │ - Review Pod           │ │
    │  │ Resource Quotas        │ │
    │  │ Network Policies       │ │
    │  └────────────────────────┘ │
    │  ┌────────────────────────┐ │
    │  │ Namespace: tenant-002  │ │
    │  └────────────────────────┘ │
    └─────────────────────────────┘
```

### 技術スタック

| レイヤー | 技術 | 用途 |
|---------|------|------|
| **Database** | PostgreSQL 15+ | Schema-per-Tenant分離 |
| **Orchestration** | Kubernetes (EKS/GKE) | Namespace分離、リソース制御 |
| **Queue** | Redis + BullMQ | Agent Task Queue (Tenant別) |
| **API Gateway** | Kong / AWS API Gateway | 認証、テナント解決、Rate Limiting |
| **Auth** | OAuth2/OIDC, SAML 2.0 | 認証・認可 |
| **Encryption** | AWS KMS / GCP KMS | テナント別暗号化キー管理 |
| **Monitoring** | Prometheus, Grafana | メトリクス収集・可視化 |
| **Logging** | ELK Stack / CloudWatch | 監査ログ、アプリケーションログ |

---

## 1. テナントモデル（TypeScript型定義）

### 1.1 コアエンティティ

```typescript
/**
 * テナント基本情報
 * PostgreSQL: platform.tenants
 */
export interface Tenant {
  /** テナント一意識別子 (UUID v4) */
  tenantId: string;

  /** テナントスラッグ (DNS-safe, 小文字英数字+ハイフン) */
  slug: string;

  /** テナント表示名 */
  displayName: string;

  /** プランティア */
  planTier: PlanTier;

  /** テナント状態 */
  status: TenantStatus;

  /** PostgreSQLスキーマ名 (tenant_{slug}) */
  schemaName: string;

  /** Kubernetes Namespace名 (tenant-{slug}) */
  k8sNamespace: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** 削除日時 (論理削除) */
  deletedAt?: Date;

  /** メタデータ (JSON) */
  metadata: TenantMetadata;
}

/**
 * プランティア
 */
export enum PlanTier {
  FREE = 'free',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
  CUSTOM = 'custom'
}

/**
 * テナント状態
 */
export enum TenantStatus {
  /** プロビジョニング中 */
  PROVISIONING = 'provisioning',

  /** アクティブ */
  ACTIVE = 'active',

  /** 一時停止 (支払い遅延等) */
  SUSPENDED = 'suspended',

  /** 削除予定 (猶予期間中) */
  PENDING_DELETION = 'pending_deletion',

  /** 削除済み */
  DELETED = 'deleted'
}

/**
 * テナントメタデータ
 */
export interface TenantMetadata {
  /** 組織情報 */
  organization?: {
    name: string;
    industry?: string;
    size?: string; // '1-10', '11-50', '51-200', '201-1000', '1000+'
    country?: string;
  };

  /** 課金情報 */
  billing?: {
    stripeCustomerId?: string;
    subscriptionId?: string;
    trialEndsAt?: string; // ISO 8601
  };

  /** SSO設定 */
  sso?: {
    enabled: boolean;
    provider?: 'saml' | 'oidc';
    entityId?: string;
    metadataUrl?: string;
  };

  /** カスタム設定 */
  customSettings?: Record<string, unknown>;
}

/**
 * ユーザー情報
 * PostgreSQL: platform.users
 */
export interface User {
  /** ユーザー一意識別子 (UUID v4) */
  userId: string;

  /** メールアドレス (一意) */
  email: string;

  /** メール認証済みフラグ */
  emailVerified: boolean;

  /** パスワードハッシュ (bcrypt, SSO専用の場合null) */
  passwordHash?: string;

  /** 名前 */
  displayName?: string;

  /** アバターURL */
  avatarUrl?: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** 最終ログイン日時 */
  lastLoginAt?: Date;

  /** メタデータ */
  metadata?: UserMetadata;
}

/**
 * ユーザーメタデータ
 */
export interface UserMetadata {
  /** 認証プロバイダー */
  authProviders?: Array<'local' | 'google' | 'github' | 'saml'>;

  /** 通知設定 */
  notifications?: {
    email: boolean;
    slack: boolean;
  };

  /** UI設定 */
  preferences?: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
  };
}

/**
 * テナントメンバーシップ (ユーザーとテナントの関連)
 * PostgreSQL: platform.tenant_memberships
 */
export interface TenantMembership {
  /** メンバーシップID */
  membershipId: string;

  /** テナントID */
  tenantId: string;

  /** ユーザーID */
  userId: string;

  /** ロール */
  role: TenantRole;

  /** 招待ステータス */
  invitationStatus: InvitationStatus;

  /** 招待者ID */
  invitedBy?: string;

  /** 参加日時 */
  joinedAt?: Date;

  /** 招待日時 */
  invitedAt: Date;

  /** 招待期限 */
  invitationExpiresAt?: Date;
}

/**
 * テナント内ロール
 */
export enum TenantRole {
  /** オーナー (全権限、課金管理) */
  OWNER = 'owner',

  /** 管理者 (ユーザー管理、プロジェクト管理) */
  ADMIN = 'admin',

  /** 開発者 (Agent実行、プロジェクト作成) */
  DEVELOPER = 'developer',

  /** 閲覧者 (読み取り専用) */
  VIEWER = 'viewer'
}

/**
 * 招待ステータス
 */
export enum InvitationStatus {
  /** 招待中 */
  PENDING = 'pending',

  /** 承認済み */
  ACCEPTED = 'accepted',

  /** 拒否 */
  DECLINED = 'declined',

  /** 期限切れ */
  EXPIRED = 'expired'
}

/**
 * テナントクォータ設定
 * PostgreSQL: platform.tenant_quotas
 */
export interface TenantQuota {
  /** テナントID */
  tenantId: string;

  /** 時間あたりの最大Agent実行数 */
  maxAgentExecutionsPerHour: number;

  /** 同時実行可能なAgent数 */
  maxConcurrentAgents: number;

  /** ストレージ上限 (GB) */
  maxStorageGB: number;

  /** 分あたりのAPI呼び出し上限 */
  maxApiCallsPerMinute: number;

  /** プロジェクト数上限 */
  maxProjects: number;

  /** メンバー数上限 */
  maxMembers: number;

  /** Kubernetes Podリソースクォータ */
  k8sResourceQuota: K8sResourceQuota;
}

/**
 * Kubernetesリソースクォータ
 */
export interface K8sResourceQuota {
  /** CPU要求 (コア数) */
  requestsCpu: string; // "4"

  /** メモリ要求 (バイト単位文字列) */
  requestsMemory: string; // "8Gi"

  /** CPU上限 (コア数) */
  limitsCpu: string; // "8"

  /** メモリ上限 (バイト単位文字列) */
  limitsMemory: string; // "16Gi"

  /** PVC数上限 */
  persistentVolumeClaims: number;

  /** Pod数上限 */
  pods: number;
}

/**
 * テナント固有データエンティティ
 * PostgreSQL: tenant_{slug}.projects
 */
export interface TenantProject {
  /** プロジェクトID */
  projectId: string;

  /** プロジェクト名 */
  name: string;

  /** リポジトリURL */
  repositoryUrl?: string;

  /** デフォルトブランチ */
  defaultBranch: string;

  /** 作成者ユーザーID */
  createdBy: string;

  /** 作成日時 */
  createdAt: Date;

  /** 更新日時 */
  updatedAt: Date;

  /** プロジェクト設定 */
  settings: ProjectSettings;
}

/**
 * プロジェクト設定
 */
export interface ProjectSettings {
  /** Agent自動実行設定 */
  autoAgentExecution?: {
    enabled: boolean;
    triggers: Array<'issue_created' | 'pr_opened' | 'push'>;
  };

  /** コード品質しきい値 */
  qualityThreshold?: number; // 0-100

  /** テストカバレッジしきい値 */
  coverageThreshold?: number; // 0-100
}

/**
 * Agent実行履歴
 * PostgreSQL: tenant_{slug}.agent_executions
 */
export interface AgentExecution {
  /** 実行ID */
  executionId: string;

  /** プロジェクトID */
  projectId: string;

  /** Agentタイプ */
  agentType: AgentType;

  /** 実行ステータス */
  status: ExecutionStatus;

  /** 入力データ (JSON) */
  inputData: Record<string, unknown>;

  /** 出力データ (JSON) */
  outputData?: Record<string, unknown>;

  /** エラーメッセージ */
  errorMessage?: string;

  /** エラースタックトレース */
  errorStack?: string;

  /** 開始日時 */
  startedAt?: Date;

  /** 完了日時 */
  completedAt?: Date;

  /** 作成日時 */
  createdAt: Date;

  /** 実行時間 (ミリ秒) */
  durationMs?: number;

  /** Kubernetes Pod名 */
  k8sPodName?: string;
}

/**
 * Agentタイプ
 */
export enum AgentType {
  COORDINATOR = 'coordinator',
  CODEGEN = 'codegen',
  REVIEW = 'review',
  ISSUE = 'issue',
  PR = 'pr',
  DEPLOY = 'deploy',
  TEST = 'test'
}

/**
 * 実行ステータス
 */
export enum ExecutionStatus {
  PENDING = 'pending',
  QUEUED = 'queued',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout'
}

/**
 * GitHub統合設定
 * PostgreSQL: tenant_{slug}.github_integrations
 */
export interface GitHubIntegration {
  /** 統合ID */
  integrationId: string;

  /** プロジェクトID */
  projectId: string;

  /** GitHub Personal Access Token (暗号化) */
  githubTokenEncrypted: Buffer;

  /** リポジトリオーナー */
  repositoryOwner: string;

  /** リポジトリ名 */
  repositoryName: string;

  /** Webhook Secret (暗号化) */
  webhookSecretEncrypted?: Buffer;

  /** Webhook URL */
  webhookUrl?: string;

  /** 統合ステータス */
  status: 'active' | 'inactive' | 'error';

  /** 最終同期日時 */
  lastSyncAt?: Date;

  /** 作成日時 */
  createdAt: Date;
}
```

### 1.2 RBAC (Role-Based Access Control) 型定義

```typescript
/**
 * 権限定義
 */
export enum Permission {
  // テナント管理
  TENANT_UPDATE = 'tenant:update',
  TENANT_DELETE = 'tenant:delete',
  TENANT_VIEW_BILLING = 'tenant:view_billing',
  TENANT_MANAGE_BILLING = 'tenant:manage_billing',

  // ユーザー管理
  USER_INVITE = 'user:invite',
  USER_REMOVE = 'user:remove',
  USER_UPDATE_ROLE = 'user:update_role',
  USER_VIEW = 'user:view',

  // プロジェクト管理
  PROJECT_CREATE = 'project:create',
  PROJECT_UPDATE = 'project:update',
  PROJECT_DELETE = 'project:delete',
  PROJECT_VIEW = 'project:view',

  // Agent実行
  AGENT_EXECUTE = 'agent:execute',
  AGENT_VIEW = 'agent:view',
  AGENT_CANCEL = 'agent:cancel',

  // GitHub統合
  GITHUB_CONNECT = 'github:connect',
  GITHUB_DISCONNECT = 'github:disconnect',
  GITHUB_VIEW = 'github:view',

  // 監査ログ
  AUDIT_VIEW = 'audit:view'
}

/**
 * ロール-権限マッピング
 */
export const RolePermissions: Record<TenantRole, Permission[]> = {
  [TenantRole.OWNER]: Object.values(Permission), // 全権限

  [TenantRole.ADMIN]: [
    Permission.TENANT_UPDATE,
    Permission.TENANT_VIEW_BILLING,
    Permission.USER_INVITE,
    Permission.USER_REMOVE,
    Permission.USER_UPDATE_ROLE,
    Permission.USER_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_DELETE,
    Permission.PROJECT_VIEW,
    Permission.AGENT_EXECUTE,
    Permission.AGENT_VIEW,
    Permission.AGENT_CANCEL,
    Permission.GITHUB_CONNECT,
    Permission.GITHUB_DISCONNECT,
    Permission.GITHUB_VIEW,
    Permission.AUDIT_VIEW
  ],

  [TenantRole.DEVELOPER]: [
    Permission.USER_VIEW,
    Permission.PROJECT_CREATE,
    Permission.PROJECT_UPDATE,
    Permission.PROJECT_VIEW,
    Permission.AGENT_EXECUTE,
    Permission.AGENT_VIEW,
    Permission.AGENT_CANCEL,
    Permission.GITHUB_CONNECT,
    Permission.GITHUB_VIEW
  ],

  [TenantRole.VIEWER]: [
    Permission.USER_VIEW,
    Permission.PROJECT_VIEW,
    Permission.AGENT_VIEW,
    Permission.GITHUB_VIEW
  ]
};

/**
 * 権限チェック結果
 */
export interface AuthorizationResult {
  /** 承認フラグ */
  authorized: boolean;

  /** ユーザーロール */
  userRole?: TenantRole;

  /** 要求された権限 */
  requiredPermission: Permission;

  /** 拒否理由 */
  reason?: string;
}
```

### 1.3 プラン別クォータ定義

```typescript
/**
 * プラン別デフォルトクォータ
 */
export const DefaultQuotas: Record<PlanTier, Partial<TenantQuota>> = {
  [PlanTier.FREE]: {
    maxAgentExecutionsPerHour: 10,
    maxConcurrentAgents: 2,
    maxStorageGB: 1,
    maxApiCallsPerMinute: 30,
    maxProjects: 3,
    maxMembers: 5,
    k8sResourceQuota: {
      requestsCpu: '1',
      requestsMemory: '2Gi',
      limitsCpu: '2',
      limitsMemory: '4Gi',
      persistentVolumeClaims: 2,
      pods: 5
    }
  },

  [PlanTier.PRO]: {
    maxAgentExecutionsPerHour: 100,
    maxConcurrentAgents: 10,
    maxStorageGB: 50,
    maxApiCallsPerMinute: 120,
    maxProjects: 50,
    maxMembers: 50,
    k8sResourceQuota: {
      requestsCpu: '8',
      requestsMemory: '16Gi',
      limitsCpu: '16',
      limitsMemory: '32Gi',
      persistentVolumeClaims: 10,
      pods: 30
    }
  },

  [PlanTier.ENTERPRISE]: {
    maxAgentExecutionsPerHour: 1000,
    maxConcurrentAgents: 50,
    maxStorageGB: 500,
    maxApiCallsPerMinute: 600,
    maxProjects: -1, // 無制限
    maxMembers: -1, // 無制限
    k8sResourceQuota: {
      requestsCpu: '32',
      requestsMemory: '64Gi',
      limitsCpu: '64',
      limitsMemory: '128Gi',
      persistentVolumeClaims: 50,
      pods: 100
    }
  },

  [PlanTier.CUSTOM]: {
    // カスタム交渉によって決定
  }
};
```

---

## 2. テナント分離レイヤー実装設計

### 2.1 データベース分離 (Schema-per-Tenant)

#### 2.1.1 スキーマ命名規則

```typescript
/**
 * テナントスキーマ名を生成
 * @param tenantSlug テナントスラッグ (例: "acme-corp")
 * @returns スキーマ名 (例: "tenant_acme_corp")
 */
export function getTenantSchemaName(tenantSlug: string): string {
  // スラッグを正規化 (ハイフンをアンダースコアに変換)
  const normalized = tenantSlug.toLowerCase().replace(/-/g, '_');

  // PostgreSQL識別子規則に準拠 (最大63文字)
  if (normalized.length > 55) {
    throw new Error(`Tenant slug too long: ${tenantSlug} (max 55 chars)`);
  }

  return `tenant_${normalized}`;
}

/**
 * Kubernetes Namespace名を生成
 * @param tenantSlug テナントスラッグ
 * @returns Namespace名 (例: "tenant-acme-corp")
 */
export function getK8sNamespace(tenantSlug: string): string {
  // DNS-1123準拠 (小文字英数字、ハイフン、最大63文字)
  const normalized = tenantSlug.toLowerCase();

  if (normalized.length > 56) {
    throw new Error(`Tenant slug too long for k8s: ${tenantSlug} (max 56 chars)`);
  }

  if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(normalized)) {
    throw new Error(`Invalid tenant slug for k8s: ${tenantSlug}`);
  }

  return `tenant-${normalized}`;
}
```

#### 2.1.2 スキーマ作成SQLテンプレート

```sql
-- テナントスキーマ作成テンプレート
-- 変数: {schema_name}, {tenant_id}

-- 1. スキーマ作成
CREATE SCHEMA IF NOT EXISTS {schema_name};

-- 2. スキーマコメント
COMMENT ON SCHEMA {schema_name} IS 'Tenant-specific data for tenant_id: {tenant_id}';

-- 3. Projects テーブル
CREATE TABLE {schema_name}.projects (
  project_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  repository_url TEXT,
  default_branch VARCHAR(255) DEFAULT 'main',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settings JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT name_not_empty CHECK (char_length(name) > 0)
);

CREATE INDEX idx_projects_created_by ON {schema_name}.projects(created_by);
CREATE INDEX idx_projects_created_at ON {schema_name}.projects(created_at DESC);

-- 4. Agent Executions テーブル
CREATE TABLE {schema_name}.agent_executions (
  execution_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES {schema_name}.projects(project_id) ON DELETE CASCADE,
  agent_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  error_stack TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  duration_ms INTEGER,
  k8s_pod_name VARCHAR(255),
  CONSTRAINT valid_agent_type CHECK (agent_type IN (
    'coordinator', 'codegen', 'review', 'issue', 'pr', 'deploy', 'test'
  )),
  CONSTRAINT valid_status CHECK (status IN (
    'pending', 'queued', 'running', 'success', 'failed', 'cancelled', 'timeout'
  ))
);

CREATE INDEX idx_agent_executions_project ON {schema_name}.agent_executions(project_id);
CREATE INDEX idx_agent_executions_status ON {schema_name}.agent_executions(status);
CREATE INDEX idx_agent_executions_created_at ON {schema_name}.agent_executions(created_at DESC);
CREATE INDEX idx_agent_executions_agent_type ON {schema_name}.agent_executions(agent_type);

-- 5. GitHub Integrations テーブル
CREATE TABLE {schema_name}.github_integrations (
  integration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES {schema_name}.projects(project_id) ON DELETE CASCADE,
  github_token_encrypted BYTEA NOT NULL,
  repository_owner VARCHAR(255) NOT NULL,
  repository_name VARCHAR(255) NOT NULL,
  webhook_secret_encrypted BYTEA,
  webhook_url TEXT,
  status VARCHAR(20) DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_integration_status CHECK (status IN ('active', 'inactive', 'error')),
  UNIQUE(project_id) -- 1プロジェクトあたり1統合
);

CREATE INDEX idx_github_integrations_project ON {schema_name}.github_integrations(project_id);

-- 6. 自動更新トリガー (updated_at)
CREATE OR REPLACE FUNCTION {schema_name}.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON {schema_name}.projects
  FOR EACH ROW
  EXECUTE FUNCTION {schema_name}.update_updated_at_column();

-- 7. Row-Level Security (RLS) - 念のため有効化
ALTER TABLE {schema_name}.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE {schema_name}.agent_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE {schema_name}.github_integrations ENABLE ROW LEVEL SECURITY;

-- 8. デフォルトポリシー (全拒否 - アプリケーション側でSET search_path使用)
-- アプリケーションが正しいスキーマに接続している前提で、RLSはバックアップとして機能
```

#### 2.1.3 データベース接続管理

```typescript
import { Pool, PoolClient } from 'pg';

/**
 * テナントコンテキスト
 */
export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  schemaName: string;
}

/**
 * テナント専用データベースクライアント
 */
export class TenantDatabaseClient {
  private pool: Pool;

  constructor(connectionString: string) {
    this.pool = new Pool({
      connectionString,
      max: 20, // プール最大接続数
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000
    });
  }

  /**
   * テナントスキーマに接続してクエリ実行
   * @param tenantContext テナントコンテキスト
   * @param queryFn クエリ実行関数
   */
  async withTenantSchema<T>(
    tenantContext: TenantContext,
    queryFn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      // スキーマを切り替え
      await client.query(`SET search_path TO ${tenantContext.schemaName}, public`);

      // クエリ実行
      const result = await queryFn(client);

      return result;
    } finally {
      // スキーマをリセット
      await client.query('SET search_path TO public');
      client.release();
    }
  }

  /**
   * プラットフォームスキーマに接続してクエリ実行
   */
  async withPlatformSchema<T>(
    queryFn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('SET search_path TO platform, public');
      const result = await queryFn(client);
      return result;
    } finally {
      await client.query('SET search_path TO public');
      client.release();
    }
  }

  /**
   * トランザクション実行
   */
  async transaction<T>(
    tenantContext: TenantContext,
    transactionFn: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');
      await client.query(`SET search_path TO ${tenantContext.schemaName}, public`);

      const result = await transactionFn(client);

      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      await client.query('SET search_path TO public');
      client.release();
    }
  }

  /**
   * プール終了
   */
  async close(): Promise<void> {
    await this.pool.end();
  }
}

/**
 * 使用例
 */
async function example() {
  const db = new TenantDatabaseClient(process.env.DATABASE_URL!);

  const tenantContext: TenantContext = {
    tenantId: '123e4567-e89b-12d3-a456-426614174000',
    tenantSlug: 'acme-corp',
    schemaName: 'tenant_acme_corp'
  };

  // テナントスキーマでプロジェクト一覧取得
  const projects = await db.withTenantSchema(tenantContext, async (client) => {
    const result = await client.query('SELECT * FROM projects ORDER BY created_at DESC');
    return result.rows;
  });

  console.log(projects);
}
```

### 2.2 Kubernetes Namespace分離

#### 2.2.1 Namespace作成テンプレート (YAML)

```yaml
# namespace-template.yaml
# 変数: TENANT_SLUG, TENANT_ID, PLAN_TIER

apiVersion: v1
kind: Namespace
metadata:
  name: tenant-${TENANT_SLUG}
  labels:
    tenant-id: "${TENANT_ID}"
    plan-tier: "${PLAN_TIER}"
    managed-by: "miyabi-platform"
  annotations:
    description: "Tenant namespace for ${TENANT_SLUG}"
    created-at: "${TIMESTAMP}"

---
# ResourceQuota (プラン別に設定値を変更)
apiVersion: v1
kind: ResourceQuota
metadata:
  name: tenant-quota
  namespace: tenant-${TENANT_SLUG}
spec:
  hard:
    requests.cpu: "${REQUESTS_CPU}"       # 例: "8"
    requests.memory: "${REQUESTS_MEMORY}" # 例: "16Gi"
    limits.cpu: "${LIMITS_CPU}"           # 例: "16"
    limits.memory: "${LIMITS_MEMORY}"     # 例: "32Gi"
    persistentvolumeclaims: "${MAX_PVC}"  # 例: "10"
    pods: "${MAX_PODS}"                   # 例: "30"

---
# LimitRange (Pod単位のデフォルト/最大値)
apiVersion: v1
kind: LimitRange
metadata:
  name: tenant-limits
  namespace: tenant-${TENANT_SLUG}
spec:
  limits:
    - type: Container
      max:
        cpu: "4"
        memory: "8Gi"
      min:
        cpu: "100m"
        memory: "128Mi"
      default:
        cpu: "500m"
        memory: "1Gi"
      defaultRequest:
        cpu: "250m"
        memory: "512Mi"

---
# NetworkPolicy (テナント間通信を遮断)
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: tenant-isolation
  namespace: tenant-${TENANT_SLUG}
spec:
  podSelector: {}
  policyTypes:
    - Ingress
    - Egress
  ingress:
    # 同一Namespace内からのみアクセス許可
    - from:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: tenant-${TENANT_SLUG}
    # プラットフォームサービスからのアクセス許可
    - from:
      - namespaceSelector:
          matchLabels:
            name: platform-services
  egress:
    # プラットフォームサービスへのアクセス許可
    - to:
      - namespaceSelector:
          matchLabels:
            name: platform-services
    # 外部API (GitHub, Anthropic等) へのHTTPS許可
    - to:
      - podSelector: {}
      ports:
        - protocol: TCP
          port: 443
    # DNS許可
    - to:
      - namespaceSelector:
          matchLabels:
            kubernetes.io/metadata.name: kube-system
      ports:
        - protocol: UDP
          port: 53

---
# ServiceAccount for Agent Pods
apiVersion: v1
kind: ServiceAccount
metadata:
  name: miyabi-agent-sa
  namespace: tenant-${TENANT_SLUG}

---
# Role (Namespace内のPod管理権限)
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: agent-pod-manager
  namespace: tenant-${TENANT_SLUG}
rules:
  - apiGroups: [""]
    resources: ["pods", "pods/log"]
    verbs: ["get", "list", "watch"]
  - apiGroups: [""]
    resources: ["pods/exec"]
    verbs: ["create"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: agent-pod-manager-binding
  namespace: tenant-${TENANT_SLUG}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: agent-pod-manager
subjects:
  - kind: ServiceAccount
    name: miyabi-agent-sa
    namespace: tenant-${TENANT_SLUG}
```

#### 2.2.2 Namespace管理TypeScript実装

```typescript
import * as k8s from '@kubernetes/client-node';
import { TenantQuota, PlanTier } from './types';

/**
 * Kubernetes Namespaceマネージャー
 */
export class K8sNamespaceManager {
  private k8sApi: k8s.CoreV1Api;
  private rbacApi: k8s.RbacAuthorizationV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();

    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    this.rbacApi = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
  }

  /**
   * テナント用Namespaceを作成
   */
  async createTenantNamespace(
    tenantId: string,
    tenantSlug: string,
    planTier: PlanTier,
    quota: TenantQuota
  ): Promise<void> {
    const namespaceName = getK8sNamespace(tenantSlug);

    try {
      // 1. Namespace作成
      await this.k8sApi.createNamespace({
        metadata: {
          name: namespaceName,
          labels: {
            'tenant-id': tenantId,
            'plan-tier': planTier,
            'managed-by': 'miyabi-platform'
          },
          annotations: {
            description: `Tenant namespace for ${tenantSlug}`,
            'created-at': new Date().toISOString()
          }
        }
      });

      // 2. ResourceQuota作成
      await this.k8sApi.createNamespacedResourceQuota(namespaceName, {
        metadata: {
          name: 'tenant-quota'
        },
        spec: {
          hard: {
            'requests.cpu': quota.k8sResourceQuota.requestsCpu,
            'requests.memory': quota.k8sResourceQuota.requestsMemory,
            'limits.cpu': quota.k8sResourceQuota.limitsCpu,
            'limits.memory': quota.k8sResourceQuota.limitsMemory,
            'persistentvolumeclaims': quota.k8sResourceQuota.persistentVolumeClaims.toString(),
            'pods': quota.k8sResourceQuota.pods.toString()
          }
        }
      });

      // 3. LimitRange作成
      await this.k8sApi.createNamespacedLimitRange(namespaceName, {
        metadata: {
          name: 'tenant-limits'
        },
        spec: {
          limits: [
            {
              type: 'Container',
              max: {
                cpu: '4',
                memory: '8Gi'
              },
              min: {
                cpu: '100m',
                memory: '128Mi'
              },
              default: {
                cpu: '500m',
                memory: '1Gi'
              },
              defaultRequest: {
                cpu: '250m',
                memory: '512Mi'
              }
            }
          ]
        }
      });

      // 4. NetworkPolicy作成
      const networkingApi = this.k8sApi.apiClient.requestFactory.createRequest(
        k8s.NetworkingV1Api
      );

      await networkingApi.createNamespacedNetworkPolicy(namespaceName, {
        metadata: {
          name: 'tenant-isolation'
        },
        spec: {
          podSelector: {},
          policyTypes: ['Ingress', 'Egress'],
          ingress: [
            {
              from: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      'kubernetes.io/metadata.name': namespaceName
                    }
                  }
                },
                {
                  namespaceSelector: {
                    matchLabels: {
                      name: 'platform-services'
                    }
                  }
                }
              ]
            }
          ],
          egress: [
            {
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      name: 'platform-services'
                    }
                  }
                }
              ]
            },
            {
              to: [{ podSelector: {} }],
              ports: [{ protocol: 'TCP', port: 443 }]
            },
            {
              to: [
                {
                  namespaceSelector: {
                    matchLabels: {
                      'kubernetes.io/metadata.name': 'kube-system'
                    }
                  }
                }
              ],
              ports: [{ protocol: 'UDP', port: 53 }]
            }
          ]
        }
      });

      // 5. ServiceAccount作成
      await this.k8sApi.createNamespacedServiceAccount(namespaceName, {
        metadata: {
          name: 'miyabi-agent-sa'
        }
      });

      // 6. Role作成
      await this.rbacApi.createNamespacedRole(namespaceName, {
        metadata: {
          name: 'agent-pod-manager'
        },
        rules: [
          {
            apiGroups: [''],
            resources: ['pods', 'pods/log'],
            verbs: ['get', 'list', 'watch']
          },
          {
            apiGroups: [''],
            resources: ['pods/exec'],
            verbs: ['create']
          }
        ]
      });

      // 7. RoleBinding作成
      await this.rbacApi.createNamespacedRoleBinding(namespaceName, {
        metadata: {
          name: 'agent-pod-manager-binding'
        },
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Role',
          name: 'agent-pod-manager'
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: 'miyabi-agent-sa',
            namespace: namespaceName
          }
        ]
      });

      console.log(`✅ Namespace created: ${namespaceName}`);
    } catch (error) {
      console.error(`❌ Failed to create namespace: ${namespaceName}`, error);
      throw error;
    }
  }

  /**
   * Namespace削除
   */
  async deleteTenantNamespace(tenantSlug: string): Promise<void> {
    const namespaceName = getK8sNamespace(tenantSlug);

    try {
      await this.k8sApi.deleteNamespace(namespaceName);
      console.log(`✅ Namespace deleted: ${namespaceName}`);
    } catch (error) {
      console.error(`❌ Failed to delete namespace: ${namespaceName}`, error);
      throw error;
    }
  }

  /**
   * ResourceQuota使用状況取得
   */
  async getResourceQuotaStatus(tenantSlug: string): Promise<k8s.V1ResourceQuotaStatus | undefined> {
    const namespaceName = getK8sNamespace(tenantSlug);

    try {
      const response = await this.k8sApi.readNamespacedResourceQuota(
        'tenant-quota',
        namespaceName
      );
      return response.body.status;
    } catch (error) {
      console.error(`❌ Failed to get quota status: ${namespaceName}`, error);
      return undefined;
    }
  }
}
```

---

## 3. テナント別設定管理

### 3.1 設定ストレージ設計

テナント設定は以下の3層で管理：

1. **データベース (PostgreSQL)**: 永続的設定
2. **Redis Cache**: 高速アクセス用キャッシュ
3. **Kubernetes ConfigMap/Secret**: Agent Pod実行時環境変数

```typescript
/**
 * テナント設定マネージャー
 */
export class TenantConfigManager {
  private db: TenantDatabaseClient;
  private redis: RedisClient;

  constructor(db: TenantDatabaseClient, redis: RedisClient) {
    this.db = db;
    this.redis = redis;
  }

  /**
   * テナント設定を取得
   * 1. Redisキャッシュをチェック
   * 2. キャッシュミスの場合、DBから取得してキャッシュ
   */
  async getTenantConfig(tenantId: string): Promise<Tenant> {
    const cacheKey = `tenant:config:${tenantId}`;

    // Redisキャッシュチェック
    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // DBから取得
    const tenant = await this.db.withPlatformSchema(async (client) => {
      const result = await client.query(
        'SELECT * FROM tenants WHERE tenant_id = $1 AND status != $2',
        [tenantId, TenantStatus.DELETED]
      );

      if (result.rows.length === 0) {
        throw new Error(`Tenant not found: ${tenantId}`);
      }

      return result.rows[0];
    });

    // Redisキャッシュに保存 (TTL: 5分)
    await this.redis.setex(cacheKey, 300, JSON.stringify(tenant));

    return tenant;
  }

  /**
   * テナント設定を更新
   * 1. DB更新
   * 2. Redisキャッシュ削除
   */
  async updateTenantConfig(
    tenantId: string,
    updates: Partial<Tenant>
  ): Promise<Tenant> {
    const updatedTenant = await this.db.withPlatformSchema(async (client) => {
      const setClauses: string[] = [];
      const values: unknown[] = [];
      let paramIndex = 1;

      if (updates.displayName !== undefined) {
        setClauses.push(`display_name = $${paramIndex++}`);
        values.push(updates.displayName);
      }

      if (updates.planTier !== undefined) {
        setClauses.push(`plan_tier = $${paramIndex++}`);
        values.push(updates.planTier);
      }

      if (updates.status !== undefined) {
        setClauses.push(`status = $${paramIndex++}`);
        values.push(updates.status);
      }

      if (updates.metadata !== undefined) {
        setClauses.push(`metadata = $${paramIndex++}`);
        values.push(JSON.stringify(updates.metadata));
      }

      setClauses.push(`updated_at = NOW()`);
      values.push(tenantId);

      const query = `
        UPDATE tenants
        SET ${setClauses.join(', ')}
        WHERE tenant_id = $${paramIndex}
        RETURNING *
      `;

      const result = await client.query(query, values);
      return result.rows[0];
    });

    // Redisキャッシュ削除
    const cacheKey = `tenant:config:${tenantId}`;
    await this.redis.del(cacheKey);

    return updatedTenant;
  }

  /**
   * テナントクォータを取得
   */
  async getTenantQuota(tenantId: string): Promise<TenantQuota> {
    const cacheKey = `tenant:quota:${tenantId}`;

    const cached = await this.redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const quota = await this.db.withPlatformSchema(async (client) => {
      const result = await client.query(
        'SELECT * FROM tenant_quotas WHERE tenant_id = $1',
        [tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error(`Quota not found for tenant: ${tenantId}`);
      }

      return result.rows[0];
    });

    await this.redis.setex(cacheKey, 300, JSON.stringify(quota));

    return quota;
  }

  /**
   * クォータ使用状況をチェック
   */
  async checkQuotaLimit(
    tenantId: string,
    quotaType: keyof TenantQuota,
    currentUsage: number
  ): Promise<{ allowed: boolean; limit: number; usage: number }> {
    const quota = await this.getTenantQuota(tenantId);
    const limit = quota[quotaType] as number;

    // -1は無制限を表す
    if (limit === -1) {
      return { allowed: true, limit: -1, usage: currentUsage };
    }

    const allowed = currentUsage < limit;

    return { allowed, limit, usage: currentUsage };
  }
}
```

### 3.2 環境変数管理 (Kubernetes Secret)

```typescript
import * as k8s from '@kubernetes/client-node';

/**
 * Kubernetes Secret Manager
 */
export class K8sSecretManager {
  private k8sApi: k8s.CoreV1Api;

  constructor() {
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
  }

  /**
   * テナント用Secret作成 (GitHub Token, DB接続情報等)
   */
  async createTenantSecrets(
    tenantSlug: string,
    secrets: {
      databaseUrl: string;
      anthropicApiKey?: string;
      githubToken?: string;
    }
  ): Promise<void> {
    const namespaceName = getK8sNamespace(tenantSlug);

    // Base64エンコード
    const secretData: Record<string, string> = {
      'database-url': Buffer.from(secrets.databaseUrl).toString('base64')
    };

    if (secrets.anthropicApiKey) {
      secretData['anthropic-api-key'] = Buffer.from(secrets.anthropicApiKey).toString('base64');
    }

    if (secrets.githubToken) {
      secretData['github-token'] = Buffer.from(secrets.githubToken).toString('base64');
    }

    await this.k8sApi.createNamespacedSecret(namespaceName, {
      metadata: {
        name: 'tenant-secrets'
      },
      type: 'Opaque',
      data: secretData
    });
  }

  /**
   * Secret更新
   */
  async updateTenantSecret(
    tenantSlug: string,
    key: string,
    value: string
  ): Promise<void> {
    const namespaceName = getK8sNamespace(tenantSlug);

    // 既存Secretを取得
    const { body: existingSecret } = await this.k8sApi.readNamespacedSecret(
      'tenant-secrets',
      namespaceName
    );

    // データ更新
    if (!existingSecret.data) {
      existingSecret.data = {};
    }

    existingSecret.data[key] = Buffer.from(value).toString('base64');

    // Secret更新
    await this.k8sApi.replaceNamespacedSecret(
      'tenant-secrets',
      namespaceName,
      existingSecret
    );
  }

  /**
   * Secret削除
   */
  async deleteTenantSecrets(tenantSlug: string): Promise<void> {
    const namespaceName = getK8sNamespace(tenantSlug);

    await this.k8sApi.deleteNamespacedSecret(
      'tenant-secrets',
      namespaceName
    );
  }
}
```

---

## 4. リソースクォータ制御設計

### 4.1 クォータエンフォースメント戦略

```typescript
/**
 * クォータエンフォーサー
 */
export class QuotaEnforcer {
  private configManager: TenantConfigManager;
  private redis: RedisClient;

  constructor(configManager: TenantConfigManager, redis: RedisClient) {
    this.configManager = configManager;
    this.redis = redis;
  }

  /**
   * Agent実行前のクォータチェック
   */
  async canExecuteAgent(tenantId: string): Promise<{
    allowed: boolean;
    reason?: string;
    quotaStatus: {
      hourlyLimit: number;
      hourlyUsage: number;
      concurrentLimit: number;
      concurrentUsage: number;
    };
  }> {
    const quota = await this.configManager.getTenantQuota(tenantId);

    // 1. 時間あたりの実行数チェック
    const hourlyUsage = await this.getHourlyExecutionCount(tenantId);
    if (quota.maxAgentExecutionsPerHour !== -1 &&
        hourlyUsage >= quota.maxAgentExecutionsPerHour) {
      return {
        allowed: false,
        reason: `Hourly execution limit reached (${quota.maxAgentExecutionsPerHour})`,
        quotaStatus: {
          hourlyLimit: quota.maxAgentExecutionsPerHour,
          hourlyUsage,
          concurrentLimit: quota.maxConcurrentAgents,
          concurrentUsage: await this.getConcurrentExecutionCount(tenantId)
        }
      };
    }

    // 2. 同時実行数チェック
    const concurrentUsage = await this.getConcurrentExecutionCount(tenantId);
    if (quota.maxConcurrentAgents !== -1 &&
        concurrentUsage >= quota.maxConcurrentAgents) {
      return {
        allowed: false,
        reason: `Concurrent execution limit reached (${quota.maxConcurrentAgents})`,
        quotaStatus: {
          hourlyLimit: quota.maxAgentExecutionsPerHour,
          hourlyUsage,
          concurrentLimit: quota.maxConcurrentAgents,
          concurrentUsage
        }
      };
    }

    return {
      allowed: true,
      quotaStatus: {
        hourlyLimit: quota.maxAgentExecutionsPerHour,
        hourlyUsage,
        concurrentLimit: quota.maxConcurrentAgents,
        concurrentUsage
      }
    };
  }

  /**
   * 時間あたりの実行数を取得 (Redis Sorted Set使用)
   */
  private async getHourlyExecutionCount(tenantId: string): Promise<number> {
    const key = `quota:hourly:${tenantId}`;
    const now = Date.now();
    const oneHourAgo = now - 3600000;

    // 1時間以内の実行を取得
    const count = await this.redis.zcount(key, oneHourAgo, now);

    return count;
  }

  /**
   * 同時実行数を取得
   */
  private async getConcurrentExecutionCount(tenantId: string): Promise<number> {
    const key = `quota:concurrent:${tenantId}`;

    const count = await this.redis.get(key);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Agent実行開始時にカウンタ更新
   */
  async recordExecutionStart(tenantId: string, executionId: string): Promise<void> {
    const now = Date.now();

    // 1. 時間あたりカウンタに追加 (Sorted Set)
    const hourlyKey = `quota:hourly:${tenantId}`;
    await this.redis.zadd(hourlyKey, now, executionId);
    // 2時間後に自動削除
    await this.redis.expire(hourlyKey, 7200);

    // 2. 同時実行カウンタをインクリメント
    const concurrentKey = `quota:concurrent:${tenantId}`;
    await this.redis.incr(concurrentKey);
    await this.redis.expire(concurrentKey, 3600); // 1時間のTTL
  }

  /**
   * Agent実行終了時にカウンタ更新
   */
  async recordExecutionEnd(tenantId: string): Promise<void> {
    const concurrentKey = `quota:concurrent:${tenantId}`;
    await this.redis.decr(concurrentKey);
  }

  /**
   * API Rate Limitチェック (Token Bucket Algorithm)
   */
  async checkApiRateLimit(tenantId: string): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: Date;
  }> {
    const quota = await this.configManager.getTenantQuota(tenantId);
    const limit = quota.maxApiCallsPerMinute;

    if (limit === -1) {
      return { allowed: true, remaining: -1, resetAt: new Date() };
    }

    const key = `ratelimit:api:${tenantId}`;
    const now = Math.floor(Date.now() / 1000);
    const windowStart = Math.floor(now / 60) * 60; // 1分単位
    const windowKey = `${key}:${windowStart}`;

    // 現在のウィンドウでのカウント取得
    const currentCount = await this.redis.get(windowKey);
    const count = currentCount ? parseInt(currentCount, 10) : 0;

    if (count >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: new Date((windowStart + 60) * 1000)
      };
    }

    // カウント増加
    await this.redis.incr(windowKey);
    await this.redis.expire(windowKey, 120); // 2分のTTL

    return {
      allowed: true,
      remaining: limit - count - 1,
      resetAt: new Date((windowStart + 60) * 1000)
    };
  }
}
```

### 4.2 プラン変更時のクォータ更新

```typescript
/**
 * プラン変更ハンドラー
 */
export class PlanChangeHandler {
  private db: TenantDatabaseClient;
  private k8sManager: K8sNamespaceManager;
  private configManager: TenantConfigManager;

  constructor(
    db: TenantDatabaseClient,
    k8sManager: K8sNamespaceManager,
    configManager: TenantConfigManager
  ) {
    this.db = db;
    this.k8sManager = k8sManager;
    this.configManager = configManager;
  }

  /**
   * プラン変更を実行
   */
  async changePlan(
    tenantId: string,
    newPlanTier: PlanTier
  ): Promise<void> {
    const tenant = await this.configManager.getTenantConfig(tenantId);

    // 1. テナント情報更新
    await this.configManager.updateTenantConfig(tenantId, {
      planTier: newPlanTier
    });

    // 2. クォータ更新
    const newQuota = DefaultQuotas[newPlanTier];
    await this.updateTenantQuota(tenantId, newQuota as TenantQuota);

    // 3. Kubernetes ResourceQuota更新
    await this.updateK8sResourceQuota(tenant.slug, newQuota as TenantQuota);

    console.log(`✅ Plan changed: ${tenant.slug} -> ${newPlanTier}`);
  }

  /**
   * データベースのクォータ更新
   */
  private async updateTenantQuota(
    tenantId: string,
    quota: Partial<TenantQuota>
  ): Promise<void> {
    await this.db.withPlatformSchema(async (client) => {
      await client.query(
        `
        UPDATE tenant_quotas
        SET
          max_agent_executions_per_hour = COALESCE($1, max_agent_executions_per_hour),
          max_concurrent_agents = COALESCE($2, max_concurrent_agents),
          max_storage_gb = COALESCE($3, max_storage_gb),
          max_api_calls_per_minute = COALESCE($4, max_api_calls_per_minute),
          max_projects = COALESCE($5, max_projects),
          max_members = COALESCE($6, max_members)
        WHERE tenant_id = $7
        `,
        [
          quota.maxAgentExecutionsPerHour,
          quota.maxConcurrentAgents,
          quota.maxStorageGB,
          quota.maxApiCallsPerMinute,
          quota.maxProjects,
          quota.maxMembers,
          tenantId
        ]
      );
    });
  }

  /**
   * Kubernetes ResourceQuota更新
   */
  private async updateK8sResourceQuota(
    tenantSlug: string,
    quota: Partial<TenantQuota>
  ): Promise<void> {
    if (!quota.k8sResourceQuota) return;

    const namespaceName = getK8sNamespace(tenantSlug);
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

    const { body: existingQuota } = await k8sApi.readNamespacedResourceQuota(
      'tenant-quota',
      namespaceName
    );

    if (existingQuota.spec?.hard) {
      existingQuota.spec.hard = {
        'requests.cpu': quota.k8sResourceQuota.requestsCpu,
        'requests.memory': quota.k8sResourceQuota.requestsMemory,
        'limits.cpu': quota.k8sResourceQuota.limitsCpu,
        'limits.memory': quota.k8sResourceQuota.limitsMemory,
        'persistentvolumeclaims': quota.k8sResourceQuota.persistentVolumeClaims.toString(),
        'pods': quota.k8sResourceQuota.pods.toString()
      };
    }

    await k8sApi.replaceNamespacedResourceQuota(
      'tenant-quota',
      namespaceName,
      existingQuota
    );
  }
}
```

---

## 5. テナント間データ分離実装

### 5.1 SQL Injection防止

```typescript
/**
 * 安全なスキーマ名検証
 */
export function validateSchemaName(schemaName: string): boolean {
  // PostgreSQL識別子規則に準拠
  const validPattern = /^tenant_[a-z0-9_]{1,55}$/;

  if (!validPattern.test(schemaName)) {
    throw new Error(`Invalid schema name: ${schemaName}`);
  }

  // SQLキーワードの禁止
  const sqlKeywords = [
    'select', 'insert', 'update', 'delete', 'drop', 'create',
    'alter', 'grant', 'revoke', 'union', 'where', 'from'
  ];

  const lowerSchemaName = schemaName.toLowerCase();
  for (const keyword of sqlKeywords) {
    if (lowerSchemaName.includes(keyword)) {
      throw new Error(`Schema name contains SQL keyword: ${schemaName}`);
    }
  }

  return true;
}

/**
 * 準備済みステートメント強制
 */
export class SafeTenantQuery {
  /**
   * 動的SQLを禁止し、常にパラメータ化クエリを使用
   */
  static async query<T>(
    client: PoolClient,
    queryText: string,
    values: unknown[]
  ): Promise<T[]> {
    // クエリテキスト内の${variable}を検出
    if (/\$\{.*\}/.test(queryText)) {
      throw new Error('Template literals in SQL are prohibited. Use parameterized queries.');
    }

    const result = await client.query(queryText, values);
    return result.rows;
  }
}
```

### 5.2 Row-Level Security (バックアップ)

```sql
-- RLS有効化 (Schema分離のバックアップとして機能)
-- platform.tenant_memberships テーブル

-- 1. RLS有効化
ALTER TABLE platform.tenant_memberships ENABLE ROW LEVEL SECURITY;

-- 2. ポリシー: ユーザーは自分が所属するテナントのメンバーシップのみ閲覧可能
CREATE POLICY tenant_membership_isolation_policy
  ON platform.tenant_memberships
  FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id
      FROM platform.tenant_memberships
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- 3. ポリシー: 管理者のみメンバーシップ変更可能
CREATE POLICY tenant_membership_admin_policy
  ON platform.tenant_memberships
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM platform.tenant_memberships
      WHERE user_id = current_setting('app.current_user_id')::uuid
        AND tenant_id = platform.tenant_memberships.tenant_id
        AND role IN ('owner', 'admin')
    )
  );
```

```typescript
/**
 * PostgreSQL設定でユーザーIDをセット (RLS用)
 */
export async function setCurrentUser(
  client: PoolClient,
  userId: string
): Promise<void> {
  await client.query(`SET app.current_user_id = '${userId}'`);
}
```

### 5.3 監査ログ (アクセス追跡)

```typescript
/**
 * 監査ログ記録
 */
export interface AuditLogEntry {
  logId: string;
  timestamp: Date;
  tenantId: string;
  userId: string;
  requestId: string;
  resourceType: string;
  resourceId?: string;
  action: string;
  ipAddress: string;
  userAgent: string;
  apiEndpoint: string;
  httpMethod: string;
  statusCode: number;
  responseTimeMs: number;
  authMethod: string;
  permissionChecked?: string;
  authorizationResult: boolean;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  private db: TenantDatabaseClient;

  constructor(db: TenantDatabaseClient) {
    this.db = db;
  }

  /**
   * 監査ログ記録 (非同期、非ブロッキング)
   */
  async log(entry: Omit<AuditLogEntry, 'logId' | 'timestamp'>): Promise<void> {
    // 非同期で記録 (メインリクエストをブロックしない)
    setImmediate(async () => {
      try {
        await this.db.withPlatformSchema(async (client) => {
          await client.query(
            `
            INSERT INTO audit.access_logs (
              tenant_id, user_id, request_id,
              resource_type, resource_id, action,
              ip_address, user_agent, api_endpoint, http_method,
              status_code, response_time_ms,
              auth_method, permission_checked, authorization_result,
              metadata
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            `,
            [
              entry.tenantId,
              entry.userId,
              entry.requestId,
              entry.resourceType,
              entry.resourceId,
              entry.action,
              entry.ipAddress,
              entry.userAgent,
              entry.apiEndpoint,
              entry.httpMethod,
              entry.statusCode,
              entry.responseTimeMs,
              entry.authMethod,
              entry.permissionChecked,
              entry.authorizationResult,
              JSON.stringify(entry.metadata || {})
            ]
          );
        });
      } catch (error) {
        console.error('Failed to write audit log:', error);
        // 監査ログ失敗をメトリクスに記録
      }
    });
  }
}
```

---

## 6. テナント管理API設計

### 6.1 RESTful API仕様

#### 6.1.1 テナント作成

**Endpoint**: `POST /api/v1/tenants`

**Request Body**:
```typescript
{
  "slug": "acme-corp",           // 必須: テナントスラッグ (DNS-safe)
  "displayName": "Acme Corp",    // 必須: 表示名
  "planTier": "pro",             // 必須: free, pro, enterprise
  "ownerEmail": "admin@acme.com",// 必須: オーナーメールアドレス
  "metadata": {                  // オプション
    "organization": {
      "name": "Acme Corporation",
      "industry": "Technology",
      "size": "51-200"
    }
  }
}
```

**Response (201 Created)**:
```typescript
{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "slug": "acme-corp",
  "displayName": "Acme Corp",
  "planTier": "pro",
  "status": "provisioning",
  "schemaName": "tenant_acme_corp",
  "k8sNamespace": "tenant-acme-corp",
  "createdAt": "2025-11-30T12:00:00Z",
  "quota": {
    "maxAgentExecutionsPerHour": 100,
    "maxConcurrentAgents": 10,
    "maxStorageGB": 50,
    "maxApiCallsPerMinute": 120
  }
}
```

**実装**:

```typescript
import express from 'express';
import { TenantProvisioner } from './tenant-provisioner';

const router = express.Router();

router.post('/api/v1/tenants', async (req, res) => {
  try {
    const { slug, displayName, planTier, ownerEmail, metadata } = req.body;

    // バリデーション
    if (!slug || !displayName || !planTier || !ownerEmail) {
      return res.status(400).json({
        error: 'Missing required fields'
      });
    }

    // スラッグ検証
    if (!/^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/.test(slug)) {
      return res.status(400).json({
        error: 'Invalid slug format (DNS-safe required)'
      });
    }

    // プラン検証
    if (!Object.values(PlanTier).includes(planTier)) {
      return res.status(400).json({
        error: 'Invalid plan tier'
      });
    }

    // テナントプロビジョニング
    const provisioner = new TenantProvisioner();
    const tenant = await provisioner.provisionTenant({
      slug,
      displayName,
      planTier,
      ownerEmail,
      metadata
    });

    res.status(201).json(tenant);
  } catch (error) {
    console.error('Tenant creation failed:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: (error as Error).message
    });
  }
});
```

#### 6.1.2 テナント情報取得

**Endpoint**: `GET /api/v1/tenants/:tenantId`

**Response (200 OK)**:
```typescript
{
  "tenantId": "123e4567-e89b-12d3-a456-426614174000",
  "slug": "acme-corp",
  "displayName": "Acme Corp",
  "planTier": "pro",
  "status": "active",
  "createdAt": "2025-11-30T12:00:00Z",
  "updatedAt": "2025-11-30T12:05:00Z",
  "quota": {
    "maxAgentExecutionsPerHour": 100,
    "hourlyUsage": 23,
    "maxConcurrentAgents": 10,
    "concurrentUsage": 2,
    "maxStorageGB": 50,
    "currentStorageGB": 12.5
  },
  "members": {
    "total": 15,
    "owners": 1,
    "admins": 2,
    "developers": 10,
    "viewers": 2
  }
}
```

#### 6.1.3 テナント更新

**Endpoint**: `PATCH /api/v1/tenants/:tenantId`

**Request Body**:
```typescript
{
  "displayName": "Acme Corporation",  // オプション
  "planTier": "enterprise",           // オプション
  "metadata": {                        // オプション
    "organization": {
      "name": "Acme Corporation"
    }
  }
}
```

#### 6.1.4 テナント削除

**Endpoint**: `DELETE /api/v1/tenants/:tenantId`

**Query Parameters**:
- `force=true`: 即座に削除 (デフォルトは論理削除)

**Response (202 Accepted)**:
```typescript
{
  "message": "Tenant deletion scheduled",
  "deletionScheduledAt": "2025-12-07T12:00:00Z",
  "gracePeriodDays": 7
}
```

### 6.2 テナントプロビジョニング実装

```typescript
/**
 * テナントプロビジョニングオーケストレーター
 */
export class TenantProvisioner {
  private db: TenantDatabaseClient;
  private k8sManager: K8sNamespaceManager;
  private secretManager: K8sSecretManager;

  constructor() {
    this.db = new TenantDatabaseClient(process.env.DATABASE_URL!);
    this.k8sManager = new K8sNamespaceManager();
    this.secretManager = new K8sSecretManager();
  }

  /**
   * テナント完全プロビジョニング
   */
  async provisionTenant(input: {
    slug: string;
    displayName: string;
    planTier: PlanTier;
    ownerEmail: string;
    metadata?: TenantMetadata;
  }): Promise<Tenant> {
    const tenantId = crypto.randomUUID();
    const schemaName = getTenantSchemaName(input.slug);
    const k8sNamespace = getK8sNamespace(input.slug);

    try {
      // 1. platform.tenants レコード作成
      const tenant = await this.createTenantRecord(tenantId, input, schemaName, k8sNamespace);

      // 2. PostgreSQL Schema作成
      await this.createTenantSchema(schemaName, tenantId);

      // 3. Kubernetes Namespace作成
      const quota = DefaultQuotas[input.planTier] as TenantQuota;
      await this.k8sManager.createTenantNamespace(
        tenantId,
        input.slug,
        input.planTier,
        quota
      );

      // 4. Kubernetes Secrets作成
      await this.secretManager.createTenantSecrets(input.slug, {
        databaseUrl: process.env.DATABASE_URL!
      });

      // 5. オーナーユーザー作成
      await this.createOwnerUser(tenantId, input.ownerEmail);

      // 6. クォータ設定
      await this.createTenantQuota(tenantId, quota);

      // 7. ステータスを active に更新
      await this.updateTenantStatus(tenantId, TenantStatus.ACTIVE);

      console.log(`✅ Tenant provisioned: ${input.slug}`);

      return tenant;
    } catch (error) {
      console.error(`❌ Tenant provisioning failed: ${input.slug}`, error);

      // ロールバック
      await this.rollbackProvisioning(tenantId, input.slug, schemaName);

      throw error;
    }
  }

  /**
   * テナントレコード作成
   */
  private async createTenantRecord(
    tenantId: string,
    input: {
      slug: string;
      displayName: string;
      planTier: PlanTier;
      metadata?: TenantMetadata;
    },
    schemaName: string,
    k8sNamespace: string
  ): Promise<Tenant> {
    return await this.db.withPlatformSchema(async (client) => {
      const result = await client.query(
        `
        INSERT INTO tenants (
          tenant_id, slug, display_name, plan_tier, status,
          schema_name, k8s_namespace, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
        `,
        [
          tenantId,
          input.slug,
          input.displayName,
          input.planTier,
          TenantStatus.PROVISIONING,
          schemaName,
          k8sNamespace,
          JSON.stringify(input.metadata || {})
        ]
      );

      return result.rows[0];
    });
  }

  /**
   * テナントスキーマ作成
   */
  private async createTenantSchema(schemaName: string, tenantId: string): Promise<void> {
    validateSchemaName(schemaName);

    await this.db.withPlatformSchema(async (client) => {
      // スキーマ作成SQLテンプレートを読み込み
      const schemaTemplate = readFileSync('./sql/create-tenant-schema.sql', 'utf-8');

      // プレースホルダー置換
      const sql = schemaTemplate
        .replace(/{schema_name}/g, schemaName)
        .replace(/{tenant_id}/g, tenantId);

      await client.query(sql);
    });
  }

  /**
   * オーナーユーザー作成
   */
  private async createOwnerUser(tenantId: string, email: string): Promise<void> {
    await this.db.withPlatformSchema(async (client) => {
      // ユーザー作成 (既存の場合は取得)
      let userId: string;

      const existingUser = await client.query(
        'SELECT user_id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        userId = existingUser.rows[0].user_id;
      } else {
        const newUser = await client.query(
          `
          INSERT INTO users (email, email_verified)
          VALUES ($1, false)
          RETURNING user_id
          `,
          [email]
        );
        userId = newUser.rows[0].user_id;
      }

      // メンバーシップ作成
      await client.query(
        `
        INSERT INTO tenant_memberships (
          tenant_id, user_id, role, invitation_status, joined_at
        ) VALUES ($1, $2, $3, $4, NOW())
        `,
        [tenantId, userId, TenantRole.OWNER, InvitationStatus.ACCEPTED]
      );
    });
  }

  /**
   * クォータ設定作成
   */
  private async createTenantQuota(tenantId: string, quota: Partial<TenantQuota>): Promise<void> {
    await this.db.withPlatformSchema(async (client) => {
      await client.query(
        `
        INSERT INTO tenant_quotas (
          tenant_id,
          max_agent_executions_per_hour,
          max_concurrent_agents,
          max_storage_gb,
          max_api_calls_per_minute,
          max_projects,
          max_members
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `,
        [
          tenantId,
          quota.maxAgentExecutionsPerHour,
          quota.maxConcurrentAgents,
          quota.maxStorageGB,
          quota.maxApiCallsPerMinute,
          quota.maxProjects,
          quota.maxMembers
        ]
      );
    });
  }

  /**
   * ステータス更新
   */
  private async updateTenantStatus(tenantId: string, status: TenantStatus): Promise<void> {
    await this.db.withPlatformSchema(async (client) => {
      await client.query(
        'UPDATE tenants SET status = $1, updated_at = NOW() WHERE tenant_id = $2',
        [status, tenantId]
      );
    });
  }

  /**
   * プロビジョニング失敗時のロールバック
   */
  private async rollbackProvisioning(
    tenantId: string,
    slug: string,
    schemaName: string
  ): Promise<void> {
    try {
      // 1. Namespace削除
      await this.k8sManager.deleteTenantNamespace(slug);
    } catch (error) {
      console.error('Rollback: Failed to delete namespace', error);
    }

    try {
      // 2. スキーマ削除
      await this.db.withPlatformSchema(async (client) => {
        await client.query(`DROP SCHEMA IF EXISTS ${schemaName} CASCADE`);
      });
    } catch (error) {
      console.error('Rollback: Failed to drop schema', error);
    }

    try {
      // 3. テナントレコード削除
      await this.db.withPlatformSchema(async (client) => {
        await client.query('DELETE FROM tenants WHERE tenant_id = $1', [tenantId]);
      });
    } catch (error) {
      console.error('Rollback: Failed to delete tenant record', error);
    }
  }
}
```

---

## 7. テナントライフサイクル管理

### 7.1 ライフサイクルステート遷移

```
┌─────────────┐
│ (Create)    │
└──────┬──────┘
       │
       ▼
┌─────────────────┐
│ PROVISIONING    │ ← 初期状態 (DB Schema, K8s Namespace作成中)
└──────┬──────────┘
       │
       ▼
┌─────────────────┐
│ ACTIVE          │ ← 通常運用状態
└──────┬──────────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│ SUSPENDED       │   │ PENDING_DELETION│
│ (一時停止)       │   │ (削除猶予期間)   │
└──────┬──────────┘   └──────┬──────────┘
       │                     │
       │                     ▼
       │              ┌─────────────────┐
       │              │ DELETED         │
       │              │ (完全削除済み)   │
       │              └─────────────────┘
       │
       ▼
┌─────────────────┐
│ ACTIVE          │ (復旧)
└─────────────────┘
```

### 7.2 一時停止 (Suspension)

**トリガー**:
- 支払い遅延
- 利用規約違反
- クォータ超過 (エンタープライズ以外)

```typescript
/**
 * テナント一時停止
 */
export class TenantSuspensionHandler {
  private db: TenantDatabaseClient;
  private k8sManager: K8sNamespaceManager;

  async suspendTenant(tenantId: string, reason: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);

    // 1. ステータスを SUSPENDED に変更
    await this.db.withPlatformSchema(async (client) => {
      await client.query(
        `
        UPDATE tenants
        SET status = $1, updated_at = NOW(),
            metadata = jsonb_set(
              metadata,
              '{suspension}',
              jsonb_build_object(
                'reason', $2,
                'suspendedAt', NOW()
              )
            )
        WHERE tenant_id = $3
        `,
        [TenantStatus.SUSPENDED, reason, tenantId]
      );
    });

    // 2. Kubernetes Namespace内のすべてのPodを削除 (リソース解放)
    const namespaceName = tenant.k8sNamespace;
    const kc = new k8s.KubeConfig();
    kc.loadFromDefault();
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api);

    await k8sApi.deleteCollectionNamespacedPod(namespaceName);

    // 3. API Gatewayでテナントをブロック (Redis)
    await this.blockTenantInGateway(tenantId);

    console.log(`✅ Tenant suspended: ${tenant.slug} (${reason})`);
  }

  /**
   * テナント復旧
   */
  async unsuspendTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);

    // 1. ステータスを ACTIVE に変更
    await this.db.withPlatformSchema(async (client) => {
      await client.query(
        `
        UPDATE tenants
        SET status = $1, updated_at = NOW(),
            metadata = metadata - 'suspension'
        WHERE tenant_id = $2
        `,
        [TenantStatus.ACTIVE, tenantId]
      );
    });

    // 2. API Gatewayのブロック解除
    await this.unblockTenantInGateway(tenantId);

    console.log(`✅ Tenant unsuspended: ${tenant.slug}`);
  }

  private async blockTenantInGateway(tenantId: string): Promise<void> {
    // Redisに一時停止テナントリストを保存
    const redis = new RedisClient();
    await redis.sadd('suspended_tenants', tenantId);
  }

  private async unblockTenantInGateway(tenantId: string): Promise<void> {
    const redis = new RedisClient();
    await redis.srem('suspended_tenants', tenantId);
  }
}
```

### 7.3 削除 (Deletion)

**削除フロー**:

1. **論理削除** (`PENDING_DELETION`): 猶予期間7日間
2. **物理削除** (`DELETED`): データ完全削除

```typescript
/**
 * テナント削除ハンドラー
 */
export class TenantDeletionHandler {
  private db: TenantDatabaseClient;
  private k8sManager: K8sNamespaceManager;

  /**
   * 論理削除 (猶予期間開始)
   */
  async softDeleteTenant(tenantId: string): Promise<void> {
    const deletionScheduledAt = new Date();
    deletionScheduledAt.setDate(deletionScheduledAt.getDate() + 7); // 7日後

    await this.db.withPlatformSchema(async (client) => {
      await client.query(
        `
        UPDATE tenants
        SET status = $1, updated_at = NOW(),
            metadata = jsonb_set(
              metadata,
              '{deletion}',
              jsonb_build_object(
                'scheduledAt', $2,
                'gracePeriodDays', 7
              )
            )
        WHERE tenant_id = $3
        `,
        [TenantStatus.PENDING_DELETION, deletionScheduledAt.toISOString(), tenantId]
      );
    });

    console.log(`✅ Tenant marked for deletion: ${tenantId} (scheduled: ${deletionScheduledAt})`);
  }

  /**
   * 物理削除 (完全削除)
   */
  async hardDeleteTenant(tenantId: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);

    try {
      // 1. Kubernetes Namespace削除
      await this.k8sManager.deleteTenantNamespace(tenant.slug);

      // 2. PostgreSQL Schema削除
      await this.db.withPlatformSchema(async (client) => {
        await client.query(`DROP SCHEMA IF EXISTS ${tenant.schemaName} CASCADE`);
      });

      // 3. テナントレコード削除 (メンバーシップ、クォータはCASCADE削除)
      await this.db.withPlatformSchema(async (client) => {
        await client.query(
          `
          UPDATE tenants
          SET status = $1, deleted_at = NOW(), updated_at = NOW()
          WHERE tenant_id = $2
          `,
          [TenantStatus.DELETED, tenantId]
        );
      });

      // 4. Redisキャッシュクリア
      await this.clearTenantCache(tenantId);

      console.log(`✅ Tenant hard deleted: ${tenant.slug}`);
    } catch (error) {
      console.error(`❌ Tenant hard deletion failed: ${tenant.slug}`, error);
      throw error;
    }
  }

  /**
   * 削除キャンセル (猶予期間中)
   */
  async cancelDeletion(tenantId: string): Promise<void> {
    await this.db.withPlatformSchema(async (client) => {
      await client.query(
        `
        UPDATE tenants
        SET status = $1, updated_at = NOW(),
            metadata = metadata - 'deletion'
        WHERE tenant_id = $2
        `,
        [TenantStatus.ACTIVE, tenantId]
      );
    });

    console.log(`✅ Tenant deletion cancelled: ${tenantId}`);
  }

  /**
   * バッチジョブ: 削除予定テナントの自動削除
   * 毎日1回実行 (Cron)
   */
  async processPendingDeletions(): Promise<void> {
    const now = new Date().toISOString();

    const tenantsToDelete = await this.db.withPlatformSchema(async (client) => {
      const result = await client.query(
        `
        SELECT tenant_id, slug, metadata
        FROM tenants
        WHERE status = $1
          AND (metadata->'deletion'->>'scheduledAt')::timestamp <= $2
        `,
        [TenantStatus.PENDING_DELETION, now]
      );
      return result.rows;
    });

    console.log(`Found ${tenantsToDelete.length} tenants to delete`);

    for (const tenant of tenantsToDelete) {
      try {
        await this.hardDeleteTenant(tenant.tenant_id);
      } catch (error) {
        console.error(`Failed to delete tenant: ${tenant.slug}`, error);
      }
    }
  }

  private async clearTenantCache(tenantId: string): Promise<void> {
    const redis = new RedisClient();
    await redis.del(`tenant:config:${tenantId}`);
    await redis.del(`tenant:quota:${tenantId}`);
  }
}
```

### 7.4 バックアップ・リストア

```typescript
/**
 * テナントバックアップマネージャー
 */
export class TenantBackupManager {
  private db: TenantDatabaseClient;

  /**
   * テナントスキーマのバックアップ
   */
  async backupTenantData(tenantId: string): Promise<string> {
    const tenant = await this.getTenant(tenantId);
    const backupPath = `/backups/${tenant.slug}_${Date.now()}.sql`;

    // pg_dump を使用してスキーマをダンプ
    await execAsync(
      `pg_dump -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ` +
      `-n ${tenant.schemaName} -f ${backupPath} ${process.env.DB_NAME}`
    );

    // S3にアップロード
    const s3Key = `tenant-backups/${tenant.slug}/${Date.now()}.sql.gz`;
    await this.uploadToS3(backupPath, s3Key);

    return s3Key;
  }

  /**
   * テナントスキーマのリストア
   */
  async restoreTenantData(tenantId: string, backupKey: string): Promise<void> {
    const tenant = await this.getTenant(tenantId);

    // S3からダウンロード
    const localPath = `/tmp/${Date.now()}.sql`;
    await this.downloadFromS3(backupKey, localPath);

    // スキーマを削除して再作成
    await this.db.withPlatformSchema(async (client) => {
      await client.query(`DROP SCHEMA IF EXISTS ${tenant.schemaName} CASCADE`);
      await client.query(`CREATE SCHEMA ${tenant.schemaName}`);
    });

    // pg_restore
    await execAsync(
      `psql -h ${process.env.DB_HOST} -U ${process.env.DB_USER} ` +
      `-d ${process.env.DB_NAME} -f ${localPath}`
    );
  }

  private async uploadToS3(localPath: string, s3Key: string): Promise<void> {
    // S3 SDK実装
  }

  private async downloadFromS3(s3Key: string, localPath: string): Promise<void> {
    // S3 SDK実装
  }
}
```

---

## 実装ロードマップ

### Phase 1: 基盤構築 (Week 1-4)

- [ ] PostgreSQL Platform Schema構築
- [ ] テナントプロビジョニングAPI実装
- [ ] Kubernetes Namespace管理実装
- [ ] 基本的なRBAC実装
- [ ] テナント設定管理 (Redis Cache)

### Phase 2: 認証・認可 (Week 5-8)

- [ ] OAuth2/OIDC認証基盤
- [ ] JWT発行・検証
- [ ] API Gateway統合 (Kong)
- [ ] 権限チェックミドルウェア
- [ ] 監査ログ実装

### Phase 3: クォータ・分離 (Week 9-12)

- [ ] クォータエンフォースメント実装
- [ ] Rate Limiting (API Gateway + Redis)
- [ ] Kubernetes ResourceQuota適用
- [ ] NetworkPolicy適用
- [ ] データ暗号化 (KMS統合)

### Phase 4: ライフサイクル管理 (Week 13-16)

- [ ] テナント一時停止・復旧
- [ ] テナント削除フロー (論理/物理)
- [ ] バックアップ・リストア機能
- [ ] プラン変更フロー
- [ ] 自動削除バッチジョブ

### Phase 5: 監視・運用 (Week 17-20)

- [ ] Prometheus メトリクス収集
- [ ] Grafana ダッシュボード構築
- [ ] アラート設定 (PagerDuty連携)
- [ ] ログ集約 (ELK Stack)
- [ ] コンプライアンスレポート自動生成

---

## セキュリティ考慮事項

### 1. データ暗号化

| レイヤー | 暗号化方式 | 鍵管理 |
|---------|----------|-------|
| **Database (at rest)** | PostgreSQL TDE (AES-256) | AWS RDS自動管理 |
| **Database (column)** | pgcrypto (AES-256-GCM) | AWS KMS (テナント別DEK) |
| **Object Storage** | S3 SSE-KMS | AWS KMS (テナント別CMK) |
| **Network (in transit)** | TLS 1.3 | Let's Encrypt (公開) / Private CA (内部) |

### 2. アクセス制御

- **認証**: OAuth2/OIDC, SAML 2.0
- **認可**: RBAC (Role-Based Access Control)
- **API**: JWT Bearer Token (RS256署名)
- **Database**: Schema分離 + RLS (バックアップ)
- **Kubernetes**: RBAC + NetworkPolicy

### 3. 脅威モデル

| 脅威 | 対策 |
|------|------|
| **テナント間データ漏洩** | Schema分離、NetworkPolicy、監査ログ |
| **SQL Injection** | 準備済みステートメント強制、スキーマ名検証 |
| **DDoS攻撃** | API Gateway Rate Limiting、Cloudflare |
| **認証情報漏洩** | Secret暗号化、KMS、定期ローテーション |
| **コンテナエスケープ** | SecurityContext、読み取り専用FS、非root実行 |
| **内部脅威** | 監査ログ、最小権限原則、MFA強制 |

### 4. コンプライアンス準拠

- **GDPR**: データポータビリティ、削除権、暗号化
- **SOC 2 Type II**: 監査ログ、アクセス制御、定期レビュー
- **ISO 27001**: ISMS文書化、リスク評価、インシデント対応
- **HIPAA** (将来): BAA、暗号化、監査証跡

---

## 付録

### A. プラン別機能マトリクス

| 機能 | Free | Pro | Enterprise |
|------|------|-----|-----------|
| Agent実行/時間 | 10 | 100 | 1,000 |
| 同時実行Agent | 2 | 10 | 50 |
| ストレージ | 1GB | 50GB | 500GB |
| API呼び出し/分 | 30 | 120 | 600 |
| プロジェクト数 | 3 | 50 | 無制限 |
| メンバー数 | 5 | 50 | 無制限 |
| SSO (SAML) | ✗ | ✗ | ✓ |
| カスタムドメイン | ✗ | ✗ | ✓ |
| 専用K8sクラスタ | ✗ | ✗ | ✓ |
| SLA保証 | ✗ | 99.5% | 99.9% |
| サポート | Community | Email | 24/7 Phone |

### B. データベーススキーマER図

```
┌─────────────────────────────────────────────────────────────┐
│ Platform Schema                                             │
│                                                              │
│  ┌──────────┐       ┌──────────────────┐       ┌─────────┐ │
│  │ tenants  │       │ tenant_memberships│      │ users   │ │
│  ├──────────┤       ├──────────────────┤       ├─────────┤ │
│  │ PK: id   │◄──────│ FK: tenant_id    │──────►│ PK: id  │ │
│  │    slug  │       │ FK: user_id      │       │    email│ │
│  │    plan  │       │     role         │       └─────────┘ │
│  └──────────┘       └──────────────────┘                    │
│       │                                                      │
│       │                                                      │
│       ▼                                                      │
│  ┌──────────────┐                                           │
│  │ tenant_quotas│                                           │
│  ├──────────────┤                                           │
│  │ FK: tenant_id│                                           │
│  │     max_exec │                                           │
│  │     max_cpu  │                                           │
│  └──────────────┘                                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Tenant Schema (tenant_acme_corp)                            │
│                                                              │
│  ┌──────────────┐                                           │
│  │ projects     │                                           │
│  ├──────────────┤                                           │
│  │ PK: id       │                                           │
│  │    name      │                                           │
│  │    repo_url  │                                           │
│  └──────┬───────┘                                           │
│         │                                                    │
│         │                                                    │
│         ▼                                                    │
│  ┌──────────────────┐       ┌──────────────────────┐       │
│  │ agent_executions │       │ github_integrations  │       │
│  ├──────────────────┤       ├──────────────────────┤       │
│  │ FK: project_id   │       │ FK: project_id       │       │
│  │     agent_type   │       │     token_encrypted  │       │
│  │     status       │       │     webhook_secret   │       │
│  └──────────────────┘       └──────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### C. 参考リンク

- [PostgreSQL Multi-Tenancy Best Practices](https://www.citusdata.com/blog/2017/03/09/multi-tenant-sharding-tutorial/)
- [Kubernetes Multi-Tenancy Working Group](https://github.com/kubernetes-sigs/multi-tenancy)
- [OWASP Multi-Tenant Security](https://cheatsheetseries.owasp.org/cheatsheets/Multitenant_Security_Cheat_Sheet.html)
- [AWS SaaS Architecture Patterns](https://docs.aws.amazon.com/prescriptive-guidance/latest/saas-multitenant-api-access-authorization/welcome.html)

---

**Document Version**: 1.0.0
**Last Updated**: 2025-11-30
**Authors**: Miyabi Platform Team
**Status**: Ready for Implementation Review
