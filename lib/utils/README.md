**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Utility Functions Documentation

This directory contains utility functions and helper modules that provide common functionality across the application. These utilities handle validation, formatting, security, and other cross-cutting concerns.

## Overview

The utils directory provides:
- **Domain Validation**: Comprehensive domain and URL validation
- **Security Utilities**: Input sanitization and security checks
- **Formatting Helpers**: Data transformation and formatting functions
- **Common Utilities**: Shared functionality used throughout the application

## Architecture

```
utils/
├── domain-validator.ts    # Comprehensive domain validation and security
└── [additional utilities will be added here]
```

## Core Components

### Domain Validator (`domain-validator.ts`)

A comprehensive domain validation system with security features and intelligent domain analysis:

**Key Features:**
- **Multi-Level Validation**: URL parsing, domain extraction, and format validation
- **Security Checks**: Malicious domain detection and blacklisting
- **Subdomain Analysis**: Intelligent subdomain handling and validation
- **Performance Optimized**: Efficient validation with minimal overhead
- **Extensive Testing**: Robust validation for edge cases

**Core Functions:**

#### `isValidDomain(domain: string): boolean`
Validates if a string is a properly formatted domain:
```typescript
import { isValidDomain } from '@/lib/utils/domain-validator';

// Valid domains
isValidDomain('example.com')        // true
isValidDomain('subdomain.example.com') // true
isValidDomain('api-v2.example.co.uk')  // true

// Invalid domains
isValidDomain('invalid..domain')    // false
isValidDomain('space domain.com')   // false
isValidDomain('')                   // false
```

#### `extractDomain(url: string): string | null`
Extracts domain from URL with comprehensive error handling:
```typescript
import { extractDomain } from '@/lib/utils/domain-validator';

extractDomain('https://www.example.com/path')    // 'example.com'
extractDomain('https://api.subdomain.example.com') // 'subdomain.example.com'
extractDomain('invalid-url')                     // null
```

#### `normalizeUrl(url: string): string`
Normalizes URLs to a consistent format:
```typescript
import { normalizeUrl } from '@/lib/utils/domain-validator';

normalizeUrl('example.com')                    // 'https://example.com'
normalizeUrl('http://www.example.com/')        // 'https://www.example.com'
normalizeUrl('HTTPS://Example.COM/Path')       // 'https://example.com/path'
```

#### `validateAndNormalizeDomain(input: string): ValidationResult`
Comprehensive validation with detailed results:
```typescript
import { validateAndNormalizeDomain } from '@/lib/utils/domain-validator';

const result = validateAndNormalizeDomain('www.example.com');
// Returns:
{
  isValid: true,
  domain: 'example.com',
  normalizedUrl: 'https://example.com',
  subdomain: 'www',
  isSubdomain: true,
  errors: []
}
```

#### Security Features

**Malicious Domain Detection:**
```typescript
const result = validateAndNormalizeDomain('malicious-site.com');
if (result.isMalicious) {
  throw new Error('Domain flagged as potentially malicious');
}
```

**Input Sanitization:**
```typescript
// Automatically handles:
// - XSS attempts in URLs
// - SQL injection patterns
// - Path traversal attempts
// - Protocol confusion attacks
```

## Validation Patterns

### 1. Domain Format Validation
```typescript
// Validates proper domain structure
const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isValidDomainFormat(domain: string): boolean {
  if (!domain || domain.length > 253) return false;
  return domainRegex.test(domain);
}
```

### 2. URL Parsing and Validation
```typescript
function parseAndValidateUrl(input: string): ParsedUrl | null {
  try {
    const url = new URL(input.startsWith('http') ? input : `https://${input}`);
    
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null;
    }
    
    return {
      protocol: url.protocol,
      hostname: url.hostname,
      pathname: url.pathname,
      search: url.search
    };
  } catch {
    return null;
  }
}
```

### 3. Security Validation
```typescript
function checkSecurity(domain: string): SecurityCheck {
  const checks = {
    isBlacklisted: checkBlacklist(domain),
    hasSuspiciousPattern: checkSuspiciousPatterns(domain),
    isKnownMalicious: checkMaliciousDatabase(domain),
    hasValidTLD: checkValidTLD(domain)
  };
  
  return {
    isSafe: Object.values(checks).every(check => !check),
    checks
  };
}
```

## Error Handling

### Validation Errors
```typescript
interface ValidationError {
  code: string;
  message: string;
  field?: string;
}

interface ValidationResult {
  isValid: boolean;
  domain?: string;
  normalizedUrl?: string;
  errors: ValidationError[];
}
```

### Common Error Codes
- `INVALID_FORMAT`: Domain format is invalid
- `EMPTY_INPUT`: No input provided
- `PROTOCOL_ERROR`: Invalid or unsupported protocol
- `MALICIOUS_DOMAIN`: Domain flagged as malicious
- `PARSING_ERROR`: Unable to parse URL
- `SECURITY_VIOLATION`: Security check failed

## Performance Optimizations

### 1. Caching
```typescript
class DomainValidator {
  private validationCache = new Map<string, ValidationResult>();
  private cacheMaxSize = 1000;
  
