"use client";

import { Search } from "lucide-react";
import { IntegrationCard, Integration } from "./IntegrationCard";

interface IntegrationsListProps {
  integrations: Integration[];
  onIntegrationClick: (integration: Integration) => void;
}

export function IntegrationsList({ integrations, onIntegrationClick }: IntegrationsListProps) {
  if (integrations.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
        <p className="text-muted-foreground">
          Try adjusting your search or filter criteria
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {integrations.map((integration) => (
        <IntegrationCard
          key={integration.id}
          integration={integration}
          onIntegrationClick={onIntegrationClick}
        />
      ))}
    </div>
  );
}
