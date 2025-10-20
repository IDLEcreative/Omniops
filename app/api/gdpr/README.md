# GDPR Compliance API

Privacy-compliant data management endpoints supporting GDPR, CCPA, and other data protection regulations.

## Overview

This API provides comprehensive data protection compliance features including data export, deletion, and privacy request management. Designed to meet GDPR Article 15 (Right of Access) and Article 17 (Right to Erasure) requirements.

## Endpoints

### POST `/api/gdpr/export`

Export user data in machine-readable format for GDPR Article 15 compliance.

#### Authentication
- **Type**: No authentication required (identifier-based)
- **Privacy**: Uses session_id or email for user identification
- **Rate Limits**: Standard domain-based limiting with enhanced monitoring

#### Request Format

```json
{
  "session_id": "user-session-12345",
  "email": "customer@example.com",
  "domain": "example.com"
}
```

#### Required Fields
- `domain` (string): Customer domain for data scope
- Either `session_id` OR `email`: User identification method

#### Optional Fields
- Both `session_id` and `email` can be provided for enhanced matching

#### Response Format

```json
{
  "export_date": "2024-01-17T10:30:00.000Z",
  "domain": "example.com",
  "user_identifier": "customer@example.com",
  "conversations": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T14:20:00.000Z",
      "messages": [
        {
          "role": "user",
          "content": "Looking for hydraulic pump parts",
          "created_at": "2024-01-15T14:20:15.000Z"
        },
        {
          "role": "assistant", 
          "content": "I can help you find hydraulic pump parts...",
          "created_at": "2024-01-15T14:20:45.000Z"
        }
      ]
    }
  ],
  "metadata": {
    "total_conversations": 3,
    "total_messages": 24
  }
}
```

#### Headers
```
Content-Disposition: attachment; filename="chat-export-1705489800000.json"
Content-Type: application/json
```

### POST `/api/gdpr/delete`

Delete user data for GDPR Article 17 (Right to Erasure) compliance.

#### Authentication
- **Type**: No authentication required (identifier-based)
- **Privacy**: Uses session_id or email for user identification
- **Safety**: Comprehensive data validation and audit logging

#### Request Format

```json
{
  "session_id": "user-session-12345",
  "email": "customer@example.com",
  "domain": "example.com",
  "confirmation": "DELETE_MY_DATA"
}
```

#### Required Fields
- `domain` (string): Customer domain for data scope
- Either `session_id` OR `email`: User identification method
- `confirmation` (string): Must be "DELETE_MY_DATA" for safety

#### Response Format

```json
{
  "success": true,
  "message": "All user data has been deleted successfully",
  "deleted_data": {
    "conversations": 3,
    "messages": 24,
    "sessions": 1
  },
  "deletion_id": "del_20240117_103000_abc123",
  "completed_at": "2024-01-17T10:30:00.000Z"
}
```

## Features

### Data Export (GDPR Article 15)
- **Complete Data Access**: All user conversations and messages
- **Machine-Readable Format**: JSON format for easy processing
- **Metadata Inclusion**: Comprehensive data statistics
- **Timestamp Preservation**: All original timestamps maintained
- **Domain Scoping**: Data limited to specific customer domains

### Data Deletion (GDPR Article 17)
- **Complete Erasure**: All user data permanently deleted
- **Cascade Deletion**: Related data automatically removed
- **Audit Logging**: Deletion events logged for compliance
- **Confirmation Required**: Safety mechanism to prevent accidental deletion
- **Immediate Processing**: Real-time deletion execution

### Privacy Request Management
- **Request Tracking**: Complete audit trail for all privacy requests
- **Status Monitoring**: Track request processing and completion
- **Compliance Reporting**: Generate compliance reports for authorities
- **Data Minimization**: Only collect and export necessary data

## Data Scope

