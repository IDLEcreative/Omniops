# PRODUCTION AUDIT INTEGRATION ROADMAP

**Created:** 2025-11-19
**Status:** Planning Phase
**Purpose:** Implementation roadmap for integrating all production audit deliverables into the live application

**Context:** We've created 100+ files (legal docs, monitoring, infrastructure, testing) but they need to be **integrated** into the running application. This is the "now what?" roadmap.

---

## EXECUTIVE SUMMARY

**Current State:** Foundation complete, but not integrated
**Target State:** Fully operational production-ready SaaS
**Estimated Effort:** 4-6 weeks across 6 phases
**Team Size:** 2-3 developers recommended

---

## PHASE 1: CRITICAL LEGAL COMPLIANCE (Week 1)
**Priority:** 🚨 CRITICAL - Required before public launch
**Effort:** 20-25 hours
**Blockers:** Cannot legally launch without this

### 1.1 Create Legal Pages (8 hours)

**Frontend Implementation:**
```bash
# Create these Next.js pages:
app/legal/terms/page.tsx              # Terms of Service
app/legal/privacy/page.tsx            # Privacy Policy
app/legal/cookies/page.tsx            # Cookie Policy
app/legal/dpa/page.tsx                # Data Processing Agreement
```

**Requirements:**
- [ ] Convert markdown to React components
- [ ] Style with Tailwind CSS (match site design)
- [ ] Add table of contents with anchor links
- [ ] Add "Last Updated" date at top
- [ ] Make mobile-responsive
- [ ] Add meta tags for SEO

**Acceptance Criteria:**
- Legal pages accessible at `/legal/terms`, `/legal/privacy`, `/legal/cookies`
- Content matches approved legal documents
- Pages are crawlable by Google
- Load time <2s

### 1.2 Cookie Consent Banner (6 hours)

**Component to Build:**
```tsx
// components/cookie-consent-banner.tsx
export function CookieConsentBanner() {
  // Shows on first visit
  // Offers: Accept All, Reject All, Customize
  // Stores preference in localStorage + cookie
  // Blocks analytics until consent given
}
```

**Requirements:**
- [ ] Show on first visit only
- [ ] Persistent until user chooses
- [ ] Three options: Accept All, Reject All, Customize
- [ ] Store consent in cookie (`cookie_consent=true|false|custom`)
- [ ] Block Google Analytics until consent
- [ ] Link to Cookie Policy page
- [ ] GDPR compliant (consent before tracking)

**Integration Points:**
- Add to `app/layout.tsx` (global)
- Add to `app/embed/page.tsx` (widget)
- Connect to analytics initialization

**Acceptance Criteria:**
- Banner shows on first visit
- Preference persists across sessions
- Analytics blocked until consent
- Complies with GDPR Article 7

### 1.3 Terms Acceptance in Signup (4 hours)

**Modify Signup Flow:**
```tsx
// app/signup/page.tsx or wherever signup lives
<Checkbox>
  I agree to the{' '}
  <Link href="/legal/terms">Terms of Service</Link>
  {' '}and{' '}
  <Link href="/legal/privacy">Privacy Policy</Link>
</Checkbox>

// Store acceptance in database:
user_agreements {
  user_id: uuid
  terms_version: string  // "2025-11-19"
  accepted_at: timestamp
  ip_address: string
}
```

**Requirements:**
- [ ] Add checkbox to signup form (required)
- [ ] Create `user_agreements` table in Supabase
- [ ] Store acceptance timestamp + IP address
- [ ] Version terms (update when ToS changes)
- [ ] Block signup without acceptance

**Database Migration:**
```sql
CREATE TABLE user_agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  terms_version text NOT NULL,
  accepted_at timestamptz DEFAULT now(),
  ip_address inet,
  UNIQUE(user_id, terms_version)
);

CREATE INDEX idx_user_agreements_user_id ON user_agreements(user_id);
```

**Acceptance Criteria:**
- Cannot sign up without accepting terms
- Acceptance logged in database with timestamp
- Can prove user consent for legal purposes

### 1.4 Footer Legal Links (2 hours)

**Update Footer:**
```tsx
// components/footer.tsx
<footer>
  <nav>
    <Link href="/legal/terms">Terms of Service</Link>
    <Link href="/legal/privacy">Privacy Policy</Link>
    <Link href="/legal/cookies">Cookie Policy</Link>
    <Link href="/dashboard/privacy">Your Privacy Rights</Link>
  </nav>
</footer>
```

