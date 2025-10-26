import { Integration } from "@/components/dashboard/integrations/IntegrationCard";

export function filterIntegrations(
  integrations: Integration[],
  selectedCategory: string,
  searchQuery: string
): Integration[] {
  return integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
}

export function getIntegrationStats(integrations: Integration[]) {
  return {
    connectedCount: integrations.filter(i => i.status === 'connected').length,
    availableCount: integrations.filter(i => i.status !== 'coming_soon').length,
  };
}

export function handleIntegrationNavigation(integration: Integration): void {
  if (integration.status === 'coming_soon') {
    return;
  }
  if (integration.id === 'woocommerce') {
    window.location.href = '/dashboard/integrations/woocommerce/configure';
  }
  if (integration.id === 'shopify') {
    window.location.href = '/dashboard/integrations/shopify';
  }
}
