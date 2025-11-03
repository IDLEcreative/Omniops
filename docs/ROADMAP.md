# OmniOps Platform Roadmap

**Last Updated:** 2025-11-03
**Status:** Active
**Owner:** Platform Owner

## Purpose
This roadmap outlines planned features, improvements, and technical debt items for the OmniOps platform, organized by priority and timeline.

---

## 🎯 Current Focus (November 2025)

### Active Development
- ✅ **Platform Owner Dashboard** - Separate /owner section with telemetry (COMPLETED)
- 🔄 **Multi-Tenant Shop Architecture** - Organization-based WooCommerce integration (IN PROGRESS)
- 🔄 **Authentication & Security** - Role-based access foundation (IN PROGRESS)

---

## 📋 Upcoming (Next 1-2 Months)

### Authentication & Authorization (HIGH PRIORITY)

#### Phase 1: Database-Based Admin Flag
**Timeline:** 1-2 weeks
**Priority:** HIGH

**Objectives:**
- Replace environment variable admin check with database flag
- Enable admin management via dashboard
- No redeployment needed to add/remove admins

**Tasks:**
- [ ] Add `is_platform_admin` boolean column to `profiles` table
- [ ] Create migration script
- [ ] Update middleware to check database instead of env var
- [ ] Build admin management UI in `/owner/settings`
- [ ] Add API endpoint to grant/revoke admin access
- [ ] Update documentation

**Migration Path:**
```sql
-- Add column
ALTER TABLE profiles ADD COLUMN is_platform_admin BOOLEAN DEFAULT false;

-- Set initial admin
UPDATE profiles
SET is_platform_admin = true
WHERE email = 'your-email@example.com';
```

**Benefits:**
- ✅ Can manage admins without redeployment
- ✅ Support multiple platform admins
- ✅ Foundation for full RBAC later
- ✅ Minimal code changes

---

#### Phase 2: Audit Logging
**Timeline:** 1 week (can run parallel with Phase 1)
**Priority:** HIGH

**Objectives:**
- Track all platform owner actions
- Security compliance
- Debug and accountability

**Tasks:**
- [ ] Create `admin_audit_log` table
- [ ] Build audit logging service
- [ ] Instrument all owner routes
- [ ] Create audit log viewer in `/owner/system`
- [ ] Add filters and search
- [ ] Export functionality

**Schema:**
```sql
CREATE TABLE admin_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Logged Actions:**
- View telemetry/costs
- View organization details
- Modify platform settings
- Grant/revoke admin access
- Database operations
- System health checks

---

### Platform Owner Features

#### Organizations Management Page
**Timeline:** 2-3 weeks
**Priority:** MEDIUM

**Objectives:**
- View all organizations using the platform
- Monitor usage and activity per organization
- Manage organization settings

**Features:**
- [ ] List all organizations with stats
- [ ] Search and filter organizations
- [ ] View organization details page
- [ ] Organization usage metrics
- [ ] Direct access to organization dashboard (as admin)
- [ ] Suspend/activate organizations
- [ ] Organization-level settings override

---

#### System Health Monitoring
**Timeline:** 2 weeks
**Priority:** MEDIUM

**Objectives:**
- Monitor platform infrastructure health
- Proactive issue detection
- Performance tracking

**Features:**
- [ ] Redis connection status and stats
- [ ] Database connection pool metrics
- [ ] Queue health (BullMQ jobs)
- [ ] API response time trends
- [ ] Error rate monitoring
- [ ] Service uptime tracking
- [ ] Alert configuration

---

#### Revenue Dashboard
**Timeline:** 3 weeks
**Priority:** MEDIUM (depends on billing implementation)

**Objectives:**
- Track platform revenue
- Subscription analytics
- Financial reporting

**Features:**
- [ ] MRR (Monthly Recurring Revenue)
- [ ] Churn rate
- [ ] LTV (Lifetime Value)
- [ ] Revenue by organization
- [ ] Subscription status overview
- [ ] Payment failures tracking
- [ ] Financial export (CSV/PDF)

---

## 🔮 Future (3-6 Months)

### Phase 3: Full Role-Based Access Control (RBAC)
**Timeline:** 3-4 weeks
**Priority:** MEDIUM

**Objectives:**
- Granular permission system
- Multiple admin roles
- Team member access control

**Roles:**
```
Platform Owner
  └─ Full access to everything

