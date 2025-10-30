#!/usr/bin/env npx tsx
/**
 * Test how the system handles searches with many results
 * What does the model know and what does it tell the user?
 */

import { v4 as uuidv4 } from 'uuid';
import chalk from 'chalk';

const API_URL = 'http://localhost:3000/api/chat';

async function testLargeResults() {
  console.log(chalk.bold.cyan('\n🔍 LARGE RESULT SET HANDLING TEST'));
  console.log(chalk.cyan('Testing what happens when there are many products'));
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
  
  const sessionId = uuidv4();
  
  // Test queries that likely have different amounts of results
  const queries = [
    { query: 'Show me all pumps', expectedMany: true },
    { query: 'Show me all Cifa products', expectedMany: true },
    { query: 'Show me everything you have', expectedMany: true },
    { query: 'Show me the A4VTG90 pump', expectedMany: false },
  ];
  
  for (const test of queries) {
    console.log(chalk.yellow(`\nQuery: "${test.query}"`));
    console.log(chalk.gray('Expected many results:', test.expectedMany ? 'Yes' : 'No'));
    
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: test.query,
        session_id: sessionId,
        domain: 'thompsonseparts.co.uk',
      }),
    });
    
    const data = await response.json();
    const message = data.message;
    
    // Analyze what the model says
    console.log(chalk.blue('\nBot response (first 300 chars):'));
    console.log(chalk.blue(message.substring(0, 300) + '...'));
    
    // Extract numbers mentioned
    const numbers = message.match(/\b\d+\b/g) || [];
    console.log(chalk.gray(`\nNumbers mentioned: ${numbers.join(', ') || 'none'}`));
    
    // Check what language is used
    const usesExactCount = numbers.some(n => parseInt(n) === 20);
    const usesVagueLanguage = 
      message.toLowerCase().includes('extensive') ||
      message.toLowerCase().includes('wide range') ||
      message.toLowerCase().includes('many') ||
      message.toLowerCase().includes('various') ||
      message.toLowerCase().includes('several');
    const mentionsLimit = 
      message.toLowerCase().includes('limit') ||
      message.toLowerCase().includes('showing') ||
      message.toLowerCase().includes('here are some');
    
    console.log(chalk.gray('Analysis:'));
    console.log(chalk.gray(`  • Says exactly "20": ${usesExactCount ? '✓' : '✗'}`));
    console.log(chalk.gray(`  • Uses vague language (extensive/many): ${usesVagueLanguage ? '✓' : '✗'}`));
    console.log(chalk.gray(`  • Mentions showing partial results: ${mentionsLimit ? '✓' : '✗'}`));
    
    // Check the searchMetadata if available
    if (data.searchMetadata) {
      console.log(chalk.yellow('\nSearch Metadata (what actually happened):'));
      console.log(chalk.gray(`  • Total searches: ${data.searchMetadata.totalSearches}`));
      if (data.searchMetadata.searchLog) {
        data.searchMetadata.searchLog.forEach((log: any) => {
          console.log(chalk.gray(`  • ${log.tool}: "${log.query}" → ${log.resultCount} results`));
        });
      }
    }
    
    console.log(chalk.cyan('-'.repeat(70)));
    
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log(chalk.bold.cyan('\n📊 SUMMARY'));
  console.log(chalk.cyan('=' .repeat(70)));
  console.log(chalk.green('\nThe model behavior:'));
  console.log(chalk.green('1. Search tools are LIMITED to max 20 results per search'));
  console.log(chalk.green('2. When exactly 20 results come back, the model is told "likely hit search limit"'));
  console.log(chalk.green('3. The model should use vague language like "extensive range" not "exactly 20"'));
  console.log(chalk.green('4. The true total count is UNKNOWN - the database might have 200+ but search only returns 20'));
  console.log(chalk.cyan('=' .repeat(70) + '\n'));
}

testLargeResults().catch(console.error);