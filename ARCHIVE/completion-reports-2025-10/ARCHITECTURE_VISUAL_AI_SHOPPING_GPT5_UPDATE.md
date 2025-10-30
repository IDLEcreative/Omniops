# Visual AI Shopping - GPT-5 Mini Integration

**Type:** Architecture Update
**Date:** 2025-10-29
**Model:** GPT-5 mini (already in use!)
**Status:** Ready to implement

---

## 🎯 KEY DISCOVERY: You're Already Using GPT-5 Mini!

Looking at your code, you're **already using GPT-5 mini** for chat (from [ai-processor-formatter.ts](lib/chat/ai-processor-formatter.ts:46)):

```typescript
return {
  model: 'gpt-5-mini',
  reasoning_effort: 'low',
  max_completion_tokens: 2500
};
```

**This is HUGE because GPT-5 mini likely has:**
- ✅ **Reasoning capabilities** (reasoning_effort parameter)
- ✅ **Vision capabilities** (successor to GPT-4o)
- ✅ **Better performance** than GPT-4o mini
- ✅ **Similar or better pricing**

---

## 🚀 GPT-5 Mini for Visual Shopping

### What Makes GPT-5 Mini Perfect:

1. **Reasoning + Vision Combined**
   ```typescript
   // GPT-5 mini can THINK about what it sees
   const response = await openai.chat.completions.create({
     model: 'gpt-5-mini',
     reasoning_effort: 'medium', // Think harder for visual analysis
     messages: [
       {
         role: 'user',
         content: [
           { type: 'text', text: 'What products do you see? Which is the best value?' },
           { type: 'image_url', image_url: { url: screenshotBase64 } }
         ]
       }
     ]
   });
   ```

2. **Reasoning About Shopping Decisions**
   - Not just "I see 3 products"
   - But "Product A is best because X, Y, Z (reasoning chain shown)"

3. **Already Integrated!**
   - You're using it for chat
   - Just need to add vision capabilities
   - Consistent model across entire app

---

## 💡 Updated Vision Engine

```typescript
// lib/visual-ai/vision-engine.ts
import OpenAI from 'openai';

export class VisionEngine {
  private openai: OpenAI;

  constructor() {
    this.openai = new Open AI({
      apiKey: process.env.OPENAI_API_KEY
    });
  }

  /**
   * Analyze screenshot using GPT-5 mini
   * ⭐ NEW: Uses reasoning capabilities for better analysis
   */
  async analyzeScreenshot(
    screenshotBase64: string,
    prompt: string,
    reasoningLevel: 'low' | 'medium' | 'high' = 'low'
  ): Promise<VisionAnalysis> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-5-mini', // ⭐ Using GPT-5 mini (same as chat agent!)
      reasoning_effort: reasoningLevel, // ⭐ Can think harder when needed
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/png;base64,${screenshotBase64}`,
                detail: 'high' // Use 'high' for better product detection
              }
            }
          ]
        }
      ],
      max_completion_tokens: 1000
    });

    // GPT-5 mini includes reasoning in the response
    return this.parseVisionResponse(response);
  }

  /**
   * Compare products with reasoning
   * ⭐ NEW: Uses 'medium' reasoning to explain WHY one is better
   */
  async compareProductsWithReasoning(
    screenshots: string[],
    criteria: string
  ): Promise<ComparisonWithReasoning> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-5-mini',
      reasoning_effort: 'medium', // ⭐ Think harder for comparisons
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Compare these products based on: ${criteria}

              For each product, provide:
              1. What you see (price, specs, features)
              2. Your reasoning process (why is one better?)
              3. Final recommendation

              Show your reasoning chain so the customer understands WHY.`
            },
            ...screenshots.map(screenshot => ({
              type: 'image_url' as const,
              image_url: {
                url: `data:image/png;base64,${screenshot}`,
                detail: 'high' as const
              }
            }))
          ]
        }
      ],
      max_completion_tokens: 2000
    });

    return {
      comparison: this.extractComparison(response),
      reasoning: this.extractReasoning(response), // ⭐ GPT-5 shows its thinking!
      recommendation: this.extractRecommendation(response)
    };
  }

  /**
   * Detect products with confidence scores
   * ⭐ NEW: Reasoning provides confidence levels
   */
  async detectProductsWithConfidence(
    screenshotBase64: string
  ): Promise<ProductDetection[]> {
    const prompt = `Analyze this e-commerce page.

    For each product you detect:
    1. Product name
    2. Price (if visible)
    3. Position on page (be specific: "top-left", "center", etc.)
    4. Your confidence level (low/medium/high)
    5. Reasoning for your confidence

    Return as JSON array.`;

    const response = await this.analyzeScreenshot(
      screenshotBase64,
      prompt,
      'low' // Fast detection, reasoning for confidence
    );

    return this.parseProductDetections(response);
  }

  private parseVisionResponse(response: any): VisionAnalysis {
    const content = response.choices[0]?.message?.content || '';

    return {
      description: content,
      reasoning: this.extractReasoning(response), // ⭐ Extract reasoning chain
      timestamp: Date.now(),
      model: 'gpt-5-mini',
      cost: this.calculateCost(response) // Estimate based on tokens
    };
  }

  private extractReasoning(response: any): string[] {
    // GPT-5 mini may include reasoning in a specific format
    // Parse and extract reasoning steps
    return [];
  }

  private calculateCost(response: any): number {
    // Estimate cost based on token usage
    // GPT-5 mini pricing: TBD (likely similar to GPT-4o mini)
    return 0.00015; // Placeholder
  }
}

interface VisionAnalysis {
  description: string;
  reasoning: string[]; // ⭐ NEW: Reasoning chain
  timestamp: number;
  model: string;
  cost: number;
}

interface ComparisonWithReasoning {
  comparison: VisualComparison;
  reasoning: string[]; // ⭐ Step-by-step reasoning
  recommendation: string;
}

interface ProductDetection {
  name: string;
  price?: string;
  position: BoundingBox;
  confidence: 'low' | 'medium' | 'high'; // ⭐ NEW
  reasoning: string; // ⭐ Why this confidence level?
}
```