Platform Admin
  ├─ View telemetry
  ├─ View organizations
  ├─ View system health
  └─ No billing/settings changes

Support Admin
  ├─ View organizations
  ├─ Access organization dashboards
  └─ Read-only telemetry

Billing Admin
  ├─ View revenue
  ├─ Manage subscriptions
  └─ No technical access
```

**Tasks:**
- [ ] Design permission matrix
- [ ] Create `roles` and `permissions` tables
- [ ] Implement role checking middleware
- [ ] Build role management UI
- [ ] Permission-based UI component rendering
- [ ] Migrate from boolean flag to role system
- [ ] Documentation and training

---

### Multi-Factor Authentication (MFA)
**Timeline:** 2 weeks
**Priority:** HIGH (security)

**Objectives:**
- Require MFA for platform admins
- Optional MFA for organization users
- TOTP and SMS support

**Tasks:**
- [ ] Implement TOTP (Google Authenticator, Authy)
- [ ] SMS verification option
- [ ] Backup codes generation
- [ ] Enforce MFA for `/owner` routes
- [ ] MFA recovery flow
- [ ] User settings UI

---

### Advanced Analytics
**Timeline:** 4-6 weeks
**Priority:** LOW

**Objectives:**
- Predictive cost analysis
- Anomaly detection
- Automated recommendations

**Features:**
- [ ] AI cost prediction (ML model)
- [ ] Usage pattern analysis
- [ ] Anomaly detection alerts
- [ ] Optimization recommendations
- [ ] Comparative benchmarking
- [ ] Custom report builder

---

## 🔧 Technical Debt & Infrastructure

### Performance Optimization
**Timeline:** Ongoing
**Priority:** MEDIUM

**Tasks:**
- [ ] Database query optimization
- [ ] Redis caching strategy improvements
- [ ] CDN implementation for static assets
- [ ] Image optimization
- [ ] Code splitting improvements
- [ ] API response compression

---

### Testing & Quality
**Timeline:** Ongoing
**Priority:** HIGH

**Tasks:**
- [ ] Increase test coverage to 80%+
- [ ] E2E tests for critical flows
- [ ] Performance benchmarking suite
- [ ] Load testing infrastructure
- [ ] Security penetration testing
- [ ] Accessibility (A11y) compliance

---

### Documentation
**Timeline:** Ongoing
**Priority:** MEDIUM

**Tasks:**
- [ ] Complete API documentation
- [ ] Platform owner handbook
- [ ] Organization admin guide
- [ ] Integration guides (WooCommerce, Shopify)
- [ ] Architecture decision records (ADRs)
- [ ] Video tutorials

---

## 📊 Success Metrics

### Platform Health
- System uptime: 99.9%+
- API response time: <200ms p95
- Error rate: <0.1%

### Business Metrics
- Monthly Active Organizations
- MRR Growth
- Churn Rate
- Customer Satisfaction (NPS)

### Technical Metrics
- Test coverage: 80%+
- Build time: <5 minutes
- Deployment frequency: Daily
- Mean Time to Recovery (MTTR): <1 hour

---

## 🚫 Not Planned (Explicit Decisions)

These items have been considered and explicitly decided against:

- **Self-hosted option** - Cloud-only for now
- **White-label reselling** - Direct sales only
- **Custom code execution** - Security risk
- **Blockchain integration** - No clear use case
- **Mobile native apps** - PWA sufficient

---

## 📝 Change Log

### 2025-11-03
- Created initial roadmap
- Added RBAC migration plan (Phase 1-3)
- Added audit logging initiative
- Added platform owner features roadmap

---

## 📞 Feedback

Have suggestions for the roadmap? Contact the platform owner or create an issue.

**Last Review Date:** 2025-11-03
**Next Review Date:** 2025-12-01
