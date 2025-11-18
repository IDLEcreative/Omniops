**Last Updated:** 2025-11-18
**Verified Accurate For:** v0.1.0
**Status:** Active
**Type:** Reference

# Privacy API

**Type:** Reference
**Status:** Active
**Last Updated:** 2025-11-18
**Verified For:** v0.1.0
**Dependencies:** [GDPR API](/home/user/Omniops/app/api/gdpr/README.md), [Database Schema](/home/user/Omniops/docs/09-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
**Estimated Read Time:** 14 minutes

## Purpose

This document provides comprehensive technical reference for user-centric privacy control endpoints including simplified data deletion, privacy request tracking, and data management features designed for direct user access alongside GDPR compliance endpoints.

## Quick Links

- [GDPR Compliance API](/home/user/Omniops/app/api/gdpr/README.md)
- [API Routes Documentation](/home/user/Omniops/app/api/README.md)
- [Chat System Integration](/home/user/Omniops/app/api/chat/README.md)
- [Customer Configuration](/home/user/Omniops/app/api/customer/README.md)

## Keywords

**Primary**: privacy API, data deletion, privacy preferences, user data control, privacy requests
**Aliases**: privacy endpoints, user privacy, data rights, privacy management
**Related**: GDPR compliance, data export, privacy settings, consent management, audit logging

## Table of Contents

- [Overview](#overview)
- [Endpoints](#endpoints)
  - [POST /api/privacy/delete](#post-apiprivacydelete)
  - [GET /api/privacy/export (Planned)](#get-apiprivacyexport-planned)
  - [POST /api/privacy/preferences (Planned)](#post-apiprivacypreferences-planned)
  - [GET /api/privacy/status (Planned)](#get-apiprivacystatus-planned)
- [Features](#features)
- [Database Operations](#database-operations)
- [Security Features](#security-features)
- [Performance](#performance)
- [Examples](#examples)
- [Error Handling](#error-handling)
- [Integration](#integration)
- [Privacy Request Types](#privacy-request-types)
- [Monitoring and Analytics](#monitoring-and-analytics)
- [Best Practices](#best-practices)
- [Compliance Considerations](#compliance-considerations)
- [Testing and Validation](#testing-and-validation)
- [Related Endpoints](#related-endpoints)
- [Future Enhancements](#future-enhancements)

---

User privacy and data control endpoints for managing personal data and privacy preferences.

## Overview

This API provides user-centric privacy controls including data deletion, privacy settings management, and user data exports. Designed to work in conjunction with GDPR endpoints while providing additional user control features.

## Endpoints

### POST `/api/privacy/delete`

Delete user data with simplified interface for direct user access.

#### Authentication
- **Type**: Session-based identification
- **Privacy**: User ID-based data targeting
- **Safety**: Comprehensive validation and logging

#### Request Format

```json
{
  "userId": "user-session-12345"
}
```

#### Required Fields
- `userId` (string): User session identifier or unique user ID

#### Response Format

```json
{
  "success": true,
  "message": "All user data has been deleted successfully"
}
```

#### Process Overview
1. **Validation**: Verify user ID format and existence
2. **Message Deletion**: Remove all user messages from conversations
3. **Conversation Cleanup**: Delete user-specific conversations
4. **Audit Logging**: Record deletion for compliance tracking
5. **Confirmation**: Return success confirmation

### GET `/api/privacy/export` *(Planned)*

User-friendly data export with enhanced formatting options.

### POST `/api/privacy/preferences` *(Planned)*

Manage user privacy preferences and consent settings.

### GET `/api/privacy/status` *(Planned)*

Check current privacy status and data retention information.

## Features

### Simplified Data Deletion
- **Single Identifier**: Uses unified user ID for all operations
- **Automatic Cleanup**: Handles all related data automatically
- **Safety Validation**: Prevents accidental deletions
- **Immediate Processing**: Real-time deletion execution

### Privacy Request Tracking
- **Compliance Logging**: All requests logged to `privacy_requests` table
- **Status Tracking**: Monitor request processing and completion
- **Audit Trail**: Complete history of privacy operations
- **Request Types**: Support for various privacy request types

### Data Scope Management
- **User Messages**: All chat messages and conversation history
- **Session Data**: User session information and preferences
- **Interaction History**: User interaction patterns and behavior
- **Related Records**: Cascade deletion of dependent data

## Database Operations

### Deletion Process
```sql
-- Step 1: Delete user messages
DELETE FROM messages WHERE session_id = :userId;

-- Step 2: Delete user conversations  
DELETE FROM conversations WHERE session_id = :userId;

-- Step 3: Log privacy request
INSERT INTO privacy_requests (
  user_id, 
  request_type, 
  status, 
  completed_at
) VALUES (
  :userId, 
  'deletion', 
  'completed', 
  NOW()
);
```

### Cascade Relationships
- **Messages → Conversations**: Foreign key relationships maintained
- **User Sessions → Data**: All user-related data removed
- **Privacy Logs**: Deletion events permanently logged
- **Backup Exclusion**: Deleted data excluded from backups

## Security Features

### Data Protection
- **Secure Deletion**: Data permanently removed from all systems
- **Service Role Access**: Uses privileged database access for complete deletion
- **Validation Checks**: Multiple validation steps before deletion
- **Error Handling**: Comprehensive error recovery and logging

### Access Control
- **User ID Validation**: Verify user ID format and existence
- **Rate Limiting**: Prevent abuse of deletion endpoints
- **Audit Logging**: All access attempts recorded
- **Privacy Controls**: User-centric privacy management

### Compliance Integration
- **GDPR Integration**: Works with `/api/gdpr/*` endpoints
- **Privacy Request Logs**: Comprehensive audit trail
- **Data Minimization**: Only necessary data processing
- **Right to Erasure**: Full compliance with deletion rights

## Performance

### Response Times
- **Small Datasets**: 100-300ms typical deletion time
- **Large Datasets**: 500-1500ms for extensive user data
- **Database Operations**: Optimized cascade deletions
- **Logging Operations**: Minimal impact on deletion speed

### Scalability
- **Concurrent Deletions**: Handle multiple simultaneous requests
- **Resource Management**: Efficient database resource usage
- **Memory Optimization**: Stream processing for large datasets
- **Transaction Management**: Atomic operations for data consistency

## Examples

### Simple Data Deletion
```bash
curl -X POST 'http://localhost:3000/api/privacy/delete' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-session-12345"
  }'
```

### Batch User Cleanup
```bash
# Delete multiple users (if needed)
for user in user-123 user-456 user-789; do
  curl -X POST 'http://localhost:3000/api/privacy/delete' \
    -H 'Content-Type: application/json' \
    -d "{\"userId\": \"$user\"}"
done
```

### Verification Before Deletion
```bash
# Check user data exists before deletion
curl -X GET 'http://localhost:3000/api/privacy/status?userId=user-session-12345'

# Then proceed with deletion
curl -X POST 'http://localhost:3000/api/privacy/delete' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-session-12345"
  }'
```

## Error Handling

### Common Errors
```json
// Missing user ID
{
  "error": "User ID is required"
}

// Database connection error
{
  "error": "Failed to delete user data"
}

// No data found (still successful)
{
  "success": true,
  "message": "All user data has been deleted successfully"
}
```

### Error Recovery
- **Transaction Rollback**: Automatic rollback on partial failures
- **Retry Logic**: Automatic retry for transient failures
- **Error Logging**: Detailed error information for debugging
- **Graceful Degradation**: Continue processing where possible

## Integration

### With Chat System
Privacy deletion automatically affects:
- **Active Conversations**: Immediate termination of user conversations
- **Message History**: Complete removal from chat history
- **Search Indexes**: User data removed from search results
- **Analytics**: User interactions excluded from analytics

### With GDPR Endpoints
- **Complementary Functionality**: Works alongside `/api/gdpr/*` endpoints
- **Unified Logging**: Shared privacy request logging system
- **Consistent Data Handling**: Same data scope and deletion logic
- **Audit Coordination**: Coordinated compliance reporting

### With User Management
- **Session Cleanup**: Automatic session invalidation after deletion
- **Preference Reset**: User preferences cleared after deletion
- **Account Linking**: Handle account-to-session relationships
- **Re-engagement**: Support for users returning after deletion

## Privacy Request Types

### Current Support
```json
{
  "deletion": {
    "description": "Complete user data deletion",
    "endpoints": ["/api/privacy/delete", "/api/gdpr/delete"],
    "scope": "All user messages and conversations",
    "timeline": "Immediate"
  }
}
```

### Planned Features
```json
{
  "export": {
    "description": "User data export with enhanced formatting",
    "scope": "All user data in multiple formats",
    "timeline": "Within 24 hours"
  },
  "preferences": {
    "description": "Privacy preference management",
    "scope": "Consent and privacy settings",
    "timeline": "Immediate"
  },
  "portability": {
    "description": "Data portability between systems",
    "scope": "Structured data export",
    "timeline": "Within 48 hours"
  }
}
```

## Monitoring and Analytics

### Privacy Metrics
```json
{
  "deletion_requests": {
    "total": 150,
    "success_rate": 99.3,
    "average_processing_time": "245ms",
    "data_volume_deleted": "2.3GB"
  },
  "user_retention": {
    "voluntary_deletions": 45,
    "gdpr_deletions": 105,
    "reactivation_rate": 12.5
  }
}
```

### Compliance Tracking
- **Request Volume**: Track privacy request patterns
- **Processing Times**: Monitor compliance with response deadlines
- **Success Rates**: Ensure reliable privacy request processing
- **Data Volumes**: Track amount of data processed

## Best Practices

### User Communication
- **Clear Explanations**: Explain what data will be deleted
- **Confirmation Steps**: Provide clear confirmation of actions
- **Status Updates**: Keep users informed of processing status
- **Support Access**: Provide easy access to privacy support

### Data Management
- **Regular Cleanup**: Implement automated data retention policies
- **Backup Exclusion**: Ensure deleted data excluded from all backups
- **Index Maintenance**: Update search indexes after deletions
- **Cache Invalidation**: Clear relevant caches after data changes

### Development Guidelines
- **Privacy by Design**: Build privacy considerations into all features
- **Data Minimization**: Collect only necessary user data
- **Transparent Processing**: Provide clear information about data use
- **User Control**: Give users control over their data

## Compliance Considerations

### Legal Requirements
- **Right to Erasure**: Full support for data deletion rights
- **Data Portability**: Support for data export and transfer
- **Consent Management**: Handle user consent and preferences
- **Audit Requirements**: Maintain comprehensive audit trails

### Implementation Standards
- **Immediate Processing**: Real-time privacy request handling
- **Complete Deletion**: Ensure all user data is permanently removed
- **Audit Logging**: Log all privacy operations for compliance
- **Documentation**: Maintain clear documentation of privacy processes

## Testing and Validation

### Test Scenarios
```bash
# Test successful deletion
curl -X POST 'http://localhost:3000/api/privacy/delete' \
  -H 'Content-Type: application/json' \
  -d '{"userId": "test-user-123"}'

# Test invalid user ID
curl -X POST 'http://localhost:3000/api/privacy/delete' \
  -H 'Content-Type: application/json' \
  -d '{"userId": ""}'

# Test missing user ID
curl -X POST 'http://localhost:3000/api/privacy/delete' \
  -H 'Content-Type: application/json' \
  -d '{}'
```

### Validation Checks
- **Data Verification**: Confirm all user data is deleted
- **Audit Verification**: Ensure privacy requests are logged
- **Error Handling**: Test error scenarios and recovery
- **Performance Testing**: Validate response times and scalability

## Related Endpoints

- `/api/gdpr/export` - GDPR-compliant data export
- `/api/gdpr/delete` - GDPR-compliant data deletion
- `/api/monitoring/privacy` - Privacy request analytics
- `/api/customer/config` - Customer privacy configuration

## Future Enhancements

### Planned Features
- **Enhanced Export**: Multiple format support (CSV, PDF, XML)
- **Preference Management**: Granular privacy control settings
- **Data Portability**: Direct transfer to other systems
- **Consent Tracking**: Comprehensive consent management
- **Privacy Dashboard**: User-facing privacy control interface

### Integration Roadmap
- **Single Sign-On**: Integration with authentication systems
- **Third-party APIs**: Data deletion across integrated services
- **Mobile Apps**: Native mobile privacy controls
- **Webhook Support**: Real-time privacy event notifications