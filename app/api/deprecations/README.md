# Deprecations API Endpoint

**Endpoint:** `GET /api/deprecations`
**Purpose:** Provides information about deprecated features and their removal timeline
**Authentication:** None required (public endpoint)

## Overview

The deprecations endpoint allows developers to programmatically check which features are deprecated, when they will be removed, and what replacements are available.

## Usage

### Request

```bash
GET /api/deprecations
```

No parameters required.

### Response

```json
{
  "success": true,
  "timeline": [
    {
      "feature": "customer_id",
      "phase": "silent",
      "startDate": "2025-11-22T00:00:00.000Z",
      "warnDate": "2026-02-22T00:00:00.000Z",
      "errorDate": "2026-05-22T00:00:00.000Z",
      "removeDate": "2026-11-22T00:00:00.000Z",
      "replacement": "organization_id",
      "daysUntilWarn": 92,
      "daysUntilError": 182,
      "daysUntilRemoval": 365
    }
  ],
  "message": "Deprecation timeline retrieved successfully"
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `feature` | string | Name of the deprecated feature |
| `phase` | string | Current deprecation phase: `silent`, `warn`, `error`, or `removed` |
| `startDate` | string | ISO 8601 date when deprecation started |
| `warnDate` | string | ISO 8601 date when warnings begin in production |
| `errorDate` | string | ISO 8601 date when feature throws errors |
| `removeDate` | string | ISO 8601 date when feature is permanently removed |
| `replacement` | string | Name of the replacement feature to use |
| `daysUntilWarn` | number | Days remaining until warning phase |
| `daysUntilError` | number | Days remaining until error phase |
| `daysUntilRemoval` | number | Days remaining until permanent removal |

## Example Usage

### cURL

```bash
curl https://api.omniops.co.uk/api/deprecations
```

### JavaScript/TypeScript

```typescript
async function checkDeprecations() {
  const response = await fetch('https://api.omniops.co.uk/api/deprecations');
  const data = await response.json();

  for (const item of data.timeline) {
    console.log(`⚠️ ${item.feature} is deprecated`);
    console.log(`   Replace with: ${item.replacement}`);
    console.log(`   Removed in ${item.daysUntilRemoval} days`);
  }
}
```

### Python

```python
import requests

response = requests.get('https://api.omniops.co.uk/api/deprecations')
data = response.json()

for item in data['timeline']:
    print(f"⚠️ {item['feature']} is deprecated")
    print(f"   Replace with: {item['replacement']}")
    print(f"   Removed in {item['daysUntilRemoval']} days")
```

## Integration Tips

### CI/CD Pipeline

Add a deprecation check to your CI/CD pipeline:

```yaml
# .github/workflows/deprecation-check.yml
name: Check Deprecations
on: [push, pull_request]

jobs:
  check-deprecations:
    runs-on: ubuntu-latest
    steps:
      - name: Check for deprecated features
        run: |
          RESPONSE=$(curl -s https://api.omniops.co.uk/api/deprecations)
          DAYS_UNTIL_ERROR=$(echo $RESPONSE | jq '.timeline[0].daysUntilError')

          if [ $DAYS_UNTIL_ERROR -lt 30 ]; then
            echo "⚠️ WARNING: Deprecated features will throw errors in $DAYS_UNTIL_ERROR days"
            exit 1
          fi
```

### Monitoring Alert

Set up alerts based on days remaining:

```typescript
async function checkDeprecationAlert() {
  const response = await fetch('/api/deprecations');
  const { timeline } = await response.json();

  for (const item of timeline) {
    // Alert if less than 30 days until errors
    if (item.daysUntilError < 30) {
      await sendAlert({
        severity: 'high',
        message: `${item.feature} will throw errors in ${item.daysUntilError} days`,
        action: `Migrate to ${item.replacement}`,
      });
    }

    // Critical alert if less than 7 days
    if (item.daysUntilError < 7) {
      await sendAlert({
        severity: 'critical',
        message: `URGENT: ${item.feature} will break in ${item.daysUntilError} days`,
        action: `Immediate migration required to ${item.replacement}`,
      });
    }
  }
}
```

## Related Documentation

- [Deprecation Timeline Guide](../../../docs/02-GUIDES/GUIDE_DEPRECATION_TIMELINE.md)
- [Migration Guide: customer_id → organization_id](../../../docs/02-GUIDES/GUIDE_CUSTOMER_ID_MIGRATION_PLAN.md)
- [Deprecation Utilities](../../../lib/utils/deprecation.ts)

## Error Handling

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to fetch deprecation timeline"
}
```

This indicates a server-side issue. Retry the request or contact support.

---

**Last Updated:** 2025-11-22
**API Version:** v1