**Requirements:**
- [ ] Add to main site footer
- [ ] Add to widget footer (if applicable)
- [ ] Mobile-responsive
- [ ] Accessible (keyboard navigation)

**Acceptance Criteria:**
- Legal links visible on every page
- Links work and open correct pages

---

## PHASE 2: PRIVACY FEATURES UI (Week 2)
**Priority:** ⚡ HIGH - GDPR requires user-accessible privacy controls
**Effort:** 15-20 hours
**Dependencies:** Phase 1 complete

### 2.1 Privacy Dashboard Page (10 hours)

**Create:**
```tsx
// app/dashboard/privacy/page.tsx
export default function PrivacyDashboard() {
  return (
    <div>
      <h1>Your Privacy Rights</h1>

      {/* GDPR Rights */}
      <section>
        <h2>Your Data Rights</h2>
        <ul>
          <li>Right to Access (Article 15)</li>
          <li>Right to Rectification (Article 16)</li>
          <li>Right to Erasure (Article 17)</li>
          <li>Right to Data Portability (Article 20)</li>
        </ul>
      </section>

      {/* Actions */}
      <ExportDataButton />
      <DeleteAccountButton />
      <CookiePreferencesButton />

      {/* Privacy Settings */}
      <PrivacySettings />
    </div>
  );
}
```

**Components to Build:**

**2.1.1 Export Data Button**
```tsx
// components/privacy/export-data-button.tsx
export function ExportDataButton() {
  const handleExport = async () => {
    // Call /api/privacy/export
    // Show loading state
    // Download ZIP file
  };

  return (
    <Button onClick={handleExport}>
      Download My Data
    </Button>
  );
}
```

**2.1.2 Delete Account Button**
```tsx
// components/privacy/delete-account-button.tsx
export function DeleteAccountButton() {
  const [showModal, setShowModal] = useState(false);

  const handleDelete = async () => {
    // Call /api/privacy/delete
    // Show confirmation modal
    // Require password re-entry
    // Log out after deletion
  };

  return (
    <>
      <Button variant="destructive" onClick={() => setShowModal(true)}>
        Delete My Account
      </Button>

      <DeleteConfirmationModal
        open={showModal}
        onConfirm={handleDelete}
        onCancel={() => setShowModal(false)}
      />
    </>
  );
}
```

**2.1.3 Cookie Preferences**
```tsx
// components/privacy/cookie-preferences.tsx
export function CookiePreferences() {
  const [preferences, setPreferences] = useState({
    essential: true,  // Always true, can't be disabled
    analytics: false,
    marketing: false,
  });

  const handleSave = () => {
    // Store in cookie
    // Reload analytics scripts if changed
  };

  return (
    <form>
      <Toggle disabled checked>Essential Cookies</Toggle>
      <Toggle checked={preferences.analytics}>Analytics</Toggle>
      <Toggle checked={preferences.marketing}>Marketing</Toggle>
      <Button onClick={handleSave}>Save Preferences</Button>
    </form>
  );
}
```

**Requirements:**
- [ ] Privacy dashboard accessible at `/dashboard/privacy`
- [ ] All GDPR rights explained
- [ ] Export data button works (downloads ZIP)
- [ ] Delete account requires confirmation + password
- [ ] Cookie preferences can be updated
- [ ] All actions logged for compliance

**Acceptance Criteria:**
- User can export all their data as JSON
- User can delete account (removes all data)
- User can manage cookie preferences
- All actions complete within 30 seconds
- GDPR Article 12 compliance (clear, accessible)

### 2.2 Privacy API Enhancement (5 hours)

**Current:** APIs exist but may need UI polish

**Enhancements:**
```typescript
// app/api/privacy/export/route.ts
// Add progress tracking for large exports
// Return ZIP file instead of JSON
// Include all related data (conversations, messages, etc.)

// app/api/privacy/delete/route.ts
// Add "cooling off" period (30 days)
// Send confirmation email
// Log deletion for compliance
// Delete from all tables (CASCADE)

// app/api/privacy/update/route.ts (NEW)
// Allow users to update their data
// GDPR Article 16 (Right to Rectification)
```

