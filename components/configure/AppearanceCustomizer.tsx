/**
 * Appearance customization panel
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Palette, CheckCircle, AlertCircle, Code } from 'lucide-react';
import { getContrastRatio, WidgetConfig } from '@/lib/configure/wizard-utils';

interface AppearanceCustomizerProps {
  config: WidgetConfig;
  onConfigChange: (config: WidgetConfig) => void;
  customCSS: string;
  onCustomCSSChange: (css: string) => void;
  showAdvancedCSS: boolean;
  onToggleAdvancedCSS: (show: boolean) => void;
}

export function AppearanceCustomizer({
  config,
  onConfigChange,
  customCSS,
  onCustomCSSChange,
  showAdvancedCSS,
  onToggleAdvancedCSS,
}: AppearanceCustomizerProps) {
  const contrastRatio = getContrastRatio(config.appearance.primaryColor, config.appearance.backgroundColor);
  const meetsWCAG_AA = contrastRatio >= 4.5;
  const meetsWCAG_AAA = contrastRatio >= 7;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Colors & Position</CardTitle>
        <CardDescription>Fine-tune your widget appearance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="position">Position</Label>
          <Select
            value={config.appearance.position}
            onValueChange={(value) =>
              onConfigChange({
                ...config,
                appearance: { ...config.appearance, position: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
              <SelectItem value="top-right">Top Right</SelectItem>
              <SelectItem value="top-left">Top Left</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="primaryColor">Brand Color</Label>
          <div className="flex gap-2 items-start">
            <div className="flex gap-2 flex-1">
              <Input
                id="primaryColor"
                type="color"
                value={config.appearance.primaryColor}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    appearance: { ...config.appearance, primaryColor: e.target.value },
                  })
                }
                className="w-20 h-10"
              />
              <Input
                value={config.appearance.primaryColor}
                onChange={(e) =>
                  onConfigChange({
                    ...config,
                    appearance: { ...config.appearance, primaryColor: e.target.value },
                  })
                }
                className="h-10"
              />
            </div>
            <Palette className="h-5 w-5 text-muted-foreground mt-2.5" />
          </div>

          {/* WCAG Contrast Warning */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2 text-sm">
              {meetsWCAG_AA ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              )}
              <span className={meetsWCAG_AA ? 'text-green-600' : 'text-yellow-600'}>
                Contrast: {contrastRatio.toFixed(1)}:1
              </span>
              {meetsWCAG_AAA && <Badge variant="secondary" className="text-xs">AAA</Badge>}
              {meetsWCAG_AA && !meetsWCAG_AAA && <Badge variant="secondary" className="text-xs">AA</Badge>}
            </div>
            {!meetsWCAG_AA && (
              <p className="text-xs text-muted-foreground">
                Consider a darker/lighter color for better accessibility (WCAG AA requires 4.5:1)
              </p>
            )}
          </div>
        </div>

        <div>
          <Label htmlFor="headerTitle">Header Title</Label>
          <Input
            id="headerTitle"
            value={config.appearance.headerTitle}
            onChange={(e) =>
              onConfigChange({
                ...config,
                appearance: { ...config.appearance, headerTitle: e.target.value },
              })
            }
          />
        </div>

        <div>
          <Label htmlFor="welcomeMessage">Welcome Message</Label>
          <Textarea
            id="welcomeMessage"
            value={config.appearance.welcomeMessage}
            onChange={(e) =>
              onConfigChange({
                ...config,
                appearance: { ...config.appearance, welcomeMessage: e.target.value },
              })
            }
            rows={3}
          />
        </div>

        {/* Advanced CSS Accordion */}
        <Collapsible open={showAdvancedCSS} onOpenChange={onToggleAdvancedCSS}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full">
              <Code className="mr-2 h-4 w-4" />
              Advanced CSS
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <Textarea
              placeholder=".chat-widget {
  /* Your custom styles */
}"
              value={customCSS}
              onChange={(e) => onCustomCSSChange(e.target.value)}
              className="font-mono text-sm"
              rows={6}
            />
            <p className="text-xs text-muted-foreground mt-2">
              For developers: Override default styles with custom CSS
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}
