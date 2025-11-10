# E2E Tests as Agent Training Data

**Type:** Analysis
**Status:** Active
**Last Updated:** 2025-11-09
**Purpose:** Analyze how E2E tests can serve as executable documentation for training AI agents to understand and use the application.

---

## Key Insight

**E2E tests are executable user manuals** - they demonstrate complete user workflows in code, making them perfect for:

1. **Agent Training** - Teaching AI how the app works
2. **Workflow Documentation** - Living documentation that never goes stale
3. **Feature Discovery** - Agents can discover what features exist
4. **Error Scenarios** - How the app handles failures and edge cases

---

## Current E2E Coverage Audit

### Existing Playwright Tests (5 tests)

#### ✅ 1. Chat Widget Integration ([chat-widget-integration.spec.ts](/__tests__/playwright/chat-widget-integration.spec.ts))
**What It Teaches:**
- How to embed the chat widget (`<script>` tag setup)
- How to configure widget behavior (`ChatWidgetConfig`)
- How to programmatically open widget (`ChatWidget.open()`)
- How to send messages to `/api/chat`
- Session metadata tracking implementation
- Known bug: Widget doesn't include `session_metadata` in requests

**Agent Learnings:**
```typescript
// An agent learning from this test would know:
1. Widget embedding requires 2 scripts
2. Widget has programmatic API: ChatWidget.open()
3. Messages go to /api/chat endpoint
4. Session tracking uses localStorage key: 'omniops-session-metadata'
5. Current limitation: session data not sent with chat requests
```

#### ✅ 2. Analytics Dashboard ([analytics-dashboard-display.spec.ts](/__tests__/playwright/analytics-dashboard-display.spec.ts))
**What It Teaches:**
- Dashboard has 8 metric cards (DAU, unique users, session duration, bounce rate, etc.)
- Shopping funnel visualization with 4 stages (Browse → Product → Cart → Checkout)
- API endpoint: `/api/dashboard/analytics`
- Error handling patterns (empty data, API failures)
- Tab navigation (Overview ↔ Business Intelligence)

**Agent Learnings:**
```typescript
// An agent would learn the complete analytics workflow:
1. Navigate to /dashboard/analytics
2. View 8 KPI cards
3. Interact with Daily Users chart (Recharts component)
4. See shopping funnel stages
5. Switch between Overview and BI tabs
6. Handle API errors gracefully with [role="alert"]
```

#### ✅ 3. Session Metadata Tracking ([session-metadata-tracking.spec.ts](/__tests__/playwright/session-metadata-tracking.spec.ts))
**What It Teaches:**
- Session tracking persists across page navigation
- Session ID format: `session-{timestamp}-{random}`
- Tracks page views in array structure
- Uses localStorage: `omniops-session-metadata`
- Automatically tracks all page navigations

**Agent Learnings:**
```typescript
// An agent learns session tracking implementation:
1. Session created on first page load
2. Session ID persists across navigation
3. Page views appended to array: { url, timestamp, referrer }
4. Stored in localStorage automatically
5. No manual API calls needed
```

#### ✅ 4. GDPR Privacy (gdpr-privacy.spec.ts)
**Not yet read - need to audit**

#### ✅ 5. Telemetry Smoke (telemetry-smoke.spec.ts)
**Not yet read - need to audit**

---

## Integration Tests (63 tests)

Your integration tests cover:
- WooCommerce flows (4 tests)
- Shopify UX flows
- Agent conversation flows (7+ tests)
- Metadata tracking
- Session persistence
- Cross-frame communication
- Purchase attribution
- RLS security

**Key Difference:** Integration tests focus on **API/service behavior**, while E2E tests demonstrate **user workflows**.

---

## Critical Missing E2E Coverage

### 🚨 High Priority - Complete User Journeys

#### 1. **Complete Shopping Flow**
**Missing Test:** `complete-shopping-journey.spec.ts`

