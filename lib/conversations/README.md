**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Conversations Directory

**Purpose:** Conversation-related constants and configuration
**Last Updated:** 2025-10-30
**Related:** [Chat](/lib/chat), [Hooks](/hooks)

## Overview

Contains constants and configuration for conversation management.

## Files

- **[constants.ts](constants.ts)** - Conversation-related constants (limits, timeouts, etc.)

## Usage

```typescript
import { CONVERSATION_LIMITS } from '@/lib/conversations/constants';

const maxMessages = CONVERSATION_LIMITS.MAX_MESSAGES_PER_CONVERSATION;
```
