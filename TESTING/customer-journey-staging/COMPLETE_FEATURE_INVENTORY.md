# 🗺️ Complete Feature Inventory & Testing Guide

**Type:** Feature Documentation
**Status:** Active
**Last Updated:** 2025-10-30
**Purpose:** Comprehensive catalog of all application pages, features, and functionality for thorough testing

---

## 📊 Application Overview

| Metric | Count |
|--------|-------|
| **Total Pages** | 36 routes |
| **API Endpoints** | 121 endpoints |
| **Dashboard Sections** | 13 major sections |
| **UI Components** | 91+ dashboard components |
| **Integrations** | WooCommerce, Shopify, Stripe |

---

## 🏠 Public Pages (Non-Authenticated)

### Homepage & Marketing
- **[/](/)** - Landing page with product info and CTA
- **[/signup](/signup)** - User registration page
- **[/login](/login)** - User authentication
- **[/reset-password](/reset-password)** - Password reset flow
- **[/update-password](/update-password)** - Update password after reset
- **[/terms](/terms)** - Terms of Service
- **[/privacy](/privacy)** - Privacy Policy
- **[/accessibility](/accessibility)** - Accessibility statement

**Test Checklist:**
- [ ] Homepage loads and CTA buttons work
- [ ] Sign up flow completes successfully
- [ ] Login with valid credentials works
- [ ] Password reset email sends and link works
- [ ] Legal pages load and are readable

---

### Widget & Embed Pages
- **[/embed](/embed)** - Embeddable chat widget page
  - Query param: `?domain=example.com`
  - **Purpose:** Displays chat widget that can be embedded via iframe
  - **Testing:** Test with different domain params, verify branding loads

- **[/preview](/preview)** - Widget preview page
  - **Purpose:** Preview widget without installing
  - **Testing:** Test all customization options reflect

- **[/test-widget](/test-widget)** - Widget testing page
- **[/widget-test](/widget-test)** - Alternative widget test page
- **[/simple-test](/simple-test)** - Simple chat test page
- **[/chat](/chat)** - Standalone chat interface

**Test Checklist:**
- [ ] Embed page loads with correct domain
- [ ] Widget displays branding correctly
- [ ] Chat functionality works end-to-end
- [ ] Preview shows real-time customization changes
- [ ] Can test without installing on real site

---

### Setup & Configuration
- **[/onboarding](/onboarding)** - First-time user onboarding wizard
- **[/setup](/setup)** - Initial setup flow
- **[/configure](/configure)** - Configuration page
- **[/install](/install)** - Installation instructions

**Test Checklist:**
- [ ] Onboarding wizard guides new users
- [ ] Setup flow is clear and logical
- [ ] All required fields have validation
- [ ] Can complete setup end-to-end

---

## 🎯 Dashboard Pages (Authenticated)

### Main Section

#### 1. **[/dashboard](/dashboard)** - Overview Dashboard
**Components:**
- `StatsCards` - Key metrics (conversations, messages, users)
- `ChartSection` - Trend graphs
- `ActivityFeed` - Recent activity log
- `QuickActions` - Common action shortcuts

**Features:**
- Real-time conversation count
- Message volume trends
- User activity summary
- Quick access to common tasks
- Performance metrics at a glance

**Test Checklist:**
- [ ] All stats load correctly
- [ ] Charts render with data
- [ ] Activity feed shows recent conversations
- [ ] Quick actions navigate to correct pages
- [ ] Real-time updates work (if implemented)
- [ ] Handles zero-data state gracefully

---

#### 2. **[/dashboard/conversations](/dashboard/conversations)** - Conversations Manager
**Components:**
- `ConversationMainContainer` - Main layout
- `ConversationsPageHeader` - Title and filters
- `SearchAndFiltersBar` - Search and filter controls
- `ConversationTabbedList` - Tabbed list view (All, Active, Resolved)
- `ConversationListWithPagination` - Paginated conversation list
- `ConversationListItem` - Individual conversation preview
- `ConversationHeader` - Conversation detail header
- `ConversationTranscript` - Full conversation view
- `ConversationMetricsCards` - Conversation analytics
- `AdvancedFilters` - Advanced filtering options
- `BulkActionBar` - Bulk operations toolbar
- `LiveStatusIndicator` - Real-time status
- `ExportDialog` - Export conversations
- `KeyboardShortcutsModal` - Keyboard shortcuts help
- `LanguageDistributionCard` - Language analytics
- `SkeletonList` - Loading skeleton

**Features:**
- **Search:** Full-text search across all conversations
- **Filters:**
  - By status (Active, Resolved, Abandoned)
  - By domain
  - By date range
  - By user/visitor
  - By language
