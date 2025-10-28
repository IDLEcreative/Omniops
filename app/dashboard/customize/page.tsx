"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Save, RotateCcw, Palette, Brain, Plug2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Import section components
import { EssentialsSection } from "./sections/EssentialsSection";
import { IntelligenceSection } from "./sections/IntelligenceSection";
import { ConnectSection } from "./sections/ConnectSection";
import { LivePreview } from "./components/LivePreview";

export interface SimplifiedWidgetConfig {
  // Essentials
  essentials: {
    primaryColor: string;
    logoUrl: string;
    position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    botName: string;
    welcomeMessage: string;
    placeholderText: string;
    showAvatar: boolean;
    autoOpen: boolean;
    autoOpenDelay: number;
    soundNotifications: boolean;
  };

  // Intelligence
  intelligence: {
    personality: 'professional' | 'friendly' | 'concise';
    language: string;
    responseStyle: 'short' | 'balanced' | 'detailed';
    enableSmartSuggestions: boolean;
    enableWebSearch: boolean;
  };

  // Connect
  connect: {
    enableWooCommerce: boolean;
    enableShopify: boolean;
    enableKnowledgeBase: boolean;
    enableProductCatalog: boolean;
    trackConversations: boolean;
    dataRetentionDays: number;
  };
}

const defaultConfig: SimplifiedWidgetConfig = {
  essentials: {
    primaryColor: "#3b82f6",
    logoUrl: "",
    position: "bottom-right",
    botName: "Assistant",
    welcomeMessage: "Hi! How can I help you today?",
    placeholderText: "Type your message...",
    showAvatar: true,
    autoOpen: false,
    autoOpenDelay: 3000,
    soundNotifications: false,
  },
  intelligence: {
    personality: "friendly",
    language: "auto",
    responseStyle: "balanced",
    enableSmartSuggestions: true,
    enableWebSearch: false,
  },
  connect: {
    enableWooCommerce: false,
    enableShopify: false,
    enableKnowledgeBase: true,
    enableProductCatalog: true,
    trackConversations: true,
    dataRetentionDays: 30,
  },
};

