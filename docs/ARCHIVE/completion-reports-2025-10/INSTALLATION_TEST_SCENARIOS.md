# Widget Installation Flow - Test Scenarios & Automation Plan

**Status**: Recommended Test Coverage (0% implemented)
**Priority**: HIGH - Critical user flow
**Effort**: 2-3 days (8 test files, ~50-70 test cases)

---

## TEST PYRAMID

```
                          ▲
                         /|\
                        / | \
                       /  |  \
                      /   |   \
                     /    |    \
                    / E2E |     \
                   /      |      \     2 tests
                  /       |       \
                 /________|________\
                /         |         \
               / Integration Tests  \
              /                     \     8 tests
             /_____________________|_\
            /                      |    \
           /  Unit Tests           |     \
          /                        |      \     20+ tests
         /__________________________|______\
        /  (Database, API, Utils) |        \


Total: ~30-50 test cases across all levels
```

---

## 1. UNIT TESTS

### 1.1 API Endpoint Tests
**File**: `__tests__/api/customer/config/current.test.ts`

```typescript
describe('GET /api/customer/config/current', () => {

  describe('Authentication', () => {
    test('returns 401 when user not authenticated', async () => {
      // Mock: no user
      // Expected: { success: false, error: 'Unauthorized' }
      // Status: 401
    });

    test('returns 401 when auth error occurs', async () => {
      // Mock: auth.getUser() returns error
      // Expected: { success: false, error: 'Unauthorized' }
      // Status: 401
    });
  });

  describe('Organization Verification', () => {
    test('returns 404 when user has no organization', async () => {
      // Mock: user exists, but no organization_members record
      // Expected: { success: false, error: 'No organization found...' }
      // Status: 404
    });

    test('returns 404 when organization_members query fails', async () => {
      // Mock: organization_members query returns error
      // Expected: { success: false, error: 'No organization found...' }
      // Status: 404
    });
  });

  describe('Customer Config Retrieval', () => {
    test('returns config when customer_config exists and active', async () => {
      // Mock: user, organization, active customer_config
      // Expected: { success: true, data: { domain: "...", ... } }
      // Status: 200
      // Verify: domain is "thompsonseparts.co.uk"
    });

    test('returns 404 when no customer_config found', async () => {
      // Mock: user, organization, but NO customer_config
      // Expected: { success: false, error: 'No customer configuration found' }
      // Status: 404
    });

    test('returns 404 when customer_config is not active', async () => {
      // Mock: customer_config exists but active=false
      // Expected: returns 404 (filtered by active=true)
      // Status: 404
    });

    test('returns 404 when config query fails', async () => {
      // Mock: customer_configs query returns error
      // Expected: { success: false, error: 'No customer configuration found' }
      // Status: 404
    });
  });

  describe('Sensitive Field Exclusion', () => {
    test('excludes woocommerce_consumer_key from response', async () => {
      // Mock: customer_config with consumer_key
      // Expected: response does NOT include woocommerce_consumer_key
    });

    test('excludes woocommerce_consumer_secret from response', async () => {
      // Mock: customer_config with consumer_secret
      // Expected: response does NOT include woocommerce_consumer_secret
    });

    test('excludes shopify_access_token from response', async () => {
      // Mock: customer_config with access_token
      // Expected: response does NOT include shopify_access_token
    });

    test('excludes encrypted_credentials from response', async () => {
      // Mock: customer_config with encrypted_credentials
      // Expected: response does NOT include encrypted_credentials
    });

    test('includes safe fields in response', async () => {
      // Mock: customer_config with all fields
      // Expected: response includes:
      //   - domain
      //   - business_name
      //   - organization_id
      //   - woocommerce_url
      //   - woocommerce_enabled
      //   - ... (other non-sensitive fields)
    });
  });

  describe('Response Format', () => {
    test('response has correct JSON structure', async () => {
      // Expected: { success: true, data: {...} }
      // Not: { success: true, config: {...} }
      // Not: { data: {...} } without success field
    });

    test('domain field is string', async () => {
      // Mock: customer_config with domain
      // Expected: typeof data.domain === 'string'
    });

    test('empty response handled gracefully', async () => {
      // If config has empty domain
      // Expected: domain: "" (empty string, not null)
    });
  });

});
```