- **Tabs:** All, Active, Resolved (with counts)
- **Pagination:** Efficient loading of large conversation lists
- **Details View:** Click to see full transcript
- **Actions:**
  - Export individual conversation
  - Bulk export multiple conversations
  - Mark as resolved
  - Delete conversation (GDPR)
  - Tag conversations
- **Analytics:** Conversation-level metrics
- **Keyboard Shortcuts:** Quick navigation (? for help)
- **Live Updates:** Real-time conversation status

**Test Checklist:**
- [ ] Search finds conversations by content
- [ ] Filters work correctly (status, domain, date)
- [ ] Tabs show correct counts
- [ ] Pagination loads next/previous pages
- [ ] Can click conversation to view full transcript
- [ ] Export single conversation works
- [ ] Bulk export multiple works (select → export)
- [ ] Mark as resolved updates status
- [ ] Delete removes conversation
- [ ] Analytics show accurate metrics
- [ ] Keyboard shortcuts work (test ?)
- [ ] Live status updates in real-time
- [ ] Language distribution is accurate
- [ ] Loading states show while fetching
- [ ] Empty state shows when no conversations

---

#### 3. **[/dashboard/shop](/dashboard/shop)** - Shop Management
**Purpose:** E-commerce product management and insights

**Features:**
- Product catalog management
- Inventory overview
- Sales analytics
- Quick product actions

**Test Checklist:**
- [ ] Product list loads
- [ ] Can view product details
- [ ] Inventory levels are accurate
- [ ] Sales data is correct
- [ ] Actions work (edit, view, etc.)

---

#### 4. **[/dashboard/analytics](/dashboard/analytics)** - Analytics Dashboard
**Components:**
- `MetricsOverview` - High-level KPIs
- `DateRangePicker` - Custom date selection
- `ExportButton` - Export analytics data
- `OverviewTab` - General overview
- `ConversationsTab` - Conversation-specific analytics
- `PerformanceTab` - Performance metrics
- `InsightsTab` - AI-generated insights
- `ChartGrid` - Grid of charts

**Features:**
- **Tabs:**
  - Overview - High-level summary
  - Conversations - Conversation analytics
  - Performance - Response times, success rates
  - Insights - AI-generated business insights
- **Metrics:**
  - Total conversations
  - Message volume
  - Average response time
  - Customer satisfaction (if tracked)
  - Popular queries
  - Conversion rates (if integrated with commerce)
- **Charts:**
  - Time-series graphs
  - Heatmaps
  - Distribution charts
  - Funnel visualizations
- **Date Ranges:** Today, Week, Month, Quarter, Year, Custom
- **Export:** CSV/PDF export of analytics data

**Test Checklist:**
- [ ] All tabs load without errors
- [ ] Metrics show accurate data
- [ ] Date range picker changes data correctly
- [ ] Charts render properly (no blank charts)
- [ ] Export generates file successfully
- [ ] Insights are relevant and actionable
- [ ] Performance tab shows response times
- [ ] Conversation tab shows message trends
- [ ] Can drill down into specific metrics
- [ ] Handles date ranges with no data

---

#### 5. **[/dashboard/telemetry](/dashboard/telemetry)** - System Telemetry
**Components:**
- `LiveMetrics` - Real-time system metrics
- `PerformanceCharts` - Performance over time
- `ModelUsagePanel` - AI model usage stats
- `TenantStats` - Multi-tenant statistics

**Features:**
- **Live Metrics:**
  - Current requests per second
  - Active conversations
  - API response times
  - Error rates
- **Performance Monitoring:**
  - Response time trends
  - Error rate trends
  - Uptime metrics
  - Resource usage
- **AI Model Stats:**
  - Tokens consumed
  - Model calls
  - Cost tracking
  - Model performance
- **System Health:**
  - Database status
  - API status
  - Queue status
  - Cache status

**Test Checklist:**
- [ ] Live metrics update in real-time
- [ ] Performance charts show historical data
- [ ] Model usage shows token consumption
- [ ] Cost tracking is accurate
- [ ] System health indicators are correct
- [ ] Can identify performance bottlenecks
- [ ] Alerts work (if configured)
- [ ] Can drill down into specific metrics

---

### Management Section

#### 6. **[/dashboard/customers](/dashboard/customers)** - Customer Management
**Purpose:** Manage customer/domain configurations

**Features:**
- List all customer domains
- Add new customer domain
- Edit domain configuration
- View customer analytics
- Manage customer status (active/inactive)
- Domain-specific settings

**Test Checklist:**
- [ ] Customer list loads with all domains
- [ ] Can add new customer domain
- [ ] Can edit existing customer
- [ ] Can deactivate/activate customer
- [ ] Search/filter customers works
- [ ] Domain-specific stats show correctly
- [ ] Can navigate to domain dashboard

