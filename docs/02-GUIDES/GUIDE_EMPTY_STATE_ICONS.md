# Empty State Icon Mapping Guide

This guide provides a standardized mapping of Lucide React icons to be used with the `EmptyState` component across the application. Following these guidelines ensures visual consistency and intuitive communication throughout the user interface.

## Icon Import Statement

```typescript
import {
  Users, MessageCircle, TrendingUp, MessageSquare, Search, Clock, Globe,
  BarChart3, Bot, FileText, Settings, Shield, Database, AlertCircle,
  Package, ShoppingCart, CreditCard, Calendar, Star, Zap, Target
} from "lucide-react";
```

## Core Icon Mappings

### People & Users
- **`Users`** - Team members, customers, user lists, language demographics
- **`UserPlus`** - New user registration, invitations
- **`UserCheck`** - User verification, authentication status

### Communication
- **`MessageCircle`** - Conversations, chat sessions, discussions
- **`MessageSquare`** - Messages, queries, comments, feedback
- **`Bot`** - AI agents, automated responses, chatbots

### Analytics & Data
- **`TrendingUp`** - Growth metrics, sentiment analysis, positive trends
- **`TrendingDown`** - Declining metrics, negative trends
- **`BarChart3`** - Charts, performance overview, statistics
- **`Activity`** - Live activity, real-time data

### Time & Scheduling
- **`Clock`** - Peak hours, time-based metrics, response times
- **`Calendar`** - Scheduled events, date ranges, appointments

### Search & Discovery
- **`Search`** - Search results, failed searches, queries
- **`Globe`** - Language distribution, geographic data, internationalization

### System & Configuration
- **`Settings`** - Configuration, setup, preferences
- **`Database`** - Data storage, backups, records
- **`Shield`** - Security, privacy, protection
- **`AlertCircle`** - Warnings, important notices, errors

### E-commerce & Transactions
- **`ShoppingCart`** - Cart data, purchases, orders
- **`CreditCard`** - Payments, billing, subscriptions
- **`Package`** - Products, inventory, shipments
- **`DollarSign`** - Revenue, costs, financial metrics

### Performance & Quality
- **`Zap`** - Performance, speed, optimization
- **`Star`** - Ratings, satisfaction, favorites
- **`Target`** - Goals, objectives, accuracy

### Content & Documentation
- **`FileText`** - Documents, reports, content
- **`BookOpen`** - Training materials, documentation, guides

## Usage Patterns by Context

### Dashboard Pages

#### Main Dashboard (`/dashboard/page.tsx`)
- Performance Overview: `BarChart3`
- Recent Conversations: `MessageSquare`
- Language Distribution: `Users`

#### Team Management (`/dashboard/team/page.tsx`)
- Empty team list: `Users`
- Pending invitations: `UserPlus`

#### Customer Management (`/dashboard/customers/page.tsx`)
- Customer list: `Users`
- Customer activity: `Activity`

#### Analytics (`/dashboard/analytics/page.tsx`)
- Sentiment trends: `TrendingUp` or `TrendingDown`
- Query patterns: `MessageSquare`
- Failed searches: `Search`
- Language data: `Users` or `Globe`

#### Conversations (`/dashboard/conversations/page.tsx`)
- Conversation list: `MessageCircle`
- Peak hours: `Clock`
- Language distribution: `Globe`

#### Training (`/dashboard/training/page.tsx`)
- Training data: `Bot`
- Documentation: `FileText`

#### Telemetry (`/dashboard/telemetry/page.tsx`)
- Performance metrics: `Zap`
- System monitoring: `Activity`

## Implementation Examples

### Basic Empty State
```typescript
<EmptyState
  icon={Users}
  title="No customers yet"
  description="Customer profiles will appear here once they start using your chat widget"
  variant="default"
/>
```

### With Action Button
```typescript
<EmptyState
  icon={MessageCircle}
  title="No conversations yet"
  description="Conversations will appear here once customers start chatting"
  actionLabel="View Setup Guide"
  actionHref="/dashboard/settings"
  variant="default"
/>
```

### Compact Variant
```typescript
<EmptyState
  icon={Clock}
  title="No peak hours data"
  description="Peak hour patterns will emerge as more conversations are recorded"
  variant="compact"
/>
```

### Card Variant
```typescript
<EmptyState
  icon={BarChart3}
  title="No performance data"
  description="Start collecting data by integrating the chat widget"
  actionLabel="Get Started"
  actionHref="/dashboard/settings"
  variant="card"
  className="h-full"
/>
```

## Decision Tree for Icon Selection

```
Is it about people/users?
  YES → Users (generic) | UserPlus (adding) | UserCheck (verification)

Is it about communication?
  YES → MessageCircle (conversations) | MessageSquare (messages) | Bot (AI)

Is it about data/analytics?
  YES → TrendingUp/Down (trends) | BarChart3 (charts) | Activity (real-time)

Is it about time?
  YES → Clock (duration) | Calendar (dates)

Is it about search/discovery?
  YES → Search (queries) | Globe (geography/language)

Is it about system/config?
  YES → Settings (config) | Database (storage) | Shield (security)

Is it about commerce?
  YES → ShoppingCart (cart) | CreditCard (payment) | Package (products)

Is it about performance?
  YES → Zap (speed) | Star (quality) | Target (goals)

Is it about content?
  YES → FileText (documents) | BookOpen (guides)
```

## Best Practices

### DO:
- ✅ Use the same icon consistently for the same data type across all pages
- ✅ Choose icons that intuitively represent the content type
- ✅ Consider the icon's visual weight in relation to the variant used
- ✅ Test icon choices with actual empty states to ensure clarity

### DON'T:
- ❌ Mix different icons for the same data type across pages
- ❌ Use overly specific icons that might not scale to other use cases
- ❌ Choose icons based solely on visual appeal without considering meaning
- ❌ Hardcode business-specific icons that won't work for all tenants

## Extending the Icon Set

When adding new features that require empty states:

1. First check if an existing icon mapping fits the use case
2. If not, select a new icon that:
   - Has clear semantic meaning
   - Doesn't conflict with existing mappings
   - Works across different business contexts (multi-tenant consideration)
3. Add the new mapping to this guide
4. Update all relevant components to use the new standard

## Multi-Tenant Considerations

Remember that this is a brand-agnostic, multi-tenant system. Icons must work equally well for:
- E-commerce stores
- Restaurants
- Healthcare providers
- Educational institutions
- Service businesses
- Any other business type

Never use icons that are specific to one industry or business type.