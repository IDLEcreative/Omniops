# Web Scraping API Reference

## Quick Start

```bash
# Scrape a single page
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/about"}'

# Crawl entire website
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "crawl": true, "max_pages": 50}'
```

## Endpoints

### `POST /api/scrape`

Initiate web scraping or crawling operation.

#### Request

```typescript
interface ScrapeRequest {
  url: string;          // Required: URL to scrape
  crawl?: boolean;      // Optional: true for full site crawl, false for single page (default: false)
  max_pages?: number;   // Optional: Maximum pages to crawl, -1 for unlimited (default: 50)
}
```

#### Response

**Single Page Success:**
```typescript
interface SinglePageResponse {
  status: 'completed';
  pages_scraped: number;
  message: string;
}
```

**Crawl Job Started:**
```typescript
interface CrawlJobResponse {
  status: 'started';
  job_id: string;
  message: string;
}
```

**Error Response:**
```typescript
interface ErrorResponse {
  error: string;
  details?: any;
}
```

#### Status Codes

- `200` - Success
- `400` - Invalid request data
- `429` - Rate limit exceeded
- `500` - Internal server error

### `GET /api/scrape?job_id={id}`

Check the status of a crawl job.

#### Request

Query Parameters:
- `job_id` (required): The job ID returned from POST request

#### Response

```typescript
interface CrawlJobStatus {
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;        // 0-100
  total: number;           // Total URLs discovered
  completed: number;       // Successfully scraped
  failed: number;          // Failed to scrape
  skipped: number;         // Skipped (duplicates, excluded)
  startedAt: string;       // ISO 8601 timestamp
  completedAt?: string;    // ISO 8601 timestamp (when finished)
  errors?: Array<{
    url: string;
    error: string;
    timestamp: string;
  }>;
  data?: ScrapedPage[];    // Only included when status is 'completed'
}
```

## Data Structures

### ScrapedPage

```typescript
interface ScrapedPage {
  url: string;
  title: string;
  content: string;         // Markdown formatted content
  textContent?: string;    // Plain text version
  excerpt?: string;        // Short description
  contentHash?: string;    // For deduplication
  wordCount?: number;
  images?: Array<{
    src: string;
    alt: string;
  }>;
  metadata?: {
    author?: string;
    publishedDate?: string;
    modifiedDate?: string;
    lang?: string;
    readingTime?: number;  // in minutes
    [key: string]: any;    // Additional metadata
  };
}
```

## Examples

### JavaScript/TypeScript

```typescript
// Single page scraping
async function scrapePage(url: string) {
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url })
  });
  
  const data = await response.json();
  console.log(data);
}

// Full website crawling
async function crawlWebsite(url: string) {
  // Start crawl
  const response = await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      url, 
      crawl: true, 
      max_pages: 100 
    })
  });
  
  const { job_id } = await response.json();
  
  // Poll for status
  const checkStatus = async () => {
    const statusResponse = await fetch(`/api/scrape?job_id=${job_id}`);
    const status = await statusResponse.json();
    
    if (status.status === 'completed' || status.status === 'failed') {
      console.log('Crawl finished:', status);
      return status;
    }
    
    console.log(`Progress: ${status.progress}% (${status.completed}/${status.total})`);
    setTimeout(checkStatus, 5000); // Check every 5 seconds
  };
  
  checkStatus();
}
```

### Python

```python
import requests
import time
import json

# Single page
def scrape_page(url):
    response = requests.post(
        'http://localhost:3000/api/scrape',
        json={'url': url}
    )
    return response.json()

# Full crawl with polling
def crawl_website(url, max_pages=50):
    # Start crawl
    response = requests.post(
        'http://localhost:3000/api/scrape',
        json={
            'url': url,
            'crawl': True,
            'max_pages': max_pages
        }
    )
    
    job_data = response.json()
    job_id = job_data['job_id']
    
    # Poll for completion
    while True:
        status_response = requests.get(
            f'http://localhost:3000/api/scrape?job_id={job_id}'
        )
        status = status_response.json()
        
        print(f"Progress: {status['progress']}% ({status['completed']}/{status['total']})")
        
        if status['status'] in ['completed', 'failed']:
            return status
            
        time.sleep(5)
```

### cURL

```bash
# Single page
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/page"}'

# Start crawl
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "crawl": true, "max_pages": 50}' \
  | jq -r '.job_id' > job_id.txt

# Check status
curl "http://localhost:3000/api/scrape?job_id=$(cat job_id.txt)" | jq .
```

## Rate Limits

### API Endpoint Limits
- 100 requests per 15 minutes per domain/IP
- Configurable in production

### Crawling Limits
- 20 requests per minute per target domain
- 5 concurrent requests per crawl
- Adaptive delays based on server response

## Error Handling

### Common Errors

| Error Code | Message | Description |
|------------|---------|-------------|
| `INVALID_URL` | Invalid URL provided | URL is malformed or not HTTP/HTTPS |
| `JOB_NOT_FOUND` | Job {id} not found | Job ID doesn't exist or expired |
| `RATE_LIMIT` | Rate limit exceeded | Too many requests |
| `TIMEOUT` | Request timeout | Page took too long to load |
| `CONTENT_ERROR` | Invalid or insufficient content | Page has less than 50 words |
| `DUPLICATE_CONTENT` | Duplicate content found | Content already scraped |

### Error Response Format

```json
{
  "error": "INVALID_URL",
  "message": "Invalid URL provided",
  "details": {
    "url": "not-a-url",
    "validation": "URL must start with http:// or https://"
  }
}
```

## Webhooks (Coming Soon)

Configure webhooks to receive notifications when crawls complete:

```typescript
interface WebhookPayload {
  event: 'crawl.completed' | 'crawl.failed';
  job_id: string;
  status: CrawlJobStatus;
  timestamp: string;
}
```

## Best Practices

1. **Start Small**: Test with a few pages before crawling entire sites
2. **Use Appropriate Limits**: Set `max_pages` based on site size
3. **Handle Errors**: Implement retry logic for failed requests
4. **Poll Efficiently**: Check status every 5-10 seconds, not more frequently
5. **Store Job IDs**: Keep track of job IDs for later reference

## SDK Support

### Node.js SDK (Coming Soon)

```typescript
import { ScrapingClient } from '@your-org/scraping-sdk';

const client = new ScrapingClient({
  apiUrl: 'http://localhost:3000',
  apiKey: 'your-api-key' // When auth is added
});

// Simple usage
const page = await client.scrapePage('https://example.com');

// Advanced crawling
const job = await client.crawlWebsite('https://example.com', {
  maxPages: 100,
  onProgress: (status) => {
    console.log(`Progress: ${status.progress}%`);
  }
});
```

## Postman Collection

Import this collection for easy testing:

```json
{
  "info": {
    "name": "Web Scraping API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Scrape Single Page",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"url\": \"https://example.com/about\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/scrape",
          "host": ["{{baseUrl}}"],
          "path": ["api", "scrape"]
        }
      }
    },
    {
      "name": "Start Website Crawl",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"url\": \"https://example.com\",\n  \"crawl\": true,\n  \"max_pages\": 50\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/scrape",
          "host": ["{{baseUrl}}"],
          "path": ["api", "scrape"]
        }
      }
    },
    {
      "name": "Check Crawl Status",
      "request": {
        "method": "GET",
        "url": {
          "raw": "{{baseUrl}}/api/scrape?job_id={{job_id}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "scrape"],
          "query": [
            {
              "key": "job_id",
              "value": "{{job_id}}"
            }
          ]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3000",
      "type": "string"
    }
  ]
}
```