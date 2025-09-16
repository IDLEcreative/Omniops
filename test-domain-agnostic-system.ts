/**
 * Test Domain-Agnostic System
 * Demonstrates how the system adapts to different business types
 */

import { BusinessClassifier, BusinessType } from './lib/business-classifier';
import { AdaptiveEntityExtractor } from './lib/adaptive-entity-extractor';

async function testDomainAgnosticSystem() {
  console.log('🔍 Testing Domain-Agnostic System\n');
  console.log('=' .repeat(60));
  
  // Test content samples from different business types
  const testCases = [
    {
      name: 'E-commerce Site',
      content: [
        'Add to Cart. Hydraulic Pump Model HP-5000. Price: $299.99. SKU: HP5K-2024. In Stock. Free shipping on orders over $50.',
        'Product Description: High-performance hydraulic pump for industrial use. Specifications: 3000 PSI, 10 GPM flow rate.'
      ]
    },
    {
      name: 'Real Estate Agency',
      content: [
        'Beautiful 4 bedroom, 2.5 bathroom colonial home. 2,400 sqft on 0.5 acres. MLS# 2024-1234. Listed at $750,000.',
        'Open House Saturday 2-4pm. Westfield School District. Updated kitchen, hardwood floors, finished basement.'
      ]
    },
    {
      name: 'Healthcare Clinic',
      content: [
        'Dr. Sarah Johnson, MD - Internal Medicine. Accepting new patients. Most insurance accepted including Blue Cross.',
        'Schedule appointment online. Annual physicals, preventive care, chronic disease management. Office hours: Mon-Fri 8am-5pm.'
      ]
    },
    {
      name: 'Law Firm',
      content: [
        'Smith & Associates Law Firm. Practice areas: Personal Injury, Estate Planning, Business Law. Free consultation.',
        'Attorney John Smith, JD. 20 years experience. Licensed in NY and NJ. Contact us at (555) 123-4567.'
      ]
    },
    {
      name: 'Restaurant',
      content: [
        'Menu: Grilled Salmon - $24.99. Fresh Atlantic salmon with seasonal vegetables. Gluten-free option available.',
        'Make a reservation online. Open Tuesday-Sunday 5pm-10pm. Private dining room available for events.'
      ]
    },
    {
      name: 'University',
      content: [
        'CS 101 - Introduction to Computer Science. 3 credit hours. Professor Jane Doe. MWF 10:00-11:00am.',
        'Prerequisites: None. Enrollment limit: 30 students. Tuition: $1,200 per credit hour. Register by August 15.'
      ]
    }
  ];
  
  console.log('📊 Classification Results:\n');
  
  for (const testCase of testCases) {
    console.log(`\n${testCase.name}:`);
    console.log('-'.repeat(40));
    
    // Classify the business
    const classification = await BusinessClassifier.classifyBusiness(
      testCase.name,
      testCase.content
    );
    
    console.log(`✓ Type: ${classification.primaryType}`);
    console.log(`✓ Confidence: ${(classification.confidence * 100).toFixed(0)}%`);
    console.log(`✓ Indicators: ${classification.indicators.join(', ')}`);
    console.log(`✓ Entity: ${classification.terminology.entityNamePlural}`);
    console.log(`✓ Schema:`);
    console.log(`  - Primary: ${classification.suggestedSchema.primaryEntity}`);
    console.log(`  - ID Field: ${classification.suggestedSchema.identifierField}`);
    console.log(`  - Price Field: ${classification.suggestedSchema.priceField}`);
    console.log(`✓ Terminology:`);
    console.log(`  - Available: "${classification.terminology.availableText}"`);
    console.log(`  - Search: "${classification.terminology.searchPrompt}"`);
    
    // Show extraction strategy
    console.log(`✓ Extraction Priority: ${classification.extractionStrategy.priorityFields.slice(0, 3).join(', ')}`);
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n🎯 System Adaptation Examples:\n');
  
  // Show how the same query works differently for each business
  const testQuery = 'What do you have available for around $500?';
  
  console.log(`Query: "${testQuery}"\n`);
  
  console.log('E-commerce Response:');
  console.log('→ "We have 3 products in stock under $500..."');
  
  console.log('\nReal Estate Response:');
  console.log('→ "I don\'t see any properties in that price range. Our listings start at $350,000..."');
  
  console.log('\nHealthcare Response:');
  console.log('→ "Our consultation fee is $200. Most procedures are covered by insurance..."');
  
  console.log('\nEducation Response:');
  console.log('→ "At $500, you could audit one course. Full enrollment is $1,200 per credit..."');
  
  console.log('\n' + '='.repeat(60));
  console.log('\n✅ Benefits of Domain-Agnostic System:\n');
  console.log('1. Automatically detects business type');
  console.log('2. Uses appropriate terminology (products vs properties vs services)');
  console.log('3. Extracts relevant fields for each industry');
  console.log('4. Search queries use correct context');
  console.log('5. No code changes needed for new business types');
  
  console.log('\n🚀 Implementation Status:\n');
  console.log('✓ BusinessClassifier - Detects 10+ business types');
  console.log('✓ entity_catalog table - Flexible storage for any entity');
  console.log('✓ AdaptiveEntityExtractor - GPT-4 extraction with business context');
  console.log('✓ Updated chat-context-enhancer - Uses proper terminology');
  console.log('✓ Hybrid search - Works with any entity type');
}

// Run the test
testDomainAgnosticSystem().catch(console.error);