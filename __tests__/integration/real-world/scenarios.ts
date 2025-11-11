import { RealWorldScenario } from './types';

export const REAL_WORLD_SCENARIOS: RealWorldScenario[] = [
  {
    name: 'Product Discovery - Hydraulic Parts',
    description: 'Customer looking for specific hydraulic components',
    user_persona: 'Maintenance technician for Cifa concrete mixers',
    messages: [
      {
        user: 'Hi, I need a hydraulic pump for my Cifa mixer',
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'Do you have the A4VTG90 model?',
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: "What's the price?",
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'Do you have any alternatives?',
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
    ],
  },
  {
    name: 'Multi-Product Inquiry',
    description: 'Customer needs multiple types of parts',
    user_persona: 'Fleet manager ordering parts for multiple machines',
    messages: [
      {
        user: 'I need pumps and seals for Cifa mixers',
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: "Let's start with pumps. What do you have?",
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'OK, now show me the seals',
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'Can I get a discount if I order both?',
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
    ],
  },
  {
    name: 'Topic Switching - Product to Shipping',
    description: 'Customer switches from product inquiry to shipping questions',
    user_persona: 'International customer concerned about delivery',
    messages: [
      {
        user: 'Do you sell Cifa mixer parts?',
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'Actually, do you ship to Germany?',
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'How much is shipping?',
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
    ],
  },
  {
    name: 'Correction Handling',
    description: 'Customer corrects themselves mid-conversation',
    user_persona: 'Technician who initially gives wrong model number',
    messages: [
      {
        user: 'I need parts for my ZF5 pump',
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'Sorry, I meant ZF4 not ZF5',
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: "What's the difference between them?",
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
    ],
  },
  {
    name: 'Quick Order Lookup',
    description: 'Customer wants to check order status',
    user_persona: 'Customer tracking recent purchase',
    messages: [
      {
        user: 'Can you check my order status?',
        expectations: {
          natural_language: true,
          context_aware: false,
          no_hallucinations: true,
          helpful: true,
        },
      },
      {
        user: 'My email is test@example.com',
        expectations: {
          natural_language: true,
          context_aware: true,
          no_hallucinations: true,
          helpful: true,
        },
      },
    ],
  },
];
