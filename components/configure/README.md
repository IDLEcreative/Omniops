**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Configure Directory

**Purpose:** Widget configuration and customization components
**Last Updated:** 2025-10-30
**Related:** [Configure Page](/app/configure), [Dashboard Settings](/app/dashboard/settings)

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
