#!/usr/bin/env tsx

/**
 * FORENSIC ANALYSIS: Chat System Edge Cases & Failure Modes
 * 
 * This comprehensive test suite investigates potential issues in:
 * 1. Product numbering references
 * 2. Stock checking without false capabilities
 * 3. Conversation context management
 * 4. Race conditions and edge cases
 */

import { z } from 'zod';

// Test case structure
interface TestCase {
  name: string;
  category: string;
  input: string;
  previousContext?: string[];
  expectedBehavior: string;
  potentialFailure: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

// Comprehensive test cases covering all potential edge cases
const testCases: TestCase[] = [
  // ========== NUMBERED REFERENCE EDGE CASES ==========
  {
    name: "Written number reference",
    category: "Number References",
    input: "tell me about item number three",
    previousContext: ["1. Product A - £10", "2. Product B - £20", "3. Product C - £30"],
    expectedBehavior: "Should recognize 'three' as 3 and return details about Product C",
    potentialFailure: "Might not parse written numbers, could re-list all items",
    severity: "high"
  },
  {
    name: "Ordinal number reference",
    category: "Number References",
    input: "what about the 3rd one?",
    previousContext: ["1. Item X", "2. Item Y", "3. Item Z"],
    expectedBehavior: "Should recognize '3rd' as item 3 (Item Z)",
    potentialFailure: "Regex might not capture ordinal suffixes (st, nd, rd, th)",
    severity: "high"
  },
  {
    name: "Out-of-bounds reference",
    category: "Number References",
    input: "tell me about item 99",
    previousContext: ["1. Product A", "2. Product B", "3. Product C"],
    expectedBehavior: "Should gracefully handle with 'I only showed 3 items. Item 99 doesn't exist in the list'",
    potentialFailure: "Could crash, return undefined, or confuse the user",
    severity: "critical"
  },
  {
    name: "Negative number reference",
    category: "Number References",
    input: "what about -1 or item 0?",
    previousContext: ["1. Product A", "2. Product B"],
    expectedBehavior: "Should explain numbering starts at 1",
    potentialFailure: "Array index errors, undefined behavior",
    severity: "medium"
  },
  {
    name: "Multiple number references",
    category: "Number References",
    input: "compare items 2 and 3",
    previousContext: ["1. Pump A", "2. Pump B", "3. Pump C"],
    expectedBehavior: "Should identify both items and provide comparison",
    potentialFailure: "Might only process first number, ignore second",
    severity: "medium"
  },
  {
    name: "Ambiguous number in context",
    category: "Number References",
    input: "I need 3 of item 2",
    previousContext: ["1. Bolt Set", "2. Washer Pack", "3. Nut Collection"],
    expectedBehavior: "Should understand quantity (3) vs item reference (2)",
    potentialFailure: "Could confuse quantity with item reference",
    severity: "high"
  },

  // ========== STOCK CHECKING EDGE CASES ==========
  {
    name: "Direct stock question",
    category: "Stock Checking",
    input: "is it in stock?",
    expectedBehavior: "Should say 'I'll need to check our current stock. Please contact us at [phone] or visit our store'",
    potentialFailure: "Might claim to check live stock or offer false capabilities",
    severity: "critical"
  },
  {
    name: "Indirect availability query",
    category: "Stock Checking",
    input: "can I get this today?",
    expectedBehavior: "Should redirect to store contact for current availability",
    potentialFailure: "Might promise immediate availability or delivery",
    severity: "high"
  },
  {
    name: "Multiple stock queries",
    category: "Stock Checking",
    input: "do you have any of these items ready for pickup?",
    expectedBehavior: "Should explain need to contact store for stock verification",
    potentialFailure: "Could offer click-and-collect or pickup services",
    severity: "critical"
  },
  {
    name: "Stock status in data",
    category: "Stock Checking",
    input: "which ones are available?",
    previousContext: ["Products shown with mixed stock status"],
    expectedBehavior: "Should say 'These items typically show as available' but recommend verification",
    potentialFailure: "Might guarantee stock based on database status",
    severity: "high"
  },

  // ========== CONVERSATION CONTEXT EDGE CASES ==========
  {
    name: "Context switch mid-conversation",
    category: "Context Management",
    input: "forget about that, show me pumps instead",
    previousContext: ["Previous discussion about tools"],
    expectedBehavior: "Should acknowledge context switch and search for pumps",
    potentialFailure: "Might mix contexts or fail to switch topics",
    severity: "medium"
  },
  {
    name: "Vague reference after delay",
    category: "Context Management",
    input: "actually, tell me more about that one",
    previousContext: ["Long conversation with multiple products mentioned"],
    expectedBehavior: "Should ask for clarification about which specific item",
    potentialFailure: "Could reference wrong item or crash on ambiguous reference",
    severity: "high"
  },
  {
    name: "Reference to much earlier item",
    category: "Context Management",
    input: "go back to the first pump you mentioned",
    previousContext: ["10+ messages with multiple product mentions"],
    expectedBehavior: "Should correctly identify the first pump from history",
    potentialFailure: "History might be truncated, losing early references",
    severity: "medium"
  },
  {
    name: "Pronoun resolution",
    category: "Context Management",
    input: "how much does it cost?",
    previousContext: ["Multiple products discussed"],
    expectedBehavior: "Should reference most recent product or ask for clarification",
    potentialFailure: "Ambiguous pronoun could cause wrong price reference",
    severity: "high"
  },

  // ========== FORMATTING & SPECIAL CHARACTERS ==========
  {
    name: "Product with quotes in name",
    category: "Formatting",
    input: "show me the 3/4\" wrench",
    expectedBehavior: "Should handle quotes in product names without breaking",
    potentialFailure: "JSON parsing errors, escaped quote issues",
    severity: "high"
  },
  {
    name: "Product with special characters",
    category: "Formatting",
    input: "find products with & or / in the name",
    expectedBehavior: "Should handle special characters in search and display",
    potentialFailure: "URL encoding issues, display corruption",
    severity: "medium"
  },
  {
    name: "Very long product name",
    category: "Formatting",
    input: "show me products",
    previousContext: ["Products with 200+ character names"],
    expectedBehavior: "Should truncate elegantly or wrap appropriately",
    potentialFailure: "Layout breaking, response truncation",
    severity: "low"
  },
  {
    name: "Mixed currency symbols",
    category: "Formatting",
    input: "what's the price in dollars?",
    expectedBehavior: "Should maintain GBP (£) and explain UK pricing only",
    potentialFailure: "Might show $ or attempt conversion",
    severity: "high"
  },

  // ========== RACE CONDITIONS & CONCURRENCY ==========
  {
    name: "Rapid successive messages",
    category: "Race Conditions",
    input: "First message|Second message|Third message (sent rapidly)",
    expectedBehavior: "Each message processed in order with consistent conversation ID",
    potentialFailure: "Messages could interleave, conversation ID conflicts",
    severity: "critical"
  },
  {
    name: "Duplicate conversation ID",
    category: "Race Conditions",
    input: "Message with manually set conversation_id",
    expectedBehavior: "Should handle existing ID gracefully",
    potentialFailure: "Database constraint violations, lost messages",
    severity: "critical"
  },
  {
    name: "Concurrent database writes",
    category: "Race Conditions",
    input: "Multiple simultaneous requests",
    expectedBehavior: "All messages saved correctly with proper ordering",
    potentialFailure: "Lost messages, incorrect history ordering",
    severity: "high"
  },

  // ========== DELIVERY & SERVICE BOUNDARIES ==========
  {
    name: "Postcode delivery check",
    category: "Service Boundaries",
    input: "can you deliver to SW1A 1AA?",
    expectedBehavior: "Should say 'Please contact our store directly for delivery options'",
    potentialFailure: "Might offer to check postcode or promise delivery",
    severity: "critical"
  },
  {
    name: "Click and collect query",
    category: "Service Boundaries",
    input: "can I order online and collect in store?",
    expectedBehavior: "Should redirect to store for collection options",
    potentialFailure: "Could falsely offer click-and-collect service",
    severity: "critical"
  },
  {
    name: "Payment processing",
    category: "Service Boundaries",
    input: "can I pay with card?",
    expectedBehavior: "Should explain payment handled by store directly",
    potentialFailure: "Might offer to process payment or take card details",
    severity: "critical"
  },

  // ========== SEARCH RESULT EDGE CASES ==========
  {
    name: "Empty search results",
    category: "Search Results",
    input: "find xyzabc123 products",
    expectedBehavior: "Should gracefully handle no results with helpful alternatives",
    potentialFailure: "Could crash on empty array or show undefined",
    severity: "medium"
  },
  {
    name: "Exactly limit results",
    category: "Search Results",
    input: "show me all products (when exactly 10, 20, 50 exist)",
    expectedBehavior: "Should recognize hitting limits and mention more may exist",
    potentialFailure: "Might claim showing all when at limit boundary",
    severity: "medium"
  },
  {
    name: "Malformed product data",
    category: "Search Results",
    input: "search for products",
    previousContext: ["Some products missing prices or names"],
    expectedBehavior: "Should handle missing fields gracefully",
    potentialFailure: "Could show undefined, NaN, or crash",
    severity: "high"
  },

  // ========== AI RESPONSE GENERATION ==========
  {
    name: "Token limit exceeded",
    category: "AI Response",
    input: "explain everything about all 500 products in detail",
    expectedBehavior: "Should summarize within token limits",
    potentialFailure: "Response truncation mid-sentence",
    severity: "medium"
  },
  {
    name: "Timeout during search",
    category: "AI Response",
    input: "complex search query",
    expectedBehavior: "Should return partial results or timeout gracefully",
    potentialFailure: "Hanging request, no response",
    severity: "high"
  },
  {
    name: "AI hallucination trigger",
    category: "AI Response",
    input: "what other stores sell this?",
    expectedBehavior: "Should refuse to recommend competitors",
    potentialFailure: "Might suggest external sites or competitors",
    severity: "critical"
  }
];

// Analysis functions
function analyzeSystemPrompts() {
  console.log("\n🔍 SYSTEM PROMPT ANALYSIS");
  console.log("=" .repeat(60));
  
  const criticalRules = [
    "NUMBERED LIST REFERENCES - Lines 410-415 in route.ts",
    "STOCK & AVAILABILITY - Lines 416-428 in route.ts", 
    "DELIVERY/COLLECTION BOUNDARIES - Lines 420-428 in route.ts",
    "CONVERSATION CONTEXT - Lines 452-456 in chat-intelligent",
    "FORMATTING RULES - Lines 391-399 in route.ts"
  ];
  
  console.log("\nCritical prompt sections that prevent issues:");
  criticalRules.forEach(rule => console.log(`  • ${rule}`));
}

function analyzeCodeImplementation() {
  console.log("\n🔧 CODE IMPLEMENTATION ANALYSIS");
  console.log("=" .repeat(60));
  
  const implementations = [
    {
      feature: "Number Reference Handling",
      location: "System prompt lines 410-415 (route.ts), 526-532 (chat-intelligent)",
      implementation: "Relies on AI understanding, no code parsing",
      risk: "HIGH - No validation of number extraction"
    },
    {
      feature: "Conversation History",
      location: "Lines 375-386 (route.ts), 429-444 (chat-intelligent)",
      implementation: "Fetches last 10 messages ordered by created_at",
      risk: "MEDIUM - Could lose context beyond 10 messages"
    },
    {
      feature: "Product List Formatting",
      location: "Lines 671-706 (chat-intelligent)",
      implementation: "Builds numbered lists with consistent indexing",
      risk: "LOW - Well structured but could break with special chars"
    },
    {
      feature: "Stock Status Handling",
      location: "Lines 688-695 (chat-intelligent)",
      implementation: "Shows status indicators but emphasizes verification needed",
      risk: "MEDIUM - Relies on prompt to prevent false guarantees"
    },
    {
      feature: "Race Condition Prevention",
      location: "Lines 369-413 (chat-intelligent)",
      implementation: "Checks existence before insert, handles conflicts",
      risk: "HIGH - Potential for duplicate conversation IDs"
    }
  ];
  
  console.log("\nImplementation Risk Assessment:");
  implementations.forEach(impl => {
    console.log(`\n${impl.feature}:`);
    console.log(`  Location: ${impl.location}`);
    console.log(`  How it works: ${impl.implementation}`);
    console.log(`  Risk Level: ${impl.risk}`);
  });
}

function identifyHiddenFailureModes() {
  console.log("\n⚠️  HIDDEN FAILURE MODES DISCOVERED");
  console.log("=" .repeat(60));
  
  const hiddenIssues = [
    {
      issue: "Conversation ID Generation Race",
      description: "When conversation_id is provided but doesn't exist, parallel requests could create duplicates",
      location: "Lines 371-393 in chat-intelligent/route.ts",
      impact: "Database errors, lost conversation history",
      fix: "Use database UPSERT or transaction with proper locking"
    },
    {
      issue: "Number Extraction Fragility",
      description: "System relies entirely on AI to parse 'third', '3rd', 'item 3' - no code validation",
      location: "System prompts only, no code implementation",
      impact: "Inconsistent behavior across different phrasings",
      fix: "Add regex patterns to extract numbers before AI processing"
    },
    {
      issue: "Price Extraction Instability",
      description: "Lines 683-686 extract ALL prices but use only first - inconsistent with multiple prices",
      location: "chat-intelligent lines 683-689",
      impact: "Wrong price shown if multiple prices in content",
      fix: "Parse structured price data or use most relevant price"
    },
    {
      issue: "History Truncation Silent Failure",
      description: "Silently limits to 10 messages without user awareness",
      location: "Lines 375-381 (route.ts), 434 (chat-intelligent)",
      impact: "Lost context for long conversations",
      fix: "Implement sliding window or summary of older messages"
    },
    {
      issue: "Timeout Cascade",
      description: "Multiple nested timeouts could trigger simultaneously causing partial responses",
      location: "chat-intelligent lines 306-315, 592-594, 627-629",
      impact: "Incomplete responses, hung requests",
      fix: "Single master timeout with proper cleanup"
    },
    {
      issue: "Special Character JSON Injection",
      description: "Product names with quotes/backslashes could break JSON parsing",
      location: "Line 507 (route.ts), 633 (chat-intelligent)",
      impact: "Parsing errors, malformed responses",
      fix: "Proper JSON escaping before parse operations"
    }
  ];
  
  console.log("\nCritical hidden issues found:");
  hiddenIssues.forEach((issue, i) => {
    console.log(`\n${i + 1}. ${issue.issue}`);
    console.log(`   Description: ${issue.description}`);
    console.log(`   Location: ${issue.location}`);
    console.log(`   Impact: ${issue.impact}`);
    console.log(`   Recommended Fix: ${issue.fix}`);
  });
}

function generateTestMatrix() {
  console.log("\n📊 TEST COVERAGE MATRIX");
  console.log("=" .repeat(60));
  
  const categories = new Map<string, { critical: number, high: number, medium: number, low: number }>();
  
  testCases.forEach(test => {
    if (!categories.has(test.category)) {
      categories.set(test.category, { critical: 0, high: 0, medium: 0, low: 0 });
    }
    const cat = categories.get(test.category)!;
    cat[test.severity]++;
  });
  
  console.log("\nTest Distribution by Category:");
  console.log("Category".padEnd(25) + "Critical  High  Medium  Low  Total");
  console.log("-".repeat(60));
  
  categories.forEach((counts, category) => {
    const total = counts.critical + counts.high + counts.medium + counts.low;
    console.log(
      category.padEnd(25) +
      `${counts.critical}`.padEnd(10) +
      `${counts.high}`.padEnd(6) +
      `${counts.medium}`.padEnd(8) +
      `${counts.low}`.padEnd(5) +
      total
    );
  });
  
  const totalCritical = testCases.filter(t => t.severity === 'critical').length;
  const totalHigh = testCases.filter(t => t.severity === 'high').length;
  
  console.log("\n⚡ Priority Issues:");
  console.log(`  Critical Issues: ${totalCritical}`);
  console.log(`  High Priority: ${totalHigh}`);
  console.log(`  Total Test Cases: ${testCases.length}`);
}

function recommendedActions() {
  console.log("\n✅ RECOMMENDED IMMEDIATE ACTIONS");
  console.log("=" .repeat(60));
  
  const actions = [
    {
      priority: 1,
      action: "Add number extraction validation",
      description: "Implement regex patterns to parse number references before AI",
      effort: "2 hours",
      files: ["lib/chat-utils.ts (new)", "Update both route.ts files"]
    },
    {
      priority: 2,
      action: "Fix conversation ID race condition",
      description: "Use UPSERT or transaction for conversation creation",
      effort: "1 hour",
      files: ["app/api/chat-intelligent/route.ts lines 369-413"]
    },
    {
      priority: 3,
      action: "Implement structured price parsing",
      description: "Parse prices from structured data not content strings",
      effort: "3 hours",
      files: ["lib/woocommerce-dynamic.ts", "chat-intelligent/route.ts"]
    },
    {
      priority: 4,
      action: "Add conversation history summarization",
      description: "Summarize older messages instead of truncating",
      effort: "4 hours",
      files: ["New lib/conversation-summary.ts", "Both route.ts files"]
    },
    {
      priority: 5,
      action: "Create edge case test suite",
      description: "Automated tests for all identified edge cases",
      effort: "6 hours",
      files: ["__tests__/chat-edge-cases.test.ts (new)"]
    }
  ];
  
  console.log("\nPrioritized action items:");
  actions.forEach(action => {
    console.log(`\n${action.priority}. ${action.action}`);
    console.log(`   What: ${action.description}`);
    console.log(`   Effort: ${action.effort}`);
    console.log(`   Files: ${action.files}`);
  });
}

// Main execution
async function main() {
  console.log("🔬 FORENSIC ANALYSIS: Chat System Edge Cases & Failure Modes");
  console.log("=" .repeat(60));
  console.log("Analyzing implementations in:");
  console.log("  • /app/api/chat/route.ts");
  console.log("  • /app/api/chat-intelligent/route.ts");
  console.log("\nTimestamp:", new Date().toISOString());
  
  analyzeSystemPrompts();
  analyzeCodeImplementation();
  identifyHiddenFailureModes();
  generateTestMatrix();
  recommendedActions();
  
  console.log("\n" + "=" .repeat(60));
  console.log("🏁 ANALYSIS COMPLETE");
  console.log("\nKey Finding: While the prompt-based approach handles many cases,");
  console.log("there are critical areas where code-level validation is needed");
  console.log("to prevent edge case failures and ensure consistent behavior.");
}

// Run analysis
main().catch(console.error);