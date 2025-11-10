import { searchAndReturnFullPage } from '@/lib/full-page-retrieval';

export interface MockChunk {
  content: string;
  url: string;
  title: string;
  similarity: number;
  metadata: Record<string, any>;
}

export function buildProductChunks(): MockChunk[] {
  return [
    {
      content: 'Hydraulic pump A4VTG90 - High performance',
      url: 'https://thompsonseparts.co.uk/product/a4vtg90',
      title: 'A4VTG90 Hydraulic Pump',
      similarity: 0.95,
      metadata: { chunk_index: 0, total_chunks: 3, retrieval_strategy: 'full_page' },
    },
    {
      content: 'Technical specifications: 90cc displacement',
      url: 'https://thompsonseparts.co.uk/product/a4vtg90',
      title: 'A4VTG90 Hydraulic Pump',
      similarity: 0.94,
      metadata: { chunk_index: 1, total_chunks: 3, retrieval_strategy: 'full_page' },
    },
    {
      content: 'Price: £450.00 - Available in stock',
      url: 'https://thompsonseparts.co.uk/product/a4vtg90',
      title: 'A4VTG90 Hydraulic Pump',
      similarity: 0.93,
      metadata: { chunk_index: 2, total_chunks: 3, retrieval_strategy: 'full_page' },
    },
  ];
}

export function buildDocumentationChunks(count: number) {
  return Array.from({ length: count }, (_, index) => ({
    content: `Documentation section ${index + 1}`,
    url: 'https://thompsonseparts.co.uk/docs/installation',
    title: 'Installation Guide',
    similarity: 0.9 - index * 0.01,
    metadata: { chunk_index: index, total_chunks: count, retrieval_strategy: 'full_page' },
  }));
}
