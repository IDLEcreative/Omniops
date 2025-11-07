/**
 * Test cases for chat prompt decision tree validation
 */

export interface PromptTestCase {
  category: string;
  userQuery: string;
  shouldTriggerSearch: boolean;
  reasoning: string;
}

export const testCases: PromptTestCase[] = [
  // Category: Product Names/Brands/Models
  {
    category: 'Product Names',
    userQuery: 'Do you have Model A123?',
    shouldTriggerSearch: true,
    reasoning: 'Mentions specific model number'
  },
  {
    category: 'Product Names',
    userQuery: 'Show me Hyva products',
    shouldTriggerSearch: true,
    reasoning: 'Mentions brand name "Hyva"'
  },
  {
    category: 'Product Names',
    userQuery: 'I need SKU-12345',
    shouldTriggerSearch: true,
    reasoning: 'Mentions SKU/part number'
  },

  // Category: Categories
  {
    category: 'Categories',
    userQuery: 'pumps',
    shouldTriggerSearch: true,
    reasoning: 'Single-word product category'
  },
  {
    category: 'Categories',
    userQuery: 'equipment',
    shouldTriggerSearch: true,
    reasoning: 'Single-word product category'
  },
  {
    category: 'Categories',
    userQuery: 'parts',
    shouldTriggerSearch: true,
    reasoning: 'Single-word product category'
  },

  // Category: Comparisons
  {
    category: 'Comparisons',
    userQuery: 'Which is better, Model A or Model B?',
    shouldTriggerSearch: true,
    reasoning: 'Contains comparison phrase "which is better"'
  },
  {
    category: 'Comparisons',
    userQuery: 'What\'s the difference between A and B?',
    shouldTriggerSearch: true,
    reasoning: 'Contains comparison phrase "what\'s the difference"'
  },
  {
    category: 'Comparisons',
    userQuery: 'Compare these two products',
    shouldTriggerSearch: true,
    reasoning: 'Contains "compare"'
  },

  // Category: Availability
  {
    category: 'Availability',
    userQuery: 'Do you have hydraulic pumps?',
    shouldTriggerSearch: true,
    reasoning: 'Contains "do you have"'
  },
  {
    category: 'Availability',
    userQuery: 'Is this in stock?',
    shouldTriggerSearch: true,
    reasoning: 'Contains "is this in stock"'
  },
  {
    category: 'Availability',
    userQuery: 'Do you sell safety gloves?',
    shouldTriggerSearch: true,
    reasoning: 'Contains "do you sell"'
  },

  // Category: Pricing
  {
    category: 'Pricing',
    userQuery: 'How much does the Model X cost?',
    shouldTriggerSearch: true,
    reasoning: 'Contains "how much" and "cost"'
  },
  {
    category: 'Pricing',
    userQuery: 'What\'s the price of this?',
    shouldTriggerSearch: true,
    reasoning: 'Contains "price"'
  },

  // Category: Action Phrases
  {
    category: 'Action Phrases',
    userQuery: 'Show me all pumps',
    shouldTriggerSearch: true,
    reasoning: 'Contains "show me"'
  },
  {
    category: 'Action Phrases',
    userQuery: 'I need a hydraulic pump',
    shouldTriggerSearch: true,
    reasoning: 'Contains "I need"'
  },
  {
    category: 'Action Phrases',
    userQuery: 'Looking for equipment',
    shouldTriggerSearch: true,
    reasoning: 'Contains "looking for"'
  },
  {
    category: 'Action Phrases',
    userQuery: 'Find me a part',
    shouldTriggerSearch: true,
    reasoning: 'Contains "find"'
  },

  // Category: Vague/Uncertain Queries
  {
    category: 'Vague Queries',
    userQuery: 'tell me more about that',
    shouldTriggerSearch: true,
    reasoning: 'Follow-up question - should re-search for fresh data'
  },
  {
    category: 'Vague Queries',
    userQuery: 'what about item 2?',
    shouldTriggerSearch: true,
    reasoning: 'Reference to previous item - should fetch details'
  },
  {
    category: 'Vague Queries',
    userQuery: 'maybe a pump?',
    shouldTriggerSearch: true,
    reasoning: 'Uncertain query with product term - default to searching'
  },

  // Category: Negative Questions
  {
    category: 'Negative Questions',
    userQuery: 'Don\'t you have pumps?',
    shouldTriggerSearch: true,
    reasoning: 'Negative question about availability'
  },
  {
    category: 'Negative Questions',
    userQuery: 'You don\'t sell gloves?',
    shouldTriggerSearch: true,
    reasoning: 'Negative question about products'
  },

  // Category: Non-Product Queries (Should NOT always trigger search)
  {
    category: 'Non-Product',
    userQuery: 'What are your opening hours?',
    shouldTriggerSearch: false,
    reasoning: 'Navigational query - may search for policy page, not products'
  },
  {
    category: 'Non-Product',
    userQuery: 'How do I contact support?',
    shouldTriggerSearch: false,
    reasoning: 'Navigational query - about contact info, not products'
  },
  {
    category: 'Non-Product',
    userQuery: 'What is your return policy?',
    shouldTriggerSearch: false,
    reasoning: 'Informational query - about policies, not products'
  },
];