---

### 1.2 Code Generation Utility Tests
**File**: `__tests__/lib/configure/wizard-utils.test.ts`

```typescript
describe('generateEmbedCode()', () => {

  const mockConfig: WidgetConfig = {
    serverUrl: 'http://localhost:3000',
    appearance: {
      theme: 'light',
      primaryColor: '#4F46E5',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
      position: 'bottom-right',
      width: 400,
      height: 600,
      headerTitle: 'Customer Support',
      headerSubtitle: "We're here to help!",
      welcomeMessage: 'Hi! How can I help you today?',
      customCSS: '',
    },
    features: {
      websiteScraping: {
        enabled: true,
        urls: ['thompsonseparts.co.uk'],
      },
      woocommerce: { enabled: false },
      customKnowledge: { enabled: true, faqs: [] },
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 3000,
      persistConversation: true,
    },
  };

  describe('HTML Framework', () => {
    test('generates valid HTML code', () => {
      const code = generateEmbedCode(mockConfig, 'html');
      expect(code).toContain('<script>');
      expect(code).toContain('window.ChatWidgetConfig');
      expect(code).toContain('embed.js');
      expect(code).toContain('</script>');
    });

    test('includes serverUrl in script src', () => {
      const code = generateEmbedCode(mockConfig, 'html');
      expect(code).toContain('localhost:3000/embed.js');
    });

    test('includes config object in script', () => {
      const code = generateEmbedCode(mockConfig, 'html');
      expect(code).toContain('http://localhost:3000');
      expect(code).toContain('bottom-right');
      expect(code).toContain('#4F46E5');
    });

    test('includes domain in websiteScraping URLs', () => {
      const code = generateEmbedCode(mockConfig, 'html');
      expect(code).toContain('thompsonseparts.co.uk');
    });

    test('script tag has async attribute', () => {
      const code = generateEmbedCode(mockConfig, 'html');
      expect(code).toContain('async');
    });
  });

  describe('React Framework', () => {
    test('generates valid React code', () => {
      const code = generateEmbedCode(mockConfig, 'react');
      expect(code).toContain('useEffect');
      expect(code).toContain('window.ChatWidgetConfig');
      expect(code).toContain('script.src');
      expect(code).toContain('document.body.appendChild');
    });

    test('includes serverUrl in React code', () => {
      const code = generateEmbedCode(mockConfig, 'react');
      expect(code).toContain('localhost:3000/embed.js');
    });

    test('includes cleanup function', () => {
      const code = generateEmbedCode(mockConfig, 'react');
      expect(code).toContain('removeChild');
      expect(code).toContain('return');
    });
  });

  describe('Next.js Framework', () => {
    test('generates valid Next.js code', () => {
      const code = generateEmbedCode(mockConfig, 'nextjs');
      expect(code).toContain('Next/script');
      expect(code).toContain('strategy="afterInteractive"');
      expect(code).toContain('dangerouslySetInnerHTML');
    });

    test('uses Script component', () => {
      const code = generateEmbedCode(mockConfig, 'nextjs');
      expect(code).toContain('<Script');
      expect(code).toContain('</Script>');
    });

    test('includes both config and embed script', () => {
      const code = generateEmbedCode(mockConfig, 'nextjs');
      // Should have two Script components
      const scriptCount = (code.match(/<Script/g) || []).length;
      expect(scriptCount).toBe(2);
    });
  });

  describe('Vue Framework', () => {
    test('generates valid Vue code', () => {
      const code = generateEmbedCode(mockConfig, 'vue');
      expect(code).toContain('mounted()');
      expect(code).toContain('window.ChatWidgetConfig');
      expect(code).toContain('script.src');
    });

    test('includes mounted lifecycle hook', () => {
      const code = generateEmbedCode(mockConfig, 'vue');
      expect(code).toContain('mounted()');
      expect(code).toContain('beforeUnmount');
    });
  });

  describe('Angular Framework', () => {
    test('generates valid Angular code', () => {
      const code = generateEmbedCode(mockConfig, 'angular');
      expect(code).toContain('@Component');
      expect(code).toContain('OnInit');
      expect(code).toContain('ngOnInit');
    });

    test('includes TypeScript decorator', () => {
      const code = generateEmbedCode(mockConfig, 'angular');
      expect(code).toContain('@Component');
      expect(code).toContain('selector:');
    });
  });

  describe('WordPress Framework', () => {
    test('generates valid WordPress code', () => {
      const code = generateEmbedCode(mockConfig, 'wordpress');
      expect(code).toContain('function add_chat_widget()');
      expect(code).toContain('add_action');
      expect(code).toContain('wp_footer');
    });

    test('uses PHP syntax', () => {
      const code = generateEmbedCode(mockConfig, 'wordpress');
      expect(code).toContain('<?php');
      expect(code).toContain('?>');
    });

    test('uses json_encode for config', () => {
      const code = generateEmbedCode(mockConfig, 'wordpress');
      expect(code).toContain('json_encode');
    });
  });

  describe('Shopify Framework', () => {
    test('generates valid Shopify code', () => {
      const code = generateEmbedCode(mockConfig, 'shopify');
      expect(code).toContain('<script>');
      expect(code).toContain('window.ChatWidgetConfig');
      expect(code).toContain('embed.js');
    });

    test('includes Liquid comment', () => {
      const code = generateEmbedCode(mockConfig, 'shopify');
      expect(code).toContain('theme.liquid');
    });
  });

  describe('Default/Unknown Framework', () => {
    test('defaults to HTML when unknown framework', () => {
      const code = generateEmbedCode(mockConfig, 'unknown');
      expect(code).toContain('<script>');
      expect(code).toContain('window.ChatWidgetConfig');
    });
  });

  describe('Custom CSS', () => {
    test('includes custom CSS when provided', () => {
      const customCSS = 'button { color: red; }';
      const code = generateEmbedCode(mockConfig, 'html', customCSS);
      expect(code).toContain('color: red');
    });

    test('excludes custom CSS when empty', () => {
      const code = generateEmbedCode(mockConfig, 'html', '');
      expect(code).not.toContain('color:');
    });
  });

});
```

