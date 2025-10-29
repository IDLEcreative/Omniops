# Project Overview

## Customer Service Agent

An enterprise-grade, AI-powered customer service chat widget that can be embedded on any website. Built with Next.js 15, React 19, TypeScript, and Supabase.

## 🎯 Project Status

- **Version**: 2.1.0
- **Stage**: Production Ready
- **Last Updated**: January 2025

## 📁 Directory Structure

### Core Directories

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| `/app` | Next.js App Router pages and API routes | `layout.tsx`, API routes |
| `/components` | Reusable React components | UI components, widgets |
| `/lib` | Business logic and services | Core functionality |
| `/types` | TypeScript type definitions | API and database types |
| `/docs` | Documentation | Guides, API docs |
| `/public` | Static assets | `embed.js` widget loader |
| `/supabase` | Database migrations | SQL migration files |
| `/__tests__` | Test suite | Unit and integration tests |

### Supporting Directories

| Directory | Purpose | Status |
|-----------|---------|--------|
| `/scripts` | Utility scripts | Active |
| `/hooks` | React hooks | Ready for implementation |
| `/browser-automation` | Experimental tools | Experimental |
| `/constants` | App constants | Active |

## 🔧 Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts |
| `tsconfig.json` | TypeScript configuration |
| `next.config.ts` | Next.js configuration |
| `tailwind.config.js` | Tailwind CSS configuration |
| `jest.config.js` | Test configuration |
| `.env.example` | Environment variables template |
| `docker-compose.yml` | Redis for development |
| `CLAUDE.md` | AI assistant instructions |

## 📚 Documentation Structure

```
docs/
├── API/                 # API documentation
├── Architecture/        # System design docs
├── Features/           # Feature documentation
├── Guides/             # How-to guides
├── Integration/        # Third-party integrations
├── Quick Start/        # Getting started guides
└── Deployment/         # Production deployment
```

## 🚀 Key Features

### Core Functionality
- AI-powered chat (OpenAI GPT-4)
- Web scraping with Crawlee
- Vector embeddings for semantic search
- Multi-tenant architecture
- Privacy-first design (GDPR/CCPA)

### Integrations
- WooCommerce full API
- Supabase (PostgreSQL + pgvector)
- Redis job queue
- OpenAI embeddings

### Admin Features
- Customer configuration
- Content management
- Privacy controls
- Analytics dashboard
- Bot training

## 🛠️ Development Workflow

### Quick Commands
```bash
npm run dev              # Start development
npm test                 # Run tests
npm run build           # Build production
npm run lint            # Lint code
npx tsc --noEmit        # Type check
```

### Environment Setup
1. Copy `.env.example` to `.env.local`
2. Configure Supabase credentials
3. Add OpenAI API key
4. Start Redis: `docker-compose up -d`
5. Run migrations in `/supabase/migrations`

## 📦 Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Styling | Tailwind CSS, shadcn/ui |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| AI/ML | OpenAI GPT-4, Embeddings |
| Scraping | Crawlee, Playwright |
| Queue | Redis |
| Testing | Jest, React Testing Library |

## 🔐 Security Features

- AES-256 encryption for credentials
- Row Level Security (RLS)
- Rate limiting per domain
- CORS protection
- Input validation with Zod
- Secure environment variables

## 📈 Performance Optimizations

- Vector search with pgvector
- Redis caching
- Lazy loading
- Connection pooling
- Optimized bundle size
- CDN for static assets

## 🧪 Testing Strategy

- Unit tests for business logic
- Integration tests for APIs
- Component tests for UI
- MSW for API mocking
- 70%+ coverage target

## 📝 Code Standards

### Naming Conventions
- Components: PascalCase
- Files: kebab-case or PascalCase
- Functions: camelCase
- Types/Interfaces: PascalCase
- Constants: UPPER_SNAKE_CASE

### Best Practices
- TypeScript strict mode
- Functional components
- Custom hooks for logic
- Error boundaries
- Proper error handling

## 🚢 Deployment

### Recommended: Vercel
- Automatic deployments
- Edge functions
- Environment variables
- Analytics

### Self-Hosting
- Build: `npm run build`
- Start: `npm start`
- Use PM2 or systemd
- Configure nginx/Apache

## 📊 Project Metrics

- **Files**: ~200+ source files
- **Dependencies**: 50+ packages
- **Test Coverage**: 70%+ target
- **Bundle Size**: < 500KB initial
- **Load Time**: < 3s target

## 🔄 Version History

- **v2.1.0**: Owned domains, 20x faster scraping
- **v2.0.0**: Full WooCommerce integration
- **v1.1.0**: Enhanced privacy controls
- **v1.0.0**: Initial release

## 👥 Team & Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Support: Via admin panel

## 🎯 Future Roadmap

- [ ] WebSocket real-time updates
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Voice chat support
- [ ] Mobile SDK
- [ ] Webhook integrations

## 📄 License

MIT License - See LICENSE file for details