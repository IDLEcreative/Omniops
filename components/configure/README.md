# Configure Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Configure Page](/home/user/Omniops/app/configure), [Dashboard Settings](/home/user/Omniops/app/dashboard/settings), [UI Components](/home/user/Omniops/components/ui/README.md)
**Estimated Read Time:** 2 minutes

## Purpose

Widget configuration and customization components including a multi-step wizard, appearance customizer, theme selector, behavior settings, and embed code generator.

## Quick Links

- [Main Components Directory](/home/user/Omniops/components/README.md)
- [ChatWidget Directory](/home/user/Omniops/components/ChatWidget/README.md)
- [Dashboard Components](/home/user/Omniops/components/dashboard/README.md)

---

## Keywords

widget configuration, customization wizard, theme selector, appearance, behavior settings, embed code

## Overview

Components for the widget configuration wizard and appearance customization interface.

## Files

- **[ConfigurationWizard.tsx](ConfigurationWizard.tsx)** - Multi-step configuration wizard
- **[StepIndicator.tsx](StepIndicator.tsx)** - Progress indicator for wizard
- **[AppearanceCustomizer.tsx](AppearanceCustomizer.tsx)** - Visual customization panel
- **[ThemeSelector.tsx](ThemeSelector.tsx)** - Color theme selection
- **[BehaviorPanel.tsx](BehaviorPanel.tsx)** - Widget behavior settings
- **[FeaturesPanel.tsx](FeaturesPanel.tsx)** - Feature toggles and integrations
- **[WidgetPreview.tsx](WidgetPreview.tsx)** - Live preview of widget
- **[EmbedCodeGenerator.tsx](EmbedCodeGenerator.tsx)** - Generate embed code

## Usage

```typescript
import { ConfigurationWizard } from '@/components/configure/ConfigurationWizard';

<ConfigurationWizard
  onComplete={handleSave}
  initialConfig={currentConfig}
/>
```

## Features

- Real-time preview
- Theme customization
- Feature configuration
- Embed code generation
