# Enterprise Security Design Document

**Status**: Detailed Design
**Date**: 2025-11-30
**Related Issue**: #9 (Parent: #2 カクシン進化)
**Repository**: NozomuTajiri/shinka
**Version**: 1.0.0

---

## Executive Summary

This document defines the enterprise-grade security architecture for the Miyabi SaaS platform. It covers authentication, authorization, data protection, compliance, and incident response mechanisms necessary for enterprise customer acquisition and SOC 2 Type II certification.

### Security Objectives

1. **Confidentiality**: Protect tenant data from unauthorized access
2. **Integrity**: Ensure data accuracy and prevent unauthorized modification
3. **Availability**: Maintain 99.9% uptime SLA with DDoS protection
4. **Compliance**: SOC 2 Type II, GDPR, ISO 27001 readiness
5. **Auditability**: Complete audit trail for all data access and modifications

---

## 1. SSO/SAML 2.0 Integration Design

### 1.1 Overview

Enterprise customers require integration with their existing Identity Providers (IdP) such as Okta, Azure AD, Google Workspace, or on-premise Active Directory Federation Services (ADFS).

### 1.2 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    SSO Authentication Flow                       │
└─────────────────────────────────────────────────────────────────┘

Step 1: User Access
┌──────────┐
│  User    │  https://acme-corp.miyabi.example.com/login
└────┬─────┘
     │
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Miyabi Service Provider (SP)                                   │
│  - Detect tenant from subdomain (acme-corp)                     │
│  - Lookup tenant's IdP configuration                            │
│  - Generate SAML AuthnRequest                                   │
└────┬────────────────────────────────────────────────────────────┘
     │ Step 2: Redirect to IdP
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Customer's Identity Provider (IdP)                             │
│  (Okta, Azure AD, Google Workspace, ADFS)                       │
│                                                                  │
│  - User authenticates with corporate credentials                │
│  - Apply MFA if enabled                                         │
│  - Generate SAML Response with assertions                       │
└────┬────────────────────────────────────────────────────────────┘
     │ Step 3: SAML Response POST
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  Miyabi SP - Assertion Consumer Service (ACS)                   │
│  POST /saml/acs                                                 │
│                                                                  │
│  Validation Steps:                                               │
│  1. Verify XML signature with IdP's public certificate          │
│  2. Check Response is not expired (NotOnOrAfter)                │
│  3. Validate Audience (entityID matches)                        │
│  4. Verify InResponseTo matches original AuthnRequest ID        │
│  5. Check assertion conditions (NotBefore, NotOnOrAfter)        │
│  6. Validate Subject NameID format                              │
│  7. Extract user attributes (email, firstName, lastName)        │
└────┬────────────────────────────────────────────────────────────┘
     │ Step 4: Create session
     ▼
┌─────────────────────────────────────────────────────────────────┐
│  User Provisioning & Session Creation                           │
│                                                                  │
│  - Lookup user by email in platform.users                       │
│  - Create user if not exists (Just-In-Time provisioning)        │
│  - Issue JWT token with claims                                  │
│  - Redirect to application                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 1.3 SAML Configuration Data Model

```typescript
// Tenant SAML configuration (stored encrypted in DB)
interface SAMLConfiguration {
  tenantId: string;
  enabled: boolean;

  // Service Provider (Miyabi) settings
  sp: {
    entityId: string;  // e.g., "https://miyabi.example.com/saml/metadata/{tenant-slug}"
    assertionConsumerServiceUrl: string;  // e.g., "https://miyabi.example.com/saml/acs"
    singleLogoutServiceUrl: string;  // e.g., "https://miyabi.example.com/saml/sls"
    nameIdFormat: 'email' | 'persistent' | 'transient';
    wantAssertionsSigned: boolean;
    wantResponseSigned: boolean;
    signatureAlgorithm: 'sha256' | 'sha512';
    digestAlgorithm: 'sha256' | 'sha512';

    // SP certificate and private key (for signing AuthnRequests)
    certificate: string;  // PEM format
    privateKey: string;   // Encrypted at rest
  };

  // Identity Provider settings
  idp: {
    entityId: string;  // IdP's entity identifier
    ssoUrl: string;    // IdP's SSO endpoint
    sloUrl?: string;   // IdP's Single Logout endpoint (optional)
    certificate: string;  // IdP's public certificate for signature validation

    // Metadata (can auto-populate above fields)
    metadataUrl?: string;
    metadataXml?: string;
    metadataLastFetched?: Date;
  };

  // Attribute mapping (IdP attributes -> Miyabi user fields)
  attributeMapping: {
    email: string;      // e.g., "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
    firstName?: string; // e.g., "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
    lastName?: string;  // e.g., "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname"
    groups?: string;    // For SCIM group sync
  };

  // Just-In-Time (JIT) provisioning settings
  jitProvisioning: {
    enabled: boolean;
    defaultRole: 'viewer' | 'developer' | 'admin';  // Role for auto-provisioned users
    requireEmailDomain?: string[];  // Whitelist email domains
  };

  // Advanced settings
  advanced: {
    forceAuthn: boolean;  // Force re-authentication on each login
    allowIdpInitiated: boolean;  // Allow IdP-initiated SSO
    sessionDuration: number;  // JWT expiry in seconds
    enforceSso: boolean;  // Disable password login when SSO is configured
  };

  createdAt: Date;
  updatedAt: Date;
}
```

### 1.4 Database Schema

```sql
-- SAML configurations table (encrypted sensitive data)
CREATE TABLE platform.saml_configurations (
  config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id) ON DELETE CASCADE,

  enabled BOOLEAN DEFAULT FALSE,

  -- SP settings
  sp_entity_id VARCHAR(255) NOT NULL,
  sp_acs_url VARCHAR(255) NOT NULL,
  sp_sls_url VARCHAR(255),
  sp_name_id_format VARCHAR(50) DEFAULT 'email',
  sp_want_assertions_signed BOOLEAN DEFAULT TRUE,
  sp_want_response_signed BOOLEAN DEFAULT TRUE,
  sp_signature_algorithm VARCHAR(20) DEFAULT 'sha256',
  sp_certificate TEXT NOT NULL,
  sp_private_key_encrypted BYTEA NOT NULL,  -- Encrypted with tenant KEK

  -- IdP settings
  idp_entity_id VARCHAR(255) NOT NULL,
  idp_sso_url VARCHAR(255) NOT NULL,
  idp_slo_url VARCHAR(255),
  idp_certificate TEXT NOT NULL,
  idp_metadata_url VARCHAR(255),
  idp_metadata_xml TEXT,
  idp_metadata_last_fetched TIMESTAMP WITH TIME ZONE,

  -- Attribute mapping (JSONB for flexibility)
  attribute_mapping JSONB NOT NULL DEFAULT '{
    "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"
  }'::jsonb,

  -- JIT provisioning
  jit_enabled BOOLEAN DEFAULT TRUE,
  jit_default_role VARCHAR(50) DEFAULT 'developer',
  jit_allowed_email_domains TEXT[],

  -- Advanced settings
  force_authn BOOLEAN DEFAULT FALSE,
  allow_idp_initiated BOOLEAN DEFAULT FALSE,
  session_duration_seconds INTEGER DEFAULT 28800,  -- 8 hours
  enforce_sso BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(tenant_id)
);

-- SAML login sessions (track pending AuthnRequests)
CREATE TABLE platform.saml_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES platform.tenants(tenant_id),

  authn_request_id VARCHAR(255) NOT NULL UNIQUE,  -- SAML Request ID
  relay_state TEXT,  -- Original destination URL

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Cleanup expired sessions
  CONSTRAINT valid_expiry CHECK (expires_at > created_at)
);

CREATE INDEX idx_saml_sessions_request_id ON platform.saml_sessions(authn_request_id);
CREATE INDEX idx_saml_sessions_expires ON platform.saml_sessions(expires_at);
```

### 1.5 SAML Implementation

