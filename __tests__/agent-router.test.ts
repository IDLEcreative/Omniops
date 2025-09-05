import { selectProviderAgent } from '@/lib/agents/router';

describe('selectProviderAgent', () => {
  const cleanEnv = { ...process.env };

  afterEach(() => {
    // restore env after each test
    process.env = { ...cleanEnv } as NodeJS.ProcessEnv;
  });

  test('uses WooCommerce when config explicitly enables it (ignores env)', () => {
    delete process.env.WOOCOMMERCE_URL;
    delete process.env.WOOCOMMERCE_CONSUMER_KEY;
    delete process.env.WOOCOMMERCE_CONSUMER_SECRET;

    const provider = selectProviderAgent({ features: { woocommerce: { enabled: true } } }, process.env);
    expect(provider).toBe('woocommerce');
  });

  test('uses generic when config explicitly disables WooCommerce (even if env set)', () => {
    process.env.WOOCOMMERCE_URL = 'https://example.com';
    process.env.WOOCOMMERCE_CONSUMER_KEY = 'key';
    process.env.WOOCOMMERCE_CONSUMER_SECRET = 'secret';

    const provider = selectProviderAgent({ features: { woocommerce: { enabled: false } } }, process.env);
    expect(provider).toBe('generic');
  });

  test('falls back to env when config not specified', () => {
    process.env.WOOCOMMERCE_URL = 'https://example.com';
    process.env.WOOCOMMERCE_CONSUMER_KEY = 'key';
    process.env.WOOCOMMERCE_CONSUMER_SECRET = 'secret';

    const provider = selectProviderAgent(undefined, process.env);
    expect(provider).toBe('woocommerce');
  });

  test('generic when neither config nor env enable WooCommerce', () => {
    delete process.env.WOOCOMMERCE_URL;
    delete process.env.WOOCOMMERCE_CONSUMER_KEY;
    delete process.env.WOOCOMMERCE_CONSUMER_SECRET;

    const provider = selectProviderAgent(undefined, process.env);
    expect(provider).toBe('generic');
  });
});

