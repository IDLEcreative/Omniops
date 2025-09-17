import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testNavigationFix() {
  console.log('🧪 Testing Navigation Fix Implementation\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Check if recent pages have text_content populated
    console.log('\n✅ Test 1: Checking text_content field population');
    console.log('-'.repeat(40));
    
    const { data: recentPages, error: pagesError } = await supabase
      .from('scraped_pages')
      .select('id, url, content, text_content')
      .order('scraped_at', { ascending: false })
      .limit(5);
    
    if (pagesError) {
      console.error('Error fetching pages:', pagesError);
      return;
    }
    
    recentPages?.forEach((page, index) => {
      const hasContent = page.content ? '✅' : '❌';
      const hasTextContent = page.text_content ? '✅' : '❌';
      const contentLength = page.content?.length || 0;
      const textContentLength = page.text_content?.length || 0;
      
      console.log(`\nPage ${index + 1}: ${page.url.substring(0, 50)}...`);
      console.log(`  Content field: ${hasContent} (${contentLength} chars)`);
      console.log(`  Text_content field: ${hasTextContent} (${textContentLength} chars)`);
      
      // Check if text_content is cleaner than content
      if (page.content && page.text_content) {
        const hasNavInContent = page.content.includes('<nav') || page.content.includes('Shop by Category');
        const hasNavInTextContent = page.text_content.includes('<nav') || page.text_content.includes('Shop by Category');
        
        console.log(`  Navigation in content: ${hasNavInContent ? '⚠️ Yes' : '✅ No'}`);
        console.log(`  Navigation in text_content: ${hasNavInTextContent ? '⚠️ Yes' : '✅ No'}`);
      }
    });
    
    // Test 2: Check recent embeddings for contamination
    console.log('\n\n✅ Test 2: Checking embeddings for contamination');
    console.log('-'.repeat(40));
    
    const { data: recentEmbeddings, error: embError } = await supabase
      .from('page_embeddings')
      .select('id, chunk_text, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (embError) {
      console.error('Error fetching embeddings:', embError);
      return;
    }
    
    let contaminatedCount = 0;
    const contaminationPatterns = [
      'Shop by Category',
      'Tipper Skip & Hookloaders',
      'gform_wrapper',
      'font-size:',
      '<style>',
      'Facebook Twitter Email'
    ];
    
    recentEmbeddings?.forEach((embedding, index) => {
      const chunkPreview = embedding.chunk_text?.substring(0, 100) || '';
      const hasContamination = contaminationPatterns.some(pattern => 
        embedding.chunk_text?.includes(pattern)
      );
      
      if (hasContamination) {
        contaminatedCount++;
        console.log(`\n❌ Embedding ${index + 1} is contaminated:`);
        console.log(`   Created: ${new Date(embedding.created_at).toLocaleString()}`);
        console.log(`   Preview: "${chunkPreview}..."`);
      } else {
        console.log(`\n✅ Embedding ${index + 1} is clean`);
        console.log(`   Created: ${new Date(embedding.created_at).toLocaleString()}`);
        console.log(`   Preview: "${chunkPreview}..."`);
      }
    });
    
    // Test 3: Summary statistics
    console.log('\n\n📊 Summary Statistics');
    console.log('-'.repeat(40));
    
    // Count NULL text_content pages
    const { count: nullTextCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .is('text_content', null)
      .gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    // Count total recent pages
    const { count: totalRecentPages } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    // Count recent embeddings
    const { count: recentEmbeddingCount } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());
    
    console.log(`\nLast 7 days:`);
    console.log(`  Total pages scraped: ${totalRecentPages}`);
    console.log(`  Pages with NULL text_content: ${nullTextCount} (${((nullTextCount || 0) / (totalRecentPages || 1) * 100).toFixed(1)}%)`);
    console.log(`\nLast 24 hours:`);
    console.log(`  New embeddings created: ${recentEmbeddingCount}`);
    console.log(`  Contaminated in sample: ${contaminatedCount}/${recentEmbeddings?.length || 0}`);
    
    // Final verdict
    console.log('\n\n🎯 Test Results');
    console.log('=' .repeat(60));
    
    const allTestsPassed = 
      (nullTextCount === 0 || (nullTextCount || 0) < (totalRecentPages || 1) * 0.1) &&
      contaminatedCount === 0;
    
    if (allTestsPassed) {
      console.log('✅ ALL TESTS PASSED - Navigation fix is working correctly!');
      console.log('\nNext steps:');
      console.log('1. Monitor new scrapes to ensure text_content is populated');
      console.log('2. Consider re-scraping domains with contaminated data');
      console.log('3. Watch for any performance impacts from the changes');
    } else {
      console.log('⚠️  SOME ISSUES REMAIN');
      if (nullTextCount && nullTextCount > 0) {
        console.log(`- Still have ${nullTextCount} pages with NULL text_content`);
      }
      if (contaminatedCount > 0) {
        console.log(`- Found ${contaminatedCount} contaminated embeddings in sample`);
      }
      console.log('\nRecommendations:');
      console.log('1. Check if scraper is running with updated code');
      console.log('2. May need to force rescrape affected pages');
      console.log('3. Review extraction logic for edge cases');
    }
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testNavigationFix();