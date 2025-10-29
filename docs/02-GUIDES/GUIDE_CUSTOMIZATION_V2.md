# Customization V2 - Simplified Interface Guide

**Type:** Guide
**Status:** Deprecated
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- See [GUIDE_CUSTOMIZATION_FINAL.md](GUIDE_CUSTOMIZATION_FINAL.md) for current version
**Estimated Read Time:** 19 minutes

## Purpose
Historical documentation of the V2 simplified customization interface that reduced settings by 59% (58 → 24 settings) and target setup time from 15 minutes to <2 minutes. V2 introduced 3-tab structure (Essentials, Intelligence, Connect), visual pickers, personality cards, and progressive disclosure patterns. Now superseded by final clean version at /dashboard/customize.

## Quick Links
- [Key Improvements](#key-improvements)
- [Tab Structure](#tab-structure)
- [File Structure](#file-structure)
- [State Management](#state-management)
- [API Integration](#api-integration)
- [Features](#features)
- [Design Principles](#design-principles)
- [Migration Path](#migration-path)
- [Success Metrics](#success-metrics)

## Keywords
deprecated interface, customization V2, simplified configuration, 3-tab design, widget settings reduction, setup time optimization, personality cards, progressive disclosure, visual pickers, smart defaults, A/B testing, migration documentation, historical reference

## Aliases
- "V2" (also known as: version 2, second iteration, simplified version, intermediate version)
- "deprecated" (also known as: superseded, replaced, legacy, outdated, historical)
- "customization" (also known as: widget config, bot settings, configuration interface, setup wizard)
- "progressive disclosure" (also known as: collapsible sections, show-on-demand, conditional rendering, expandable UI)
- "A/B testing" (also known as: split testing, comparative testing, variant testing, user testing)

---

## Overview

The new simplified customization interface (`/dashboard/customize-v2`) reduces complexity by 59% while maintaining all essential functionality. This guide explains the new structure and how to use it.

## Key Improvements

### Before (V1)
- **8 tabs**: Theme, Position, Content, Behavior, AI, Integrations, Analytics, Advanced
- **58 settings** spread across complex forms
- **15+ minute** average setup time
- **Technical parameters** exposed (temperature, tokens, thresholds)
- **Poor completion rate** (~40%)

### After (V2)
- **3 tabs**: Essentials, Intelligence, Connect
- **24 core settings** with smart defaults
- **<2 minute** target setup time
- **Business-focused** controls only
- **Target completion rate** (85%+)

---

## Tab Structure

### 🎨 Tab 1: Essentials
Everything you need to get started with the visual appearance and basic behavior.

#### Appearance (collapsible)
- **Primary Color**: Color picker + 6 preset colors
- **Logo**: URL input with upload button and preview
- **Position**: Visual 4-button picker (BR, BL, TR, TL)

#### Messages (collapsible)
- **Bot Name**: Simple text input (30 char limit)
- **Welcome Message**: Textarea (200 char limit) with counter
- **Placeholder Text**: Input field (50 char limit)

#### Behavior (collapsible)
- **Show Avatar**: Toggle
- **Auto-Open Widget**: Toggle + delay input (conditional)
- **Sound Notifications**: Toggle

---

### 🧠 Tab 2: Intelligence
How your bot thinks and responds.

#### Personality
3 visual cards with examples:
- **🎩 Professional**: "Formal and business-oriented"
- **😊 Friendly**: "Warm and conversational"
- **⚡ Concise**: "Quick and to-the-point"

Each card shows an example response for context.

#### Language & Style
- **Language**: Dropdown (Auto-detect + top 5 languages)
- **Response Length**: 3 visual buttons (Short / Balanced / Detailed)

#### Smart Features
- **Smart Suggestions**: Toggle (shows preview badges)
- **Web Search**: Toggle

#### Response Preview
Live example showing how personality affects responses.

---

### 🔌 Tab 3: Connect
Integrate with your tools and manage data.

#### E-commerce
- **WooCommerce**: Toggle + configure button → redirects to `/dashboard/integrations`
- **Shopify**: Toggle (disabled, "Coming Soon" badge)

#### Data Sources
- **Knowledge Base**: Always active (highlighted)
- **Product Catalog**: Toggle

#### Privacy & Data
- **Track Conversations**: Toggle
- **Data Retention**: Dropdown (30/60/90/180/365 days)
- Privacy compliance info box

#### Active Integrations Summary
Quick stats card showing connection status.

---

## File Structure

```
app/dashboard/customize-v2/
├── page.tsx                          # Main page with state management
├── components/
│   ├── LivePreview.tsx              # Enhanced live preview
│   ├── PositionPicker.tsx           # Visual position selector
│   └── PersonalityCard.tsx          # Interactive personality cards
└── sections/
    ├── EssentialsSection.tsx        # Appearance, Messages, Behavior
    ├── IntelligenceSection.tsx      # Personality, Language, Features
    └── ConnectSection.tsx           # E-commerce, Data, Privacy
```

---

## State Management

### SimplifiedWidgetConfig Interface

```typescript
{
  essentials: {
    primaryColor: string;
    logoUrl: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    botName: string;
    welcomeMessage: string;
    placeholderText: string;
    showAvatar: boolean;
    autoOpen: boolean;
    autoOpenDelay: number;
    soundNotifications: boolean;
  };
  intelligence: {
    personality: 'professional' | 'friendly' | 'concise';
    language: string;
    responseStyle: 'short' | 'balanced' | 'detailed';
    enableSmartSuggestions: boolean;
    enableWebSearch: boolean;
  };
  connect: {
    enableWooCommerce: boolean;
    enableShopify: boolean;
    enableKnowledgeBase: boolean;
    enableProductCatalog: boolean;
    trackConversations: boolean;
    dataRetentionDays: number;
  };
}
```

---

## API Integration

The simplified config maps to the full widget config format:

### Mapping Logic
```typescript
// Simplified → Full Config
themeSettings: {
  primaryColor: essentials.primaryColor,
  // Other theme settings use defaults
}

behaviorSettings: {
  botName: essentials.botName,
  welcomeMessage: essentials.welcomeMessage,
  // etc.
}

aiSettings: {
  personality: intelligence.personality,
  language: intelligence.language,
  // Advanced settings (temperature, tokens) use smart defaults
}
```

---

## Features

### Progressive Disclosure
- Sections are collapsible to reduce visual clutter
- Conditional rendering (e.g., auto-open delay only shows when enabled)
- Advanced settings link to `/dashboard/customize` (old version)

### Visual Feedback
- Color picker with instant preview
- Position picker with visual grid
- Personality cards with example responses
- Live preview updates in real-time
- "Unsaved changes" badge

### Smart Defaults
- All settings have sensible defaults
- 80% of users won't need to change them
- Color picker suggests common brand colors
- Language auto-detection enabled by default

---

## Usage

### Accessing the Page
```
/dashboard/customize-v2?customerConfigId=<uuid>
```

### Loading Configuration
On mount, the page:
1. Reads `customerConfigId` from URL params
2. Fetches existing config from `/api/widget-config`
3. Maps full config to simplified format
4. Populates form fields

### Saving Configuration
When user clicks "Save Changes":
1. Maps simplified config back to full format
2. Checks if config exists (GET request)
3. POST (new) or PUT (update) to `/api/widget-config`
4. Shows success/error toast

---

## Advanced Settings

Users needing more control can access the full interface:

**Link location**: Bottom of the page
```
"Need advanced controls? Developer Settings →"
```

**Advanced settings include**:
- AI temperature, max tokens, confidence threshold
- Custom system prompts
- CORS origins, security headers
- Custom CSS
- Webhook configuration
- Debug mode, cache settings

---

## Design Principles

### 1. Fewer Choices = Faster Setup
- Every setting must justify its existence
- 80/20 rule: 20% of settings provide 80% of value

### 2. Visual Over Technical
- Color pickers instead of hex codes
- Visual position grid instead of coordinates
- Personality cards with examples instead of dropdowns

### 3. Contextual Defaults
- E-commerce site? Auto-enable product search
- Multi-language site? Auto-enable language detection

### 4. Progressive Complexity
- Start simple, reveal advanced on demand
- "Need more control?" → expansion panel
- Never show what 90% won't use

---

## Testing

### Manual Testing
1. Navigate to `/dashboard/customize-v2?customerConfigId=<valid-uuid>`
2. Verify all sections load correctly
3. Make changes to each setting
4. Verify live preview updates
5. Save and reload page
6. Verify changes persisted

### Build Verification
```bash
npm run build
```
The page compiles successfully at `/dashboard/customize-v2` (14.2 kB bundle size).

---

## Migration Path

### Phase 1: A/B Testing (Current)
- V2 available at `/dashboard/customize-v2`
- V1 remains at `/dashboard/customize`
- Users can access both versions

### Phase 2: Gradual Migration
- Add banner to V1: "Try our new simplified interface"
- Track adoption metrics
- Gather user feedback

### Phase 3: Full Migration
- Make V2 the default
- Rename V1 to `/dashboard/customize/advanced`
- Update all links to point to V2

---

## Success Metrics

Track these KPIs to measure improvement:

| Metric | V1 Baseline | V2 Target |
|--------|-------------|-----------|
| Setup time | 15 min | <2 min |
| Settings changed per session | 15-25 | 5-8 |
| Completion rate | 40% | 85% |
| Support tickets | Baseline | -60% |
| User satisfaction | 3.2/5 | >4.5/5 |

---

## Developer Notes

### Adding New Settings
1. Add to `SimplifiedWidgetConfig` interface
2. Update `defaultConfig`
3. Add UI control to appropriate section
4. Update mapping in `saveConfiguration()`
5. Test save/load cycle

### Collapsible Sections
Use local state for expand/collapse:
```typescript
const [sectionExpanded, setSectionExpanded] = useState(true);
```

### Conditional Rendering
Hide/show based on toggle state:
```typescript
{settings.autoOpen && (
  <div className="pl-4 border-l-2">
    {/* Conditional content */}
  </div>
)}
```

---

## Known Limitations

1. **Shopify Integration**: Not yet implemented (shows "Coming Soon")
2. **Logo Upload**: URL input only (file upload UI not connected)
3. **Advanced Features**: Must use V1 for custom CSS, webhooks, etc.

---

## Future Enhancements

### Smart Defaults
- [ ] Logo color extraction using color-thief
- [ ] Industry-based welcome message templates
- [ ] Auto-suggest bot name from company name

### Enhanced Preview
- [ ] Mobile preview mode
- [ ] Dark mode preview
- [ ] Multiple device sizes

### Onboarding
- [ ] Wizard mode for first-time setup
- [ ] Interactive tutorial
- [ ] Quick-start templates

---

## Support

For questions or issues:
- **Documentation**: `/docs/CUSTOMIZATION_V2_GUIDE.md`
- **Advanced Settings**: `/dashboard/customize`
- **API Reference**: `/app/api/widget-config/route.ts`
