import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Database, Shield, Settings, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ConnectSettings {
  enableWooCommerce: boolean;
  enableShopify: boolean;
  enableKnowledgeBase: boolean;
  enableProductCatalog: boolean;
  trackConversations: boolean;
  dataRetentionDays: number;
}

interface ConnectSectionProps {
  settings: ConnectSettings;
  onChange: (updates: Partial<ConnectSettings>) => void;
}

export function ConnectSection({ settings, onChange }: ConnectSectionProps) {
  return (
    <div className="space-y-4">
      {/* E-commerce Integrations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            E-commerce
          </CardTitle>
          <CardDescription>
            Connect your online store
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* WooCommerce */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center">
                  <span className="mr-2">WooCommerce</span>
                  <Badge variant="outline" className="ml-2">Popular</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Answer product questions and track orders
                </p>
              </div>
              <Switch
                checked={settings.enableWooCommerce}
                onCheckedChange={(checked) => onChange({ enableWooCommerce: checked })}
              />
            </div>

            {settings.enableWooCommerce && (
              <div className="pl-4 border-l-2 border-primary/20">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/dashboard/integrations'}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure WooCommerce
                  <ExternalLink className="h-3 w-3 ml-2" />
                </Button>
                <p className="text-xs text-muted-foreground mt-2">
                  Configure your store URL and API credentials
                </p>
              </div>
            )}
          </div>

          {/* Shopify */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center">
                  <span className="mr-2">Shopify</span>
                  <Badge variant="secondary" className="ml-2">Coming Soon</Badge>
                </Label>
                <p className="text-sm text-muted-foreground">
                  Full Shopify store integration
                </p>
              </div>
              <Switch
                checked={settings.enableShopify}
                onCheckedChange={(checked) => onChange({ enableShopify: checked })}
                disabled
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Database className="h-5 w-5 mr-2" />
            Data Sources
          </CardTitle>
          <CardDescription>
            Choose where the bot gets information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            {/* Knowledge Base */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="space-y-0.5">
                <Label className="text-blue-900">📚 Knowledge Base</Label>
                <p className="text-sm text-blue-700">
                  Your website content (always enabled)
                </p>
              </div>
              <Badge variant="default" className="bg-blue-600">
                Active
              </Badge>
            </div>

            {/* Product Catalog */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>🛍️ Product Catalog</Label>
                <p className="text-sm text-muted-foreground">
                  Product information and inventory
                </p>
              </div>
              <Switch
                checked={settings.enableProductCatalog}
                onCheckedChange={(checked) => onChange({ enableProductCatalog: checked })}
              />
            </div>

            {/* Info Box */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-xs text-gray-600">
                💡 <strong>Tip:</strong> The bot searches all enabled sources automatically
                to find the best answer for each question.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Privacy & Data
          </CardTitle>
          <CardDescription>
            Control data collection and retention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Track Conversations</Label>
              <p className="text-sm text-muted-foreground">
                Store chat history for analytics
              </p>
            </div>
            <Switch
              checked={settings.trackConversations}
              onCheckedChange={(checked) => onChange({ trackConversations: checked })}
            />
          </div>

          {settings.trackConversations && (
            <div className="space-y-2 pl-4 border-l-2 border-gray-200">
              <Label>Data Retention Period</Label>
              <Select
                value={settings.dataRetentionDays.toString()}
                onValueChange={(value) => onChange({ dataRetentionDays: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="60">60 days</SelectItem>
                  <SelectItem value="90">90 days (recommended)</SelectItem>
                  <SelectItem value="180">6 months</SelectItem>
                  <SelectItem value="365">1 year</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Data will be automatically deleted after this period
              </p>
            </div>
          )}

          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="text-xs text-green-800">
                <p className="font-medium mb-1">Privacy Compliant</p>
                <p>
                  All data is encrypted and GDPR/CCPA compliant. Users can request
                  data deletion at any time.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Card */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader>
          <CardTitle className="text-purple-900">Active Integrations</CardTitle>
          <CardDescription className="text-purple-700">
            Summary of your current setup
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-900">E-commerce:</span>
              <Badge variant={settings.enableWooCommerce || settings.enableShopify ? "default" : "secondary"}>
                {settings.enableWooCommerce || settings.enableShopify ? "Connected" : "Not Connected"}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-900">Data Sources:</span>
              <Badge variant="default">
                {1 + (settings.enableProductCatalog ? 1 : 0)} active
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-900">Analytics:</span>
              <Badge variant={settings.trackConversations ? "default" : "secondary"}>
                {settings.trackConversations ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
