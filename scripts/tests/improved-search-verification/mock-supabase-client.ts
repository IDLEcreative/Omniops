export interface MockQueryCall {
  table: string;
  operation: string;
  timestamp: number;
  filters?: string[];
}

export class MockSupabaseClient {
  private queryCalls: MockQueryCall[] = [];

  private mockDomainData = { id: 'test-domain-id-123' };

  private mockScrapedPages = Array.from({ length: 10 }, (_, i) => {
    const index = i + 1;
    return {
      id: `page-${index}`,
      url: `https://example.com/product/item-${index}`,
      content: `Product ${index} content with SKU: TEST-${index.toString().padStart(3, '0')}
Description: Product ${index} description
Specifications: ${index * 25}cm³/rev, ${100 + index * 25} bar
Price: £${(100 + index * 20).toFixed(2)}`
    };
  });

  private mockEmbeddingChunks = Array.from({ length: 10 }, (_, i) => ({
    page_id: `page-${i + 1}`,
    chunk_text: `Product ${i + 1} chunk 1: SKU: TEST-${(i + 1).toString().padStart(3, '0')}`,
    metadata: { chunk_index: 0 }
  }));

  private mockEmbeddings = Array.from({ length: 10 }, (_, i) => ({
    content: `Product ${i + 1} initial chunk`,
    url: `https://example.com/product/item-${i + 1}`,
    title: `Product ${i + 1}`,
    similarity: 0.85 - i * 0.02
  }));

  private recordQuery(table: string, operation: string, filters?: string[]) {
    this.queryCalls.push({ table, operation, timestamp: Date.now(), filters });
  }

  getQueryCalls(): MockQueryCall[] {
    return this.queryCalls;
  }

  getQueryCount(): number {
    return this.queryCalls.length;
  }

  from(table: string) {
    this.recordQuery(table, 'from');

    return {
      select: (columns?: string) => {
        this.recordQuery(table, 'select', columns ? [columns] : undefined);
        return {
          eq: (column: string, value: any) => {
            this.recordQuery(table, 'eq', [`${column}=${value}`]);
            return {
              single: () => ({
                data: table === 'domains' ? this.mockDomainData : null,
                error: null
              })
            };
          },
          in: (column: string, values: any[]) => {
            this.recordQuery(table, 'in', [`${column} IN [${values.length} items]`]);
            if (table === 'scraped_pages') {
              const filtered = this.mockScrapedPages.filter(p => values.includes(p.url));
              return { data: filtered, error: null };
            }
            if (table === 'page_embeddings') {
              const filtered = this.mockEmbeddingChunks.filter(c => values.includes(c.page_id));
              return {
                data: filtered,
                error: null,
                order: (orderBy: string) => {
                  this.recordQuery(table, 'order', [orderBy]);
                  return { data: filtered, error: null };
                }
              };
            }
            return { data: [], error: null };
          },
          order: (orderBy: string) => {
            this.recordQuery(table, 'order', [orderBy]);
            return { data: [], error: null };
          }
        };
      }
    };
  }

  rpc(functionName: string, params: any) {
    this.recordQuery('rpc', functionName, [JSON.stringify(params).substring(0, 50)]);

    if (functionName === 'search_embeddings') {
      return Promise.resolve({ data: this.mockEmbeddings, error: null });
    }
    return Promise.resolve({ data: null, error: null });
  }
}
