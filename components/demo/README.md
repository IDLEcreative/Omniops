**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Demo Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Demo Pages](/home/user/Omniops/app/demo), [Landing Page](/home/user/Omniops/components/landing/README.md), [UI Components](/home/user/Omniops/components/ui/README.md)
**Estimated Read Time:** 2 minutes

## Purpose

Demo generation and preview components that create interactive previews for potential customers, including URL input, real-time scraping progress, and demo chat interface.

## Quick Links

- [Main Components Directory](/home/user/Omniops/components/README.md)
- [Landing Components](/home/user/Omniops/components/landing/README.md)
- [ChatWidget Directory](/home/user/Omniops/components/ChatWidget/README.md)

---

## Keywords

demo generation, website scraping, progress tracking, preview, interactive demo

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
