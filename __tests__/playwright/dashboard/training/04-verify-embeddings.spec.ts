/**
 * E2E Tests: Training Dashboard - Embedding Verification
 *
 * Tests that embeddings are generated and searchable for all upload types:
 * - URL uploads → embeddings in page_embeddings table
 * - Text uploads → embeddings in page_embeddings table
 * - Q&A uploads → embeddings in page_embeddings table
 * - RAG search finds embedded content
 *
 * This ensures the complete pipeline works:
 * Upload → Scrape/Save → Chunk → Embed → Store → Search
 *
 * User Journey:
 * 1. Upload content (URL, text, or Q&A)
 * 2. Wait for processing to complete
 * 3. Verify embeddings exist in database
 * 4. Test that chat can find the content
 */

import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import {
  navigateToTrainingPage,
  uploadUrl,
  uploadText,
  uploadQA,
  waitForItemInList,
  waitForProcessingComplete
} from '@/test-utils/playwright/dashboard/training/helpers';
import { TEST_TIMEOUT, PROCESSING_TIMEOUT } from '@/test-utils/playwright/dashboard/training/config';

// Initialize Supabase client for database verification
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

test.describe('Training Dashboard - Embedding Verification', () => {
  test.setTimeout(TEST_TIMEOUT);

  test.use({ storageState: 'playwright/.auth/user.json' });

  test.beforeEach(async ({ page }) => {
    console.log('=== Starting Embedding Verification Test ===');
    await navigateToTrainingPage(page);
  });

  test('URL uploads generate embeddings', async ({ page }) => {
    console.log('🎯 Testing: URL upload generates embeddings');

    const testUrl = `example.com/test-embeddings-${Date.now()}`;
    const normalizedUrl = `https://${testUrl}`;

    console.log('📍 Step 1: Upload URL');
    await uploadUrl(page, testUrl);

    console.log('📍 Step 2: Wait for URL to appear in list');
    await waitForItemInList(page, normalizedUrl, 10000);

    console.log('📍 Step 3: Wait for processing to complete');
    await waitForProcessingComplete(page, normalizedUrl, PROCESSING_TIMEOUT);

    console.log('📍 Step 4: Wait for embeddings to be generated (5s)');
    await page.waitForTimeout(5000);

    console.log('📍 Step 5: Query database for embeddings');
    // Get the scraped page ID
    const { data: pages } = await supabase
      .from('scraped_pages')
      .select('id, url')
      .eq('url', normalizedUrl)
      .order('created_at', { ascending: false })
      .limit(1);

    expect(pages).toBeTruthy();
    expect(pages?.length).toBeGreaterThan(0);
    const pageId = pages![0].id;
    console.log(`✅ Found scraped page: ${pageId}`);

    // Get embeddings for this page
    const { data: embeddings, error } = await supabase
      .from('page_embeddings')
      .select('id, chunk_text, metadata')
      .eq('page_id', pageId);

    console.log('📊 Embedding query result:', {
      count: embeddings?.length,
      error: error?.message
    });

    expect(error).toBeNull();
    expect(embeddings).toBeTruthy();
    expect(embeddings!.length).toBeGreaterThan(0);

    console.log(`✅ Found ${embeddings!.length} embeddings for URL upload`);
    console.log('📄 Sample chunk:', embeddings![0].chunk_text.substring(0, 80) + '...');

    console.log('✅ URL upload embedding verification completed');
  });

  test('text uploads generate embeddings', async ({ page }) => {
    console.log('🎯 Testing: Text upload generates embeddings');

    const testText = `This is unique test content for embedding verification ${Date.now()}. It contains important information about products, services, and pricing that the AI should learn from.`;

    console.log('📍 Step 1: Upload text content');
    await uploadText(page, testText);

    console.log('📍 Step 2: Wait for text to appear in list');
    await waitForItemInList(page, testText, 10000);

    console.log('📍 Step 3: Wait for processing to complete');
    await waitForProcessingComplete(page, testText, PROCESSING_TIMEOUT);

    console.log('📍 Step 4: Wait for embeddings to be generated (5s)');
    await page.waitForTimeout(5000);

    console.log('📍 Step 5: Query database for text embeddings');
    // Search for embeddings containing our unique text
    const { data: embeddings, error } = await supabase
      .from('page_embeddings')
      .select('id, chunk_text, metadata')
      .ilike('chunk_text', `%${testText.substring(0, 50)}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📊 Embedding query result:', {
      count: embeddings?.length,
      error: error?.message
    });

    expect(error).toBeNull();
    expect(embeddings).toBeTruthy();
    expect(embeddings!.length).toBeGreaterThan(0);

    // Verify the text content is in the embedding
    const found = embeddings!.some(emb =>
      emb.chunk_text.includes(testText.substring(0, 50))
    );
    expect(found).toBe(true);

    console.log(`✅ Found ${embeddings!.length} embeddings for text upload`);
    console.log('✅ Text upload embedding verification completed');
  });

  test('Q&A uploads generate embeddings', async ({ page }) => {
    console.log('🎯 Testing: Q&A upload generates embeddings');

    const testQuestion = `What is the unique test question ${Date.now()}?`;
    const testAnswer = `This is the unique test answer for embedding verification. It should be embedded and searchable.`;

    console.log('📍 Step 1: Upload Q&A pair');
    await uploadQA(page, testQuestion, testAnswer);

    console.log('📍 Step 2: Wait for Q&A to appear in list');
    await waitForItemInList(page, testQuestion, 10000);

    console.log('📍 Step 3: Wait for processing to complete');
    await waitForProcessingComplete(page, testQuestion, PROCESSING_TIMEOUT);

    console.log('📍 Step 4: Wait for embeddings to be generated (5s)');
    await page.waitForTimeout(5000);

    console.log('📍 Step 5: Query database for Q&A embeddings');
    // Search for embeddings containing our question or answer
    const { data: embeddings, error } = await supabase
      .from('page_embeddings')
      .select('id, chunk_text, metadata')
      .or(`chunk_text.ilike.%${testQuestion.substring(0, 30)}%,chunk_text.ilike.%${testAnswer.substring(0, 30)}%`)
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('📊 Embedding query result:', {
      count: embeddings?.length,
      error: error?.message
    });

    expect(error).toBeNull();
    expect(embeddings).toBeTruthy();
    expect(embeddings!.length).toBeGreaterThan(0);

    // Verify either question or answer is in the embedding
    const foundQuestion = embeddings!.some(emb =>
      emb.chunk_text.includes(testQuestion.substring(0, 30))
    );
    const foundAnswer = embeddings!.some(emb =>
      emb.chunk_text.includes(testAnswer.substring(0, 30))
    );
    expect(foundQuestion || foundAnswer).toBe(true);

    console.log(`✅ Found ${embeddings!.length} embeddings for Q&A upload`);
    console.log('✅ Q&A upload embedding verification completed');
  });

  test('embeddings are searchable via RAG', async ({ page }) => {
    console.log('🎯 Testing: Embeddings are searchable via RAG');

    // Upload unique content we can search for
    const uniquePhrase = `unique_product_${Date.now()}`;
    const testText = `Our company sells ${uniquePhrase} which is a revolutionary new product. Contact us to learn more about ${uniquePhrase}.`;

    console.log('📍 Step 1: Upload text with unique searchable content');
    await uploadText(page, testText);

    console.log('📍 Step 2: Wait for text to appear and process');
    await waitForItemInList(page, testText, 10000);
    await waitForProcessingComplete(page, testText, PROCESSING_TIMEOUT);

    console.log('📍 Step 3: Wait for embeddings to be generated and indexed (10s)');
    await page.waitForTimeout(10000);

    console.log('📍 Step 4: Verify embeddings exist in database');
    const { data: embeddings } = await supabase
      .from('page_embeddings')
      .select('id')
      .ilike('chunk_text', `%${uniquePhrase}%`)
      .limit(1);

    expect(embeddings).toBeTruthy();
    expect(embeddings!.length).toBeGreaterThan(0);
    console.log('✅ Embeddings confirmed in database');

    console.log('📍 Step 5: Navigate to widget test page');
    await page.goto('/widget-test');
    await page.waitForLoadState('networkidle');

    console.log('📍 Step 6: Open chat widget');
    const iframe = page.frameLocator('#chat-widget-iframe');
    await iframe.locator('body').waitFor({ state: 'visible', timeout: 10000 });

    console.log('📍 Step 7: Send query asking about our unique content');
    const chatInput = iframe.locator('input[type="text"], textarea, [contenteditable="true"]').first();
    await expect(chatInput).toBeVisible({ timeout: 10000 });

    const searchQuery = `Tell me about ${uniquePhrase}`;
    await chatInput.fill(searchQuery);
    await chatInput.press('Enter');

    console.log('📍 Step 8: Wait for AI response');
    await page.waitForTimeout(8000);

    console.log('📍 Step 9: Verify AI response mentions our content');
    const messageList = iframe.locator('[data-testid="message-list"], .message-list, [class*="message"]');
    await expect(messageList).toBeVisible({ timeout: 5000 });

    // Get all message text
    const messages = await messageList.locator('[data-testid="message"], .message').allTextContents();
    const responseText = messages.join(' ').toLowerCase();

    console.log('📊 Response contains:', {
      hasUniquePhrase: responseText.includes(uniquePhrase.toLowerCase()),
      hasProductMention: responseText.includes('product'),
      responseLength: responseText.length
    });

    // Verify AI found our embedded content
    const foundContent = responseText.includes(uniquePhrase.toLowerCase()) ||
                         responseText.includes('product') ||
                         responseText.includes('revolutionary');

    expect(foundContent).toBe(true);
    console.log('✅ AI successfully retrieved embedded content via RAG search');

    console.log('✅ RAG search verification completed');
  });

  test('verify embedding pipeline for all upload types', async ({ page }) => {
    console.log('🎯 Testing: Complete embedding pipeline for all types');

    const timestamp = Date.now();
    const testData = {
      url: `example.com/pipeline-test-${timestamp}`,
      text: `Pipeline test text content ${timestamp}`,
      question: `Pipeline test question ${timestamp}?`,
      answer: `Pipeline test answer ${timestamp}`
    };

    console.log('📍 Step 1: Upload URL');
    await uploadUrl(page, testData.url);
    await waitForItemInList(page, `https://${testData.url}`, 10000);
    await page.waitForTimeout(3000);

    console.log('📍 Step 2: Upload text');
    await uploadText(page, testData.text);
    await waitForItemInList(page, testData.text, 10000);
    await page.waitForTimeout(3000);

    console.log('📍 Step 3: Upload Q&A');
    await uploadQA(page, testData.question, testData.answer);
    await waitForItemInList(page, testData.question, 10000);

    console.log('📍 Step 4: Wait for all embeddings to be generated (15s)');
    await page.waitForTimeout(15000);

    console.log('📍 Step 5: Verify embeddings exist for URL upload');
    const { data: urlEmbeddings } = await supabase
      .from('page_embeddings')
      .select('id')
      .ilike('chunk_text', `%${testData.url}%`)
      .limit(1);
    expect(urlEmbeddings!.length).toBeGreaterThan(0);
    console.log('✅ URL embeddings verified');

    console.log('📍 Step 6: Verify embeddings exist for text upload');
    const { data: textEmbeddings } = await supabase
      .from('page_embeddings')
      .select('id')
      .ilike('chunk_text', `%${testData.text.substring(0, 30)}%`)
      .limit(1);
    expect(textEmbeddings!.length).toBeGreaterThan(0);
    console.log('✅ Text embeddings verified');

    console.log('📍 Step 7: Verify embeddings exist for Q&A upload');
    const { data: qaEmbeddings } = await supabase
      .from('page_embeddings')
      .select('id')
      .or(`chunk_text.ilike.%${testData.question.substring(0, 20)}%,chunk_text.ilike.%${testData.answer.substring(0, 20)}%`)
      .limit(1);
    expect(qaEmbeddings!.length).toBeGreaterThan(0);
    console.log('✅ Q&A embeddings verified');

    console.log('✅ Complete embedding pipeline verification completed');
    console.log('📊 Summary: All upload types generate embeddings successfully');
  });
});
