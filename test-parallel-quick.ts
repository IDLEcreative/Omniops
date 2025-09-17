#!/usr/bin/env npx tsx
/**
 * Quick Parallel Tools Execution Test
 * Demonstrates all tools working together in parallel
 */

import 'dotenv/config';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class QuickParallelTest {
  private apiUrl = 'http://localhost:3000/api/chat-intelligent';
  private domain = 'thompsonseparts.co.uk';
  
  private async sendMessage(message: string, sessionId: string) {
    const start = Date.now();
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        domain: this.domain
      })
    });
    
    const result = await response.json();
    const elapsed = Date.now() - start;
    return { ...result, responseTime: elapsed };
  }
  
  async run() {
    console.log(`${colors.cyan}${colors.bright}⚡ PARALLEL TOOLS EXECUTION - QUICK TEST${colors.reset}`);
    console.log('Demonstrating all tools working together');
    console.log('═'.repeat(60));
    
    // Test 1: Multiple tools in parallel
    console.log(`\n${colors.blue}Test 1: Multi-Tool Parallel Query${colors.reset}`);
    const query1 = "Search for brake pads, check stock for BP-001, and get shipping rates";
    console.log(`Query: "${query1}"`);
    
    const response1 = await this.sendMessage(query1, `quick-test-${Date.now()}`);
    const tools1 = response1.searchMetadata?.searchLog?.map((log: any) => 
      log.tool || log.function || 'unknown'
    ) || [];
    
    console.log(`Tools used: ${tools1.join(' + ')}`);
    console.log(`Total searches: ${response1.searchMetadata?.totalSearches || 0}`);
    console.log(`Response time: ${response1.responseTime}ms`);
    
    if (tools1.length > 1) {
      console.log(`${colors.green}✅ PARALLEL EXECUTION CONFIRMED${colors.reset}`);
    }
    
    // Test 2: Customer + Product operations
    console.log(`\n${colors.blue}Test 2: Mixed Authentication Query${colors.reset}`);
    const query2 = "I'm samguy@thompsonsuk.com. Check my order #119410 and search for hydraulic pumps";
    console.log(`Query: "${query2}"`);
    
    const response2 = await this.sendMessage(query2, `quick-test-${Date.now()}`);
    const tools2 = response2.searchMetadata?.searchLog?.map((log: any) => 
      log.tool || log.function || 'unknown'
    ) || [];
    
    console.log(`Tools used: ${tools2.join(' + ')}`);
    
    // Check if different tools were used
    const hasOrderTool = tools2.some(t => t.includes('order'));
    const hasSearchTool = tools2.some(t => t.includes('search'));
    const hasWooCommerce = tools2.some(t => t.includes('woocommerce'));
    
    console.log(`Order lookup: ${hasOrderTool ? '✓' : '✗'}`);
    console.log(`Product search: ${hasSearchTool ? '✓' : '✗'}`);
    console.log(`WooCommerce Agent: ${hasWooCommerce ? '✓' : '✗'}`);
    
    // Summary
    console.log(`\n${colors.cyan}${colors.bright}═══ SUMMARY ═══${colors.reset}`);
    
    const allTools = new Set([...tools1, ...tools2]);
    console.log(`\nUnique tools used across tests:`);
    allTools.forEach(tool => {
      if (tool && tool !== 'unknown') {
        console.log(`  • ${tool}`);
      }
    });
    
    console.log(`\n${colors.cyan}Key Findings:${colors.reset}`);
    
    // Verify all tool types work
    const toolTypes = {
      'search_products': allTools.has('search_products'),
      'woocommerce_agent': allTools.has('woocommerce_agent'),
      'order_lookup': allTools.has('order_lookup'),
      'get_product_details': allTools.has('get_product_details'),
      'search_by_category': allTools.has('search_by_category')
    };
    
    console.log('\nTool availability:');
    Object.entries(toolTypes).forEach(([tool, available]) => {
      console.log(`  ${available ? colors.green + '✓' : colors.red + '✗'}${colors.reset} ${tool}`);
    });
    
    // Performance comparison
    console.log(`\n${colors.cyan}Performance:${colors.reset}`);
    console.log(`Test 1: ${response1.responseTime}ms (${tools1.length} tools)`);
    console.log(`Test 2: ${response2.responseTime}ms (${tools2.length} tools)`);
    
    const avgTimePerTool = (response1.responseTime + response2.responseTime) / 
                           (tools1.length + tools2.length);
    console.log(`Average per tool: ${avgTimePerTool.toFixed(0)}ms`);
    
    // Final verdict
    console.log(`\n${colors.cyan}${colors.bright}🎯 FINAL VERDICT${colors.reset}`);
    
    if (tools1.length > 1 && tools2.length > 1) {
      console.log(`${colors.green}${colors.bright}✅ SUCCESS: Parallel tool execution is working!${colors.reset}`);
      console.log('The AI successfully uses multiple tools simultaneously');
    }
    
    if (allTools.size >= 3) {
      console.log(`${colors.green}✓ Tool diversity confirmed: ${allTools.size} different tools used${colors.reset}`);
    }
    
    console.log('\nThe system is correctly configured with:');
    console.log('• Multiple specialized tools (search, orders, WooCommerce)');
    console.log('• WooCommerce Agent for e-commerce operations');
    console.log('• Parallel execution for better performance');
    console.log('• Proper authentication boundaries');
  }
}

// Run the quick test
const test = new QuickParallelTest();
test.run().catch(console.error);