# Security Test Cases: `/api/customer/config/current`

**Purpose**: Comprehensive security validation test suite for the current config endpoint

---

## Test Environment Setup

Before running tests, ensure:

```bash
# 1. Start development server
npm run dev

# 2. Supabase is running (via Docker or Supabase CLI)
docker-compose up -d

# 3. Database is initialized with schema
# (Should be automatic via migrations)
```

---

## Test Suite 1: Authentication & Authorization

### Test 1.1: Unauthenticated Request

**Objective**: Verify endpoint rejects requests without valid authentication

**Test Case**:
```bash
curl -X GET http://localhost:3000/api/customer/config/current
```

**Expected**:
- Status Code: `401`
- Response:
  ```json
  {
    "success": false,
    "error": "Unauthorized"
  }
  ```

**Verification**:
- ✅ No config data leaked
- ✅ Generic error message (no implementation details)
- ✅ Correct HTTP status for unauthenticated request

---

### Test 1.2: Invalid/Expired Session Cookie

**Objective**: Verify endpoint rejects invalid session tokens

**Setup**:
```bash
# Create a valid auth session
AUTH_TOKEN=$(curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrongpass"}')

# Extract invalid/expired token (or manually craft one)
INVALID_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.invalid"
```

**Test Case**:
```bash
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: sb-session-token=$INVALID_TOKEN"
```

**Expected**:
- Status Code: `401`
- Response: `{ "success": false, "error": "Unauthorized" }`

**Verification**:
- ✅ Invalid tokens rejected
- ✅ No sensitive data leaked

---

### Test 1.3: Authenticated User Without Organization

**Objective**: User exists in auth but has no organization membership

**Setup**:
```sql
-- Create test user
INSERT INTO auth.users (email, raw_user_meta_data)
VALUES ('lonely@example.com', '{}');

-- Note: Do NOT insert into organization_members table
```

**Test Case**:
```bash
# Authenticate as lonely@example.com
COOKIE=$(getAuthCookie 'lonely@example.com')
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE"
```

**Expected**:
- Status Code: `404`
- Response:
  ```json
  {
    "success": false,
    "error": "No organization found for user"
  }
  ```

**Verification**:
- ✅ Missing org membership handled gracefully
- ✅ User-friendly error message
- ✅ No config data leaked

---

### Test 1.4: Organization Without Active Customer Config

**Objective**: User has organization but no customer_config exists

**Setup**:
```sql
-- Assume user exists with organization membership
-- But no customer_configs row for that organization
INSERT INTO organization_members (organization_id, user_id)
VALUES ('org-uuid', 'user-uuid');

-- Ensure no customer_configs for this org
DELETE FROM customer_configs WHERE organization_id = 'org-uuid';
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'newuser@example.com')
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE"
```

**Expected**:
- Status Code: `404`
- Response:
  ```json
  {
    "success": false,
    "error": "No customer configuration found",
    "message": "Please configure your domain in settings first"
  }
  ```

**Verification**:
- ✅ Missing config detected
- ✅ Helpful guidance message provided
- ✅ No config data leaked

---

## Test Suite 2: Data Isolation & Multi-Tenancy

### Test 2.1: User Cannot Access Different Organization's Config

**Objective**: User from Org A cannot retrieve Org B's customer config

**Setup**:
```sql
-- Organization A with User A
INSERT INTO organizations (id, name, slug)
VALUES ('org-a-uuid', 'Org A', 'org-a');
INSERT INTO organization_members (organization_id, user_id)
VALUES ('org-a-uuid', 'user-a-uuid');
INSERT INTO customer_configs (id, organization_id, domain, active)
VALUES ('config-a-uuid', 'org-a-uuid', 'orga.example.com', true);

-- Organization B with User B
INSERT INTO organizations (id, name, slug)
VALUES ('org-b-uuid', 'Org B', 'org-b');
INSERT INTO organization_members (organization_id, user_id)
VALUES ('org-b-uuid', 'user-b-uuid');
INSERT INTO customer_configs (id, organization_id, domain, active)
VALUES ('config-b-uuid', 'org-b-uuid', 'orgb.example.com', true);
```

