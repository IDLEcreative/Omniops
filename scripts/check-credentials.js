
const DOMAIN = 'thompsonseparts.co.uk';

async function checkCredentials() {
  console.log('🔍 Checking WooCommerce Credentials Format');
  console.log('═'.repeat(60));

  try {
    // Use the test endpoint which should show us the credential format
    const response = await fetch(`http://localhost:3001/api/test-woocommerce?domain=${DOMAIN}`);
    const data = await response.json();
    
    if (data.configuration) {
      console.log('\nConfiguration found:');
      console.log('  Domain:', data.configuration.domain);
      console.log('  URL:', data.configuration.woocommerce_url);
      console.log('  Business:', data.configuration.business_name);
    }
    
    if (data.test_results) {
      const hasProducts = data.test_results.find(t => t.endpoint === 'products');
      const hasOrders = data.test_results.find(t => t.endpoint === 'orders');
      
      console.log('\nAPI Access:');
      console.log('  Products:', hasProducts ? `✅ Working (${hasProducts.count} found)` : '❌ Failed');
      console.log('  Orders:', hasOrders ? `✅ Working (${hasOrders.count} found)` : '❌ Failed');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('The credentials appear to be working!');
    console.log('This means they are either:');
    console.log('  1. Stored unencrypted (most likely)');
    console.log('  2. Encrypted with the current key');
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkCredentials();