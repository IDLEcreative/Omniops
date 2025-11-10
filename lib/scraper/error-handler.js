/**
 * Error Handler
 *
 * Handles scraping errors, detects 404/410 pages, updates database status,
 * and cleans up embeddings for deleted pages.
 */

/**
 * Handles errors during page scraping
 *
 * Detects 404/410 (deleted pages), marks pages as failed/deleted in database,
 * cleans up embeddings for deleted pages, and records errors for concurrency adjustment.
 *
 * @param {Error} error - The error that occurred during scraping
 * @param {string} pageUrl - URL of the page that failed
 * @param {Object} deps - Dependencies
 * @param {Object} deps.supabase - Supabase client
 * @param {string} deps.jobId - Job ID for logging
 * @param {Object} deps.concurrencyManager - Concurrency manager instance
 * @param {Function} deps.resolveDomainId - Domain ID resolver function
 * @returns {Promise<void>}
 *
 * @example
 * try {
 *   await scrapePage();
 * } catch (error) {
 *   await handleScrapingError(error, pageUrl, {
 *     supabase,
 *     jobId,
 *     concurrencyManager,
 *     resolveDomainId
 *   });
 * }
 *
 * @notes
 * - Detects 404/410 using multiple patterns (message, statusCode, response.status)
 * - Marks pages as 'deleted' (404/410) or 'failed' (other errors)
 * - Immediately cleans up embeddings for deleted pages
 * - Records error in concurrencyManager for adaptive concurrency
 * - Gracefully handles missing domain IDs
 */
export async function handleScrapingError(error, pageUrl, deps) {
  const { supabase, jobId, concurrencyManager, resolveDomainId } = deps;

  // Extract error message
  const errorMessage = error.message || String(error);

  // Enhanced 404 detection - Check multiple indicators
  const is404 =
    errorMessage.includes('404') ||
    errorMessage.includes('Not Found') ||
    errorMessage.includes('PAGE_NOT_FOUND') ||
    error.statusCode === 404 ||
    error.response?.status === 404;

  // Detect 410 Gone status (permanently deleted)
  const isDeleted =
    errorMessage.includes('410') ||
    errorMessage.includes('Gone') ||
    error.statusCode === 410;

  // Determine final status
  const status = (is404 || isDeleted) ? 'deleted' : 'failed';
  const isPageDeleted = is404 || isDeleted;

  // Log error with appropriate emoji
  const emoji = isPageDeleted ? '🗑️' : '❌';
  console.log(`[Worker ${jobId}] ${emoji} Page ${status}: ${pageUrl}`);

  if (isPageDeleted) {
    const httpCode = error.statusCode || '404/410';
    console.log(`[Worker ${jobId}]   Reason: HTTP ${httpCode}`);
  }

  // Resolve domain ID using centralized resolver
  const domainId = await resolveDomainId(pageUrl, supabase);

  if (!domainId) {
    // Can't update database without domain ID - log and continue
    console.warn(`[Worker ${jobId}]   Cannot update database - domain ID not found for: ${pageUrl}`);
    console.error(`[Worker ${jobId}] Error processing ${pageUrl}:`, error);
    concurrencyManager.recordError();
    return;
  }

  // Mark page as deleted/failed in database
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

  // Clean up embeddings for deleted pages immediately
  if (isPageDeleted) {
    await cleanupDeletedPageEmbeddings(pageUrl, domainId, { supabase, jobId });
  }

  // Log final error details
  console.error(`[Worker ${jobId}] Error processing ${pageUrl}:`, error);

  // Record error for concurrency adjustment
  concurrencyManager.recordError();
}

/**
 * Cleans up embeddings for a deleted page
 *
 * Queries for the page ID and deletes all associated embeddings.
 * This prevents stale embeddings from appearing in search results.
 *
 * @param {string} pageUrl - URL of the deleted page
 * @param {string} domainId - Domain ID for the page
 * @param {Object} deps - Dependencies
 * @param {Object} deps.supabase - Supabase client
 * @param {string} deps.jobId - Job ID for logging
 * @returns {Promise<void>}
 *
 * @private
 */
async function cleanupDeletedPageEmbeddings(pageUrl, domainId, deps) {
  const { supabase, jobId } = deps;

  console.log(`[Worker ${jobId}]   Deleting embeddings for deleted page`);

  // Query for page ID
  const { data: pageData, error: queryError } = await supabase
    .from('scraped_pages')
    .select('id')
    .eq('url', pageUrl)
    .eq('domain_id', domainId)
    .single();

  if (queryError || !pageData?.id) {
    console.warn(`[Worker ${jobId}]   Page ID not found - embeddings may not exist yet`);
    return;
  }

  // Delete all embeddings for this page
  const { error: deleteEmbError } = await supabase
    .from('page_embeddings')
    .delete()
    .eq('page_id', pageData.id);

  if (deleteEmbError) {
    console.error(`[Worker ${jobId}]   Error deleting embeddings:`, deleteEmbError);
  } else {
    console.log(`[Worker ${jobId}]   ✅ Embeddings deleted for 404 page`);
  }
}