**Requirements:**
- [ ] Export includes ALL user data (not just user table)
- [ ] Export is ZIP file with JSON inside
- [ ] Delete has 30-day cooling off period
- [ ] Delete sends confirmation email
- [ ] Update endpoint for data rectification

**Acceptance Criteria:**
- Export ZIP contains: profile, conversations, messages, settings
- Delete marks for deletion, processes after 30 days
- User can cancel deletion within cooling off period

---

## PHASE 3: MONITORING & OBSERVABILITY (Week 2-3)
**Priority:** ⚡ HIGH - Essential for production stability
**Effort:** 12-15 hours
**Dependencies:** None (can run in parallel with Phase 2)

### 3.1 Sentry Integration (6 hours)

**Installation:**
```bash
npm install @sentry/nextjs
```

**Configuration:**
```typescript
// app/layout.tsx (Client Component wrapper)
'use client';
import { useEffect } from 'react';
import { initializeSentry } from '@/lib/monitoring/sentry';

export function SentryProvider({ children }) {
  useEffect(() => {
    initializeSentry();
  }, []);

  return children;
}

// Wrap app in layout.tsx:
<SentryProvider>
  {children}
</SentryProvider>
```

**API Route Wrapping:**
```typescript
// Update ALL app/api/*/route.ts files
import { withSentryErrorTracking } from '@/lib/monitoring/sentry-helpers';

export const POST = withSentryErrorTracking(async (request) => {
  // Your existing code
});
```

**Environment Variables:**
```bash
# Add to .env.local:
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/yyy
SENTRY_ORG=your-org
SENTRY_PROJECT=omniops
SENTRY_AUTH_TOKEN=your-token
```

**Requirements:**
- [ ] Create Sentry account (sentry.io)
- [ ] Install @sentry/nextjs package
- [ ] Initialize in app/layout.tsx
- [ ] Wrap all API routes with error tracking
- [ ] Configure source maps for better stack traces
- [ ] Set up alerts (Slack, email)
- [ ] Test by triggering sample error

**Acceptance Criteria:**
- Errors appear in Sentry dashboard within 1 minute
- Stack traces show correct file/line numbers
- User context captured (user ID, session ID)
- Performance metrics visible (p50, p95, p99)

### 3.2 Uptime Monitoring (3 hours)

**Service Setup:**
```
Option 1: Better Uptime (recommended)
- Sign up at betteruptime.com
- Add monitors for:
  - https://omniops.co.uk (homepage)
  - https://omniops.co.uk/api/health
  - https://omniops.co.uk/embed (widget)
- Configure: Check every 1 minute
- Alert channels: Slack, email, SMS

Option 2: UptimeRobot (free tier)
- Sign up at uptimerobot.com
- Similar configuration
```

**Endpoints to Monitor:**
- [ ] Main site (200 status)
- [ ] API health endpoint (200 + JSON response)
- [ ] Widget embed page (200)
- [ ] Supabase connectivity (via health endpoint)
- [ ] Redis connectivity (via health endpoint)

**Alert Configuration:**
- [ ] Slack webhook for instant notifications
- [ ] Email for downtime >5 minutes
- [ ] SMS for downtime >15 minutes (optional)

**Requirements:**
- [ ] Sign up for uptime monitoring service
- [ ] Configure all critical endpoints
- [ ] Set up alert channels (Slack required)
- [ ] Create status page (public or private)
- [ ] Test alerts by simulating downtime

**Acceptance Criteria:**
- Alerts arrive within 2 minutes of actual downtime
- False positive rate <1%
- Status page shows uptime history

### 3.3 Log Aggregation (3 hours)

**Service Setup:**
```
Option 1: Logtail (recommended - best for Vercel)
- Sign up at logtail.com
- Install: npm install @logtail/node
- Configure source token

Option 2: Axiom
- Sign up at axiom.co
- Great for high-volume logs
```

**Integration:**
```typescript
// Replace console.log with structured logger:
import { structuredLogger } from '@/lib/monitoring/logger';

// OLD:
console.log('User logged in');

// NEW:
structuredLogger.info('User logged in', {
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString()
});
```

**Update All Files:**
```bash
# Find all console.log usages:
grep -r "console.log" app/
grep -r "console.error" app/

# Replace with structured logger
# (Can be automated with find/replace)
```

