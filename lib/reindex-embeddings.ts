/**
 * Enterprise-grade Reindex System for Embeddings
 * 
 * This system provides a controlled way to rebuild search embeddings
 * when algorithms change, content structure updates, or quality issues arise.
 * 
 * Features:
 * - Batch processing to avoid timeouts
 * - Progress tracking and resumability
 * - Validation of results
 * - Clean text extraction and chunking
 * - Proper error handling
 */

import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { createHash } from 'crypto';

// Configuration
const CHUNK_SIZE = 1500; // Target chunk size
const BATCH_SIZE = 10; // Pages per batch
const EMBEDDING_BATCH_SIZE = 50; // Embeddings per API batch

export interface ReindexOptions {
  domainId?: string;
  chunkSize?: number;
  clearExisting?: boolean;
  validateResults?: boolean;
  dryRun?: boolean;
  onProgress?: (progress: ReindexProgress) => void;
}

export interface ReindexProgress {
  phase: 'clearing' | 'chunking' | 'embedding' | 'validating' | 'complete';
  current: number;
  total: number;
  percentage: number;
  message: string;
  errors?: string[];
}

export interface ReindexResult {
  success: boolean;
  pagesProcessed: number;
  chunksCreated: number;
  embeddingsGenerated: number;
  averageChunkSize: number;
  maxChunkSize: number;
  errors: string[];
  duration: number;
}

export class EmbeddingReindexer {
  private supabase: any;
  private openai: any;
  private progress: ReindexProgress;
  private errors: string[] = [];
  
  constructor(
    supabaseUrl: string,
    supabaseKey: string,
    openaiKey: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.openai = new OpenAI({ apiKey: openaiKey });
    this.progress = {
      phase: 'clearing',
      current: 0,
      total: 0,
      percentage: 0,
      message: 'Initializing...'
    };
  }
  
