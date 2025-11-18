**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Alerts Directory

**Type:** Service
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Monitoring](/home/user/Omniops/lib/monitoring)
**Estimated Read Time:** 1 minute

## Purpose

Notification system for alerting users and administrators about important events via multiple channels (email, in-app notifications).

## Keywords
- Alerts, Notifications, Email, In-App, Event System

---

## Overview

Contains notification utilities for sending alerts via various channels (email, in-app, etc.).

## Files

- **[notify.ts](notify.ts)** - Core notification system with multi-channel support

## Usage

```typescript
import { sendNotification } from '@/lib/alerts/notify';

await sendNotification({
  type: 'error',
  message: 'System alert',
  channel: 'email',
  recipients: ['admin@example.com']
});
```

## Dependencies

- Email provider integration
- Database for notification tracking