```typescript
import * as saml2 from 'saml2-js';
import crypto from 'crypto';

class SAMLAuthenticationService {
  /**
   * Initiate SAML SSO flow
   */
  async initiateLogin(tenantId: string, relayState?: string): Promise<string> {
    const config = await this.getSAMLConfig(tenantId);

    if (!config.enabled) {
      throw new Error('SAML SSO is not enabled for this tenant');
    }

    // Create SAML AuthnRequest
    const requestId = crypto.randomUUID();
    const authnRequest = this.createAuthnRequest(config, requestId);

    // Store session to validate response later
    await db.query(`
      INSERT INTO platform.saml_sessions (
        tenant_id, authn_request_id, relay_state, expires_at
      ) VALUES ($1, $2, $3, NOW() + INTERVAL '15 minutes')
    `, [tenantId, requestId, relayState]);

    // Return redirect URL to IdP
    return this.buildIdpRedirectUrl(config, authnRequest, relayState);
  }

  /**
   * Handle SAML assertion (ACS endpoint)
   */
  async handleAssertion(
    samlResponse: string,
    tenantId: string
  ): Promise<{ userId: string; jwt: string }> {
    const config = await this.getSAMLConfig(tenantId);

    // Step 1: Parse and validate SAML Response
    const assertion = await this.validateSAMLResponse(
      samlResponse,
      config
    );

    // Step 2: Extract user attributes
    const userAttributes = this.extractAttributes(assertion, config);

    // Step 3: Validate email domain (if configured)
    if (config.jitProvisioning.requireEmailDomain) {
      const emailDomain = userAttributes.email.split('@')[1];
      if (!config.jitProvisioning.requireEmailDomain.includes(emailDomain)) {
        throw new Error(`Email domain ${emailDomain} is not allowed`);
      }
    }

    // Step 4: Just-In-Time user provisioning
    const user = await this.provisionUser(
      tenantId,
      userAttributes,
      config.jitProvisioning.defaultRole
    );

    // Step 5: Create session and issue JWT
    const jwt = await this.createSession(user.userId, tenantId);

    // Step 6: Audit log
    await this.logSAMLLogin(tenantId, user.userId, assertion);

    return { userId: user.userId, jwt };
  }

  /**
   * Validate SAML Response (security-critical)
   */
  private async validateSAMLResponse(
    samlResponseXml: string,
    config: SAMLConfiguration
  ): Promise<any> {
    const sp = new saml2.ServiceProvider({
      entity_id: config.sp.entityId,
      assert_endpoint: config.sp.assertionConsumerServiceUrl,
      certificate: config.sp.certificate,
      private_key: await this.decryptPrivateKey(config.sp.privateKey)
    });

    const idp = new saml2.IdentityProvider({
      sso_login_url: config.idp.ssoUrl,
      certificates: [config.idp.certificate]
    });

    return new Promise((resolve, reject) => {
      sp.post_assert(idp, { request_body: { SAMLResponse: samlResponseXml } }, (err, samlAssert) => {
        if (err) {
          // Log validation error for security monitoring
          this.logSecurityEvent('saml_validation_failed', {
            error: err.message,
            tenantId: config.tenantId
          });
          return reject(new Error(`SAML validation failed: ${err.message}`));
        }

        // Additional validations
        const now = new Date();

        // Check NotBefore
        if (samlAssert.conditions?.not_before && new Date(samlAssert.conditions.not_before) > now) {
          return reject(new Error('SAML assertion not yet valid (NotBefore)'));
        }

        // Check NotOnOrAfter
        if (samlAssert.conditions?.not_on_or_after && new Date(samlAssert.conditions.not_on_or_after) <= now) {
          return reject(new Error('SAML assertion expired (NotOnOrAfter)'));
        }

        // Check Audience
        if (samlAssert.conditions?.audience !== config.sp.entityId) {
          return reject(new Error('SAML audience mismatch'));
        }

        resolve(samlAssert);
      });
    });
  }

  /**
   * Extract user attributes from SAML assertion
   */
  private extractAttributes(assertion: any, config: SAMLConfiguration): UserAttributes {
    const attributes = assertion.attributes || {};

    const email = attributes[config.attributeMapping.email]?.[0];
    if (!email) {
      throw new Error('Email attribute missing from SAML assertion');
    }

    return {
      email,
      firstName: attributes[config.attributeMapping.firstName]?.[0],
      lastName: attributes[config.attributeMapping.lastName]?.[0],
      groups: attributes[config.attributeMapping.groups] || []
    };
  }

  /**
   * Just-In-Time user provisioning
   */
  private async provisionUser(
    tenantId: string,
    attributes: UserAttributes,
    defaultRole: string
  ): Promise<{ userId: string }> {
    // Check if user exists
    let user = await db.query(`
      SELECT user_id FROM platform.users WHERE email = $1
    `, [attributes.email]);

    if (!user) {
      // Create new user
      user = await db.query(`
        INSERT INTO platform.users (email, email_verified)
        VALUES ($1, TRUE)
        RETURNING user_id
      `, [attributes.email]);

      // Add to tenant
      await db.query(`
        INSERT INTO platform.tenant_memberships (tenant_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (tenant_id, user_id) DO NOTHING
      `, [tenantId, user.user_id, defaultRole]);
    }

    return { userId: user.user_id };
  }

  /**
   * Single Logout (SLO) support
   */
  async handleLogout(tenantId: string, userId: string): Promise<string> {
    const config = await this.getSAMLConfig(tenantId);

    if (!config.idp.sloUrl) {
      // IdP doesn't support SLO, just clear local session
      await this.clearSession(userId);
      return '/login';
    }

    // Create SAML LogoutRequest
    const logoutRequest = this.createLogoutRequest(config, userId);

    // Clear local session
    await this.clearSession(userId);

    // Return redirect URL to IdP's SLO endpoint
    return this.buildIdpLogoutUrl(config, logoutRequest);
  }
}
```

### 1.6 SAML Configuration UI/API

```typescript
// Admin API endpoint to configure SAML
router.post('/api/v1/admin/saml/configure', async (req, res) => {
  const { tenantId } = req.user;

  // Only tenant owners can configure SAML
  await authorize(req.user.userId, tenantId, Permission['tenant:update']);

  const config: SAMLConfiguration = req.body;

  // Validate configuration
  await validateSAMLConfig(config);

  // Test connection to IdP (fetch metadata)
  if (config.idp.metadataUrl) {
    try {
      const metadata = await fetchIdpMetadata(config.idp.metadataUrl);
      config.idp.metadataXml = metadata.xml;
      config.idp.entityId = metadata.entityId;
      config.idp.ssoUrl = metadata.ssoUrl;
      config.idp.certificate = metadata.certificate;
      config.idp.metadataLastFetched = new Date();
    } catch (error) {
      return res.status(400).json({
        error: 'Failed to fetch IdP metadata',
        details: error.message
      });
    }
  }

  // Encrypt sensitive data before storage
  const encryptedPrivateKey = await encryptSensitiveData(
    config.sp.privateKey,
    tenantId
  );

  // Store in database
  await db.query(`
    INSERT INTO platform.saml_configurations (
      tenant_id, enabled,
      sp_entity_id, sp_acs_url, sp_sls_url, sp_name_id_format,
      sp_certificate, sp_private_key_encrypted,
      idp_entity_id, idp_sso_url, idp_slo_url, idp_certificate,
      idp_metadata_url, idp_metadata_xml, idp_metadata_last_fetched,
      attribute_mapping, jit_enabled, jit_default_role, jit_allowed_email_domains,
      enforce_sso
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
    ON CONFLICT (tenant_id) DO UPDATE SET
      enabled = EXCLUDED.enabled,
      sp_entity_id = EXCLUDED.sp_entity_id,
      /* ... update all fields ... */
      updated_at = NOW()
  `, [/* parameters */]);

  res.json({ success: true, message: 'SAML configuration saved' });
});
```

---

## 2. RBAC (Role-Based Access Control) Model

### 2.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                    Role Hierarchy                                │
└─────────────────────────────────────────────────────────────────┘

                        ┌──────────┐
                        │  OWNER   │  (Full control)
                        └────┬─────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
         ┌────▼─────┐                 ┌────▼─────┐
         │  ADMIN   │                 │ BILLING  │
         └────┬─────┘                 └──────────┘
              │
       ┌──────┴──────┐
       │             │
  ┌────▼─────┐  ┌───▼────────┐
  │DEVELOPER │  │   VIEWER   │
  └──────────┘  └────────────┘
```

### 2.2 Role Definitions

```typescript
enum Role {
  OWNER = 'owner',         // Tenant creator, full permissions
  ADMIN = 'admin',         // Manage users, projects, settings
  DEVELOPER = 'developer', // Execute agents, manage projects
  VIEWER = 'viewer',       // Read-only access
  BILLING = 'billing'      // Billing and subscription management only
}

enum Permission {
  // Tenant management
  'tenant:read' = 'tenant:read',
  'tenant:update' = 'tenant:update',
  'tenant:delete' = 'tenant:delete',

  // User management
  'user:list' = 'user:list',
  'user:invite' = 'user:invite',
  'user:update' = 'user:update',
  'user:remove' = 'user:remove',

  // Project management
  'project:create' = 'project:create',
  'project:read' = 'project:read',
  'project:update' = 'project:update',
  'project:delete' = 'project:delete',

  // Agent execution
  'agent:execute' = 'agent:execute',
  'agent:view' = 'agent:view',
  'agent:cancel' = 'agent:cancel',
  'agent:configure' = 'agent:configure',

  // GitHub integration
  'github:connect' = 'github:connect',
  'github:disconnect' = 'github:disconnect',
  'github:view' = 'github:view',

  // Billing
  'billing:view' = 'billing:view',
  'billing:update' = 'billing:update',

  // Audit logs
  'audit:view' = 'audit:view',
  'audit:export' = 'audit:export',

  // Security settings
  'security:view' = 'security:view',
  'security:update' = 'security:update',
  'security:saml' = 'security:saml',
  'security:api-keys' = 'security:api-keys'
}
```

### 2.3 Permission Matrix

```typescript
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.OWNER]: [
    // All permissions
    ...Object.values(Permission)
  ],

  [Role.ADMIN]: [
    Permission['tenant:read'],
    Permission['tenant:update'],

    Permission['user:list'],
    Permission['user:invite'],
    Permission['user:update'],
    Permission['user:remove'],

    Permission['project:create'],
    Permission['project:read'],
    Permission['project:update'],
    Permission['project:delete'],

    Permission['agent:execute'],
    Permission['agent:view'],
    Permission['agent:cancel'],
    Permission['agent:configure'],

    Permission['github:connect'],
    Permission['github:disconnect'],
    Permission['github:view'],

    Permission['billing:view'],

    Permission['audit:view'],
    Permission['audit:export'],

    Permission['security:view'],
    Permission['security:update'],
    Permission['security:api-keys']
  ],

  [Role.DEVELOPER]: [
    Permission['tenant:read'],

    Permission['user:list'],

    Permission['project:create'],
    Permission['project:read'],
    Permission['project:update'],

    Permission['agent:execute'],
    Permission['agent:view'],
    Permission['agent:cancel'],

    Permission['github:view']
  ],

  [Role.VIEWER]: [
    Permission['tenant:read'],
    Permission['user:list'],
    Permission['project:read'],
    Permission['agent:view'],
    Permission['github:view']
  ],

  [Role.BILLING]: [
    Permission['billing:view'],
    Permission['billing:update']
  ]
};
```

### 2.4 Authorization Middleware

```typescript
/**
 * Express middleware to enforce RBAC
 */
