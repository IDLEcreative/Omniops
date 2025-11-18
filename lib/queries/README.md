# Queries Directory

**Type:** Utility
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Analytics](/home/user/Omniops/lib/analytics), [Supabase](/home/user/Omniops/lib/supabase-server.ts)
**Estimated Read Time:** 1 minute

## Purpose

Reusable, optimized database query functions for dashboard statistics and reporting with efficient SQL aggregation.

## Keywords
- Database Queries, Dashboard Stats, Analytics, SQL, Optimization, Supabase

---

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
