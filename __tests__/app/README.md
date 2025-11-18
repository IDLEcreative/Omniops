**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# App Tests Directory

**Type:** Test Documentation
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Estimated Read Time:** 1 minute

**Purpose:** Tests for Next.js page components and app-level routing.

**Test Type:** Integration | Page Component

**Coverage:** Page component rendering, routing, layouts, and app-level functionality.

## Overview

App tests validate Next.js pages and app router components.

## Test Structure

```
__tests__/app/
├── chat/
│   └── page.test.tsx        # Chat page tests
└── dashboard/
    └── telemetry/
        └── page.test.tsx    # Telemetry dashboard tests
```

## Running Tests

```bash
# Run app tests
npm test -- __tests__/app/

# Run specific page test
npm test -- chat/page.test.tsx
```

## Key Test Areas

- Page component rendering
- Server/client component interaction
- Route navigation
- Layout composition
- Metadata generation

## Related Documentation

- [Main Tests README](/Users/jamesguy/Omniops/__tests__/README.md)
- [Component Tests](/Users/jamesguy/Omniops/__tests__/components/README.md)