**Requirements:**
- [ ] Sign up for log aggregation service
- [ ] Install logging package
- [ ] Replace console.log with structured logger
- [ ] Add correlation IDs to requests
- [ ] Configure log retention (30 days minimum)
- [ ] Set up log-based alerts (error rate >10/min)

**Acceptance Criteria:**
- All logs searchable in log aggregation UI
- Can trace request flow with correlation ID
- Error logs trigger alerts in Slack
- Retention policy configured

---

## PHASE 4: INFRASTRUCTURE DEPLOYMENT (Week 3-4)
**Priority:** 📝 MEDIUM - Can launch on Vercel first, then migrate
**Effort:** 25-30 hours
**Dependencies:** Cloud account, billing setup

### 4.1 Cloud Provider Selection (2 hours)

**Decision Matrix:**

| Provider | Pros | Cons | Cost |
|----------|------|------|------|
| **AWS** | Most features, mature | Complex, expensive | $$$ |
| **GCP** | Great for Kubernetes, cheaper | Less mature | $$ |
| **Azure** | Enterprise-friendly | Steep learning curve | $$$ |
| **DigitalOcean** | Simple, cheap | Limited features | $ |

**Recommendation:** Start with **GCP** for Kubernetes + Terraform compatibility

**Requirements:**
- [ ] Create cloud account
- [ ] Set up billing alerts ($100, $500, $1000)
- [ ] Create service account for Terraform
- [ ] Configure IAM permissions
- [ ] Set up billing budgets

### 4.2 Terraform Deployment (12 hours)

**Setup:**
```bash
cd terraform

# Install Terraform
brew install terraform  # macOS

# Initialize
terraform init

# Review plan
terraform plan

# Apply (creates cloud resources)
terraform apply
```

**Customize Variables:**
```hcl
# terraform/terraform.tfvars
project_name = "omniops"
environment  = "production"
region       = "us-central1"  # or your preferred region

# Database
database_instance_type = "db-g1-small"  # Start small

# Redis
redis_memory_size_gb = 1  # Start with 1GB

# CDN
cdn_enabled = true
```

**Resources Created:**
- [ ] VPC and subnets
- [ ] S3 buckets (assets, backups)
- [ ] CloudFront CDN
- [ ] ElastiCache Redis cluster
- [ ] Secrets Manager
- [ ] CloudWatch monitoring
- [ ] IAM roles and policies

**Requirements:**
- [ ] Customize terraform.tfvars
- [ ] Run terraform plan
- [ ] Review costs estimate
- [ ] Run terraform apply
- [ ] Verify all resources created
- [ ] Test connectivity

**Cost Estimate:**
- Small setup: ~$100-200/month
- Medium setup: ~$500-800/month
- Large setup: ~$2000+/month

**Acceptance Criteria:**
- All resources created successfully
- No Terraform errors
- State file stored in cloud (not local)
- Can destroy and recreate environment

### 4.3 Kubernetes Deployment (12 hours)

**Setup Cluster:**
```bash
# Option 1: GCP (GKE)
gcloud container clusters create omniops-prod \
  --num-nodes=3 \
  --machine-type=e2-medium \
  --region=us-central1

# Option 2: AWS (EKS)
eksctl create cluster \
  --name omniops-prod \
  --region us-east-1 \
  --nodes 3 \
  --node-type t3.medium

# Option 3: DigitalOcean (DOKS)
doctl kubernetes cluster create omniops-prod \
  --count 3 \
  --size s-2vcpu-4gb \
  --region nyc1
```

**Deploy Application:**
```bash
# Create namespace
kubectl apply -f k8s/namespace.yaml

# Create secrets (DO NOT commit real values)
kubectl create secret generic omniops-secrets \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=your-key \
  --from-literal=OPENAI_API_KEY=your-key \
  -n omniops-prod

# Deploy app
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/hpa.yaml

# Verify
kubectl get pods -n omniops-prod
kubectl get services -n omniops-prod
kubectl logs -f deployment/omniops-app -n omniops-prod
```

