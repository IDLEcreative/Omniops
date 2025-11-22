# Privacy Module

**Type:** Helpers
**Status:** Active
**Last Updated:** 2025-11-22
**Verified For:** v0.1.0

## Purpose

GDPR/CCPA-compliant privacy helpers for user data export, account deletion with cooling-off period, and personal data updates.

## Module Contents

### Exports

#### `data-export.ts` (148 LOC)
Functions for exporting user data per GDPR Article 20 (Right to Data Portability):

- **`fetchUserProfile(userId: string)`** - Get user account information
- **`fetchConversations(userId: string)`** - Get all user conversations with message counts
- **`fetchMessages(userId: string)`** - Get all message content ordered by date
- **`fetchSettings(userId: string)`** - Get user preferences and settings
- **`fetchAgreements(userId: string)`** - Get terms acceptance history
- **`logDataExport(userId: string, metadata: object)`** - Log export for compliance audit

#### `account-deletion.ts` (146 LOC)
Functions for scheduled account deletion with 30-day cooling-off period per GDPR Article 17:

- **`createAccountDeletionRequest(data)`** - Schedule account deletion for 30 days ahead
- **`getPendingDeletionRequest(userId: string)`** - Get active deletion request
- **`cancelAccountDeletionRequest(userId: string)`** - Cancel pending deletion
- **`processScheduledDeletions()`** - Background job to execute due deletions
- **`hasScheduledDeletion(userId: string)`** - Check if deletion is pending
- **`getDaysUntilDeletion(userId: string)`** - Get remaining days in cooling-off period

## Quick Start

### Export User Data

```typescript
import { fetchConversations, fetchMessages, logDataExport } from '@/lib/privacy/data-export';

const conversations = await fetchConversations(userId);
const messages = await fetchMessages(userId);

await logDataExport(userId, {
  format: 'json',
  conversations_count: conversations.length,
  messages_count: messages.length,
});
```

### Request Account Deletion

```typescript
import { createAccountDeletionRequest } from '@/lib/privacy/account-deletion';

const scheduledDate = new Date();
scheduledDate.setDate(scheduledDate.getDate() + 30);

await createAccountDeletionRequest({
  user_id: userId,
  scheduled_for: scheduledDate.toISOString(),
  ip_address: clientIp,
});
```

### Cancel Scheduled Deletion

```typescript
import { cancelAccountDeletionRequest } from '@/lib/privacy/account-deletion';

await cancelAccountDeletionRequest(userId);
```

### Check Deletion Status

```typescript
import { getDaysUntilDeletion } from '@/lib/privacy/account-deletion';

const daysLeft = await getDaysUntilDeletion(userId);
console.log(`Deletion scheduled in ${daysLeft} days`);
```

## API Endpoints Using This Module

### GET `/api/privacy/export`
Export all user data as JSON. Returns:
- User profile information
- All conversations and messages
- Settings and preferences
- Terms acceptance history
- Metadata with export timestamp

### POST `/api/privacy/delete`
Request account deletion with 30-day cooling-off period. Requires:
- Valid password verification
- Explicit confirmation (`confirm: true`)

Returns:
- Scheduled deletion date
- Cancellation deadline
- Days until deletion (always 30)

### POST `/api/privacy/delete/cancel`
Cancel pending account deletion if within 30-day window.

### POST `/api/privacy/update`
Update user personal data (name, phone, company). Updates stored in auth metadata.

## Database Tables

Required for this module to function:

### `account_deletion_requests`
Stores scheduled account deletions with 30-day cooling-off period.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- scheduled_for: TIMESTAMP (when deletion will execute)
- cancelled_at: TIMESTAMP (null unless cancelled)
- completed_at: TIMESTAMP (null unless completed)
- ip_address: TEXT (audit trail)
- status: VARCHAR (pending/cancelled/completed)
- created_at: TIMESTAMP (request creation time)
```

### `data_export_logs`
Compliance audit trail for all data exports.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- exported_at: TIMESTAMP (when export was performed)
- metadata: JSONB (counts, format, etc.)
- created_at: TIMESTAMP (log creation time)
```

### `user_preferences` (optional)
Stores user settings and preferences.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- preferences: JSONB (key-value settings)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### `terms_acceptances` (optional)
Tracks terms and conditions acceptance for compliance.

```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- terms_version: VARCHAR
- accepted_at: TIMESTAMP
- ip_address: TEXT (audit trail)
- created_at: TIMESTAMP
```

## GDPR Compliance

This module implements:

- **Article 16 - Right to Rectification**: Update endpoint allows users to correct inaccurate personal data
- **Article 17 - Right to be Forgotten**: Delete endpoint with 30-day cooling-off period
- **Article 20 - Right to Data Portability**: Export endpoint provides all data in structured format
- **Audit Logging**: All operations logged with timestamps and IP addresses
- **Consent Tracking**: Terms acceptances recorded for legal proof

## Error Handling

All functions throw on database errors. API routes handle these with:
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (password invalid)
- `404`: Not found (no deletion request)
- `410`: Gone (deletion period expired)
- `409`: Conflict (deletion already scheduled)
- `503`: Service unavailable (database down)

## Testing

Comprehensive test suites:
- `__tests__/api/privacy/export.test.ts` - 8 tests
- `__tests__/api/privacy/delete.test.ts` - 12 tests
- `__tests__/api/privacy/delete-cancel.test.ts` - 10 tests
- `__tests__/api/privacy/update.test.ts` - 12 tests

Run with: `npm test -- __tests__/api/privacy`

## Architecture Notes

### Separation of Concerns
- Helpers isolated in `lib/privacy/`
- API routes delegate to helpers
- No business logic in route handlers
- Database layer abstraction

### Scalability
- No N+1 queries (batch fetches)
- Proper indexing assumed
- Efficient cascading deletes
- Pagination-ready (future enhancement)

### Security
- Password verification required
- Explicit confirmation needed
- Whitelist of updatable fields
- IP address logging
- No sensitive data in errors

## Monitoring & Observability

### Logging
- All operations logged with timestamps
- IP addresses captured for audit
- Error cases logged with context
- Structured logging in API routes

### Metrics to Track
- Export requests per day
- Deletion requests pending
- Cancellations performed
- Update requests
- Error rates by operation

## Future Enhancements

1. **ZIP Export** - Bundle multiple formats
2. **Background Jobs** - Scheduled deletion processing
3. **Email Notifications** - Reminders before deletion
4. **Audit Dashboard** - Privacy request tracking
5. **Batch Operations** - Admin bulk operations
6. **Format Varieties** - CSV, XML, PDF exports
7. **Data Retention** - Auto-delete old data
8. **Anonymization** - Alternative to deletion

## Troubleshooting

### Export Returns Empty
- Check user has conversations in database
- Verify table permissions
- Ensure user_id matches auth.users

### Deletion Request Fails
- Verify password is correct
- Check `confirm: true` is in request
- Ensure no existing pending deletion

### Cancel Fails with 410
- Deletion period expired
- Account deletion is in progress
- Must wait or contact support

## See Also

- [GDPR Privacy Documentation](../docs/PRIVACY_COMPLIANCE.md)
- [API Documentation](../docs/API_PRIVACY_ENDPOINTS.md)
- [Supabase Auth Setup](../../docs/00-GETTING-STARTED/SETUP_SUPABASE_AUTH.md)
- [Database Schema Reference](../../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)

## Version History

- **v1.0** (2025-11-22) - Initial release with export, delete, cancel, update