### Included Data
- **Conversations**: All chat conversations for the user
- **Messages**: Complete message history with timestamps
- **Session Data**: Session identifiers and metadata
- **Interaction History**: User interaction patterns and preferences

### Excluded Data
- **System Logs**: Technical logs not containing personal data
- **Aggregated Analytics**: Anonymous usage statistics
- **Configuration Data**: System configuration without personal identifiers
- **Third-party Data**: Data owned by external services

## Compliance Features

### GDPR Compliance
- **Article 15**: Right of Access - Complete data export
- **Article 17**: Right to Erasure - Permanent data deletion
- **Article 20**: Data Portability - Machine-readable export format
- **Article 30**: Records of Processing - Comprehensive audit logging

### CCPA Compliance
- **Right to Know**: Full disclosure of personal information
- **Right to Delete**: Complete personal information deletion
- **Right to Portability**: Data export in usable format
- **Non-Discrimination**: No service degradation after requests

### Additional Regulations
- **PIPEDA** (Canada): Privacy protection and data access rights
- **LGPD** (Brazil): Data subject rights and data portability
- **PDPA** (Singapore): Data access and correction rights

## Security Measures

### Data Protection
- **Encryption at Rest**: All personal data encrypted in database
- **Secure Transmission**: HTTPS-only API communication
- **Access Logging**: All data access attempts logged
- **Data Minimization**: Only necessary data collected and retained

### Request Validation
- **Identity Verification**: Multiple verification methods
- **Domain Validation**: Ensure requests are for correct domain
- **Rate Limiting**: Protection against abuse and excessive requests
- **Audit Trails**: Complete logging of all privacy requests

### Deletion Safety
- **Confirmation Required**: Explicit confirmation for deletion requests
- **Irreversible Process**: Clear warning about permanent deletion
- **Backup Exclusion**: Deleted data excluded from all backups
- **Verification Steps**: Multiple verification points before deletion

## Examples

### Data Export Request
```bash
curl -X POST 'http://localhost:3000/api/gdpr/export' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "customer@example.com",
    "domain": "example.com"
  }'
```

### Session-Based Export
```bash
curl -X POST 'http://localhost:3000/api/gdpr/export' \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "user-session-12345",
    "domain": "example.com"
  }'
```

### Data Deletion Request
```bash
curl -X POST 'http://localhost:3000/api/gdpr/delete' \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "customer@example.com",
    "domain": "example.com",
    "confirmation": "DELETE_MY_DATA"
  }'
```

### Combined Identifier Request
```bash
curl -X POST 'http://localhost:3000/api/gdpr/export' \
  -H 'Content-Type: application/json' \
  -d '{
    "session_id": "user-session-12345",
    "email": "customer@example.com",
    "domain": "example.com"
  }'
```

### Fetch Recent Audit Entries
```bash
curl 'http://localhost:3000/api/gdpr/audit?request_type=delete&limit=25'
```

Returns all recent GDPR export/delete requests stored in `gdpr_audit_log`.

## Error Handling

### Common Errors
```json
// Missing identifier
{
  "error": "Either session_id or email is required"
}

// No data found
{
  "export_date": "2024-01-17T10:30:00.000Z",
  "domain": "example.com", 
  "user_identifier": "nonexistent@example.com",
  "conversations": [],
  "metadata": {
    "total_conversations": 0,
    "total_messages": 0
  }
}

// Database connection error
{
  "error": "Database connection unavailable"
}

// Invalid confirmation for deletion
{
  "error": "Invalid confirmation. Must be 'DELETE_MY_DATA'"
}
```

### Data Validation
- **Email Format**: Valid email address validation
- **Session ID Format**: Proper session identifier validation
- **Domain Verification**: Domain existence and configuration validation
- **Request Completeness**: All required fields present and valid

## Performance

### Response Times
- **Data Export**: 200-800ms (depending on data volume)
- **Data Deletion**: 300-1000ms (depending on data volume)
- **Large Datasets**: Automatic pagination for extensive data
- **Concurrent Requests**: Efficient handling of multiple privacy requests