---

### 1.3 Component Props Tests
**File**: `__tests__/components/configure/EmbedCodeGenerator.test.tsx`

```typescript
describe('EmbedCodeGenerator Component', () => {

  const mockConfig: WidgetConfig = {
    serverUrl: 'http://localhost:3000',
    appearance: { /* ... */ },
    features: { /* ... */ },
    behavior: { /* ... */ },
  };

  describe('Framework Selection', () => {
    test('renders all 7 framework options', () => {
      const { getByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      expect(getByText('HTML')).toBeInTheDocument();
      expect(getByText('React')).toBeInTheDocument();
      expect(getByText('Next.js')).toBeInTheDocument();
      expect(getByText('Vue')).toBeInTheDocument();
      expect(getByText('Angular')).toBeInTheDocument();
      expect(getByText('WordPress')).toBeInTheDocument();
      expect(getByText('Shopify')).toBeInTheDocument();
    });

    test('HTML is selected by default', () => {
      const { getByRole } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      const htmlRadio = getByRole('radio', { name: 'HTML' });
      expect(htmlRadio).toBeChecked();
    });

    test('selects different framework when clicked', async () => {
      const { getByRole, getByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      const wordPressRadio = getByRole('radio', { name: 'WordPress' });
      fireEvent.click(wordPressRadio);

      expect(wordPressRadio).toBeChecked();
      expect(getByText(/add_action/)).toBeInTheDocument();
    });

    test('code preview updates when framework changes', async () => {
      const { getByRole, getByText, queryByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      // Initially HTML
      expect(getByText('<!-- AI Chat Widget -->')).toBeInTheDocument();

      // Switch to React
      fireEvent.click(getByRole('radio', { name: 'React' }));
      expect(queryByText('<!-- AI Chat Widget -->')).not.toBeInTheDocument();
      expect(getByText(/useEffect/)).toBeInTheDocument();
    });
  });

  describe('Code Display', () => {
    test('displays code in <pre> tag', () => {
      const { getByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      expect(getByText(/window.ChatWidgetConfig/).closest('pre')).toBeInTheDocument();
    });

    test('displays code in <code> tag inside <pre>', () => {
      const { getByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      expect(getByText(/window.ChatWidgetConfig/).closest('code')).toBeInTheDocument();
    });

    test('code includes serverUrl from config', () => {
      const { getByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      expect(getByText(/localhost:3000/)).toBeInTheDocument();
    });

    test('code includes config object', () => {
      const { getByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      expect(getByText(/4F46E5/)).toBeInTheDocument(); // primaryColor
      expect(getByText(/bottom-right/)).toBeInTheDocument(); // position
    });
  });

  describe('Copy Button', () => {
    test('renders copy button', () => {
      const { getByRole } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      expect(getByRole('button', { name: /Copy/i })).toBeInTheDocument();
    });

    test('copies code to clipboard when clicked', async () => {
      const { getByRole } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      const copyButton = getByRole('button', { name: /Copy/i });
      fireEvent.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });

    test('shows "Copied!" feedback for 2 seconds', async () => {
      jest.useFakeTimers();

      const { getByRole, getByText } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      fireEvent.click(getByRole('button', { name: /Copy/i }));

      expect(getByText('Copied!')).toBeInTheDocument();

      jest.advanceTimersByTime(2000);

      expect(getByRole('button', { name: /Copy/i })).toBeInTheDocument();

      jest.useRealTimers();
    });

    test('changes to CheckCircle icon when copied', async () => {
      const { getByRole, getByTestId } = render(
        <EmbedCodeGenerator config={mockConfig} />
      );

      fireEvent.click(getByRole('button', { name: /Copy/i }));

      expect(getByTestId('check-circle-icon')).toBeInTheDocument();
    });
  });

  describe('Props Handling', () => {
    test('accepts config prop', () => {
      render(<EmbedCodeGenerator config={mockConfig} />);
      // Should render without error
    });

    test('accepts optional customCSS prop', () => {
      render(
        <EmbedCodeGenerator
          config={mockConfig}
          customCSS="button { color: blue; }"
        />
      );
      // Should render with custom CSS
    });

    test('accepts optional isOnboarding prop', () => {
      render(
        <EmbedCodeGenerator
          config={mockConfig}
          isOnboarding={true}
        />
      );
      // Should show onboarding alert
    });

    test('shows onboarding alert when isOnboarding=true', () => {
      const { getByText } = render(
        <EmbedCodeGenerator
          config={mockConfig}
          isOnboarding={true}
        />
      );

      expect(getByText('Almost done!')).toBeInTheDocument();
      expect(getByText(/Copy this code and add it/)).toBeInTheDocument();
    });

    test('hides onboarding alert when isOnboarding=false', () => {
      const { queryByText } = render(
        <EmbedCodeGenerator
          config={mockConfig}
          isOnboarding={false}
        />
      );

      expect(queryByText('Almost done!')).not.toBeInTheDocument();
    });
  });

});
```

