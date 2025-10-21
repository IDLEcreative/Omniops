import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings2, Building2 } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AdvancedSettings {
  cacheEnabled: boolean;
  cacheTTL: number;
  debugMode: boolean;
  [key: string]: any;
}

interface BrandingSettings {
  showPoweredBy: boolean;
  customBrandingText: string;
  customLogoUrl: string;
  [key: string]: any;
}

interface AdvancedSectionProps {
  settings: AdvancedSettings;
  brandingSettings: BrandingSettings;
  onAdvancedChange: (updates: Partial<AdvancedSettings>) => void;
  onBrandingChange: (updates: Partial<BrandingSettings>) => void;
}

export function AdvancedSection({
  settings,
  brandingSettings,
  onAdvancedChange,
  onBrandingChange
}: AdvancedSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="h-5 w-5 mr-2" />
            Advanced Settings
          </CardTitle>
          <CardDescription>
            Performance and debugging options
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Cache</Label>
              <p className="text-sm text-muted-foreground">
                Cache responses for better performance
              </p>
            </div>
            <Switch
              checked={settings.cacheEnabled}
              onCheckedChange={(checked) => onAdvancedChange({ cacheEnabled: checked })}
            />
          </div>

          {settings.cacheEnabled && (
            <div className="space-y-2">
              <Label>Cache TTL (seconds)</Label>
              <Input
                type="number"
                value={settings.cacheTTL}
                onChange={(e) => onAdvancedChange({ cacheTTL: parseInt(e.target.value) || 3600 })}
                min={0}
                max={86400}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Debug Mode</Label>
              <p className="text-sm text-muted-foreground">
                Enable console logging and diagnostics
              </p>
            </div>
            <Switch
              checked={settings.debugMode}
              onCheckedChange={(checked) => onAdvancedChange({ debugMode: checked })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2" />
            Branding Settings
          </CardTitle>
          <CardDescription>
            Customize branding and attribution
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Show "Powered by" Badge</Label>
              <p className="text-sm text-muted-foreground">
                Display attribution in the widget
              </p>
            </div>
            <Switch
              checked={brandingSettings.showPoweredBy}
              onCheckedChange={(checked) => onBrandingChange({ showPoweredBy: checked })}
            />
          </div>

          <div className="space-y-2">
            <Label>Custom Branding Text</Label>
            <Input
              value={brandingSettings.customBrandingText}
              onChange={(e) => onBrandingChange({ customBrandingText: e.target.value })}
              placeholder="Powered by YourCompany"
            />
          </div>

          <div className="space-y-2">
            <Label>Custom Logo URL</Label>
            <Input
              type="url"
              value={brandingSettings.customLogoUrl}
              onChange={(e) => onBrandingChange({ customLogoUrl: e.target.value })}
              placeholder="https://example.com/logo.png"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}