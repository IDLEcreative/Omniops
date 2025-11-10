export interface ScrapedPage {
  id: string;
  url: string;
  title: string | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
  scraped_at: string | null;
}

export interface DomainInfo {
  id: string;
  domain: string;
  name: string | null;
  last_scraped_at: string | null;
  active: boolean;
}

export interface SearchResult {
  id: string;
  url: string;
  title: string | null;
  content_snippet: string | null;
  similarity_score: number | null;
  content_type: string | null;
  scraped_at: string | null;
}
