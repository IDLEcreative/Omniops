#!/usr/bin/env npx tsx
/**
 * Comprehensive test to trace AI reasoning through the standard chat route
 * Specifically tests: "Need a pump for my Cifa mixer"
 */

import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createServiceRoleClient } from './lib/supabase-server';
import { getEnhancedChatContext } from './lib/chat-context-enhancer';
import { smartSearch } from './lib/search-wrapper';
import OpenAI from 'openai';

dotenv.config({ path: '.env.local' });

const DOMAIN = 'thompsonseparts.co.uk';
const TEST_QUERY = 'Need a pump for my Cifa mixer';

interface ReasoningStep {
  phase: string;
  timestamp: number;
  details: any;
  duration?: number;
}

class CifaReasoningAnalyzer {
  private steps: ReasoningStep[] = [];
  private startTime: number = Date.now();
  private openai: OpenAI;
  
  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    this.openai = new OpenAI({ apiKey });
  }

  private logStep(phase: string, details: any) {
    const now = Date.now();
    const lastStep = this.steps[this.steps.length - 1];
    
    if (lastStep) {
      lastStep.duration = now - lastStep.timestamp;
    }
    
    this.steps.push({
      phase,
      timestamp: now,
      details
    });
    
    console.log(`\n⚡ ${phase}`);
    console.log('━'.repeat(50));
    if (typeof details === 'object') {
      console.log(JSON.stringify(details, null, 2));
    } else {
      console.log(details);
    }
  }

  async traceCifaSearchReasoning() {
    console.log('🔬 CIFA SEARCH REASONING TRACE');
    console.log('═'.repeat(60));
    console.log(`Query: "${TEST_QUERY}"`);
    console.log(`Domain: ${DOMAIN}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log('═'.repeat(60));

    try {
      // Initialize Supabase
      const supabase = await createServiceRoleClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      // PHASE 1: Domain Resolution
      this.logStep('1. DOMAIN RESOLUTION', {
        input: DOMAIN,
        action: 'Looking up domain ID for context retrieval'
      });
      
      const { data: domainData } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', DOMAIN)
        .single();
      
      if (!domainData) {
        throw new Error('Domain not found');
      }
      
      const domainId = domainData.id;
      this.logStep('Domain ID Retrieved', { domainId });

      // PHASE 2: Query Analysis
      this.logStep('2. QUERY ANALYSIS', {
        query: TEST_QUERY,
        tokens: TEST_QUERY.toLowerCase().split(/\s+/),
        patterns: {
          isGreeting: false,
          isContactRequest: false,
          isCustomerQuery: false,
          productRequest: true
        },
        identifiedElements: {
          action: 'Need',
          product: 'pump',
          brand: 'Cifa',
          equipment: 'mixer'
        }
      });

      // PHASE 3: Enhanced Context Retrieval
      this.logStep('3. ENHANCED CONTEXT RETRIEVAL', {
        method: 'getEnhancedChatContext',
        parameters: {
          query: TEST_QUERY,
          domain: DOMAIN,
          domainId,
          minChunks: 20,
          maxChunks: 25
        }
      });
      
      const enhancedContext = await getEnhancedChatContext(
        TEST_QUERY,
        DOMAIN,
        domainId,
        {
          enableSmartSearch: true,
          minChunks: 20,
          maxChunks: 25,
          conversationHistory: []
        }
      );

      this.logStep('Enhanced Context Results', {
        totalChunks: enhancedContext.totalChunks,
        averageSimilarity: enhancedContext.averageSimilarity?.toFixed(3),
        hasHighConfidence: enhancedContext.hasHighConfidence,
        contextSummary: enhancedContext.contextSummary,
        reformulatedQuery: enhancedContext.reformulatedQuery,
        queryStrategy: enhancedContext.queryStrategy,
        topMatches: enhancedContext.chunks.slice(0, 5).map(chunk => ({
          title: chunk.title,
          url: chunk.url,
          similarity: chunk.similarity?.toFixed(3),
          contentPreview: chunk.content?.substring(0, 100) + '...'
        }))
      });

      // Analyze what was found
      const cifaSpecificResults = enhancedContext.chunks.filter(chunk =>
        chunk.content?.toLowerCase().includes('cifa') ||
        chunk.title?.toLowerCase().includes('cifa')
      );
      
      const pumpResults = enhancedContext.chunks.filter(chunk =>
        chunk.content?.toLowerCase().includes('pump') ||
        chunk.title?.toLowerCase().includes('pump')
      );

      this.logStep('Content Analysis', {
        cifaSpecificMatches: cifaSpecificResults.length,
        pumpMatches: pumpResults.length,
        hasDirectCifaProducts: cifaSpecificResults.length > 0,
        hasPumpProducts: pumpResults.length > 0,
        needsFallback: cifaSpecificResults.length === 0
      });

      // PHASE 4: Fallback Search (if needed)
      if (cifaSpecificResults.length === 0) {
        this.logStep('4. FALLBACK SEARCH TRIGGERED', {
          reason: 'No Cifa-specific results found',
          strategy: 'Broadening search to general pumps'
        });
        
        const fallbackResults = await smartSearch(
          'pump',  // Broader search
          DOMAIN,
          10,
          0.2,
          {
            boostRecent: true
          }
        );

        this.logStep('Fallback Results', {
          resultCount: fallbackResults.length,
          topResults: fallbackResults.slice(0, 3).map((r: any) => ({
            title: r.title,
            url: r.url,
            similarity: r.similarity?.toFixed(3)
          }))
        });
      }

      // PHASE 5: System Prompt Construction
      this.logStep('5. SYSTEM PROMPT CONSTRUCTION', {
        contextChunks: enhancedContext.chunks.length,
        includesContactInfo: false,
        includesCategories: false,
        promptStrategy: cifaSpecificResults.length > 0 ? 'specific_products' : 'alternative_suggestions'
      });

      const systemPrompt = this.buildAnalysisPrompt(enhancedContext.chunks);
      
      // PHASE 6: AI Processing
      this.logStep('6. AI PROCESSING', {
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
        systemPromptLength: systemPrompt.length,
        userMessage: TEST_QUERY
      });

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: TEST_QUERY }
        ],
        temperature: 0.7,
        max_tokens: 1000
      });

      const aiResponse = completion.choices[0]?.message?.content || '';
      
      this.logStep('AI Response Generated', {
        responseLength: aiResponse.length,
        tokensUsed: completion.usage,
        responsePreview: aiResponse.substring(0, 300) + '...'
      });

      // PHASE 7: Response Analysis
      const responseAnalysis = this.analyzeResponse(aiResponse, enhancedContext.chunks);
      
      this.logStep('7. RESPONSE ANALYSIS', responseAnalysis);

      // PHASE 8: Generate Final Report
      this.generateComprehensiveReport(enhancedContext, aiResponse, responseAnalysis);

    } catch (error) {
      console.error('❌ Analysis failed:', error);
      this.logStep('ERROR', {
        message: error instanceof Error ? error.message : 'Unknown error',
        phase: 'Analysis failed'
      });
    }
  }

  private buildAnalysisPrompt(chunks: any[]): string {
    let prompt = `You are a customer service assistant for an e-commerce parts supplier.

IMPORTANT CONTEXT FROM OUR WEBSITE:
`;

    // Group chunks by similarity
    const highConfidence = chunks.filter(c => c.similarity > 0.75);
    const mediumConfidence = chunks.filter(c => c.similarity > 0.5 && c.similarity <= 0.75);
    const lowConfidence = chunks.filter(c => c.similarity <= 0.5);

    if (highConfidence.length > 0) {
      prompt += '\n🟢 HIGH CONFIDENCE MATCHES:\n';
      highConfidence.forEach((chunk, i) => {
        prompt += `${i + 1}. [${chunk.title}](${chunk.url})\n`;
        prompt += `   Similarity: ${chunk.similarity?.toFixed(3)}\n`;
        prompt += `   Content: ${chunk.content?.substring(0, 150)}...\n\n`;
      });
    }

    if (mediumConfidence.length > 0) {
      prompt += '\n🟡 MEDIUM CONFIDENCE MATCHES:\n';
      mediumConfidence.slice(0, 5).forEach((chunk, i) => {
        prompt += `${i + 1}. [${chunk.title}](${chunk.url})\n`;
        prompt += `   Similarity: ${chunk.similarity?.toFixed(3)}\n`;
        prompt += `   Content: ${chunk.content?.substring(0, 100)}...\n\n`;
      });
    }

    if (lowConfidence.length > 0) {
      prompt += '\n🔴 LOW CONFIDENCE MATCHES (may be alternatives):\n';
      lowConfidence.slice(0, 3).forEach((chunk, i) => {
        prompt += `${i + 1}. [${chunk.title}](${chunk.url})\n`;
        prompt += `   Similarity: ${chunk.similarity?.toFixed(3)}\n`;
      });
    }

    prompt += `
REASONING INSTRUCTIONS:
1. First identify what the customer needs (brand: Cifa, product: pump for mixer)
2. Check if we have exact matches in the high confidence results
3. If no exact matches, suggest the most relevant alternatives
4. Be honest about what we do and don't have
5. Always include product links when available
6. If Cifa products aren't available, acknowledge this and suggest alternatives

CRITICAL: Never invent products or specifications. Only reference what's in the context above.`;

    return prompt;
  }

  private analyzeResponse(response: string, chunks: any[]) {
    const responseLower = response.toLowerCase();
    
    // Check what the AI did
    const analysis = {
      // Content checks
      mentionsCifa: responseLower.includes('cifa'),
      mentionsPump: responseLower.includes('pump'),
      admitsNoDirectMatch: responseLower.includes("don't have") || 
                          responseLower.includes("not available") ||
                          responseLower.includes("unable to find"),
      suggestsAlternatives: responseLower.includes('alternative') ||
                           responseLower.includes('instead') ||
                           responseLower.includes('similar'),
      recommendsContact: responseLower.includes('contact') ||
                        responseLower.includes('customer service'),
      
      // Quality indicators
      includesLinks: response.includes('http') || response.includes(']('),
      includesPrices: response.includes('£'),
      responseLength: response.length,
      
      // Match analysis
      likelyUsedChunks: chunks.filter(chunk => {
        const chunkWords = chunk.title?.toLowerCase().split(/\s+/) || [];
        return chunkWords.some(word => word.length > 4 && responseLower.includes(word));
      }).length,
      
      // Strategy detection
      strategy: 'unknown' as string
    };
    
    // Determine strategy
    if (analysis.mentionsCifa && !analysis.admitsNoDirectMatch) {
      analysis.strategy = 'found_direct_match';
    } else if (analysis.admitsNoDirectMatch && analysis.suggestsAlternatives) {
      analysis.strategy = 'no_match_with_alternatives';
    } else if (analysis.admitsNoDirectMatch && analysis.recommendsContact) {
      analysis.strategy = 'no_match_contact_recommended';
    } else if (analysis.suggestsAlternatives) {
      analysis.strategy = 'alternatives_provided';
    } else {
      analysis.strategy = 'general_response';
    }
    
    return analysis;
  }

  private generateComprehensiveReport(context: any, response: string, analysis: any) {
    console.log('\n' + '═'.repeat(60));
    console.log('📊 COMPREHENSIVE REASONING REPORT');
    console.log('═'.repeat(60));
    
    // Calculate total time
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n📈 EXECUTION METRICS:');
    console.log(`• Total execution time: ${totalTime}ms`);
    console.log(`• Processing phases: ${this.steps.length}`);
    
    // Phase timings
    console.log('\n⏱️  PHASE TIMINGS:');
    this.steps.forEach((step, i) => {
      if (step.duration) {
        console.log(`  ${i + 1}. ${step.phase}: ${step.duration}ms`);
      }
    });
    
    console.log('\n🧠 AI REASONING ANALYSIS:');
    console.log(`• Query Strategy: ${context.queryStrategy || 'standard'}`);
    console.log(`• Reformulated Query: ${context.reformulatedQuery || 'none'}`);
    console.log(`• Context Quality: ${context.hasHighConfidence ? 'High Confidence' : 'Low Confidence'}`);
    console.log(`• Average Similarity: ${context.averageSimilarity?.toFixed(3) || 'N/A'}`);
    
    console.log('\n📝 RESPONSE CHARACTERISTICS:');
    console.log(`• Response Strategy: ${analysis.strategy}`);
    console.log(`• Mentions Cifa: ${analysis.mentionsCifa ? '✅' : '❌'}`);
    console.log(`• Mentions Pump: ${analysis.mentionsPump ? '✅' : '❌'}`);
    console.log(`• Admits No Match: ${analysis.admitsNoDirectMatch ? '✅' : '❌'}`);
    console.log(`• Suggests Alternatives: ${analysis.suggestsAlternatives ? '✅' : '❌'}`);
    console.log(`• Includes Links: ${analysis.includesLinks ? '✅' : '❌'}`);
    console.log(`• Includes Prices: ${analysis.includesPrices ? '✅' : '❌'}`);
    
    console.log('\n🎯 REASONING EFFECTIVENESS:');
    const effectivenessScore = this.calculateEffectiveness(context, analysis);
    console.log(`• Overall Score: ${effectivenessScore}/10`);
    console.log(`• Chunks Retrieved: ${context.totalChunks}`);
    console.log(`• Chunks Likely Used: ${analysis.likelyUsedChunks}`);
    console.log(`• Response Length: ${analysis.responseLength} characters`);
    
    console.log('\n💡 KEY INSIGHTS:');
    if (!analysis.mentionsCifa && context.chunks.some((c: any) => c.content?.toLowerCase().includes('cifa'))) {
      console.log('⚠️  AI failed to mention Cifa despite having relevant context');
    }
    if (analysis.admitsNoDirectMatch) {
      console.log('✅ AI correctly admitted when Cifa products weren\'t available');
    }
    if (analysis.suggestsAlternatives) {
      console.log('✅ AI proactively suggested alternative solutions');
    }
    if (!analysis.includesLinks && context.chunks.length > 0) {
      console.log('⚠️  AI didn\'t include product links despite having context');
    }
    
    console.log('\n📋 FINAL VERDICT:');
    if (effectivenessScore >= 8) {
      console.log('🏆 EXCELLENT: AI demonstrated strong reasoning and helpful response');
    } else if (effectivenessScore >= 6) {
      console.log('✅ GOOD: AI provided reasonable response with room for improvement');
    } else if (effectivenessScore >= 4) {
      console.log('⚠️  FAIR: AI response was adequate but missed opportunities');
    } else {
      console.log('❌ POOR: AI reasoning needs significant improvement');
    }
    
    console.log('\n' + '═'.repeat(60));
    console.log('✅ REASONING TRACE COMPLETE');
    console.log('═'.repeat(60));
  }
  
  private calculateEffectiveness(context: any, analysis: any): number {
    let score = 0;
    
    // Base score for generating response
    score += 2;
    
    // Context utilization
    if (analysis.likelyUsedChunks > 0) score += 2;
    if (analysis.likelyUsedChunks >= 3) score += 1;
    
    // Response quality
    if (analysis.includesLinks) score += 1;
    if (analysis.responseLength > 100) score += 1;
    
    // Reasoning quality
    if (analysis.admitsNoDirectMatch && !context.hasHighConfidence) score += 1;
    if (analysis.suggestsAlternatives) score += 1;
    if (analysis.strategy !== 'unknown') score += 1;
    
    return Math.min(score, 10);
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting Cifa Search Reasoning Trace...\n');
  
  try {
    const analyzer = new CifaReasoningAnalyzer();
    await analyzer.traceCifaSearchReasoning();
    
    console.log('\n✅ Analysis completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the analysis
main();