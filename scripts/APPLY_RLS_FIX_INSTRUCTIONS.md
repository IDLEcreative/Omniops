# RLS Performance Optimization Instructions

## Manual Application Steps

Since we're having connectivity issues, you can apply these optimizations manually through the Supabase Dashboard.

### Step 1: Access SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project (birugqyuqhiahxvxeyqg)
3. Navigate to **SQL Editor** in the left sidebar

### Step 2: Apply the Migration
1. Copy the entire contents of `/migrations/20250830_fix_rls_performance.sql`
2. Paste it into the SQL Editor
3. Click **Run** to execute all statements

### What This Migration Does

`★ Insight ─────────────────────────────────────`
1. **Wraps auth functions in SELECT**: Prevents re-evaluation for each row (O(n) → O(1))
2. **Consolidates duplicate policies**: Reduces redundant permission checks
3. **Removes duplicate indexes**: Improves write performance and reduces storage
`─────────────────────────────────────────────────`

### Expected Improvements

After applying these optimizations:
- **Query Performance**: 10-100x faster for tables with many rows
- **RLS Evaluation**: Auth functions called once instead of per-row
- **Index Efficiency**: Removed duplicate index saves storage and improves writes
- **Policy Execution**: Consolidated policies reduce overhead

### Verification

After applying, run this query to verify the changes:

```sql
-- Check if policies have been optimized
SELECT 
  schemaname,
  tablename,
  policyname,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND qual LIKE '%auth.uid()%'
ORDER BY tablename, policyname;
```

The `qual` column should show `(SELECT auth.uid())` instead of just `auth.uid()`.

### Alternative: Using Supabase CLI

If you have the Supabase CLI configured properly, you can also run:

```bash
# Login to Supabase (if not already logged in)
supabase login

# Link to your project
supabase link --project-ref birugqyuqhiahxvxeyqg

# Apply the migration
supabase db push < migrations/20250830_fix_rls_performance.sql
```

### Troubleshooting

If you encounter errors:
1. Some policies might not exist (safe to ignore DROP POLICY errors)
2. Some indexes might already be optimal (safe to ignore CREATE INDEX IF NOT EXISTS)
3. The important changes are the RLS policy updates with SELECT wrappers

### Performance Testing

After applying, test the performance improvement:

```sql
-- Before optimization (example)
EXPLAIN ANALYZE 
SELECT * FROM public.domains 
WHERE user_id = auth.uid();

-- After optimization should show significantly lower execution time
```

The query plan should show the auth.uid() being evaluated once as an InitPlan rather than per row.