# Autonomous Agent System

**Type:** System
**Status:** In Development
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Roadmap](/home/user/Omniops/docs/10-ANALYSIS/ROADMAP_AUTONOMOUS_AGENTS.md), [Gap Analysis](/home/user/Omniops/docs/10-ANALYSIS/ANALYSIS_POC_TO_PRODUCTION_GAPS.md), [Agent Knowledge Base](/home/user/Omniops/docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md)
**Estimated Read Time:** 8 minutes

---

## 🎯 Purpose

Enable AI agents to autonomously execute tasks on behalf of users with explicit consent, encryption, and comprehensive audit trails.

**Current Capabilities:**
- ✅ Encrypted credential storage (AES-256-GCM)
- ✅ User consent management
- ✅ Comprehensive audit logging
- ✅ Database schema for autonomous operations

**In Progress:**
- 🚧 Generic autonomous agent framework
- 🚧 WooCommerce auto-setup agent
- 🚧 API endpoints
- 🚧 Job queue integration

**Planned:**
- ⏳ Stripe auto-setup agent
- ⏳ Shopify auto-setup agent
- ⏳ Voice control integration
- ⏳ Self-healing integrations

---

## 📦 What's Included

### Database Schema
**Location:** `supabase/migrations/20251110000000_autonomous_operations_system.sql`

**Tables:**
- `autonomous_operations` - Track all autonomous operations
- `autonomous_operations_audit` - Step-by-step audit trail
- `autonomous_credentials` - Encrypted credential vault
- `autonomous_consent` - User consent records

**Features:**
- Row Level Security (RLS) enabled
- Helper functions for consent verification
- Automatic timestamp tracking
- Foreign key constraints with CASCADE

### Security Services

#### 1. Credential Vault
**Location:** `lib/autonomous/security/credential-vault.ts`

**Purpose:** Secure storage for credentials (API keys, passwords, OAuth tokens)

**Features:**
- AES-256-GCM encryption
- Key rotation every 90 days
- Automatic expiration handling
- Multi-tenant isolation

**Usage:**
```typescript
import { getCredentialVault } from '@/lib/autonomous/security/credential-vault';

const vault = getCredentialVault();

// Store credential
await vault.store('customer-123', 'woocommerce', 'api_key', {
  value: 'ck_abc123...',
  expiresAt: new Date('2025-12-31'),
  metadata: { scopes: ['read_products', 'write_orders'] }
});

// Retrieve credential (decrypted)
const credential = await vault.get('customer-123', 'woocommerce', 'api_key');
console.log(credential.value); // 'ck_abc123...'

// Delete credential
await vault.delete('customer-123', 'woocommerce', 'api_key');
```

#### 2. Consent Manager
**Location:** `lib/autonomous/security/consent-manager.ts`

**Purpose:** Track user consent for autonomous operations

**Features:**
- Explicit permission tracking
- Expiration support
- Revocation capability
- Permission-level granularity
- Audit trail (IP, user agent)

**Usage:**
```typescript
import { getConsentManager } from '@/lib/autonomous/security/consent-manager';

const consent = getConsentManager();

// Grant consent
await consent.grant('customer-123', 'user-456', {
  service: 'woocommerce',
  operation: 'api_key_generation',
  permissions: ['read_products', 'create_api_keys'],
  expiresAt: new Date('2025-12-31')
});

// Verify consent
const verification = await consent.verify(
  'customer-123',
  'woocommerce',
  'api_key_generation'
);

if (!verification.hasConsent) {
  throw new Error(verification.reason); // "No consent granted for this operation"
}

// Revoke consent
await consent.revoke('customer-123', 'woocommerce', 'api_key_generation');
```

#### 3. Audit Logger
**Location:** `lib/autonomous/security/audit-logger.ts`

**Purpose:** Comprehensive logging of all autonomous operations

**Features:**
- Step-by-step execution tracking
- Screenshot URL storage
- Duration tracking
- AI response logging
- Retention policy (90 days default)
- GDPR export capability

**Usage:**
```typescript
import { getAuditLogger } from '@/lib/autonomous/security/audit-logger';

const logger = getAuditLogger();

// Log a step
await logger.logStep({
  operationId: 'op-123',
  stepNumber: 1,
  intent: 'Navigate to login page',
  action: 'await page.goto("https://example.com/login")',
  success: true,
  pageUrl: 'https://example.com/login',
  durationMs: 1250,
  screenshotUrl: 'https://storage.example.com/screenshots/step-1.png'
});

// Get operation summary
const summary = await logger.getOperationSummary('op-123');
console.log(`Success rate: ${summary.successfulSteps}/${summary.totalSteps}`);
console.log(`Total duration: ${summary.totalDurationMs}ms`);

// Export audit trail (GDPR)
const auditTrail = await logger.exportAuditTrail(
  'customer-123',
  new Date('2025-01-01'),
  new Date('2025-12-31')
);
```