### Scalability
- **Batch Processing**: Efficient handling of large datasets
- **Database Optimization**: Optimized queries for privacy operations
- **Memory Management**: Streaming for large data exports
- **Resource Allocation**: Dedicated resources for privacy operations

## Audit and Logging

### Privacy Request Logs
```json
{
  "request_id": "privacy_20240117_103000_abc123",
  "request_type": "export",
  "user_identifier": "customer@example.com",
  "domain": "example.com",
  "requested_at": "2024-01-17T10:30:00.000Z",
  "completed_at": "2024-01-17T10:30:45.000Z",
  "status": "completed",
  "data_volume": {
    "conversations": 3,
    "messages": 24
  }
}
```

### Compliance Reporting
- **Request Statistics**: Volume and type of privacy requests
- **Response Times**: Average processing time for compliance
- **Data Volumes**: Amount of data processed for each request type
- **Error Rates**: Failed request analysis and improvement

## Integration

### With Customer Service
- **Automated Requests**: Integration with customer service workflows
- **Request Tracking**: Status updates for customer service teams
- **Data Preparation**: Pre-formatted responses for customer queries
- **Escalation Handling**: Complex request routing to appropriate teams

### With Legal Systems
- **Compliance Monitoring**: Automated compliance status reporting
- **Audit Preparation**: Ready-to-use audit trails and documentation
- **Regulatory Reporting**: Formatted reports for regulatory submissions
- **Data Breach Response**: Rapid data assessment and notification

### With Data Management
- **Data Lifecycle**: Integration with data retention policies
- **Backup Management**: Ensure deleted data excluded from backups
- **Archival Systems**: Proper handling of archived personal data
- **Data Discovery**: Comprehensive personal data identification

## Best Practices

### Request Processing
- **Verify Identity**: Multiple verification methods for security
- **Document Everything**: Comprehensive audit trails for all requests
- **Respond Promptly**: Meet regulatory timeline requirements
- **Communicate Clearly**: Provide clear status updates to users

### Data Handling
- **Minimize Collection**: Only collect necessary personal data
- **Secure Storage**: Encrypt all personal data at rest and in transit
- **Regular Cleanup**: Automatic deletion of expired data
- **Access Controls**: Restrict access to personal data processing

### Compliance Management
- **Regular Reviews**: Periodic compliance assessment and updates
- **Staff Training**: Ensure team understands privacy requirements
- **Policy Updates**: Keep privacy policies current with regulations
- **Incident Response**: Prepared response for data breach scenarios

## Regulatory Timelines

### GDPR Requirements
- **Data Export**: 30 days maximum response time
- **Data Deletion**: Without undue delay, typically within 30 days
- **Request Acknowledgment**: Immediate confirmation of receipt
- **Status Updates**: Regular communication with requesters

### Implementation
- **Automated Processing**: Most requests processed immediately
- **Manual Review**: Complex cases may require human review
- **Escalation Procedures**: Clear processes for unusual requests
- **Documentation**: Complete audit trail for all decisions

## Related Endpoints

- `/api/privacy/delete` - Alternative deletion endpoint
- `/api/customer/config` - Customer data configuration
- `/api/monitoring/privacy` - Privacy request analytics
- `/api/audit/privacy` - Compliance audit endpoints

## Legal Disclaimers

### Data Protection
This API is designed to facilitate compliance with applicable data protection laws. Organizations using this API are responsible for:
- Verifying legal requirements in their jurisdiction
- Implementing appropriate verification procedures
- Maintaining comprehensive audit trails
- Training staff on privacy compliance procedures

### Data Retention
- Deleted data is permanently removed from all systems
- Backup systems are configured to exclude deleted data
- Audit logs are retained for compliance purposes only
- Legal hold procedures may affect deletion timelines
