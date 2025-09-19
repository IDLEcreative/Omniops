// Final validation test after fixes

async function testFinal() {
  console.log('=== FINAL VALIDATION AFTER FIXES ===\n');
  console.log('Testing: "Need a pump for my Cifa mixer"\n');
  
  let successCount = 0;
  let results = [];
  
  for (let i = 1; i <= 10; i++) {
    try {
      const response = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: 'Need a pump for my Cifa mixer',
          domain: i % 2 === 0 ? 'thompsonseparts.co.uk' : 'localhost',
          session_id: `final-test-${i}`,
          conversationId: `final-conv-${i}`
        }),
      });

      const data = await response.json();
      
      if (data.message) {
        const hasProducts = data.message.includes('Cifa Mixer') && 
                           data.message.includes('http');
        const showsFirst = data.message.startsWith('Here are') || 
                          data.message.includes('options we have');
        
        console.log(`Test ${i} (${i % 2 === 0 ? 'thompsonseparts' : 'localhost'}):`);
        console.log(`  ✅ Shows products: ${hasProducts}`);
        console.log(`  ✅ Products first: ${showsFirst}`);
        console.log(`  Preview: ${data.message.substring(0, 100)}...`);
        
        if (hasProducts && showsFirst) successCount++;
        results.push({ hasProducts, showsFirst });
      }
    } catch (error) {
      console.log(`Test ${i}: ERROR - ${error.message}`);
      results.push({ error: true });
    }
    
    console.log('');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('=== RESULTS ===');
  console.log(`Success rate: ${successCount}/10 (${successCount * 10}%)`);
  console.log(`Shows products: ${results.filter(r => r.hasProducts).length}/10`);
  console.log(`Products shown first: ${results.filter(r => r.showsFirst).length}/10`);
  
  if (successCount >= 9) {
    console.log('\n✅ ISSUE RESOLVED: AI now consistently shows products!');
  } else if (successCount >= 7) {
    console.log('\n⚠️ IMPROVED: AI shows products most of the time but may need further tweaking');
  } else {
    console.log('\n❌ NEEDS MORE WORK: AI still inconsistent');
  }
}

testFinal().catch(console.error);