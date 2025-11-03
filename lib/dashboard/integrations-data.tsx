import {
  ShoppingCart,
  Package,
  Users,
  Mail,
  Calendar,
  Zap,
  BarChart3,
  Building2,
  MessageSquare,
  Cloud,
  Database,
} from "lucide-react";
import { Integration } from "@/components/dashboard/integrations/IntegrationCard";
import { Category } from "@/components/dashboard/integrations/IntegrationsCategorySidebar";

// Note: Status will be dynamically updated by useEffect in the page component
export const integrationsData: Integration[] = [
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Sync products, orders, and customer data from your WooCommerce store',
    icon: <ShoppingCart className="h-5 w-5" />,
    status: 'loading', // Will be updated dynamically
    category: 'ecommerce',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Import products and handle customer inquiries about Shopify orders',
    icon: <Package className="h-5 w-5" />,
    status: 'loading', // Will be updated dynamically
    category: 'ecommerce',
  },
  {
    id: 'salesforce',
    name: 'Salesforce',
    description: 'Access customer records and support tickets from Salesforce CRM',
    icon: <Cloud className="h-5 w-5" />,
    status: 'coming_soon',
    category: 'crm',
  },
  {
    id: 'hubspot',
    name: 'HubSpot',
    description: 'Sync contacts and support conversations with HubSpot CRM',
    icon: <Building2 className="h-5 w-5" />,
    status: 'coming_soon',
    category: 'crm',
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Receive notifications and manage conversations in Slack',
    icon: <MessageSquare className="h-5 w-5" />,
    status: 'coming_soon',
    category: 'communication',
  },
  {
    id: 'gmail',
    name: 'Gmail',
    description: 'Process support emails and automate email responses',
    icon: <Mail className="h-5 w-5" />,
    status: 'coming_soon',
    category: 'communication',
  },
  {
    id: 'calendly',
    name: 'Calendly',
    description: 'Schedule appointments and manage booking inquiries',
    icon: <Calendar className="h-5 w-5" />,
    status: 'coming_soon',
    category: 'productivity',
  },
  {
    id: 'zapier',
    name: 'Zapier',
    description: 'Connect with 5000+ apps through Zapier automation',
    icon: <Zap className="h-5 w-5" />,
    status: 'coming_soon',
    category: 'productivity',
  },
  {
    id: 'google-analytics',
    name: 'Google Analytics',
    description: 'Track customer interactions and measure chatbot performance',
    icon: <BarChart3 className="h-5 w-5" />,
    status: 'coming_soon',
    category: 'analytics',
  },
];

export function getCategoriesData(integrations: Integration[]): Category[] {
  return [
    {
      id: 'all',
      name: 'All',
      icon: <Database className="h-4 w-4" />,
      count: integrations.length
    },
    {
      id: 'ecommerce',
      name: 'E-commerce',
      icon: <ShoppingCart className="h-4 w-4" />,
      count: integrations.filter(i => i.category === 'ecommerce').length
    },
    {
      id: 'crm',
      name: 'CRM',
      icon: <Users className="h-4 w-4" />,
      count: integrations.filter(i => i.category === 'crm').length
    },
    {
      id: 'communication',
      name: 'Communication',
      icon: <MessageSquare className="h-4 w-4" />,
      count: integrations.filter(i => i.category === 'communication').length
    },
    {
      id: 'productivity',
      name: 'Productivity',
      icon: <Zap className="h-4 w-4" />,
      count: integrations.filter(i => i.category === 'productivity').length
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: <BarChart3 className="h-4 w-4" />,
      count: integrations.filter(i => i.category === 'analytics').length
    },
  ];
}
