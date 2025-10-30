# Queries Directory

**Purpose:** Reusable database query functions for dashboard and analytics
**Last Updated:** 2025-10-30
**Related:** [Analytics](/lib/analytics), [Dashboard](/app/dashboard)

## Overview

Contains optimized database queries for dashboard statistics and reporting.

## Files

- **[dashboard-stats.ts](dashboard-stats.ts)** - Dashboard statistics queries (conversations, messages, metrics)

## Usage

```typescript
import { getDashboardStats } from '@/lib/queries/dashboard-stats';

const stats = await getDashboardStats({
  customerId: 'customer-id',
  dateRange: { start: '2024-01-01', end: '2024-12-31' }
});
```

## Features

- Optimized SQL queries
- Aggregation functions
- Time-range filtering
- Performance metrics
