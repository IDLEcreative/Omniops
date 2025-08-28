'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Copy, 
  Code, 
  Palette, 
  CheckCircle, 
  AlertCircle, 
  Sparkles,
  Moon,
  Sun,
  Laptop,
  Eye
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// Theme presets
const THEME_PRESETS = {
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
};

// WCAG contrast checker
function getContrastRatio(color1: string, color2: string): number {
  // Simple contrast calculation (in production, use a proper library)
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

function ConfigurePageContent() {
  const searchParams = useSearchParams();
  const isOnboarding = searchParams.get('onboarding') === 'true';
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEME_PRESETS>('light');
  const [showAdvancedCSS, setShowAdvancedCSS] = useState(false);
  const [customCSS, setCustomCSS] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [copied, setCopied] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('html');
  
  const [config, setConfig] = useState({
    serverUrl: typeof window !== 'undefined' ? window.location.origin : '',
    appearance: {
      theme: 'light' as keyof typeof THEME_PRESETS,
      primaryColor: '#4F46E5',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
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
  });

  // Apply theme preset
  const applyTheme = (theme: keyof typeof THEME_PRESETS) => {
    const preset = THEME_PRESETS[theme];
    setSelectedTheme(theme);
    setConfig({
      ...config,
      appearance: {
        ...config.appearance,
        theme,
        primaryColor: preset.primaryColor,
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor,
      },
    });
  };

  // Check contrast ratio
  const contrastRatio = getContrastRatio(config.appearance.primaryColor, config.appearance.backgroundColor);
  const meetsWCAG_AA = contrastRatio >= 4.5;
  const meetsWCAG_AAA = contrastRatio >= 7;

  const generateEmbedCode = (framework: string = 'html') => {
    const configString = JSON.stringify({
      ...config,
      appearance: {
        ...config.appearance,
        customCSS: showAdvancedCSS ? customCSS : '',
      }
    }, null, 2);

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
            __html: \`
              window.ChatWidgetConfig = ${configString};
            \`,
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
<script>
window.ChatWidgetConfig = ${configString};
</script>
<script src="${config.serverUrl}/embed.js" async></script>
<!-- End AI Chat Widget -->`;
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generateEmbedCode(selectedFramework));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Show onboarding welcome if coming from setup
  useEffect(() => {
    if (isOnboarding) {
      // Could show a welcome modal or tour here
    }
  }, [isOnboarding]);

  return (
    <div className="container mx-auto max-w-7xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {isOnboarding ? 'Customize Your AI Assistant' : 'Configure Your Chat Widget'}
        </h1>
        <p className="text-muted-foreground">
          {isOnboarding 
            ? "Great! Your AI is ready. Now let's make it match your brand."
            : 'Customize the chat widget to match your website and business needs.'}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Tabs defaultValue="appearance" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="appearance">Appearance</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Theme Presets</CardTitle>
                  <CardDescription>
                    Choose a theme or customize your own
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    {Object.entries(THEME_PRESETS).map(([key, preset]) => {
                      const Icon = preset.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => applyTheme(key as keyof typeof THEME_PRESETS)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedTheme === key 
                              ? 'border-primary bg-primary/5' 
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <Icon className="h-6 w-6 mx-auto mb-2" />
                          <p className="text-sm font-medium">{preset.name}</p>
                        </button>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Colors & Position</CardTitle>
                  <CardDescription>
                    Fine-tune your widget appearance
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Select
                      value={config.appearance.position}
                      onValueChange={(value) =>
                        setConfig({
                          ...config,
                          appearance: { ...config.appearance, position: value },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bottom-right">Bottom Right</SelectItem>
                        <SelectItem value="bottom-left">Bottom Left</SelectItem>
                        <SelectItem value="top-right">Top Right</SelectItem>
                        <SelectItem value="top-left">Top Left</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="primaryColor">Brand Color</Label>
                    <div className="flex gap-2 items-start">
                      <div className="flex gap-2 flex-1">
                        <Input
                          id="primaryColor"
                          type="color"
                          value={config.appearance.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              appearance: { ...config.appearance, primaryColor: e.target.value },
                            })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          value={config.appearance.primaryColor}
                          onChange={(e) =>
                            setConfig({
                              ...config,
                              appearance: { ...config.appearance, primaryColor: e.target.value },
                            })
                          }
                          className="h-10"
                        />
                      </div>
                      <Palette className="h-5 w-5 text-muted-foreground mt-2.5" />
                    </div>
                    
                    {/* WCAG Contrast Warning */}
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        {meetsWCAG_AA ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-yellow-600" />
                        )}
                        <span className={meetsWCAG_AA ? 'text-green-600' : 'text-yellow-600'}>
                          Contrast: {contrastRatio.toFixed(1)}:1
                        </span>
                        {meetsWCAG_AAA && <Badge variant="secondary" className="text-xs">AAA</Badge>}
                        {meetsWCAG_AA && !meetsWCAG_AAA && <Badge variant="secondary" className="text-xs">AA</Badge>}
                      </div>
                      {!meetsWCAG_AA && (
                        <p className="text-xs text-muted-foreground">
                          Consider a darker/lighter color for better accessibility (WCAG AA requires 4.5:1)
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="headerTitle">Header Title</Label>
                    <Input
                      id="headerTitle"
                      value={config.appearance.headerTitle}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          appearance: { ...config.appearance, headerTitle: e.target.value },
                        })
                      }
                    />
                  </div>

                  <div>
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={config.appearance.welcomeMessage}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          appearance: { ...config.appearance, welcomeMessage: e.target.value },
                        })
                      }
                      rows={3}
                    />
                  </div>

                  {/* Advanced CSS Accordion */}
                  <Collapsible open={showAdvancedCSS} onOpenChange={setShowAdvancedCSS}>
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="sm" className="w-full">
                        <Code className="mr-2 h-4 w-4" />
                        Advanced CSS
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-4">
                      <Textarea
                        placeholder=".chat-widget {
  /* Your custom styles */
}"
                        value={customCSS}
                        onChange={(e) => setCustomCSS(e.target.value)}
                        className="font-mono text-sm"
                        rows={6}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        For developers: Override default styles with custom CSS
                      </p>
                    </CollapsibleContent>
                  </Collapsible>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="features" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Sources</CardTitle>
                  <CardDescription>
                    Configure what information the chat bot can access
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Website Scraping</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically learn from your website content
                      </p>
                    </div>
                    <Switch
                      checked={config.features.websiteScraping.enabled}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          features: {
                            ...config.features,
                            websiteScraping: {
                              ...config.features.websiteScraping,
                              enabled: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>WooCommerce Integration</Label>
                      <p className="text-sm text-muted-foreground">
                        Enable product search and order lookup
                      </p>
                    </div>
                    <Switch
                      checked={config.features.woocommerce.enabled}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          features: {
                            ...config.features,
                            woocommerce: {
                              ...config.features.woocommerce,
                              enabled: checked,
                            },
                          },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="behavior" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Widget Behavior</CardTitle>
                  <CardDescription>
                    Control how the widget behaves on your website
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-open Widget</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically open the chat after a delay
                      </p>
                    </div>
                    <Switch
                      checked={config.behavior.autoOpen}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          behavior: { ...config.behavior, autoOpen: checked },
                        })
                      }
                    />
                  </div>

                  {config.behavior.autoOpen && (
                    <div>
                      <Label>Auto-open Delay (seconds)</Label>
                      <Input
                        type="number"
                        value={config.behavior.autoOpenDelay / 1000}
                        onChange={(e) =>
                          setConfig({
                            ...config,
                            behavior: { ...config.behavior, autoOpenDelay: parseInt(e.target.value) * 1000 },
                          })
                        }
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Persist Conversations</Label>
                      <p className="text-sm text-muted-foreground">
                        Remember chat history between sessions
                      </p>
                    </div>
                    <Switch
                      checked={config.behavior.persistConversation}
                      onCheckedChange={(checked) =>
                        setConfig({
                          ...config,
                          behavior: { ...config.behavior, persistConversation: checked },
                        })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column - Preview & Code */}
        <div className="space-y-6">
          {/* Live Preview Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Preview</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowPreview(!showPreview)}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  {showPreview ? 'Hide' : 'Show'}
                </Button>
              </div>
            </CardHeader>
            {showPreview && (
              <CardContent>
                <div className="relative bg-muted rounded-lg h-[400px] overflow-hidden">
                  {/* Simulated website background */}
                  <div className="p-8 opacity-50">
                    <div className="h-20 bg-background/50 rounded mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-4 bg-background/30 rounded w-3/4"></div>
                      <div className="h-4 bg-background/30 rounded w-full"></div>
                      <div className="h-4 bg-background/30 rounded w-2/3"></div>
                    </div>
                  </div>
                  
                  {/* Chat widget preview */}
                  <div 
                    className={`absolute ${
                      config.appearance.position.includes('bottom') ? 'bottom-4' : 'top-4'
                    } ${
                      config.appearance.position.includes('right') ? 'right-4' : 'left-4'
                    }`}
                  >
                    <div 
                      className="bg-background border rounded-lg shadow-lg overflow-hidden"
                      style={{ width: '320px' }}
                    >
                      <div 
                        className="p-4 text-white"
                        style={{ backgroundColor: config.appearance.primaryColor }}
                      >
                        <h3 className="font-semibold">{config.appearance.headerTitle}</h3>
                        <p className="text-sm opacity-90">{config.appearance.headerSubtitle}</p>
                      </div>
                      <div className="p-4">
                        <div className="bg-muted rounded-lg p-3 mb-4">
                          <p className="text-sm">{config.appearance.welcomeMessage}</p>
                        </div>
                        <Input placeholder="Type your message..." disabled />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Embed Code Card */}
          <Card>
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Choose your framework and copy the installation code
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Framework Selection */}
              <div className="mb-4">
                <Label className="mb-2 block">Select your framework:</Label>
                <RadioGroup value={selectedFramework} onValueChange={setSelectedFramework}>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="html" id="html" />
                      <Label htmlFor="html" className="cursor-pointer">HTML</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="react" id="react" />
                      <Label htmlFor="react" className="cursor-pointer">React</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="nextjs" id="nextjs" />
                      <Label htmlFor="nextjs" className="cursor-pointer">Next.js</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="vue" id="vue" />
                      <Label htmlFor="vue" className="cursor-pointer">Vue</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="angular" id="angular" />
                      <Label htmlFor="angular" className="cursor-pointer">Angular</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="wordpress" id="wordpress" />
                      <Label htmlFor="wordpress" className="cursor-pointer">WordPress</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="shopify" id="shopify" />
                      <Label htmlFor="shopify" className="cursor-pointer">Shopify</Label>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              <div className="relative">
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                  <code>{generateEmbedCode(selectedFramework)}</code>
                </pre>
                <Button
                  size="sm"
                  variant="secondary"
                  className="absolute top-2 right-2"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Copy
                    </>
                  )}
                </Button>
              </div>

              {isOnboarding && (
                <Alert className="mt-4">
                  <Sparkles className="h-4 w-4" />
                  <AlertTitle>Almost done!</AlertTitle>
                  <AlertDescription>
                    Copy this code and add it to your website to go live. 
                    Need help? Check our <a href="/install" className="underline">installation guides</a>.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ConfigurePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfigurePageContent />
    </Suspense>
  );
}