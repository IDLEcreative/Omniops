import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testNewEmbeddings() {
  console.log('🔍 NEW EMBEDDINGS QUALITY TEST');
  console.log('=' + '='.repeat(60));
  console.log('Testing only NEW embeddings with metadata...\n');

  // Get ONLY embeddings that have metadata (these are the new ones)
  const { data: newEmbeddings, error } = await supabase
    .from('page_embeddings')
    .select('chunk_text, metadata')
    .not('metadata', 'is', null)
    .not('metadata->chunk_index', 'is', null)
    .limit(500);

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(`📊 Found ${newEmbeddings.length} new embeddings with proper metadata\n`);

  // Analyze NEW embeddings
  const chunkSizes = newEmbeddings.map(e => e.chunk_text?.length || 0);
  const oversized = chunkSizes.filter(size => size > 1500);
  const avgSize = Math.round(chunkSizes.reduce((a, b) => a + b, 0) / chunkSizes.length);
  const maxSize = Math.max(...chunkSizes);
  
  console.log('📏 NEW EMBEDDINGS - CHUNK SIZE ANALYSIS');
  console.log('-'.repeat(60));
  console.log(`Average size: ${avgSize} chars`);
  console.log(`Maximum size: ${maxSize} chars`);
  console.log(`Oversized (>1500): ${oversized.length} (${(oversized.length/newEmbeddings.length*100).toFixed(1)}%)`);
  
  if (oversized.length === 0) {
    console.log('✅ PERFECT! All new embeddings are properly sized!\n');
  } else if (oversized.length < 10) {
    console.log('✅ EXCELLENT! Very few oversized chunks.\n');
  } else {
    console.log('⚠️  Still some oversized chunks in new embeddings.\n');
  }

  // Check contamination in NEW embeddings
  let navigationContaminated = 0;
  let cssContaminated = 0;
  let cleanChunks = 0;
  
  newEmbeddings.forEach(embedding => {
    const text = (embedding.chunk_text || '').toLowerCase();
    
    // Navigation patterns
    const hasNav = (
      (text.includes('home') && text.includes('about') && text.includes('contact')) ||
      (text.includes('cookie') && text.includes('accept')) ||
      (text.includes('newsletter') && text.includes('subscribe'))
    );
    
    // CSS patterns
    const hasCSS = (
      text.includes('font-family:') ||
      text.includes('background-color:') ||
      text.includes('margin:') ||
      text.includes('display:')
    );
    
    if (hasNav) navigationContaminated++;
    else if (hasCSS) cssContaminated++;
    else cleanChunks++;
  });

  console.log('🧹 NEW EMBEDDINGS - CONTAMINATION ANALYSIS');
  console.log('-'.repeat(60));
  console.log(`Clean chunks: ${cleanChunks}/${newEmbeddings.length} (${(cleanChunks/newEmbeddings.length*100).toFixed(1)}%)`);
  console.log(`Navigation contamination: ${navigationContaminated} (${(navigationContaminated/newEmbeddings.length*100).toFixed(1)}%)`);
  console.log(`CSS contamination: ${cssContaminated} (${(cssContaminated/newEmbeddings.length*100).toFixed(1)}%)`);
  
  const cleanPercentage = cleanChunks/newEmbeddings.length * 100;
  if (cleanPercentage > 95) {
    console.log('✅ EXCELLENT! New embeddings are extremely clean!\n');
  } else if (cleanPercentage > 85) {
    console.log('✅ VERY GOOD! New embeddings are mostly clean.\n');
  } else if (cleanPercentage > 70) {
    console.log('⚠️  OK - Some contamination remains.\n');
  } else {
    console.log('❌ Significant contamination still present.\n');
  }

  // Test semantic quality with sample chunks
  console.log('🎯 SEMANTIC QUALITY CHECK');
  console.log('-'.repeat(60));
  
  const productChunks = newEmbeddings.filter(e => {
    const text = (e.chunk_text || '').toLowerCase();
    return (
      text.includes('product') ||
      text.includes('price') ||
      text.includes('stock') ||
      text.includes('part') ||
      text.includes('kit')
    );
  }).slice(0, 5);
  
  console.log(`Found ${productChunks.length} product-related chunks`);
  productChunks.forEach((chunk, i) => {
    const preview = chunk.chunk_text?.substring(0, 100)?.replace(/\n/g, ' ');
    console.log(`  ${i+1}. ${preview}...`);
  });

  // Final assessment
  console.log('\n' + '='.repeat(60));
  console.log('📈 NEW EMBEDDINGS ASSESSMENT');
  console.log('='.repeat(60));
  
  const improvements = [];
  
  if (oversized.length === 0) {
    improvements.push('✅ Chunk size limit (1500) perfectly enforced');
  }
  
  if (navigationContaminated === 0) {
    improvements.push('✅ Navigation menu contamination completely eliminated');
  }
  
  if (cssContaminated < 5) {
    improvements.push('✅ CSS/styling contamination nearly eliminated');
  }
  
  if (cleanPercentage > 85) {
    improvements.push('✅ High-quality semantic content extraction');
  }
  
  console.log('🎯 KEY IMPROVEMENTS ACHIEVED:');
  improvements.forEach(imp => console.log(`  ${imp}`));
  
  const score = (
    (oversized.length === 0 ? 40 : 20) +
    (navigationContaminated === 0 ? 30 : 10) +
    (cssContaminated < 5 ? 30 : 10)
  );
  
  console.log(`\n🏆 QUALITY SCORE: ${score}/100`);
  
  if (score >= 90) {
    console.log('\n✨ OUTSTANDING! The new embeddings are near-perfect quality.');
  } else if (score >= 70) {
    console.log('\n✅ EXCELLENT! Major improvements achieved in embedding quality.');
  } else if (score >= 50) {
    console.log('\n⚠️  GOOD - Significant improvements, with some areas to refine.');
  } else {
    console.log('\n❌ Limited improvements detected.');
  }
}

testNewEmbeddings().catch(console.error);