function requirePermission(...requiredPermissions: Permission[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { userId, tenantId } = req.user;

    if (!userId || !tenantId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Get user's role in this tenant
      const membership = await db.query(`
        SELECT role FROM platform.tenant_memberships
        WHERE user_id = $1 AND tenant_id = $2
      `, [userId, tenantId]);

      if (!membership) {
        return res.status(403).json({ error: 'Not a member of this tenant' });
      }

      const userRole = membership.role as Role;
      const userPermissions = ROLE_PERMISSIONS[userRole];

      // Check if user has all required permissions
      const hasPermission = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasPermission) {
        // Log authorization failure for security monitoring
        await auditLog({
          tenantId,
          userId,
          action: 'authorization_denied',
          resourceType: req.path,
          metadata: {
            requiredPermissions,
            userRole,
            userPermissions
          }
        });

        return res.status(403).json({
          error: 'Insufficient permissions',
          required: requiredPermissions,
          userRole
        });
      }

      // Authorization successful
      req.user.role = userRole;
      req.user.permissions = userPermissions;
      next();
    } catch (error) {
      next(error);
    }
  };
}

// Usage example
router.delete(
  '/api/v1/projects/:projectId',
  authenticate,
  requirePermission(Permission['project:delete']),
  async (req, res) => {
    // Project deletion logic
  }
);
```

### 2.5 Fine-Grained Access Control (Resource-Level)

```typescript
/**
 * Check if user can access a specific resource
 */
async function canAccessResource(
  userId: string,
  tenantId: string,
  resourceType: 'project' | 'agent_execution',
  resourceId: string,
  permission: Permission
): Promise<boolean> {
  // Step 1: Check RBAC permission
  const hasRolePermission = await hasPermission(userId, tenantId, permission);
  if (!hasRolePermission) {
    return false;
  }

  // Step 2: Check resource ownership (optional, for more granular control)
  // Developers can only access projects they created
  if (permission === Permission['project:delete']) {
    const project = await db.query(`
      SELECT created_by FROM tenant_${tenantId}.projects
      WHERE project_id = $1
    `, [resourceId]);

    if (project.created_by !== userId) {
      // Only project creator or admin/owner can delete
      const membership = await db.query(`
        SELECT role FROM platform.tenant_memberships
        WHERE user_id = $1 AND tenant_id = $2
      `, [userId, tenantId]);

      if (!['owner', 'admin'].includes(membership.role)) {
        return false;
      }
    }
  }

  return true;
}
```

### 2.6 API Key-Based Access (Machine-to-Machine)

```typescript
// API keys for programmatic access (CLI, CI/CD)
interface APIKey {
  keyId: string;
  tenantId: string;
  userId: string;
  name: string;
  keyHash: string;  // bcrypt hash of the key
  permissions: Permission[];  // Scoped permissions
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
}

// Generate API key
async function createAPIKey(
  userId: string,
  tenantId: string,
  name: string,
  permissions: Permission[],
  expiresIn?: number  // seconds
): Promise<{ keyId: string; secretKey: string }> {
  const keyId = `myk_${crypto.randomUUID().replace(/-/g, '')}`;
  const secretKey = crypto.randomBytes(32).toString('base64url');
  const keyHash = await bcrypt.hash(secretKey, 12);

  const expiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null;

  await db.query(`
    INSERT INTO platform.api_keys (
      key_id, tenant_id, user_id, name, key_hash, permissions, expires_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)
  `, [keyId, tenantId, userId, name, keyHash, JSON.stringify(permissions), expiresAt]);

  // Return key ONCE (never stored in plaintext)
  return { keyId, secretKey: `${keyId}.${secretKey}` };
}

// Validate API key
async function validateAPIKey(apiKey: string): Promise<{ userId: string; tenantId: string; permissions: Permission[] }> {
  const [keyId, secretKey] = apiKey.split('.');

  const key = await db.query(`
    SELECT tenant_id, user_id, key_hash, permissions, expires_at
    FROM platform.api_keys
    WHERE key_id = $1
  `, [keyId]);

  if (!key) {
    throw new Error('Invalid API key');
  }

  if (key.expires_at && new Date() > key.expires_at) {
    throw new Error('API key expired');
  }

  const valid = await bcrypt.compare(secretKey, key.key_hash);
  if (!valid) {
    throw new Error('Invalid API key');
  }

  // Update last used timestamp
  await db.query(`
    UPDATE platform.api_keys
    SET last_used_at = NOW()
    WHERE key_id = $1
  `, [keyId]);

  return {
    userId: key.user_id,
    tenantId: key.tenant_id,
    permissions: JSON.parse(key.permissions)
  };
}
```

---

## 3. Audit Logging Design (GDPR/SOC2 Compliance)

### 3.1 Audit Log Requirements

**Compliance Standards**:
- **SOC 2 Type II**: Comprehensive logging of all data access and modifications
- **GDPR Article 30**: Records of processing activities
- **ISO 27001**: Security event logging and monitoring

**Key Requirements**:
1. **Immutability**: Logs cannot be modified or deleted
2. **Completeness**: All security-relevant events logged
3. **Retention**: Minimum 1 year (7 years for financial data)
4. **Searchability**: Fast queries by tenant, user, resource, time range
5. **Integrity**: Tamper-evident (cryptographic hashing)

### 3.2 Audit Log Schema

```sql
-- Comprehensive audit log (immutable, partitioned by time)
CREATE TABLE audit.access_logs (
  log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- WHO
  tenant_id UUID NOT NULL,
  user_id UUID,  -- nullable for system actions
  user_email VARCHAR(255),  -- Denormalized for faster search
  user_ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),

  -- WHAT
  action VARCHAR(100) NOT NULL,  -- e.g., 'user.login', 'project.create', 'agent.execute'
  resource_type VARCHAR(50),     -- e.g., 'project', 'agent_execution', 'user'
  resource_id UUID,

  -- HOW
  api_endpoint TEXT,
  http_method VARCHAR(10),
  http_status INTEGER,

  -- CONTEXT
  request_id VARCHAR(36) NOT NULL,  -- Correlate across services
  auth_method VARCHAR(50),  -- 'jwt', 'saml', 'api_key'
  permission_checked VARCHAR(100),
  authorization_result BOOLEAN,

  -- PERFORMANCE
  response_time_ms INTEGER,
  request_size_bytes INTEGER,
  response_size_bytes INTEGER,

  -- DATA CHANGES (for write operations)
  old_value JSONB,  -- Previous state
  new_value JSONB,  -- New state
  changes JSONB,    -- Diff

  -- SECURITY
  security_event_type VARCHAR(50),  -- 'failed_login', 'privilege_escalation', 'suspicious_activity'
  risk_score INTEGER,  -- 0-100

  -- METADATA
  metadata JSONB,

  -- TAMPER DETECTION
  previous_log_hash VARCHAR(64),  -- SHA-256 hash of previous log entry
  log_hash VARCHAR(64)  -- SHA-256 hash of this entry
) PARTITION BY RANGE (timestamp);

-- Monthly partitions for performance
CREATE TABLE audit.access_logs_2025_12 PARTITION OF audit.access_logs
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Prevent updates/deletes (immutability)
CREATE OR REPLACE RULE audit_no_update AS
  ON UPDATE TO audit.access_logs
  DO INSTEAD NOTHING;

CREATE OR REPLACE RULE audit_no_delete AS
  ON DELETE TO audit.access_logs
  DO INSTEAD NOTHING;

-- Indexes for fast queries
CREATE INDEX idx_access_logs_tenant_time ON audit.access_logs (tenant_id, timestamp DESC);
CREATE INDEX idx_access_logs_user_time ON audit.access_logs (user_id, timestamp DESC);
CREATE INDEX idx_access_logs_resource ON audit.access_logs (resource_type, resource_id);
CREATE INDEX idx_access_logs_action ON audit.access_logs (action);
CREATE INDEX idx_access_logs_security ON audit.access_logs (security_event_type) WHERE security_event_type IS NOT NULL;
CREATE INDEX idx_access_logs_request_id ON audit.access_logs (request_id);
```

### 3.3 Audit Log Events

```typescript
enum AuditEventType {
  // Authentication
  USER_LOGIN = 'user.login',
  USER_LOGIN_FAILED = 'user.login.failed',
  USER_LOGOUT = 'user.logout',
  USER_SESSION_EXPIRED = 'user.session.expired',

  // Authorization
  PERMISSION_DENIED = 'authorization.denied',
  PERMISSION_GRANTED = 'authorization.granted',

  // User management
  USER_CREATED = 'user.created',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_INVITED = 'user.invited',
  USER_ROLE_CHANGED = 'user.role.changed',

  // Project management
  PROJECT_CREATED = 'project.created',
  PROJECT_UPDATED = 'project.updated',
  PROJECT_DELETED = 'project.deleted',
  PROJECT_ACCESSED = 'project.accessed',

  // Agent execution
  AGENT_STARTED = 'agent.started',
  AGENT_COMPLETED = 'agent.completed',
  AGENT_FAILED = 'agent.failed',
  AGENT_CANCELLED = 'agent.cancelled',

  // Security
  API_KEY_CREATED = 'api_key.created',
  API_KEY_REVOKED = 'api_key.revoked',
  SAML_CONFIGURED = 'saml.configured',
  PASSWORD_CHANGED = 'password.changed',
  MFA_ENABLED = 'mfa.enabled',
  MFA_DISABLED = 'mfa.disabled',

  // Data access
  SENSITIVE_DATA_ACCESSED = 'data.sensitive.accessed',
  SENSITIVE_DATA_EXPORTED = 'data.sensitive.exported',

  // Billing
  SUBSCRIPTION_CREATED = 'billing.subscription.created',
  SUBSCRIPTION_CHANGED = 'billing.subscription.changed',
  PAYMENT_METHOD_ADDED = 'billing.payment_method.added',

