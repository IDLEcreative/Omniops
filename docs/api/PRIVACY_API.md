# Privacy API Reference

The Privacy API provides GDPR/CCPA-compliant endpoints for user data access, export, and deletion.

## Overview

OmniOps Privacy API enables:
- User data export (Right to Access)
- User data deletion (Right to Erasure)
- Data retention policies
- Compliance reporting

All endpoints are designed to meet GDPR, CCPA, and other privacy regulations.

## Endpoints

### Export User Data

Export all data associated with a user session.

**Endpoint**: `GET /api/privacy/export`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User's session ID |
| `domain` | string | Yes | Customer domain |

**Example Request**:
```bash
curl "https://your-domain.com/api/privacy/export?userId=session_123&domain=store.com"
```

**Response**: JSON file download

```json
{
  "userId": "session_123",
  "domain": "store.com",
  "exportDate": "2025-10-24T12:00:00Z",
  "data": {
    "conversations": [
      {
        "id": "conv_456",
        "createdAt": "2025-10-20T10:30:00Z",
        "messages": [
          {
            "role": "user",
            "content": "What are your return policies?",
            "timestamp": "2025-10-20T10:30:15Z"
          },
          {
            "role": "assistant",
            "content": "Our return policy allows...",
            "timestamp": "2025-10-20T10:30:18Z"
          }
        ]
      }
    ],
    "sessions": [
      {
        "id": "session_123",
        "startedAt": "2025-10-20T10:30:00Z",
        "endedAt": "2025-10-20T11:00:00Z",
        "metadata": {
          "userAgent": "Mozilla/5.0...",
          "language": "en"
        }
      }
    ],
    "totalRecords": {
      "conversations": 5,
      "messages": 47,
      "sessions": 1
    }
  }
}
```

**Error Responses**:

```json
// 400 - Missing parameters
{
  "error": "Missing required parameter: userId"
}

// 404 - No data found
{
  "error": "No data found for this user",
  "userId": "session_123"
}

// 500 - Export failed
{
  "error": "Data export failed",
  "message": "Database error"
}
```

---

### Delete User Data

Permanently delete all data associated with a user session.

**Endpoint**: `POST /api/privacy/delete`

**Headers**:
```
Content-Type: application/json
```

**Body Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | User's session ID |
| `domain` | string | Yes | Customer domain |
| `reason` | string | No | Deletion reason |

**Example Request**:
```bash
curl -X POST https://your-domain.com/api/privacy/delete \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "session_123",
    "domain": "store.com",
    "reason": "User requested deletion"
  }'
```

**Success Response**:

**Status**: `200 OK`

```json
{
  "success": true,
  "userId": "session_123",
  "domain": "store.com",
  "deletedAt": "2025-10-24T12:00:00Z",
  "deletedRecords": {
    "conversations": 5,
    "messages": 47,
    "sessions": 1,
    "cache_entries": 12
  },
  "message": "All user data has been permanently deleted"
}
```

**Error Responses**:

```json
// 400 - Missing parameters
{
  "error": "Missing required parameter: userId"
}

// 404 - No data found
{
  "error": "No data found for this user",
  "userId": "session_123"
}

// 500 - Deletion failed
{
  "error": "Data deletion failed",
  "message": "Database error",
  "partialDeletion": true,
  "deletedRecords": {
    "conversations": 5,
    "messages": 47
  }
}
```

---

### Get Retention Policy

Get data retention policy for a domain.

**Endpoint**: `GET /api/privacy/retention`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `domain` | string | Yes | Customer domain |

**Example Request**:
```bash
curl "https://your-domain.com/api/privacy/retention?domain=store.com"
```

**Response**:

```json
{
  "domain": "store.com",
  "policy": {
    "conversationRetentionDays": 30,
    "analyticsRetentionDays": 90,
    "autoDeleteEnabled": true,
    "lastCleanup": "2025-10-23T02:00:00Z"
  },
  "userRights": {
    "allowExport": true,
    "allowDeletion": true,
    "requireConsent": false
  }
}
```

---

## Rate Limiting

All privacy endpoints are rate-limited to prevent abuse:

- **Export**: 10 requests per hour per IP
- **Delete**: 5 requests per hour per IP
- **Retention**: 60 requests per hour per IP

**Rate Limit Headers**:
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
X-RateLimit-Reset: 1698422400
```

**Rate Limit Exceeded Response**:

**Status**: `429 Too Many Requests`

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600,
  "message": "Too many privacy requests. Please try again in 1 hour."
}
```

---

## Compliance Features

### GDPR Compliance

**Article 15 - Right of Access**: `/api/privacy/export`
- Provides all personal data in structured format
- Includes all conversations and metadata
- Machine-readable JSON format

**Article 17 - Right to Erasure**: `/api/privacy/delete`
- Permanently deletes all user data
- Cascade deletes related records
- Audit trail of deletion

**Article 20 - Right to Data Portability**: `/api/privacy/export`
- JSON format for easy data transfer
- Complete data export
- Compatible with other systems

### CCPA Compliance