**Requirements:**
- [ ] Create Kubernetes cluster
- [ ] Configure kubectl locally
- [ ] Create secrets (from .env.local)
- [ ] Deploy all manifests
- [ ] Verify pods are running
- [ ] Test application is accessible
- [ ] Configure domain DNS (point to LoadBalancer)
- [ ] Set up TLS certificate (Let's Encrypt)

**Acceptance Criteria:**
- Application accessible via public URL
- Auto-scaling works (test with load)
- Zero-downtime deployments possible
- Logs accessible via kubectl

---

## PHASE 5: CI/CD AUTOMATION (Week 4)
**Priority:** 📝 MEDIUM - Manual deploys work, but automation is better
**Effort:** 10-15 hours
**Dependencies:** Phase 4 complete (infrastructure deployed)

### 5.1 GitHub Actions Deployment Pipeline (8 hours)

**Create Workflow:**
```yaml
# .github/workflows/deploy-production.yml
name: Deploy to Production

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm install
      - run: npm run lint
      - run: npm test
      - run: npm run test:accessibility
      - run: npm run build

  deploy-vercel:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-k8s:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT }}/omniops:${{ github.sha }} .
          docker push gcr.io/${{ secrets.GCP_PROJECT }}/omniops:${{ github.sha }}

      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/omniops-app \
            omniops=gcr.io/${{ secrets.GCP_PROJECT }}/omniops:${{ github.sha }} \
            -n omniops-prod
          kubectl rollout status deployment/omniops-app -n omniops-prod
```

**Requirements:**
- [ ] Create deployment workflow
- [ ] Add GitHub secrets (VERCEL_TOKEN, GCP credentials, etc.)
- [ ] Test workflow on staging branch
- [ ] Enable branch protection (require passing tests)
- [ ] Configure automatic deployments on merge

**Acceptance Criteria:**
- Merge to main → auto-deploys to production
- All tests must pass before deploy
- Failed tests block deployment
- Rollback possible with one click

### 5.2 Database Migration Automation (4 hours)

**Create Migration Workflow:**
```yaml
# .github/workflows/migrate-database.yml
name: Run Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'migrations/**'

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run Supabase migrations
        run: |
          npx supabase db push \
            --db-url ${{ secrets.SUPABASE_DB_URL }}
```

**Requirements:**
- [ ] Migrations run automatically on merge
- [ ] Rollback script available
- [ ] Test migrations on staging first
- [ ] Backup database before migration

**Acceptance Criteria:**
- Migrations run automatically
- Failed migrations don't break production
- Can rollback within 15 minutes

---

## PHASE 6: TESTING & QUALITY ENFORCEMENT (Week 5-6)
**Priority:** 📝 MEDIUM - Can launch without, but important for quality
**Effort:** 15-20 hours
**Dependencies:** None (can start anytime)

### 6.1 Fix Accessibility Violations (8 hours)

**Run Tests:**
```bash
npm run test:accessibility
```

**Common Violations to Fix:**
- [ ] Color contrast issues (text too light)
- [ ] Missing form labels
- [ ] Missing alt text on images
- [ ] Invalid ARIA attributes
- [ ] Keyboard navigation broken
- [ ] Focus indicators missing

**Requirements:**
- [ ] Run accessibility tests
- [ ] Fix all critical violations
- [ ] Fix all serious violations
- [ ] Document any exceptions
- [ ] Achieve WCAG 2.1 AA compliance

**Acceptance Criteria:**
- All accessibility tests pass
- Manual keyboard navigation works
- Screen reader announces correctly

### 6.2 Optimize Performance (8 hours)

**Run Lighthouse:**
```bash
npm run test:lighthouse
```

**Common Optimizations:**
- [ ] Optimize images (use Next.js Image component)
- [ ] Minimize JavaScript bundle size
- [ ] Lazy load below-the-fold content
- [ ] Implement caching headers
- [ ] Compress assets with gzip/brotli
- [ ] Defer non-critical CSS
- [ ] Use CDN for static assets

**Requirements:**
- [ ] Run Lighthouse CI
- [ ] Achieve performance budget (90+)
- [ ] Optimize images
- [ ] Reduce bundle size
- [ ] Enable caching

**Acceptance Criteria:**
- Performance score: 90+
- Accessibility score: 100
- Best Practices: 95+
- SEO: 90+
- First Contentful Paint: <1.5s
- Largest Contentful Paint: <2.5s

### 6.3 Load Testing (4 hours)

**Run Tests:**
```bash
# Install k6
brew install k6

# Start dev server
npm run dev

# Run load tests
npm run test:load:chat
npm run test:load:scraping
```

**Analyze Results:**
- [ ] Identify bottlenecks (slow endpoints)
- [ ] Check database connection pool usage
- [ ] Monitor Redis memory usage
- [ ] Profile slow queries
- [ ] Optimize as needed

**Requirements:**
- [ ] Install k6
- [ ] Run chat load test (100 users)
- [ ] Run scraping load test (20 jobs)
- [ ] Analyze results
- [ ] Optimize bottlenecks
- [ ] Re-test until targets met

**Acceptance Criteria:**
- Chat API p95: <2s
- Scraping API p95: <3s
- Error rate: <1%
- Database connections: <80% of pool

---

## SUCCESS METRICS

### Legal Compliance
- [ ] Legal pages published and accessible
- [ ] Cookie consent banner implemented
- [ ] Terms acceptance in signup flow
- [ ] Privacy dashboard functional
- [ ] GDPR user rights accessible

### Monitoring
- [ ] Sentry capturing errors (0 setup errors)
- [ ] Uptime monitoring configured (3+ endpoints)
- [ ] Logs aggregated and searchable
- [ ] Alerts configured (Slack notifications)

### Infrastructure
- [ ] Terraform deployed (all resources created)
- [ ] Kubernetes running (3+ pods)
- [ ] Auto-scaling functional (test passed)
- [ ] CI/CD automated (merge → deploy)

### Quality
- [ ] Accessibility tests passing (0 violations)
- [ ] Lighthouse scores meeting budgets (90/100/95/90)
- [ ] Load tests passing (targets met)
- [ ] Code quality enforced (Prettier, ESLint)

---

## RISK MANAGEMENT

### High Risk Items
1. **Legal Pages Not Published** → GDPR violation
   - Mitigation: Phase 1 is highest priority

2. **No Error Monitoring** → Production issues invisible
   - Mitigation: Sentry setup in Phase 3

3. **No Uptime Monitoring** → Downtime undetected
   - Mitigation: Uptime monitoring in Phase 3

### Medium Risk Items
1. **Infrastructure Not Deployed** → Can't scale
   - Mitigation: Vercel works for now, K8s when needed

2. **Accessibility Violations** → Lawsuit risk
   - Mitigation: Fix violations in Phase 6

### Low Risk Items
1. **Load Testing Not Done** → May not scale
   - Mitigation: Can do after launch, monitor production

---

## RESOURCE REQUIREMENTS

### Team
- **Frontend Developer:** Phases 1, 2, 6 (3-4 weeks)
- **Backend Developer:** Phases 3, 4, 5 (2-3 weeks)
- **DevOps Engineer:** Phase 4, 5 (2-3 weeks)

**Can be done with 1-2 full-stack developers if needed**

### Budget
- **Cloud Costs:** $100-500/month (depends on scale)
- **Monitoring Services:** $50-200/month (Sentry, uptime, logs)
- **Total:** $150-700/month recurring

### Timeline
- **Minimum (Legal only):** 1 week
- **Recommended (Phases 1-3):** 3 weeks
- **Complete (All phases):** 5-6 weeks

---

## PHASED LAUNCH STRATEGY

### Soft Launch (Week 1-2)
- ✅ Phase 1 complete (legal compliance)
- ✅ Phase 3 partial (Sentry only)
- ✅ Launch to small user group
- ✅ Monitor closely

### Public Beta (Week 3-4)
- ✅ Phase 2 complete (privacy features)
- ✅ Phase 3 complete (full monitoring)
- ✅ Expand to wider audience
- ✅ Collect feedback

### General Availability (Week 5-6)
- ✅ Phase 4 complete (infrastructure)
- ✅ Phase 5 complete (CI/CD)
- ✅ Phase 6 complete (quality)
- ✅ Full public launch
- ✅ Marketing campaigns

---

## NEXT STEPS

### This Week
1. Review this roadmap with team
2. Prioritize phases based on business needs
3. Assign team members to phases
4. Start Phase 1 (legal compliance)

### Need Help?
- Legal pages: Hire frontend developer
- Infrastructure: Hire DevOps contractor
- Testing: Can use AI agent for test fixes

**Estimated Total Cost:**
- **Team Time:** 80-100 hours
- **Cloud Services:** $500-1500 (first month)
- **Monitoring Tools:** $100-300/month
- **Total:** ~$10K-15K for complete implementation

---

**Status:** Ready to begin
**Owner:** To be assigned
**Review Date:** Weekly standup
