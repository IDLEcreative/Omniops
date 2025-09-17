#!/usr/bin/env npx tsx
/**
 * Quick Tool Usage Report
 * Analyzes tool usage patterns with faster execution
 */

import 'dotenv/config';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

class ToolUsageReport {
  private apiUrl = 'http://localhost:3000/api/chat-intelligent';
  private domain = 'thompsonseparts.co.uk';
  
  private testQueries = [
    { type: "Simple Search", query: "Find brake pads" },
    { type: "Specific SKU", query: "Check stock for BP-001" },
    { type: "Complex Query", query: "Search pumps and check shipping rates" },
    { type: "Category", query: "Show product categories" },
    { type: "Vague Query", query: "I need parts for my truck" },
  ];
  
  private async sendMessage(message: string): Promise<any> {
    const sessionId = `report-${Date.now()}`;
    const start = Date.now();
    
    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        session_id: sessionId,
        domain: this.domain
      }),
      signal: AbortSignal.timeout(30000) // 30 second timeout per request
    });
    
    const data = await response.json();
    return { ...data, responseTime: Date.now() - start };
  }
  
  async generateReport() {
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}     📊 TOOL USAGE ANALYSIS REPORT${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════${colors.reset}\n`);
    
    const results = [];
    
    // Test each query type
    for (const test of this.testQueries) {
      console.log(`${colors.blue}Testing: ${test.type}${colors.reset}`);
      console.log(`Query: "${test.query}"`);
      
      try {
        const response = await this.sendMessage(test.query);
        const searchLog = response.searchMetadata?.searchLog || [];
        const toolsUsed = searchLog.map((log: any) => log.tool || log.function || 'unknown');
        const uniqueTools = [...new Set(toolsUsed)];
        
        results.push({
          type: test.type,
          query: test.query,
          toolCount: toolsUsed.length,
          uniqueToolCount: uniqueTools.length,
          tools: toolsUsed,
          responseTime: response.responseTime,
          parallel: searchLog.length > 1
        });
        
        console.log(`  Tools called: ${colors.yellow}${toolsUsed.length}${colors.reset}`);
        console.log(`  Tools: ${toolsUsed.join(', ')}`);
        console.log(`  Time: ${response.responseTime}ms\n`);
        
      } catch (error: any) {
        console.log(`  ${colors.yellow}Error: ${error.message}${colors.reset}\n`);
        results.push({
          type: test.type,
          query: test.query,
          toolCount: 0,
          uniqueToolCount: 0,
          tools: [],
          responseTime: 30000,
          parallel: false
        });
      }
    }
    
    // SUMMARY SECTION
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}                 SUMMARY REPORT${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════${colors.reset}\n`);
    
    // 1. Tool Usage by Query Type
    console.log(`${colors.blue}${colors.bright}📈 TOOL USAGE BY QUERY TYPE:${colors.reset}\n`);
    
    results.forEach(r => {
      const bar = '█'.repeat(r.toolCount * 3);
      console.log(`${r.type.padEnd(15)} ${bar} ${colors.yellow}${r.toolCount} tools${colors.reset}`);
    });
    
    // 2. Average Statistics
    const avgTools = results.reduce((sum, r) => sum + r.toolCount, 0) / results.length;
    const avgTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;
    const parallelRate = (results.filter(r => r.parallel).length / results.length) * 100;
    
    console.log(`\n${colors.blue}${colors.bright}📊 OVERALL STATISTICS:${colors.reset}\n`);
    console.log(`  Average tools per query: ${colors.yellow}${avgTools.toFixed(1)}${colors.reset}`);
    console.log(`  Average response time:   ${colors.yellow}${(avgTime/1000).toFixed(1)}s${colors.reset}`);
    console.log(`  Parallel execution rate: ${colors.yellow}${parallelRate.toFixed(0)}%${colors.reset}`);
    
    // 3. Tool Frequency
    const allTools = results.flatMap(r => r.tools);
    const toolFreq: Record<string, number> = {};
    allTools.forEach(tool => {
      if (tool !== 'unknown') {
        toolFreq[tool] = (toolFreq[tool] || 0) + 1;
      }
    });
    
    console.log(`\n${colors.blue}${colors.bright}🔧 MOST USED TOOLS:${colors.reset}\n`);
    Object.entries(toolFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([tool, count]) => {
        const bar = '▓'.repeat(count * 2);
        console.log(`  ${tool.padEnd(20)} ${bar} ${count}x`);
      });
    
    // 4. Key Findings
    console.log(`\n${colors.blue}${colors.bright}🔍 KEY FINDINGS:${colors.reset}\n`);
    
    const findings = [];
    
    // Finding 1: Tool count patterns
    const simpleSearch = results.find(r => r.type === "Simple Search");
    const specificSKU = results.find(r => r.type === "Specific SKU");
    const complexQuery = results.find(r => r.type === "Complex Query");
    
    if (simpleSearch && specificSKU) {
      findings.push(`• Simple searches use ${colors.yellow}${simpleSearch.toolCount}${colors.reset} tools on average`);
      findings.push(`• SKU lookups are most efficient with ${colors.yellow}${specificSKU.toolCount}${colors.reset} tool(s)`);
    }
    
    if (complexQuery) {
      findings.push(`• Complex queries utilize ${colors.yellow}${complexQuery.toolCount}${colors.reset} tools in parallel`);
    }
    
    // Finding 2: Performance
    if (avgTime < 10000) {
      findings.push(`• ${colors.green}✅ Good performance${colors.reset}: Average response under 10 seconds`);
    } else if (avgTime < 20000) {
      findings.push(`• ${colors.yellow}⚠ Moderate performance${colors.reset}: Average response ${(avgTime/1000).toFixed(1)}s`);
    } else {
      findings.push(`• ${colors.yellow}⚠ Slow performance${colors.reset}: Consider optimization`);
    }
    
    // Finding 3: Tool distribution
    const mostUsedTool = Object.entries(toolFreq).sort((a, b) => b[1] - a[1])[0];
    if (mostUsedTool) {
      findings.push(`• Most used tool: ${colors.yellow}${mostUsedTool[0]}${colors.reset} (${mostUsedTool[1]} times)`);
    }
    
    findings.forEach(f => console.log(f));
    
    // 5. Recommendations
    console.log(`\n${colors.blue}${colors.bright}💡 RECOMMENDATIONS:${colors.reset}\n`);
    
    console.log(`  1. ${colors.green}For fastest results${colors.reset}: Use specific SKUs or model numbers`);
    console.log(`  2. ${colors.green}For comprehensive search${colors.reset}: Let AI use multiple tools in parallel`);
    console.log(`  3. ${colors.green}For better performance${colors.reset}: Be specific in queries to reduce tool calls`);
    
    // Performance comparison
    console.log(`\n${colors.blue}${colors.bright}⚡ PERFORMANCE COMPARISON:${colors.reset}\n`);
    console.log(`  Query Type          Response Time`);
    console.log(`  ${'─'.repeat(35)}`);
    results.forEach(r => {
      const timeStr = `${(r.responseTime/1000).toFixed(1)}s`;
      const color = r.responseTime < 10000 ? colors.green : 
                    r.responseTime < 20000 ? colors.yellow : colors.yellow;
      console.log(`  ${r.type.padEnd(18)} ${color}${timeStr.padStart(10)}${colors.reset}`);
    });
    
    // Final verdict
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}                 FINAL VERDICT${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}═══════════════════════════════════════════════════${colors.reset}\n`);
    
    if (avgTools >= 2 && avgTools <= 4 && parallelRate > 50) {
      console.log(`${colors.green}${colors.bright}✅ SYSTEM PERFORMANCE: EXCELLENT${colors.reset}`);
      console.log(`\nThe AI is effectively using multiple tools (avg ${avgTools.toFixed(1)}) with`);
      console.log(`good parallel execution (${parallelRate.toFixed(0)}%) for comprehensive results.`);
    } else if (avgTools >= 1 && avgTools <= 5) {
      console.log(`${colors.yellow}${colors.bright}✅ SYSTEM PERFORMANCE: GOOD${colors.reset}`);
      console.log(`\nThe AI is using tools appropriately (avg ${avgTools.toFixed(1)}) but`);
      console.log(`could benefit from more parallel execution.`);
    } else {
      console.log(`${colors.yellow}${colors.bright}⚠ SYSTEM PERFORMANCE: NEEDS OPTIMIZATION${colors.reset}`);
      console.log(`\nHigh tool usage (avg ${avgTools.toFixed(1)}) may indicate over-searching.`);
    }
    
    console.log(`\n${colors.cyan}${colors.bright}═══════════════════════════════════════════════════${colors.reset}\n`);
  }
}

// Run the report
const reporter = new ToolUsageReport();
reporter.generateReport().catch(console.error);