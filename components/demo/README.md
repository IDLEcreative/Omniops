**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Demo Directory

**Purpose:** Demo generation and preview components
**Last Updated:** 2025-10-30
**Related:** [Demo Pages](/app/demo), [Landing Page](/components/landing)

## Overview

Components for the demo generation system that creates interactive previews for potential customers.

## Files

- **[DemoUrlInput.tsx](DemoUrlInput.tsx)** - URL input for demo generation
- **[ScrapingProgress.tsx](ScrapingProgress.tsx)** - Real-time scraping progress display
- **[DemoChatInterface.tsx](DemoChatInterface.tsx)** - Demo chat widget interface

## Usage

```typescript
import { DemoUrlInput } from '@/components/demo/DemoUrlInput';

<DemoUrlInput
  onSubmit={handleDemoCreate}
  loading={isGenerating}
/>
```

## Features

- Automatic website scraping
- Progress tracking
- Demo preview generation
- Share demo links
