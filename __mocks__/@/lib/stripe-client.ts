const mockStripe = {
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
  checkout: {
    sessions: {
      create: jest.fn(),
    },
  },
};

// Mock the lazy-loading functions
export const getStripeClient = jest.fn(() => mockStripe);
export const isStripeConfigured = jest.fn(() => true);
export const stripe = mockStripe;

export default mockStripe;

