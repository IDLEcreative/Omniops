# Privacy & Data Protection Guide

This guide covers privacy features, compliance settings, and data protection capabilities of the Customer Service Agent.

## 🔒 Privacy Features Overview

### For Website Visitors

- **Opt-out capability**: Users can disable the chat widget at any time
- **Data transparency**: "Your data is never sold" message prominently displayed
- **Privacy controls**: Export or delete personal data on request
- **Consent management**: Optional explicit consent before chat starts
- **Data retention**: Automatic deletion after configured period (default 30 days)

### For Business Owners

- **Privacy dashboard**: Central control panel at `/admin/privacy`
- **Compliance settings**: GDPR, CCPA, and regional compliance options
- **Data retention policies**: Configurable from 7 to 365 days
- **Security controls**: Encryption, anonymization, and access controls
- **Audit trail**: Track privacy requests and compliance actions

## 📋 Privacy Configuration

### Admin Privacy Settings

Access the privacy dashboard at `/admin/privacy` to configure:

#### Data Retention
- **Chat Conversations**: 7, 14, 30, 60, 90, or 365 days
- **Analytics Data**: 1, 3, 6, 12, or 24 months
- **Automatic Deletion**: Enable/disable auto-cleanup

#### User Rights
- **Allow Opt-Out**: Show opt-out option in widget
- **Privacy Notice**: Display privacy policy link
- **Require Consent**: Ask for explicit consent before chat
- **Data Export**: Allow users to download their data
- **Data Deletion**: Allow users to request deletion

#### Compliance Settings
- **GDPR**: European Union compliance
- **CCPA**: California privacy compliance
- **Cookie Consent**: Show cookie banner
- **IP Anonymization**: Anonymize IP addresses

#### Security Settings
- **Encrypt at Rest**: AES-256 encryption
- **Encrypt in Transit**: TLS 1.3 enforcement
- **Anonymize Personal Data**: Replace PII with IDs
- **Mask Sensitive Info**: Auto-detect and hide SSN, credit cards

## 🎛️ Widget Privacy Controls

### Widget Configuration

Add privacy settings to your embed code:

```javascript
window.ChatWidgetConfig = {
  privacy: {
    allowOptOut: true,           // Show opt-out option
    showPrivacyNotice: true,     // Show privacy link
    requireConsent: false,       // Require explicit consent
    retentionDays: 30           // Data retention period
  }
};
```

### User-Facing Privacy Features

The widget displays privacy controls in the footer:

1. **Privacy Policy Link**: Links to your privacy policy
2. **Trust Signal**: "Your data is never sold" message
3. **Privacy Menu** (click info icon):
   - Opt out of chat
   - Export my data
   - Delete my data
   - View retention period

### Consent Flow

When `requireConsent` is enabled:

1. User opens widget
2. Privacy notice appears with:
   - Explanation of data use
   - Retention period
   - Link to full privacy policy
3. User must accept to start chatting

## 🛠️ API Reference

### Privacy Endpoints

#### Delete User Data
```http
POST /api/privacy/delete
Content-Type: application/json

{
  "userId": "session_123_abc"
}
```

#### Export User Data
```http
GET /privacy/export?user=session_123_abc
```

Returns downloadable JSON file with all user data.

### JavaScript API

```javascript
// Opt out (disables widget)
ChatWidget.privacy.optOut();

// Opt back in
ChatWidget.privacy.optIn();

// Clear local data
ChatWidget.privacy.clearData();

// Get privacy status
const status = ChatWidget.privacy.getStatus();
// Returns: { optedOut: false, consentGiven: true }
```

## 📊 Data Handling

### What Data is Collected

1. **Chat Messages**: User messages and AI responses
2. **Session Data**: Anonymous session ID
3. **Metadata**: Timestamps, conversation IDs
4. **Analytics**: Message count, response times (if enabled)

### What Data is NOT Collected

- Personal information (unless provided in chat)
- Browsing history
- Third-party cookies
- Device fingerprints
- Location data (IPs can be anonymized)

### Data Storage

- **Database**: PostgreSQL with Row Level Security
- **Encryption**: AES-256 at rest, TLS 1.3 in transit
- **Isolation**: Data segregated by domain
- **Backups**: Encrypted and retention-compliant

### Data Deletion

Automatic deletion process:
1. Daily cleanup job runs at 2 AM UTC
2. Identifies data older than retention period
3. Permanently deletes from database
4. Logs deletion for compliance

Manual deletion:
1. User requests via widget
2. All associated data deleted immediately
3. Confirmation logged

## 🌍 Compliance

### GDPR Compliance

✅ **Right to Access**: Data export functionality
✅ **Right to Erasure**: Data deletion on request
✅ **Right to Portability**: JSON export format
✅ **Consent**: Optional explicit consent
✅ **Privacy by Design**: Minimal data collection
✅ **Data Minimization**: Auto-deletion policies

### CCPA Compliance

✅ **Right to Know**: Data export shows all collected data
✅ **Right to Delete**: Deletion tools available
✅ **Right to Opt-Out**: Disable widget anytime
✅ **No Sale of Data**: Enforced by design

### Implementation Checklist

- [ ] Review and set appropriate retention periods
- [ ] Enable consent if serving EU users
- [ ] Configure privacy notice link
- [ ] Test opt-out functionality
- [ ] Verify data export works
- [ ] Set up monitoring for privacy requests
- [ ] Document your privacy practices

## 🚨 Privacy Incident Response

### If a Privacy Request Fails

1. Check error logs in Supabase
2. Verify user session ID is correct
3. Manually process if needed
4. Update privacy_requests table

### Monitoring Privacy Compliance

1. Regular audits of privacy_requests table
2. Monitor data retention job success
3. Check for failed deletions
4. Review consent rates

## 📚 Additional Resources

- [GDPR Guidelines](https://gdpr.eu/)
- [CCPA Information](https://oag.ca.gov/privacy/ccpa)
- [Privacy Policy Template](templates/privacy-policy.md)
- [Cookie Policy Template](templates/cookie-policy.md)

## 🤝 Privacy Best Practices

1. **Transparency First**: Always be clear about data use
2. **Minimal Collection**: Only collect what you need
3. **Secure by Default**: Enable all security features
4. **Regular Audits**: Review privacy settings monthly
5. **User Control**: Make privacy options easily accessible
6. **Documentation**: Keep privacy practices documented
7. **Training**: Ensure team understands privacy features

---

For technical support or privacy questions, contact: privacy@yourcompany.com