```typescript
// What this would teach an agent:
test('complete customer journey from landing to purchase', async ({ page }) => {
  // 1. Land on site
  await page.goto('/');

  // 2. Open chat widget
  await ChatWidget.open();

  // 3. Ask about product
  await sendMessage('Do you have hydraulic pumps?');

  // 4. Agent recommends products
  await expectProductRecommendations();

  // 5. View product details
  await clickProduct('A4VTG90');

  // 6. Add to cart
  await clickAddToCart();

  // 7. Proceed to checkout
  await navigateToCheckout();

  // 8. Complete purchase
  await fillCheckoutForm();
  await submitOrder();

  // 9. Verify order confirmation
  await expectOrderConfirmation();
});
```

**Why Critical:**
- Shows complete business value proposition
- Demonstrates integration between chat → commerce → checkout
- Reveals the entire customer journey an agent needs to support

---

#### 2. **WooCommerce Integration Flow**
**Missing Test:** `woocommerce-integration-e2e.spec.ts`

```typescript
test('customer configures WooCommerce integration', async ({ page }) => {
  // 1. Login to dashboard
  await login();

  // 2. Navigate to integrations
  await page.goto('/dashboard/integrations/woocommerce');

  // 3. Enter WooCommerce credentials
  await fillForm({
    storeUrl: 'https://example.com',
    consumerKey: 'ck_xxx',
    consumerSecret: 'cs_xxx'
  });

  // 4. Test connection
  await clickTestConnection();
  await expectSuccess('Connection successful');

  // 5. Enable product sync
  await toggleSwitch('Enable Product Sync');

  // 6. Verify products appear in chat
  await openChatWidget();
  await sendMessage('Show me products');
  await expectWooCommerceProducts();
});
```

**Why Critical:**
- Shows customers how to set up integrations
- Demonstrates the value of WooCommerce connectivity
- Teaches agents how products become available in chat

---

#### 3. **Web Scraping Workflow**
**Missing Test:** `web-scraping-workflow.spec.ts`

```typescript
test('customer triggers web scraping for their domain', async ({ page }) => {
  // 1. Navigate to scraping dashboard
  await page.goto('/dashboard/scraping');

  // 2. Enter domain to scrape
  await fillInput('domain', 'example.com');

  // 3. Start scraping
  await clickButton('Start Scraping');

  // 4. Monitor progress
  await expectProgressBar();
  await waitForCompletion();

  // 5. Verify scraped pages
  await expectScrapedPages(count: > 0);

  // 6. Test in chat
  await openChatWidget();
  await sendMessage('What products do you offer?');
  await expectAnswerFromScrapedContent();
});
```

**Why Critical:**
- Shows how content enters the system
- Demonstrates scraping → embeddings → chat flow
- Critical for onboarding new customers

---

#### 4. **Privacy/GDPR Compliance Flow**
**Missing Test:** `privacy-compliance-workflow.spec.ts`

```typescript
test('user requests data export under GDPR', async ({ page }) => {
  // 1. Navigate to privacy page
  await page.goto('/privacy');

  // 2. Request data export
  await clickButton('Request My Data');
  await fillEmail('user@example.com');
  await submitRequest();

  // 3. Verify email sent
  await expectConfirmation('Export request received');

  // 4. (Simulated) Download export
  await downloadExport();

  // 5. Verify export contains session data
  await verifyExportContains(['messages', 'sessions', 'metadata']);
});

test('user requests account deletion under GDPR', async ({ page }) => {
  // Similar flow for deletion
});
```

**Why Critical:**
- Legal compliance requirement
- Shows customers their data rights
- Demonstrates privacy-first approach

---

#### 5. **Multi-Domain Isolation**
**Missing Test:** `multi-domain-isolation.spec.ts`

```typescript
test('customers cannot access other tenant data', async ({ page }) => {
  // 1. Login as Customer A
  await loginAs('customer-a@example.com');

  // 2. View their analytics
  await page.goto('/dashboard/analytics');
  const customerAData = await getAnalyticsData();

  // 3. Logout and login as Customer B
  await logout();
  await loginAs('customer-b@example.com');

  // 4. View Customer B analytics
  const customerBData = await getAnalyticsData();

  // 5. Verify complete isolation
  expect(customerAData).not.toEqual(customerBData);

  // 6. Attempt to access Customer A's domain directly (should fail)
  await page.goto('/dashboard/domains/customer-a-domain-id');
  await expectAccessDenied();
});
```

**Why Critical:**
- Security validation
- Multi-tenant architecture proof
- Customer trust requirement

---