---

#### 7. **[/dashboard/training](/dashboard/training)** - Bot Training
**Components:**
- `TrainingHeader` - Page header and actions
- `TrainingDataUpload` - Upload training data
- `TrainingDataList` - List of training data
- `TrainingProgressBar` - Training job progress
- `TrainingTips` - Help and tips

**Features:**
- **Upload Training Data:**
  - Q&A pairs (JSON, CSV)
  - Text documents (PDF, TXT, MD)
  - URLs to scrape
- **Manage Training Data:**
  - View all training data
  - Edit Q&A pairs
  - Delete obsolete data
  - Tag and categorize
- **Training Jobs:**
  - Start new training job
  - Monitor progress
  - View job history
  - Cancel running jobs
- **Model Fine-tuning:**
  - Custom training on your data
  - Improve response accuracy
  - Domain-specific knowledge

**Test Checklist:**
- [ ] Can upload Q&A JSON file
- [ ] Can upload text documents
- [ ] Can add URLs to scrape for training
- [ ] Training data appears in list
- [ ] Can edit existing Q&A pairs
- [ ] Can delete training data
- [ ] Can start training job
- [ ] Progress bar shows job status
- [ ] Can view completed jobs
- [ ] Trained model improves responses
- [ ] Tips are helpful and accurate

---

#### 8. **[/dashboard/team](/dashboard/team)** - Team Management
**Components:**
- `TeamMemberList` - List of team members
- `InviteModal` - Invite new members
- `RoleManager` - Manage permissions

**Features:**
- **Team Members:**
  - View all organization members
  - See member roles (Admin, Editor, Viewer)
  - See member status (Active, Invited, Inactive)
- **Invitations:**
  - Invite new team members by email
  - Set initial role on invite
  - Resend invitation
  - Cancel pending invitations
- **Role Management:**
  - Change member roles
  - Define custom permissions
  - Role-based access control
- **Member Actions:**
  - Remove team members
  - Transfer ownership
  - Deactivate accounts

**Test Checklist:**
- [ ] Team member list shows all members
- [ ] Can invite new member by email
- [ ] Invitation email sends successfully
- [ ] Can set role on invite (Admin/Editor/Viewer)
- [ ] Can resend invitation
- [ ] Can cancel pending invitation
- [ ] Can change existing member's role
- [ ] Can remove team member
- [ ] Permissions enforce correctly (test with different roles)
- [ ] Owner can transfer ownership
- [ ] Activity log shows who did what

---

### Configuration Section

#### 9. **[/dashboard/installation](/dashboard/installation)** - Widget Installation
**Purpose:** Get embed code and installation instructions

**Features:**
- **Embed Code Generation:**
  - Auto-generated embed snippet
  - Copy to clipboard
  - Domain-specific code
- **Installation Instructions:**
  - WordPress instructions
  - Shopify instructions
  - HTML/static site instructions
  - Custom platform guides
- **Customization Options:**
  - Widget position selector
  - Theme selection (auto/light/dark)
  - Preview customizations
- **Testing Tools:**
  - Test widget on preview page
  - Verify installation
  - Debug connection issues

**Test Checklist:**
- [ ] Embed code generates correctly
- [ ] Copy button works
- [ ] Code includes correct domain parameter
- [ ] Instructions are clear and complete
- [ ] Platform-specific guides work
- [ ] Preview shows live widget
- [ ] Customization options update preview
- [ ] Position selector works
- [ ] Theme switcher works
- [ ] Verification tool confirms installation

---

#### 10. **[/dashboard/integrations](/dashboard/integrations)** - Integrations Hub
**Components:**
- `IntegrationsList` - Available integrations
- `IntegrationCard` - Individual integration card
- `IntegrationsStatsOverview` - Integration metrics
- `IntegrationsCategorySidebar` - Category filters
- `IntegrationsSearchBar` - Search integrations
- `IntegrationsBottomCTA` - Request integration CTA

**Features:**
- **Available Integrations:**
  - WooCommerce (E-commerce)
  - Shopify (E-commerce)
  - Stripe (Payments) - coming soon
  - Zapier (Automation) - coming soon
- **Integration Categories:**
  - E-commerce
  - Payments
  - CRM
  - Analytics
  - Automation
- **Per-Integration:**
  - Setup instructions
  - Configuration form
  - Test connection
  - View integration status
  - Disconnect
- **Stats:**
  - Active integrations count
  - API calls made
  - Data synced
  - Last sync time

**Test Checklist:**
- [ ] Integration list loads
- [ ] Can filter by category
- [ ] Search finds integrations
- [ ] Integration cards show correct status
- [ ] Can navigate to integration setup
- [ ] Stats show accurate data
- [ ] Request integration CTA works

