# MCP Executor

**Type:** Infrastructure
**Status:** Active
**Last Updated:** 2025-11-05
**Purpose:** Deno-based code execution sandbox for running AI-generated TypeScript code safely.

## Overview

The MCP Executor provides a secure sandbox for executing AI-generated TypeScript code using Deno. It includes a comprehensive 4-stage validation pipeline and strict permission controls to prevent malicious code execution.

## Features

- **4-Stage Validation Pipeline**
  - Syntax validation (balanced braces, parentheses, basic TypeScript)
  - Import validation (only `./servers/` allowed)
  - Pattern validation (blocks dangerous code patterns)
  - Full validation pipeline combining all checks

- **Deno Sandbox**
  - Minimal permissions (read-only `./servers/`, write-only `/tmp/mcp-execution/`)
  - No network access
  - No subprocess execution
  - 30-second timeout
  - 512MB memory limit

- **Context Injection**
  - Execution context available via `getContext()`
  - Customer ID, domain, conversation ID, platform info
  - Read-only context to prevent tampering

## Usage

```typescript
import { executeCode } from './executor';
import { ExecutionContext } from './types';

const context: ExecutionContext = {
  customerId: 'cust_123',
  domain: 'example.com',
  conversationId: 'conv_456',
  platform: 'woocommerce'
};

const code = `
import { searchProducts } from './servers/search/searchProducts';
const results = await searchProducts({ query: 'pumps', limit: 15 }, getContext());
console.log(JSON.stringify(results));
`;

const result = await executeCode(code, context, {
  timeout: 30000,
  memoryLimit: 512 * 1024 * 1024
});

if (result.success) {
  console.log('Result:', result.data);
  console.log('Execution time:', result.metadata.executionTime, 'ms');
} else {
  console.error('Error:', result.error);
}
```

## Validation Pipeline

### Phase 1: Syntax Validation

Checks for:
- Balanced braces `{}`
- Balanced parentheses `()`
- Invalid TypeScript syntax (e.g., `function async` instead of `async function`)

### Phase 2: Import Validation

Allows ONLY imports from:
- `./servers/`
- `../servers/`
- `@/servers/`

Blocks:
- Remote imports (`https://...`)
- npm package imports (`axios`, `lodash`, etc.)
- Imports from other paths (`./lib/`, `./app/`, etc.)

### Phase 3: Pattern Validation

Blocks dangerous patterns:
- Code injection: `eval()`, `Function()`, `new Function()`
- Subprocess execution: `child_process`, `Deno.run()`, `Deno.Command()`
- Shell commands: `.exec()`, `.spawn()`
- Permission escalation: `--allow-run`, `--allow-env`, etc.
- Process control: `process.exit()`
- Dynamic imports: `import(userInput)`

### Phase 4: Full Pipeline

Runs all validation phases and accumulates errors from each stage.

## Security

### Deno Permissions

```bash
deno run \
  --allow-read=./servers \      # Read MCP servers only
  --allow-write=/tmp/mcp-execution/ \  # Write to temp only
  --no-prompt \                 # Never prompt for permissions
  --no-remote \                 # Block remote imports
  --quiet \                     # Minimize output
  script.ts
```

### Timeout and Memory

- **Default timeout:** 30 seconds
- **Max buffer:** 10MB
- **Memory limit:** 512MB (configurable)
- **Cleanup:** Automatic temp file removal

### What's Blocked

❌ Network access
❌ Subprocess execution
❌ Environment variable access
❌ System information access
❌ Foreign function interface (FFI)
❌ Reading files outside `./servers/`
❌ Writing files outside `/tmp/mcp-execution/`

### What's Allowed

✅ Reading MCP server files (`./servers/`)
✅ Writing to temp directory (`/tmp/mcp-execution/`)
✅ Importing MCP server tools
✅ Async/await operations
✅ JSON parsing/stringification
✅ Standard TypeScript features

## API Reference

### `executeCode(code, context, options?)`

Execute TypeScript code in a Deno sandbox.

**Parameters:**
- `code: string` - TypeScript code to execute
- `context: ExecutionContext` - Execution context (customer ID, domain, etc.)
- `options?: CodeExecutionOptions` - Optional execution options

**Returns:** `Promise<ExecutionResult>`

```typescript
interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata: {
    executionTime: number;
    tokensSaved?: number;
    cached?: boolean;
  };
}
```

### Error Codes

- `VALIDATION_FAILED` - Code failed validation pipeline
- `EXECUTION_ERROR` - Error during Deno execution

## Testing

```bash
# Run all MCP tests
npm test lib/mcp

# Run validator tests only
npm test lib/mcp/__tests__/validator.test.ts

# Run executor tests only
npm test lib/mcp/__tests__/executor.test.ts

# Run with coverage
npm test -- --coverage lib/mcp
```

## Examples

### Valid Code

```typescript
// ✅ Allowed: Import from servers, safe operations
import { searchProducts } from './servers/search/searchProducts';
const results = await searchProducts({ query: 'test', limit: 10 });
console.log(JSON.stringify(results));
```

### Invalid Code

```typescript
// ❌ Blocked: eval() is dangerous
eval("malicious code");

// ❌ Blocked: npm imports not allowed
import axios from 'axios';

// ❌ Blocked: subprocess execution
import { exec } from 'child_process';

// ❌ Blocked: Deno permission escalation
Deno.run({ cmd: ["rm", "-rf", "/"] });

// ❌ Blocked: Dynamic imports
const mod = await import(userInput);
```

## Environment Setup

### Prerequisites

1. **Deno installed** (v1.37+ recommended)
   ```bash
   # macOS
   brew install deno

   # Linux
   curl -fsSL https://deno.land/install.sh | sh
   ```

2. **Set DENO_PATH** (optional)
   ```bash
   export DENO_PATH=/usr/local/bin/deno
   ```

3. **MCP Servers** must exist in `./servers/` directory

## Performance

- **Validation:** < 1ms for typical code
- **Execution:** Varies by code complexity
- **Overhead:** ~10-20ms for Deno spawn + cleanup
- **Memory:** Isolated per execution, cleaned up automatically

## Troubleshooting

### "Deno not found"

```bash
# Verify Deno is installed
which deno

# Set DENO_PATH
export DENO_PATH=/path/to/deno
```

### "Permission denied"

Check that Deno has correct permissions:
```bash
# Should only allow reading ./servers/
deno run --allow-read=./servers script.ts
```

### "Timeout exceeded"

Increase timeout in options:
```typescript
executeCode(code, context, { timeout: 60000 }); // 60 seconds
```

## Related Documentation

- [MCP Architecture](../../docs/04-ANALYSIS/ANALYSIS_MCP_CODE_EXECUTION_IMPLEMENTATION_PLAN.md)
- [Security Architecture](../../docs/01-ARCHITECTURE/ARCHITECTURE_SECURITY.md)
- [MCP Servers](../servers/README.md)

## Contributing

When adding new validation rules:

1. Add pattern to `DANGEROUS_PATTERNS` in `validator.ts`
2. Add test case to `validator.test.ts`
3. Document in this README
4. Verify with `npm test lib/mcp`

## License

Internal use only - Omniops AI customer service platform.
