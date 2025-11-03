"use client";

import { useState, useEffect } from "react";
import { IntegrationCard } from "@/components/dashboard/integrations/IntegrationCard";
import { IntegrationsList } from "@/components/dashboard/integrations/IntegrationsList";
import { IntegrationsStatsOverview } from "@/components/dashboard/integrations/IntegrationsStatsOverview";
import { IntegrationsCategorySidebar } from "@/components/dashboard/integrations/IntegrationsCategorySidebar";
import { IntegrationsSearchBar } from "@/components/dashboard/integrations/IntegrationsSearchBar";
import { IntegrationsBottomCTA } from "@/components/dashboard/integrations/IntegrationsBottomCTA";
import { integrationsData, getCategoriesData } from "@/lib/dashboard/integrations-data";
import {
  filterIntegrations,
  getIntegrationStats,
  handleIntegrationNavigation,
} from "@/lib/dashboard/integrations-utils";

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [integrations, setIntegrations] = useState(integrationsData);

  // Dynamically check integration statuses
  useEffect(() => {
    async function checkIntegrationStatuses() {
      const domain = typeof window !== 'undefined' ? window.location.hostname : 'localhost';

      // Check WooCommerce status
      try {
        const wooResponse = await fetch(`/api/woocommerce/configure?domain=${domain}`);
        const wooData = await wooResponse.json();

        // Check Shopify status (if endpoint exists)
        let shopifyData = { configured: false };
        try {
          const shopifyResponse = await fetch(`/api/shopify/configure?domain=${domain}`);
          shopifyData = await shopifyResponse.json();
        } catch (e) {
          // Shopify endpoint might not exist yet
        }

        setIntegrations(prev => prev.map(integration => {
          if (integration.id === 'woocommerce') {
            return {
              ...integration,
              status: wooData.configured ? 'connected' : 'disconnected'
            };
          }
          if (integration.id === 'shopify') {
            return {
              ...integration,
              status: shopifyData.configured ? 'connected' : 'disconnected'
            };
          }
          return integration;
        }));
      } catch (error) {
        console.error('Failed to check integration statuses:', error);
        // Set to disconnected on error
        setIntegrations(prev => prev.map(integration => {
          if (integration.id === 'woocommerce' || integration.id === 'shopify') {
            return { ...integration, status: 'disconnected' };
          }
          return integration;
        }));
      }
    }

    checkIntegrationStatuses();
  }, []);

  const categories = getCategoriesData(integrations);
  const filteredIntegrations = filterIntegrations(integrations, selectedCategory, searchQuery);
  const { connectedCount, availableCount } = getIntegrationStats(integrations);

  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      {/* Header Section */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Integrations</h2>
        <p className="text-muted-foreground mt-1">
          Connect your tools and automate your workflow
        </p>
      </div>

      {/* Stats Overview */}
      <IntegrationsStatsOverview
        totalCount={integrations.length}
        connectedCount={connectedCount}
        availableCount={availableCount}
      />

      {/* Search and Filter Section */}
      <IntegrationsSearchBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-4">
          <IntegrationsCategorySidebar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategorySelect={setSelectedCategory}
          />
        </div>

        {/* Integrations Grid */}
        <div className="lg:col-span-3">
          <IntegrationsList
            integrations={filteredIntegrations}
            onIntegrationClick={handleIntegrationNavigation}
          />
        </div>
      </div>

      {/* Bottom CTA */}
      <IntegrationsBottomCTA />
    </div>
  );
}
