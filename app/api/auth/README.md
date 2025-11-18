**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Authentication API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [Customer API](/home/user/Omniops/app/api/customer/README.md), [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Estimated Read Time:** 14 minutes

## Purpose

This document provides comprehensive technical reference for authentication services including Supabase Auth integration, customer verification, JWT token management, and multi-tenant user session handling with role-based access control.

## Quick Links

- [Customer Management API](/home/user/Omniops/app/api/customer/README.md)
- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Dashboard Authentication](/home/user/Omniops/app/dashboard/README.md)
- [Privacy Endpoints](/home/user/Omniops/app/api/privacy/README.md)

## Keywords

**Primary**: authentication, Supabase Auth, customer management, JWT tokens, session management, user verification
**Aliases**: auth API, user authentication, customer auth, access control
**Related**: customer verification, domain isolation, role-based access, multi-tenancy, feature gating

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [GET /api/auth/customer](#get-apiauthcustomer)
  - [POST /api/auth/login (Handled by Supabase)](#post-apiauthlogin-handled-by-supabase)
  - [POST /api/auth/signup (Handled by Supabase)](#post-apiauthsignup-handled-by-supabase)
  - [POST /api/auth/logout (Handled by Supabase)](#post-apiauthlogout-handled-by-supabase)
- [Features](#features)
- [Authentication Flow](#authentication-flow)
- [Security Features](#security-features)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Customer Data Model](#customer-data-model)
- [Integration](#integration)
- [Performance](#performance)
- [Security Best Practices](#security-best-practices)
- [Multi-tenancy](#multi-tenancy)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [Related Endpoints](#related-endpoints)
- [Migration and Updates](#migration-and-updates)

---

User authentication and customer management endpoints for secure access control and user session management.

## Overview

This API provides authentication services including customer verification, session management, and user account operations. Built on Supabase Auth with additional customer management features for multi-tenant applications.

## Endpoints

### GET `/api/auth/customer`

Retrieve authenticated customer information and account details.

#### Authentication
- **Type**: Supabase Auth (required)
- **Headers**: Authorization header with valid JWT token
- **Session**: Active user session required

#### Request Format
```bash
# Headers required
Authorization: Bearer <supabase_jwt_token>
```

#### Response Format

```json
{
  "customer": {
    "id": "cust_abc123",
    "auth_user_id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "customer@example.com",
    "domain": "example.com",
    "company_name": "Example Corp",
    "created_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-17T09:15:00.000Z",
    "subscription_status": "active",
    "features": {
      "woocommerce": true,
      "advanced_analytics": true,
      "priority_support": false
    }
  }
}
```

### POST `/api/auth/login` *(Handled by Supabase)*

User authentication via Supabase Auth.

### POST `/api/auth/signup` *(Handled by Supabase)*

New user registration via Supabase Auth.

### POST `/api/auth/logout` *(Handled by Supabase)*

User session termination via Supabase Auth.

## Features

### Customer Management
- **Account Information**: Complete customer profile data
- **Domain Association**: Link customers to their domains
- **Feature Access**: Control feature availability per customer
- **Subscription Management**: Track subscription status and limits

### Session Management
- **JWT Tokens**: Secure token-based authentication
- **Session Validation**: Automatic token validation and refresh
- **Multi-device Support**: Concurrent session management
- **Secure Logout**: Complete session termination

### User Verification
- **Identity Validation**: Verify user identity for secure operations
- **Customer Linking**: Link Supabase users to customer records
- **Permission Checking**: Validate user permissions for operations
- **Domain Verification**: Ensure users can access specific domains

## Authentication Flow

### Standard Authentication
1. **User Login**: Via Supabase Auth (`/auth/login`)
2. **Token Validation**: JWT token validation on each request
3. **Customer Lookup**: Map auth user to customer record
4. **Permission Check**: Validate access to requested resources
5. **Response**: Return customer data or error

### Customer Association
```sql
-- Customer-to-Auth User relationship
SELECT c.* FROM customers c 
WHERE c.auth_user_id = :authenticated_user_id
```

## Security Features

### Token Management
- **JWT Validation**: Automatic token validation via Supabase
- **Token Refresh**: Automatic token refresh handling
- **Secure Storage**: Secure token storage recommendations
- **Expiration Handling**: Automatic expired token handling

### Access Control
- **Role-Based Access**: Customer-level permission management
- **Domain Isolation**: Ensure users only access their domains
- **Feature Gating**: Control access to premium features
- **Audit Logging**: Log all authentication events

### Data Protection
- **Encrypted Storage**: Customer data encrypted at rest
- **Secure Transmission**: HTTPS-only API communication
- **Privacy Compliance**: GDPR and privacy law compliance
- **Data Minimization**: Only necessary data collection

## Examples

### Get Customer Information
```bash
curl -X GET 'http://localhost:3000/api/auth/customer' \
  -H 'Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...'
```

### Login via Supabase (Frontend)
```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'customer@example.com',
  password: 'secure-password'
})

// Get customer data
const token = data.session?.access_token
const response = await fetch('/api/auth/customer', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
```

### Customer Verification
```bash
# After authentication, verify customer access
curl -X GET 'http://localhost:3000/api/auth/customer' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json'
```

## Error Handling

### Authentication Errors
```json
// Missing or invalid token
{
  "error": "Unauthorized"
}

// Customer not found
{
  "error": "Customer not found"
}

// Database connection error
{
  "error": "Failed to initialize Supabase client"
}

// Invalid session
{
  "error": "Invalid or expired session"
}
```

### Error Codes
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid auth but insufficient permissions
- **404 Not Found**: Customer record not found
- **500 Internal Error**: Database or system error

## Customer Data Model

### Customer Record
```typescript
interface Customer {
  id: string                    // Unique customer identifier
  auth_user_id: string         // Supabase Auth user ID
  email: string                // Customer email address
  domain: string               // Primary customer domain
  company_name?: string        // Company name
  created_at: string           // Account creation timestamp
  updated_at: string           // Last update timestamp
  subscription_status: string  // active, inactive, suspended
  features: {                  // Feature access flags
    woocommerce: boolean
    advanced_analytics: boolean
    priority_support: boolean
    custom_branding: boolean
  }
  metadata?: Record<string, any> // Additional customer data
}
```

### Database Schema
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID REFERENCES auth.users(id) UNIQUE,
  email TEXT NOT NULL,
  domain TEXT,
  company_name TEXT,
  subscription_status TEXT DEFAULT 'active',
  features JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Integration

### With Supabase Auth
- **User Registration**: Automatic customer record creation
- **Login Events**: Customer data retrieval on login
- **Session Management**: Token validation and refresh
- **Profile Updates**: Sync auth profile with customer data

### With Other APIs
- **Domain Verification**: Customer domain validation for API access
- **Feature Gating**: Control access to premium API features
- **Usage Tracking**: Track API usage per customer
- **Billing Integration**: Connect usage to billing systems

### With Frontend Applications
- **Protected Routes**: Secure route access based on authentication
- **User Context**: Provide customer information to React components
- **Permission Checks**: Validate feature access in UI
- **Auto-logout**: Handle expired sessions gracefully

## Performance

### Response Times
- **Customer Lookup**: 50-150ms typical response time
- **Token Validation**: 20-50ms via Supabase
- **Database Queries**: Optimized with proper indexing
- **Caching Strategy**: Customer data caching for performance

### Optimization
- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Indexed customer lookups
- **Caching Layer**: Redis caching for frequently accessed data
- **CDN Integration**: Static asset delivery optimization

## Security Best Practices

### Token Handling
- **Secure Storage**: Store tokens in httpOnly cookies or secure storage
- **Token Rotation**: Implement automatic token refresh
- **Logout Cleanup**: Clear all tokens on logout
- **Cross-domain Security**: Proper CORS configuration

### Session Security
- **Session Timeout**: Implement reasonable session timeouts
- **Concurrent Sessions**: Monitor and limit concurrent sessions
- **Device Tracking**: Track login devices for security
- **Suspicious Activity**: Detect and respond to unusual patterns

### Data Security
- **Encryption**: Encrypt sensitive customer data
- **Access Logging**: Log all customer data access
- **Data Minimization**: Only collect necessary customer information
- **Regular Audits**: Periodic security audits and assessments

## Multi-tenancy

### Domain Isolation
- **Customer Domains**: Each customer associated with specific domains
- **Data Separation**: Ensure customers only access their data
- **Configuration Isolation**: Separate configurations per customer
- **Resource Allocation**: Fair resource sharing across customers

### Tenant Management
- **Tenant Identification**: Automatic tenant identification via domains
- **Resource Limits**: Per-tenant resource and usage limits
- **Feature Flags**: Tenant-specific feature enablement
- **Billing Separation**: Separate billing and usage tracking

## Monitoring and Analytics

### Authentication Metrics
```json
{
  "login_success_rate": 98.5,
  "average_session_duration": "45 minutes",
  "daily_active_users": 1250,
  "authentication_errors": 15,
  "token_refresh_rate": 95.2
}
```

### Security Monitoring
- **Failed Login Attempts**: Track and alert on suspicious activity
- **Token Abuse**: Monitor for token misuse or sharing
- **Session Anomalies**: Detect unusual session patterns
- **Geographic Analysis**: Monitor login locations for security

## Testing

### Authentication Testing
```bash
# Test valid authentication
curl -X GET 'http://localhost:3000/api/auth/customer' \
  -H 'Authorization: Bearer valid_token_here'

# Test invalid authentication
curl -X GET 'http://localhost:3000/api/auth/customer' \
  -H 'Authorization: Bearer invalid_token'

# Test missing authentication
curl -X GET 'http://localhost:3000/api/auth/customer'
```

### Integration Testing
- **End-to-end Authentication**: Full login to API access flow
- **Token Lifecycle**: Test token creation, validation, and expiration
- **Customer Association**: Verify proper customer-to-user linking
- **Permission Validation**: Test feature access controls

## Troubleshooting

### Common Issues
- **Customer Not Found**: Verify customer record exists and is linked to auth user
- **Invalid Tokens**: Check token format and expiration
- **Permission Denied**: Verify customer has access to requested features
- **Database Errors**: Check Supabase connection and table permissions

### Debug Information
- **Authentication Status**: Current user authentication state
- **Customer Lookup**: Customer record retrieval and association
- **Permission Matrix**: Feature access for current customer
- **Session Details**: Token validity and expiration information

## Related Endpoints

- `/api/customer/config` - Customer configuration management
- `/api/dashboard/config` - Dashboard authentication and setup
- `/api/monitoring/auth` - Authentication analytics
- `/api/privacy/*` - Privacy and data management with authentication

## Migration and Updates

### Account Migration
- **Data Import**: Import existing customer accounts
- **Authentication Migration**: Migrate from other auth systems
- **Feature Migration**: Transfer feature access and permissions
- **Billing Integration**: Connect to existing billing systems

### System Updates
- **Schema Updates**: Handle customer table schema changes
- **Feature Rollouts**: Gradual feature enablement for customers
- **Security Updates**: Implement security patches and improvements
- **Performance Optimizations**: Database and query optimizations