---

## 2. INTEGRATION TESTS

### 2.1 Page Component Tests
**File**: `__tests__/app/dashboard/installation/page.test.tsx`

```typescript
describe('InstallationPage', () => {

  const mockConfig = {
    domain: 'thompsonseparts.co.uk',
    business_name: "Thompson's Parts",
    organization_id: 'org-123',
    // ... other fields
  };

  describe('Page Load & Data Fetching', () => {
    test('renders page with loading spinner initially', () => {
      const { getByText } = render(<InstallationPage />);
      expect(getByText(/Loading your configuration/)).toBeInTheDocument();
    });

    test('fetches customer config on mount', async () => {
      const fetchMock = jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockConfig })
        });

      render(<InstallationPage />);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith('/api/customer/config/current');
      });
    });

    test('sets serverUrl to window.location.origin', () => {
      render(<InstallationPage />);
      // serverUrl should be set and passed to QuickStart
      // Verify through component props or state
    });

    test('sets domain from API response', async () => {
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: mockConfig
          })
        });

      const { getByText } = render(<InstallationPage />);

      await waitFor(() => {
        expect(getByText('thompsonseparts.co.uk')).toBeInTheDocument();
      });
    });

    test('hides loading spinner after data fetched', async () => {
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockConfig })
        });

      const { queryByText } = render(<InstallationPage />);

      await waitFor(() => {
        expect(queryByText(/Loading your configuration/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    test('renders three tabs', () => {
      const { getByRole } = render(<InstallationPage />);

      expect(getByRole('tab', { name: /Quick Start/i })).toBeInTheDocument();
      expect(getByRole('tab', { name: /Platform Guides/i })).toBeInTheDocument();
      expect(getByRole('tab', { name: /Troubleshooting/i })).toBeInTheDocument();
    });

    test('Quick Start tab is active by default', () => {
      const { getByRole } = render(<InstallationPage />);

      const quickStartTab = getByRole('tab', { name: /Quick Start/i });
      expect(quickStartTab).toHaveAttribute('aria-selected', 'true');
    });

    test('switches to Platform Guides tab', async () => {
      const { getByRole } = render(<InstallationPage />);

      fireEvent.click(getByRole('tab', { name: /Platform Guides/i }));

      await waitFor(() => {
        expect(getByRole('tab', { name: /Platform Guides/i }))
          .toHaveAttribute('aria-selected', 'true');
      });
    });

    test('switches to Troubleshooting tab', async () => {
      const { getByRole } = render(<InstallationPage />);

      fireEvent.click(getByRole('tab', { name: /Troubleshooting/i }));

      await waitFor(() => {
        expect(getByRole('tab', { name: /Troubleshooting/i }))
          .toHaveAttribute('aria-selected', 'true');
      });
    });
  });

  describe('Page Header', () => {
    test('renders page title', () => {
      const { getByText } = render(<InstallationPage />);
      expect(getByText(/Install Your Chat Widget/)).toBeInTheDocument();
    });

    test('renders page description', () => {
      const { getByText } = render(<InstallationPage />);
      expect(getByText(/Get your embed code/)).toBeInTheDocument();
    });

    test('renders download icon in title', () => {
      const { getByTestId } = render(<InstallationPage />);
      // Check for icon
    });
  });

  describe('QuickStart Component Integration', () => {
    test('passes serverUrl to QuickStart', async () => {
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: async () => ({ success: true, data: mockConfig })
        });

      const { getByText } = render(<InstallationPage />);

      await waitFor(() => {
        // QuickStart should receive serverUrl
        // Verify through rendered content
      });
    });

    test('passes domain to QuickStart', async () => {
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: async () => ({
            success: true,
            data: mockConfig
          })
        });

      const { getByText } = render(<InstallationPage />);

      await waitFor(() => {
        expect(getByText('thompsonseparts.co.uk')).toBeInTheDocument();
      });
    });

    test('passes isLoading state to QuickStart', () => {
      const { getByText } = render(<InstallationPage />);
      // Initially shows loading
      expect(getByText(/Loading your configuration/)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('shows error toast when API fails', async () => {
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: async () => ({ success: false, error: 'Not found' })
        });

      const { getByText } = render(<InstallationPage />);

      await waitFor(() => {
        expect(getByText('No Domain Configured')).toBeInTheDocument();
      });
    });

    test('shows helpful error message', async () => {
      jest.spyOn(global, 'fetch')
        .mockResolvedValueOnce({
          json: async () => ({
            success: false,
            message: 'Please configure your domain in settings first'
          })
        });

      const { getByText } = render(<InstallationPage />);

      await waitFor(() => {
        expect(getByText(/configure your domain in settings/i))
          .toBeInTheDocument();
      });
    });

    test('catches and handles fetch errors', async () => {
      jest.spyOn(global, 'fetch')
        .mockRejectedValueOnce(new Error('Network error'));

      const { getByText } = render(<InstallationPage />);

      await waitFor(() => {
        expect(getByText('Error')).toBeInTheDocument();
      });
    });
  });

});
```