**Right to Know**: Export endpoint provides complete data
**Right to Delete**: Delete endpoint removes all data
**Right to Opt-Out**: Widget-level opt-out available
**No Sale of Data**: Data never sold or shared

---

## Integration Examples

### JavaScript/TypeScript

```typescript
// Export user data
async function exportUserData(userId: string, domain: string) {
  const response = await fetch(
    `/api/privacy/export?userId=${userId}&domain=${domain}`
  );

  if (!response.ok) {
    throw new Error('Export failed');
  }

  // Download JSON file
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user-data-${userId}.json`;
  a.click();
}

// Delete user data
async function deleteUserData(userId: string, domain: string) {
  const response = await fetch('/api/privacy/delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, domain })
  });

  if (!response.ok) {
    throw new Error('Deletion failed');
  }

  const result = await response.json();
  console.log(`Deleted ${result.deletedRecords.messages} messages`);
  return result;
}
```

### React Component

```tsx
import { useState } from 'react';

export function PrivacyControls({ userId, domain }) {
  const [deleting, setDeleting] = useState(false);

  const handleExport = async () => {
    try {
      const response = await fetch(
        `/api/privacy/export?userId=${userId}&domain=${domain}`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'my-data.json';
      a.click();
    } catch (error) {
      alert('Export failed: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete all your data? This cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await fetch('/api/privacy/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, domain })
      });
      alert('Your data has been deleted');
    } catch (error) {
      alert('Deletion failed: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="privacy-controls">
      <button onClick={handleExport}>
        Download My Data
      </button>
      <button onClick={handleDelete} disabled={deleting}>
        {deleting ? 'Deleting...' : 'Delete My Data'}
      </button>
    </div>
  );
}
```

### Python

```python
import requests

def export_user_data(user_id: str, domain: str) -> dict:
    """Export user data in JSON format"""
    response = requests.get(
        'https://your-domain.com/api/privacy/export',
        params={'userId': user_id, 'domain': domain}
    )
    response.raise_for_status()
    return response.json()

def delete_user_data(user_id: str, domain: str) -> dict:
    """Delete all user data"""
    response = requests.post(
        'https://your-domain.com/api/privacy/delete',
        json={'userId': user_id, 'domain': domain}
    )
    response.raise_for_status()
    return response.json()

# Usage
data = export_user_data('session_123', 'store.com')
print(f"Exported {len(data['data']['conversations'])} conversations")

result = delete_user_data('session_123', 'store.com')
print(f"Deleted {result['deletedRecords']['messages']} messages")
```

---

## Error Handling

### Best Practices

```javascript
async function handlePrivacyRequest(action, userId, domain) {
  try {
    const response = await fetch(`/api/privacy/${action}`, {
      method: action === 'export' ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: action !== 'export' ? JSON.stringify({ userId, domain }) : null
    });

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    // Handle not found
    if (response.status === 404) {
      throw new Error('No data found for this user');
    }

    // Handle server errors
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Request failed');
    }

    return await response.json();
  } catch (error) {
    console.error('Privacy request failed:', error);
    throw error;
  }
}
```

---

## Security Considerations

### Authentication (Optional)

For enhanced security, implement authentication:

```javascript
const response = await fetch('/api/privacy/delete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({ userId, domain })
});
```

### Verification

Implement user verification before deletion:

1. Send verification email
2. User confirms via unique link
3. Execute deletion after confirmation

```typescript
// Step 1: Request deletion
POST /api/privacy/delete/request
{
  "userId": "session_123",
  "email": "user@example.com"
}

// Step 2: User clicks email link
GET /api/privacy/delete/confirm?token=abc123

// Step 3: Deletion executed
```

---

## Monitoring & Logging

### Audit Trail

All privacy operations are logged:

```sql
SELECT * FROM privacy_audit_log
WHERE user_id = 'session_123'
ORDER BY created_at DESC;
```

**Log Entry Example**:
```json
{
  "action": "data_deletion",
  "userId": "session_123",
  "domain": "store.com",
  "timestamp": "2025-10-24T12:00:00Z",
  "status": "success",
  "deletedRecords": {
    "conversations": 5,
    "messages": 47
  },
  "requestedBy": "user_request",
  "ipAddress": "192.168.1.1"
}
```

### Monitoring

Track privacy requests:

```bash
# Daily privacy requests
npx tsx scripts/privacy-metrics.ts daily

# Failed deletions
npx tsx scripts/privacy-metrics.ts failures

# Compliance report
npx tsx scripts/privacy-metrics.ts report
```

---

## Related Documentation

- [Privacy Compliance Guide](../PRIVACY_COMPLIANCE.md)
- [Privacy Guide](../PRIVACY_GUIDE.md)
- [Database Schema](../07-REFERENCE/REFERENCE_DATABASE_SCHEMA.md)
- [Troubleshooting](../06-TROUBLESHOOTING/README.md)

## Support

For privacy API issues:
- Review this documentation
- Check [docs/06-TROUBLESHOOTING/README.md](../06-TROUBLESHOOTING/README.md)
- Report security issues via responsible disclosure

---

**Last Updated**: 2025-10-24
