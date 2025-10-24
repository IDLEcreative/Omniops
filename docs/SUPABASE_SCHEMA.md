# MOVED: Database Schema Documentation

> **This file has been moved to a new location**

The database schema documentation has been reorganized and moved to:

**New Location**: [`docs/01-ARCHITECTURE/database-schema.md`](01-ARCHITECTURE/database-schema.md)

## Why This Move?

1. **Better Organization**: Database schema documentation now lives in the Architecture section
2. **Version Controlled**: New documentation includes version history and verification metadata
3. **More Comprehensive**: Updated with complete schema verification from live database
4. **Enhanced Details**: Includes all 31 tables, 214 indexes, 24 foreign keys, and 53 RLS policies

## What Changed in v2.0?

The new documentation includes:
- **Complete verification** from live Supabase database (2025-10-24)
- **Multi-tenant architecture** tables (organizations, members, invitations)
- **Enhanced telemetry** (chat_telemetry with rollups)
- **Entity catalog** (brand-agnostic entity storage)
- **214 total indexes** (up from ~140 in v1.0)
- **Mermaid ER diagrams** showing relationships
- **Notable changes section** documenting all schema evolution

## Quick Links

- [Database Schema v2.0](01-ARCHITECTURE/database-schema.md)
- [Search Architecture](01-ARCHITECTURE/search-architecture.md)
- [Performance Optimization](01-ARCHITECTURE/performance-optimization.md)

---

**Last Updated**: 2025-10-24
**Redirect From**: docs/SUPABASE_SCHEMA.md
**Redirect To**: docs/01-ARCHITECTURE/database-schema.md
