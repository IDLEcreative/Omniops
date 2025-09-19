import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testRawResponse() {
  const response = await fetch('http://localhost:3000/api/chat-intelligent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "How many pumps do you have?",
      session_id: `debug-${Date.now()}`,
      domain: 'thompsonseparts.co.uk',
      config: { ai: { maxSearchIterations: 2 } }
    })
  });
  
  const result = await response.json();
  console.log('RAW RESPONSE:', JSON.stringify(result, null, 2));
}

testRawResponse().catch(console.error);