---

##### 10a. **[/dashboard/integrations/woocommerce](/dashboard/integrations/woocommerce)** - WooCommerce Dashboard
**Components:**
- `DashboardHeader` - Stats overview
- `KPICards` - Key metrics (revenue, orders, products)
- `RevenueChart` - Revenue over time
- `AbandonedCartsCard` - Abandoned cart tracking
- `LowStockCard` - Low stock alerts
- `OperationAnalyticsCard` - AI operation stats
- `ErrorState` - Error handling UI

**Features:**
- **Overview Stats:**
  - Total revenue
  - Orders count
  - Products count
  - Customers count
- **Revenue Analytics:**
  - Revenue trends over time
  - Average order value
  - Top products
  - Customer lifetime value
- **Abandoned Carts:**
  - List of abandoned carts
  - Cart value
  - Time since abandonment
  - Recovery actions
- **Inventory Alerts:**
  - Low stock products
  - Out of stock products
  - Stock level trends
- **AI Operations:**
  - Product searches performed
  - Cart operations
  - Order lookups
  - Customer queries

**Test Checklist:**
- [ ] Dashboard loads with WooCommerce data
- [ ] KPI cards show correct numbers
- [ ] Revenue chart displays trends
- [ ] Abandoned carts list populated
- [ ] Low stock alerts appear
- [ ] AI operations tracked
- [ ] All links work (to WooCommerce admin)
- [ ] Error state shows if connection fails
- [ ] Data refreshes on reload

---

##### 10b. **[/dashboard/integrations/woocommerce/configure](/dashboard/integrations/woocommerce/configure)** - WooCommerce Setup
**Components:**
- `ConfigureHeader` - Setup header
- `CredentialsForm` - API credentials form
- `TestConnection` - Connection testing tool

**Features:**
- **Credential Configuration:**
  - WooCommerce Store URL
  - Consumer Key
  - Consumer Secret
  - Auto-detect WooCommerce version
- **Connection Testing:**
  - Test API connection
  - Verify permissions
  - Check product count
  - Validate configuration
- **Setup Wizard:**
  - Step-by-step guide
  - Help tooltips
  - Common issues troubleshooting
- **Security:**
  - Credentials encrypted at rest
  - Secure API communication
  - Permission validation

**Test Checklist:**
- [ ] Form validates input (URL format, required fields)
- [ ] Can save credentials
- [ ] Test connection works
- [ ] Shows success message with product count
- [ ] Shows clear error if connection fails
- [ ] Credentials are saved encrypted
- [ ] Can edit existing credentials
- [ ] Can delete/disconnect integration
- [ ] Help tooltips are useful
- [ ] Handles WooCommerce version differences

---

##### 10c. **[/dashboard/integrations/shopify](/dashboard/integrations/shopify)** - Shopify Integration
**Components:**
- `PageHeader` - Integration header
- `SetupInstructions` - Setup guide
- `ConnectionForm` - Shopify credentials
- `FeaturesCard` - Feature list

**Features:**
- **Shopify Setup:**
  - Store URL (mystore.myshopify.com)
  - Admin API Access Token
  - API version selection
- **Features:**
  - Product search
  - Inventory checks
  - Order lookups
  - Customer data access
- **Configuration:**
  - Permissions setup
  - Webhook configuration
  - Sync settings

**Test Checklist:**
- [ ] Setup instructions are clear
- [ ] Connection form validates input
- [ ] Can save Shopify credentials
- [ ] Test connection works
- [ ] Features list is accurate
- [ ] Permissions are correctly set
- [ ] Can sync products
- [ ] Order lookups work
- [ ] Inventory checks work

---

#### 11. **[/dashboard/customize](/dashboard/customize)** - Widget Customization
**Purpose:** Customize widget appearance and behavior

**Features:**
- **Appearance:**
  - Primary color picker
  - Theme (auto/light/dark)
  - Widget position
  - Widget size
  - Border radius
  - Font family
- **Branding:**
  - Business name
  - Logo upload
  - Welcome message
  - Avatar/icon
- **Behavior:**
  - Suggested questions
  - Auto-open settings
  - Sound notifications
  - Typing indicators
  - Read receipts
- **Preview:**
  - Live preview of changes
  - Test on different backgrounds
  - Mobile preview

**Test Checklist:**
- [ ] Color picker changes widget color
- [ ] Theme switcher works
- [ ] Position selector changes location
- [ ] Size adjustments work
- [ ] Logo upload works and displays
- [ ] Welcome message updates
- [ ] Suggested questions save and show
- [ ] Preview updates in real-time
- [ ] Changes persist after save
- [ ] Mobile preview is accurate

---

