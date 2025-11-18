/**
 * Custom hook for managing widget configuration
 * Handles fetching, loading, and saving widget configurations
 */

import { useState, useEffect, useCallback } from 'react';
import type { CustomerConfig } from '@/types/database';
import type { SimplifiedWidgetConfig } from '../types';
import { defaultConfig } from '../types';

interface UseWidgetConfigProps {
  toast: (options: { title: string; description: string; variant?: 'default' | 'destructive' }) => void;
}

export function useWidgetConfig({ toast }: UseWidgetConfigProps) {
  const [config, setConfig] = useState<SimplifiedWidgetConfig>(defaultConfig);
  const [customerConfigId, setCustomerConfigId] = useState<string | null>(null);
  const [availableConfigs, setAvailableConfigs] = useState<CustomerConfig[]>([]);
  const [isLoadingConfigs, setIsLoadingConfigs] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const fetchCustomerConfigs = useCallback(async () => {
    setIsLoadingConfigs(true);
    try {
      const response = await fetch('/api/customer/config');
      const data = await response.json();


      if (data.success && data.data) {
        setAvailableConfigs(data.data);

        // Check if customerConfigId is in URL query params
        const params = new URLSearchParams(window.location.search);
        const ccIdFromUrl = params.get('customerConfigId');

        if (ccIdFromUrl) {
          setCustomerConfigId(ccIdFromUrl);
        } else if (data.data.length === 1) {
          setCustomerConfigId(data.data[0].id);
        }
      } else {
        console.warn('[useWidgetConfig] No configs found or API error:', data);
      }
    } catch (error) {
      console.error('Error fetching customer configs:', error);
      toast({
        title: "Error",
        description: "Failed to load customer configurations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingConfigs(false);
    }
  }, [toast]);

  const loadConfiguration = useCallback(async (configId: string) => {
    try {
      if (!configId) return;

      const response = await fetch(`/api/widget-config?customerConfigId=${configId}`);
      const data = await response.json();

      if (data.success && data.data.config) {
        const fullConfig = data.data.config;
        setConfig({
          essentials: {
            primaryColor: fullConfig.theme_settings?.primaryColor || defaultConfig.essentials.primaryColor,
            logoUrl: fullConfig.branding_settings?.customLogoUrl || "",
            minimizedIconUrl: fullConfig.branding_settings?.minimizedIconUrl || "",
            minimizedIconHoverUrl: fullConfig.branding_settings?.minimizedIconHoverUrl || "",
            minimizedIconActiveUrl: fullConfig.branding_settings?.minimizedIconActiveUrl || "",
            position: fullConfig.position_settings?.position || "bottom-right",
            botName: fullConfig.behavior_settings?.botName || "Assistant",
            welcomeMessage: fullConfig.behavior_settings?.welcomeMessage || defaultConfig.essentials.welcomeMessage,
            placeholderText: fullConfig.behavior_settings?.placeholderText || defaultConfig.essentials.placeholderText,
            showAvatar: fullConfig.behavior_settings?.showAvatar ?? true,
            autoOpen: fullConfig.behavior_settings?.autoOpen ?? false,
            autoOpenDelay: fullConfig.behavior_settings?.openDelay || 3000,
            soundNotifications: fullConfig.behavior_settings?.soundNotifications ?? false,
            animationType: fullConfig.behavior_settings?.animationType || defaultConfig.essentials.animationType,
            animationSpeed: fullConfig.behavior_settings?.animationSpeed || defaultConfig.essentials.animationSpeed,
            animationIntensity: fullConfig.behavior_settings?.animationIntensity || defaultConfig.essentials.animationIntensity,
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
            enableShopify: false,
            enableKnowledgeBase: fullConfig.integration_settings?.enableKnowledgeBase ?? true,
            enableProductCatalog: true,
            trackConversations: fullConfig.analytics_settings?.trackConversations ?? true,
            dataRetentionDays: fullConfig.analytics_settings?.dataRetentionDays || 30,
          },
        });
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      toast({
        title: "Error",
        description: "Failed to load configuration",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Fetch customer configs on mount
  useEffect(() => {
    fetchCustomerConfigs();
  }, [fetchCustomerConfigs]);

  // Load configuration when customerConfigId changes
  useEffect(() => {
    if (customerConfigId) {
      loadConfiguration(customerConfigId);
    }
  }, [customerConfigId, loadConfiguration]);

  const mapToSimplePersonality = (fullPersonality?: string): 'professional' | 'friendly' | 'concise' => {
    if (fullPersonality === 'professional') return 'professional';
    if (fullPersonality === 'concise' || fullPersonality === 'technical') return 'concise';
    return 'friendly';
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
        title: "No Website Selected",
        description: "Please select a website from the dropdown above to customize its chat widget",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const fullConfig = {
        customerConfigId,
        themeSettings: { primaryColor: config.essentials.primaryColor },
        positionSettings: { position: config.essentials.position },
        behaviorSettings: {
          botName: config.essentials.botName,
          welcomeMessage: config.essentials.welcomeMessage,
          placeholderText: config.essentials.placeholderText,
          showAvatar: config.essentials.showAvatar,
          autoOpen: config.essentials.autoOpen,
          openDelay: config.essentials.autoOpenDelay,
          soundNotifications: config.essentials.soundNotifications,
          animationType: config.essentials.animationType,
          animationSpeed: config.essentials.animationSpeed,
          animationIntensity: config.essentials.animationIntensity,
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
          minimizedIconUrl: config.essentials.minimizedIconUrl,
          minimizedIconHoverUrl: config.essentials.minimizedIconHoverUrl,
          minimizedIconActiveUrl: config.essentials.minimizedIconActiveUrl,
        },
      };

      const checkResponse = await fetch(`/api/widget-config?customerConfigId=${customerConfigId}`);
      const checkData = await checkResponse.json();
      const configExists = checkData.success && checkData.data.config;

      const url = configExists ? `/api/widget-config?id=${checkData.data.config.id}` : '/api/widget-config';
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

  // Get the selected customer's domain
  const selectedConfig = availableConfigs.find(c => c.id === customerConfigId);
  const customerDomain = selectedConfig?.domain || null;

  return {
    config,
    customerConfigId,
    setCustomerConfigId,
    availableConfigs,
    isLoadingConfigs,
    isSaving,
    isDirty,
    customerDomain, // Export the domain
    updateConfig,
    resetConfig,
    saveConfiguration,
  };
}
