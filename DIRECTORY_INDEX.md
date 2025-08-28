# Directory Index

**Complete Documentation Map for Customer Service Agent**

This comprehensive index provides navigation to all directories and documentation in the Customer Service Agent project. Use this as your primary reference for finding specific documentation and understanding the project structure.

## 📊 Documentation Status Overview

| Directory | README Status | Documentation Type | Coverage |
|-----------|---------------|-------------------|----------|
| **/** | ✅ Complete | Project Overview | Comprehensive |
| **app/** | 🔘 No README | Next.js App Router | Structure Only |
| **app/admin/** | 🔘 No README | Admin UI Pages | Structure Only |
| **app/api/** | 🔘 No README | API Routes | Structure Only |
| **components/** | ✅ Complete | Component Library | Comprehensive |
| **components/chat/** | ✅ Complete | Chat Components | Detailed |
| **components/dashboard/** | ✅ Complete | Dashboard UI | Detailed |
| **components/forms/** | ✅ Complete | Form Components | Detailed |
| **components/layout/** | ✅ Complete | Layout Components | Detailed |
| **components/shared/** | ✅ Complete | Shared Components | Detailed |
| **hooks/** | ✅ Complete | React Hooks | Detailed |
| **lib/** | 🔘 No README | Core Logic | Structure Only |
| **lib/auth/** | ✅ Complete | Authentication | Detailed |
| **lib/monitoring/** | 🔘 No README | System Monitoring | Structure Only |
| **lib/queue/** | ✅ Complete | Job Queue System | Detailed |
| **lib/woocommerce-api/** | ✅ Complete | WooCommerce Integration | Detailed |
| **lib/workers/** | 🔘 No README | Background Workers | Structure Only |
| **logs/** | ✅ Complete | Application Logs | Basic |
| **public/** | ✅ Complete | Static Assets | Basic |

## 🗂️ Complete Project Structure

```
customer-service-agent/
├── 📄 README.md                          ← Project overview and setup
├── 📄 TYPE_DOCUMENTATION_INDEX.md        ← TypeScript documentation guide  
├── 📄 SUPABASE_WEBHOOK_SETUP.md         ← Webhook configuration guide
├── 📄 DIRECTORY_INDEX.md                 ← This navigation file
├── 📄 package.json                       ← Dependencies and scripts
├── 📄 docker-compose.dev.yml            ← Development environment
├── 📄 Dockerfile.worker                  ← Worker container configuration
├── 📄 redis.conf                         ← Redis configuration
├── 📄 test-queue-import.js              ← Queue testing script
├── 📄 test-queue-system.js              ← Queue system test
│
├── 📁 app/                               ← Next.js App Router (🔘 No README)
│   ├── 📁 admin/                        ← Admin interface pages
│   │   ├── 📁 content/                  ← Content management
│   │   ├── 📁 dashboard/                ← Admin dashboard
│   │   ├── 📁 scraping/                 ← Scraping management  
│   │   ├── 📁 settings/                 ← System settings
│   │   └── 📁 tickets/                  ← Support ticket management
│   │
│   └── 📁 api/                          ← API routes (🔘 No README)
│       ├── 📁 jobs/                     ← Job management endpoints
│       │   ├── 📁 [jobId]/              ← Individual job operations
│       │   └── 📄 route.ts              ← Job CRUD operations
│       ├── 📁 queue/                    ← Queue management API
│       │   └── 📄 route.ts              ← Queue status and controls
│       ├── 📁 scrape-jobs/              ← Web scraping job endpoints
│       │   ├── 📁 [id]/                 ← Individual scrape jobs
│       │   │   ├── 📁 retry/            ← Job retry functionality
│       │   │   └── 📄 route.ts          ← Job operations
│       │   ├── 📁 next/                 ← Next job retrieval
│       │   ├── 📁 stats/                ← Scraping statistics
│       │   └── 📄 route.ts              ← Scrape job management
│       └── 📁 webhooks/                 ← Webhook endpoints
│           └── 📁 customer/             ← Customer-related webhooks
│               └── 📄 route.ts          ← Customer webhook handler
│
├── 📁 components/                       ← React Component Library
│   ├── 📄 README.md                    ← ✅ Component system overview
│   ├── 📄 COMPONENT_TYPES.md           ← TypeScript component types
│   │
│   ├── 📁 chat/                        ← Chat Interface Components  
│   │   └── 📄 README.md                ← ✅ Chat component documentation
│   │
│   ├── 📁 dashboard/                   ← Dashboard Components
│   │   └── 📄 README.md                ← ✅ Dashboard component docs
│   │
│   ├── 📁 forms/                       ← Form Components
│   │   └── 📄 README.md                ← ✅ Form component documentation
│   │
│   ├── 📁 layout/                      ← Layout Components  
│   │   └── 📄 README.md                ← ✅ Layout component docs
│   │
│   └── 📁 shared/                      ← Shared/Common Components
│       └── 📄 README.md                ← ✅ Shared component documentation
│
├── 📁 hooks/                           ← React Custom Hooks
│   └── 📄 README.md                    ← ✅ Hooks documentation and usage
│
├── 📁 lib/                             ← Core Business Logic (🔘 No README)
│   ├── 📄 logger.ts                    ← Logging utility
│   ├── 📄 scrape-job-manager.ts        ← Job management logic  
│   ├── 📄 WOOCOMMERCE_TYPES.md         ← WooCommerce type definitions
│   │
│   ├── 📁 auth/                        ← Authentication System
│   │   └── 📄 README.md                ← ✅ Auth implementation guide
│   │
│   ├── 📁 monitoring/                  ← System Monitoring (🔘 No README)
│   │   └── 📄 scrape-monitor.ts        ← Scraping monitoring service
│   │
│   ├── 📁 queue/                       ← Job Queue System
│   │   ├── 📄 README.md                ← ✅ Queue system documentation
│   │   ├── 📄 index.ts                 ← Queue exports
│   │   ├── 📄 job-processor.ts         ← Job processing logic
│   │   └── 📄 queue-utils.ts           ← Queue utilities
│   │
│   ├── 📁 woocommerce-api/             ← WooCommerce Integration
│   │   └── 📄 README.md                ← ✅ WooCommerce API documentation
│   │
│   └── 📁 workers/                     ← Background Workers (🔘 No README)  
│       └── 📄 scraper-worker-service.ts ← Web scraping worker service
│
├── 📁 logs/                            ← Application Logs
│   └── 📄 README.md                    ← ✅ Logging configuration
│
└── 📁 public/                          ← Static Assets
    └── 📄 README.md                    ← ✅ Asset management guide
```

## 🔍 Quick Navigation Links

### 📖 Primary Documentation
- **[Project README](./README.md)** - Complete setup and usage guide
- **[TypeScript Documentation](./TYPE_DOCUMENTATION_INDEX.md)** - All type definitions and patterns
- **[Supabase Webhooks](./SUPABASE_WEBHOOK_SETUP.md)** - Webhook configuration guide

### 🎨 Component Documentation  
- **[Component Overview](./components/README.md)** - Component system architecture
- **[Component Types](./components/COMPONENT_TYPES.md)** - TypeScript definitions
- **[Chat Components](./components/chat/README.md)** - Real-time messaging interface
- **[Dashboard Components](./components/dashboard/README.md)** - Admin and analytics
- **[Form Components](./components/forms/README.md)** - User input and validation  
- **[Layout Components](./components/layout/README.md)** - Page structure and navigation
- **[Shared Components](./components/shared/README.md)** - Reusable UI elements

### ⚙️ System Documentation
- **[Authentication](./lib/auth/README.md)** - Auth implementation and security
- **[Job Queue System](./lib/queue/README.md)** - Background job processing
- **[WooCommerce Integration](./lib/woocommerce-api/README.md)** - E-commerce API integration
- **[Custom Hooks](./hooks/README.md)** - React hooks and state management

### 📊 Reference Documentation
- **[WooCommerce Types](./lib/WOOCOMMERCE_TYPES.md)** - E-commerce type definitions
- **[Application Logs](./logs/README.md)** - Logging system configuration
- **[Static Assets](./public/README.md)** - Asset management

## 🎯 Documentation Categories

### ✅ **Fully Documented** (11 directories)
Well-documented directories with comprehensive README files:
- `/` - Project root with main README
- `/components/` and all 5 subdirectories
- `/hooks/` - React hooks documentation  
- `/lib/auth/` - Authentication system
- `/lib/queue/` - Job queue system
- `/lib/woocommerce-api/` - WooCommerce integration
- `/logs/` - Logging system
- `/public/` - Static assets

### 🔘 **Missing Documentation** (7 directories)
Directories that would benefit from README files:
- `/app/` - Next.js App Router structure
- `/app/admin/` - Admin interface organization
- `/app/api/` - API endpoint documentation
- `/lib/` - Core business logic overview  
- `/lib/monitoring/` - Monitoring system docs
- `/lib/workers/` - Background worker services

## 🔧 Development Quick Start

### Essential Files for New Developers
1. **[README.md](./README.md)** - Start here for setup
2. **[TYPE_DOCUMENTATION_INDEX.md](./TYPE_DOCUMENTATION_INDEX.md)** - TypeScript reference
3. **[components/README.md](./components/README.md)** - UI component system
4. **[lib/queue/README.md](./lib/queue/README.md)** - Background job system

### API Development  
- **API Routes**: `app/api/` - RESTful endpoints
- **Job Management**: `app/api/jobs/` - Background job APIs  
- **Queue Control**: `app/api/queue/` - Queue management
- **Webhooks**: `app/api/webhooks/` - External integrations

### Frontend Development
- **Components**: `components/` - Reusable UI components
- **Hooks**: `hooks/` - Custom React hooks
- **Admin UI**: `app/admin/` - Administrative interfaces

### Backend Development  
- **Queue System**: `lib/queue/` - Job processing
- **Workers**: `lib/workers/` - Background services
- **Auth**: `lib/auth/` - Authentication logic
- **Integrations**: `lib/woocommerce-api/` - External APIs

## 🔍 Search Tips

### Finding Specific Documentation
- **Component docs**: Look in `components/[category]/README.md`
- **API types**: Check `TYPE_DOCUMENTATION_INDEX.md`  
- **Integration guides**: Look for service-specific README files
- **Setup instructions**: Start with main `README.md`

### Common Documentation Patterns
- **README.md**: Primary documentation for each directory
- **TYPES.md**: TypeScript definitions and examples
- **Service-specific**: Named files like `SUPABASE_WEBHOOK_SETUP.md`

## 📈 Documentation Health

### Completion Statistics
- **Total Directories**: 18
- **Documented**: 11 (61%)
- **Missing Documentation**: 7 (39%)
- **Specialized Docs**: 4 (TYPE_DOCUMENTATION_INDEX.md, SUPABASE_WEBHOOK_SETUP.md, COMPONENT_TYPES.md, WOOCOMMERCE_TYPES.md)

### Priority Areas for Documentation
1. **`/app/api/`** - API endpoint documentation
2. **`/lib/`** - Core business logic overview
3. **`/lib/workers/`** - Background worker services
4. **`/lib/monitoring/`** - System monitoring
5. **`/app/admin/`** - Admin interface structure

## 🚀 Getting Started Paths

### **New Developer Setup**
1. Read [README.md](./README.md) for project overview
2. Review [TYPE_DOCUMENTATION_INDEX.md](./TYPE_DOCUMENTATION_INDEX.md) for types
3. Explore [components/README.md](./components/README.md) for UI system

### **Frontend Development**
1. Start with [components/README.md](./components/README.md)
2. Review specific component docs in subdirectories
3. Check [hooks/README.md](./hooks/README.md) for state management

### **Backend Development**  
1. Review [lib/queue/README.md](./lib/queue/README.md) for job system
2. Check [lib/auth/README.md](./lib/auth/README.md) for authentication
3. Read [SUPABASE_WEBHOOK_SETUP.md](./SUPABASE_WEBHOOK_SETUP.md) for integrations

### **DevOps/Deployment**
1. Study Docker files and `docker-compose.dev.yml`
2. Review Redis configuration in `redis.conf`
3. Check environment setup in main [README.md](./README.md)

---

**Last Updated**: 2025-08-28  
**Documentation Coverage**: 61% (11/18 directories)  
**Project Status**: Active Development

*This index is automatically maintainable and should be updated when new directories or documentation are added.*