---

### 2.2 QuickStart Component Tests
**File**: `__tests__/app/dashboard/installation/components/QuickStart.test.tsx`

```typescript
describe('QuickStart Component', () => {

  const props = {
    serverUrl: 'http://localhost:3000',
    domain: 'thompsonseparts.co.uk',
    isLoading: false,
  };

  describe('Configuration Alert', () => {
    test('shows success alert when domain configured', () => {
      const { getByText } = render(<QuickStart {...props} />);

      expect(getByText('Configuration Detected')).toBeInTheDocument();
      expect(getByText('thompsonseparts.co.uk')).toBeInTheDocument();
    });

    test('shows error alert when domain not configured', () => {
      const { getByText } = render(
        <QuickStart {...props} domain="" />
      );

      expect(getByText('No Domain Configured')).toBeInTheDocument();
      expect(getByText(/configure your domain in settings/i))
        .toBeInTheDocument();
    });

    test('error alert includes link to settings', () => {
      const { getByRole } = render(
        <QuickStart {...props} domain="" />
      );

      const settingsLink = getByRole('link', { name: /Go to Settings/i });
      expect(settingsLink).toHaveAttribute('href', '/dashboard/settings');
    });
  });

  describe('Default Config Creation', () => {
    test('creates config with serverUrl', () => {
      const { getByText } = render(<QuickStart {...props} />);
      expect(getByText(/localhost:3000/)).toBeInTheDocument();
    });

    test('creates config with domain in websiteScraping URLs', () => {
      const { getByText } = render(<QuickStart {...props} />);
      expect(getByText(/thompsonseparts.co.uk/)).toBeInTheDocument();
    });

    test('sets websiteScraping.enabled to true', () => {
      const { getByText } = render(<QuickStart {...props} />);
      // Verify in code that WebScraping is enabled
    });

    test('sets woocommerce.enabled to false by default', () => {
      const { getByText } = render(<QuickStart {...props} />);
      // Verify in code that WooCommerce is disabled
    });

    test('sets customKnowledge.enabled to true', () => {
      const { getByText } = render(<QuickStart {...props} />);
      // Verify in code that custom knowledge is enabled
    });
  });

  describe('EmbedCodeGenerator Integration', () => {
    test('passes config to EmbedCodeGenerator', () => {
      const { getByText } = render(<QuickStart {...props} />);

      expect(getByText(/Customer Support/)).toBeInTheDocument(); // From appearance
      expect(getByText(/HTML/)).toBeInTheDocument(); // Framework selector
    });

    test('passes isOnboarding=false', () => {
      const { queryByText } = render(<QuickStart {...props} />);

      // Should not show onboarding alert
      expect(queryByText('Almost done!')).not.toBeInTheDocument();
    });
  });

  describe('Next Steps Section', () => {
    test('renders Next Steps card', () => {
      const { getByText } = render(<QuickStart {...props} />);
      expect(getByText('Next Steps')).toBeInTheDocument();
    });

    test('shows 4 numbered steps', () => {
      const { getByText } = render(<QuickStart {...props} />);

      expect(getByText(/Add the code to your website/)).toBeInTheDocument();
      expect(getByText(/Test on your staging site/)).toBeInTheDocument();
      expect(getByText(/Verify widget appearance/)).toBeInTheDocument();
      expect(getByText(/Deploy to production/)).toBeInTheDocument();
    });

    test('Test Widget Now button opens in new tab', () => {
      const { getByRole } = render(<QuickStart {...props} />);

      const testButton = getByRole('button', { name: /Test Widget Now/i });
      expect(testButton).toBeInTheDocument();

      fireEvent.click(testButton);
      expect(window.open).toHaveBeenCalledWith(
        '/embed?domain=thompsonseparts.co.uk',
        '_blank'
      );
    });

    test('Test Widget button URL includes domain', () => {
      const { getByRole } = render(<QuickStart {...props} />);

      fireEvent.click(getByRole('button', { name: /Test Widget Now/i }));

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('thompsonseparts.co.uk'),
        '_blank'
      );
    });
  });

  describe('Loading State', () => {
    test('shows loading spinner when isLoading=true', () => {
      const { getByText } = render(
        <QuickStart {...props} isLoading={true} />
      );

      expect(getByText(/Loading your configuration/)).toBeInTheDocument();
    });

    test('hides content when loading', () => {
      const { queryByText } = render(
        <QuickStart {...props} isLoading={true} />
      );

      expect(queryByText('Embed Code')).not.toBeInTheDocument();
    });

    test('shows content when not loading', () => {
      const { getByText } = render(
        <QuickStart {...props} isLoading={false} />
      );

      expect(getByText('Embed Code')).toBeInTheDocument();
    });
  });

});
```

