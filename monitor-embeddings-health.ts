import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function monitorEmbeddingsHealth() {
  console.log('🏥 Embeddings Health Monitor\n');
  console.log('=' .repeat(60));
  
  try {
    // 1. Check for NULL text_content
    const { count: nullTextCount } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true })
      .is('text_content', null);
    
    // 2. Check total pages
    const { count: totalPages } = await supabase
      .from('scraped_pages')
      .select('*', { count: 'exact', head: true });
    
    // 3. Check recent embeddings for contamination
    const { data: recentEmbeddings } = await supabase
      .from('page_embeddings')
      .select('chunk_text')
      .order('created_at', { ascending: false })
      .limit(100);
    
    // Common contamination patterns
    const navPatterns = [
      'Shop by Category',
      'Tipper Skip & Hookloaders',
      'Facebook Twitter Email',
      'Manage consent'
    ];
    
    const cssPatterns = [
      'font-size:',
      'font-weight:',
      '<style>',
      'gform_wrapper'
    ];
    
    let navContaminated = 0;
    let cssContaminated = 0;
    
    recentEmbeddings?.forEach(embedding => {
      const text = embedding.chunk_text || '';
      if (navPatterns.some(p => text.includes(p))) navContaminated++;
      if (cssPatterns.some(p => text.includes(p))) cssContaminated++;
    });
    
    // 4. Check embeddings coverage
    const { count: totalEmbeddings } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true });
    
    // 5. Recent scraping activity
    const { data: recentScrapes } = await supabase
      .from('scraped_pages')
      .select('scraped_at')
      .order('scraped_at', { ascending: false })
      .limit(1);
    
    const lastScraped = recentScrapes?.[0]?.scraped_at 
      ? new Date(recentScrapes[0].scraped_at)
      : null;
    
    const hoursSinceLastScrape = lastScraped 
      ? (Date.now() - lastScraped.getTime()) / (1000 * 60 * 60)
      : null;
    
    // Generate Health Report
    console.log('\n📊 Health Metrics:');
    console.log('-'.repeat(40));
    
    // Text Content Health
    const textContentHealth = ((totalPages || 0) - (nullTextCount || 0)) / (totalPages || 1) * 100;
    console.log(`\n✅ Text Content Field:`);
    console.log(`   Populated: ${(totalPages || 0) - (nullTextCount || 0)}/${totalPages} (${textContentHealth.toFixed(1)}%)`);
    if (nullTextCount && nullTextCount > 0) {
      console.log(`   ⚠️  ${nullTextCount} pages missing text_content`);
    }
    
    // Embeddings Contamination
    console.log(`\n🧪 Embeddings Quality (last 100):`);
    console.log(`   Navigation contamination: ${navContaminated}%`);
    console.log(`   CSS/JS contamination: ${cssContaminated}%`);
    
    if (navContaminated > 5 || cssContaminated > 5) {
      console.log('   ⚠️  High contamination detected!');
    } else {
      console.log('   ✅ Clean embeddings');
    }
    
    // Coverage
    const avgEmbeddingsPerPage = (totalEmbeddings || 0) / (totalPages || 1);
    console.log(`\n📈 Coverage:`);
    console.log(`   Total pages: ${totalPages}`);
    console.log(`   Total embeddings: ${totalEmbeddings}`);
    console.log(`   Avg embeddings/page: ${avgEmbeddingsPerPage.toFixed(1)}`);
    
    // Activity
    console.log(`\n⏰ Activity:`);
    if (hoursSinceLastScrape !== null) {
      if (hoursSinceLastScrape < 1) {
        console.log(`   Last scrape: ${(hoursSinceLastScrape * 60).toFixed(0)} minutes ago`);
      } else if (hoursSinceLastScrape < 24) {
        console.log(`   Last scrape: ${hoursSinceLastScrape.toFixed(1)} hours ago`);
      } else {
        console.log(`   Last scrape: ${(hoursSinceLastScrape / 24).toFixed(1)} days ago`);
      }
    }
    
    // Overall Health Score
    console.log('\n' + '=' .repeat(60));
    const healthScore = (
      textContentHealth * 0.5 +  // 50% weight
      (100 - navContaminated) * 0.25 +  // 25% weight
      (100 - cssContaminated) * 0.25  // 25% weight
    );
    
    console.log('🏆 Overall Health Score: ' + getHealthEmoji(healthScore) + ` ${healthScore.toFixed(1)}%`);
    
    // Recommendations
    if (healthScore < 90) {
      console.log('\n💡 Recommendations:');
      if (nullTextCount && nullTextCount > 0) {
        console.log('   • Run force rescrape for pages with NULL text_content');
      }
      if (navContaminated > 5) {
        console.log('   • Clean embeddings with navigation contamination');
      }
      if (cssContaminated > 5) {
        console.log('   • Review content extraction for CSS/JS filtering');
      }
    } else {
      console.log('\n✨ System is healthy! No action needed.');
    }
    
  } catch (error) {
    console.error('Error monitoring health:', error);
  }
}

function getHealthEmoji(score: number): string {
  if (score >= 95) return '💚';
  if (score >= 80) return '💛';
  if (score >= 60) return '🧡';
  return '❤️';
}

// Run the monitor
monitorEmbeddingsHealth();