---

## 🎨 Example: Reasoning in Action

### User: "Which pump should I buy?"

**GPT-5 Mini Response with Reasoning:**

```
I can see 3 hydraulic pumps on your screen. Let me analyze them:

🤔 Reasoning Process:
1. BP-001 (£275): 30L/min flow rate, 2-year warranty
   → Lower price but adequate specs for most uses

2. A4VTG90-R (£299): 35L/min flow rate, refurbished, 1-year warranty
   → Better performance but refurbished concerns

3. ZF5-PRO (£450): 40L/min flow rate, 5-year warranty, new
   → Premium option with best warranty

Based on your order history (you bought mid-range pumps before),
I recommend BP-001 because:
✓ Best value for your typical use case
✓ New (not refurbished)
✓ 30L/min meets your previous requirements
✓ Saves you £175 vs premium option

💡 Recommendation: BP-001 (highlighted in green)
```

**The AI SHOWS ITS THINKING!** Customers see WHY it recommends something.

---

## 💰 Cost Comparison

| Model | Vision | Reasoning | Cost/Image | Best For |
|-------|--------|-----------|------------|----------|
| GPT-4 Vision | ✅ | ❌ | $0.01 | High-quality vision |
| GPT-4o mini | ✅ | ❌ | $0.00015 | Fast, cheap vision |
| GPT-5 mini | ✅ | ✅ | ~$0.00015-0.0003 | Vision + reasoning |

**GPT-5 mini = Best of both worlds!**
- Vision capabilities of GPT-4o mini
- Reasoning capabilities of o1-mini
- Cost similar to GPT-4o mini
- **Already in your codebase!**

---

## 🧪 Testing GPT-5 Mini Vision

Before building, let's test if GPT-5 mini has vision:

```typescript
// test-gpt5-mini-vision.ts
import OpenAI from 'openai';
import { chromium } from 'playwright';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function testGPT5MiniVision() {
  console.log('🧪 Testing GPT-5 Mini Vision Capabilities\n');

  // 1. Capture screenshot
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  await page.goto('https://www.thompsonseparts.co.uk/shop');
  const screenshot = await page.screenshot();
  const base64 = screenshot.toString('base64');

  // 2. Test GPT-5 mini with vision
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      reasoning_effort: 'low',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Describe what you see on this e-commerce page. List any products visible.'
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
      ]
    });

    console.log('✅ GPT-5 MINI HAS VISION!\n');
    console.log('Response:', response.choices[0]?.message?.content);
    console.log('\n💰 Cost:', response.usage);

  } catch (error: any) {
    console.log('❌ GPT-5 Mini Vision Test Failed:');
    console.log(error.message);

    if (error.message.includes('image_url')) {
      console.log('\n⚠️  GPT-5 mini does NOT support vision.');
      console.log('   Fallback: Use GPT-4o mini for vision tasks');
    }
  }

  await browser.close();
}

testGPT5MiniVision();
```

