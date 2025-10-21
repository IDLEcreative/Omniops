"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Save,
  RotateCcw,
  Download,
  Upload,
  History,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";

// Import section components
import { ThemeSection } from "./sections/ThemeSection";
import { PositionSection } from "./sections/PositionSection";
import { ContentSection } from "./sections/ContentSection";
import { BehaviorSection } from "./sections/BehaviorSection";
import { AIBehaviorSection } from "./sections/AIBehaviorSection";
import { IntegrationSection } from "./sections/IntegrationSection";
import { AnalyticsSection } from "./sections/AnalyticsSection";
import { AdvancedSection } from "./sections/AdvancedSection";
import { LivePreview } from "./components/LivePreview";

export interface WidgetConfig {
  // Theme settings
  themeSettings: {
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    borderRadius: string;
    fontSize: string;
    fontFamily: string;
    darkMode: boolean;
    customCSS: string;
  };

  // Position settings
  positionSettings: {
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    mobileBreakpoint: number;
  };

  // AI settings
  aiSettings: {
    personality: 'professional' | 'friendly' | 'helpful' | 'concise' | 'technical';
    responseLength: 'short' | 'balanced' | 'detailed';
    confidenceThreshold: number;
    fallbackBehavior: 'apologize_and_offer_help' | 'redirect_to_human' | 'suggest_alternatives';
    language: string;
    customSystemPrompt: string;
    enableSmartSuggestions: boolean;
    maxTokens: number;
    temperature: number;
  };

  // Behavior settings
  behaviorSettings: {
    welcomeMessage: string;
    placeholderText: string;
    botName: string;
    avatarUrl: string;
    showAvatar: boolean;
    showTypingIndicator: boolean;
    autoOpen: boolean;
    openDelay: number;
    minimizable: boolean;
    soundNotifications: boolean;
    persistConversation: boolean;
    messageDelay: number;
  };

  // Integration settings
  integrationSettings: {
    enableWooCommerce: boolean;
    enableWebSearch: boolean;
    enableKnowledgeBase: boolean;
    apiRateLimit: number;
    webhookUrl: string;
    customHeaders: Record<string, string>;
    allowedDomains: string[];
    dataSourcePriority: string[];
  };

  // Analytics settings
  analyticsSettings: {
    trackConversations: boolean;
    trackUserBehavior: boolean;
    trackPerformance: boolean;
    customEvents: string[];
    dataRetentionDays: number;
    anonymizeData: boolean;
    shareAnalyticsWithCustomer: boolean;
  };

  // Advanced settings
  advancedSettings: {
    corsOrigins: string[];
    cacheEnabled: boolean;
    cacheTTL: number;
    debugMode: boolean;
    customJSHooks: Record<string, string>;
    securityHeaders: Record<string, string>;
    rateLimitOverride: number | null;
    experimentalFeatures: string[];
  };

  // Branding settings
  brandingSettings: {
    showPoweredBy: boolean;
    customBrandingText: string;
    customLogoUrl: string;
    customFaviconUrl: string;
    brandColors: Record<string, string>;
  };
}

const defaultConfig: WidgetConfig = {
  themeSettings: {
    primaryColor: "#3b82f6",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    borderRadius: "8",
    fontSize: "14",
    fontFamily: "system-ui",
    darkMode: false,
    customCSS: "",
  },
  positionSettings: {
    position: "bottom-right",
    offsetX: 24,
    offsetY: 24,
    width: 380,
    height: 600,
    mobileBreakpoint: 768,
  },
  aiSettings: {
    personality: "professional",
    responseLength: "balanced",
    confidenceThreshold: 0.7,
    fallbackBehavior: "apologize_and_offer_help",
    language: "auto",
    customSystemPrompt: "",
    enableSmartSuggestions: true,
    maxTokens: 500,
    temperature: 0.7,
  },
  behaviorSettings: {
    welcomeMessage: "Hi! How can I help you today?",
    placeholderText: "Type your message...",
    botName: "Assistant",
    avatarUrl: "",
    showAvatar: true,
    showTypingIndicator: true,
    autoOpen: false,
    openDelay: 3000,
    minimizable: true,
    soundNotifications: false,
    persistConversation: true,
    messageDelay: 500,
  },
  integrationSettings: {
    enableWooCommerce: false,
    enableWebSearch: false,
    enableKnowledgeBase: true,
    apiRateLimit: 60,
    webhookUrl: "",
    customHeaders: {},
    allowedDomains: [],
    dataSourcePriority: ["knowledge_base", "web_search", "woocommerce"],
  },
  analyticsSettings: {
    trackConversations: true,
    trackUserBehavior: true,
    trackPerformance: true,
    customEvents: [],
    dataRetentionDays: 30,
    anonymizeData: false,
    shareAnalyticsWithCustomer: true,
  },
  advancedSettings: {
    corsOrigins: ["*"],
    cacheEnabled: true,
    cacheTTL: 3600,
    debugMode: false,
    customJSHooks: {},
    securityHeaders: {},
    rateLimitOverride: null,
    experimentalFeatures: [],
  },
  brandingSettings: {
    showPoweredBy: true,
    customBrandingText: "",
    customLogoUrl: "",
    customFaviconUrl: "",
    brandColors: {},
  },
};

