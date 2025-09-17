#!/usr/bin/env npx tsx
/**
 * Comprehensive Tool Usage Analysis & Report
 * Analyzes how many tools are called per query type
 * Provides detailed statistics and performance metrics
 */

import 'dotenv/config';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

interface QueryTest {
  category: string;
  query: string;
  expectedBehavior: string;
}

interface TestResult {
  query: string;
  category: string;
  toolsUsed: string[];
  toolCount: number;
  responseTime: number;
  parallel: boolean;
  hasResults: boolean;
  tokenCost?: number;
}

class ComprehensiveToolAnalysis {
  private apiUrl = 'http://localhost:3000/api/chat-intelligent';
  private domain = 'thompsonseparts.co.uk';
  private results: TestResult[] = [];
  
  private queryTests: QueryTest[] = [
    // Simple product searches
    { 
      category: "Simple Product Search", 
      query: "Find brake pads",
      expectedBehavior: "Should use 2-3 tools for product search"
    },
    { 
      category: "Simple Product Search", 
      query: "Show me hydraulic pumps",
      expectedBehavior: "Should fan out to multiple search variants"
    },
    
    // Specific SKU/Model searches
    { 
      category: "Specific SKU", 
      query: "Check stock for SKU BP-001",
      expectedBehavior: "Should use 1 tool for exact SKU"
    },
    { 
      category: "Specific SKU", 
      query: "Is product OF-002 available?",
      expectedBehavior: "Single tool for specific product"
    },
    
    // Category browsing
    { 
      category: "Category Browse", 
      query: "What categories of products do you have?",
      expectedBehavior: "Should use category search tool"
    },
    { 
      category: "Category Browse", 
      query: "Show me all brake system products",
      expectedBehavior: "Category + product search combination"
    },
    
    // Complex multi-part queries
    { 
      category: "Complex Multi-Part", 
      query: "Find pumps, check if BP-001 is in stock, and show shipping rates",
      expectedBehavior: "Should use 3+ tools in parallel"
    },
    { 
      category: "Complex Multi-Part", 
      query: "Search for brake pads under £50 and check availability for next day delivery",
      expectedBehavior: "Multiple searches with filters"
    },
    
    // Order/Customer queries (auth required)
    { 
      category: "Order Lookup", 
      query: "Check my order #119410",
      expectedBehavior: "Single tool, should require auth"
    },
    { 
      category: "Order Lookup", 
      query: "Where is my delivery for order 119410?",
      expectedBehavior: "Order lookup tool with auth gate"
    },
    
    // Vague queries (should trigger more searches)
    { 
      category: "Vague Query", 
      query: "I need parts",
      expectedBehavior: "Should trigger multiple broad searches"
    },
    { 
      category: "Vague Query", 
      query: "Something for my truck",
      expectedBehavior: "Multiple category/product searches"
    },
    
    // Mixed authenticated/public
    { 
      category: "Mixed Auth", 
      query: "I'm samguy@thompsonsuk.com, show me pumps and my recent orders",
      expectedBehavior: "Parallel public search + auth order lookup"
    },
    
    // Edge cases
    { 
      category: "Edge Case", 
      query: "CIFA pump model XR-500",
      expectedBehavior: "Specific model search"
    },
    { 
      category: "Edge Case", 
      query: "Do you have anything similar to BP-001?",
      expectedBehavior: "Product details + related search"
    }
  ];
  