  // System
  SYSTEM_ERROR = 'system.error',
  RATE_LIMIT_EXCEEDED = 'system.rate_limit.exceeded'
}
```

### 3.4 Audit Logging Implementation

```typescript
class AuditLogger {
  private previousLogHash: string | null = null;

  /**
   * Log an audit event
   */
  async log(event: AuditEvent): Promise<void> {
    const logEntry = {
      timestamp: new Date(),
      tenantId: event.tenantId,
      userId: event.userId,
      userEmail: event.userEmail,
      userIpAddress: event.ipAddress,
      userAgent: event.userAgent,
      sessionId: event.sessionId,

      action: event.action,
      resourceType: event.resourceType,
      resourceId: event.resourceId,

      apiEndpoint: event.apiEndpoint,
      httpMethod: event.httpMethod,
      httpStatus: event.httpStatus,

      requestId: event.requestId,
      authMethod: event.authMethod,
      permissionChecked: event.permission,
      authorizationResult: event.authorized,

      responseTimeMs: event.responseTime,
      requestSizeBytes: event.requestSize,
      responseSizeBytes: event.responseSize,

      oldValue: event.oldValue ? JSON.stringify(event.oldValue) : null,
      newValue: event.newValue ? JSON.stringify(event.newValue) : null,
      changes: event.changes ? JSON.stringify(event.changes) : null,

      securityEventType: event.securityEventType,
      riskScore: event.riskScore,

      metadata: event.metadata ? JSON.stringify(event.metadata) : null,

      previousLogHash: this.previousLogHash
    };

    // Calculate hash for tamper detection (chain of custody)
    const logHash = this.calculateLogHash(logEntry);
    logEntry.logHash = logHash;

    // Store in database
    await db.query(`
      INSERT INTO audit.access_logs (
        timestamp, tenant_id, user_id, user_email, user_ip_address, user_agent, session_id,
        action, resource_type, resource_id,
        api_endpoint, http_method, http_status,
        request_id, auth_method, permission_checked, authorization_result,
        response_time_ms, request_size_bytes, response_size_bytes,
        old_value, new_value, changes,
        security_event_type, risk_score,
        metadata,
        previous_log_hash, log_hash
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28
      )
    `, Object.values(logEntry));

    // Update previous hash for next entry
    this.previousLogHash = logHash;

    // Send to SIEM if security event
    if (event.securityEventType) {
      await this.sendToSIEM(logEntry);
    }
  }

  /**
   * Calculate SHA-256 hash for tamper detection
   */
  private calculateLogHash(logEntry: any): string {
    const data = JSON.stringify(logEntry, Object.keys(logEntry).sort());
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify log chain integrity
   */
  async verifyLogIntegrity(startTime: Date, endTime: Date): Promise<boolean> {
    const logs = await db.query(`
      SELECT log_id, previous_log_hash, log_hash
      FROM audit.access_logs
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp ASC
    `, [startTime, endTime]);

    for (let i = 1; i < logs.length; i++) {
      if (logs[i].previous_log_hash !== logs[i - 1].log_hash) {
        // Log chain broken - potential tampering detected!
        await this.alertSecurityTeam('Log chain integrity violation detected');
        return false;
      }
    }

    return true;
  }

  /**
   * Export audit logs for compliance (GDPR data portability)
   */
  async exportLogs(
    tenantId: string,
    startDate: Date,
    endDate: Date,
    format: 'json' | 'csv'
  ): Promise<string> {
    const logs = await db.query(`
      SELECT * FROM audit.access_logs
      WHERE tenant_id = $1
        AND timestamp >= $2
        AND timestamp <= $3
      ORDER BY timestamp ASC
    `, [tenantId, startDate, endDate]);

    if (format === 'csv') {
      return this.convertToCSV(logs);
    }

    return JSON.stringify(logs, null, 2);
  }
}

// Express middleware for automatic audit logging
function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  const requestId = req.id || crypto.randomUUID();
  req.id = requestId;

  // Capture original res.send
  const originalSend = res.send;
  res.send = function (data) {
    res.send = originalSend;

    // Log after response sent (async)
    setImmediate(async () => {
      const responseTime = Date.now() - startTime;

      await auditLogger.log({
        tenantId: req.user?.tenantId,
        userId: req.user?.userId,
        userEmail: req.user?.email,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        sessionId: req.session?.id,

        action: `${req.method}.${req.path}`,
        resourceType: extractResourceType(req.path),
        resourceId: req.params.id,

        apiEndpoint: req.path,
        httpMethod: req.method,
        httpStatus: res.statusCode,

        requestId,
        authMethod: req.user?.authMethod,
        permission: req.permission,
        authorized: res.statusCode < 400,

        responseTime,
        requestSize: JSON.stringify(req.body).length,
        responseSize: Buffer.byteLength(data),

        metadata: {
          queryParams: req.query,
          routeParams: req.params
        }
      });
    });

    return originalSend.call(this, data);
  };

  next();
}
```

### 3.5 Audit Log Retention Policy

```typescript
// Automated log retention and archival
class AuditLogRetentionManager {
  /**
   * Archive old logs to cold storage (S3 Glacier)
   */
  async archiveOldLogs(): Promise<void> {
    const archiveThreshold = new Date();
    archiveThreshold.setMonth(archiveThreshold.getMonth() - 12);  // 1 year

    // Export logs older than 1 year to S3 Glacier
    const logs = await db.query(`
      SELECT * FROM audit.access_logs
      WHERE timestamp < $1
    `, [archiveThreshold]);

    if (logs.length === 0) return;

    // Upload to S3 Glacier (encrypted)
    const archive = JSON.stringify(logs);
    const encrypted = await this.encryptArchive(archive);

    await s3.putObject({
      Bucket: 'miyabi-audit-logs-archive',
      Key: `audit-logs-${archiveThreshold.toISOString()}.json.enc`,
      Body: encrypted,
      StorageClass: 'GLACIER',
      ServerSideEncryption: 'aws:kms',
      SSEKMSKeyId: 'arn:aws:kms:us-east-1:123456789012:key/audit-log-key'
    }).promise();

    // Delete archived logs from hot storage (keep 1 year)
    await db.query(`
      DELETE FROM audit.access_logs
      WHERE timestamp < $1
    `, [archiveThreshold]);
  }

  /**
   * Restore archived logs (for compliance audits)
   */
  async restoreArchivedLogs(startDate: Date, endDate: Date): Promise<any[]> {
    // Initiate Glacier restore
    const objects = await s3.listObjectsV2({
      Bucket: 'miyabi-audit-logs-archive',
      Prefix: 'audit-logs-'
    }).promise();

    const relevantArchives = objects.Contents.filter(obj => {
      const archiveDate = new Date(obj.Key.match(/audit-logs-(.+)\.json/)[1]);
      return archiveDate >= startDate && archiveDate <= endDate;
    });

    // Restore from Glacier (can take 1-5 hours)
    for (const archive of relevantArchives) {
      await s3.restoreObject({
        Bucket: 'miyabi-audit-logs-archive',
        Key: archive.Key,
        RestoreRequest: {
          Days: 7,
          GlacierJobParameters: {
            Tier: 'Expedited'  // 1-5 minutes (vs Standard: 3-5 hours)
          }
        }
      }).promise();
    }

    // Wait for restore completion...
    // (In practice, this would be async with notification)

    return [];
  }
}
```

---

## 4. Data Encryption Design

### 4.1 Encryption at Rest

```
┌─────────────────────────────────────────────────────────────────┐
│                 Encryption at Rest Architecture                  │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────┐
│  Application Layer                                             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Tenant Data Encryption Service                          │ │
│  │                                                           │ │
│  │  1. Retrieve tenant-specific DEK (Data Encryption Key)  │ │
│  │  2. Encrypt sensitive fields (AES-256-GCM)              │ │
│  │  3. Store encrypted data in database                    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  Key Management Layer (AWS KMS / Google Cloud KMS)             │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Root Key (KMS-managed, auto-rotated annually)          │ │
│  │           ▼                                               │ │
│  │  Tenant KEK (Key Encryption Key)                         │ │
│  │           ▼                                               │ │
│  │  Tenant DEK (Data Encryption Key, encrypted with KEK)    │ │
│  └──────────────────────────────────────────────────────────┘ │
└────────────────────┬───────────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────────────┐
│  Data Layer                                                     │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  PostgreSQL (TDE enabled)                                │ │
│  │  - Database-level encryption (tablespace encryption)     │ │
│  │  - Column-level encryption (sensitive fields)            │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  Object Storage (S3/GCS)                                 │ │
│  │  - Server-Side Encryption (SSE-KMS)                      │ │
│  │  - Tenant-specific CMK (Customer Managed Keys)           │ │
│  └──────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Hierarchy Design

