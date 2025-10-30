# Alerts Directory

**Purpose:** Notification system for alerting users and administrators about important events
**Last Updated:** 2025-10-30
**Related:** [Lib](/lib), [Monitoring](/lib/monitoring)

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
