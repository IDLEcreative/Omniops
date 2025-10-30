# ChatWidget Directory

**Purpose:** Core chat widget component architecture (modular approach)
**Last Updated:** 2025-10-30
**Related:** [ChatWidget.tsx](/components/ChatWidget.tsx), [Embed](/app/embed)

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
