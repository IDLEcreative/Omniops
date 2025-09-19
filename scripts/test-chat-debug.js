
async function testChatDebug() {
  console.log('Testing chat with debug info...\n');
  
  const response = await fetch('http://localhost:3000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Show me Palfinger products with prices",
      session_id: "debug-test",
      domain: "thompsonseparts.co.uk"
    })
  });
  
  console.log('Response status:', response.status);
  console.log('Response headers:', response.headers.raw());
  
  const data = await response.json();
  
  console.log('\nResponse message:');
  console.log(data.message);
  
  if (data.debug) {
    console.log('\nDebug info:');
    console.log(data.debug);
  }
}

testChatDebug().catch(console.error);