export default function CustomizationPage() {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState("theme");
  const [isDirty, setIsDirty] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customerConfigId, setCustomerConfigId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    setIsLoading(true);
    try {
      // Get customer config ID from URL params or session
      const params = new URLSearchParams(window.location.search);
      const ccId = params.get('customerConfigId');

      if (ccId) {
        setCustomerConfigId(ccId);

        const response = await fetch(`/api/widget-config?customerConfigId=${ccId}`);
        const data = await response.json();

        if (data.success && data.data.config) {
          setConfig({
            themeSettings: data.data.config.theme_settings,
            positionSettings: data.data.config.position_settings,
            aiSettings: data.data.config.ai_settings,
            behaviorSettings: data.data.config.behavior_settings,
            integrationSettings: data.data.config.integration_settings,
            analyticsSettings: data.data.config.analytics_settings,
            advancedSettings: data.data.config.advanced_settings,
            brandingSettings: data.data.config.branding_settings,
          });
          setConfigId(data.data.config.id);
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateConfig = useCallback((
    section: keyof WidgetConfig,
    updates: Partial<WidgetConfig[keyof WidgetConfig]>
  ) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
    setIsDirty(true);
  }, []);

  const resetConfig = () => {
    setConfig(defaultConfig);
    setIsDirty(false);
  };

  const saveConfiguration = async () => {
    if (!customerConfigId) {
      toast({
        title: "Error",
        description: "No customer configuration selected",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const url = configId
        ? `/api/widget-config?id=${configId}`
        : '/api/widget-config';

      const method = configId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerConfigId,
          ...config,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsDirty(false);
        if (!configId && data.data.id) {
          setConfigId(data.data.id);
        }
        toast({
          title: "Success",
          description: "Configuration saved successfully",
        });
      } else {
        throw new Error(data.error || 'Failed to save');
      }
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const exportConfiguration = () => {
    const dataStr = JSON.stringify(config, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `widget-config-${new Date().toISOString()}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importConfiguration = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedConfig = JSON.parse(e.target?.result as string);
          setConfig(importedConfig);
          setIsDirty(true);
          toast({
            title: "Success",
            description: "Configuration imported successfully",
          });
        } catch (error) {
          toast({
            title: "Error",
            description: "Invalid configuration file",
            variant: "destructive",
          });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Widget Customization
          </h2>
          <p className="text-muted-foreground">
            Customize appearance, behavior, AI settings, and integrations for your chat widget
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}

          <Button variant="outline" size="icon" onClick={exportConfiguration}>
            <Download className="h-4 w-4" />
          </Button>

          <label htmlFor="import-config">
            <Button variant="outline" size="icon" asChild>
              <span>
                <Upload className="h-4 w-4" />
              </span>
            </Button>
          </label>
          <input
            id="import-config"
            type="file"
            accept=".json"
            onChange={importConfiguration}
            className="hidden"
          />

          <Button variant="outline" onClick={resetConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>

          <Button onClick={saveConfiguration} disabled={isSaving || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {!customerConfigId && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No customer configuration selected. Please select a customer from the customers page first.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="position">Position</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="integrations">Integrations</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="theme">
              <ThemeSection
                settings={config.themeSettings}
                onChange={(updates) => updateConfig('themeSettings', updates)}
              />
            </TabsContent>

            <TabsContent value="position">
              <PositionSection
                settings={config.positionSettings}
                onChange={(updates) => updateConfig('positionSettings', updates)}
              />
            </TabsContent>

            <TabsContent value="content">
              <ContentSection
                settings={config.behaviorSettings}
                onChange={(updates) => updateConfig('behaviorSettings', updates)}
              />
            </TabsContent>

            <TabsContent value="behavior">
              <BehaviorSection
                settings={config.behaviorSettings}
                onChange={(updates) => updateConfig('behaviorSettings', updates)}
              />
            </TabsContent>

            <TabsContent value="ai">
              <AIBehaviorSection
                settings={config.aiSettings}
                onChange={(updates) => updateConfig('aiSettings', updates)}
              />
            </TabsContent>

            <TabsContent value="integrations">
              <IntegrationSection
                settings={config.integrationSettings}
                onChange={(updates) => updateConfig('integrationSettings', updates)}
              />
            </TabsContent>

            <TabsContent value="analytics">
              <AnalyticsSection
                settings={config.analyticsSettings}
                onChange={(updates) => updateConfig('analyticsSettings', updates)}
              />
            </TabsContent>

            <TabsContent value="advanced">
              <AdvancedSection
                settings={config.advancedSettings}
                brandingSettings={config.brandingSettings}
                onAdvancedChange={(updates) => updateConfig('advancedSettings', updates)}
                onBrandingChange={(updates) => updateConfig('brandingSettings', updates)}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <LivePreview config={config} />
        </div>
      </div>
    </div>
  );
}