#### 12. **[/dashboard/privacy](/dashboard/privacy)** - Privacy & Security
**Components:**
- `DataRetentionSettings` - Data retention policies
- `ConsentManagement` - User consent tracking
- `DataExportSection` - GDPR data export
- `GDPRComplianceSection` - Compliance tools
- `SecuritySettings` - Security configuration
- `PrivacyAuditLog` - Privacy audit trail
- `AuditLogTable` - Audit log display
- `AuditLogRow` - Individual audit entry
- `AuditLogFilters` - Filter audit logs

**Features:**
- **Data Retention:**
  - Set retention period (days)
  - Auto-delete old conversations
  - Archive vs. delete options
  - Compliance with GDPR/CCPA
- **User Rights:**
  - Data export (GDPR Article 15)
  - Data deletion (GDPR Article 17)
  - Consent management
  - Access logs
- **Security:**
  - Two-factor authentication
  - API key rotation
  - Session management
  - IP allowlisting
- **Audit Log:**
  - All privacy-related actions
  - Data access logs
  - Deletion logs
  - Export logs
  - Filter by date, action, user

**Test Checklist:**
- [ ] Can set data retention period
- [ ] Auto-delete works after retention expires
- [ ] User data export generates file
- [ ] Data deletion removes all user data
- [ ] Consent tracking works
- [ ] Audit log shows all actions
- [ ] Can filter audit log
- [ ] Security settings save correctly
- [ ] 2FA setup works (if implemented)
- [ ] Compliance reports generate

---

#### 13. **[/dashboard/settings](/dashboard/settings)** - General Settings
**Components:**
- `GeneralSettings` - Basic settings
- `NotificationSettings` - Notification preferences
- `BotSettings` - AI behavior configuration
- `SecuritySettings` - Security options
- `APIKeysSection` - API key management
- `AdvancedSettings` - Advanced options

**Features:**
- **General:**
  - Organization name
  - Time zone
  - Language
  - Date format
- **Notifications:**
  - Email notifications on/off
  - New conversation alerts
  - Daily summary emails
  - System alerts
- **Bot Configuration:**
  - AI model selection
  - Response style (professional/casual/friendly)
  - Max response length
  - Confidence threshold
  - Fallback messages
- **API Keys:**
  - Generate API keys
  - Revoke keys
  - Set key permissions
  - View usage
- **Advanced:**
  - Debug mode
  - Webhook URLs
  - Custom CSS
  - Developer options

**Test Checklist:**
- [ ] General settings save correctly
- [ ] Timezone changes affect timestamps
- [ ] Language selection works
- [ ] Notification toggles work
- [ ] Email notifications send
- [ ] Bot response style changes behavior
- [ ] Can generate new API key
- [ ] Can revoke API key
- [ ] API key permissions enforce
- [ ] Advanced settings require confirmation
- [ ] Webhook URL validates format
- [ ] Custom CSS applies to widget

---

### Additional Dashboard Pages

#### **[/dashboard/help](/dashboard/help)** - Help Center
**Components:**
- `SearchBar` - Search help articles
- `CategoryList` - Browse by category
- `ArticleView` - View help article
- `FAQSection` - Frequently asked questions
- `QuickLinks` - Common tasks
- `APIDocumentation` - API docs
- `ContactSupport` - Contact form

**Features:**
- Search help articles
- Browse categories
- FAQ section
- Video tutorials (if available)
- API documentation
- Contact support

**Test Checklist:**
- [ ] Search finds relevant articles
- [ ] Can browse by category
- [ ] Articles load and display correctly
- [ ] FAQ section is helpful
- [ ] Quick links navigate correctly
- [ ] API docs are accurate
- [ ] Contact form submits successfully

---

## 🔌 API Endpoints (121 Total)

### Chat & Messaging
- `POST /api/chat` - Main chat endpoint (AI responses)
- `POST /api/demo/chat` - Demo chat (no auth required)
- `GET /api/customer/config` - Get customer configuration
- `GET /api/customer/config/current` - Get current customer config
- `POST /api/customer/config/validate` - Validate customer config
- `GET /api/customer/quick-verify` - Quick customer verification
- `POST /api/customer/verify` - Full customer verification
- `POST /api/verify-customer` - Verify customer domain
- `GET /api/widget-config` - Widget configuration (public)
- `GET /api/check-domain-content` - Check if domain has content

### Conversations Management
- `GET /api/dashboard/conversations` - List conversations
- `GET /api/dashboard/conversations/[id]` - Get conversation details
- `POST /api/dashboard/conversations/[id]/actions` - Conversation actions
- `GET /api/dashboard/conversations/analytics` - Conversation analytics
- `POST /api/dashboard/conversations/export` - Export conversations
- `POST /api/dashboard/conversations/bulk-actions` - Bulk operations