export default function CustomizeV2Page() {
  const [config, setConfig] = useState<SimplifiedWidgetConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState("essentials");
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [customerConfigId, setCustomerConfigId] = useState<string | null>(null);
  const { toast } = useToast();

  // Load existing configuration
  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const ccId = params.get('customerConfigId');

      if (ccId) {
        setCustomerConfigId(ccId);

        const response = await fetch(`/api/widget-config?customerConfigId=${ccId}`);
        const data = await response.json();

        if (data.success && data.data.config) {
          // Map full config to simplified config
          const fullConfig = data.data.config;
          setConfig({
            essentials: {
              primaryColor: fullConfig.theme_settings?.primaryColor || defaultConfig.essentials.primaryColor,
              logoUrl: fullConfig.branding_settings?.customLogoUrl || "",
              position: fullConfig.position_settings?.position || "bottom-right",
              botName: fullConfig.behavior_settings?.botName || "Assistant",
              welcomeMessage: fullConfig.behavior_settings?.welcomeMessage || defaultConfig.essentials.welcomeMessage,
              placeholderText: fullConfig.behavior_settings?.placeholderText || defaultConfig.essentials.placeholderText,
              showAvatar: fullConfig.behavior_settings?.showAvatar ?? true,
              autoOpen: fullConfig.behavior_settings?.autoOpen ?? false,
              autoOpenDelay: fullConfig.behavior_settings?.openDelay || 3000,
              soundNotifications: fullConfig.behavior_settings?.soundNotifications ?? false,
            },
            intelligence: {
              personality: mapToSimplePersonality(fullConfig.ai_settings?.personality),
              language: fullConfig.ai_settings?.language || "auto",
              responseStyle: fullConfig.ai_settings?.responseLength || "balanced",
              enableSmartSuggestions: fullConfig.ai_settings?.enableSmartSuggestions ?? true,
              enableWebSearch: fullConfig.integration_settings?.enableWebSearch ?? false,
            },
            connect: {
              enableWooCommerce: fullConfig.integration_settings?.enableWooCommerce ?? false,
              enableShopify: false, // TODO: Add Shopify support
              enableKnowledgeBase: fullConfig.integration_settings?.enableKnowledgeBase ?? true,
              enableProductCatalog: true,
              trackConversations: fullConfig.analytics_settings?.trackConversations ?? true,
              dataRetentionDays: fullConfig.analytics_settings?.dataRetentionDays || 30,
            },
          });
        }
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    }
  };

  const mapToSimplePersonality = (fullPersonality?: string): 'professional' | 'friendly' | 'concise' => {
    if (fullPersonality === 'professional') return 'professional';
    if (fullPersonality === 'concise' || fullPersonality === 'technical') return 'concise';
    return 'friendly'; // Default for 'helpful' or 'friendly'
  };

  const updateConfig = (section: keyof SimplifiedWidgetConfig, updates: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: { ...prev[section], ...updates },
    }));
    setIsDirty(true);
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    setIsDirty(false);
    toast({
      title: "Reset",
      description: "Configuration reset to defaults",
    });
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
      // Map simplified config back to full config format
      const fullConfig = {
        customerConfigId,
        themeSettings: {
          primaryColor: config.essentials.primaryColor,
        },
        positionSettings: {
          position: config.essentials.position,
        },
        behaviorSettings: {
          botName: config.essentials.botName,
          welcomeMessage: config.essentials.welcomeMessage,
          placeholderText: config.essentials.placeholderText,
          showAvatar: config.essentials.showAvatar,
          autoOpen: config.essentials.autoOpen,
          openDelay: config.essentials.autoOpenDelay,
          soundNotifications: config.essentials.soundNotifications,
        },
        aiSettings: {
          personality: config.intelligence.personality,
          language: config.intelligence.language,
          responseLength: config.intelligence.responseStyle,
          enableSmartSuggestions: config.intelligence.enableSmartSuggestions,
        },
        integrationSettings: {
          enableWooCommerce: config.connect.enableWooCommerce,
          enableWebSearch: config.intelligence.enableWebSearch,
          enableKnowledgeBase: config.connect.enableKnowledgeBase,
        },
        analyticsSettings: {
          trackConversations: config.connect.trackConversations,
          dataRetentionDays: config.connect.dataRetentionDays,
        },
        brandingSettings: {
          customLogoUrl: config.essentials.logoUrl,
        },
      };

      // Check if config exists
      const checkResponse = await fetch(`/api/widget-config?customerConfigId=${customerConfigId}`);
      const checkData = await checkResponse.json();
      const configExists = checkData.success && checkData.data.config;

      const url = configExists
        ? `/api/widget-config?id=${checkData.data.config.id}`
        : '/api/widget-config';

      const method = configExists ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fullConfig),
      });

      const data = await response.json();

      if (data.success) {
        setIsDirty(false);
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

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customize Your Chatbot</h1>
          <p className="text-muted-foreground mt-2">
            Simple, clean, and easy to use
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetConfig} disabled={isSaving}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfiguration} disabled={isSaving || !isDirty}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="essentials">
                <Palette />
                Essentials
              </TabsTrigger>
              <TabsTrigger value="intelligence">
                <Brain />
                Intelligence
              </TabsTrigger>
              <TabsTrigger value="connect">
                <Plug2 />
                Connect
              </TabsTrigger>
            </TabsList>

            <TabsContent value="essentials">
              <EssentialsSection
                settings={config.essentials}
                onChange={(updates) => updateConfig('essentials', updates)}
              />
            </TabsContent>

            <TabsContent value="intelligence">
              <IntelligenceSection
                settings={config.intelligence}
                onChange={(updates) => updateConfig('intelligence', updates)}
              />
            </TabsContent>

            <TabsContent value="connect">
              <ConnectSection
                settings={config.connect}
                onChange={(updates) => updateConfig('connect', updates)}
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
