import { createConfig, DEFAULT_CONFIG, applyRemoteConfig } from '@/lib/embed/config';
import { RemoteWidgetConfig } from '@/lib/embed/types';

describe('createConfig', () => {
  it('merges user overrides without mutating defaults', () => {
    const config = createConfig({
      serverUrl: 'https://www.example.com',
      appearance: { width: 450 },
      behavior: { welcomeMessage: 'Hello!' },
    });

    expect(config.serverUrl).toBe('https://www.example.com');
    expect(config.appearance.width).toBe(450);
    expect(config.behavior.welcomeMessage).toBe('Hello!');
    expect(DEFAULT_CONFIG.appearance.width).toBe(400);
    expect(DEFAULT_CONFIG.behavior.welcomeMessage).toBe('Hi! How can I help you today?');
  });
});

describe('applyRemoteConfig', () => {
  const base = createConfig({ serverUrl: 'https://www.example.com' });

  it('applies remote branding when user has not overridden', () => {
    const remote: RemoteWidgetConfig = {
      domain: 'example.com',
      woocommerce_enabled: true,
      shopify_enabled: false,
      branding: {
        primary_color: '#ff0000',
        welcome_message: 'Welcome to Example!',
        suggested_questions: [],
      },
      appearance: null,
      behavior: null,
      features: null,
    };

    const merged = applyRemoteConfig(base, remote);
    expect(merged.appearance.primaryColor).toBe('#ff0000');
    expect(merged.behavior.welcomeMessage).toBe('Welcome to Example!');
    expect(merged.woocommerceEnabled).toBe(true);
  });

  it('keeps user overrides when remote branding is present', () => {
    const remote: RemoteWidgetConfig = {
      domain: 'example.com',
      woocommerce_enabled: false,
      shopify_enabled: false,
      branding: {
        primary_color: '#ff0000',
        welcome_message: 'Welcome to Example!',
        suggested_questions: [],
      },
      appearance: null,
      behavior: null,
      features: null,
    };

    const userOverrides = {
      appearance: { primaryColor: '#000000' },
      behavior: { welcomeMessage: 'Custom greeting' },
    };

    const merged = applyRemoteConfig(base, remote, userOverrides);
    expect(merged.appearance.primaryColor).toBe('#000000');
    expect(merged.behavior.welcomeMessage).toBe('Custom greeting');
  });
});

