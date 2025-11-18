**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# ChatWidget Directory

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [ChatWidget.tsx](/home/user/Omniops/components/ChatWidget.tsx), [Embed](/home/user/Omniops/app/embed), [UI Components](/home/user/Omniops/components/ui/README.md)
**Estimated Read Time:** 2 minutes

## Purpose

Core chat widget component architecture using a modular approach that breaks down the monolithic ChatWidget into focused, reusable components.

## Quick Links

- [Main Components Directory](/home/user/Omniops/components/README.md)
- [Chat Components](/home/user/Omniops/components/chat/README.md)
- [UI Components](/home/user/Omniops/components/ui/README.md)

---

## Keywords

chat widget, modular components, embeddable widget, privacy banner, message list, input area

## Overview

Contains the modular components that make up the embeddable chat widget. This directory breaks down the monolithic ChatWidget into focused, reusable components.

## Files

- **[index.ts](index.ts)** - Main exports and component composition
- **[Header.tsx](Header.tsx)** - Widget header with title and controls
- **[MessageList.tsx](MessageList.tsx)** - Scrollable message display area
- **[InputArea.tsx](InputArea.tsx)** - Message input field and send button
- **[PrivacyBanner.tsx](PrivacyBanner.tsx)** - GDPR-compliant privacy notice
- **[hooks/](hooks/)** - Custom hooks for widget state management

## Usage

```typescript
import { ChatWidget } from '@/components/ChatWidget';

<ChatWidget
  config={widgetConfig}
  initialOpen={false}
  privacySettings={{ requireConsent: true }}
/>
```

## Component Structure

```
ChatWidget (Main)
├── Header
│   ├── Title
│   ├── Minimize Button
│   └── Close Button
├── PrivacyBanner
│   └── Consent Actions
├── MessageList
│   └── Messages[]
└── InputArea
    ├── TextArea
    └── Send Button
```