---

## 🏗️ Architecture (In Progress)

### Autonomous Agent Framework

```
┌─────────────────────────────────────────────────────────────────┐
│ User Request: "Set up WooCommerce automatically"                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ API Endpoint: POST /api/autonomous/initiate                     │
│ - Validate customer                                             │
│ - Check consent                                                 │
│ - Create operation record                                       │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Job Queue (BullMQ): Enqueue autonomous operation                │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Autonomous Agent Executor                                       │
│ 1. Load workflow from AGENT_KNOWLEDGE_BASE.json                 │
│ 2. Initialize browser (Playwright)                              │
│ 3. Get credentials from vault                                   │
│ 4. For each step:                                               │
│    - Take screenshot                                            │
│    - Send to Anthropic Computer Use API                         │
│    - AI analyzes → decides action → returns command             │
│    - Execute Playwright command                                 │
│    - Log to audit trail                                         │
│ 5. Extract result (API key, etc.)                               │
│ 6. Update operation status                                      │
│ 7. Notify customer                                              │
└────────────────────────┬────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Real-time Updates (WebSocket): Progress shown to user           │
└─────────────────────────────────────────────────────────────────┘
```

### Service Layer Structure

```
lib/autonomous/
├── security/                     # ✅ COMPLETE
│   ├── credential-vault.ts       # AES-256 encrypted storage
│   ├── consent-manager.ts        # User permission tracking
│   └── audit-logger.ts           # Comprehensive logging
│
├── core/                         # 🚧 IN PROGRESS
│   ├── base-agent.ts             # Abstract AutonomousAgent class
│   ├── workflow-registry.ts      # Load workflows from E2E knowledge base
│   ├── execution-engine.ts       # Generic step execution
│   ├── screenshot-manager.ts     # Secure screenshot storage
│   └── error-recovery.ts         # Retry and recovery logic
│
├── agents/                       # ⏳ PLANNED
│   ├── woocommerce-agent.ts      # WooCommerce auto-setup
│   ├── stripe-agent.ts           # Stripe auto-setup
│   └── shopify-agent.ts          # Shopify auto-setup
│
└── jobs/                         # ⏳ PLANNED
    └── processor.ts              # BullMQ job handler
```

---

## 🔒 Security Architecture

### Defense in Depth

**Layer 1: User Consent**
- Explicit permission required before any autonomous action
- Granular permissions (read_products, create_api_keys, etc.)
- Expiration support
- Easy revocation

**Layer 2: Encrypted Storage**
- AES-256-GCM encryption for all credentials
- Encryption key rotation every 90 days
- Binary storage in database (never plain text)
- Key versioning for rotation tracking

**Layer 3: Audit Trail**
- Every step logged with screenshot
- Full command history
- AI response logging for debugging
- 90-day retention (configurable)
- GDPR export capability

**Layer 4: Row Level Security (RLS)**
- Service role required for credential access
- Customer isolation enforced at database level
- Multi-tenant separation guaranteed

**Layer 5: Rate Limiting** (Planned)
- Per-customer operation limits
- Prevent abuse and runaway costs

---

## 🔐 Compliance

**GDPR:**
- ✅ Audit trail export
- ✅ Consent management
- ✅ Data deletion support
- ✅ 90-day retention policy

**SOC 2 Type II:**
- ✅ Comprehensive audit logging
- ✅ Encrypted data at rest
- ✅ Access controls (RLS)
- ✅ Key rotation policy

**CCPA:**
- ✅ Data export capability
- ✅ Deletion rights
- ✅ Consent tracking

---

## 🚀 Roadmap

### Phase 1: Security Foundation (✅ COMPLETE)
- [x] Database schema
- [x] Credential vault with encryption
- [x] Consent management
- [x] Audit logging
- [x] Row Level Security

### Phase 2: Core Framework (🚧 IN PROGRESS)
- [ ] Generic AutonomousAgent base class
- [ ] Workflow registry (load from E2E knowledge base)
- [ ] Execution engine
- [ ] Screenshot manager
- [ ] Error recovery

