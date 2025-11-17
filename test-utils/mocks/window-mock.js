/**
 * Window Mock Configuration
 *
 * Provides mock for window.matchMedia used by shopping components.
 * Only applies in jsdom environment (not Node environment).
 */

const setupWindowMocks = () => {
  // Only mock if window exists (jsdom environment, not Node environment)
  if (typeof window !== 'undefined') {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  }
};

module.exports = {
  setupWindowMocks,
};