### WooCommerce Integration
- `GET /api/woocommerce/products` - Get WooCommerce products
- `POST /api/woocommerce/configure` - Configure WooCommerce
- `POST /api/woocommerce/test` - Test WooCommerce connection
- `GET /api/woocommerce/dashboard` - WooCommerce dashboard data
- `GET /api/woocommerce/stock` - Stock levels
- `GET /api/woocommerce/abandoned-carts` - Abandoned carts
- `POST /api/woocommerce/customer-action` - Customer actions (view cart, etc.)
- `GET /api/woocommerce/customer-test` - Test customer operations
- `POST /api/woocommerce/cart/test` - Test cart operations
- `GET /api/woocommerce/customers/test` - Test customer API
- `GET /api/dashboard/woocommerce` - WooCommerce dashboard
- `GET /api/dashboard/woocommerce/[...path]` - WooCommerce proxy
- `GET /api/dashboard/missing-products` - Missing product detection

### Shopify Integration
- `GET /api/shopify/products` - Get Shopify products
- `POST /api/shopify/configure` - Configure Shopify
- `POST /api/shopify/test` - Test Shopify connection

### Scraping & Content
- `POST /api/scrape` - Initiate website scrape
- `POST /api/demo/scrape` - Demo scrape (no auth)
- `GET /api/scrape-jobs` - List scrape jobs
- `GET /api/scrape-jobs/[id]` - Get job details
- `POST /api/scrape-jobs/[id]/retry` - Retry failed job
- `GET /api/scrape-jobs/next` - Get next job in queue
- `GET /api/scrape-jobs/stats` - Scraping statistics
- `GET /api/dashboard/scraped` - Scraped pages list
- `GET /api/check-rag` - Check RAG system health
- `POST /api/check-rag-data` - Check RAG data availability
- `GET /api/debug-rag` - Debug RAG system
- `POST /api/test-rag` - Test RAG search
- `GET /api/rag-health` - RAG health check
- `POST /api/test-embeddings` - Test embeddings generation
- `GET /api/check-embedding-urls` - Check embedded URLs
- `POST /api/test-search-lib` - Test search library

### Training & Bot Management
- `GET /api/training` - List training data
- `POST /api/training` - Upload training data
- `GET /api/training/[id]` - Get training item
- `PUT /api/training/[id]` - Update training item
- `DELETE /api/training/[id]` - Delete training item
- `POST /api/training/qa` - Upload Q&A training
- `POST /api/training/text` - Upload text training

### Analytics & Telemetry
- `GET /api/dashboard/analytics` - Dashboard analytics
- `GET /api/analytics/intelligence` - Business intelligence
- `GET /api/dashboard/telemetry` - System telemetry
- `GET /api/monitoring/metrics` - System metrics
- `GET /api/monitoring/chat` - Chat monitoring
- `GET /api/monitoring/scraping` - Scraping monitoring
- `GET /api/metadata-quality` - Metadata quality metrics
- `POST /api/order-modifications` - Track order modifications

### Organizations & Teams
- `GET /api/organizations` - List user's organizations
- `POST /api/organizations/create` - Create organization
- `GET /api/organizations/[id]` - Get organization details
- `PUT /api/organizations/[id]` - Update organization
- `GET /api/organizations/[id]/members` - List members
- `POST /api/organizations/[id]/members` - Add member
- `DELETE /api/organizations/[id]/members/[userId]` - Remove member
- `GET /api/organizations/[id]/invitations` - List invitations
- `POST /api/organizations/[id]/invitations` - Send invitation
- `DELETE /api/organizations/[id]/invitations/[invitationId]` - Cancel invitation
- `POST /api/invitations/accept` - Accept invitation

### Authentication & User
- `GET /api/auth/me` - Get current user

### Privacy & GDPR
- `POST /api/gdpr/export` - Export user data (GDPR Article 15)
- `POST /api/gdpr/delete` - Delete user data (GDPR Article 17)
- `GET /api/gdpr/audit` - Privacy audit log
- `GET /api/gdpr/audit/options` - Audit filter options

### Payments (Stripe)
- `POST /api/stripe/checkout` - Create Stripe checkout session
- `POST /api/billing` - Billing operations (page endpoint)

### Product Search
- `POST /api/search/products` - Search products across sources
- `GET /api/synonyms` - Get search synonyms
- `POST /api/synonyms/expand` - Expand query with synonyms

### Cron Jobs & Automation
- `POST /api/cron/refresh` - Refresh cached data (scheduled)
- `POST /api/cron/enrich-leads` - Lead enrichment (scheduled)

### Cache Management
- `POST /api/cache/clear` - Clear cache
- `POST /api/cache/warm` - Warm cache