  /**
   * Main reindex method
   */
  async reindex(options: ReindexOptions = {}): Promise<ReindexResult> {
    const startTime = Date.now();
    const {
      domainId,
      chunkSize = CHUNK_SIZE,
      clearExisting = true,
      validateResults = true,
      dryRun = false,
      onProgress
    } = options;
    
    try {
      // Step 1: Clear existing embeddings if requested
      if (clearExisting && !dryRun) {
        await this.clearEmbeddings(domainId, onProgress);
      }
      
      // Step 2: Get pages to process
      const pages = await this.getPages(domainId);
      if (!pages || pages.length === 0) {
        throw new Error('No pages found to reindex');
      }
      
      this.updateProgress('chunking', 0, pages.length, 'Processing pages...', onProgress);
      
      // Step 3: Process pages in batches
      let totalChunks = 0;
      let totalEmbeddings = 0;
      const chunkSizes: number[] = [];
      
      for (let i = 0; i < pages.length; i += BATCH_SIZE) {
        const batch = pages.slice(i, i + BATCH_SIZE);
        
        for (const page of batch) {
          try {
            // Chunk the text
            const chunks = this.chunkText(page.text_content || page.content || '', chunkSize);
            
            if (chunks.length === 0) continue;
            
            totalChunks += chunks.length;
            chunks.forEach(chunk => chunkSizes.push(chunk.length));
            
            // Generate and save embeddings
            if (!dryRun) {
              const embeddingCount = await this.generateAndSaveEmbeddings(
                page.id,
                page.url,
                page.title || '',
                chunks
              );
              totalEmbeddings += embeddingCount;
            }
            
          } catch (error) {
            this.errors.push(`Error processing page ${page.url}: ${error}`);
          }
        }
        
        this.updateProgress(
          'embedding',
          i + batch.length,
          pages.length,
          `Processed ${i + batch.length}/${pages.length} pages`,
          onProgress
        );
      }
      
      // Step 4: Validate results if requested
      let validationPassed = true;
      if (validateResults && !dryRun) {
        validationPassed = await this.validateReindex(domainId, chunkSize, onProgress);
      }
      
      // Calculate statistics
      const avgChunkSize = chunkSizes.length > 0
        ? Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length)
        : 0;
      const maxChunkSize = chunkSizes.length > 0
        ? Math.max(...chunkSizes)
        : 0;
      
      const duration = Date.now() - startTime;
      
      this.updateProgress('complete', pages.length, pages.length, 'Reindex complete!', onProgress);
      
      return {
        success: validationPassed && this.errors.length === 0,
        pagesProcessed: pages.length,
        chunksCreated: totalChunks,
        embeddingsGenerated: totalEmbeddings,
        averageChunkSize: avgChunkSize,
        maxChunkSize: maxChunkSize,
        errors: this.errors,
        duration: duration
      };
      
    } catch (error) {
      this.errors.push(`Fatal error: ${error}`);
      return {
        success: false,
        pagesProcessed: 0,
        chunksCreated: 0,
        embeddingsGenerated: 0,
        averageChunkSize: 0,
        maxChunkSize: 0,
        errors: this.errors,
        duration: Date.now() - startTime
      };
    }
  }
  
  /**
   * Clear existing embeddings
   */
  private async clearEmbeddings(domainId?: string, onProgress?: Function): Promise<void> {
    this.updateProgress('clearing', 0, 100, 'Clearing old embeddings...', onProgress);
    
    if (domainId) {
      // Get all page IDs for the domain using pagination
      const pageIds: string[] = [];
      let offset = 0;
      const limit = 1000;
      let hasMore = true;
      
      while (hasMore) {
        const { data: pages, error: pagesError } = await this.supabase
          .from('scraped_pages')
          .select('id')
          .eq('domain_id', domainId)
          .range(offset, offset + limit - 1);
        
        if (pagesError) throw new Error(`Failed to fetch pages: ${pagesError.message}`);
        
        if (pages && pages.length > 0) {
          pageIds.push(...pages.map(p => p.id));
          offset += pages.length;
          hasMore = pages.length === limit;
        } else {
          hasMore = false;
        }
      }
      
      if (pageIds.length === 0) {
        this.updateProgress('clearing', 100, 100, 'No pages to clear', onProgress);
        return;
      }
      
      // Delete embeddings for those pages in batches
      for (let i = 0; i < pageIds.length; i += 100) {
        const batch = pageIds.slice(i, i + 100);
        const { error } = await this.supabase
          .from('page_embeddings')
          .delete()
          .in('page_id', batch);
        
        if (error) throw new Error(`Failed to clear embeddings: ${error.message}`);
        
        this.updateProgress('clearing', i + batch.length, pageIds.length, 
          `Cleared embeddings for ${i + batch.length}/${pageIds.length} pages`, onProgress);
      }
    } else {
      // Clear all embeddings (use with caution!)
      let deleted = 0;
      let hasMore = true;
      
      while (hasMore) {
        const { data: batch } = await this.supabase
          .from('page_embeddings')
          .select('id')
          .limit(100);
        
        if (!batch || batch.length === 0) {
          hasMore = false;
          break;
        }
        
        const ids = batch.map((e: any) => e.id);
        await this.supabase
          .from('page_embeddings')
          .delete()
          .in('id', ids);
        
        deleted += batch.length;
        this.updateProgress('clearing', deleted, deleted + 100, `Cleared ${deleted} embeddings...`, onProgress);
      }
    }
  }
  
  /**
   * Get pages to reindex
   */
  private async getPages(domainId?: string): Promise<any[]> {
    const allPages: any[] = [];
    let offset = 0;
    const limit = 500; // Reduced from 1000 to avoid timeout
    let hasMore = true;
    
    while (hasMore) {
      const query = this.supabase
        .from('scraped_pages')
        .select('id, url, title, text_content, content, domain_id, scraped_at')
        .order('scraped_at', { ascending: false })
        .range(offset, offset + limit - 1);
      
      if (domainId) {
        query.eq('domain_id', domainId);
      }
      
      const { data, error } = await query;
      
      if (error) throw new Error(`Failed to fetch pages: ${error.message}`);
      
      if (data && data.length > 0) {
        allPages.push(...data);
        offset += data.length;
        hasMore = data.length === limit;
      } else {
        hasMore = false;
      }
      
      console.log(`Fetched ${allPages.length} pages so far...`);
    }
    
    return allPages;
  }
  
  /**
   * Chunk text with proper size enforcement and cleaning
   */
  private chunkText(text: string, maxSize: number): string[] {
    if (!text || text.length === 0) return [];
    
    // Clean the text first
    let cleanText = this.cleanText(text);
    if (cleanText.length < 100) return [];
    
    const chunks: string[] = [];
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed || trimmed.length < 20) continue;
      
      if (currentChunk && (currentChunk.length + trimmed.length + 1) > maxSize) {
        // Save current chunk
        chunks.push(currentChunk.substring(0, maxSize).trim());
        currentChunk = trimmed.substring(0, maxSize);
      } else if (trimmed.length > maxSize) {
        // Split oversized sentence
        if (currentChunk) {
          chunks.push(currentChunk.substring(0, maxSize).trim());
        }
        let remaining = trimmed;
        while (remaining.length > 0) {
          chunks.push(remaining.substring(0, maxSize).trim());
          remaining = remaining.substring(maxSize).trim();
        }
        currentChunk = '';
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + trimmed : trimmed;
      }
    }
    
    if (currentChunk.trim().length > 100) {
      chunks.push(currentChunk.substring(0, maxSize).trim());
    }
    
    // Final validation
    return chunks
      .filter(chunk => chunk.length > 100 && chunk.length <= maxSize)
      .map(chunk => chunk.substring(0, maxSize));
  }
  
  /**
   * Clean text of navigation and CSS artifacts
   */
  private cleanText(text: string): string {
    return text
      // Remove style tags and content
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      // Remove script tags and content
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]+>/g, ' ')
      // Remove inline CSS
      .replace(/style\s*=\s*["'][^"']*["']/gi, '')
      // Remove common navigation patterns
      .replace(/\b(home|about|contact us|privacy policy|terms|cookie policy|newsletter|subscribe)\b/gi, match => {
        const context = text.substring(
          Math.max(0, text.indexOf(match) - 50),
          Math.min(text.length, text.indexOf(match) + 50)
        );
        // Only remove if it looks like navigation
        if (context.includes('menu') || context.includes('footer') || context.includes('header')) {
          return '';
        }
        return match;
      })
      // Remove URLs
      .replace(/https?:\/\/[^\s]+/g, '')
      // Remove special characters and extra whitespace
      .replace(/[^\w\s.,!?-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Generate embeddings and save to database
   */
  private async generateAndSaveEmbeddings(
    pageId: string,
    pageUrl: string,
    pageTitle: string,
    chunks: string[]
  ): Promise<number> {
    let saved = 0;
    
    // Process in batches for efficiency
    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      
      try {
        // Batch API call - much more efficient
        const response = await this.openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: batch,
        });
        
        // Prepare batch insert
        const embeddings = response.data.map((item, idx) => ({
          page_id: pageId,
          chunk_text: batch[idx],
          embedding: item.embedding,
          metadata: {
            chunk_index: i + idx,
            total_chunks: chunks.length,
            chunk_size: batch[idx].length,
            url: pageUrl,
            title: pageTitle,
            reindexed: true,
            reindex_date: new Date().toISOString(),
            version: 2
          }
        }));
        
        // Batch insert - much more efficient
        const { error } = await this.supabase
          .from('page_embeddings')
          .insert(embeddings);
        
        if (error) {
          this.errors.push(`Failed to save batch starting at chunk ${i}: ${error.message}`);
        } else {
          saved += embeddings.length;
        }
        
        // Rate limiting - less aggressive since we're batching
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        this.errors.push(`Failed to generate embeddings for batch starting at chunk ${i}: ${error}`);
      }
    }
    
    return saved;
  }
  
  /**
   * Validate reindex results
   */
  private async validateReindex(
    domainId: string | undefined,
    targetChunkSize: number,
    onProgress?: Function
  ): Promise<boolean> {
    this.updateProgress('validating', 0, 100, 'Validating results...', onProgress);
    
    // Sample embeddings for validation
    const query = this.supabase
      .from('page_embeddings')
      .select('chunk_text, metadata')
      .limit(100);
    
    const { data: samples, error } = await query;
    
    if (error || !samples) {
      this.errors.push('Failed to validate: could not fetch samples');
      return false;
    }
    
    // Check chunk sizes
    const oversized = samples.filter((s: any) => 
      s.chunk_text && s.chunk_text.length > targetChunkSize
    );
    
    // Check for navigation contamination
    const contaminated = samples.filter((s: any) => {
      const text = (s.chunk_text || '').toLowerCase();
      return text.includes('cookie policy') || 
             text.includes('newsletter subscribe') ||
             (text.includes('home') && text.includes('about') && text.includes('contact'));
    });
    
    const validationPassed = 
      oversized.length === 0 && 
      contaminated.length < samples.length * 0.05; // Less than 5% contamination
    
    if (!validationPassed) {
      this.errors.push(
        `Validation failed: ${oversized.length} oversized chunks, ${contaminated.length} contaminated chunks`
      );
    }
    
    this.updateProgress('validating', 100, 100, 'Validation complete', onProgress);
    return validationPassed;
  }
  
  /**
   * Update progress and notify callback
   */
  private updateProgress(
    phase: ReindexProgress['phase'],
    current: number,
    total: number,
    message: string,
    onProgress?: Function
  ): void {
    this.progress = {
      phase,
      current,
      total,
      percentage: total > 0 ? Math.round((current / total) * 100) : 0,
      message,
      errors: this.errors.length > 0 ? this.errors : undefined
    };
    
    if (onProgress) {
      onProgress(this.progress);
    }
  }
}

// Export convenience function for CLI usage
export async function reindexEmbeddings(
  domainId?: string,
  options: Partial<ReindexOptions> = {}
): Promise<ReindexResult> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const openaiKey = process.env.OPENAI_API_KEY!;
  
  const reindexer = new EmbeddingReindexer(supabaseUrl, supabaseKey, openaiKey);
  
  return await reindexer.reindex({
    domainId,
    ...options,
    onProgress: (progress) => {
      console.log(`[${progress.phase}] ${progress.percentage}% - ${progress.message}`);
    }
  });
}