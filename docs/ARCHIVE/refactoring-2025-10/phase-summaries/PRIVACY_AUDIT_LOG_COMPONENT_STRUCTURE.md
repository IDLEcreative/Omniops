# Privacy Audit Log Component Structure

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                     PrivacyAuditLog.tsx                         │
│                         (300 LOC)                               │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              AuditLogFilters.tsx                       │   │
│  │                  (164 LOC)                             │   │
│  │  • Domain dropdown                                     │   │
│  │  • Actor dropdown                                      │   │
│  │  • Date range inputs                                   │   │
│  │  • Filter type buttons (All/Export/Delete)             │   │
│  │  • Action buttons (Sync/Export/Refresh)                │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │              AuditLogTable.tsx                         │   │
│  │                  (98 LOC)                              │   │
│  │  • Error alerts                                        │   │
│  │  • Loading state                                       │   │
│  │  • Entry list                                          │   │
│  │  │  ┌──────────────────────────────────────────┐      │   │
│  │  │  │      AuditLogRow.tsx                     │      │   │
│  │  │  │        (59 LOC)                          │      │   │
│  │  │  │  • Entry badges (type, status)           │      │   │
│  │  │  │  • Entry metadata                        │      │   │
│  │  │  │  • Actor/domain info                     │      │   │
│  │  │  │  • Deleted count                         │      │   │
│  │  │  └──────────────────────────────────────────┘      │   │
│  │  • Pagination controls                                 │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         Additional Cards (in same file)                │   │
│  │  • Data Subject Requests                               │   │
│  │  • Security Alerts                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │         AuditDetailModal (external)                    │   │
│  │  • Full entry details                                  │   │
│  └────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

```
┌─────────────────┐
│  User Actions   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│  PrivacyAuditLog.tsx    │
│  • State management     │
│  • API calls            │
│  • Event handlers       │
└────────┬────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌────────────────┐    ┌────────────────┐
│ AuditLogFilters│    │ AuditLogTable  │
│ • Filters      │    │ • Display      │
│ • Controls     │    │ • Pagination   │
└────────────────┘    └────────┬───────┘
                               │
                               ▼
                      ┌────────────────┐
                      │  AuditLogRow   │
                      │  • Entry UI    │
                      └────────────────┘
```

## Props Flow

### AuditLogFilters Props
```typescript
{
  auditDomain: string;
  auditActor: string;
  auditStartDate: string;
  auditEndDate: string;
  auditFilter: AuditFilterType;
  availableAuditDomains: string[];
  availableAuditActors: string[];
  auditOptionsLoading: boolean;
  auditExportLoading: boolean;
  auditLoading: boolean;
  onDomainChange: (domain: string) => void;
  onActorChange: (actor: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onFilterChange: (filter: AuditFilterType) => void;
  onSyncFilters: () => void;
  onExport: () => void;
  onRefresh: () => void;
}
```

### AuditLogTable Props
```typescript
{
  auditEntries: AuditEntry[];
  auditCount: number;
  auditPage: number;
  auditLoading: boolean;
  auditError: string | null;
  auditOptionsError: string | null;
  auditExportError: string | null;
  onPageChange: (page: number) => void;
  onEntryClick: (entry: AuditEntry) => void;
}
```

### AuditLogRow Props
```typescript
{
  entry: AuditEntry;
  onClick: () => void;
}
```

## State Management

All state is managed in `PrivacyAuditLog.tsx`:

```typescript
// Modal state
selectedAuditEntry: AuditEntry | null
isModalOpen: boolean

// Data state
auditEntries: AuditEntry[]
auditCount: number

// Loading states
auditLoading: boolean
auditOptionsLoading: boolean
auditExportLoading: boolean

// Error states
auditError: string | null
auditOptionsError: string | null
auditExportError: string | null

// Filter state
auditFilter: AuditFilterType
auditDomain: string
auditActor: string
auditStartDate: string
auditEndDate: string
auditPage: number

// Available options
availableAuditDomains: string[]
availableAuditActors: string[]
```

## API Calls (all in PrivacyAuditLog.tsx)

1. **fetchAuditLog()** - GET `/api/gdpr/audit`
   - Fetches paginated audit entries
   - Applies all active filters
   - Updates `auditEntries` and `auditCount`

2. **fetchAuditOptions()** - GET `/api/gdpr/audit/options`
   - Fetches available domains and actors
   - Updates `availableAuditDomains` and `availableAuditActors`

3. **handleAuditExport()** - GET `/api/gdpr/audit?format=csv`
   - Exports audit log as CSV
   - Downloads file to user's system
   - Limited to 5000 entries

## File Sizes

```
AuditLogRow.tsx        59 LOC (smallest, presentation only)
AuditLogTable.tsx      98 LOC (display + pagination)
AuditLogFilters.tsx   164 LOC (many filter controls)
PrivacyAuditLog.tsx   300 LOC (orchestration + API + state)
────────────────────────────
Total                 621 LOC
```

## Benefits of This Structure

1. **Single Responsibility**
   - Each component has one clear purpose
   - Easy to understand and modify

2. **Testability**
   - Components can be tested in isolation
   - Mock props easily for unit tests

3. **Reusability**
   - `AuditLogRow` can be used elsewhere
   - Filter pattern applicable to other pages

4. **Maintainability**
   - Changes localized to specific components
   - No component exceeds 300 LOC limit

5. **Performance**
   - Smaller components easier to optimize
   - Can memoize individual pieces

6. **Developer Experience**
   - Less cognitive load per file
   - Clear component boundaries
   - TypeScript autocomplete works better
