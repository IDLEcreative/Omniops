# Pricing Components

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [UI Components](/home/user/Omniops/components/ui/README.md), [Pricing Page](/home/user/Omniops/app/pricing/page.tsx), [Pricing Content Reference](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md)
**Estimated Read Time:** 5 minutes

## Purpose

Complete pricing page component system with interactive calculators (ROI, multi-domain), pricing tiers, feature comparison table, AI quote widget, social proof, and FAQ sections.

## Quick Links

- [Main Components Directory](/home/user/Omniops/components/README.md)
- [Pricing Page](/home/user/Omniops/app/pricing/page.tsx)
- [Pricing Content Reference](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md)
- [Pricing Architecture](/home/user/Omniops/docs/01-ARCHITECTURE/ARCHITECTURE_PRICING_MODEL.md)

---

## Keywords

pricing, calculators, ROI, multi-domain discounts, pricing tiers, feature comparison, AI quote, FAQ

## Component Overview

### Main Components

| Component | Purpose | Features |
|-----------|---------|----------|
| **PricingHero** | Hero section with headline and CTA | Gradient background, trust badges, scroll-to-quote functionality |
| **AIQuoteWidget** | AI-powered instant quote form | Domain input, async quote generation, social proof |
| **PricingTiers** | Four pricing tier cards | Featured tier (SME), comparisons, customer testimonials |
| **PricingTierCard** | Individual pricing tier | Price, features, perfect-for list, customer quote |
| **FeatureComparisonTable** | Responsive feature matrix | 6 categories, 20+ features, scrollable on mobile |
| **MultiDomainCalculator** | Multi-domain discount calculator | Discount tiers (1-35%), price comparison, savings display |
| **ROICalculator** | ROI and savings calculator | Interactive sliders, plan recommendation, annual savings |
| **PricingFAQ** | Frequently Asked Questions | 15 FAQs, accordion UI, sales contact info |
| **SocialProof** | Testimonials and statistics | 3 customer testimonials, 4 key stats, trust badges |
| **FinalCTA** | Final call-to-action section | Gradient background, primary/secondary buttons, trust line |

## Data Structure

### Pricing Tiers
- Small Business: £500/month, 2,500 conversations
- SME: £1,000/month, 5,000 conversations (Most Popular)
- Mid-Market: £5,000/month, 25,000 conversations
- Enterprise: £10,000/month, 100,000 conversations

### Multi-Domain Discounts
- 1 domain: 0%
- 2 domains: 10%
- 3 domains: 15%
- 4 domains: 20%
- 5 domains: 25%
- 6-10 domains: 30%
- 11+ domains: 35%

## Usage

### Basic Implementation
```typescript
import {
  PricingHero,
  AIQuoteWidget,
  PricingTiers,
  PricingFAQ,
  FinalCTA
} from '@/components/pricing';

export default function PricingPage() {
  return (
    <main>
      <PricingHero />
      <AIQuoteWidget />
      <PricingTiers />
      <PricingFAQ />
      <FinalCTA />
    </main>
  );
}
```

### With Scroll-to-Quote
```typescript
const quoteWidgetRef = useRef<HTMLDivElement>(null);

const handleGetQuoteClick = () => {
  quoteWidgetRef.current?.scrollIntoView({ behavior: 'smooth' });
};

return (
  <>
    <PricingHero onGetQuoteClick={handleGetQuoteClick} />
    <div ref={quoteWidgetRef}>
      <AIQuoteWidget />
    </div>
  </>
);
```

## Interactive Features

### ROI Calculator
- Adjustable monthly visitors (5k - 1M)
- Adjustable CS team size (1-20)
- Real-time plan recommendations
- Annual savings calculation
- ROI display

### Multi-Domain Calculator
- Domain count selector (1-20+)
- Automatic discount calculation
- Price per domain display
- Total cost comparison
- Savings breakdown

## Styling & Design

- **Colors:** Blue gradient (600-700), Purple (600), Green (600)
- **Components:** shadcn/ui (Button, Input, Slider, Accordion, Card)
- **Tailwind CSS:** Responsive grid, flex, spacing utilities
- **Responsive:** Mobile-first, works on all screen sizes
- **Animations:** Smooth transitions, hover effects

## Content Source

All pricing, features, and copy are sourced from:
- `/docs/09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md`

## Features

✅ Fully responsive design
✅ Interactive calculators (ROI, multi-domain)
✅ Accessible components (Accordion, Slider)
✅ TypeScript strict mode
✅ No external API calls (client-side only)
✅ Zero prop drilling (self-contained)

## Future Enhancements

- [ ] API integration for AI quote generation
- [ ] Payment integration (Stripe)
- [ ] Customer success testimonial carousel
- [ ] Pricing comparison animations
- [ ] Dark mode support
- [ ] Annual vs monthly toggle

## Related Files

- `/app/pricing/page.tsx` - Main pricing page
- `/docs/09-REFERENCE/REFERENCE_PRICING_PAGE_CONTENT.md` - Content reference
- `/docs/01-ARCHITECTURE/ARCHITECTURE_PRICING_MODEL.md` - Pricing architecture
