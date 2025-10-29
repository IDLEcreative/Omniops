# Privacy & Compliance

**Type:** Guide
**Status:** Active
**Last Updated:** 2025-10-29
**Verified For:** v0.1.0
**Dependencies:**
- [Privacy Features Guide](GUIDE_PRIVACY_FEATURES.md)
- [GDPR Audit Runbook](GUIDE_GDPR_AUDIT_RUNBOOK.md)
- [Privacy API Documentation](../03-API/)
**Estimated Read Time:** 14 minutes

## Purpose
Comprehensive privacy and compliance framework covering GDPR, CCPA, and data protection regulations. Details user data rights, encryption standards, retention policies, and compliance checklists for privacy-first operations.

## Quick Links
- [Overview](#overview)
- [Key Privacy Features](#key-privacy-features)
- [GDPR Compliance](#gdpr-compliance)
- [CCPA Compliance](#ccpa-compliance)
- [Data We Collect](#data-we-collect)
- [Privacy APIs](#privacy-apis)
- [Configuration](#configuration)
- [Data Security](#data-security)
- [Compliance Checklist](#compliance-checklist)
- [Privacy by Design](#privacy-by-design)

## Keywords
GDPR compliance, CCPA compliance, data protection, privacy by design, encryption, AES-256, user data rights, data retention, data export, data deletion, privacy APIs, row level security, audit logging, privacy compliance, data minimization, GDPR Article 15, GDPR Article 17

## Aliases
- "GDPR" (also known as: General Data Protection Regulation, EU data protection, European privacy law)
- "CCPA" (also known as: California Consumer Privacy Act, California privacy law, consumer data rights)
- "data retention" (also known as: retention policies, automatic deletion, data lifecycle, retention period)
- "encryption at rest" (also known as: AES-256 encryption, data encryption, encrypted storage)
- "right to erasure" (also known as: right to deletion, data deletion, right to be forgotten, GDPR Article 17)

---

OmniOps is built with privacy-first architecture and is designed to comply with GDPR, CCPA, and other data protection regulations.

## Overview

OmniOps provides comprehensive privacy and data protection features including:

- **GDPR/CCPA Compliance** - Built-in data export and deletion APIs
- **Data Minimization** - Only collect what's necessary
- **Encryption** - AES-256 encryption for sensitive data
- **User Rights** - Easy data access, export, and deletion
- **Configurable Retention** - Automatic data cleanup policies
- **Audit Trail** - Track all privacy-related operations

## Key Privacy Features

### User Data Rights

**Right to Access** - Users can request their data:
```http
GET /api/privacy/export?userId=session_123_abc
```
Returns complete data in JSON format.

**Right to Erasure** - Users can delete their data:
```http
POST /api/privacy/delete
Content-Type: application/json

{
  "userId": "session_123_abc"
}
```
Permanently removes all user data.

**Right to Portability** - Data export in machine-readable JSON format.

### Data Protection

- **Encryption at Rest**: AES-256 encryption for sensitive credentials
- **Encryption in Transit**: TLS 1.3 for all connections
- **Credential Storage**: WooCommerce and Shopify credentials are encrypted
- **Row Level Security**: Database-level tenant isolation
- **IP Anonymization**: Optional IP address anonymization

### Data Retention

Configurable automatic deletion:
- Default: 30 days for conversation history
- Customizable: 7, 14, 30, 60, 90, or 365 days
- Automatic cleanup jobs run daily
- Manual deletion available anytime

## GDPR Compliance

OmniOps implements all GDPR requirements:

✅ **Article 15 - Right to Access**: Data export API
✅ **Article 16 - Right to Rectification**: Update capabilities
✅ **Article 17 - Right to Erasure**: Data deletion API
✅ **Article 18 - Right to Restriction**: Opt-out functionality
✅ **Article 20 - Right to Portability**: JSON export format
✅ **Article 25 - Privacy by Design**: Minimal data collection
✅ **Article 32 - Security**: Encryption and access controls

## CCPA Compliance

California Consumer Privacy Act compliance:

✅ **Right to Know**: Data export shows all collected data
✅ **Right to Delete**: Deletion tools available
✅ **Right to Opt-Out**: Disable data collection
✅ **No Sale of Data**: Data is never sold or shared

## Data We Collect

### Chat Data
- User messages and AI responses
- Conversation metadata (timestamps, IDs)
- Anonymous session identifiers

### Analytics Data (Optional)
- Message counts
- Response times
- Search queries (anonymized)

### E-commerce Data (If Integrated)
- Order information (for customer verification)
- Product data (for contextual answers)
- Inventory levels (for availability checks)

**We DO NOT collect:**
- Personal information (unless voluntarily provided in chat)
- Browsing history outside chat
- Third-party cookies
- Device fingerprints
- Precise location data

## Privacy APIs

### Export User Data

**Endpoint**: `GET /api/privacy/export`

**Query Parameters**:
- `userId` - User's session ID
- `domain` - Customer domain

**Response**: JSON file containing all user data

**Example**:
```bash
curl "https://your-domain.com/api/privacy/export?userId=session_123"
```

### Delete User Data

**Endpoint**: `POST /api/privacy/delete`

**Request Body**:
```json
{
  "userId": "session_123_abc",
  "domain": "example.com"
}
```

**Response**:
```json
{
  "success": true,
  "deletedRecords": {
    "conversations": 5,
    "messages": 47,
    "sessions": 1
  }
}
```

### Data Retention Policies

**Endpoint**: `GET /api/privacy/retention`

Returns current retention policies for the domain.

## Configuration

### Environment Variables

```bash
# Enable privacy features
ENABLE_PRIVACY_FEATURES=true

# Data retention (days)
DEFAULT_RETENTION_DAYS=30

# Encryption key for sensitive data
ENCRYPTION_KEY=your-32-byte-key-here
```

### Customer Configuration

Privacy settings per customer domain in `customer_configs` table:

```sql
{
  "privacy": {
    "retention_days": 30,
    "allow_export": true,
    "allow_deletion": true,
    "anonymize_ips": true,
    "require_consent": false
  }
}
```

## Data Security

### Encryption

**At Rest**:
- AES-256 encryption for WooCommerce credentials
- AES-256 encryption for Shopify credentials
- Encrypted backups

**In Transit**:
- TLS 1.3 for all API calls
- HTTPS enforced
- Secure WebSocket connections

### Access Controls

- **Row Level Security (RLS)**: Database-level isolation
- **API Authentication**: Service role keys for admin operations
- **Rate Limiting**: Prevent abuse of privacy endpoints
- **Audit Logging**: Track all access to user data

### Database Security

- PostgreSQL with Row Level Security
- Multi-tenant isolation by domain
- Encrypted backups
- Regular security audits

## Compliance Checklist

### For New Deployments

- [ ] Configure retention policies
- [ ] Set up data export endpoint
- [ ] Set up data deletion endpoint
- [ ] Enable encryption for credentials
- [ ] Configure HTTPS/TLS
- [ ] Set up privacy policy page
- [ ] Test data export functionality
- [ ] Test data deletion functionality
- [ ] Document privacy practices
- [ ] Train team on privacy features

### For Ongoing Compliance

- [ ] Regular privacy audits (monthly)
- [ ] Monitor data retention job success
- [ ] Review access logs
- [ ] Update privacy documentation
- [ ] Test privacy endpoints quarterly
- [ ] Respond to data requests within 30 days

## Privacy by Design

OmniOps follows privacy-by-design principles:

1. **Proactive not Reactive**: Privacy built-in from the start
2. **Privacy as Default**: Maximum privacy settings by default
3. **Privacy Embedded**: Privacy features in the core design
4. **Full Functionality**: Security without sacrificing features
5. **End-to-End Security**: From data collection to deletion
6. **Visibility and Transparency**: Clear privacy practices
7. **User-Centric**: Easy privacy controls for users

## Additional Resources

### Documentation

- **Complete Privacy Guide**: [docs/PRIVACY_GUIDE.md](PRIVACY_GUIDE.md)
- **Database Schema**: [docs/07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md](07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- **API Reference**: [docs/03-API/](03-API/)

### External Resources

- [GDPR Official Site](https://gdpr.eu/)
- [CCPA Information](https://oag.ca.gov/privacy/ccpa)
- [NIST Privacy Framework](https://www.nist.gov/privacy-framework)

### Support

For privacy-related questions or data requests:

1. **Documentation**: Start with this guide and the full privacy guide
2. **API Documentation**: See the API endpoints above
3. **Technical Issues**: Check [docs/06-TROUBLESHOOTING/README.md](06-TROUBLESHOOTING/README.md)
4. **Privacy Incidents**: Follow incident response procedures in [docs/PRIVACY_GUIDE.md](PRIVACY_GUIDE.md)

## Legal Considerations

**Disclaimer**: While OmniOps provides privacy-compliant features and tools, compliance is ultimately the responsibility of the deploying organization. We recommend:

1. Consulting with legal counsel about your specific requirements
2. Creating your own privacy policy based on your use case
3. Regularly reviewing and updating privacy practices
4. Staying informed about privacy regulation changes
5. Conducting regular compliance audits

## Privacy Contact

For privacy-related questions or concerns about OmniOps:

- **Documentation**: Review this guide and linked resources
- **Issues**: Open a GitHub issue for technical questions
- **Security**: Report security concerns via responsible disclosure

---

**Last Updated**: 2025-10-24
**Applies To**: OmniOps v0.1.0+