---

## 3. END-TO-END (E2E) TESTS

### 3.1 Complete User Journey
**File**: `e2e/installation-flow.spec.ts` (Playwright)

```typescript
import { test, expect } from '@playwright/test';

test.describe('Widget Installation Flow - Thompson\'s Parts', () => {

  test.beforeEach(async ({ page }) => {
    // Setup: Create test user and organization
    // Create customer_config with domain
    // Login user
  });

  test('Complete flow: Login → Installation → Copy Code', async ({ page }) => {

    // Step 1: Navigate to dashboard
    await page.goto('/dashboard');
    expect(page.url()).toContain('/dashboard');

    // Step 2: Verify sidebar navigation
    const installationLink = page.getByRole('link', { name: 'Installation' });
    await expect(installationLink).toBeVisible();

    // Step 3: Click Installation
    await installationLink.click();
    expect(page.url()).toContain('/dashboard/installation');

    // Step 4: Wait for page load
    await page.waitForLoadState('networkidle');

    // Step 5: Verify configuration is detected
    const configAlert = page.getByText('Configuration Detected');
    await expect(configAlert).toBeVisible();

    const domainBadge = page.getByText('thompsonseparts.co.uk');
    await expect(domainBadge).toBeVisible();

    // Step 6: Verify Quick Start tab is active
    const quickStartTab = page.getByRole('tab', { name: /Quick Start/i });
    await expect(quickStartTab).toHaveAttribute('aria-selected', 'true');

    // Step 7: Verify code generator is visible
    const embedCodeCard = page.getByText('Embed Code');
    await expect(embedCodeCard).toBeVisible();

    // Step 8: Select WordPress framework
    const wordPressRadio = page.getByLabel('WordPress');
    await wordPressRadio.click();

    // Step 9: Verify code updated for WordPress
    const codeBlock = page.locator('pre code');
    const codeText = await codeBlock.textContent();
    expect(codeText).toContain('add_chat_widget');
    expect(codeText).toContain('wp_footer');
    expect(codeText).toContain('localhost:3000');

    // Step 10: Verify domain is in code
    expect(codeText).toContain('thompsonseparts.co.uk');

    // Step 11: Click Copy button
    const copyButton = page.getByRole('button', { name: /Copy/i });
    await copyButton.click();

    // Step 12: Verify copy feedback
    const copiedText = page.getByText('Copied!');
    await expect(copiedText).toBeVisible();

    // Step 13: Verify code is in clipboard
    const clipboardText = await page.evaluate(() =>
      navigator.clipboard.readText()
    );
    expect(clipboardText).toContain('add_chat_widget');
    expect(clipboardText).toContain('localhost:3000');
    expect(clipboardText).toContain('thompsonseparts.co.uk');

  });

  test('Platform Guides tab works', async ({ page }) => {
    await page.goto('/dashboard/installation');

    // Click Platform Guides tab
    const guidesTab = page.getByRole('tab', { name: /Platform Guides/i });
    await guidesTab.click();

    await expect(guidesTab).toHaveAttribute('aria-selected', 'true');

    // Verify guide sections
    expect(page.getByText('WordPress')).toBeVisible();
    expect(page.getByText('Shopify')).toBeVisible();
    expect(page.getByText('WooCommerce')).toBeVisible();
    expect(page.getByText('Next.js')).toBeVisible();
    expect(page.getByText('React')).toBeVisible();
    expect(page.getByText('Plain HTML')).toBeVisible();
  });

  test('Troubleshooting tab works', async ({ page }) => {
    await page.goto('/dashboard/installation');

    // Click Troubleshooting tab
    const troubleTab = page.getByRole('tab', { name: /Troubleshooting/i });
    await troubleTab.click();

    await expect(troubleTab).toHaveAttribute('aria-selected', 'true');

    // Verify troubleshooting sections
    expect(page.getByText('Widget is not appearing')).toBeVisible();
    expect(page.getByText('Chat not working or showing wrong data')).toBeVisible();
    expect(page.getByText('Widget not working properly on mobile')).toBeVisible();
  });

  test('Error handling: No domain configured', async ({ page }) => {
    // Setup: Delete customer_config before test

    await page.goto('/dashboard/installation');

    // Verify error alert
    const errorAlert = page.getByText('No Domain Configured');
    await expect(errorAlert).toBeVisible();

    // Verify helpful link
    const settingsLink = page.getByRole('link', { name: /Go to Settings/i });
    await expect(settingsLink).toBeVisible();

    // Click link
    await settingsLink.click();
    expect(page.url()).toContain('/dashboard/settings');
  });

  test('Framework selection updates code instantly', async ({ page }) => {
    await page.goto('/dashboard/installation');

    const codeBlock = page.locator('pre code');

    // Start with HTML
    let codeText = await codeBlock.textContent();
    expect(codeText).toContain('<!-- AI Chat Widget -->');

    // Switch to React
    await page.getByLabel('React').click();
    codeText = await codeBlock.textContent();
    expect(codeText).toContain('useEffect');
    expect(codeText).not.toContain('<!-- AI Chat Widget -->');

    // Switch to Vue
    await page.getByLabel('Vue').click();
    codeText = await codeBlock.textContent();
    expect(codeText).toContain('mounted()');

    // Switch to Shopify
    await page.getByLabel('Shopify').click();
    codeText = await codeBlock.textContent();
    expect(codeText).toContain('<script>');
    expect(codeText).toContain('theme.liquid');
  });

  test('Copy button feedback disappears', async ({ page }) => {
    await page.goto('/dashboard/installation');

    const copyButton = page.getByRole('button', { name: /Copy/i });
    await copyButton.click();

    // Copied text visible
    await expect(page.getByText('Copied!')).toBeVisible();

    // Wait 2 seconds
    await page.waitForTimeout(2000);

    // Button back to Copy
    await expect(copyButton).toHaveRole('button');
    const buttonText = await copyButton.textContent();
    expect(buttonText).toContain('Copy');
  });

  test('Test Widget Now button opens in new tab', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto('/dashboard/installation');

    // Listen for popup
    const popupPromise = context.waitForEvent('page');

    await page.getByRole('button', { name: /Test Widget Now/i }).click();

    const popup = await popupPromise;
    expect(popup.url()).toContain('/embed');
    expect(popup.url()).toContain('thompsonseparts.co.uk');

    await context.close();
  });

});
```