```typescript
/**
 * Three-tier key hierarchy for tenant data isolation
 */
class EncryptionKeyManager {
  private kmsClient: AWS.KMS;

  /**
   * Level 1: Root Key (KMS-managed)
   * - Managed by AWS KMS
   * - Auto-rotated annually
   * - Never leaves KMS
   */
  private ROOT_KEY_ARN = 'arn:aws:kms:us-east-1:123456789012:key/root-key-id';

  /**
   * Level 2: Tenant KEK (Key Encryption Key)
   * - Generated per tenant
   * - Encrypted with Root Key
   * - Stored in database
   * - Rotated annually
   */
  async createTenantKEK(tenantId: string): Promise<string> {
    // Generate 256-bit key
    const kek = crypto.randomBytes(32);

    // Encrypt KEK with KMS root key
    const encryptedKEK = await this.kmsClient.encrypt({
      KeyId: this.ROOT_KEY_ARN,
      Plaintext: kek,
      EncryptionContext: {
        TenantId: tenantId,
        Purpose: 'tenant-kek'
      }
    }).promise();

    // Store encrypted KEK in database
    await db.query(`
      INSERT INTO platform.tenant_encryption_keys (
        tenant_id, kek_encrypted, created_at
      ) VALUES ($1, $2, NOW())
    `, [tenantId, encryptedKEK.CiphertextBlob]);

    return encryptedKEK.CiphertextBlob.toString('base64');
  }

  /**
   * Level 3: Tenant DEK (Data Encryption Key)
   * - Generated on-demand or cached
   * - Encrypted with Tenant KEK
   * - Used for actual data encryption
   * - Rotated quarterly
   */
  async getTenantDEK(tenantId: string): Promise<Buffer> {
    // Check cache first
    const cached = await redisClient.get(`dek:${tenantId}`);
    if (cached) {
      return Buffer.from(cached, 'base64');
    }

    // Retrieve encrypted KEK from database
    const row = await db.query(`
      SELECT kek_encrypted FROM platform.tenant_encryption_keys
      WHERE tenant_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [tenantId]);

    if (!row) {
      throw new Error(`No encryption key found for tenant ${tenantId}`);
    }

    // Decrypt KEK using KMS
    const decryptedKEK = await this.kmsClient.decrypt({
      CiphertextBlob: Buffer.from(row.kek_encrypted, 'base64'),
      EncryptionContext: {
        TenantId: tenantId,
        Purpose: 'tenant-kek'
      }
    }).promise();

    const kek = decryptedKEK.Plaintext as Buffer;

    // Derive DEK from KEK using HKDF
    const dek = crypto.hkdfSync('sha256', kek, Buffer.from(tenantId), 'data-encryption', 32);

    // Cache for 1 hour
    await redisClient.set(`dek:${tenantId}`, dek.toString('base64'), 'EX', 3600);

    return dek;
  }

  /**
   * Rotate tenant encryption keys (annual process)
   */
  async rotateKeys(tenantId: string): Promise<void> {
    // Step 1: Generate new KEK
    const newKEK = await this.createTenantKEK(tenantId);

    // Step 2: Re-encrypt all sensitive data with new key
    // (This is a background job due to volume)
    await this.enqueueReEncryptionJob(tenantId);

    // Step 3: Mark old key for deletion (after re-encryption completes)
    await db.query(`
      UPDATE platform.tenant_encryption_keys
      SET deprecated_at = NOW(), delete_after = NOW() + INTERVAL '90 days'
      WHERE tenant_id = $1 AND created_at < NOW() - INTERVAL '1 year'
    `, [tenantId]);
  }
}
```

### 4.3 Field-Level Encryption

```typescript
/**
 * Encrypt sensitive fields before storing in database
 */
class FieldEncryptionService {
  /**
   * Encrypt a string value
   */
  async encrypt(plaintext: string, tenantId: string): Promise<Buffer> {
    const dek = await encryptionKeyManager.getTenantDEK(tenantId);

    // Generate random IV (Initialization Vector)
    const iv = crypto.randomBytes(12);  // 96 bits for GCM

    // Encrypt using AES-256-GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
    const encrypted = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final()
    ]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Format: [IV (12 bytes)][Auth Tag (16 bytes)][Ciphertext (variable)]
    return Buffer.concat([iv, authTag, encrypted]);
  }

  /**
   * Decrypt a value
   */
  async decrypt(ciphertext: Buffer, tenantId: string): Promise<string> {
    const dek = await encryptionKeyManager.getTenantDEK(tenantId);

    // Extract IV, auth tag, and ciphertext
    const iv = ciphertext.slice(0, 12);
    const authTag = ciphertext.slice(12, 28);
    const encrypted = ciphertext.slice(28);

    // Decrypt using AES-256-GCM
    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }
}

// Usage example: Encrypt GitHub token before storage
async function storeGitHubIntegration(
  tenantId: string,
  projectId: string,
  githubToken: string,
  webhookSecret: string
) {
  const encryptedToken = await fieldEncryption.encrypt(githubToken, tenantId);
  const encryptedSecret = await fieldEncryption.encrypt(webhookSecret, tenantId);

  await db.query(`
    INSERT INTO tenant_${tenantId}.github_integrations (
      project_id, github_token_encrypted, webhook_secret_encrypted
    ) VALUES ($1, $2, $3)
  `, [projectId, encryptedToken, encryptedSecret]);
}
```

### 4.4 Encryption in Transit

```typescript
/**
 * TLS 1.3 configuration for all services
 */
const TLS_CONFIG = {
  minVersion: 'TLSv1.3',
  ciphers: [
    'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'TLS_AES_128_GCM_SHA256'
  ].join(':'),
  honorCipherOrder: true,

  // HSTS (HTTP Strict Transport Security)
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
  }
};

// Mutual TLS (mTLS) for internal service-to-service communication
const MTLS_CONFIG = {
  ...TLS_CONFIG,
  requestCert: true,
  rejectUnauthorized: true,
  ca: fs.readFileSync('/etc/certs/internal-ca.crt'),
  cert: fs.readFileSync('/etc/certs/service.crt'),
  key: fs.readFileSync('/etc/certs/service.key')
};

