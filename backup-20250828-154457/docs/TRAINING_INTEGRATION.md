# Training System Integration Guide

## Architecture Overview

The bot training system is designed to improve AI responses by allowing users to add custom content that gets converted into searchable embeddings.

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│     API     │────▶│  Database   │
│  Training   │     │  Endpoints  │     │ (Supabase)  │
│    Page     │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │   OpenAI    │
                    │ Embeddings  │
                    └─────────────┘
```

## Components

### 1. Frontend (`/app/dashboard/training/page.tsx`)
- Multi-tab interface for different input methods
- Real-time status updates
- Training data management UI

### 2. API Routes
- `/api/training` - List all training data
- `/api/training/text` - Add custom text
- `/api/training/qa` - Add Q&A pairs
- `/api/training/[id]` - Delete specific training data

### 3. Database Schema
```sql
training_data
├── id (UUID)
├── user_id (UUID)
├── type (url|file|qa|text)
├── content (TEXT)
├── status (pending|processing|completed|error)
├── metadata (JSONB)
└── timestamps

content_embeddings
├── id (UUID)
├── content_id (UUID)
├── chunk_text (TEXT)
├── embedding (vector)
└── metadata (JSONB)
```

### 4. Embedding Generation
Uses OpenAI's text-embedding-3-small model to convert text into searchable vectors.

## Integration Points

### 1. Chat API Integration
The chat API (`/api/chat/route.ts`) searches training data:

```typescript
// Search for relevant training content
const embeddingResults = await searchSimilarContent(
  message,
  domainId,
  3, // Top 3 results
  0.7 // Similarity threshold
);
```

### 2. Scraping Integration
Training can trigger website scraping:

```typescript
// In training page
const response = await fetch('/api/scrape', {
  method: 'POST',
  body: JSON.stringify({ url, fullSite: true })
});
```

### 3. Authentication
All training endpoints require authentication:

```typescript
const { data: { user } } = await supabase.auth.getUser();
if (!user) {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}
```

## Data Flow

### Adding Training Data
1. User submits content via UI
2. API creates database record with status "processing"
3. Content is chunked if necessary
4. OpenAI generates embeddings
5. Embeddings stored in database
6. Status updated to "completed"

### Using Training Data
1. User sends chat message
2. Message converted to embedding
3. Vector similarity search finds relevant training data
4. Context added to AI prompt
5. AI generates response using training context

## Configuration

### Environment Variables
```bash
# Required for embeddings
OPENAI_API_KEY=sk-...

# Required for database
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Database Functions
```sql
-- Vector similarity search
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(1536),
  domain_id uuid,
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  content text,
  url text,
  title text,
  similarity float
)
```

## Security Considerations

### Row Level Security
- Users can only view/edit their own training data
- Service role required for embedding generation
- API routes validate user authentication

### Input Validation
- Content length limits
- Type validation (url|file|qa|text)
- Sanitization of user inputs

## Performance Optimization

### Embedding Generation
- Batch processing for multiple chunks
- Async processing to avoid blocking
- Error recovery mechanisms

### Search Performance
- Vector indexes on embeddings
- Similarity threshold filtering
- Result count limiting

## Monitoring

### Key Metrics
- Training data count per user
- Embedding generation success rate
- Average processing time
- Search performance metrics

### Error Tracking
```typescript
console.error('Error generating embeddings:', error);
// Update status to error with details
await adminSupabase
  .from('training_data')
  .update({ 
    status: 'error',
    metadata: { error: error.message }
  });
```

## Extending the System

### Adding New Content Types
1. Update database enum constraint
2. Create new API endpoint
3. Add UI tab in training page
4. Implement processing logic

### Custom Processing
Example: Adding PDF support
```typescript
// New endpoint: /api/training/pdf
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  
  // Extract text from PDF
  const text = await extractPdfText(file);
  
  // Generate embeddings
  await generateEmbeddings({
    contentId: trainingData.id,
    content: text,
    url: `pdf-${file.name}`,
    title: file.name
  });
}
```

## Troubleshooting

### Common Issues

1. **Embeddings not generating**
   - Check OpenAI API key
   - Verify rate limits
   - Check error logs

2. **Training data not appearing in chat**
   - Ensure status is "completed"
   - Check similarity threshold
   - Verify search function

3. **Slow processing**
   - Reduce chunk size
   - Implement queuing system
   - Add caching layer

## Future Enhancements

### Planned Features
- File upload support (PDF, DOC)
- Bulk import/export
- Training analytics dashboard
- A/B testing for responses
- Multi-language support

### Scalability Considerations
- Move to dedicated embedding service
- Implement Redis caching
- Add background job queue
- Horizontal scaling for API