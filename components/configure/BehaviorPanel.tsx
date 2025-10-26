/**
 * Behavior configuration panel
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { WidgetConfig } from '@/lib/configure/wizard-utils';

interface BehaviorPanelProps {
  config: WidgetConfig;
  onConfigChange: (config: WidgetConfig) => void;
}

export function BehaviorPanel({ config, onConfigChange }: BehaviorPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Widget Behavior</CardTitle>
        <CardDescription>
          Control how the widget behaves on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Auto-open Widget</Label>
            <p className="text-sm text-muted-foreground">
              Automatically open the chat after a delay
            </p>
          </div>
          <Switch
            checked={config.behavior.autoOpen}
            onCheckedChange={(checked) =>
              onConfigChange({
                ...config,
                behavior: { ...config.behavior, autoOpen: checked },
              })
            }
          />
        </div>

        {config.behavior.autoOpen && (
          <div>
            <Label>Auto-open Delay (seconds)</Label>
            <Input
              type="number"
              value={config.behavior.autoOpenDelay / 1000}
              onChange={(e) =>
                onConfigChange({
                  ...config,
                  behavior: {
                    ...config.behavior,
                    autoOpenDelay: parseInt(e.target.value) * 1000,
                  },
                })
              }
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Persist Conversations</Label>
            <p className="text-sm text-muted-foreground">
              Remember chat history between sessions
            </p>
          </div>
          <Switch
            checked={config.behavior.persistConversation}
            onCheckedChange={(checked) =>
              onConfigChange({
                ...config,
                behavior: { ...config.behavior, persistConversation: checked },
              })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
