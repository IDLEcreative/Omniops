'use client';

import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye } from "lucide-react";
import dynamic from "next/dynamic";
import type { SimplifiedWidgetConfig } from "../types";

// Dynamically import ChatWidget to avoid SSR issues
// eslint-disable-next-line no-restricted-syntax -- React component path, not product reference
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { ssr: false });

interface LivePreviewProps {
  config: SimplifiedWidgetConfig;
  customerDomain: string | null;
}

export function LivePreview({ config, customerDomain }: LivePreviewProps) {
  // Convert SimplifiedWidgetConfig to ChatWidgetConfig format
  const widgetConfig = useMemo(() => ({
    theme_settings: {
      primaryColor: config.essentials.primaryColor,
      fontFamily: 'system-ui',
    },
    position_settings: {
      position: config.essentials.position,
    },
    behavior_settings: {
      botName: config.essentials.botName,
      welcomeMessage: config.essentials.welcomeMessage,
      placeholderText: config.essentials.placeholderText,
      showAvatar: config.essentials.showAvatar,
      autoOpen: config.essentials.autoOpen,
      openDelay: config.essentials.autoOpenDelay,
      soundNotifications: config.essentials.soundNotifications,
    },
    ai_settings: {
      personality: config.intelligence.personality,
      language: config.intelligence.language,
      responseLength: config.intelligence.responseStyle,
      enableSmartSuggestions: config.intelligence.enableSmartSuggestions,
    },
    branding_settings: {
      customLogoUrl: config.essentials.logoUrl,
      minimizedIconUrl: config.essentials.minimizedIconUrl,
    },
    integration_settings: {
      enableWooCommerce: config.connect.enableWooCommerce,
      enableWebSearch: config.intelligence.enableWebSearch,
      enableKnowledgeBase: config.connect.enableKnowledgeBase,
    },
    analytics_settings: {
      trackConversations: config.connect.trackConversations,
      dataRetentionDays: config.connect.dataRetentionDays,
    },
  }), [config]);

  return (
    <Card className="sticky top-6 max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Eye className="h-5 w-5 mr-2" />
          Live Preview
        </CardTitle>
        <CardDescription>
          Real-time widget preview
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg h-[600px] overflow-hidden shadow-inner">
          {/* Mock browser chrome */}
          <div className="bg-gray-300 p-2 rounded-t-lg flex items-center space-x-2">
            <div className="flex space-x-1.5">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            <div className="flex-1 bg-white rounded px-3 py-1 text-xs text-gray-500">
              yoursite.com
            </div>
          </div>

          {/* Mock website content with REAL widget */}
          <div className="p-6 space-y-3 h-full bg-white relative overflow-hidden">
            {/* Fake content */}
            <div className="h-6 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            <div className="h-4 bg-gray-100 rounded w-1/2"></div>
            <div className="h-4 bg-gray-100 rounded w-5/6"></div>
            <div className="h-4 bg-gray-100 rounded w-2/3"></div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="h-24 bg-gray-100 rounded"></div>
              <div className="h-24 bg-gray-100 rounded"></div>
            </div>

            {/* REAL ChatWidget */}
            <div className="absolute inset-0">
              <ChatWidget
                demoId="preview"
                demoConfig={{
                  ...widgetConfig,
                  domain: customerDomain || undefined, // Pass the customer's actual domain
                }}
                initialOpen={config.essentials.autoOpen}
                forceClose={false}
                privacySettings={{
                  allowOptOut: false,
                  showPrivacyNotice: false,
                  requireConsent: false,
                  consentGiven: true,
                  retentionDays: config.connect.dataRetentionDays,
                }}
              />
            </div>
          </div>
        </div>

        {/* Settings Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 mb-2">Quick Summary</h4>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Personality:</span>
              <span className="font-medium capitalize">{config.intelligence.personality}</span>
            </div>
            <div className="flex justify-between">
              <span>Position:</span>
              <span className="font-medium">{config.essentials.position.replace('-', ' ')}</span>
            </div>
            <div className="flex justify-between">
              <span>Smart Features:</span>
              <span className="font-medium">
                {config.intelligence.enableSmartSuggestions ? 'Suggestions' : 'No suggestions'}
                {config.intelligence.enableWebSearch ? ', Web Search' : ''}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Integrations:</span>
              <span className="font-medium">
                {config.connect.enableWooCommerce ? 'WooCommerce' : 'None'}
                {config.connect.enableShopify ? ', Shopify' : ''}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