### Phase 3: First Agent (⏳ PLANNED)
- [ ] WooCommerceSetupAgent implementation
- [ ] API endpoints
- [ ] Job queue integration
- [ ] Real-time progress updates
- [ ] E2E tests

### Phase 4: Production Hardening (⏳ PLANNED)
- [ ] Rate limiting
- [ ] Monitoring dashboard
- [ ] Beta customer testing
- [ ] Production deployment

---

## 📝 Development Guidelines

### Creating a New Autonomous Agent

1. **Extend Base Class:**
   ```typescript
   class MyServiceAgent extends AutonomousAgent {
     getWorkflow(): TaskStep[] {
       // Load from AGENT_KNOWLEDGE_BASE.json
       return WorkflowRegistry.get('my_service_setup');
     }

     async extractResult(page: Page): Promise<any> {
       // Extract API key or result from final page
     }
   }
   ```

2. **Add E2E Test First:**
   - Create test in `__tests__/playwright/`
   - Test will auto-generate workflow in knowledge base
   - Agent loads workflow from knowledge base

3. **Implement Security:**
   - Verify consent before execution
   - Store credentials in vault
   - Log every step to audit trail

4. **Test Thoroughly:**
   - Unit tests for agent logic
   - Integration tests with mocked browser
   - E2E test with real service (test environment)

### Testing

**Security Tests:**
```typescript
describe('Autonomous Agent Security', () => {
  it('should require consent before execution', async () => {
    const agent = new WooCommerceSetupAgent();
    await expect(agent.execute({ customerId, noConsent: true }))
      .rejects.toThrow('Consent required');
  });

  it('should encrypt all credentials', async () => {
    // Verify credentials in database are encrypted
    const record = await db.query(
      'SELECT encrypted_credential FROM autonomous_credentials WHERE customer_id = $1',
      [customerId]
    );
    expect(record.encrypted_credential).toBeInstanceOf(Buffer);
  });
});
```

---

## 🐛 Troubleshooting

### Common Issues

**"ENCRYPTION_KEY environment variable required"**
- Ensure `ENCRYPTION_KEY` is set in `.env.local`
- Generate key: `openssl rand -base64 32`

**"No consent granted for this operation"**
- User must explicitly grant consent
- Check consent status: `await consent.verify(...)`
- Grant consent via UI or API

**"Failed to store credential"**
- Verify database migration ran successfully
- Check RLS policies allow service role access
- Ensure customer_id exists in customers table

**Audit logs not appearing**
- Verify `autonomous_operations` record exists
- Check operation_id is valid UUID
- Ensure service role has INSERT permission

### Debug Mode

Enable verbose logging:
```bash
export DEBUG_AUTONOMOUS=true
```

View audit logs:
```typescript
const logs = await getAuditLogger().getOperationLogs('op-123');
logs.forEach(log => console.log(log));
```

---

## 📚 Related Documentation

**Core Documentation:**
- [Roadmap](../../docs/10-ANALYSIS/ROADMAP_AUTONOMOUS_AGENTS.md) - 12-month implementation plan
- [Gap Analysis](../../docs/10-ANALYSIS/ANALYSIS_POC_TO_PRODUCTION_GAPS.md) - POC to production requirements
- [E2E Tests as Training Data](../../docs/10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md) - How E2E tests train agents

**Proof of Concept:**
- [POC README](../../scripts/proof-of-concept/README.md) - Demo autonomous agent
- [Stripe Key Generator](../../scripts/proof-of-concept/autonomous-stripe-key-generator.ts) - Working example

**Agent Knowledge Base:**
- [Workflows from E2E Tests](../../docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md) - Extracted workflows
- [Agent Knowledge Base](../../docs/10-ANALYSIS/AGENT_KNOWLEDGE_BASE.md) - AI-optimized training data

---

## 🎯 Success Metrics

**Security:**
- ✅ 0 plaintext credentials in database
- ✅ 100% of operations logged
- ✅ 100% consent verification before execution

**Performance:**
- ⏳ Target: 95%+ success rate for autonomous operations
- ⏳ Target: <5 minutes average operation duration
- ⏳ Target: <50ms credential retrieval time

**Business:**
- ⏳ Target: 98% reduction in onboarding time (2 hours → 2 minutes)
- ⏳ Target: 80% reduction in support tickets
- ⏳ Target: 30% upgrade rate to AI-Assisted tier ($299/month)

---

**Status:** Security foundation complete, core framework in progress
**Next Milestone:** First autonomous agent (WooCommerce setup) - 2 weeks
**Production Ready:** Estimated 3-4 weeks