### 🔶 Medium Priority - Feature-Specific Flows

#### 6. **Abandoned Cart Recovery**
```typescript
test('chat widget detects abandoned cart and offers help', async ({ page }) => {
  // 1. Add items to cart
  // 2. Leave checkout page
  // 3. Widget triggers "Need help with your order?" message
  // 4. User engages, agent helps complete purchase
});
```

#### 7. **Performance Monitoring**
```typescript
test('dashboard displays real-time performance metrics', async ({ page }) => {
  // Monitor response times, cache hit rates, API health
});
```

#### 8. **Error Recovery Flows**
```typescript
test('widget gracefully handles API failures', async ({ page }) => {
  // Simulate /api/chat failure
  // Verify retry logic
  // Verify user-friendly error messages
});
```

---

## How to Use E2E Tests for Agent Training

### 1. **Automated Workflow Extraction**

Create a script that parses E2E tests and extracts workflows:

```typescript
// scripts/extract-workflows-from-e2e.ts

interface WorkflowStep {
  action: string;
  target: string;
  expectedOutcome: string;
}

interface Workflow {
  name: string;
  description: string;
  steps: WorkflowStep[];
}

async function extractWorkflows(testFile: string): Promise<Workflow[]> {
  const ast = parseTypeScript(testFile);

  return ast.tests.map(test => ({
    name: test.name,
    description: test.description,
    steps: test.steps.map(step => ({
      action: step.action, // e.g., "click", "fill", "expect"
      target: step.selector,
      expectedOutcome: step.assertion
    }))
  }));
}

// Usage
const workflows = await extractWorkflows('__tests__/playwright/chat-widget-integration.spec.ts');

// Output:
// [
//   {
//     name: "should load widget, open programmatically, and send message",
//     steps: [
//       { action: "goto", target: "/test-widget", expectedOutcome: "page loaded" },
//       { action: "waitFor", target: "iframe#chat-widget-iframe", expectedOutcome: "iframe attached" },
//       { action: "call", target: "ChatWidget.open()", expectedOutcome: "widget expanded" }
//     ]
//   }
// ]
```

---

### 2. **Generate Agent Knowledge Base**

```typescript
// Generate markdown documentation from E2E tests

const agentKnowledgeBase = `
# How to Use the Chat Widget (Learned from E2E Tests)

