"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Mail, 
  Calendar, 
  Zap, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  Search,
  Link2,
  BarChart3,
  TrendingUp,
  Sparkles,
  Building2,
  MessageSquare,
  Database,
  Cloud,
  Shield,
  Settings2,
  ExternalLink
} from "lucide-react";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'connected' | 'disconnected' | 'coming_soon';
  category: 'ecommerce' | 'crm' | 'communication' | 'productivity' | 'analytics';
  metrics?: {
    synced?: number;
    lastSync?: string;
  };
}

const integrations: Integration[] = [
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    description: 'Sync products, orders, and customer data from your WooCommerce store',
    icon: <ShoppingCart className="h-5 w-5" />,
    status: 'disconnected',
    category: 'ecommerce',
  },
  {
    id: 'shopify',
    name: 'Shopify',
    description: 'Import products and handle customer inquiries about Shopify orders',
    icon: <Package className="h-5 w-5" />,
    status: 'disconnected',
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

export default function IntegrationsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = [
    { id: 'all', name: 'All', icon: <Database className="h-4 w-4" />, count: integrations.length },
    { id: 'ecommerce', name: 'E-commerce', icon: <ShoppingCart className="h-4 w-4" />, count: 2 },
    { id: 'crm', name: 'CRM', icon: <Users className="h-4 w-4" />, count: 2 },
    { id: 'communication', name: 'Communication', icon: <MessageSquare className="h-4 w-4" />, count: 2 },
    { id: 'productivity', name: 'Productivity', icon: <Zap className="h-4 w-4" />, count: 2 },
    { id: 'analytics', name: 'Analytics', icon: <BarChart3 className="h-4 w-4" />, count: 1 },
  ];

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const availableCount = integrations.filter(i => i.status !== 'coming_soon').length;

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'disconnected':
        return <div className="h-2 w-2 rounded-full bg-gray-300" />;
      case 'coming_soon':
        return <AlertCircle className="h-5 w-5 text-amber-500" />;
    }
  };

  const getStatusBadge = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/10 text-green-600 border-green-200">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Not Connected</Badge>;
      case 'coming_soon':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Coming Soon</Badge>;
    }
  };

  const handleIntegrationClick = (integration: Integration) => {
    if (integration.status === 'coming_soon') {
      return;
    }
    if (integration.id === 'woocommerce') {
      window.location.href = '/dashboard/integrations/woocommerce/configure';
    }
    if (integration.id === 'shopify') {
      window.location.href = '/dashboard/integrations/shopify';
    }
  };

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
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Integrations</CardTitle>
            <Link2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length}</div>
            <div className="flex items-center mt-1">
              <Progress value={(connectedCount / integrations.length) * 100} className="h-2" />
              <span className="ml-2 text-xs text-muted-foreground">{connectedCount} active</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{connectedCount}</div>
            <p className="text-xs text-muted-foreground">
              Active integrations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
            <Shield className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableCount}</div>
            <p className="text-xs text-muted-foreground">
              Ready to connect
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coming Soon</CardTitle>
            <Sparkles className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{integrations.length - availableCount}</div>
            <p className="text-xs text-muted-foreground">
              In development
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter Section */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Request Integration
        </Button>
      </div>

      {/* Main Content Area */}
      <div className="grid gap-6 lg:grid-cols-4">
        {/* Sidebar Categories */}
        <div className="lg:col-span-1 space-y-4">
          <div>
            <h3 className="font-semibold mb-3 text-sm text-muted-foreground uppercase tracking-wider">
              Categories
            </h3>
            <div className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {category.icon}
                    <span>{category.name}</span>
                  </div>
                  <Badge 
                    variant={selectedCategory === category.id ? "secondary" : "outline"} 
                    className="ml-auto"
                  >
                    {category.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Integrations Grid */}
        <div className="lg:col-span-3">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredIntegrations.map((integration) => (
              <Card
                key={integration.id}
                className={`group hover:shadow-lg transition-all ${
                  integration.status === 'coming_soon' ? 'opacity-75' : 'cursor-pointer'
                }`}
                onClick={() => {
                  if (integration.status !== 'coming_soon') {
                    handleIntegrationClick(integration);
                  }
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary group-hover:scale-110 transition-transform">
                      {integration.icon}
                    </div>
                    {getStatusIcon(integration.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {integration.description}
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
                    {getStatusBadge(integration.status)}
                    {integration.status !== 'coming_soon' && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleIntegrationClick(integration);
                        }}
                      >
                        Configure
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredIntegrations.length === 0 && (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No integrations found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filter criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Bottom CTA */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold">Can't find what you're looking for?</h3>
            <p className="text-sm text-muted-foreground">
              Let us know which integration you need and we'll work on adding it
            </p>
          </div>
          <Button variant="outline" className="ml-4">
            <MessageSquare className="mr-2 h-4 w-4" />
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}