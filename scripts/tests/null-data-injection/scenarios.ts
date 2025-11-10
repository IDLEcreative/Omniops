import type { NullInjectionTest } from './types';

const containsTypeError = (response: any) => {
  const errorText = response?.error ?? response?.message ?? '';
  return typeof errorText === 'string' && (
    errorText.includes('Cannot read') ||
    errorText.includes('TypeError') ||
    errorText.includes('is not a function')
  );
};

export const nullInjectionScenarios: NullInjectionTest[] = [
  {
    name: 'Null WooCommerce Products',
    description: 'WooCommerce API returns null products array',
    injectionPoint: 'lib/woocommerce-api/index.ts',
    nullValue: null,
    query: 'Do you have any pumps?',
    validateResponse: (response) => {
      const hasTypeError = containsTypeError(response);
      const hasValidResponse = Boolean(response.message && response.message.length > 0);
      const couldFallback = response.message?.includes('search') ||
        response.message?.includes('not found') ||
        response.message?.includes('no products');

      return {
        passed: !hasTypeError && hasValidResponse,
        hasTypeError,
        gracefulHandling: !hasTypeError,
        reason: hasTypeError
          ? 'TypeError thrown (bad)'
          : hasValidResponse
          ? 'Gracefully handled null products'
          : couldFallback
          ? 'Fallback messaging used'
          : 'Response missing'
      };
    }
  },
  {
    name: 'Undefined Search Results',
    description: 'Search function returns undefined instead of array',
    injectionPoint: 'lib/embeddings.ts',
    nullValue: undefined,
    query: 'Find products similar to hydraulic pumps',
    validateResponse: (response) => {
      const hasTypeError =
        containsTypeError(response) ||
        response.error?.includes('map is not a function');
      const hasValidResponse = Boolean(response.message && response.message.length > 0);

      return {
        passed: !hasTypeError && hasValidResponse,
        hasTypeError,
        gracefulHandling: !hasTypeError,
        reason: hasTypeError
          ? 'TypeError thrown on undefined array'
          : 'Gracefully handled undefined results'
      };
    }
  },
  {
    name: 'Null Metadata Search Log',
    description: 'Metadata search log field is null',
    injectionPoint: 'lib/chat/conversation-metadata.ts',
    nullValue: null,
    query: 'What is the shipping cost?',
    validateResponse: (response) => {
      const hasTypeError = containsTypeError(response);
      const hasValidResponse = Boolean(response.message && response.message.length > 0);

      return {
        passed: !hasTypeError && hasValidResponse,
        hasTypeError,
        gracefulHandling: !hasTypeError,
        reason: hasTypeError
          ? 'TypeError on metadata field'
          : 'Metadata handled gracefully'
      };
    }
  },
  {
    name: 'Missing AI Settings',
    description: 'Widget config has no ai_settings property',
    injectionPoint: 'lib/chat/system-prompts.ts',
    nullValue: undefined,
    query: 'Tell me about your products',
    validateResponse: (response) => {
      const hasTypeError =
        containsTypeError(response) ||
        response.error?.includes('ai_settings');
      const hasValidResponse = Boolean(response.message && response.message.length > 0);

      return {
        passed: !hasTypeError && hasValidResponse,
        hasTypeError,
        gracefulHandling: !hasTypeError,
        reason: hasTypeError
          ? 'TypeError on ai_settings'
          : 'Used default AI settings gracefully'
      };
    }
  },
  {
    name: 'Null Conversation History',
    description: 'Conversation history is null instead of array',
    injectionPoint: 'lib/chat/conversation-manager.ts',
    nullValue: null,
    query: 'This is my first question',
    validateResponse: (response) => {
      const hasTypeError =
        containsTypeError(response) ||
        response.error?.includes('map is not a function');
      const hasValidResponse = Boolean(response.message && response.message.length > 0);

      return {
        passed: !hasTypeError && hasValidResponse,
        hasTypeError,
        gracefulHandling: !hasTypeError && hasValidResponse,
        reason: hasTypeError
          ? 'TypeError on history array'
          : 'Handled null history as first message'
      };
    }
  }
];
