"use client";

import { useState } from "react";
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

  const categories = getCategoriesData(integrationsData);
  const filteredIntegrations = filterIntegrations(integrationsData, selectedCategory, searchQuery);
  const { connectedCount, availableCount } = getIntegrationStats(integrationsData);

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
        totalCount={integrationsData.length}
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
