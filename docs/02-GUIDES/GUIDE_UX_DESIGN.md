# UX Design Guide

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- shadcn/ui design system, Tailwind CSS
- WCAG 2.1 AA accessibility standards
**Estimated Read Time:** 28 minutes

## Purpose
Complete UX design specification covering user personas, journey maps, page wireframes, responsive design system, and WCAG 2.1 AA accessibility requirements. Includes detailed implementation roadmap with 3-phase approach (MVP, Enhancement, Scale), tech stack recommendations, and design principles for building intuitive, accessible multi-tenant AI customer service interface.

## Quick Links
- [User Personas](#-user-personas)
- [User Flow Diagram](#-user-flow-diagram)
- [Page Wireframes](#-page-wireframes)
- [Design System](#-design-system---updated-)
- [Responsive Breakpoints](#-responsive-breakpoints)
- [Accessibility](#-accessibility---enhanced-)
- [User Journey Maps](#-user-journey-maps)
- [Implementation Priority](#-implementation-priority)
- [Privacy & Security Measures](#-privacy--security-measures)
- [Analytics Implementation](#-analytics-implementation)

## Keywords
UX design, user experience, user personas, wireframes, design system, accessibility, WCAG compliance, responsive design, user journey, design patterns, interface design, user flows, color contrast, keyboard navigation, screen readers, touch targets, focus management, design principles

## Aliases
- "UX" (also known as: user experience, interface design, interaction design, usability design)
- "wireframes" (also known as: mockups, page layouts, UI sketches, screen designs, interface blueprints)
- "design system" (also known as: component library, style guide, design language, UI patterns, design standards)
- "WCAG" (also known as: accessibility standards, web accessibility guidelines, a11y standards, compliance requirements)
- "personas" (also known as: user profiles, user types, target users, user archetypes, user segments)

---

## 🎯 User Personas

### 1. **Business Owner (Primary User)**
- Wants to add AI chat to their website quickly
- Non-technical, needs simple setup
- Cares about customer experience and cost
- **ROI Focus**: "Save 12 support hours per week" messaging

### 2. **Website Visitor (End User)**
- Needs quick answers to questions
- Expects instant, helpful responses
- Values privacy and ease of use
- **Trust Signal**: "Your data is never sold" shown prominently

### 3. **Developer (Setup User)**
- Implements the widget on websites
- Needs clear documentation
- Wants customization options
- **Interactive Sandbox**: Widget playground in docs for testing

## 🔄 User Flow Diagram

```
┌─────────────────┐
│   Landing Page  │
│  (Homepage)     │
└────────┬────────┘
         │
         ├─────────────┬──────────────┬─────────────┐
         ▼             ▼              ▼             ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ Get Started  │ │  Pricing │ │ Features │ │   Docs   │
│   (/setup)   │ │          │ │          │ │          │
└──────┬───────┘ └──────────┘ └──────────┘ └──────────┘
       │
       ▼
┌──────────────┐
│ Registration │ ← Future: Auth Integration
│              │
└──────┬───────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│    Admin     │────▶│   Scraping   │
│  Dashboard   │     │    Tool      │
└──────┬───────┘     └──────────────┘
       │
       ▼
┌──────────────┐     ┌──────────────┐
│  Configure   │────▶│    Embed     │
│   Widget     │     │    Code      │
└──────────────┘     └──────────────┘
```

## 📱 Page Wireframes

### 1. Landing Page (/) - UPDATED ✓
```
┌─────────────────────────────────────────────┐
│ 🤖 AI Customer Service  [Docs] [Login]      │
├─────────────────────────────────────────────┤
│                                             │
│  Cut support workload by 40% in under       │
│  5 minutes                                  │
│                                             │
│  Instant AI customer support that learns    │
│  from your website and never sleeps         │
│                                             │
│  ┌───────────────────────────────────┐      │
│  │ [Enter your website URL        ] →│      │
│  └───────────────────────────────────┘      │
│  No signup required. See demo instantly.    │
│                                             │
│  ✓ 2-minute setup  ✓ No credit card        │
│  ✓ GDPR compliant                          │
│                                             │
├─────────────────────────────────────────────┤
│ ⏰ 24/7 Instant Replies (Hero Feature)      │
│ ┌────────────────────────────────────┐      │
│ │ Your AI agent responds instantly,   │      │
│ │ any time. 87% queries resolved.     │      │
│ │ 40+ languages supported.            │      │
│ │                  [Live Preview →]   │      │
│ └────────────────────────────────────┘      │
├─────────────────────────────────────────────┤
│ 🚀 How It Works                             │
│                                             │
│ (1)              (2)              (3)       │
│ Enter URL →  Customize Brand → Copy Code    │
│ Auto-scan     Match colors     Ready!       │
│                                             │
├─────────────────────────────────────────────┤
│ All Features [See all →]                    │
│                                             │
│ • AI-Powered (GPT-4)  • Privacy First       │
│ • Universal Platform  • Easy Integration    │
│ • E-commerce Ready    • Full Customization  │
│                                             │
├─────────────────────────────────────────────┤
│ 💰 Simple Pricing                           │
│                                             │
│ Free: 100 messages/mo                       │
│ Pro: $29/mo - 10k messages                  │
│ Enterprise: Custom                          │
│                                             │
└─────────────────────────────────────────────┘
```

### 2. Setup Wizard (/setup) - TO BE UPDATED
```
┌─────────────────────────────────────────────┐
│ Setup Your AI Assistant     Step 1 of 4 [X] │
├─────────────────────────────────────────────┤
│                                             │
│ 📊 Progress: ████░░░░░░ 25%  ≈ 2 min       │
│                                             │
│ Step 1: Website Information                 │
│                                             │
│ Website URL:                                │
│ ┌─────────────────────────────────────┐     │
│ │ https://example.com                 │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ Business Type:                              │
│ ┌─────────────────────────────────────┐     │
│ │ ▼ E-commerce                        │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ Primary Language:                           │
│ ┌─────────────────────────────────────┐     │
│ │ ▼ English                           │     │
│ └─────────────────────────────────────┘     │
│                                             │
│        [Back]            [Next: Scraping]    │
│                                             │
└─────────────────────────────────────────────┘
```

### 3. Admin Dashboard (/admin)
```
┌─────────────────────────────────────────────┐
│ 🎛️ Dashboard          [Account ▼] [Logout]   │
├─────────────────────────────────────────────┤
│                                             │
│ Welcome back! Your AI is active ✅          │
│                                             │
│ ┌──────────────┐ ┌──────────────┐          │
│ │ Messages     │ │ Active Users │          │
│ │   1,234      │ │     45       │          │
│ │ This Month   │ │    Today     │          │
│ │ 87% answered │ │              │          │
│ └──────────────┘ └──────────────┘          │
│                                             │
│ Quick Actions:                              │
│ ┌────────────────────────────────────┐      │
│ │ [📝 Update Content] [⚙️ Settings]  │      │
│ │ [📊 Analytics]     [💬 Test Chat] │      │
│ └────────────────────────────────────┘      │
│                                             │
│ Recent Conversations:                       │
│ ┌─────────────────────────────────────┐     │
│ │ User: "What are your hours?"        │     │
│ │ AI: "We're open Mon-Fri 9-5..."     │     │
│ │ ⭐⭐⭐⭐⭐ 2 min ago   [Jump to chat] │     │
│ ├─────────────────────────────────────┤     │
│ │ User: "How do I return an item?"    │     │
│ │ AI: "Our return policy..."          │     │
│ │ ⭐⭐⭐⭐☆ 15 min ago                │     │
│ └─────────────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

### 4. Scraping Tool (/admin/scraping) - ENHANCED
```
┌─────────────────────────────────────────────┐
│ 🕷️ Website Content Manager         [← Back]  │
├─────────────────────────────────────────────┤
│                                             │
│ Scrape New Content:                         │
│ ┌─────────────────────────────────────┐     │
│ │ https://mysite.com/products         │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ □ Scrape entire website (up to 50 pages)    │
│                                             │
│           [Start Scraping]                  │
│                                             │
│ Progress: Indexing 12 pages, 40 sec remaining│
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░ 40%                  │
│                                             │
├─────────────────────────────────────────────┤
│ Scraped Pages (Last Updated: 2 days ago)    │
│ Sync Schedule: [Weekly ▼]                   │
│                                             │
│ ┌─────────────────────────────────────┐     │
│ │ ✅ /home          "Welcome to..."   │     │
│ │ ✅ /products      "Our Products"    │     │
│ │ ✅ /about         "About Us"        │     │
│ │ ❌ /admin         Blocked (401)     │     │
│ │ ⚠️  /old-page     Not found (404)   │     │
│ │ ⏳ /contact       Scraping...       │     │
│ └─────────────────────────────────────┘     │
│                                             │
│ Failed Pages Log: 2 pages blocked          │
│                                             │
│ [Refresh All] [Delete Selected]             │
│                                             │
└─────────────────────────────────────────────┘
```

### 5. Widget Configuration (/configure)
```
┌─────────────────────────────────────────────┐
│ 🎨 Customize Your Widget           [← Back] │
├─────────────────────────────────────────────┤
│                                             │
│ Preview:           Customization:           │
│ ┌────────────┐     ┌───────────────────┐   │
│ │            │     │ Position:         │   │
│ │  [Widget   │     │ ○ Bottom Right ✓  │   │
│ │  Preview]  │     │ ○ Bottom Left     │   │
│ │            │     │                   │   │
│ │            │     │ Theme:            │   │
│ └────────────┘     │ ○ Light           │   │
│                    │ ○ Dark ✓          │   │
│                    │ ○ Auto            │   │
│                    │                   │   │
│                    │ Brand Color:      │   │
│                    │ [#4F46E5] 🎨     │   │
│                    │ ⚠️ Contrast: Pass  │   │
│                    │                   │   │
│                    │ Welcome Message:  │   │
│                    │ ┌───────────────┐ │   │
│                    │ │ Hi! How can I │ │   │
│                    │ │ help today?   │ │   │
│                    │ └───────────────┘ │   │
│                    └───────────────────┘   │
│                                             │
│              [Generate Embed Code]          │
│                                             │
└─────────────────────────────────────────────┘
```

### 6. Embed Code Page
```
┌─────────────────────────────────────────────┐
│ 📋 Your Embed Code                 [← Back] │
├─────────────────────────────────────────────┤
│                                             │
│ Copy this code to your website:             │
│                                             │
│ ┌─────────────────────────────────────┐     │
│ │ <!-- AI Chat Widget -->             │     │
│ │ <script>                            │     │
│ │   (function() {                     │     │
│ │     var script = document.create... │     │
│ │     script.src = 'https://your...   │     │
│ │     script.setAttribute('data-...   │     │
│ │     document.body.appendChild(...   │     │
│ │   })();                             │     │
│ │ </script>                           │     │
│ └─────────────────────────────────────┘     │
│         [📋 Copy Code]                       │
│                                             │
│ Installation Guides:                        │
│ [WordPress] [Shopify] [Wix] [Custom HTML]  │
│                                             │
│ Need help? support@yourservice.com          │
│                                             │
└─────────────────────────────────────────────┘
```

### 7. Chat Widget (Embedded on Customer Site)
```
Closed State:           Open State:
┌────┐                  ┌─────────────────────┐
│ 💬 │                  │ 🤖 Support      [X] │
└────┘                  ├─────────────────────┤
                        │ ┌─────────────────┐ │
                        │ │ Hi! I'm here to │ │
                        │ │ help. What can  │ │
                        │ │ I do for you?   │ │
                        │ └─────────────────┘ │
                        │         ┌─────────┐ │
                        │         │ Thanks! │ │
                        │         │ How do  │ │
                        │         │ I track │ │
                        │         │ order?  │ │
                        │         └─────────┘ │
                        │ ┌─────────────────┐ │
                        │ │ To track your   │ │
                        │ │ order, click... │ │
                        │ └─────────────────┘ │
                        │                     │
                        │ ┌─────────────────┐ │
                        │ │ Type here...    │ │
                        │ └─────────────────┘ │
                        └─────────────────────┘
```

## 🎨 Design System - UPDATED ✓

### Colors
- **Primary**: #4F46E5 (Indigo)
- **Primary Dark Mode**: #818CF8 (Light Indigo - WCAG AA compliant)
- **Secondary**: #10B981 (Green) 
- **Background**: #FFFFFF / #1F2937 (Dark)
- **Text**: #111827 / #F9FAFB (Dark)
- **Error**: #EF4444
- **Success**: #10B981

### Typography
- **Headings**: Inter/System Font - Bold
- **Body**: Inter/System Font - Regular  
- **Code**: Mono - Regular
- **Font Display**: swap (prevents invisible text during load)

### Components
- **Buttons**: 
  - Rounded corners
  - Hover states with color shift
  - Focus outline: 3px solid with 2px offset (WCAG 2.1 AA)
  - Min touch target: 44x44px
- **Cards**: 
  - Subtle shadow: 0 1px 3px rgba(0,0,0,0.1)
  - Rounded corners: 8px
  - Border on hover for better visibility
- **Inputs**: 
  - Clear borders: 2px solid
  - Focus state: Primary color border + shadow
  - Error messages below field (not toast)
  - Label always visible
- **Modals**: 
  - Centered with overlay
  - Escape key to close
  - Focus trap enabled
  - Return focus on close

## 📱 Responsive Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px  
- Desktop: > 1024px

## ♿ Accessibility - ENHANCED ✓
- WCAG 2.1 AA compliant contrast ratios
- Full keyboard navigation support
- Screen reader announcements with role="status" for AI responses
- "Skip to first AI answer" link in widget
- High contrast mode support
- Focus indicators: 3px outline minimum
- Escape key closes widget
- Shift+Tab cycles backward without trapping
- Error messages inline (not toasts)
- Min touch targets: 44x44px

## 🔄 User Journey Maps

### Business Owner Journey
1. **Discover** → Landing page
2. **Learn** → Features/pricing
3. **Try** → Setup wizard
4. **Configure** → Admin dashboard
5. **Launch** → Embed code
6. **Monitor** → Analytics

### Website Visitor Journey
1. **Notice** → Widget bubble
2. **Engage** → Click to open
3. **Ask** → Type question
4. **Receive** → Get AI response
5. **Resolve** → Problem solved
6. **Rate** → Feedback (optional)

## 🚀 Implementation Priority

### Phase 1 (MVP)
1. Landing page
2. Setup wizard
3. Admin dashboard
4. Widget embed
5. Basic chat function

### Phase 2 (Enhancement)
1. Analytics dashboard
2. Advanced customization
3. User authentication
4. Billing integration

### Phase 3 (Scale)
1. Multi-language
2. Voice support
3. Advanced AI training
4. Enterprise features

## 🔒 Privacy & Security Measures

### Data Protection
- **Message Retention**: 30-day default, configurable
- **GDPR Compliance**: Opt-out toggle in widget footer
- **Trust Messaging**: "Your data is never sold" prominently displayed
- **Data Storage**: Encrypted at rest, isolated by customer

### Reliability
- **Hallucination Prevention**: RAG + retrieval with source links
- **Cost Control**: Auto-throttle at 80% usage, 3 req/sec limit
- **Usage Alerts**: Dashboard banner warnings before limits

## 📊 Analytics Implementation

### Key Metrics
| Metric | Purpose | Implementation |
|--------|---------|----------------|
| Deflection Rate | Track human handoffs | Tag escalations in logs |
| First Response Time | Measure speed | Delta: widget open → AI reply |
| CSAT | Quality feedback | 1-click star rating per conversation |

### Dashboard Features
- Real-time conversation monitoring
- Weekly/monthly trend analysis
- Export capabilities for reporting
- A/B testing framework for prompts

## 🛠️ Developer Resources

### Planned Deliverables
1. **OpenAPI Specification**: Full API documentation
2. **SDK Support**: JavaScript, Python, PHP starter kits
3. **Sandbox Mode**: Test without LLM costs
4. **Code Samples**: Common integration patterns

### Framework Detection
- Auto-detect platform (WordPress, React, etc.)
- Generate appropriate embed snippets
- Platform-specific installation guides
- One-click developer email sharing

## 📝 Implementation Status (Dec 2024)

### ✅ Completed Improvements
1. **Landing Page**: 
   - Quantified promise headline (40% workload reduction)
   - Quick demo with single URL input
   - Hero feature focus (24/7 support)
   - Trust indicators and social proof
   - Simplified "How it Works" flow

2. **Design System**:
   - WCAG AA compliant color contrast
   - Dark mode color fix (#818CF8)
   - Enhanced focus states
   - Improved component specifications

3. **Accessibility**:
   - Comprehensive keyboard navigation
   - Screen reader optimizations
   - Focus management improvements

### 🚧 In Progress
1. **Setup Wizard Simplification**:
   - Single URL input for instant demo
   - Background scraping with progress
   - Multi-step state management

2. **Widget Enhancements**:
   - Theme presets (Light/Dark/Brand)
   - Live preview in configurator
   - Framework-specific embed codes

3. **Analytics Dashboard**:
   - Deflection rate tracking
   - Response time metrics
   - CSAT ratings integration

### 🔮 Next Steps
1. **Privacy & Security**:
   - 30-day data retention controls
   - Opt-out toggle in widget
   - GDPR compliance dashboard

2. **Performance**:
   - Quick-crawl for instant demos
   - Edge function optimization
   - Caching improvements

3. **Developer Experience**:
   - OpenAPI spec
   - SDK development
   - Sandbox environment

## 📅 Two-Week Sprint Plan

### Week 1
**Day 1-2**: Landing page optimization
- A/B test hero copy variations
- Track click-through to "Get Started"
- Implement quick demo flow

**Day 3-4**: Quick-crawl implementation
- Build crawler (Playwright/Cheerio)
- Extract top 6 text blocks
- Cache for instant demos

**Day 5**: Widget integration
- Wire up iframe rendering
- Connect to crawled content
- Test retrieval context

**Day 6-7**: Admin dashboard
- Create dashboard skeleton
- Add fake seed data
- Design state management

### Week 2
**Day 8-10**: Monetization
- Implement Stripe test mode
- Create pricing tiers
- Lock pro features

**Day 11-12**: Quality assurance
- Lighthouse accessibility audit
- Fix critical issues
- Performance optimization

**Day 13-14**: Beta launch
- Deploy to 3 pilot sites
- Collect CSAT feedback
- Refine AI prompts

## 🚀 Tech Stack Recommendations

### Phase 1 Build
- **Frontend**: Next.js + Tailwind CSS
- **Auth/Storage**: Supabase
- **Edge Functions**: Cloudflare Workers
- **Scraping**: Playwright/Cheerio

### Phase 2 Scale
- **Vector DB**: Postgres + pgvector
- **Queue**: BullMQ or Temporal
- **Monitoring**: Sentry + Posthog
- **CDN**: Cloudflare

### Phase 3 Enterprise
- **i18n**: next-intl + locale routing
- **Voice**: Web Speech API + ElevenLabs
- **Analytics**: Custom dashboard + export
- **Security**: SOC2 compliance tools