## Embedding the Widget
\`\`\`html
<!-- Step 1: Configure -->
<script>
window.ChatWidgetConfig = { serverUrl: "https://omniops.co.uk" };
</script>

<!-- Step 2: Load bundle -->
<script src="https://omniops.co.uk/embed.js" async></script>
\`\`\`

## Opening the Widget Programmatically
\`\`\`javascript
window.ChatWidget.open();
\`\`\`

## Sending Messages
Messages are sent to \`POST /api/chat\` with payload:
\`\`\`json
{
  "message": "User message here",
  "domain": "example.com",
  "session_id": "session-1234567890-abc123"
}
\`\`\`

## Session Tracking
- Sessions stored in localStorage: \`omniops-session-metadata\`
- Format: \`{ session_id, page_views: [] }\`
- Automatically tracks all page navigation

## Known Issues
- ⚠️ Widget does not currently include \`session_metadata\` in chat requests
- See: chat-widget-integration.spec.ts:135-146
`;
```

---

### 3. **Agent Prompt Engineering with E2E Context**

```typescript
const agentPrompt = `
You are an AI assistant helping users navigate OmniOps platform.

I have learned how the platform works by studying executable tests:

## Chat Widget Usage (from chat-widget-integration.spec.ts)
- Embed with 2 scripts
- Open programmatically: ChatWidget.open()
- Messages sent to /api/chat
- Session tracking via localStorage

## Analytics Dashboard (from analytics-dashboard-display.spec.ts)
- URL: /dashboard/analytics
- 8 metrics: DAU, total users, session duration, bounce rate, product views, cart views, checkout views, conversion rate
- Interactive charts using Recharts
- Shopping funnel: Browse → Product → Cart → Checkout

## Session Tracking (from session-metadata-tracking.spec.ts)
- Automatic tracking across page navigation
- Session ID format: session-{timestamp}-{random}
- Stored in localStorage: omniops-session-metadata

When users ask how to use features, I reference these tested workflows.

User: How do I view my analytics?

Agent: Based on the analytics-dashboard-display.spec.ts test, here's how:

1. Navigate to /dashboard/analytics
2. You'll see 8 KPI cards showing:
   - Daily Active Users
   - Total Unique Users
   - Average Session Duration
   - Bounce Rate
   - Product Views
   - Cart Views
   - Checkout Views
   - Conversion Rate
3. The page also displays:
   - Daily Users chart (line graph)
   - Shopping funnel visualization (4 stages)
   - Top Pages view
4. You can switch between "Overview" and "Business Intelligence" tabs

The page automatically loads data from /api/dashboard/analytics endpoint.
`;
```

---

## Actionable Next Steps

### Phase 1: Create Missing High-Priority E2E Tests (2-3 days)

**Priority 1: Complete Shopping Journey**
- File: `__tests__/playwright/complete-shopping-journey.spec.ts`
- Demonstrates: Landing → Chat → Product → Cart → Checkout → Purchase
- Value: Shows complete business value proposition

**Priority 2: WooCommerce Integration**
- File: `__tests__/playwright/woocommerce-integration.spec.ts`
- Demonstrates: Setup → Configuration → Product Sync → Chat Integration
- Value: Critical for customer onboarding

**Priority 3: Web Scraping Workflow**
- File: `__tests__/playwright/web-scraping-workflow.spec.ts`
- Demonstrates: Domain input → Scraping → Verification → Chat testing
- Value: Shows how content enters the system

**Priority 4: Privacy Compliance**
- File: `__tests__/playwright/privacy-compliance.spec.ts`
- Demonstrates: Data export + Data deletion workflows
- Value: Legal compliance requirement

**Priority 5: Multi-Domain Isolation**
- File: `__tests__/playwright/multi-domain-isolation.spec.ts`
- Demonstrates: Tenant isolation, security boundaries
- Value: Security validation for multi-tenant architecture

---

### Phase 2: Build Workflow Extraction Tool (1 day)

Create `scripts/extract-workflows-from-e2e.ts`:

```typescript
import * as ts from 'typescript';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface WorkflowStep {
  lineNumber: number;
  action: string;
  target?: string;
  value?: string;
  expectedOutcome?: string;
}

interface Workflow {
  testFile: string;
  testName: string;
  description: string;
  steps: WorkflowStep[];
}

async function extractAllWorkflows(): Promise<Workflow[]> {
  const testFiles = await glob('__tests__/playwright/**/*.spec.ts');
  const workflows: Workflow[] = [];

  for (const file of testFiles) {
    const fileWorkflows = await extractWorkflowsFromFile(file);
    workflows.push(...fileWorkflows);
  }

  return workflows;
}

