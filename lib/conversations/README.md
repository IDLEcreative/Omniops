# Conversations Directory

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Chat](/home/user/Omniops/lib/chat), [Hooks](/home/user/Omniops/hooks)
**Estimated Read Time:** 1 minute

## Purpose

Conversation-related constants and configuration including limits, timeouts, and other conversation management settings.

## Overview

Contains constants and configuration for conversation management.

## Files

- **[constants.ts](constants.ts)** - Conversation-related constants (limits, timeouts, etc.)

## Usage

```typescript
import { CONVERSATION_LIMITS } from '@/lib/conversations/constants';

const maxMessages = CONVERSATION_LIMITS.MAX_MESSAGES_PER_CONVERSATION;
```