**Run this NOW to confirm GPT-5 mini vision support!**

---

## 🚀 Implementation Strategy

### Option 1: GPT-5 Mini Has Vision (Best Case)
```typescript
// Use GPT-5 mini for EVERYTHING
const visualEngine = new VisionEngine('gpt-5-mini');
const chatAgent = new ChatAgent('gpt-5-mini'); // Already doing this!

// Consistent model across app
// Reasoning + Vision in one place
// Customers get explanations for visual decisions
```

### Option 2: GPT-5 Mini No Vision (Fallback)
```typescript
// Use GPT-5 mini for chat + reasoning
// Use GPT-4o mini for vision only
const visualEngine = new VisionEngine('gpt-4o-mini'); // Vision
const chatAgent = new ChatAgent('gpt-5-mini');        // Chat + reasoning

// Hybrid approach: Best tool for each job
```

### Option 3: Hybrid (Most Powerful)
```typescript
// Use GPT-5 mini for COMPLEX visual reasoning
// Use GPT-4o mini for FAST visual detection

async function analyzeProduct(screenshot: string) {
  // Fast detection with GPT-4o mini
  const products = await detectFast(screenshot, 'gpt-4o-mini');

  // Deep reasoning with GPT-5 mini
  const analysis = await reasonAbout(screenshot, products, 'gpt-5-mini');

  return analysis;
}
```

---

## 📊 Performance Estimates

### GPT-5 Mini (with reasoning):
- **Fast mode** (reasoning_effort: 'low'): ~1-2s
- **Smart mode** (reasoning_effort: 'medium'): ~3-5s
- **Deep mode** (reasoning_effort: 'high'): ~5-10s

**Strategy:**
- Product detection: Fast mode (low)
- Comparisons: Smart mode (medium)
- Complex decisions: Deep mode (high)

---

## 🎯 Next Steps

1. **Test GPT-5 Mini Vision** (5 minutes)
   ```bash
   npx tsx test-gpt5-mini-vision.ts
   ```

2. **If Vision Works:**
   - Update architecture to use GPT-5 mini everywhere
   - Build proof of concept (1 week)
   - Leverage reasoning for better recommendations

3. **If Vision Doesn't Work:**
   - Use GPT-4o mini for vision
   - Use GPT-5 mini for chat/reasoning
   - Hybrid approach (still amazing!)

---

## 💡 Why This Is Even Better

**Original Plan:** GPT-4o mini (vision only)
**Updated Plan:** GPT-5 mini (vision + reasoning!)

**Benefits:**
1. **Explainable AI** - Customers see WHY AI recommends something
2. **Better decisions** - Reasoning leads to smarter recommendations
3. **Consistent model** - Same model for chat and vision
4. **Already integrated** - You're using it today!

**Customer Experience:**
```
User: "Which of these 3 pumps should I buy?"

❌ GPT-4o mini:
"I see 3 pumps. The BP-001 is £275, A4VTG90-R is £299, ZF5-PRO is £450.
 Based on price, BP-001 is cheapest."

✅ GPT-5 mini:
"I see 3 pumps. Let me think about your needs:

 🤔 Based on your order history, you typically need 30-35L/min flow rate.

 BP-001 (£275): Meets your needs at lowest price ✓
 A4VTG90-R (£299): Better specs but refurbished (reliability concern)
 ZF5-PRO (£450): Overkill for your use case

 💡 I recommend BP-001 because it matches your requirements perfectly
     while saving you £175 compared to the premium option.

 Want me to add it to your cart?"
```

**The reasoning makes AI trustworthy!**

---

## 📝 Updated Architecture Summary

```
User's Browser
  │
  ├─ Store Page (WooCommerce)
  ├─ Chat Widget (React)
  └─ Visual Overlay (Canvas)
  │
  ↓ WebSocket
  │
Next.js Server
  │
  ├─ Visual AI Engine (GPT-5 mini) ← ⭐ UPDATED
  ├─ Chat Agent (GPT-5 mini)       ← Already using!
  ├─ Browser Automation (Playwright)
  └─ WooCommerce Store API
```

**One model to rule them all: GPT-5 mini** 🚀

---

Ready to test if GPT-5 mini has vision capabilities? Run the test script and we'll know in 30 seconds! 🧪