---

## Test Execution Plan

### Run Order
```bash
# 1. Run unit tests first (fast)
npm test -- __tests__/lib/configure/wizard-utils.test.ts
npm test -- __tests__/components/configure/EmbedCodeGenerator.test.tsx
npm test -- __tests__/api/customer/config/current.test.ts

# 2. Run integration tests (medium)
npm test -- __tests__/app/dashboard/installation/

# 3. Run E2E tests (slow, comprehensive)
npm run test:e2e -- e2e/installation-flow.spec.ts
```

### Coverage Targets
```
Unit Tests:        65-75% code coverage
Integration Tests: 85-90% user interaction coverage
E2E Tests:         95%+ complete flow coverage

Overall Target:    >85% code coverage
```

---

## Critical Test Cases Summary

| Test Area | Test Cases | Priority |
|-----------|-----------|----------|
| API Authentication | 2 | CRITICAL |
| Organization Verification | 2 | CRITICAL |
| Customer Config Fetching | 3 | CRITICAL |
| Sensitive Field Exclusion | 5 | HIGH |
| Code Generation (7 frameworks) | 7 | CRITICAL |
| Component Rendering | 8 | HIGH |
| User Interactions | 6 | HIGH |
| Error Handling | 4 | MEDIUM |
| **Total** | **~50 tests** | - |

---

## Recommended Test Tools

- **Unit**: Jest + React Testing Library
- **Integration**: Jest + React Testing Library
- **E2E**: Playwright (cross-browser support)
- **Mocking**: jest-mock-extended, MSW (for API)
- **Coverage**: Istanbul (built-in with Jest)

---

**Estimated Implementation Time**: 2-3 days
**Estimated Test Execution Time**: ~5 minutes (all tests)
**ROI**: Prevents regressions, catches edge cases, documents behavior
