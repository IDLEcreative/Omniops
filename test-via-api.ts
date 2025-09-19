// Test by calling the API endpoint directly with verbose logging
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testViaAPI() {
  console.log('Testing API with metadata request...\n');
  
  const response = await fetch('http://localhost:3000/api/chat-intelligent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Show me Cifa products",
      session_id: `test-metadata-${Date.now()}`,
      domain: 'thompsonseparts.co.uk',
      config: { ai: { maxSearchIterations: 2 } }
    })
  });
  
  const result = await response.json();
  
  console.log('Response message:');
  console.log(result.message);
  console.log('\nMetadata:');
  console.log(JSON.stringify(result.metadata, null, 2));
  console.log('\nSources count:', result.sources?.length);
}

testViaAPI().catch(console.error);
