import { createClient  } from '@supabase/supabase-js';

const supabaseUrl = 'https://birugqyuqhiahxvxeyqg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpcnVncXl1cWhpYWh4dnhleXFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTc4NzE2NCwiZXhwIjoyMDcxMzYzMTY0fQ.5bw0QlkRgv_PA7iHrpWixvC31d7WZ5VYSR2JZnhsw8s';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProducts() {
  console.log('Checking for products with SKUs: 2EVRA48 and PK-EK 291...\n');
  
  // First, check what tables exist
  const { data: tables, error: tablesError } = await supabase.rpc('get_tables_list', {});
  if (!tablesError && tables) {
    console.log('Available tables:', tables.filter(t => t.includes('product') || t.includes('woo')).join(', '));
  }
  
  // 1. Check if products exist in woocommerce_products
  const { data: products, error: productsError } = await supabase
    .from('woocommerce_products')
    .select('sku, name, stock_status, stock_quantity, price, metadata')
    .eq('domain', 'thompsonseparts.co.uk')
    .or('sku.ilike.%2EVRA48%,sku.ilike.%PK-EK%291%,sku.ilike.%PK-EK 291%,name.ilike.%2EVRA48%,name.ilike.%PK-EK%291%,name.ilike.%PK-EK 291%')
    .limit(10);

  if (productsError) {
    console.error('Error searching woocommerce_products:', productsError);
  } else if (products && products.length > 0) {
    console.log('Found products in woocommerce_products:');
    products.forEach(p => {
      console.log(`- SKU: ${p.sku}, Name: ${p.name}, Stock: ${p.stock_status}, Qty: ${p.stock_quantity}`);
    });
  } else {
    console.log('No products found with these SKUs in woocommerce_products table');
  }

  // 2. Check total product count
  const { data: countData, error: countError } = await supabase
    .from('woocommerce_products')
    .select('*', { count: 'exact', head: true })
    .eq('domain', 'thompsonseparts.co.uk');

  if (!countError) {
    console.log(`\nTotal products for thompsonseparts.co.uk: ${countData}`);
  }

  // 3. Sample some products to see what SKUs exist
  const { data: sampleProducts, error: sampleError } = await supabase
    .from('woocommerce_products')
    .select('sku, name')
    .eq('domain', 'thompsonseparts.co.uk')
    .limit(20);

  if (!sampleError && sampleProducts) {
    console.log('\nSample of existing SKUs:');
    sampleProducts.forEach(p => {
      console.log(`- SKU: ${p.sku || 'N/A'}, Name: ${p.name}`);
    });
  }

  // 4. Check scraped_pages for these products
  console.log('\n\nChecking scraped_pages for product references...');
  const { data: scrapedPages, error: scrapedError } = await supabase
    .from('scraped_pages')
    .select('url, title, content')
    .eq('domain', 'thompsonseparts.co.uk')
    .or('content.ilike.%2EVRA48%,content.ilike.%PK-EK 291%,title.ilike.%2EVRA48%,title.ilike.%PK-EK 291%')
    .limit(5);

  if (!scrapedError && scrapedPages && scrapedPages.length > 0) {
    console.log('Found references in scraped pages:');
    scrapedPages.forEach(page => {
      console.log(`- URL: ${page.url}`);
      console.log(`  Title: ${page.title}`);
      // Show snippet containing the product reference
      const content = page.content || '';
      const snippets = [];
      
      ['2EVRA48', 'PK-EK 291', 'PK-EK-291'].forEach(term => {
        const index = content.toLowerCase().indexOf(term.toLowerCase());
        if (index !== -1) {
          const start = Math.max(0, index - 50);
          const end = Math.min(content.length, index + term.length + 50);
          snippets.push(`...${content.substring(start, end)}...`);
        }
      });
      
      if (snippets.length > 0) {
        console.log('  Snippets:', snippets);
      }
    });
  } else {
    console.log('No references found in scraped pages');
  }

  // 5. Check if these might be in structured_extractions
  console.log('\n\nChecking structured_extractions...');
  const { data: extractions, error: extractError } = await supabase
    .from('structured_extractions')
    .select('extraction_type, data')
    .eq('domain', 'thompsonseparts.co.uk')
    .eq('extraction_type', 'products')
    .limit(5);

  if (!extractError && extractions) {
    console.log(`Found ${extractions.length} product extractions`);
    extractions.forEach(ext => {
      const products = ext.data.products || [];
      const relevantProducts = products.filter(p => 
        p.name?.includes('2EVRA48') || 
        p.name?.includes('PK-EK') || 
        p.sku?.includes('2EVRA48') || 
        p.sku?.includes('PK-EK')
      );
      
      if (relevantProducts.length > 0) {
        console.log('Found relevant products in extractions:', relevantProducts);
      }
    });
  }
}

checkProducts().catch(console.error);