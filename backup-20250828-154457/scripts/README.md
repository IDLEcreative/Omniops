# Scripts Directory

Utility scripts for maintenance, migration, and development tasks.

## Available Scripts

```
scripts/
├── check-dependencies.js        # Dependency validation
└── migrate-encrypt-credentials.ts # Credential encryption migration
```

## Script Descriptions

### check-dependencies.js
Validates that all required dependencies are installed and compatible.

**Usage:**
```bash
npm run check:deps
# or directly
node scripts/check-dependencies.js
```

**Features:**
- Checks for missing dependencies
- Validates version compatibility
- Reports security vulnerabilities
- Suggests fixes for issues

### migrate-encrypt-credentials.ts
Migrates existing plaintext WooCommerce credentials to encrypted format.

**Usage:**
```bash
npm run migrate:encrypt-credentials
# or directly
tsx scripts/migrate-encrypt-credentials.ts
```

**Features:**
- One-time migration script
- Encrypts all customer credentials
- Backs up original data
- Validates encryption success
- Safe to run multiple times (idempotent)

## Creating New Scripts

### Script Template
```javascript
#!/usr/bin/env node

/**
 * Script: script-name
 * Purpose: What this script does
 * Usage: npm run script-name
 */

const main = async () => {
  try {
    console.log('Starting script...');
    
    // Script logic here
    
    console.log('Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { main };
```

### TypeScript Scripts
For TypeScript scripts, use `.ts` extension and run with `tsx`:

```typescript
#!/usr/bin/env tsx

import { config } from 'dotenv';
config();

async function main() {
  // TypeScript code here
}

main().catch(console.error);
```

## Common Script Tasks

### Database Operations
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Perform database operations
const { data, error } = await supabase
  .from('table')
  .select('*');
```

### File System Operations
```javascript
const fs = require('fs').promises;
const path = require('path');

// Read/write files
const data = await fs.readFile('file.json', 'utf8');
await fs.writeFile('output.json', JSON.stringify(result));
```

### Environment Variables
```javascript
require('dotenv').config({ path: '.env.local' });

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error('OPENAI_API_KEY not set');
}
```

## Best Practices

1. **Error Handling**: Always use try/catch and exit codes
2. **Logging**: Provide clear progress messages
3. **Validation**: Check inputs and environment before running
4. **Idempotency**: Scripts should be safe to run multiple times
5. **Documentation**: Include usage examples in comments

## NPM Scripts Integration

Add scripts to `package.json`:

```json
{
  "scripts": {
    "script:name": "node scripts/script-name.js",
    "script:ts": "tsx scripts/script-name.ts"
  }
}
```

## Environment Setup

Scripts typically need environment variables:

```bash
# Copy environment file
cp .env.example .env.local

# Run script with environment
node -r dotenv/config scripts/script.js
```

## Testing Scripts

Create test files for complex scripts:

```javascript
// scripts/__tests__/script-name.test.js
const { main } = require('../script-name');

describe('Script Name', () => {
  it('should complete successfully', async () => {
    const result = await main();
    expect(result).toBe(expected);
  });
});
```

## Scheduling Scripts

For recurring tasks, use cron jobs:

```bash
# Run daily at 2 AM
0 2 * * * cd /path/to/project && npm run script:cleanup

# Run every hour
0 * * * * cd /path/to/project && npm run script:sync
```

## Security Notes

- Never commit scripts with hardcoded credentials
- Use environment variables for sensitive data
- Validate all inputs to prevent injection
- Log operations for audit trail
- Test in development before production