### Job Queue
- `GET /api/queue` - Queue status
- `GET /api/jobs` - List background jobs
- `GET /api/jobs/[jobId]` - Get job status

### System Health & Monitoring
- `GET /api/health` - Basic health check
- `GET /api/health/comprehensive` - Detailed health check
- `GET /api/version` - API version info
- `POST /api/refresh` - Refresh system data

### Testing & Debug
- `POST /api/test-woo` - Test WooCommerce
- `GET /api/test-db` - Test database connection
- `GET /api/test-multi-tenant` - Test multi-tenancy
- `GET /api/debug/[domain]` - Debug specific domain
- `GET /api/check-tables` - Check database tables
- `POST /api/check-table-data` - Check table data

### Support & Webhooks
- `POST /api/support` - Contact support
- `POST /api/webhooks/customer` - Customer webhooks
- `POST /api/log-error` - Client error logging

### Configuration
- `GET /api/dashboard/config` - Dashboard configuration
- `GET /api/dashboard/overview` - Dashboard overview data
- `POST /api/dashboard/test-connection` - Test connections

### Admin Operations
- `POST /api/admin/cleanup` - Admin cleanup operations

---

## 🎨 Key UI Components

### Layout Components
- `Sidebar` - Main navigation sidebar
- `Header` - Dashboard header with user menu
- `MobileNav` - Mobile navigation

### Dashboard Components (91 total)
See sections above for component details per page.

### Chat Widget Components
- `ChatWidget` - Main widget component
- `MessageList` - Display messages
- `MessageInput` - User input field
- `TypingIndicator` - "Agent is typing..." indicator
- `SuggestedQuestions` - Quick reply buttons
- `SourceCitations` - Show information sources

---

## 🧪 Integration Testing Scenarios

### WooCommerce Integration Testing
- [ ] **Setup Flow**
  - Configure credentials
  - Test connection
  - Verify product count
  - Save configuration
- [ ] **Product Operations**
  - Search products by name
  - Filter by price range
  - Check stock availability
  - Get product details
- [ ] **Cart Operations**
  - View customer cart
  - Add item to cart (if supported)
  - Track abandoned carts
- [ ] **Dashboard**
  - View sales analytics
  - Monitor inventory
  - Check low stock alerts
  - View AI operation stats
- [ ] **Chat Integration**
  - Ask about products → Returns WooCommerce data
  - Check stock → Shows real-time inventory
  - Price queries → Returns correct prices

### Shopify Integration Testing
- [ ] **Setup Flow**
  - Add store URL
  - Add API token
  - Test connection
  - Verify permissions
- [ ] **Product Operations**
  - Search products
  - Get inventory
  - Lookup orders
  - Access customer data
- [ ] **Chat Integration**
  - Product queries return Shopify data
  - Order lookups work
  - Inventory checks accurate

---

## 🔍 Critical User Flows to Test

### 1. Complete Onboarding Flow
```
Sign Up → Create Organization → Add Domain → Configure WooCommerce
→ Scrape Website → Install Widget → Test Chat → Review Analytics
```

### 2. Daily User Flow
```
Login → View Dashboard → Check Conversations → Respond to Customer
→ View Analytics → Adjust Settings
```

### 3. Content Update Flow
```
Update Website → Trigger Re-scrape → Verify New Content Indexed
→ Test Chat Finds New Content
```

### 4. Team Collaboration Flow
```
Invite Team Member → Member Accepts → Assign Role → Member Performs Action
→ Verify Permissions → View Audit Log
```

### 5. Privacy Compliance Flow
```
User Requests Data → Generate Export → Email Download Link
→ User Downloads → Verify Complete → Delete Request → Confirm Deletion
```

---

## 📝 Feature Completeness Checklist

### Core Features
- [x] User authentication (signup, login, password reset)
- [x] Multi-tenant organization system
- [x] Team management (invites, roles, permissions)
- [x] AI chat widget (embeddable)
- [x] Conversation management
- [x] Website scraping
- [x] Semantic search (RAG)
- [x] Analytics dashboard
- [x] WooCommerce integration
- [x] Shopify integration (partial)
- [x] Privacy compliance (GDPR/CCPA)
- [x] Widget customization
- [x] Training data management
- [ ] Stripe billing (in progress)
- [ ] Webhooks (partially implemented)

### Advanced Features
- [x] Real-time telemetry
- [x] Abandoned cart tracking
- [x] Low stock alerts
- [x] Business intelligence insights
- [x] Audit logging
- [x] API key management
- [ ] A/B testing (not implemented)
- [ ] Live chat handoff (not implemented)
- [ ] Video tutorials (not implemented)
- [ ] Mobile app (not implemented)

---