// Express server with TLS
const server = https.createServer(TLS_CONFIG, app);
server.listen(443);
```

### 4.5 Database-Level Encryption

```sql
-- PostgreSQL Transparent Data Encryption (TDE) setup
-- (Using pgcrypto extension for column-level encryption)

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Encrypt sensitive column on insert
CREATE OR REPLACE FUNCTION encrypt_sensitive_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Encrypt API keys, tokens, secrets
  IF TG_TABLE_NAME = 'github_integrations' THEN
    NEW.github_token_encrypted = pgp_sym_encrypt(
      NEW.github_token_encrypted::text,
      current_setting('app.encryption_key'),
      'cipher-algo=aes256'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Decrypt on select (using view)
CREATE VIEW tenant_abc123.github_integrations_decrypted AS
SELECT
  integration_id,
  project_id,
  pgp_sym_decrypt(
    github_token_encrypted,
    current_setting('app.encryption_key')
  )::text AS github_token,
  repository_owner,
  repository_name
FROM tenant_abc123.github_integrations;
```

---

## 5. Compliance Design (SOC 2 Type II Preparation)

### 5.1 SOC 2 Trust Service Criteria

```
┌────────────────────────────────────────────────────────────────┐
│           SOC 2 Trust Service Criteria (TSC)                   │
└────────────────────────────────────────────────────────────────┘

1. Security (Common Criteria - Required for all SOC 2 reports)
   ├─ CC1: Control Environment
   ├─ CC2: Communication and Information
   ├─ CC3: Risk Assessment
   ├─ CC4: Monitoring Activities
   ├─ CC5: Control Activities
   ├─ CC6: Logical and Physical Access Controls
   └─ CC7: System Operations

2. Availability (Optional)
   └─ A1: Availability commitments and system requirements

3. Processing Integrity (Optional)
   └─ PI1: Processing integrity commitments

4. Confidentiality (Optional)
   └─ C1: Confidentiality commitments

5. Privacy (Optional - GDPR alignment)
   └─ P1-P8: Privacy commitments
```

### 5.2 Control Implementation Matrix

```typescript
interface SOC2Control {
  controlId: string;
  criterion: 'CC1' | 'CC2' | 'CC3' | 'CC4' | 'CC5' | 'CC6' | 'CC7' | 'A1' | 'C1';
  description: string;
  implementation: string;
  evidence: string[];
  frequency: 'continuous' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  automatedCheck: boolean;
  responsible: string;
}

const SOC2_CONTROLS: SOC2Control[] = [
  // CC6.1: Logical Access Controls
  {
    controlId: 'CC6.1.1',
    criterion: 'CC6',
    description: 'User access is restricted to authorized individuals',
    implementation: 'RBAC system with role-based permissions, JWT authentication, SAML SSO',
    evidence: [
      'User access matrix (platform.tenant_memberships table)',
      'Role permission mappings (ROLE_PERMISSIONS constant)',
      'Audit logs of access grants/revocations (audit.access_logs)',
      'Quarterly user access reviews'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'Security Team'
  },

  {
    controlId: 'CC6.1.2',
    criterion: 'CC6',
    description: 'Authentication mechanisms verify user identity',
    implementation: 'Password hashing (bcrypt), MFA, SAML 2.0, API key authentication',
    evidence: [
      'Authentication code (SAMLAuthenticationService)',
      'Password policy configuration',
      'MFA enrollment records',
      'Failed login attempt logs'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'Engineering Team'
  },

  // CC6.2: Session Management
  {
    controlId: 'CC6.2.1',
    criterion: 'CC6',
    description: 'User sessions are terminated after defined periods of inactivity',
    implementation: 'JWT expiration (8 hours), automatic session cleanup',
    evidence: [
      'JWT expiration configuration (session_duration_seconds)',
      'Session cleanup job logs',
      'Session timeout audit logs'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'Engineering Team'
  },

  // CC6.6: Encryption
  {
    controlId: 'CC6.6.1',
    criterion: 'CC6',
    description: 'Data at rest is encrypted',
    implementation: 'AES-256-GCM encryption, KMS key management, PostgreSQL TDE',
    evidence: [
      'Encryption service code (FieldEncryptionService)',
      'KMS key rotation logs',
      'Database encryption configuration',
      'Annual penetration test reports'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'Security Team'
  },

  {
    controlId: 'CC6.6.2',
    criterion: 'CC6',
    description: 'Data in transit is encrypted',
    implementation: 'TLS 1.3 for all external connections, mTLS for internal services',
    evidence: [
      'TLS configuration (TLS_CONFIG)',
      'SSL Labs scan results',
      'Certificate renewal logs',
      'Network traffic analysis reports'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'DevOps Team'
  },

  // CC6.7: Transmission of Data
  {
    controlId: 'CC6.7.1',
    criterion: 'CC6',
    description: 'Transmission of data uses approved encryption',
    implementation: 'TLS 1.3 with approved cipher suites',
    evidence: [
      'TLS cipher configuration',
      'Quarterly SSL/TLS scans',
      'Network security audit reports'
    ],
    frequency: 'quarterly',
    automatedCheck: true,
    responsible: 'Security Team'
  },

  // CC7.2: Detection and Mitigation of Security Events
  {
    controlId: 'CC7.2.1',
    criterion: 'CC7',
    description: 'Security events are detected, logged, and investigated',
    implementation: 'Comprehensive audit logging, SIEM integration, automated alerts',
    evidence: [
      'Audit log schema (audit.access_logs)',
      'SIEM configuration',
      'Security incident tickets',
      'Monthly security review reports'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'Security Operations Team'
  },

  // CC7.3: Change Management
  {
    controlId: 'CC7.3.1',
    criterion: 'CC7',
    description: 'Changes to infrastructure and software are authorized and tested',
    implementation: 'Pull request reviews, automated testing, staging environment',
    evidence: [
      'GitHub pull request logs',
      'CI/CD pipeline execution logs',
      'Change approval records',
      'Production deployment logs'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'Engineering Team'
  },

  // A1.1: Availability
  {
    controlId: 'A1.1.1',
    criterion: 'A1',
    description: 'System availability meets defined SLA (99.9%)',
    implementation: 'K8s HA, load balancing, auto-scaling, health checks',
    evidence: [
      'Uptime monitoring dashboard (Grafana)',
      'Monthly uptime reports',
      'Incident post-mortems',
      'SLA compliance reports'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'SRE Team'
  },

  // C1.1: Confidentiality
  {
    controlId: 'C1.1.1',
    criterion: 'C1',
    description: 'Confidential data is protected from unauthorized disclosure',
    implementation: 'Multi-tenant isolation, encryption, access controls',
    evidence: [
      'Tenant isolation design (Schema-per-Tenant)',
      'Network policy configuration',
      'Encryption implementation',
      'Annual penetration test reports'
    ],
    frequency: 'continuous',
    automatedCheck: true,
    responsible: 'Security Team'
  }
];
```

### 5.3 Automated Compliance Monitoring

```typescript
/**
 * Continuous compliance monitoring service
 */
class ComplianceMonitor {
  /**
   * Run all automated compliance checks
   */
  async runComplianceChecks(): Promise<ComplianceReport> {
    const results: ComplianceCheckResult[] = [];

    // CC6.1.1: User access restrictions
    results.push(await this.checkUserAccessControls());

    // CC6.1.2: Authentication mechanisms
    results.push(await this.checkAuthenticationStrength());

    // CC6.2.1: Session management
    results.push(await this.checkSessionTimeouts());

    // CC6.6.1: Data at rest encryption
    results.push(await this.checkEncryptionAtRest());

    // CC6.6.2: Data in transit encryption
    results.push(await this.checkEncryptionInTransit());

    // CC7.2.1: Security event logging
    results.push(await this.checkAuditLogging());

    // A1.1.1: Availability SLA
    results.push(await this.checkAvailabilitySLA());

    // C1.1.1: Confidentiality protections
    results.push(await this.checkTenantIsolation());

    const passedChecks = results.filter(r => r.passed).length;
    const totalChecks = results.length;
    const complianceScore = (passedChecks / totalChecks) * 100;

    return {
      timestamp: new Date(),
      complianceScore,
      passed: complianceScore === 100,
      results,
      recommendations: this.generateRecommendations(results)
    };
  }

  /**
   * Check user access controls (CC6.1.1)
   */
  private async checkUserAccessControls(): Promise<ComplianceCheckResult> {
    // Verify no users have excessive permissions
    const suspiciousAccess = await db.query(`
      SELECT user_id, COUNT(DISTINCT tenant_id) as tenant_count
      FROM platform.tenant_memberships
      GROUP BY user_id
      HAVING COUNT(DISTINCT tenant_id) > 10
    `);

    return {
      controlId: 'CC6.1.1',
      name: 'User Access Controls',
      passed: suspiciousAccess.length === 0,
      details: suspiciousAccess.length === 0
        ? 'All users have appropriate access levels'
        : `${suspiciousAccess.length} users have access to >10 tenants (review required)`,
      evidence: suspiciousAccess
    };
  }

  /**
   * Check encryption at rest (CC6.6.1)
   */
  private async checkEncryptionAtRest(): Promise<ComplianceCheckResult> {
    // Verify all sensitive fields are encrypted
    const unencryptedSecrets = await db.query(`
      SELECT COUNT(*) as count
      FROM information_schema.columns
      WHERE column_name LIKE '%token%'
        OR column_name LIKE '%secret%'
        OR column_name LIKE '%password%'
      AND column_name NOT LIKE '%encrypted'
      AND data_type != 'bytea'
    `);

    return {
      controlId: 'CC6.6.1',
      name: 'Data Encryption at Rest',
      passed: unencryptedSecrets.count === 0,
      details: unencryptedSecrets.count === 0
        ? 'All sensitive fields are encrypted'
        : `${unencryptedSecrets.count} potentially unencrypted sensitive columns found`,
      evidence: unencryptedSecrets
    };
  }

  /**
   * Check availability SLA (A1.1.1)
   */
  private async checkAvailabilitySLA(): Promise<ComplianceCheckResult> {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);

    // Calculate uptime from health check logs
    const uptime = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'healthy') * 100.0 / COUNT(*) as uptime_percentage
      FROM monitoring.health_checks
      WHERE timestamp > $1
    `, [last30Days]);

    const uptimePercentage = uptime.uptime_percentage || 0;
    const meetsSOC2 = uptimePercentage >= 99.9;

    return {
      controlId: 'A1.1.1',
      name: 'Availability SLA (99.9%)',
      passed: meetsSOC2,
      details: `Current uptime: ${uptimePercentage.toFixed(3)}%`,
      evidence: { uptimePercentage, last30Days }
    };
  }

  /**
   * Generate compliance report (for auditors)
   */
  async generateAuditReport(startDate: Date, endDate: Date): Promise<string> {
    const report = {
      reportPeriod: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      },

      controls: await Promise.all(SOC2_CONTROLS.map(async (control) => ({
        ...control,
        status: 'implemented',
        evidenceCollected: await this.collectEvidence(control, startDate, endDate)
      }))),

      securityIncidents: await this.getSecurityIncidents(startDate, endDate),

      changeLog: await this.getChangeLog(startDate, endDate),

      accessReviews: await this.getAccessReviews(startDate, endDate),

      vulnerabilityScans: await this.getVulnerabilityScans(startDate, endDate)
    };

    return JSON.stringify(report, null, 2);
  }
}
```

### 5.4 GDPR Compliance Features

```typescript
/**
 * GDPR compliance service
 */
class GDPRComplianceService {
  /**
   * Right to Access (Article 15)
   * User can download all their personal data
   */
  async exportUserData(userId: string): Promise<any> {
    return {
      user: await db.query(`SELECT * FROM platform.users WHERE user_id = $1`, [userId]),
      tenantMemberships: await db.query(`SELECT * FROM platform.tenant_memberships WHERE user_id = $1`, [userId]),
      auditLogs: await db.query(`SELECT * FROM audit.access_logs WHERE user_id = $1`, [userId]),
      // ... all other user data
    };
  }

  /**
   * Right to Erasure (Article 17 - "Right to be Forgotten")
   * Delete all user data (except legal retention requirements)
   */
  async deleteUserData(userId: string): Promise<void> {
    // Step 1: Export data for retention (legal requirement)
    const userData = await this.exportUserData(userId);
    await this.archiveForLegalRetention(userId, userData);

    // Step 2: Anonymize audit logs (can't delete due to SOC 2)
    await db.query(`
      UPDATE audit.access_logs
      SET user_email = 'deleted-user@example.com',
          user_id = NULL,
          metadata = jsonb_set(metadata, '{gdpr_deleted}', 'true')
      WHERE user_id = $1
    `, [userId]);

    // Step 3: Delete user account
    await db.query(`DELETE FROM platform.users WHERE user_id = $1`, [userId]);
  }

  /**
   * Data Processing Register (Article 30)
   * Maintain record of all data processing activities
   */
  async getDataProcessingRegister(): Promise<any> {
    return [
      {
        activity: 'User Authentication',
        purpose: 'Identify users and grant access',
        dataCategories: ['Email', 'Password Hash', 'Session Tokens'],
        recipients: ['Internal Systems'],
        retention: '3 years after account deletion',
        legalBasis: 'Contract (Article 6(1)(b))'
      },
      {
        activity: 'Audit Logging',
        purpose: 'Security monitoring and compliance',
        dataCategories: ['User ID', 'IP Address', 'Actions Performed'],
        recipients: ['Internal Security Team', 'External Auditors'],
        retention: '7 years (SOC 2 requirement)',
        legalBasis: 'Legitimate Interest (Article 6(1)(f))'
      },
      // ... more activities
    ];
  }
}
```

---

## 6. Penetration Testing Plan

### 6.1 Testing Scope

```typescript
interface PenetrationTestPlan {
  frequency: 'quarterly' | 'annually';
  scope: string[];
  methodology: 'blackbox' | 'whitebox' | 'greybox';
  standards: string[];
  deliverables: string[];
}

const PENTEST_PLAN: PenetrationTestPlan = {
  frequency: 'annually',
  scope: [
    'External web application (https://miyabi.example.com)',
    'API endpoints (/api/v1/*)',
    'Authentication system (JWT, SAML)',
    'Agent execution environment (Kubernetes)',
    'Multi-tenant isolation',
    'Data encryption implementation',
    'Infrastructure (cloud configuration)'
  ],
  methodology: 'greybox',
  standards: [
    'OWASP Top 10 (2021)',
    'OWASP API Security Top 10',
    'SANS Top 25',
    'CWE/SANS Top 25 Most Dangerous Software Errors'
  ],
  deliverables: [
    'Executive summary report',
    'Detailed technical findings with CVSS scores',
    'Proof-of-concept exploits',
    'Remediation recommendations',
    'Retest report after fixes'
  ]
};
```

### 6.2 Testing Checklist

```
┌────────────────────────────────────────────────────────────────┐
│           Penetration Testing Checklist                        │
└────────────────────────────────────────────────────────────────┘

Authentication & Authorization
├─ [ ] JWT token security (algorithm confusion, signature bypass)
├─ [ ] SAML assertion injection
├─ [ ] Session fixation/hijacking
├─ [ ] Password reset flow vulnerabilities
├─ [ ] MFA bypass techniques
├─ [ ] API key exposure
└─ [ ] RBAC privilege escalation

Multi-Tenancy
├─ [ ] Cross-tenant data access (IDOR)
├─ [ ] Subdomain takeover
├─ [ ] Schema isolation bypass
├─ [ ] Namespace isolation in Kubernetes
└─ [ ] Resource quota bypass

Injection Attacks
├─ [ ] SQL injection (all input points)
├─ [ ] NoSQL injection (JSONB fields)
├─ [ ] Command injection (agent execution)
├─ [ ] XML injection (SAML)
├─ [ ] LDAP injection (if applicable)
└─ [ ] Template injection

API Security
├─ [ ] Rate limiting bypass
├─ [ ] GraphQL introspection/depth attacks
├─ [ ] REST API mass assignment
├─ [ ] API versioning vulnerabilities
└─ [ ] CORS misconfiguration

Cryptography
├─ [ ] Weak encryption algorithms
├─ [ ] Hardcoded secrets in code
├─ [ ] Insecure random number generation
├─ [ ] Certificate validation bypass
└─ [ ] Timing attacks on encryption

Business Logic
├─ [ ] Agent execution abuse (resource exhaustion)
├─ [ ] Billing manipulation
├─ [ ] Workflow bypass (skip review steps)
└─ [ ] Race conditions

Infrastructure
├─ [ ] Cloud storage exposure (S3 buckets)
├─ [ ] Kubernetes API access
├─ [ ] Container escape
├─ [ ] Network segmentation bypass
└─ [ ] Secrets in environment variables
```

### 6.3 Vulnerability Management Process

```typescript
/**
 * Vulnerability severity classification (CVSS v3.1)
 */
enum VulnerabilitySeverity {
  CRITICAL = 'critical',  // CVSS 9.0-10.0
  HIGH = 'high',          // CVSS 7.0-8.9
  MEDIUM = 'medium',      // CVSS 4.0-6.9
  LOW = 'low',            // CVSS 0.1-3.9
  INFO = 'info'           // CVSS 0.0
}

/**
 * SLA for vulnerability remediation
 */
const REMEDIATION_SLA: Record<VulnerabilitySeverity, number> = {
  [VulnerabilitySeverity.CRITICAL]: 1,   // 1 day
  [VulnerabilitySeverity.HIGH]: 7,       // 7 days
  [VulnerabilitySeverity.MEDIUM]: 30,    // 30 days
  [VulnerabilitySeverity.LOW]: 90,       // 90 days
  [VulnerabilitySeverity.INFO]: 0        // No SLA
};

interface Vulnerability {
  id: string;
  title: string;
  severity: VulnerabilitySeverity;
  cvss: number;
  cwe: string;  // CWE-79, CWE-89, etc.
  affectedComponent: string;
  description: string;
  proofOfConcept?: string;
  remediation: string;
  discoveredAt: Date;
  remediatedAt?: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

class VulnerabilityManager {
  /**
   * Track vulnerability remediation
   */
  async trackVulnerability(vuln: Vulnerability): Promise<void> {
    const deadline = new Date(vuln.discoveredAt);
    deadline.setDate(deadline.getDate() + REMEDIATION_SLA[vuln.severity]);

    await db.query(`
      INSERT INTO security.vulnerabilities (
        id, title, severity, cvss, cwe, affected_component,
        description, remediation, discovered_at, deadline
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      vuln.id, vuln.title, vuln.severity, vuln.cvss, vuln.cwe,
      vuln.affectedComponent, vuln.description, vuln.remediation,
      vuln.discoveredAt, deadline
    ]);

    // Alert security team for critical/high
    if (vuln.severity === VulnerabilitySeverity.CRITICAL ||
        vuln.severity === VulnerabilitySeverity.HIGH) {
      await this.alertSecurityTeam(vuln);
    }
  }
}
```

---

## 7. Security Incident Response Flow

### 7.1 Incident Response Plan

```
┌────────────────────────────────────────────────────────────────┐
│         Security Incident Response Workflow                     │
└────────────────────────────────────────────────────────────────┘

Phase 1: Detection & Analysis
├─ Automated alerts (SIEM, IDS, audit log anomalies)
├─ Manual reports (users, security team)
└─ Threat intelligence feeds

Phase 2: Classification
├─ Severity: P0 (Critical), P1 (High), P2 (Medium), P3 (Low)
├─ Type: Data breach, DDoS, account takeover, malware, etc.
└─ Impact assessment (affected tenants, data sensitivity)

Phase 3: Containment
├─ Short-term: Isolate affected systems, block malicious IPs
├─ Long-term: Apply patches, rotate credentials
└─ Preserve evidence for forensics

Phase 4: Eradication
├─ Remove malware, backdoors
├─ Close vulnerabilities
└─ Verify no persistence mechanisms remain

Phase 5: Recovery
├─ Restore services from clean backups
├─ Monitor for re-infection
└─ Gradual return to normal operations

Phase 6: Post-Incident
├─ Root cause analysis
├─ Update incident response procedures
├─ Notify affected parties (if required by law)
└─ Submit to board/regulators (if applicable)
```

### 7.2 Incident Severity Matrix

```typescript
interface SecurityIncident {
  incidentId: string;
  severity: 'P0' | 'P1' | 'P2' | 'P3';
  type: IncidentType;
  description: string;
  affectedTenants: string[];
  affectedUsers: string[];
  dataCompromised: boolean;
  detectedAt: Date;
  containedAt?: Date;
  resolvedAt?: Date;
  notificationRequired: boolean;  // GDPR breach notification (72 hours)
}

enum IncidentType {
  DATA_BREACH = 'data_breach',
  ACCOUNT_TAKEOVER = 'account_takeover',
  DDOS_ATTACK = 'ddos_attack',
  MALWARE = 'malware',
  INSIDER_THREAT = 'insider_threat',
  PHISHING = 'phishing',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  PRIVILEGE_ESCALATION = 'privilege_escalation',
  DATA_EXFILTRATION = 'data_exfiltration'
}

/**
 * Severity classification criteria
 */
const INCIDENT_SEVERITY_CRITERIA = {
  P0: {
    description: 'Critical - Immediate action required',
    examples: [
      'Active data breach with PII exposed',
      'Complete service outage (all tenants)',
      'Ransomware infection',
      'Unauthorized root access to production'
    ],
    responseTime: '15 minutes',
    escalation: ['CISO', 'CEO', 'Board']
  },

  P1: {
    description: 'High - Urgent action required',
    examples: [
      'Potential data breach (investigation ongoing)',
      'Single tenant data exposure',
      'Critical vulnerability actively exploited',
      'DDoS attack impacting availability'
    ],
    responseTime: '1 hour',
    escalation: ['CISO', 'VP Engineering']
  },

  P2: {
    description: 'Medium - Plan action within SLA',
    examples: [
      'Account takeover (single user)',
      'Phishing email targeting employees',
      'Medium severity vulnerability',
      'Suspicious but benign activity'
    ],
    responseTime: '4 hours',
    escalation: ['Security Team Lead']
  },

  P3: {
    description: 'Low - Informational',
    examples: [
      'Failed login attempts (automated)',
      'Low severity vulnerability',
      'Security configuration recommendation'
    ],
    responseTime: '24 hours',
    escalation: []
  }
};
```

### 7.3 Incident Response Automation

```typescript
class IncidentResponseSystem {
  /**
   * Detect potential security incident from audit logs
   */
  async detectAnomalies(): Promise<void> {
    // Example: Detect brute force attacks
    const suspiciousLogins = await db.query(`
      SELECT user_email, COUNT(*) as failed_attempts, array_agg(user_ip_address) as ips
      FROM audit.access_logs
      WHERE action = 'user.login.failed'
        AND timestamp > NOW() - INTERVAL '5 minutes'
      GROUP BY user_email
      HAVING COUNT(*) > 10
    `);

    for (const login of suspiciousLogins) {
      await this.createIncident({
        severity: 'P2',
        type: IncidentType.ACCOUNT_TAKEOVER,
        description: `Potential brute force attack on ${login.user_email}`,
        affectedUsers: [login.user_email],
        detectedAt: new Date()
      });

      // Automatic containment: Block IPs
      for (const ip of login.ips) {
        await this.blockIP(ip, '1 hour');
      }
    }

    // Example: Detect data exfiltration
    const largeExports = await db.query(`
      SELECT user_id, COUNT(*) as export_count, SUM(response_size_bytes) as total_bytes
      FROM audit.access_logs
      WHERE action = 'data.sensitive.exported'
        AND timestamp > NOW() - INTERVAL '1 hour'
      GROUP BY user_id
      HAVING SUM(response_size_bytes) > 1000000000  -- 1GB
    `);

    for (const export of largeExports) {
      await this.createIncident({
        severity: 'P1',
        type: IncidentType.DATA_EXFILTRATION,
        description: `Abnormal data export volume by user ${export.user_id}`,
        affectedUsers: [export.user_id],
        dataCompromised: true,
        detectedAt: new Date(),
        notificationRequired: true  // GDPR breach notification
      });

      // Suspend user account pending investigation
      await this.suspendUser(export.user_id);
    }
  }

  /**
   * Create security incident ticket
   */
  async createIncident(incident: Partial<SecurityIncident>): Promise<string> {
    const incidentId = `INC-${Date.now()}`;

    await db.query(`
      INSERT INTO security.incidents (
        incident_id, severity, type, description,
        affected_tenants, affected_users, data_compromised,
        detected_at, notification_required
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `, [
      incidentId,
      incident.severity,
      incident.type,
      incident.description,
      incident.affectedTenants || [],
      incident.affectedUsers || [],
      incident.dataCompromised || false,
      incident.detectedAt,
      incident.notificationRequired || false
    ]);

    // Escalate based on severity
    await this.escalate(incident.severity, incidentId);

    return incidentId;
  }

  /**
   * GDPR breach notification (Article 33 - 72 hour deadline)
   */
  async notifyDataBreach(incidentId: string): Promise<void> {
    const incident = await db.query(`
      SELECT * FROM security.incidents WHERE incident_id = $1
    `, [incidentId]);

    if (!incident.data_compromised) {
      return;
    }

    // Notify supervisory authority (DPA)
    await this.notifyDataProtectionAuthority({
      incidentId,
      natureOfBreach: incident.type,
      affectedDataSubjects: incident.affected_users.length,
      likelyConsequences: this.assessConsequences(incident),
      measuresT taken: this.getContainmentActions(incidentId),
      dpoContact: 'dpo@miyabi.example.com'
    });

    // Notify affected individuals (if high risk)
    if (this.isHighRisk(incident)) {
      for (const userId of incident.affected_users) {
        await this.notifyUser(userId, {
          subject: 'Important Security Notice',
          body: `We are writing to inform you of a security incident that may have affected your data...`
        });
      }
    }
  }
}
```

### 7.4 Incident Communication Plan

```typescript
/**
 * Incident notification templates
 */
const INCIDENT_NOTIFICATIONS = {
  // Internal notification (Slack/PagerDuty)
  internal: (incident: SecurityIncident) => ({
    channel: '#security-incidents',
    message: `
🚨 Security Incident Detected

**Incident ID**: ${incident.incidentId}
**Severity**: ${incident.severity}
**Type**: ${incident.type}
**Affected Tenants**: ${incident.affectedTenants.length}
**Data Compromised**: ${incident.dataCompromised ? 'YES ⚠️' : 'No'}

**Description**: ${incident.description}

**Response Team**: @security-oncall
**War Room**: https://zoom.us/j/emergency
**Incident Dashboard**: https://dash.miyabi.example.com/incidents/${incident.incidentId}
    `
  }),

  // Customer notification (email)
  customer: (tenant: any, incident: SecurityIncident) => ({
    to: tenant.ownerEmail,
    subject: 'Important Security Update - Miyabi Platform',
    body: `
Dear ${tenant.displayName},

We are writing to inform you of a security incident that may have affected your Miyabi account.

**What happened**: ${incident.description}

**What data was affected**: [Specific data categories]

**What we're doing**:
- Incident was detected and contained within [timeframe]
- All affected systems have been secured
- We are conducting a thorough investigation

**What you should do**:
- Review your recent account activity
- Rotate any API keys or tokens
- Enable multi-factor authentication if not already enabled

We take security very seriously and sincerely apologize for any concern this may cause.

If you have any questions, please contact security@miyabi.example.com or call our security hotline: +1-XXX-XXX-XXXX

Sincerely,
Miyabi Security Team
    `
  }),

  // Regulatory notification (GDPR Data Protection Authority)
  regulatory: (incident: SecurityIncident) => ({
    to: 'dpa@supervisory-authority.eu',
    subject: `Data Breach Notification - ${incident.incidentId}`,
    body: `
[Formal GDPR Article 33 notification template]

1. Nature of the personal data breach
2. Name and contact details of the DPO
3. Description of likely consequences
4. Measures taken or proposed
    `
  })
};
```

---

## 8. Implementation Roadmap

### 8.1 Phase 1: Foundation (Months 1-3)

```typescript
const PHASE_1_TASKS = [
  {
    task: 'Implement JWT authentication',
    status: 'completed',
    owner: 'Engineering Team',
    deliverables: ['JWT service', 'Auth middleware', 'Unit tests']
  },
  {
    task: 'Design RBAC model',
    status: 'in_progress',
    owner: 'Security Team',
    deliverables: ['Role definitions', 'Permission matrix', 'Authorization middleware']
  },
  {
    task: 'Implement field-level encryption',
    status: 'planned',
    owner: 'Engineering Team',
    deliverables: ['Encryption service', 'Key management', 'Migration scripts']
  },
  {
    task: 'Set up audit logging',
    status: 'planned',
    owner: 'Engineering Team',
    deliverables: ['Audit log schema', 'Middleware', 'Log retention policy']
  },
  {
    task: 'Configure TLS 1.3',
    status: 'completed',
    owner: 'DevOps Team',
    deliverables: ['TLS configuration', 'Certificate automation']
  }
];
```

### 8.2 Phase 2: Enterprise Features (Months 4-6)

```typescript
const PHASE_2_TASKS = [
  {
    task: 'Implement SAML 2.0 SSO',
    status: 'planned',
    owner: 'Engineering Team',
    deliverables: ['SAML service', 'IdP configuration UI', 'JIT provisioning']
  },
  {
    task: 'API key management',
    status: 'planned',
    owner: 'Engineering Team',
    deliverables: ['API key generation', 'Scoped permissions', 'Key rotation']
  },
  {
    task: 'Penetration testing',
    status: 'planned',
    owner: 'Security Team',
    deliverables: ['Pentest report', 'Remediation plan']
  },
  {
    task: 'SIEM integration',
    status: 'planned',
    owner: 'Security Operations Team',
    deliverables: ['Log forwarding', 'Alert rules', 'Dashboards']
  }
];
```

### 8.3 Phase 3: Compliance Certification (Months 7-12)

```typescript
const PHASE_3_TASKS = [
  {
    task: 'SOC 2 Type II preparation',
    status: 'planned',
    owner: 'Compliance Team',
    deliverables: ['Control documentation', 'Evidence collection', 'Audit readiness']
  },
  {
    task: 'GDPR compliance audit',
    status: 'planned',
    owner: 'Legal Team',
    deliverables: ['Data processing register', 'Privacy policy', 'DPA contracts']
  },
  {
    task: 'Incident response drills',
    status: 'planned',
    owner: 'Security Team',
    deliverables: ['Tabletop exercises', 'Runbook updates', 'Team training']
  },
  {
    task: 'Security awareness training',
    status: 'planned',
    owner: 'HR Team',
    deliverables: ['Training materials', 'Completion tracking', 'Phishing simulations']
  }
];
```

---

## 9. Security Metrics & KPIs

```typescript
interface SecurityMetrics {
  // Authentication
  ssoAdoptionRate: number;  // % of enterprise tenants using SSO
  mfaEnrollmentRate: number;  // % of users with MFA enabled

  // Authorization
  privilegedAccountCount: number;  // # of owner/admin roles
  apiKeyCount: number;  // # of active API keys

  // Encryption
  encryptedFieldsPercentage: number;  // % of sensitive fields encrypted
  keyRotationCompliance: number;  // % of keys rotated on schedule

  // Audit & Compliance
  auditLogRetentionDays: number;  // Days of audit log retention
  complianceScore: number;  // % of SOC 2 controls passing

  // Incidents
  meanTimeToDetect: number;  // Average time to detect incident (minutes)
  meanTimeToContain: number;  // Average time to contain incident (hours)
  criticalVulnerabilitiesOpen: number;  // # of unresolved critical vulns

  // Availability
  uptimePercentage: number;  // % uptime (SLA: 99.9%)
  securityIncidentCount: number;  // # of incidents this month
}

/**
 * Security dashboard (Grafana)
 */
const SECURITY_DASHBOARD_PANELS = [
  {
    title: 'Failed Login Attempts (Last 24h)',
    query: `
      SELECT COUNT(*) as count, date_trunc('hour', timestamp) as hour
      FROM audit.access_logs
      WHERE action = 'user.login.failed'
        AND timestamp > NOW() - INTERVAL '24 hours'
      GROUP BY hour
      ORDER BY hour
    `
  },
  {
    title: 'Top Security Events',
    query: `
      SELECT security_event_type, COUNT(*) as count
      FROM audit.access_logs
      WHERE security_event_type IS NOT NULL
        AND timestamp > NOW() - INTERVAL '7 days'
      GROUP BY security_event_type
      ORDER BY count DESC
      LIMIT 10
    `
  },
  {
    title: 'Compliance Score Trend',
    query: `
      SELECT date, compliance_score
      FROM security.compliance_checks
      WHERE date > NOW() - INTERVAL '90 days'
      ORDER BY date
    `
  }
];
```

---

## 10. Conclusion

This enterprise security design provides comprehensive protection across all layers:

1. **Authentication**: SSO/SAML 2.0, MFA, API keys
2. **Authorization**: RBAC with fine-grained permissions
3. **Data Protection**: AES-256 encryption at rest and TLS 1.3 in transit
4. **Compliance**: SOC 2 Type II and GDPR ready
5. **Monitoring**: Comprehensive audit logging and SIEM integration
6. **Incident Response**: Automated detection and escalation

### Next Steps

1. Review this design with security team and stakeholders
2. Prioritize implementation based on risk assessment
3. Begin Phase 1 implementation (Months 1-3)
4. Schedule penetration testing for Q2 2026
5. Engage SOC 2 auditor for Q3 2026 certification

---

**Document Control**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2025-11-30 | Claude AI | Initial detailed design |

**Reviewers**: Security Team, Engineering Team, Compliance Team, Legal Team

**Approval Status**: Pending Review