**Test Case**:
```bash
# User A tries to access their config (should work)
COOKIE_A=$(getAuthCookie 'user-a@example.com')
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE_A"
# Expected: 200, returns config-a with domain=orga.example.com

# User A tries to access User B's config (should fail)
COOKIE_A=$(getAuthCookie 'user-a@example.com')
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE_A"
# Expected: 404 or only returns config-a, NOT config-b
```

**Expected**:
- User A: Returns only their org's config (orga.example.com)
- User A cannot access User B's config (orgb.example.com)
- Status Code: `404` if trying to access different org's config

**Verification**:
- ✅ Organization isolation enforced
- ✅ RLS policy prevents cross-org access
- ✅ No data leakage between organizations

---

### Test 2.2: Multiple Orgs - Each User Sees Only Their Org's Config

**Objective**: Verify each user in multi-org scenario only sees their own org's data

**Setup**:
```sql
-- Create 3 organizations with different users
FOR i IN 1..3 LOOP
  INSERT INTO organizations VALUES (
    gen_random_uuid(), 'Org ' || i, 'org-' || i
  ) RETURNING id AS org_id;

  INSERT INTO organization_members VALUES (
    gen_random_uuid(), org_id, user_i_uuid
  );

  INSERT INTO customer_configs VALUES (
    gen_random_uuid(), org_id, 'org' || i || '.example.com', true
  );
END LOOP;
```

**Test Case**:
```bash
for i in {1..3}; do
  COOKIE=$(getAuthCookie "user-$i@example.com")
  RESPONSE=$(curl -s -X GET http://localhost:3000/api/customer/config/current \
    -H "Cookie: $COOKIE")
  DOMAIN=$(echo $RESPONSE | jq -r '.data.domain')

  # Verify each user sees only their org's domain
  if [ "$DOMAIN" == "org$i.example.com" ]; then
    echo "✅ User $i sees correct domain"
  else
    echo "❌ User $i sees wrong domain: $DOMAIN"
  fi
done
```

**Expected**:
- User 1: Returns org1.example.com
- User 2: Returns org2.example.com
- User 3: Returns org3.example.com
- Each user only sees their own data

**Verification**:
- ✅ Multi-tenant isolation works correctly
- ✅ No data leakage between organizations
- ✅ RLS policy enforcement validated

---

## Test Suite 3: Sensitive Data Protection

### Test 3.1: WooCommerce Credentials Not Exposed

**Objective**: Verify WooCommerce API keys are never returned

**Setup**:
```sql
INSERT INTO customer_configs (
  id, organization_id, domain, active,
  woocommerce_url, woocommerce_consumer_key, woocommerce_consumer_secret
) VALUES (
  'config-uuid', 'org-uuid', 'example.com', true,
  'https://shop.example.com',
  'ck_live_abc123...', -- Actual key
  'cs_live_xyz789...'  -- Actual secret
);
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')
RESPONSE=$(curl -s -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE")

# Check response does NOT contain credentials
echo "$RESPONSE" | grep -q "woocommerce_consumer_key" && echo "❌ EXPOSED: woocommerce_consumer_key"
echo "$RESPONSE" | grep -q "woocommerce_consumer_secret" && echo "❌ EXPOSED: woocommerce_consumer_secret"
echo "$RESPONSE" | grep -q "ck_live_abc123" && echo "❌ EXPOSED: WooCommerce key value"
echo "$RESPONSE" | grep -q "cs_live_xyz789" && echo "❌ EXPOSED: WooCommerce secret value"
```