## 🎯 Testing Priority Matrix

### P0 - Critical (Must Work)
1. Chat functionality (end-to-end)
2. User authentication
3. Widget installation
4. Website scraping
5. RAG search accuracy
6. WooCommerce product lookup
7. Data privacy (export/delete)

### P1 - High Priority
1. Analytics accuracy
2. Team management
3. Conversation history
4. Widget customization
5. Integration configuration
6. Notification system
7. Security settings

### P2 - Medium Priority
1. Advanced analytics
2. Training data upload
3. Audit logging
4. Help center
5. Performance monitoring
6. Bulk operations
7. Export functionality

### P3 - Low Priority
1. UI polish
2. Tooltips and help text
3. Keyboard shortcuts
4. Mobile responsiveness (beyond basic)
5. Dark mode consistency
6. Animation smoothness

---

## 🚨 Known Limitations & Gotchas

### Current Limitations
1. **Scraping:**
   - Worker script may not work in dev mode
   - Requires production deployment for full functionality
   - Large sites may timeout (handle with pagination)

2. **OpenAI API:**
   - Quota limits can block chat
   - Need to monitor credit usage
   - 429 errors require quota management

3. **WooCommerce:**
   - Requires REST API v3+
   - Credentials must have read permissions
   - Some WooCommerce extensions may conflict

4. **Multi-tenancy:**
   - RLS policies must be correctly configured
   - Organization context required for all operations
   - Data isolation critical (test thoroughly)

5. **Real-time Features:**
   - May require WebSocket setup (check implementation)
   - Polling fallback if WebSockets unavailable
   - Live updates may have delay

### Testing Gotchas
1. **Cache Issues:**
   - Always hard refresh (Ctrl+Shift+R)
   - Clear WordPress cache after widget changes
   - API responses may be cached

2. **Authentication:**
   - Session may expire during long tests
   - Multiple browser tabs may cause conflicts
   - Test in incognito for clean state

3. **Data Consistency:**
   - Scraping takes time (30-60 min)
   - Analytics may have processing delay
   - Real-time metrics may lag by seconds

4. **Environment Differences:**
   - Dev vs Production behavior may differ
   - Sandbox restrictions in dev
   - Production has actual integrations

---

## 📊 Testing Tracking Template

Use this in [FINDINGS_AND_ISSUES.md](./FINDINGS_AND_ISSUES.md):

```markdown
## Feature Testing Progress

### Dashboard Pages (13 pages)
- [ ] Overview Dashboard
- [ ] Conversations
- [ ] Shop
- [ ] Analytics
- [ ] Telemetry
- [ ] Customers
- [ ] Bot Training
- [ ] Team
- [ ] Installation
- [ ] Integrations
- [ ] Customization
- [ ] Privacy & Security
- [ ] Settings

### Integrations (3 integrations)
- [ ] WooCommerce Setup
- [ ] WooCommerce Dashboard
- [ ] Shopify Setup

### Critical Flows (5 flows)
- [ ] Complete Onboarding
- [ ] Daily User Flow
- [ ] Content Update Flow
- [ ] Team Collaboration Flow
- [ ] Privacy Compliance Flow

### API Endpoints (121 endpoints)
- [ ] Chat endpoints (10)
- [ ] Conversation endpoints (6)
- [ ] WooCommerce endpoints (13)
- [ ] Scraping endpoints (12)
- [ ] ... (continue as needed)
```

---

## 🎓 Testing Best Practices

### Before Each Testing Session
1. Review [E2E_TESTING_PLAN.md](./E2E_TESTING_PLAN.md) for the phase you're testing
2. Open [FINDINGS_AND_ISSUES.md](./FINDINGS_AND_ISSUES.md) in your editor
3. Clear browser cache and cookies
4. Have browser DevTools open (F12)
5. Have a notebook ready for quick observations

### During Testing
1. Test ONE feature completely before moving to next
2. Document issues IMMEDIATELY when found
3. Take screenshots of errors
4. Note exact steps to reproduce
5. Check console for errors after each action
6. Test with different data (edge cases)
7. Verify on both desktop and mobile

### After Each Feature
1. Check off completed items
2. Rate your experience (1-10)
3. Note any confusion or friction
4. Suggest improvements
5. Move to next feature

### Testing Mindset
- **Think like a user** - Don't use developer knowledge
- **Be thorough** - Don't skip "obvious" tests
- **Be skeptical** - Assume nothing works until proven
- **Be curious** - Explore beyond the script
- **Be honest** - Report real experience, not ideal

---

**End of Feature Inventory**

*This document maps the entire application. Use it alongside E2E_TESTING_PLAN.md to ensure comprehensive testing coverage. Document all findings in FINDINGS_AND_ISSUES.md.*
