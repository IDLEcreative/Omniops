# Bot Training Guide

## Overview

The Bot Training feature allows you to customize and improve your AI assistant's responses by providing it with specific content, Q&A pairs, and documents. This ensures your bot gives accurate, brand-aligned responses to customer queries.

## Table of Contents
- [Getting Started](#getting-started)
- [Training Methods](#training-methods)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites
1. Active Supabase account with the training_data table created
2. Authentication configured (users must be logged in)
3. OpenAI API key for embedding generation

### Setting Up
1. Run the database migration:
   ```sql
   -- Execute the contents of supabase-training-schema.sql in your Supabase SQL editor
   ```

2. Navigate to the training section:
   ```
   http://localhost:3000/dashboard/training
   ```

## Training Methods

### 1. Website Scraping
Train your bot by crawling entire websites to extract relevant content.

**How to use:**
1. Click the "Website" tab
2. Enter the full URL (e.g., `https://example.com`)
3. Click "Scrape"
4. The system will crawl the site and extract all relevant content

**What happens:**
- The crawler fetches all pages from the website
- Content is processed and converted to embeddings
- The bot can now answer questions based on this content

**Use cases:**
- Import your existing website content
- Add competitor information for comparison
- Include industry resources

### 2. File Upload
Upload documents directly to train your bot.

**Supported formats:**
- PDF documents
- Word documents (.doc, .docx)
- Text files (.txt)
- CSV files for structured data

**How to use:**
1. Click the "Files" tab
2. Drag and drop files or click to browse
3. Files are processed automatically

**Limitations:**
- Maximum file size: 10MB per file
- Files are converted to text for processing

### 3. Q&A Pairs
Add specific questions and answers for precise responses.

**How to use:**
1. Click the "Q&A" tab
2. Enter a question your customers might ask
3. Provide the exact answer you want the bot to give
4. Click "Add Q&A"

**Examples:**
```
Question: What is your return policy?
Answer: We offer a 30-day money-back guarantee on all products. Items must be unused and in original packaging. Shipping costs are non-refundable.

Question: Do you ship internationally?
Answer: Yes, we ship to over 50 countries worldwide. International shipping typically takes 7-14 business days. Customs fees may apply.
```

**Best for:**
- FAQs
- Specific policy information
- Complex answers that need exact wording

### 4. Custom Text
Add any text content directly for training.

**How to use:**
1. Click the "Text" tab
2. Paste or type any content
3. Click "Save Content"

**Use cases:**
- Product descriptions
- Company information
- Service details
- Internal documentation

## API Reference

### Get Training Data
```http
GET /api/training
Authorization: Bearer {token}

Response:
{
  "items": [
    {
      "id": "uuid",
      "type": "url|file|qa|text",
      "content": "Preview of content",
      "status": "pending|processing|completed|error",
      "createdAt": "2024-01-20T10:00:00Z",
      "metadata": {}
    }
  ]
}
```

### Add Text Content
```http
POST /api/training/text
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "Your custom text content here"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "text",
    "content": "Preview...",
    "status": "processing",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

### Add Q&A Pair
```http
POST /api/training/qa
Authorization: Bearer {token}
Content-Type: application/json

{
  "question": "What are your business hours?",
  "answer": "We're open Monday-Friday 9AM-5PM EST"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "type": "qa",
    "content": "What are your business hours?",
    "status": "processing",
    "createdAt": "2024-01-20T10:00:00Z"
  }
}
```

### Delete Training Data
```http
DELETE /api/training/{id}
Authorization: Bearer {token}

Response:
{
  "success": true
}
```

## Database Schema

### training_data table
```sql
CREATE TABLE training_data (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  type TEXT CHECK (type IN ('url', 'file', 'qa', 'text')),
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### page_embeddings table
Stores vector embeddings for semantic search:
```sql
CREATE TABLE page_embeddings (
  id UUID PRIMARY KEY,
  page_id UUID,
  chunk_text TEXT,
  embedding vector(1536),
  metadata JSONB
);
```

## Best Practices

### Content Quality
1. **Be Specific**: Provide detailed, accurate information
2. **Stay Current**: Regularly update training data
3. **Avoid Duplication**: Remove redundant content
4. **Use Natural Language**: Write as you would speak to customers

### Q&A Guidelines
- Cover common customer questions
- Include variations of the same question
- Provide complete answers with all necessary details
- Update answers when policies change

### Performance Tips
- Batch similar content together
- Use structured data (Q&A) for critical information
- Remove outdated training data regularly
- Monitor bot responses and refine as needed

### Security Considerations
- Never include sensitive data (passwords, API keys)
- Avoid personal customer information
- Review all content before training
- Use role-based access for team members

## Troubleshooting

### Common Issues

**Training data stuck in "processing"**
- Check OpenAI API key is valid
- Verify Supabase connection
- Look for errors in server logs

**Bot not using training data**
- Ensure embeddings were generated successfully
- Check that training status is "completed"
- Verify the chat API is searching embeddings

**Slow response times**
- Reduce total amount of training data
- Optimize content by removing duplicates
- Check embedding search performance

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "Content is required" | Empty input submitted | Provide valid content |
| "Unauthorized" | Not logged in | Sign in to your account |
| "Failed to generate embeddings" | OpenAI API issue | Check API key and limits |
| "Failed to create training data" | Database error | Check Supabase connection |

## Advanced Features

### Bulk Import
For large datasets, use the scraping API directly:
```javascript
// Example: Bulk import multiple URLs
const urls = ['https://site1.com', 'https://site2.com'];
for (const url of urls) {
  await fetch('/api/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, fullSite: true })
  });
}
```

### Custom Processing
Extend the training system:
1. Add new content types in the database enum
2. Create specialized processing endpoints
3. Implement custom embedding strategies

### Analytics Integration
Track training effectiveness:
- Monitor which training data is used most
- Analyze confidence scores
- Identify knowledge gaps
- A/B test different training approaches

## Maintenance

### Regular Tasks
1. **Weekly**: Review and update Q&A pairs
2. **Monthly**: Remove outdated content
3. **Quarterly**: Full content audit
4. **As Needed**: Add new product/service information

### Monitoring
- Check training data status regularly
- Monitor embedding generation logs
- Track bot performance metrics
- Collect user feedback on responses

## Conclusion

Effective bot training is key to providing excellent customer service. Start with your most important content, regularly update your training data, and monitor performance to ensure your AI assistant delivers accurate, helpful responses.

For additional support, contact support@omnio.com or visit our help center.