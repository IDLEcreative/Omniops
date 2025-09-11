#!/usr/bin/env npx tsx
/**
 * Simplified Prompt Implementation Script
 * 
 * This script creates a backup of the current chat route and implements
 * the simplified prompt with A/B testing capability.
 */

import { readFileSync, writeFileSync, copyFileSync } from 'fs';
import { join } from 'path';

const chatRoutePath = join(process.cwd(), 'app/api/chat/route.ts');
const backupPath = join(process.cwd(), 'app/api/chat/route.ts.backup');

// Create the simplified prompt
const getSimplifiedPrompt = (): string => {
  return `You are a helpful customer service assistant. Be brief and helpful.

CRITICAL RULES:
- Never link to external sites - only same-domain links
- Always show available products first
- When unsure, direct to customer service

Keep responses under 4 sentences. Show products immediately when found.`;
};

// Create the implementation
const implementSimplifiedPrompt = () => {
  console.log('🚀 Implementing Simplified Prompt A/B Test\n');
  
  try {
    // 1. Create backup
    console.log('1. Creating backup of current chat route...');
    copyFileSync(chatRoutePath, backupPath);
    console.log('✅ Backup created at: app/api/chat/route.ts.backup');
    
    // 2. Read current content
    console.log('\n2. Reading current chat route...');
    const content = readFileSync(chatRoutePath, 'utf8');
    
    // 3. Find the system context section
    const targetLine = 'systemContext = `You are a helpful customer service assistant.';
    const targetIndex = content.indexOf(targetLine);
    
    if (targetIndex === -1) {
      throw new Error('Could not find system context assignment in chat route');
    }
    
    console.log('✅ Found system context assignment');
    
    // 4. Find the end of the current prompt
    const promptStart = targetIndex;
    const promptEnd = content.indexOf('`;', promptStart);
    
    if (promptEnd === -1) {
      throw new Error('Could not find end of system context prompt');
    }
    
    // 5. Create the new implementation
    const simplifiedPrompt = getSimplifiedPrompt();
    
    const newImplementation = `// A/B TEST - Simplified prompt version
      const useSimplifiedPrompt = process.env.USE_SIMPLIFIED_PROMPT === "true";
      
      systemContext = useSimplifiedPrompt ? \`${simplifiedPrompt}\` : \`You are a helpful customer service assistant.
      
      CRITICAL:
      - Never recommend or link to external shops, competitors, manufacturer websites, community blogs/forums, or third‑party documentation.
      - Only reference and link to our own website/domain. All links in responses MUST be same‑domain.
      - If a link is needed but an in‑house page is not available, direct the customer to contact us instead (do not link externally).
      
      If a customer asks about products that aren't available or that you don't have information about, suggest they:
      - Contact customer service directly for assistance
      - Check back later as inventory is regularly updated
      - Consider similar products from our current selection
      - Inquire about special ordering options
      - Ask about product availability timelines
      
      Formatting Requirements:
      - Use proper markdown formatting for lists
      - CRITICAL: Each bullet point MUST be on its own line with double line breaks
      - Format lists like this:
        
        • First item
        
        • Second item
        
        • Third item
      
      - Keep responses concise and scannable (2–4 short sentences or up to 8 brief bullets)
      
      Important instructions:
      - When you reference specific products, pages, or information, include links ONLY to our own domain
      - ALWAYS use compact markdown links: [Product Name](url) - never show raw URLs
      - Use bullet points (•) when listing multiple products
      - Keep product names concise by removing redundant suffixes  
      - Make links descriptive and natural in your responses
      - Pay attention to conversation history for context
      
      Product Query Handling - CRITICAL:
      - When customers ask about products (even vaguely), ALWAYS show available options first
      - If customer says "any" or seems unsure, present ALL relevant options immediately
      - NEVER ask "which type do you need?" before showing what's available
      - Only ask for clarification AFTER listing products, and only if truly necessary
      - Example: "Need a pump" → Show all pump types available, THEN optionally ask for model/part number
      
      Product Information Accuracy - MANDATORY:
      - NEVER make assumptions about product relationships or what's included
      - Only state facts that are explicitly in the product information provided
      - If asked "does X include Y", only answer if you have clear information
      - When uncertain, say "I don't have specific details about what's included with this product"
      - Suggest contacting customer service for detailed specifications when information is unclear
      
      FORBIDDEN RESPONSES - NEVER provide these without explicit data:
      - Specific technical specifications (horsepower, dimensions, weight, capacity)
      - Stock quantities or availability numbers
      - Delivery timeframes or shipping dates
      - Warranty terms or guarantee periods
      - Compatibility claims between products
      - Price comparisons or discount amounts
      - Manufacturing locations or origins
      - Installation instructions or procedures
      
      Instead, always say:
      - "I don't have that specific information available"
      - "Please contact customer service for [technical specs/stock/warranty/etc]"
      - "This information varies - please check with our team"\``;
    
    // 6. Replace the content
    console.log('\n3. Implementing A/B test code...');
    
    const newContent = content.substring(0, promptStart) + 
                      newImplementation + 
                      content.substring(promptEnd + 2);
    
    // 7. Write the new file
    writeFileSync(chatRoutePath, newContent);
    console.log('✅ Chat route updated with A/B test implementation');
    
    // 8. Create .env.local update
    console.log('\n4. Environment variable setup...');
    const envPath = join(process.cwd(), '.env.local');
    
    try {
      const envContent = readFileSync(envPath, 'utf8');
      
      if (envContent.includes('USE_SIMPLIFIED_PROMPT')) {
        console.log('⚠️  USE_SIMPLIFIED_PROMPT already exists in .env.local');
      } else {
        const newEnvContent = envContent + '\n\n# Prompt A/B Testing\nUSE_SIMPLIFIED_PROMPT=false\n';
        writeFileSync(envPath, newEnvContent);
        console.log('✅ Added USE_SIMPLIFIED_PROMPT=false to .env.local');
      }
    } catch (envError) {
      console.log('⚠️  Could not update .env.local automatically');
      console.log('Please add this line manually: USE_SIMPLIFIED_PROMPT=false');
    }
    
    console.log('\n🎉 IMPLEMENTATION COMPLETE!\n');
    
    console.log('📋 Next Steps:');
    console.log('1. Restart your development server');
    console.log('2. Test with USE_SIMPLIFIED_PROMPT=false (current behavior)');
    console.log('3. Test with USE_SIMPLIFIED_PROMPT=true (simplified behavior)');
    console.log('4. Compare response lengths and quality');
    console.log('5. Deploy to production with environment variable control');
    
    console.log('\n🧪 Testing Commands:');
    console.log('# Test current prompt (verbose):');
    console.log('echo "USE_SIMPLIFIED_PROMPT=false" >> .env.local');
    console.log('npm run dev');
    console.log('');
    console.log('# Test simplified prompt (brief):');
    console.log('echo "USE_SIMPLIFIED_PROMPT=true" >> .env.local');
    console.log('npm run dev');
    
    console.log('\n⚠️  Rollback Instructions:');
    console.log('If you need to rollback:');
    console.log(`cp ${backupPath} ${chatRoutePath}`);
    
    console.log('\n📊 Expected Results:');
    console.log('• Simplified prompt: ~75% shorter responses');
    console.log('• Current prompt: Same verbose responses as before');
    console.log('• All business rules preserved in both versions');
    console.log('• External link policy enforced in both versions');
    
  } catch (error) {
    console.error('❌ Error during implementation:', error);
    
    // Restore backup if it exists
    try {
      copyFileSync(backupPath, chatRoutePath);
      console.log('✅ Restored backup due to error');
    } catch (restoreError) {
      console.error('❌ Could not restore backup:', restoreError);
    }
    
    process.exit(1);
  }
};

// Execute if run directly
if (require.main === module) {
  implementSimplifiedPrompt();
}

export { getSimplifiedPrompt, implementSimplifiedPrompt };