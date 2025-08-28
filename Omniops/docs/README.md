# Documentation Directory

Comprehensive documentation for the Customer Service Agent project.

## Documentation Structure

```
docs/
├── PROJECT_OVERVIEW.md         # High-level project summary
├── API/                        # API Documentation
│   ├── API.md                 # Complete API reference
│   ├── API-REFERENCE-OWNED-DOMAINS.md
│   ├── SCRAPING_API.md
│   └── woocommerce-api-endpoints.md
├── Architecture/               # System Design
│   ├── ARCHITECTURE.md
│   ├── CODE_ORGANIZATION.md
│   ├── SCRAPING_ARCHITECTURE.md
│   └── FIRECRAWL_FLOW_DIAGRAM.md
├── Features/                   # Feature Documentation
│   ├── OWNED-DOMAINS-FEATURE.md
│   ├── BOT_LINK_EXAMPLES.md
│   ├── ENABLING_BOT_LINKS.md
│   └── ENCRYPTION_IMPLEMENTATION.md
├── Guides/                     # How-to Guides
│   ├── BOT_TRAINING_GUIDE.md
│   ├── PRIVACY_GUIDE.md
│   ├── STYLING_GUIDE.md
│   ├── UX_DESIGN_GUIDE.md
│   └── error-handling-and-debugging.md
├── Integration/                # Third-party Integrations
│   ├── WOOCOMMERCE_INTEGRATION_GUIDE.md
│   ├── WOOCOMMERCE_DEVELOPER_REFERENCE.md
│   ├── WOOCOMMERCE_FULL_API.md
│   └── firecrawl-enhancements.md
├── Quick Start/                # Getting Started
│   ├── QUICK_REFERENCE.md
│   ├── QUICK-START-OWNED-DOMAINS.md
│   └── TRAINING_QUICK_REFERENCE.md
├── Deployment/                 # Deployment & Operations
│   ├── DEPLOYMENT.md
│   └── WEB_SCRAPING.md
└── wireframes/                 # UI Mockups
    └── landing-page-mockup.html
```

## Documentation Categories

### 🚀 Quick Start Guides
For getting up and running quickly:
- [Quick Reference](QUICK_REFERENCE.md) - Essential commands and tips
- [Owned Domains Quick Start](QUICK-START-OWNED-DOMAINS.md) - Fast bot training
- [Training Quick Reference](TRAINING_QUICK_REFERENCE.md) - Bot training basics

### 🏗️ Architecture
Technical architecture and system design:
- [Architecture Overview](ARCHITECTURE.md) - System architecture
- [Code Organization](CODE_ORGANIZATION.md) - Project structure
- [Scraping Architecture](SCRAPING_ARCHITECTURE.md) - Web scraping system
- [Firecrawl Flow](FIRECRAWL_FLOW_DIAGRAM.md) - Scraping workflow

### 📡 API Documentation
Complete API references:
- [API Reference](API.md) - All endpoints
- [Scraping API](SCRAPING_API.md) - Web scraping endpoints
- [WooCommerce Endpoints](woocommerce-api-endpoints.md) - E-commerce APIs
- [Owned Domains API](API-REFERENCE-OWNED-DOMAINS.md) - Domain management

### 🔌 Integrations
Third-party service integrations:
- [WooCommerce Integration](WOOCOMMERCE_INTEGRATION_GUIDE.md) - Setup guide
- [WooCommerce Developer Ref](WOOCOMMERCE_DEVELOPER_REFERENCE.md) - Method reference
- [WooCommerce Full API](WOOCOMMERCE_FULL_API.md) - Complete documentation
- [Firecrawl Enhancements](firecrawl-enhancements.md) - Advanced scraping

### 🎨 Design & UX
User experience and styling:
- [UX Design Guide](UX_DESIGN_GUIDE.md) - Design principles
- [Styling Guide](STYLING_GUIDE.md) - CSS and theming
- [Wireframes](wireframes/) - UI mockups

### 🔒 Security & Privacy
Security features and compliance:
- [Privacy Guide](PRIVACY_GUIDE.md) - GDPR/CCPA compliance
- [Encryption Implementation](ENCRYPTION_IMPLEMENTATION.md) - Data protection

### 🤖 Bot Training
Training and customization:
- [Bot Training Guide](BOT_TRAINING_GUIDE.md) - Complete training guide
- [Training Integration](TRAINING_INTEGRATION.md) - Integration details
- [Bot Link Examples](BOT_LINK_EXAMPLES.md) - Link formatting
- [Enabling Bot Links](ENABLING_BOT_LINKS.md) - Link configuration

### 🚀 Deployment
Production deployment:
- [Deployment Guide](DEPLOYMENT.md) - Deploy to production
- [Web Scraping](WEB_SCRAPING.md) - Scraping in production

### 🐛 Troubleshooting
Debugging and error handling:
- [Error Handling](error-handling-and-debugging.md) - Debug guide

## Key Documentation Files

### For Developers

1. **[Architecture](ARCHITECTURE.md)** - Understand system design
2. **[API Reference](API.md)** - Work with APIs
3. **[Code Organization](CODE_ORGANIZATION.md)** - Navigate codebase
4. **[Quick Reference](QUICK_REFERENCE.md)** - Common tasks

### For Users/Admins

1. **[Bot Training Guide](BOT_TRAINING_GUIDE.md)** - Train your bot
2. **[Privacy Guide](PRIVACY_GUIDE.md)** - Manage user data
3. **[WooCommerce Integration](WOOCOMMERCE_INTEGRATION_GUIDE.md)** - E-commerce setup
4. **[Deployment Guide](DEPLOYMENT.md)** - Go to production

### For Designers

1. **[UX Design Guide](UX_DESIGN_GUIDE.md)** - Design principles
2. **[Styling Guide](STYLING_GUIDE.md)** - Theme customization
3. **[Wireframes](wireframes/)** - UI mockups

## Documentation Standards

### Writing Style
- Clear and concise
- Use examples liberally
- Include code snippets
- Add diagrams where helpful

### File Naming
- Use UPPER_CASE for main docs
- Use kebab-case for supplementary docs
- `.md` extension for all docs

### Structure Template
```markdown
# Document Title

Brief description of what this document covers.

## Table of Contents
- [Section 1](#section-1)
- [Section 2](#section-2)

## Section 1
Content with examples...

## Section 2
More content...

## See Also
- Related documentation links
```

### Code Examples
Always include practical examples:
```typescript
// Example code with comments
const example = async () => {
  // Explanation of what this does
  return result
}
```

## Contributing to Docs

1. Follow the template structure
2. Update Table of Contents
3. Test all code examples
4. Check links work
5. Run spell check
6. Update this README if adding new categories

## Quick Links

### Most Viewed
- [API Reference](API.md)
- [Quick Start Guide](QUICK-START-OWNED-DOMAINS.md)
- [Architecture Overview](ARCHITECTURE.md)
- [Bot Training Guide](BOT_TRAINING_GUIDE.md)

### Latest Updates
- Owned Domains feature documentation
- WooCommerce full API integration
- Enhanced privacy controls
- Firecrawl to Crawlee migration