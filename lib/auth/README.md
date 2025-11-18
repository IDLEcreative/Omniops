**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Authentication Logic Documentation

**Type:** Service
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Supabase](/home/user/Omniops/lib/supabase/README.md), [Encryption](/home/user/Omniops/lib/encryption.ts), [Rate Limiting](/home/user/Omniops/lib/rate-limit.ts)
**Estimated Read Time:** 5 minutes

## Purpose

Authentication utilities and helper functions that support secure user authentication, session management, and authorization throughout the application. Provides session validation, role-based access control, and security operations.

## Quick Links
- [Supabase Server Client](/home/user/Omniops/lib/supabase/server.ts)
- [Supabase Client](/home/user/Omniops/lib/supabase/client.ts)
- [Encryption Utilities](/home/user/Omniops/lib/encryption.ts)
- [Rate Limiting](/home/user/Omniops/lib/rate-limit.ts)
- [API Auth Routes](/home/user/Omniops/app/api/auth/)

## Table of Contents
- [Architecture](#architecture)
- [Core Components](#core-components)
- [Authentication Patterns](#authentication-patterns)
- [Integration with Supabase Auth](#integration-with-supabase-auth)
- [Security Features](#security-features)
- [Middleware Integration](#middleware-integration)
- [Error Handling](#error-handling)
- [Testing](#testing)
- [Security Best Practices](#security-best-practices)
- [Related Components](#related-components)
- [Contributing](#contributing)

---

## Overview

The auth directory provides:
- **Authentication Utilities**: Helper functions for user authentication
- **Session Management**: Secure session handling and validation
- **Authorization Helpers**: Role-based access control utilities
- **Security Functions**: Common security operations and validations

## Architecture

```
auth/
└── utils.ts    # Core authentication utilities and helpers
```

## Core Components

### Authentication Utils (`utils.ts`)

Core authentication utilities that provide essential security functions:

**Key Features:**
- **Session Validation**: Secure session token validation
- **User Authentication**: User credential verification helpers
- **Role Management**: Role-based access control utilities
- **Security Helpers**: Common security operations

**Core Functions:**

```typescript
// Session management
export function validateSession(token: string): Promise<SessionData | null>;
export function createSession(userId: string, metadata?: any): Promise<string>;
export function destroySession(token: string): Promise<boolean>;

// User authentication
export function verifyCredentials(email: string, password: string): Promise<User | null>;
export function hashPassword(password: string): Promise<string>;
export function comparePassword(password: string, hash: string): Promise<boolean>;

// Authorization
export function hasPermission(user: User, permission: string): boolean;
export function requireRole(user: User, role: string): boolean;
export function checkAccess(user: User, resource: string, action: string): boolean;
```

## Authentication Patterns

### 1. Session-Based Authentication
```typescript
import { validateSession, createSession } from '@/lib/auth/utils';

// Validate user session
async function authenticateRequest(request: Request): Promise<User | null> {
  const sessionToken = extractSessionToken(request);
  
  if (!sessionToken) {
    return null;
  }
  
  const sessionData = await validateSession(sessionToken);
  return sessionData?.user || null;
}

// Create new session after login
async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const user = await verifyCredentials(credentials.email, credentials.password);
  
  if (!user) {
    return { success: false, error: 'Invalid credentials' };
  }
  
  const sessionToken = await createSession(user.id, {
    loginTime: new Date(),
    userAgent: credentials.userAgent
  });
  
  return { success: true, user, sessionToken };
}
```

### 2. Role-Based Access Control
```typescript
import { hasPermission, requireRole } from '@/lib/auth/utils';

// Check user permissions
function canAccessResource(user: User, resource: string): boolean {
  return hasPermission(user, `read:${resource}`) || requireRole(user, 'admin');
}

// Middleware for protected routes
async function requireAuthentication(request: Request, requiredRole?: string) {
  const user = await authenticateRequest(request);
  
  if (!user) {
    throw new Error('Authentication required');
  }
  
  if (requiredRole && !requireRole(user, requiredRole)) {
    throw new Error('Insufficient permissions');
  }
  
  return user;
}
```

### 3. Secure Password Handling
```typescript
import { hashPassword, comparePassword } from '@/lib/auth/utils';

// Hash password before storing
async function createUser(userData: CreateUserData): Promise<User> {
  const hashedPassword = await hashPassword(userData.password);
  
  return await db.users.create({
    ...userData,
    password: hashedPassword,
    createdAt: new Date()
  });
}

// Verify password during login
async function verifyUserPassword(email: string, password: string): Promise<User | null> {
  const user = await db.users.findByEmail(email);
  
  if (!user) {
    return null;
  }
  
  const isValid = await comparePassword(password, user.password);
  return isValid ? user : null;
}
```

## Integration with Supabase Auth

### Server-Side Authentication
```typescript
import { createClient } from '@/lib/supabase/server';
import { validateSession } from '@/lib/auth/utils';

// Authenticate with Supabase
async function getAuthenticatedUser(request: Request): Promise<User | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }
  
  // Additional validation with local auth utilities
  const sessionValid = await validateSession(user.id);
  return sessionValid ? user : null;
}
```

### Client-Side Authentication
```typescript
import { createClient } from '@/lib/supabase/client';

// Login with Supabase Auth
async function signInUser(email: string, password: string): Promise<AuthResult> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, user: data.user, session: data.session };
}

// Sign out user
async function signOutUser(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
```

## Security Features

### 1. Token Validation
```typescript
interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  permissions: string[];
  createdAt: Date;
  expiresAt: Date;
}

async function validateSession(token: string): Promise<SessionData | null> {
  try {
    // Decode and verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET) as any;
    
    // Check expiration
    if (decoded.exp && Date.now() >= decoded.exp * 1000) {
      return null;
    }
    
    // Verify user still exists and is active
    const user = await db.users.findById(decoded.userId);
    if (!user || !user.isActive) {
      return null;
    }
    
    return {
      userId: decoded.userId,
      email: decoded.email,
      roles: decoded.roles || [],
      permissions: decoded.permissions || [],
      createdAt: new Date(decoded.iat * 1000),
      expiresAt: new Date(decoded.exp * 1000)
    };
  } catch (error) {
    console.error('Session validation failed:', error);
    return null;
  }
}
```

### 2. Password Security
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  // Validate password strength
  if (!isStrongPassword(password)) {
    throw new Error('Password does not meet security requirements');
  }
  
  return await bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(password: string, hash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    console.error('Password comparison failed:', error);
    return false;
  }
}

function isStrongPassword(password: string): boolean {
  // Minimum 8 characters, at least one uppercase, lowercase, number, and special char
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return strongPasswordRegex.test(password);
}
```

### 3. Permission System
```typescript
interface Permission {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'admin';
}

interface Role {
  name: string;
  permissions: Permission[];
}

function hasPermission(user: User, permission: string): boolean {
  const [action, resource] = permission.split(':');
  
  return user.permissions.some(p => 
    p.resource === resource && p.action === action
  ) || user.roles.some(role => 
    role.permissions.some(p => 
      p.resource === resource && p.action === action
    )
  );
}

function requireRole(user: User, roleName: string): boolean {
  return user.roles.some(role => role.name === roleName);
}
```

## Middleware Integration

### API Route Protection
```typescript
// Middleware for API routes
export function withAuth(handler: Function, requiredRole?: string) {
  return async (request: Request) => {
    try {
      const user = await requireAuthentication(request, requiredRole);
      
      // Add user to request context
      (request as any).user = user;
      
      return await handler(request);
    } catch (error) {
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
}

// Usage in API route
export const GET = withAuth(async (request: Request) => {
  const user = (request as any).user;
  // Handler logic with authenticated user
}, 'admin');
```

### Page-Level Protection
```typescript
// HOC for protected pages
export function withAuth<P = {}>(
  WrappedComponent: React.ComponentType<P>,
  requiredRole?: string
) {
  return function AuthComponent(props: P) {
    const { user, loading } = useAuth();
    
    if (loading) {
      return <LoadingSpinner />;
    }
    
    if (!user) {
      redirect('/login');
      return null;
    }
    
    if (requiredRole && !requireRole(user, requiredRole)) {
      return <UnauthorizedMessage />;
    }
    
    return <WrappedComponent {...props} />;
  };
}
```

## Error Handling

### Authentication Errors
```typescript
class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends Error {
  constructor(message: string, public requiredRole?: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

// Error handling in auth utilities
async function validateSession(token: string): Promise<SessionData | null> {
  try {
    // Validation logic
    return sessionData;
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AuthenticationError('Invalid token', 'INVALID_TOKEN');
    }
    if (error instanceof jwt.TokenExpiredError) {
      throw new AuthenticationError('Token expired', 'TOKEN_EXPIRED');
    }
    throw error;
  }
}
```

## Testing

### Unit Tests
```typescript
describe('Auth Utils', () => {
  describe('validateSession', () => {
    it('should validate valid session tokens', async () => {
      const token = jwt.sign({ userId: 'user-123' }, process.env.JWT_SECRET);
      const session = await validateSession(token);
      
      expect(session).not.toBeNull();
      expect(session?.userId).toBe('user-123');
    });
    
    it('should reject expired tokens', async () => {
      const expiredToken = jwt.sign(
        { userId: 'user-123', exp: Math.floor(Date.now() / 1000) - 3600 },
        process.env.JWT_SECRET
      );
      
      const session = await validateSession(expiredToken);
      expect(session).toBeNull();
    });
  });
  
  describe('hasPermission', () => {
    it('should check user permissions correctly', () => {
      const user = {
        permissions: [{ resource: 'posts', action: 'read' }],
        roles: []
      };
      
      expect(hasPermission(user, 'read:posts')).toBe(true);
      expect(hasPermission(user, 'write:posts')).toBe(false);
    });
  });
});
```

### Integration Tests
```typescript
describe('Authentication Integration', () => {
  it('should authenticate users end-to-end', async () => {
    // Create test user
    const user = await createTestUser();
    
    // Login
    const loginResult = await signInUser(user.email, 'password123');
    expect(loginResult.success).toBe(true);
    
    // Validate session
    const session = await validateSession(loginResult.sessionToken);
    expect(session?.userId).toBe(user.id);
    
    // Cleanup
    await deleteTestUser(user.id);
  });
});
```

## Security Best Practices

### 1. Token Management
```typescript
// Secure token generation
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

// Token rotation
async function rotateSessionToken(oldToken: string): Promise<string> {
  const session = await validateSession(oldToken);
  if (!session) {
    throw new AuthenticationError('Invalid session', 'INVALID_SESSION');
  }
  
  // Invalidate old token
  await destroySession(oldToken);
  
  // Create new token
  return await createSession(session.userId);
}
```

### 2. Rate Limiting
```typescript
import { checkRateLimit } from '@/lib/rate-limit';

async function rateLimit(identifier: string, action: string): Promise<void> {
  const { success } = await checkRateLimit(`auth:${action}:${identifier}`, {
    requests: 5,
    window: 60 * 1000 // 1 minute
  });
  
  if (!success) {
    throw new AuthenticationError('Too many attempts', 'RATE_LIMITED');
  }
}

// Usage in login
async function signInUser(email: string, password: string): Promise<AuthResult> {
  await rateLimit(email, 'login');
  // Rest of login logic
}
```

### 3. Session Security
```typescript
// Secure session configuration
const SESSION_CONFIG = {
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/'
};

function setSessionCookie(response: Response, token: string): void {
  response.headers.set(
    'Set-Cookie',
    `session=${token}; ${Object.entries(SESSION_CONFIG)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')}`
  );
}
```

## Related Components

- [Supabase Server Client](/home/user/Omniops/lib/supabase/server.ts) - Server-side Supabase client with auth
- [Supabase Client](/home/user/Omniops/lib/supabase/client.ts) - Client-side Supabase client with auth
- [Encryption Utilities](/home/user/Omniops/lib/encryption.ts) - Encryption utilities for sensitive data
- [Rate Limiting](/home/user/Omniops/lib/rate-limit.ts) - Rate limiting for auth endpoints
- [Authentication API Routes](/home/user/Omniops/app/api/auth/) - Authentication API routes

## Contributing

When working with authentication utilities:

1. **Security First**: Always prioritize security over convenience
2. **Test Thoroughly**: Write comprehensive tests for all auth functions
3. **Follow Standards**: Use established security patterns and libraries
4. **Document Security**: Clearly document security considerations
5. **Review Carefully**: Authentication code requires careful code review
6. **Monitor Usage**: Implement logging and monitoring for auth events

The auth utilities are critical for application security and must be implemented with the highest standards for reliability and security.