  private async sendMessage(message: string): Promise<any> {
    const sessionId = `analysis-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const start = Date.now();
    
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          session_id: sessionId,
          domain: this.domain
        })
      });
      
      const data = await response.json();
      const elapsed = Date.now() - start;
      
      return { ...data, responseTime: elapsed };
    } catch (error) {
      console.error(`Error sending message: ${error}`);
      return { error: true, responseTime: Date.now() - start };
    }
  }
  
  private analyzeResponse(query: string, category: string, response: any): TestResult {
    const searchLog = response.searchMetadata?.searchLog || [];
    const toolsUsed = searchLog.map((log: any) => log.tool || log.function || 'unknown');
    
    // Check if tools executed in parallel (multiple tools with similar start times)
    const parallel = searchLog.length > 1 && response.searchMetadata?.totalSearches > 1;
    
    // Check if we got meaningful results
    const hasResults = response.message && response.message.length > 50 && !response.error;
    
    return {
      query,
      category,
      toolsUsed,
      toolCount: toolsUsed.length,
      responseTime: response.responseTime,
      parallel,
      hasResults,
      tokenCost: response.tokenUsage?.totalCost
    };
  }
  
  async runAnalysis() {
    console.log(`${colors.cyan}${colors.bright}📊 COMPREHENSIVE TOOL USAGE ANALYSIS${colors.reset}`);
    console.log(`Testing ${this.queryTests.length} different query patterns`);
    console.log('═'.repeat(70));
    
    // Test each query
    for (const test of this.queryTests) {
      console.log(`\n${colors.blue}Testing: ${test.category}${colors.reset}`);
      console.log(`Query: "${test.query}"`);
      console.log(`${colors.dim}Expected: ${test.expectedBehavior}${colors.reset}`);
      
      const response = await this.sendMessage(test.query);
      const result = this.analyzeResponse(test.query, test.category, response);
      this.results.push(result);
      
      // Display immediate results
      console.log(`Tools used: ${colors.yellow}${result.toolCount}${colors.reset} - ${result.toolsUsed.join(', ')}`);
      console.log(`Response time: ${result.responseTime}ms`);
      console.log(`Parallel: ${result.parallel ? colors.green + 'Yes' : colors.yellow + 'No'}${colors.reset}`);
      
      if (response.requiresVerification) {
        console.log(`${colors.yellow}⚠ Authentication required${colors.reset}`);
      }
    }
    
    // Generate comprehensive report
    this.generateReport();
  }
  
  private generateReport() {
    console.log(`\n${colors.cyan}${colors.bright}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}📈 COMPREHENSIVE ANALYSIS REPORT${colors.reset}`);
    console.log(`${colors.cyan}${colors.bright}${'═'.repeat(70)}${colors.reset}`);
    
    // 1. Tool Usage by Category
    console.log(`\n${colors.blue}${colors.bright}1. TOOL USAGE BY QUERY CATEGORY${colors.reset}`);
    console.log('─'.repeat(50));
    
    const categories = [...new Set(this.results.map(r => r.category))];
    for (const category of categories) {
      const categoryResults = this.results.filter(r => r.category === category);
      const avgTools = categoryResults.reduce((sum, r) => sum + r.toolCount, 0) / categoryResults.length;
      const avgTime = categoryResults.reduce((sum, r) => sum + r.responseTime, 0) / categoryResults.length;
      
      console.log(`\n${colors.cyan}${category}:${colors.reset}`);
      console.log(`  Average tools called: ${colors.yellow}${avgTools.toFixed(1)}${colors.reset}`);
      console.log(`  Average response time: ${avgTime.toFixed(0)}ms`);
      console.log(`  Queries tested: ${categoryResults.length}`);
      
      // Show tool distribution
      const toolDist = categoryResults.map(r => r.toolCount).sort();
      console.log(`  Tool count range: ${toolDist[0]}-${toolDist[toolDist.length-1]}`);
    }
    
    // 2. Overall Statistics
    console.log(`\n${colors.blue}${colors.bright}2. OVERALL STATISTICS${colors.reset}`);
    console.log('─'.repeat(50));
    
    const totalQueries = this.results.length;
    const avgToolsOverall = this.results.reduce((sum, r) => sum + r.toolCount, 0) / totalQueries;
    const avgTimeOverall = this.results.reduce((sum, r) => sum + r.responseTime, 0) / totalQueries;
    const parallelCount = this.results.filter(r => r.parallel).length;
    const successCount = this.results.filter(r => r.hasResults).length;
    
    console.log(`Total queries tested: ${totalQueries}`);
    console.log(`Average tools per query: ${colors.yellow}${avgToolsOverall.toFixed(1)}${colors.reset}`);
    console.log(`Average response time: ${avgTimeOverall.toFixed(0)}ms`);
    console.log(`Parallel execution rate: ${((parallelCount/totalQueries)*100).toFixed(1)}%`);
    console.log(`Success rate: ${((successCount/totalQueries)*100).toFixed(1)}%`);
    
    // 3. Tool Usage Patterns
    console.log(`\n${colors.blue}${colors.bright}3. TOOL USAGE PATTERNS${colors.reset}`);
    console.log('─'.repeat(50));
    
    // Count how often each tool is used
    const toolFrequency: Record<string, number> = {};
    this.results.forEach(r => {
      r.toolsUsed.forEach(tool => {
        if (tool && tool !== 'unknown') {
          toolFrequency[tool] = (toolFrequency[tool] || 0) + 1;
        }
      });
    });
    
    console.log('\nMost frequently used tools:');
    Object.entries(toolFrequency)
      .sort((a, b) => b[1] - a[1])
      .forEach(([tool, count]) => {
        const percentage = ((count / totalQueries) * 100).toFixed(1);
        console.log(`  ${tool}: ${count} times (${percentage}% of queries)`);
      });
    
    // 4. Performance Analysis
    console.log(`\n${colors.blue}${colors.bright}4. PERFORMANCE ANALYSIS${colors.reset}`);
    console.log('─'.repeat(50));
    
    const timeRanges = {
      fast: this.results.filter(r => r.responseTime < 5000).length,
      medium: this.results.filter(r => r.responseTime >= 5000 && r.responseTime < 15000).length,
      slow: this.results.filter(r => r.responseTime >= 15000).length
    };
    
    console.log(`\nResponse time distribution:`);
    console.log(`  ${colors.green}Fast (<5s):${colors.reset} ${timeRanges.fast} queries`);
    console.log(`  ${colors.yellow}Medium (5-15s):${colors.reset} ${timeRanges.medium} queries`);
    console.log(`  ${colors.red}Slow (>15s):${colors.reset} ${timeRanges.slow} queries`);
    
    // Find correlation between tool count and response time
    const toolsVsTime = this.results.map(r => ({ tools: r.toolCount, time: r.responseTime }));
    const avgTimePerTool = toolsVsTime.reduce((sum, item) => 
      sum + (item.time / item.tools), 0) / toolsVsTime.length;
    
    console.log(`\nAverage time per tool: ${avgTimePerTool.toFixed(0)}ms`);
    
    // 5. Key Insights
    console.log(`\n${colors.blue}${colors.bright}5. KEY INSIGHTS${colors.reset}`);
    console.log('─'.repeat(50));
    
    console.log(`\n${colors.green}✅ Strengths:${colors.reset}`);
    if (avgToolsOverall > 1.5) {
      console.log('• System effectively uses multiple tools for comprehensive results');
    }
    if (parallelCount > totalQueries * 0.5) {
      console.log('• Good parallel execution reducing response times');
    }
    if (successCount > totalQueries * 0.8) {
      console.log('• High success rate in finding relevant information');
    }
    
    console.log(`\n${colors.yellow}📊 Patterns Observed:${colors.reset}`);
    console.log(`• Simple product searches use ${(this.results.filter(r => r.category === 'Simple Product Search').reduce((sum, r) => sum + r.toolCount, 0) / this.results.filter(r => r.category === 'Simple Product Search').length).toFixed(1)} tools on average`);
    console.log(`• Specific SKU lookups use ${(this.results.filter(r => r.category === 'Specific SKU').reduce((sum, r) => sum + r.toolCount, 0) / this.results.filter(r => r.category === 'Specific SKU').length || 1).toFixed(1)} tools (most efficient)`);
    console.log(`• Complex queries use ${(this.results.filter(r => r.category === 'Complex Multi-Part').reduce((sum, r) => sum + r.toolCount, 0) / this.results.filter(r => r.category === 'Complex Multi-Part').length || 1).toFixed(1)} tools in parallel`);
    console.log(`• Vague queries trigger ${(this.results.filter(r => r.category === 'Vague Query').reduce((sum, r) => sum + r.toolCount, 0) / this.results.filter(r => r.category === 'Vague Query').length || 1).toFixed(1)} tools (casting wide net)`);
    
    // 6. Recommendations
    console.log(`\n${colors.blue}${colors.bright}6. RECOMMENDATIONS${colors.reset}`);
    console.log('─'.repeat(50));
    
    if (avgTimeOverall > 10000) {
      console.log(`${colors.yellow}⚠ Consider optimizing queries that take >10s${colors.reset}`);
    }
    
    if (avgToolsOverall > 4) {
      console.log(`${colors.yellow}⚠ High average tool count might indicate over-searching${colors.reset}`);
    }
    
    console.log(`\n${colors.green}✨ Optimization Suggestions:${colors.reset}`);
    console.log('• Use specific SKUs/model numbers when known for fastest results');
    console.log('• Complex queries benefit from parallel execution');
    console.log('• Consider caching frequent searches to reduce tool calls');
    
    // Final summary
    console.log(`\n${colors.cyan}${colors.bright}${'═'.repeat(70)}${colors.reset}`);
    console.log(`${colors.green}${colors.bright}✅ ANALYSIS COMPLETE${colors.reset}`);
    console.log(`System is using an average of ${colors.yellow}${avgToolsOverall.toFixed(1)}${colors.reset} tools per query`);
    console.log(`with ${colors.yellow}${((parallelCount/totalQueries)*100).toFixed(0)}%${colors.reset} parallel execution rate`);
    console.log(`${colors.cyan}${colors.bright}${'═'.repeat(70)}${colors.reset}`);
  }
}

// Run the comprehensive analysis
const analyzer = new ComprehensiveToolAnalysis();
analyzer.runAnalysis().catch(console.error);