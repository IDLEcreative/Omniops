# Database NULL ID Fixes Documentation

## Issues Identified and Fixed

### 1. ✅ NULL domain_id Issue (FIXED)

**Problem:**
- 100% of conversations (1,865 records) had NULL domain_id
- 3 scraped pages had NULL domain_id
- Broke multi-tenancy and domain isolation

**Root Cause:**
- Chat API wasn't setting domain_id when creating conversations
- Domain was stored in metadata but not in the proper field

**Fix Applied:**
1. Updated `/app/api/chat/route.ts` to lookup and set domain_id
2. Migrated existing conversations to have proper domain_id
3. Deleted orphaned scraped pages
4. Added NOT NULL constraints to prevent future issues

**Files Changed:**
- `/app/api/chat/route.ts` - Added domain_id lookup and setting

**Database Changes:**
- Migration: `add_domain_id_not_null_constraints`
- Constraints added to conversations and scraped_pages tables

---

### 2. ✅ NULL customer_id Issue (FIXED)

**Problem:**
- 100% of conversations (1,865 records) had NULL customer_id
- Users couldn't see their chat history when logged in
- No personalization or user continuity

**Root Cause:**
- Chat API never checked for authenticated users
- No link between auth.users and conversations

**Fix Applied:**
1. Updated `/app/api/chat/route.ts` to check for authenticated users
2. Now sets customer_id when user is logged in
3. Anonymous users still work (customer_id remains null)

**Files Changed:**
- `/app/api/chat/route.ts` - Added user authentication check

**Code Added:**
```typescript
// Get authenticated user if available
let customerId: string | null = null;
try {
  const userSupabase = await createClient();
  const { data: { user } } = await userSupabase.auth.getUser();
  customerId = user?.id || null;
} catch (error) {
  // User not authenticated, continue without customer_id
}
```

---

## Testing Instructions

### Test Domain ID Fix:
```bash
# This should fail (constraint enforced)
INSERT INTO conversations (session_id) 
VALUES ('test-session');
```

### Test Customer ID Fix:
1. Log in as a user
2. Start a chat conversation
3. Check database: conversation should have customer_id set
4. Log out and chat: conversation should have NULL customer_id

---

## Future Improvements

### For Customer/User Linking:
1. **Chat History Page**: Create a user dashboard showing their chat history
2. **Conversation Claiming**: Allow users to claim anonymous sessions
3. **RLS Policies**: Add Row Level Security so users only see their own chats
4. **User Preferences**: Store user preferences linked to customer_id

### For Data Integrity:
1. **Foreign Key Indexes**: Ensure all foreign keys are indexed
2. **Cascade Rules**: Review cascade delete rules
3. **Data Validation**: Add database-level CHECK constraints
4. **Monitoring**: Set up alerts for NULL values in critical fields

---

## Database Health Check Query

Run this to verify all fixes are working:

```sql
-- Check for NULL issues
SELECT 
  'conversations.domain_id' as field,
  COUNT(*) FILTER (WHERE domain_id IS NULL) as null_count
FROM conversations
UNION ALL
SELECT 
  'conversations.customer_id' as field,
  COUNT(*) FILTER (WHERE customer_id IS NULL) as null_count  
FROM conversations
UNION ALL
SELECT 
  'scraped_pages.domain_id' as field,
  COUNT(*) FILTER (WHERE domain_id IS NULL) as null_count
FROM scraped_pages;
```

Expected result: 
- conversations.domain_id: 0
- conversations.customer_id: Will vary (NULL for anonymous users)
- scraped_pages.domain_id: 0