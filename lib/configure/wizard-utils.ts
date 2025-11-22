/**
 * Configuration wizard utility functions
 * Handles theme management, contrast calculation, and code generation
 */

import { Moon, Sun, Sparkles, LucideIcon } from 'lucide-react';
import { sanitizeConfigString } from '@/lib/sanitize-json';

export interface ThemePreset {
  name: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  icon: LucideIcon;
}

export interface WidgetConfig {
  serverUrl: string;
  appearance: {
    theme: keyof typeof THEME_PRESETS;
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    position: string;
    width: number;
    height: number;
    headerTitle: string;
    headerSubtitle: string;
    welcomeMessage: string;
    customCSS: string;
  };
  features: {
    websiteScraping: {
      enabled: boolean;
      urls: string[];
    };
    woocommerce: {
      enabled: boolean;
    };
    customKnowledge: {
      enabled: boolean;
      faqs: any[];
    };
  };
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;
    persistConversation: boolean;
  };
}

export const THEME_PRESETS = {
  light: {
    name: 'Light',
    primaryColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    icon: Sun,
  },
  dark: {
    name: 'Dark',
    primaryColor: '#818CF8',
    backgroundColor: '#1F2937',
    textColor: '#F9FAFB',
    icon: Moon,
  },
  brand: {
    name: 'Your Brand',
    primaryColor: '#10B981',
    backgroundColor: '#FFFFFF',
    textColor: '#111827',
    icon: Sparkles,
  },
} as const;

/**
 * Calculate WCAG contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const getLuminance = (hex: string) => {
    const rgb = parseInt(hex.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;

    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * (rs || 0) + 0.7152 * (gs || 0) + 0.0722 * (bs || 0);
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);

  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/**
 * Generate embed code for different frameworks
 * Uses minimal config approach - only serverUrl is required
 * All other configuration is loaded dynamically from the server
 */
export function generateEmbedCode(
  config: WidgetConfig,
  framework: string,
  customCSS?: string
): string {
  // Minimal config - only serverUrl required
  // Everything else loads dynamically from /api/widget/config
  const minimalConfig = {
    serverUrl: config.serverUrl
  };

  const configString = JSON.stringify(minimalConfig, null, 2);

  switch (framework) {
    case 'react':
      return `// Install: npm install @types/react react-helmet-async

import { Helmet } from 'react-helmet-async';

export function ChatWidget() {
  useEffect(() => {
    window.ChatWidgetConfig = ${configString};

    const script = document.createElement('script');
    script.src = '${config.serverUrl}/embed.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return null;
}`;

    case 'nextjs':
      return `// Add to app/layout.tsx or pages/_app.tsx

import Script from 'next/script';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Script
          id="chat-widget-config"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: \`window.ChatWidgetConfig = ${sanitizeConfigString(minimalConfig)};\`,
          }}
        />
        <Script
          src="${config.serverUrl}/embed.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}`;

    case 'vue':
      return `<!-- Add to your main App.vue or layout component -->

<template>
  <div id="app">
    <!-- Your app content -->
  </div>
</template>

<script>
export default {
  mounted() {
    window.ChatWidgetConfig = ${configString};

    const script = document.createElement('script');
    script.src = '${config.serverUrl}/embed.js';
    script.async = true;
    document.body.appendChild(script);
  },
  beforeUnmount() {
    // Optional: Clean up if needed
  }
}
</script>`;

    case 'angular':
      return `// Add to app.component.ts

import { Component, OnInit } from '@angular/core';

declare global {
  interface Window {
    ChatWidgetConfig: any;
  }
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {
  ngOnInit() {
    window.ChatWidgetConfig = ${configString};

    const script = document.createElement('script');
    script.src = '${config.serverUrl}/embed.js';
    script.async = true;
    document.body.appendChild(script);
  }
}`;

    case 'wordpress':
      return `// Add to your theme's functions.php

function add_chat_widget() {
    ?>
    <script>
    window.ChatWidgetConfig = <?php echo json_encode([
        'serverUrl' => '${config.serverUrl}',
        'appearance' => [
            'primaryColor' => '${config.appearance.primaryColor}',
            'position' => '${config.appearance.position}',
            'headerTitle' => '${config.appearance.headerTitle}',
            'welcomeMessage' => '${config.appearance.welcomeMessage}'
        ]
    ]); ?>;
    </script>
    <script src="${config.serverUrl}/embed.js" async></script>
    <?php
}
add_action('wp_footer', 'add_chat_widget');`;

    case 'shopify':
      return `<!-- Add to theme.liquid before </body> tag -->
<!-- Go to Online Store > Themes > Edit Code > theme.liquid -->

<script>
window.ChatWidgetConfig = ${configString};
</script>
<script src="${config.serverUrl}/embed.js" async></script>`;

    default: // html
      return `<!-- AI Chat Widget -->
<!-- Configuration is loaded dynamically from your dashboard -->
<!-- Change appearance, behavior, and features without updating this code -->
<script>
window.ChatWidgetConfig = ${configString};
</script>
<script src="${config.serverUrl}/embed.js" async></script>
<!-- End AI Chat Widget -->`;
  }
}

/**
 * Get initial widget configuration
 */
export function getInitialConfig(): WidgetConfig {
  return {
    serverUrl: typeof window !== 'undefined' ? window.location.origin : '',
    appearance: {
      theme: 'dark',
      primaryColor: '#818CF8',
      backgroundColor: '#1F2937',
      textColor: '#F9FAFB',
      position: 'bottom-right',
      width: 400,
      height: 600,
      headerTitle: 'Customer Support',
      headerSubtitle: "We're here to help!",
      welcomeMessage: '👋 Hi! How can I help you today?',
      customCSS: '',
    },
    features: {
      websiteScraping: {
        enabled: true,
        urls: [''],
      },
      woocommerce: {
        enabled: false,
      },
      customKnowledge: {
        enabled: false,
        faqs: [],
      },
    },
    behavior: {
      autoOpen: false,
      autoOpenDelay: 5000,
      persistConversation: true,
    },
  };
}
