/**
 * Test lead enrichment
 * Run: npx tsx test-lead-enrichment.ts
 */

async function testEnrichment() {
  console.log('🧪 Testing Lead Enrichment\n');

  try {
    // Step 1: Create a demo attempt
    console.log('📡 Step 1: Creating demo attempt...');
    const demoResponse = await fetch('http://localhost:3000/api/demo/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: 'https://stripe.com' })
    });

    if (!demoResponse.ok) {
      throw new Error('Demo creation failed');
    }

    const demoData = await demoResponse.json();
    console.log('✅ Demo created:', demoData.domain);

    // Step 2: Wait a bit for enrichment to start
    console.log('\n⏳ Waiting 3 seconds for enrichment...');
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Step 3: Check enrichment result
    console.log('\n📊 Checking enrichment status in database...');
    console.log('   Go to: https://supabase.com/dashboard');
    console.log('   Table: demo_attempts');
    console.log('   Look for: contact_email column\n');

    // Step 4: Manual trigger enrichment cron
    console.log('🔄 Manually triggering enrichment cron...');
    const cronResponse = await fetch('http://localhost:3000/api/cron/enrich-leads');

    if (cronResponse.ok) {
      console.log('✅ Enrichment job completed\n');
    }

    console.log('🎉 Test complete!');
    console.log('\n📝 Next steps:');
    console.log('1. Check Supabase dashboard for contact_email');
    console.log('2. The system will automatically try to find emails from:');
    console.log('   - /contact pages');
    console.log('   - /about pages');
    console.log('   - Homepage email addresses');
    console.log('3. Emails are prioritized: contact@, info@, hello@, support@, sales@\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testEnrichment();
