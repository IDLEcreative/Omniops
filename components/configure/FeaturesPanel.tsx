/**
 * Features configuration panel
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WidgetConfig } from '@/lib/configure/wizard-utils';

interface FeaturesPanelProps {
  config: WidgetConfig;
  onConfigChange: (config: WidgetConfig) => void;
}

export function FeaturesPanel({ config, onConfigChange }: FeaturesPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Sources</CardTitle>
        <CardDescription>
          Configure what information the chat bot can access
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Website Scraping</Label>
            <p className="text-sm text-muted-foreground">
              Automatically learn from your website content
            </p>
          </div>
          <Switch
            checked={config.features.websiteScraping.enabled}
            onCheckedChange={(checked) =>
              onConfigChange({
                ...config,
                features: {
                  ...config.features,
                  websiteScraping: {
                    ...config.features.websiteScraping,
                    enabled: checked,
                  },
                },
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>WooCommerce Integration</Label>
            <p className="text-sm text-muted-foreground">
              Enable product search and order lookup
            </p>
          </div>
          <Switch
            checked={config.features.woocommerce.enabled}
            onCheckedChange={(checked) =>
              onConfigChange({
                ...config,
                features: {
                  ...config.features,
                  woocommerce: {
                    ...config.features.woocommerce,
                    enabled: checked,
                  },
                },
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
