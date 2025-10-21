import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Search, BookOpen, Webhook, Shield, Plus, X, MoveUp, MoveDown, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useState } from "react";

interface IntegrationSettings {
  enableWooCommerce: boolean;
  enableWebSearch: boolean;
  enableKnowledgeBase: boolean;
  apiRateLimit: number;
  webhookUrl: string;
  customHeaders: Record<string, string>;
  allowedDomains: string[];
  dataSourcePriority: string[];
}

interface IntegrationSectionProps {
  settings: IntegrationSettings;
  onChange: (updates: Partial<IntegrationSettings>) => void;
}

export function IntegrationSection({ settings, onChange }: IntegrationSectionProps) {
  const [newHeaderKey, setNewHeaderKey] = useState("");
  const [newHeaderValue, setNewHeaderValue] = useState("");
  const [newDomain, setNewDomain] = useState("");

  const addCustomHeader = () => {
    if (newHeaderKey && newHeaderValue) {
      onChange({
        customHeaders: {
          ...settings.customHeaders,
          [newHeaderKey]: newHeaderValue,
        },
      });
      setNewHeaderKey("");
      setNewHeaderValue("");
    }
  };

  const removeCustomHeader = (key: string) => {
    const updated = { ...settings.customHeaders };
    delete updated[key];
    onChange({ customHeaders: updated });
  };

  const addAllowedDomain = () => {
    if (newDomain && !settings.allowedDomains.includes(newDomain)) {
      onChange({
        allowedDomains: [...settings.allowedDomains, newDomain],
      });
      setNewDomain("");
    }
  };

  const removeAllowedDomain = (domain: string) => {
    onChange({
      allowedDomains: settings.allowedDomains.filter(d => d !== domain),
    });
  };

  const moveDataSourcePriority = (source: string, direction: 'up' | 'down') => {
    const index = settings.dataSourcePriority.indexOf(source);
    if (index === -1) return;

    const newPriority = [...settings.dataSourcePriority];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex < 0 || newIndex >= newPriority.length) return;

    [newPriority[index], newPriority[newIndex]] = [newPriority[newIndex], newPriority[index]];
    onChange({ dataSourcePriority: newPriority });
  };

  const dataSourceIcons = {
    knowledge_base: BookOpen,
    web_search: Search,
    woocommerce: ShoppingCart,
  };

  const dataSourceLabels = {
    knowledge_base: "Knowledge Base",
    web_search: "Web Search",
    woocommerce: "WooCommerce",
  };

  return (
    <div className="space-y-6">
      {/* Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle>Data Sources</CardTitle>
          <CardDescription>
            Configure which data sources the AI can access
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Knowledge Base */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Knowledge Base</Label>
                <p className="text-sm text-muted-foreground">
                  Use scraped website content and embeddings
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableKnowledgeBase}
              onCheckedChange={(checked) => onChange({ enableKnowledgeBase: checked })}
            />
          </div>

          {/* Web Search */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Search className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>Web Search</Label>
                <p className="text-sm text-muted-foreground">
                  Search the web for real-time information
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableWebSearch}
              onCheckedChange={(checked) => onChange({ enableWebSearch: checked })}
            />
          </div>

          {/* WooCommerce */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingCart className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label>WooCommerce Integration</Label>
                <p className="text-sm text-muted-foreground">
                  Access product catalog and order information
                </p>
              </div>
            </div>
            <Switch
              checked={settings.enableWooCommerce}
              onCheckedChange={(checked) => onChange({ enableWooCommerce: checked })}
            />
          </div>

          <Separator />

          {/* Data Source Priority */}
          <div className="space-y-3">
            <Label>Data Source Priority</Label>
            <p className="text-sm text-muted-foreground">
              AI will check sources in this order
            </p>
            <div className="space-y-2">
              {settings.dataSourcePriority.map((source, index) => {
                const Icon = dataSourceIcons[source as keyof typeof dataSourceIcons];
                const isEnabled =
                  (source === 'knowledge_base' && settings.enableKnowledgeBase) ||
                  (source === 'web_search' && settings.enableWebSearch) ||
                  (source === 'woocommerce' && settings.enableWooCommerce);

                return (
                  <div
                    key={source}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      isEnabled ? 'bg-background' : 'bg-muted/50 opacity-60'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-sm font-mono text-muted-foreground">
                        {index + 1}.
                      </span>
                      <Icon className="h-4 w-4" />
                      <span className="text-sm font-medium">
                        {dataSourceLabels[source as keyof typeof dataSourceLabels]}
                      </span>
                      {!isEnabled && (
                        <Badge variant="secondary" className="text-xs">Disabled</Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => moveDataSourcePriority(source, 'up')}
                        disabled={index === 0}
                      >
                        <MoveUp className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => moveDataSourcePriority(source, 'down')}
                        disabled={index === settings.dataSourcePriority.length - 1}
                      >
                        <MoveDown className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Webhook Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Webhook className="h-5 w-5 mr-2" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Send chat events to your server
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="webhook">Webhook URL</Label>
            <Input
              id="webhook"
              type="url"
              value={settings.webhookUrl}
              onChange={(e) => onChange({ webhookUrl: e.target.value })}
              placeholder="https://your-server.com/webhook"
            />
          </div>

          {/* Custom Headers */}
          <div className="space-y-3">
            <Label>Custom Headers</Label>
            <div className="space-y-2">
              {Object.entries(settings.customHeaders).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <Input value={key} disabled className="flex-1 font-mono text-sm" />
                  <Input value={value} disabled className="flex-1 font-mono text-sm" />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeCustomHeader(key)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Header name"
                  value={newHeaderKey}
                  onChange={(e) => setNewHeaderKey(e.target.value)}
                  className="flex-1"
                />
                <Input
                  placeholder="Header value"
                  value={newHeaderValue}
                  onChange={(e) => setNewHeaderValue(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={addCustomHeader}
                  disabled={!newHeaderKey || !newHeaderValue}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            Security & Rate Limiting
          </CardTitle>
          <CardDescription>
            Control access and prevent abuse
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* API Rate Limit */}
          <div className="space-y-2">
            <Label htmlFor="rateLimit">API Rate Limit</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="rateLimit"
                type="number"
                value={settings.apiRateLimit}
                onChange={(e) => onChange({ apiRateLimit: parseInt(e.target.value) || 60 })}
                className="w-24"
                min={1}
                max={1000}
              />
              <span className="text-sm text-muted-foreground">requests per minute</span>
            </div>
          </div>

          {/* Allowed Domains */}
          <div className="space-y-3">
            <Label>Allowed Domains</Label>
            <p className="text-sm text-muted-foreground">
              Restrict widget to specific domains (leave empty to allow all)
            </p>
            <div className="space-y-2">
              {settings.allowedDomains.map((domain) => (
                <div key={domain} className="flex items-center space-x-2">
                  <Input value={domain} disabled className="flex-1 font-mono text-sm" />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeAllowedDomain(domain)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={addAllowedDomain}
                  disabled={!newDomain}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {settings.allowedDomains.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No domain restrictions applied. The widget can be embedded on any website.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}