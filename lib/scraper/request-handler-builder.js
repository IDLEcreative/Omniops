/**
 * Request Handler Builder - Composes all scraper modules into the main request handler
 * @module lib/scraper/request-handler-builder
 */

import { checkPageCache } from './cache-checker.js';
import { blockResources } from './resource-blocker.js';
import { scrapePage } from './page-scraper.js';
import { trackProgress } from './progress-tracker.js';
import { adjustConcurrency } from './concurrency-adjuster.js';
import { enqueueMoreLinks } from './link-enqueuer.js';
import { resolveDomain } from './db/domain-resolver.js';
import { upsertPage } from './db/page-upserter.js';
import { manageEmbeddings } from './db/embedding-manager.js';
import { extractBusinessInfo } from './content-extraction/index.js';
import { splitIntoChunks } from './utils/chunking.js';
import { generateEmbeddings } from './utils/embeddings.js';

/**
 * Builds the main request handler function for the crawler
 *
 * @param {Object} deps - All dependencies
 * @param {Object} deps.supabase - Supabase client
 * @param {string} deps.jobId - Job ID for logging
 * @param {Object} deps.concurrencyManager - Concurrency manager instance
 * @param {Set} deps.visited - Set of visited URLs
 * @param {Array} deps.results - Array of scraped results
 * @param {Object} deps.redis - Redis client
 * @param {number} deps.maxPagesToScrape - Maximum pages to scrape
 * @param {boolean} deps.forceRescrape - Force re-scraping
 * @param {Object} deps.MetadataExtractor - Metadata extractor class
 * @param {Object} deps.openai - OpenAI client
 * @returns {Function} Request handler function for PlaywrightCrawler
 */
