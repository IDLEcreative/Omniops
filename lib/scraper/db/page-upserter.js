/**
 * Page Upserter Module
 *
 * Saves scraped page data to database with proper metadata and business information.
 * Handles upsert logic to prevent duplicates while updating existing records.
 *
 * @module lib/scraper/db/page-upserter
 */

/**
 * Upserts a scraped page to the database
 *
 * Builds a complete database record with all metadata, business info, and timestamps.
 * Uses URL-based conflict resolution to update existing pages on re-scrape.
 *
 * @param {Object} pageData - Scraped page data from content extractor
 * @param {string} pageData.url - Page URL (unique identifier)
 * @param {string} pageData.title - Page title
 * @param {string} pageData.content - Extracted text content
 * @param {Object} pageData.metadata - Page metadata (description, keywords, etc.)
 * @param {Object} pageData.businessInfo - Extracted business information
 * @param {string|null} domainId - Domain ID for multi-tenant isolation (optional)
 * @param {Object} supabase - Supabase client instance
 * @param {string} jobId - Job ID for logging context
 * @returns {Promise<Object>} Saved page record from database
 * @throws {Error} If database upsert fails
 *
 * @example
 * const savedPage = await upsertPage(
 *   {
 *     url: 'https://example.com/page',
 *     title: 'Example Page',
 *     content: 'Page content...',
 *     metadata: { description: 'Page description' },
 *     businessInfo: { phone: '555-1234' }
 *   },
 *   'domain-123',
 *   supabase,
 *   'job-456'
 * );
 * // => { id: 'page-789', url: 'https://example.com/page', ... }
 */
export async function upsertPage(pageData, domainId, supabase, jobId) {
  // Build database record with all fields
  const dbRecord = {
    url: pageData.url,
    title: pageData.title,
    content: pageData.content,
    metadata: {
      ...(pageData.metadata || {}),
      businessInfo: pageData.businessInfo || {}
    },
    status: 'completed',
    scraped_at: new Date().toISOString(),
    last_scraped_at: new Date().toISOString()
  };

  // Add domain_id only if provided (multi-tenant support)
  if (domainId) {
    dbRecord.domain_id = domainId;
  }

  // Upsert to database (update on conflict, don't ignore duplicates)
  const { data: savedPage, error: pageError } = await supabase
    .from('scraped_pages')
    .upsert(dbRecord, {
      onConflict: 'url',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (pageError) {
    console.error(`[Worker ${jobId}] Error saving page ${pageData.url}:`, pageError);
    throw new Error(`Failed to upsert page: ${pageError.message}`);
  }

  console.log(`[Worker ${jobId}] Saved page to database: ${pageData.url}`);
  return savedPage;
}
