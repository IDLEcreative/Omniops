"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export interface Integration {
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

interface IntegrationCardProps {
  integration: Integration;
  onIntegrationClick: (integration: Integration) => void;
}

export function IntegrationCard({ integration, onIntegrationClick }: IntegrationCardProps) {
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

  return (
    <Card
      className={`group hover:shadow-lg transition-all ${
        integration.status === 'coming_soon' ? 'opacity-75' : 'cursor-pointer'
      }`}
      onClick={() => {
        if (integration.status !== 'coming_soon') {
          onIntegrationClick(integration);
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
                onIntegrationClick(integration);
              }}
            >
              Configure
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