  validateWithCache(domain: string): ValidationResult {
    if (this.validationCache.has(domain)) {
      return this.validationCache.get(domain)!;
    }
    
    const result = this.performValidation(domain);
    
    if (this.validationCache.size >= this.cacheMaxSize) {
      // LRU eviction
      const firstKey = this.validationCache.keys().next().value;
      this.validationCache.delete(firstKey);
    }
    
    this.validationCache.set(domain, result);
    return result;
  }
}
```

### 2. Batch Validation
```typescript
async function validateDomainsBatch(domains: string[]): Promise<ValidationResult[]> {
  const results = await Promise.all(
    domains.map(domain => validateAndNormalizeDomain(domain))
  );
  return results;
}
```

## Testing

### Unit Tests
```typescript
describe('Domain Validator', () => {
  describe('isValidDomain', () => {
    it('should validate correct domains', () => {
      expect(isValidDomain('example.com')).toBe(true);
      expect(isValidDomain('subdomain.example.com')).toBe(true);
      expect(isValidDomain('api-v2.example.co.uk')).toBe(true);
    });
    
    it('should reject invalid domains', () => {
      expect(isValidDomain('')).toBe(false);
      expect(isValidDomain('invalid..domain')).toBe(false);
      expect(isValidDomain('space domain.com')).toBe(false);
    });
  });
  
  describe('extractDomain', () => {
    it('should extract domain from URLs', () => {
      expect(extractDomain('https://www.example.com/path')).toBe('example.com');
      expect(extractDomain('https://api.example.com')).toBe('api.example.com');
    });
    
    it('should return null for invalid URLs', () => {
      expect(extractDomain('invalid-url')).toBe(null);
      expect(extractDomain('')).toBe(null);
    });
  });
});
```

### Edge Cases Covered
- Empty strings and null inputs
- Extremely long domains
- Unicode domains (IDN)
- IP addresses as domains
- Localhost and development domains
- Subdomain edge cases
- Protocol variations
- Port numbers in URLs

## Security Considerations

### 1. Input Sanitization
```typescript
function sanitizeInput(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/[<>'"]/g, '') // Remove potential XSS characters
    .replace(/\s+/g, ''); // Remove all whitespace
}
```

### 2. Blacklist Management
```typescript
const BLACKLISTED_DOMAINS = new Set([
  'malicious-site.com',
  'phishing-example.net',
  // ... other known malicious domains
]);

function isBlacklisted(domain: string): boolean {
  return BLACKLISTED_DOMAINS.has(domain.toLowerCase());
}
```

### 3. Rate Limiting
```typescript
class DomainValidationRateLimit {
  private requests = new Map<string, number[]>();
  
  async checkRateLimit(clientId: string): Promise<boolean> {
    const now = Date.now();
    const requests = this.requests.get(clientId) || [];
    
    // Remove requests older than 1 minute
    const recentRequests = requests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= 100) {
      return false; // Rate limit exceeded
    }
    
    recentRequests.push(now);
    this.requests.set(clientId, recentRequests);
    return true;
  }
}
```

## Integration Examples

### API Route Integration
```typescript
// In API route
import { validateAndNormalizeDomain } from '@/lib/utils/domain-validator';

export async function POST(request: Request) {
  const { domain } = await request.json();
  
  const validation = validateAndNormalizeDomain(domain);
  
  if (!validation.isValid) {
    return Response.json(
      { error: 'Invalid domain', details: validation.errors },
      { status: 400 }
    );
  }
  
  // Use validation.normalizedUrl for further processing
  return Response.json({ success: true, domain: validation.domain });
}
```

### Form Validation Integration
```typescript
import { isValidDomain } from '@/lib/utils/domain-validator';

function validateForm(formData: FormData): ValidationResult {
  const domain = formData.get('domain') as string;
  
  if (!isValidDomain(domain)) {
    return {
      isValid: false,
      errors: [{ field: 'domain', message: 'Please enter a valid domain' }]
    };
  }
  
  return { isValid: true, errors: [] };
}
```

## Future Utilities

The utils directory is designed to grow with additional utility functions:

```
utils/
├── domain-validator.ts      # ✅ Implemented
├── string-utils.ts          # 🔄 Planned - String manipulation utilities
├── date-utils.ts            # 🔄 Planned - Date formatting and parsing
├── validation-utils.ts      # 🔄 Planned - General validation helpers
├── crypto-utils.ts          # 🔄 Planned - Cryptographic utilities
├── file-utils.ts            # 🔄 Planned - File handling utilities
└── format-utils.ts          # 🔄 Planned - Data formatting helpers
```

## Best Practices

### 1. Pure Functions
Write utilities as pure functions when possible:
```typescript
// ✅ Pure function - same input always produces same output
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

// ❌ Impure function - depends on external state
function getCurrentTimeString(): string {
  return new Date().toISOString(); // Depends on current time
}
```

### 2. Input Validation
Always validate inputs to utility functions:
```typescript
function slugify(text: string): string {
  if (!text || typeof text !== 'string') {
    throw new Error('Input must be a non-empty string');
  }
  
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
```

### 3. Error Handling
Provide clear error messages and handle edge cases:
```typescript
function parseJson<T>(jsonString: string): T | null {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn('Failed to parse JSON:', error.message);
    return null;
  }
}
```

## Related Components

- `/lib/config.ts` - Configuration validation and schemas
- `/lib/encryption.ts` - Security and encryption utilities
- `/lib/logger.ts` - Logging utilities
- `/lib/rate-limit.ts` - Rate limiting utilities

## Contributing

When adding new utilities:

1. **Write comprehensive tests** covering edge cases
2. **Follow TypeScript best practices** with proper type definitions
3. **Document usage examples** and API contracts
4. **Consider performance implications** for frequently used utilities
5. **Implement proper error handling** with descriptive messages
6. **Make functions pure** when possible to improve testability

The utils directory provides the foundation for reliable, reusable functionality across the entire application.