**Expected**:
- No `woocommerce_consumer_key` field in response
- No `woocommerce_consumer_secret` field in response
- No actual credential values in response
- `woocommerce_url` IS included (it's not sensitive)

**Verification**:
- ✅ WooCommerce credentials protected
- ✅ Only public URL exposed
- ✅ No credential leakage

---

### Test 3.2: Shopify Access Token Not Exposed

**Objective**: Verify Shopify API tokens are never returned

**Setup**:
```sql
INSERT INTO customer_configs (
  id, organization_id, domain, active,
  shopify_shop, shopify_access_token
) VALUES (
  'config-uuid', 'org-uuid', 'example.com', true,
  'example.myshopify.com',
  'shpat_abc123xyz...' -- Actual token
);
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')
RESPONSE=$(curl -s -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE")

# Check response does NOT contain credentials
echo "$RESPONSE" | grep -q "shopify_access_token" && echo "❌ EXPOSED: shopify_access_token field"
echo "$RESPONSE" | grep -q "shpat_" && echo "❌ EXPOSED: Shopify token value"

# But shop name should be visible
echo "$RESPONSE" | jq -r '.data.shopify_shop'
# Expected: example.myshopify.com (this is public)
```

**Expected**:
- No `shopify_access_token` field in response
- No actual token value in response
- `shopify_shop` IS included (it's not sensitive)

**Verification**:
- ✅ Shopify tokens protected
- ✅ Only public shop identifier exposed
- ✅ No credential leakage

---

### Test 3.3: Encrypted Credentials Not Exposed

**Objective**: Verify encrypted_credentials JSONB field is never returned

**Setup**:
```sql
INSERT INTO customer_configs (
  id, organization_id, domain, active,
  encrypted_credentials
) VALUES (
  'config-uuid', 'org-uuid', 'example.com', true,
  '{"api_key": "encrypted_value", ...}'::jsonb
);
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')
RESPONSE=$(curl -s -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE")

# Check response does NOT contain encrypted_credentials
echo "$RESPONSE" | grep -q "encrypted_credentials" && echo "❌ EXPOSED: encrypted_credentials field"
echo "$RESPONSE" | grep -q "encrypted_value" && echo "❌ EXPOSED: Encrypted credential value"
```

**Expected**:
- No `encrypted_credentials` field in response
- No encrypted credential values in response

**Verification**:
- ✅ Encrypted credentials protected
- ✅ No credential leakage

---

### Test 3.4: Non-Sensitive Fields ARE Included

**Objective**: Verify legitimate config data IS returned

**Setup**:
```sql
INSERT INTO customer_configs (
  id, organization_id, domain, active,
  business_name, business_description, primary_color,
  welcome_message, suggested_questions, rate_limit
) VALUES (
  'config-uuid', 'org-uuid', 'example.com', true,
  'Example Corp', 'Our business', '#FF0000',
  'Welcome to our chat!', '["How are you?", "Help"]'::jsonb, 10
);
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')
RESPONSE=$(curl -s -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE")

# Verify legitimate fields ARE in response
echo "$RESPONSE" | jq -r '.data.domain' # Should be: example.com
echo "$RESPONSE" | jq -r '.data.business_name' # Should be: Example Corp
echo "$RESPONSE" | jq -r '.data.primary_color' # Should be: #FF0000
echo "$RESPONSE" | jq -r '.data.rate_limit' # Should be: 10
echo "$RESPONSE" | jq -r '.data.suggested_questions' # Should be: ["How are you?", "Help"]
```

**Expected**:
- All non-sensitive fields returned
- Response includes:
  - ✅ `id`
  - ✅ `domain`
  - ✅ `business_name`
  - ✅ `business_description`
  - ✅ `primary_color`
  - ✅ `welcome_message`
  - ✅ `suggested_questions`
  - ✅ `woocommerce_url`
  - ✅ `shopify_shop`
  - ✅ `organization_id`
  - ✅ `rate_limit`
  - ✅ `allowed_origins`
  - ✅ `active`
  - ✅ `created_at`
  - ✅ `updated_at`

**Verification**:
- ✅ Legitimate configuration data accessible to users
- ✅ Only sensitive credentials excluded

---

## Test Suite 4: Error Handling & Edge Cases

### Test 4.1: Database Connection Failure

**Objective**: Verify graceful error handling when database is unavailable

**Setup**:
```bash
# Stop Supabase
docker-compose down

# Wait for Supabase to be unreachable
sleep 2
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE"
```

**Expected**:
- Status Code: `500`
- Response:
  ```json
  {
    "success": false,
    "error": "Internal server error"
  }
  ```

**Verification**:
- ✅ No database details leaked
- ✅ User-friendly error message
- ✅ Graceful degradation

---

### Test 4.2: Query Timeout Handling

**Objective**: Verify handling of slow/hanging database queries

**Setup**:
```bash
# Force slow query via heavy load
for i in {1..100}; do
  curl -X GET http://localhost:3000/api/customer/config/current \
    -H "Cookie: $(getAuthCookie 'user@example.com')" &
done
wait
```

**Expected**:
- Some requests may timeout (configured to 5 seconds)
- Status Code: `500` or timeout error
- Response: `{ "success": false, "error": "Internal server error" }`

**Verification**:
- ✅ Query timeout enforced (5 seconds)
- ✅ No hanging requests
- ✅ Graceful timeout handling

---

### Test 4.3: Missing Required Fields in Config

**Objective**: Verify endpoint handles incomplete customer_config records

**Setup**:
```sql
-- Create config with minimal fields
INSERT INTO customer_configs (
  id, organization_id, domain, active
) VALUES (
  'minimal-config', 'org-uuid', 'minimal.example.com', true
);

-- Note: Many fields are NULL
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')
curl -s -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE" | jq '.'
```

**Expected**:
- Status Code: `200`
- Response includes config with NULL fields
- Fields like `business_name`, `business_description` may be null

**Verification**:
- ✅ Handles incomplete configs gracefully
- ✅ Returns what's available
- ✅ No crashes on NULL values

---

## Test Suite 5: Input Validation & Injection Prevention

### Test 5.1: SQL Injection via Session Token

**Objective**: Verify endpoint is not vulnerable to SQL injection

**Test Case**:
```bash
# Try various SQL injection payloads in session cookie
MALICIOUS_TOKENS=(
  "'; DROP TABLE customer_configs; --"
  "' OR '1'='1"
  "UNION SELECT * FROM customer_configs --"
  "1' AND 1=1 --"
)

for TOKEN in "${MALICIOUS_TOKENS[@]}"; do
  curl -X GET http://localhost:3000/api/customer/config/current \
    -H "Cookie: sb-session-token=$TOKEN" \
    -v 2>&1 | grep "HTTP/"
done
```

**Expected**:
- Status Code: `401` for all injection attempts
- No SQL errors exposed
- Database remains intact
- SELECT count(*) FROM customer_configs = original count

**Verification**:
- ✅ Supabase parameterized queries prevent injection
- ✅ Session tokens treated as data, not code
- ✅ Database integrity preserved

---

### Test 5.2: Path Traversal Attempts

**Objective**: Verify endpoint doesn't process path traversal

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')

# Try various path traversal attempts
curl -X GET http://localhost:3000/api/customer/config/current/../../etc/passwd \
  -H "Cookie: $COOKIE"

curl -X GET http://localhost:3000/api/customer/config/current%2F..%2F..%2Fetc%2Fpasswd \
  -H "Cookie: $COOKIE"
```

**Expected**:
- Status Code: `404` (not found) or `405` (method not allowed)
- No sensitive files exposed
- Next.js routing prevents path traversal

**Verification**:
- ✅ Framework-level protection works
- ✅ No file system access possible
- ✅ No sensitive data exposure

---

## Test Suite 6: Performance & Load Testing

### Test 6.1: Response Time Under Normal Load

**Objective**: Verify endpoint responds quickly with typical load

**Test Case**:
```bash
# Test 10 sequential requests
time for i in {1..10}; do
  curl -s -X GET http://localhost:3000/api/customer/config/current \
    -H "Cookie: $(getAuthCookie 'user@example.com')" > /dev/null
done

# Expected: ~10 seconds total (~1 second each)
```

**Expected**:
- Average response time: < 500ms per request
- Total time for 10 requests: < 6 seconds
- No timeouts

**Verification**:
- ✅ Query performance acceptable
- ✅ No N+1 query problems
- ✅ Index optimization working

---

### Test 6.2: Concurrent Request Handling

**Objective**: Verify endpoint handles concurrent requests safely

**Test Case**:
```bash
# Test 50 concurrent requests
(for i in {1..50}; do
  curl -s -X GET http://localhost:3000/api/customer/config/current \
    -H "Cookie: $(getAuthCookie 'user@example.com')" > /tmp/response-$i.json &
done; wait)

# Verify all succeeded
SUCCESS=$(grep -c '"success":true' /tmp/response-*.json)
echo "Successful responses: $SUCCESS / 50"
```

**Expected**:
- Success rate: 100% (all 50 requests succeed)
- No connection errors
- No race conditions

**Verification**:
- ✅ Connection pooling works correctly
- ✅ No connection exhaustion
- ✅ Thread-safe implementation

---

## Test Suite 7: Logging & Monitoring

### Test 7.1: Sensitive Data in Logs

**Objective**: Verify logs don't contain sensitive credentials

**Test Case**:
```bash
# Trigger various endpoints and check logs
npm run dev &  # Start server in background
SERVER_PID=$!

# Make requests
COOKIE=$(getAuthCookie 'user@example.com')
curl -s -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE" > /dev/null

# Wait and capture logs
sleep 2
kill $SERVER_PID

# Check logs for sensitive data
grep -r "woocommerce_consumer" /var/log/app/
grep -r "shopify_access_token" /var/log/app/
grep -r "encrypted_credentials" /var/log/app/
grep -r "shpat_" /var/log/app/
grep -r "ck_live_" /var/log/app/
```

**Expected**:
- No matches for sensitive patterns in logs
- Logs may contain:
  - ✅ User ID (non-sensitive)
  - ✅ Organization ID (non-sensitive)
  - ✅ Request status
  - ✅ Error messages (generic)

**Verification**:
- ✅ No credential leakage in logs
- ✅ Proper logging practices followed
- ✅ Production-safe implementation

---

### Test 7.2: Error Logging Contains Context

**Objective**: Verify errors are logged with enough context for debugging

**Setup**:
```sql
-- Corrupt organization_members data to trigger error
UPDATE organization_members
SET organization_id = NULL
WHERE user_id = 'test-user-uuid';
```

**Test Case**:
```bash
COOKIE=$(getAuthCookie 'user@example.com')
curl -X GET http://localhost:3000/api/customer/config/current \
  -H "Cookie: $COOKIE"

# Check logs for error context
grep "organization_members" /var/log/app/error.log
```

**Expected**:
- Logs contain relevant error context
- Error includes:
  - ✅ Endpoint name
  - ✅ Error type
  - ✅ User/org identifiers (non-sensitive)
  - ❌ NOT sensitive data

**Verification**:
- ✅ Logs support debugging
- ✅ No sensitive data exposed

---

## Test Execution Summary Template

```markdown
# Test Execution Report - /api/customer/config/current

## Test Suite 1: Authentication & Authorization
- [ ] 1.1: Unauthenticated Request - PASS/FAIL
- [ ] 1.2: Invalid Session Cookie - PASS/FAIL
- [ ] 1.3: No Organization - PASS/FAIL
- [ ] 1.4: No Customer Config - PASS/FAIL

## Test Suite 2: Data Isolation
- [ ] 2.1: Cross-Org Access Prevention - PASS/FAIL
- [ ] 2.2: Multi-Org User Isolation - PASS/FAIL

## Test Suite 3: Sensitive Data Protection
- [ ] 3.1: WooCommerce Credentials Protected - PASS/FAIL
- [ ] 3.2: Shopify Tokens Protected - PASS/FAIL
- [ ] 3.3: Encrypted Credentials Protected - PASS/FAIL
- [ ] 3.4: Non-Sensitive Data Included - PASS/FAIL

## Test Suite 4: Error Handling
- [ ] 4.1: Database Connection Failure - PASS/FAIL
- [ ] 4.2: Query Timeout Handling - PASS/FAIL
- [ ] 4.3: Missing Fields Handling - PASS/FAIL

## Test Suite 5: Injection Prevention
- [ ] 5.1: SQL Injection Prevention - PASS/FAIL
- [ ] 5.2: Path Traversal Prevention - PASS/FAIL

## Test Suite 6: Performance
- [ ] 6.1: Response Time - PASS/FAIL
- [ ] 6.2: Concurrent Requests - PASS/FAIL

## Test Suite 7: Logging & Monitoring
- [ ] 7.1: No Sensitive Data in Logs - PASS/FAIL
- [ ] 7.2: Error Context in Logs - PASS/FAIL

## Summary
- Total Tests: 22
- Passed: __
- Failed: __
- Date: __________
- Tester: __________
```

---

## Notes for Testers

1. **Authentication**: Use Supabase test user credentials or create users via auth API
2. **Database State**: Reset database between test suites for clean state
3. **Timing**: Performance tests should run on consistent hardware/network
4. **Concurrent Tests**: Use `&` for background processes and `wait` for completion
5. **Log Capture**: Configure application logging to file for easy inspection

---

**Test Suite Version**: 1.0
**Last Updated**: 2025-10-28
**Scope**: Security, performance, error handling, data protection