async function extractWorkflowsFromFile(filePath: string): Promise<Workflow[]> {
  const sourceCode = readFileSync(filePath, 'utf-8');
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceCode,
    ts.ScriptTarget.Latest,
    true
  );

  const workflows: Workflow[] = [];

  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const expression = node.expression;

      // Look for test() calls
      if (
        ts.isIdentifier(expression) &&
        expression.text === 'test' &&
        node.arguments.length >= 2
      ) {
        const testName = getStringLiteral(node.arguments[0]);
        const callback = node.arguments[1];

        if (testName && ts.isFunctionLike(callback)) {
          const steps = extractStepsFromCallback(callback, sourceFile);
          workflows.push({
            testFile: filePath,
            testName,
            description: extractDescription(node, sourceFile),
            steps
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return workflows;
}

function extractStepsFromCallback(
  callback: ts.FunctionLikeDeclaration,
  sourceFile: ts.SourceFile
): WorkflowStep[] {
  const steps: WorkflowStep[] = [];

  function visitStatement(node: ts.Node) {
    if (ts.isAwaitExpression(node)) {
      const step = parseAwaitExpression(node, sourceFile);
      if (step) steps.push(step);
    }
    ts.forEachChild(node, visitStatement);
  }

  if (callback.body) {
    ts.forEachChild(callback.body, visitStatement);
  }

  return steps;
}

function parseAwaitExpression(
  node: ts.AwaitExpression,
  sourceFile: ts.SourceFile
): WorkflowStep | null {
  const { line } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
  const expression = node.expression;

  if (!ts.isCallExpression(expression)) return null;

  const text = expression.getText(sourceFile);

  // Parse different Playwright actions
  if (text.includes('.goto(')) {
    return {
      lineNumber: line + 1,
      action: 'navigate',
      target: extractFirstStringArg(expression),
    };
  } else if (text.includes('.click(')) {
    return {
      lineNumber: line + 1,
      action: 'click',
      target: extractSelector(expression),
    };
  } else if (text.includes('.fill(')) {
    return {
      lineNumber: line + 1,
      action: 'fill',
      target: extractSelector(expression),
      value: extractSecondStringArg(expression),
    };
  } else if (text.includes('expect(')) {
    return {
      lineNumber: line + 1,
      action: 'verify',
      expectedOutcome: text,
    };
  }

  return {
    lineNumber: line + 1,
    action: 'unknown',
    target: text.slice(0, 50),
  };
}

function getStringLiteral(node: ts.Node): string | null {
  if (ts.isStringLiteral(node)) {
    return node.text;
  }
  return null;
}

function extractDescription(node: ts.Node, sourceFile: ts.SourceFile): string {
  // Look for JSDoc comment before test
  const ranges = ts.getLeadingCommentRanges(
    sourceFile.getFullText(),
    node.getFullStart()
  );

  if (ranges && ranges.length > 0) {
    const comment = sourceFile.getFullText().slice(ranges[0].pos, ranges[0].end);
    return comment.replace(/\/\*\*?|\*\/|\*/g, '').trim();
  }

  return '';
}

// Generate markdown documentation
async function generateMarkdownDocs() {
  const workflows = await extractAllWorkflows();

  let markdown = '# Application Workflows (Extracted from E2E Tests)\n\n';
  markdown += `**Generated:** ${new Date().toISOString()}\n\n`;
  markdown += `**Total Workflows:** ${workflows.length}\n\n`;
  markdown += '---\n\n';

  for (const workflow of workflows) {
    markdown += `## ${workflow.testName}\n\n`;
    markdown += `**Source:** \`${workflow.testFile}\`\n\n`;

    if (workflow.description) {
      markdown += `**Description:** ${workflow.description}\n\n`;
    }

    markdown += '**Steps:**\n\n';
    for (let i = 0; i < workflow.steps.length; i++) {
      const step = workflow.steps[i];
      markdown += `${i + 1}. **${step.action}**`;

      if (step.target) markdown += ` → \`${step.target}\``;
      if (step.value) markdown += ` (value: "${step.value}")`;
      if (step.expectedOutcome) markdown += ` → Expect: ${step.expectedOutcome}`;

      markdown += ` _(line ${step.lineNumber})_\n`;
    }

    markdown += '\n---\n\n';
  }

  writeFileSync('docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md', markdown);
  console.log(`Generated documentation for ${workflows.length} workflows`);
}

// Run extraction
generateMarkdownDocs().catch(console.error);
```

**Usage:**
```bash
npx tsx scripts/extract-workflows-from-e2e.ts
# Generates: docs/10-ANALYSIS/WORKFLOWS_FROM_E2E_TESTS.md
```

---

### Phase 3: Generate Agent Training Data (1 day)

Create `scripts/generate-agent-training-data.ts`:

```typescript
import { extractAllWorkflows } from './extract-workflows-from-e2e';

interface AgentKnowledge {
  feature: string;
  howToUse: string[];
  apiEndpoints: string[];
  expectedBehavior: string[];
  knownIssues: string[];
}

async function generateAgentKnowledgeBase(): Promise<AgentKnowledge[]> {
  const workflows = await extractAllWorkflows();
  const knowledge: Map<string, AgentKnowledge> = new Map();

  // Group workflows by feature
  for (const workflow of workflows) {
    const feature = extractFeatureName(workflow.testFile);

    if (!knowledge.has(feature)) {
      knowledge.set(feature, {
        feature,
        howToUse: [],
        apiEndpoints: [],
        expectedBehavior: [],
        knownIssues: []
      });
    }

    const featureKnowledge = knowledge.get(feature)!;

    // Extract usage steps
    const usageSteps = workflow.steps
      .filter(s => ['navigate', 'click', 'fill'].includes(s.action))
      .map(s => `${s.action} ${s.target || s.value || ''}`);

    featureKnowledge.howToUse.push(...usageSteps);

    // Extract API endpoints
    const endpoints = workflow.steps
      .filter(s => s.target?.includes('/api/'))
      .map(s => s.target!);

    featureKnowledge.apiEndpoints.push(...endpoints);

    // Extract expected behaviors
    const behaviors = workflow.steps
      .filter(s => s.action === 'verify')
      .map(s => s.expectedOutcome || '');

    featureKnowledge.expectedBehavior.push(...behaviors);
  }

  return Array.from(knowledge.values());
}

async function exportForAgentPrompt() {
  const knowledge = await generateAgentKnowledgeBase();

  const prompt = `
# OmniOps Platform Knowledge (Learned from E2E Tests)

You are an AI assistant with comprehensive knowledge of OmniOps platform.
This knowledge was extracted from executable E2E tests, ensuring accuracy.

${knowledge.map(k => `
## ${k.feature}

**How to Use:**
${k.howToUse.map(step => `- ${step}`).join('\n')}

**API Endpoints:**
${k.apiEndpoints.map(ep => `- \`${ep}\``).join('\n')}

**Expected Behavior:**
${k.expectedBehavior.map(b => `- ${b}`).join('\n')}

${k.knownIssues.length > 0 ? `**Known Issues:**\n${k.knownIssues.map(i => `- ⚠️ ${i}`).join('\n')}` : ''}
`).join('\n---\n')}

When users ask questions, reference this knowledge to provide accurate, tested information.
`;

  writeFileSync('docs/AGENT_KNOWLEDGE_BASE.md', prompt);
  console.log('Agent knowledge base generated');
}

exportForAgentPrompt().catch(console.error);
```

---

### Phase 4: Add to CLAUDE.md (30 minutes)

Add new section to [CLAUDE.md](/Users/jamesguy/Omniops/CLAUDE.md):

```markdown
## E2E Tests as Executable Documentation

**CRITICAL**: E2E tests are not just for validation - they're **living documentation** of how the application works.

### When Helping Users

1. **Reference E2E Tests**: Check `__tests__/playwright/` for workflow examples
2. **Extract Workflows**: Use `npx tsx scripts/extract-workflows-from-e2e.ts`
3. **Generate Agent Knowledge**: Use `npx tsx scripts/generate-agent-training-data.ts`

### E2E Test Coverage

See [ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md](docs/10-ANALYSIS/ANALYSIS_E2E_AS_AGENT_TRAINING_DATA.md) for complete analysis.

**Current Coverage:**
- ✅ Chat widget integration
- ✅ Analytics dashboard
- ✅ Session tracking
- ✅ GDPR privacy
- ✅ Telemetry smoke tests

**Missing Critical Tests:**
- ❌ Complete shopping journey
- ❌ WooCommerce integration setup
- ❌ Web scraping workflow
- ❌ Multi-domain isolation
```

---

## Success Metrics

### Quantifiable Goals

1. **E2E Test Coverage**: 15+ complete user journey tests
2. **Workflow Extraction**: Automated extraction from all E2E tests
3. **Agent Knowledge Base**: Comprehensive knowledge docs generated from tests
4. **Documentation Accuracy**: 100% (tests = living docs, never stale)

### Impact Measurements

- **Agent Efficiency**: Reduce time to answer "how do I...?" questions by 80%
- **Customer Onboarding**: E2E tests serve as interactive tutorials
- **Feature Discovery**: Agents can discover all features automatically
- **Documentation Staleness**: 0% (tests must pass = docs accurate)

---

## Conclusion

**E2E tests are a goldmine of application knowledge.** They demonstrate:

✅ **Complete user workflows** (not just API contracts)
✅ **Real-world usage patterns** (how customers actually use features)
✅ **Error scenarios** (what can go wrong and how app handles it)
✅ **Integration flows** (how components work together)

**Next Action:** Create the 5 missing high-priority E2E tests to fill critical gaps in workflow documentation.

**Long-term Vision:** All major features have E2E tests that serve dual purpose:
1. Quality assurance (tests pass = feature works)
2. Agent training (tests explain = agents understand)

This creates a **self-documenting system** where tests are both validators AND teachers.