export function buildRequestHandler(deps) {
  const {
    supabase,
    jobId,
    concurrencyManager,
    visited,
    results,
    redis,
    maxPagesToScrape,
    forceRescrape,
    MetadataExtractor,
    openai
  } = deps;

  return async function requestHandler({ request, page, enqueueLinks }) {
    const pageUrl = request.url;

    // Skip if already visited
    if (visited.has(pageUrl)) {
      console.log(`[Worker ${jobId}] Skipping duplicate: ${pageUrl}`);
      return;
    }
    visited.add(pageUrl);

    // Check cache unless forced
    if (!forceRescrape) {
      const shouldSkip = await checkPageCache(pageUrl, supabase, jobId);
      if (shouldSkip) {
        concurrencyManager.recordSuccess();
        return;
      }
    } else {
      console.log(`[Worker ${jobId}] Force re-scrape enabled; bypassing recency checks for ${pageUrl}`);
    }

    console.log(`[Worker ${jobId}] Scraping: ${pageUrl}`);

    try {
      // Block unnecessary resources
      await blockResources(page);

      // Scrape page content
      const { pageData, html, businessInfo } = await scrapePage(page, pageUrl, jobId);

      // Resolve domain ID
      const domainId = await resolveDomain(pageUrl, supabase);

      // Save to database immediately
      try {
        // Prepare database record
        const dbRecord = {
          url: pageData.url,
          title: pageData.title,
          content: pageData.content,
          metadata: {
            ...(pageData.metadata || {}),
            businessInfo: businessInfo || {}
          },
          status: 'completed',
          scraped_at: new Date().toISOString(),
          last_scraped_at: new Date().toISOString()
        };

        if (domainId) {
          dbRecord.domain_id = domainId;
        }

        // Upsert page to database
        const savedPage = await upsertPage(dbRecord, supabase, jobId, pageUrl);

        if (savedPage) {
          console.log(`[Worker ${jobId}] Saved page to database: ${pageUrl}`);

          // Manage embeddings (check, delete old, create new)
          await manageEmbeddings(savedPage, pageData, pageUrl, html, forceRescrape, {
            supabase,
            jobId,
            splitIntoChunks: (content, maxSize, url, htmlContent) =>
              splitIntoChunks(content, maxSize, url, htmlContent, jobId),
            generateEmbeddings: (chunks) => generateEmbeddings(chunks, openai, jobId),
            MetadataExtractor
          });
        }
      } catch (saveError) {
        const errorMessage = saveError.message || String(saveError);

        // Check if this was a fatal deletion error
        const isFatalDeletionError = errorMessage.includes('FATAL: Failed to delete old embeddings');

        if (isFatalDeletionError) {
          console.error(`[Worker ${jobId}] 🚨 FATAL DELETION ERROR for ${pageUrl}`);
          console.error(`[Worker ${jobId}]   This page will be marked as failed to prevent duplicate embeddings`);

          // Mark page as failed (not deleted)
          try {
            await supabase
              .from('scraped_pages')
              .upsert({
                domain_id: domainId,
                url: pageUrl,
                status: 'failed',
                error_message: 'Embedding deletion failed - preventing duplicates',
                last_scraped_at: new Date().toISOString(),
              });
          } catch (upsertError) {
            console.error(`[Worker ${jobId}]   Failed to mark page as failed:`, upsertError);
          }
        } else {
          console.error(`[Worker ${jobId}] Failed to save page ${pageUrl}:`, saveError);
        }
      }

      // Still track in results for progress counting
      results.push(pageData);

      // Track progress
      await trackProgress(results.length, maxPagesToScrape, concurrencyManager, redis, jobId);

      // Record success and adjust concurrency
      concurrencyManager.recordSuccess();
      await adjustConcurrency(concurrencyManager, jobId);

      // Enqueue more links if we haven't reached the limit
      await enqueueMoreLinks(
        enqueueLinks,
        maxPagesToScrape,
        results.length,
        jobId
      );
    } catch (error) {
      const errorMessage = error.message || String(error);

      // Enhanced 404 detection
      const is404 =
        errorMessage.includes('404') ||
        errorMessage.includes('Not Found') ||
        errorMessage.includes('PAGE_NOT_FOUND') ||
        error.statusCode === 404 ||
        error.response?.status === 404;

      const isDeleted =
        errorMessage.includes('410') ||
        errorMessage.includes('Gone') ||
        error.statusCode === 410;

      const status = (is404 || isDeleted) ? 'deleted' : 'failed';

      console.log(`[Worker ${jobId}] ${is404 || isDeleted ? '🗑️' : '❌'} Page ${status}: ${pageUrl}`);
      if (is404 || isDeleted) {
        console.log(`[Worker ${jobId}]   Reason: HTTP ${error.statusCode || '404/410'}`);
      }

      // Get domain_id for the page
      const domainId = await resolveDomain(pageUrl, supabase);

      // Mark page as deleted/failed
      if (domainId) {
        const { error: updateError } = await supabase
          .from('scraped_pages')
          .upsert({
            domain_id: domainId,
            url: pageUrl,
            status: status,
            error_message: errorMessage,
            last_scraped_at: new Date().toISOString(),
          }, {
            onConflict: 'domain_id,url',
            ignoreDuplicates: false
          });

        if (updateError) {
          console.error(`[Worker ${jobId}] Error marking page as ${status}:`, updateError);
        }

        // Delete embeddings for deleted pages immediately
        if (is404 || isDeleted) {
          console.log(`[Worker ${jobId}]   Deleting embeddings for deleted page`);

          const { data: pageData } = await supabase
            .from('scraped_pages')
            .select('id')
            .eq('url', pageUrl)
            .eq('domain_id', domainId)
            .single();

          if (pageData?.id) {
            const { error: deleteEmbError } = await supabase
              .from('page_embeddings')
              .delete()
              .eq('page_id', pageData.id);

            if (!deleteEmbError) {
              console.log(`[Worker ${jobId}]   ✅ Embeddings deleted for 404 page`);
            } else {
              console.error(`[Worker ${jobId}]   Error deleting embeddings:`, deleteEmbError);
            }
          }
        }
      }

      console.error(`[Worker ${jobId}] Error processing ${pageUrl}:`, error);
      concurrencyManager.recordError();
    }
  };
}
