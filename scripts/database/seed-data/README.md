# Database Seed Data

**Status:** Active
**Last Updated:** 2025-11-18

## Purpose

Seed data scripts populate the local development database with sample data for testing without real production data.

## Quick Start

```bash
# Create seed data
npx tsx scripts/database/seed-dev-data.ts

# Or via npm script
npm run seed:dev-data
```

## What Gets Seeded

### 1. Customer Configuration
- **Domain:** `dev.local`
- **Organization ID:** `org-dev-seed-001`
- **Widget Settings:** Sample configuration for development
- **Status:** Active

### 2. Sample Conversations
Creates 3 sample conversations for testing chat functionality:
- **Visitors:** `visitor-dev-1`, `visitor-dev-2`, `visitor-dev-3`
- **Status:** All active
- **Purpose:** Test conversation history, message retrieval

### 3. Sample Messages
Creates 6 messages (2 per conversation) simulating user-assistant interaction:
- **User Messages:** Sample questions
- **Assistant Responses:** Sample answers
- **Purpose:** Test message rendering, conversation display

## Usage Examples

### Run Seed Script
```bash
# Create dev data
npx tsx scripts/database/seed-dev-data.ts

# Expected output:
# ✅ Seed data created successfully!
# Configuration:
#   Domain: dev.local
#   Organization ID: org-dev-seed-001
#   Conversations: 3
```

### Add More Conversations
Edit `seed-dev-data.ts` loop to increase sample size:
```typescript
// Current: 3 conversations
for (let i = 1; i <= 10; i++) {  // Change to 10
  // Creates 10 conversations instead
}
```

### Reset and Reseed
The script is **idempotent** - safe to run multiple times:
```bash
# Run once
npx tsx scripts/database/seed-dev-data.ts

# Run again (updates existing data)
npx tsx scripts/database/seed-dev-data.ts

# No duplicates created, existing data updated
```

### Manual Cleanup
To clear seed data and start fresh:

```bash
# Clean specific domain
npx tsx scripts/database/test-database-cleanup.ts clean --domain=dev.local

# Clear all conversations for dev domain
npx tsx -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('conversations').delete().eq('domain', 'dev.local').then(() => console.log('Cleaned'));
"
```

## Seed Data Schema

### customer_configs
```typescript
{
  domain: 'dev.local',                    // Unique domain
  organization_id: 'org-dev-seed-001',    // Organization ID
  widget_settings: {
    title: 'Development Support',
    description: 'Development test widget',
    theme: 'light'
  },
  is_active: true,                        // Configuration is active
  created_at: '2025-11-18T...',
  updated_at: '2025-11-18T...'
}
```

### conversations
```typescript
{
  id: 'uuid',                             // Auto-generated
  domain: 'dev.local',                    // Links to customer config
  visitor_id: 'visitor-dev-1',            // Sample visitor
  organization_id: 'org-dev-seed-001',    // Organization link
  is_active: true,                        // Active conversation
  created_at: '2025-11-18T...'
}
```

### messages
```typescript
{
  id: 'uuid',                             // Auto-generated
  conversation_id: 'uuid',                // Links to conversation
  role: 'user' | 'assistant',             // Message author
  content: 'Message text',                // Message content
  created_at: '2025-11-18T...'
}
```

## Integration with Development Workflow

### Automatic Seeding (Optional)
Add to your local setup script:
```bash
#!/bin/bash
npm install
npx tsx scripts/database/seed-dev-data.ts
npm run dev
```

### Manual Seeding
Run as needed during development:
```bash
# Start dev server
npm run dev

# In another terminal, seed data
npx tsx scripts/database/seed-dev-data.ts

# Chat widget will now have sample data
```

## Extending Seed Data

### Add More Sample Data
Edit the script to include additional data:

```typescript
// Add product data
console.log('\n4. Creating sample products...')
const { error: productError } = await supabase
  .from('products')
  .insert({
    domain: SEED_DOMAIN,
    sku: 'DEV-001',
    name: 'Sample Product',
    description: 'Development test product'
  })
```

### Add User Preferences
Extend `customer_configs`:

```typescript
const config = {
  domain: SEED_DOMAIN,
  widget_settings: {
    title: 'Support',
    colors: { primary: '#2563eb' },  // Add colors
    fonts: { family: 'system' },      // Add fonts
    position: 'bottom-right'          // Add position
  }
}
```

## Best Practices

1. **Keep Seed Data Small**
   - Don't create thousands of records
   - Use realistic amounts (3-10 items)
   - Makes testing faster

2. **Brand-Agnostic**
   - Use generic names ("Development Support", "Sample Product")
   - Don't hardcode business-specific data
   - Works for any industry

3. **Idempotent**
   - Script is safe to run multiple times
   - Uses `upsert` to avoid duplicates
   - Only creates new data if needed

4. **Document New Data**
   - Add comments explaining purpose
   - Include schema for new tables
   - Update this README

## Troubleshooting

### Script Fails with Missing Credentials
```
Error: Missing Supabase credentials in .env.local
```

**Solution:** Add credentials to `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Data Not Appearing
```bash
# Check if data was inserted
npx tsx -e "
const { createClient } = require('@supabase/supabase-js');
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
client.from('customer_configs').select().eq('domain', 'dev.local').then(r => console.log(r.data));
"
```

### Want to Use Different Domain
Edit `seed-dev-data.ts`:
```typescript
const SEED_DOMAIN = 'my-test.local'  // Change this
```

## Related Documentation

- [Database Cleanup](test-database-cleanup.ts) - Clean seed data
- [Setup Guide](../docs/00-GETTING-STARTED/SETUP_GUIDE.md) - Initial setup
- [Database Schema](../docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md) - Complete schema reference
