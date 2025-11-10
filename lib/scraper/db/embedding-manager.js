/**
 * Embedding Manager - Handles embedding generation, deletion, and storage with retry logic
 * @module lib/scraper/db/embedding-manager
 */

/**
 * Manages embeddings for a scraped page
 *
 * Features:
 * - Checks for existing embeddings before generation
 * - Deletes old embeddings with 3-attempt retry + exponential backoff (1s, 2s, 3s)
 * - Extracts page metadata ONCE for performance (9h → 1.5h optimization)
 * - Throws FATAL errors on retry exhaustion to prevent duplicate embeddings
 *
 * @param {Object} savedPage - Saved page record (must have .id)
 * @param {Object} pageData - Scraped page data (must have .content, optional .title)
 * @param {string} pageUrl - Page URL for logging and metadata
 * @param {string} html - Raw HTML content for enhanced extraction
 * @param {boolean} forceRescrape - Force regeneration of embeddings
 * @param {Object} deps - Dependencies { supabase, jobId, splitIntoChunks, generateEmbeddings, MetadataExtractor }
 * @returns {Promise<void>}
 * @throws {Error} FATAL error if deletion retry fails after 3 attempts
 */
export async function manageEmbeddings(savedPage, pageData, pageUrl, html, forceRescrape, deps) {
  const { supabase, jobId, splitIntoChunks, generateEmbeddings, MetadataExtractor } = deps;

  if (!pageData.content || pageData.content.length === 0) {
    return;
  }

  const { data: existingEmbeddings } = await supabase
    .from('page_embeddings')
    .select('id')
    .eq('page_id', savedPage.id)
    .limit(1);

  const shouldGenerate = !existingEmbeddings || existingEmbeddings.length === 0 || forceRescrape;

  if (!shouldGenerate) {
    return;
  }

  const reason = !existingEmbeddings
    ? 'no existing embeddings'
    : existingEmbeddings.length === 0
    ? 'zero embeddings found'
    : 'FORCE_RESCRAPE=true';

  console.log(`[Worker ${jobId}] 📝 Generating embeddings for ${pageUrl} (reason: ${reason})`);

  // PERFORMANCE: Larger chunks (3000) = fewer embeddings = faster processing
  const chunks = await splitIntoChunks(pageData.content, 3000, pageUrl, html);

  if (chunks.length === 0) {
    return;
  }

  console.log(`[Worker ${jobId}] Generating ${chunks.length} embeddings for ${pageUrl}`);
  const embeddings = await generateEmbeddings(chunks);

  await deleteOldEmbeddingsWithRetry(savedPage.id, supabase, jobId);

  // CRITICAL: Extract metadata ONCE for entire page (9h → 1.5h optimization)
  const pageMetadata = await MetadataExtractor.extractEnhancedMetadata(
    pageData.content,
    pageData.content,
    pageUrl,
    pageData.title || '',
    0,
    chunks.length,
    html
  );

  const embeddingRecords = chunks.map((chunk, index) => ({
    page_id: savedPage.id,
    chunk_text: chunk,
    embedding: embeddings[index],
    metadata: {
      ...pageMetadata,
      chunk_index: index,
      total_chunks: chunks.length,
      chunk_position: index / chunks.length,
      url: pageUrl,
      title: pageData.title
    }
  }));

  const { error: embError } = await supabase
    .from('page_embeddings')
    .insert(embeddingRecords);

  if (embError) {
    console.error(`[Worker ${jobId}] Error saving embeddings:`, embError);
  } else {
    console.log(`[Worker ${jobId}] Created ${chunks.length} embeddings for ${pageUrl}`);
  }
}

/**
 * Deletes old embeddings with retry logic (3 attempts, exponential backoff)
 * @param {string} pageId - Page ID to delete embeddings for
 * @param {Object} supabase - Supabase client
 * @param {string} jobId - Job ID for logging
 * @throws {Error} FATAL error if all 3 retry attempts fail
 * @private
 */
async function deleteOldEmbeddingsWithRetry(pageId, supabase, jobId) {
  const deleteStart = Date.now();
  let deleteAttempts = 0;
  let deleteSuccess = false;

  while (deleteAttempts < 3 && !deleteSuccess) {
    deleteAttempts++;

    try {
      const { error: deleteError, count } = await supabase
        .from('page_embeddings')
        .delete()
        .eq('page_id', pageId);

      if (deleteError) {
        console.error(`[Worker ${jobId}] ❌ Deletion attempt ${deleteAttempts}/3 failed:`, deleteError);

        if (deleteAttempts < 3) {
          const backoffMs = 1000 * deleteAttempts; // Exponential backoff: 1s, 2s, 3s
          console.log(`[Worker ${jobId}]   Retrying in ${backoffMs}ms...`);
          await new Promise(r => setTimeout(r, backoffMs));
        } else {
          // Final attempt failed - ABORT page processing
          throw new Error(
            `FATAL: Failed to delete old embeddings after ${deleteAttempts} attempts. ` +
            `Cannot proceed to prevent duplicates. Error: ${deleteError.message}`
          );
        }
      } else {
        deleteSuccess = true;
        console.log(`[Worker ${jobId}] ✅ Deleted old embeddings in ${Date.now() - deleteStart}ms (attempt ${deleteAttempts})`);
        if (count !== undefined) {
          console.log(`[Worker ${jobId}]   Removed ${count} old embedding(s)`);
        }
      }
    } catch (deleteException) {
      if (deleteAttempts >= 3) {
        throw deleteException; // Re-throw on final attempt
      }
      console.error(`[Worker ${jobId}] ⚠️ Deletion exception on attempt ${deleteAttempts}:`, deleteException);
    }
  }
}
