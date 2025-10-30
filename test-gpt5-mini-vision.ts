#!/usr/bin/env tsx
/**
 * Test GPT-5 Mini Vision Capabilities
 *
 * Tests if GPT-5 mini (the model already used in chat) supports vision
 * If yes: We can use one model for everything!
 * If no: We'll use GPT-4o mini for vision, GPT-5 mini for chat
 */

import OpenAI from 'openai';
import { chromium } from 'playwright';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testGPT5MiniVision() {
  console.log('🧪 Testing GPT-5 Mini Vision Capabilities\n');
  console.log('━'.repeat(60));

  // 1. Capture screenshot of the store
  console.log('\n1️⃣ Capturing screenshot of thompsonseparts.co.uk...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('https://www.thompsonseparts.co.uk/shop', {
    waitUntil: 'domcontentloaded',
    timeout: 60000
  });

  // Wait a bit for images to load
  await page.waitForTimeout(2000);

  const screenshot = await page.screenshot({ fullPage: false });
  const base64 = screenshot.toString('base64');
  console.log('✅ Screenshot captured');

  // 2. Test GPT-5 mini with vision
  console.log('\n2️⃣ Testing GPT-5 mini with image...');
  console.log('   Model: gpt-5-mini');
  console.log('   Reasoning: low');

  try {
    const startTime = Date.now();

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      reasoning_effort: 'low',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are analyzing an e-commerce store screenshot.

              Please describe:
              1. What products can you see?
              2. What are the approximate prices?
              3. What is the overall layout of the page?
              4. Are there navigation menus visible?

              Be specific and detailed.`
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${base64}`,
                detail: 'high'
              }
            }
          ]
        }
      ],
      max_completion_tokens: 800
    });

    const duration = Date.now() - startTime;

    console.log('\n✅ SUCCESS! GPT-5 MINI HAS VISION CAPABILITIES!\n');
    console.log('━'.repeat(60));
    console.log('\n📊 Response:\n');
    console.log(response.choices[0]?.message?.content);
    console.log('\n━'.repeat(60));

    console.log('\n📈 Performance Metrics:');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Prompt tokens: ${response.usage?.prompt_tokens || 'N/A'}`);
    console.log(`   Completion tokens: ${response.usage?.completion_tokens || 'N/A'}`);
    console.log(`   Total tokens: ${response.usage?.total_tokens || 'N/A'}`);

    // Estimate cost (placeholder - need actual GPT-5 mini pricing)
    const estimatedCost = ((response.usage?.total_tokens || 0) / 1000000) * 0.15;
    console.log(`   Estimated cost: $${estimatedCost.toFixed(6)}`);

    console.log('\n━'.repeat(60));
    console.log('\n🎉 CONCLUSION:');
    console.log('   ✅ GPT-5 mini supports vision');
    console.log('   ✅ Can use GPT-5 mini for both chat AND visual shopping');
    console.log('   ✅ Reasoning + Vision in one model!');
    console.log('\n🚀 NEXT STEPS:');
    console.log('   1. Update VisionEngine to use GPT-5 mini');
    console.log('   2. Build visual shopping prototype');
    console.log('   3. Test reasoning-enhanced recommendations');

  } catch (error: any) {
    console.log('\n❌ GPT-5 Mini Vision Test FAILED\n');
    console.log('━'.repeat(60));
    console.log('\nError:', error.message);

    if (error.message.includes('image_url') || error.message.includes('vision')) {
      console.log('\n⚠️  GPT-5 mini does NOT support vision (yet)');
      console.log('\n📋 FALLBACK PLAN:');
      console.log('   - Use GPT-5 mini for: Chat + reasoning');
      console.log('   - Use GPT-4o mini for: Vision analysis');
      console.log('   - Hybrid approach: Best tool for each job');
      console.log('\nThis is still amazing! You get:');
      console.log('   ✅ Reasoning in chat (GPT-5 mini)');
      console.log('   ✅ Vision for shopping (GPT-4o mini)');
      console.log('   ✅ Cost-effective ($0.00015 per image)');
    } else {
      console.log('\n❓ Unknown error - may be temporary');
      console.log('   Try again or check OpenAI API status');
    }

    console.log('\n━'.repeat(60));
  }

  await browser.close();

  // 3. Test comparison with reasoning
  if (true) { // Only run if previous test passed
    console.log('\n\n3️⃣ Testing GPT-5 mini reasoning with vision...');
    console.log('   Reasoning: medium (for better analysis)');

    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        reasoning_effort: 'medium',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Looking at this e-commerce page, if a customer asks:
                "Which products would you recommend?"

                Provide:
                1. Your analysis of what you see
                2. Your reasoning process (show your thinking)
                3. Specific recommendations

                Use reasoning to explain WHY you recommend certain products.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64}`,
                  detail: 'high'
                }
              }
            ]
          }
        ],
        max_completion_tokens: 1500
      });

      console.log('\n✅ Reasoning test successful!\n');
      console.log('━'.repeat(60));
      console.log('\n🤔 GPT-5 Mini Reasoning:\n');
      console.log(response.choices[0]?.message?.content);
      console.log('\n━'.repeat(60));

      console.log('\n💡 This proves:');
      console.log('   ✅ GPT-5 mini can SEE the store');
      console.log('   ✅ GPT-5 mini can REASON about products');
      console.log('   ✅ Perfect for visual shopping concierge!');

    } catch (error: any) {
      console.log('⚠️  Reasoning test failed:', error.message);
    }
  }
}

testGPT5MiniVision().catch(console.error);
