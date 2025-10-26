"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, Link, ShoppingCart, Webhook } from "lucide-react";
import { SettingsState } from "@/lib/dashboard/settings-utils";

interface APIKeysSectionProps {
  settings: SettingsState;
  onSettingChange: (key: string, value: any) => void;
}

export function APIKeysSection({ settings, onSettingChange }: APIKeysSectionProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="h-5 w-5 mr-2" />
            API Keys
          </CardTitle>
          <CardDescription>
            Configure external service integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="openaiKey">OpenAI API Key</Label>
            <div className="flex space-x-2">
              <Input
                id="openaiKey"
                type="password"
                value={settings.openaiApiKey}
                onChange={(e) => onSettingChange('openaiApiKey', e.target.value)}
                placeholder="sk-..."
              />
              <Button variant="outline" size="icon">
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="supabaseUrl">Supabase URL</Label>
            <Input
              id="supabaseUrl"
              value={settings.supabaseUrl}
              onChange={(e) => onSettingChange('supabaseUrl', e.target.value)}
              placeholder="https://your-project.supabase.co"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="redisUrl">Redis URL</Label>
            <Input
              id="redisUrl"
              value={settings.redisUrl}
              onChange={(e) => onSettingChange('redisUrl', e.target.value)}
              placeholder="redis://localhost:6379"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            E-commerce Integrations
          </CardTitle>
          <CardDescription>
            Manage WooCommerce and Shopify integrations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">Configure Integrations</h3>
            <p className="text-sm text-muted-foreground mb-4">
              WooCommerce and Shopify integrations are now managed in the dedicated Integrations section
            </p>
            <Button onClick={() => window.location.href = '/dashboard/integrations'}>
              Go to Integrations
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="h-5 w-5 mr-2" />
            Webhooks
          </CardTitle>
          <CardDescription>
            Configure webhook endpoints for external notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No Webhooks Configured</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add webhook endpoints to receive real-time notifications
            </p>
            <Button variant="outline">
              <Webhook className="h-4 w-4 mr-2" />
              Add Webhook
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
