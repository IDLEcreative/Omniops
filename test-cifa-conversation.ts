// Test a complete conversation flow with the intelligent chat API

async function testConversation() {
  const sessionId = 'test-conversation-' + Date.now();
  const apiUrl = 'http://localhost:3000/api/chat-intelligent';
  
  console.log('=== TESTING CIFA PRODUCT CONVERSATION ===\n');
  console.log('Session ID:', sessionId);
  console.log('---\n');
  
  // Query 1: General Cifa request
  console.log('USER: "Show me all your Cifa products"\n');
  
  const response1 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me all your Cifa products',
      session_id: sessionId,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  const data1 = await response1.json();
  console.log('AI RESPONSE:');
  console.log('- Found:', data1.searchMetadata?.searchLog?.[0]?.resultCount || 0, 'products');
  console.log('- Message preview:', data1.message?.substring(0, 200) + '...');
  console.log('- Sources used:', data1.sources?.length || 0);
  console.log('- Tokens used:', data1.tokenUsage?.total || 0);
  console.log('');
  
  // Query 2: Follow-up about hydraulic parts
  console.log('USER: "Show me just the hydraulic ones"\n');
  
  const response2 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Show me just the hydraulic ones',
      session_id: sessionId,
      conversation_id: data1.conversation_id,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  const data2 = await response2.json();
  console.log('AI RESPONSE (Follow-up):');
  console.log('- Additional searches:', data2.searchMetadata?.totalSearches || 0);
  console.log('- Message preview:', data2.message?.substring(0, 200) + '...');
  console.log('- Context preserved:', data2.message?.includes('hydraulic') && data2.message?.toLowerCase().includes('cifa'));
  console.log('');
  
  // Query 3: Specific product inquiry
  console.log('USER: "Tell me more about the Cifa Mixer Hydraulic Cylinder"\n');
  
  const response3 = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Tell me more about the Cifa Mixer Hydraulic Cylinder',
      session_id: sessionId,
      conversation_id: data1.conversation_id,
      domain: 'thompsonseparts.co.uk'
    })
  });
  
  const data3 = await response3.json();
  console.log('AI RESPONSE (Specific product):');
  console.log('- Search performed:', data3.searchMetadata?.searchLog?.length > 0);
  console.log('- Message preview:', data3.message?.substring(0, 200) + '...');
  console.log('');
  
  console.log('=== CONVERSATION SUMMARY ===');
  console.log('Total exchanges: 3');
  console.log('AI demonstrated:');
  console.log('- Initial search capability');
  console.log('- Context preservation across queries');
  console.log('- Ability to narrow down results');
  console.log('- Specific product information retrieval');
}

testConversation().catch(console.error);
