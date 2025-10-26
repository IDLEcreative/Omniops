/**
 * Live widget preview component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Eye } from 'lucide-react';
import { WidgetConfig } from '@/lib/configure/wizard-utils';

interface WidgetPreviewProps {
  config: WidgetConfig;
  showPreview: boolean;
  onTogglePreview: (show: boolean) => void;
}

export function WidgetPreview({ config, showPreview, onTogglePreview }: WidgetPreviewProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Preview</CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onTogglePreview(!showPreview)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Hide' : 'Show'}
          </Button>
        </div>
      </CardHeader>
      {showPreview && (
        <CardContent>
          <div className="relative bg-muted rounded-lg h-[400px] overflow-hidden">
            {/* Simulated website background */}
            <div className="p-8 opacity-50">
              <div className="h-20 bg-background/50 rounded mb-4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-background/30 rounded w-3/4"></div>
                <div className="h-4 bg-background/30 rounded w-full"></div>
                <div className="h-4 bg-background/30 rounded w-2/3"></div>
              </div>
            </div>

            {/* Chat widget preview */}
            <div
              className={`absolute ${
                config.appearance.position.includes('bottom') ? 'bottom-4' : 'top-4'
              } ${
                config.appearance.position.includes('right') ? 'right-4' : 'left-4'
              }`}
            >
              <div
                className="bg-background border rounded-lg shadow-lg overflow-hidden"
                style={{ width: '320px' }}
              >
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: config.appearance.primaryColor }}
                >
                  <h3 className="font-semibold">{config.appearance.headerTitle}</h3>
                  <p className="text-sm opacity-90">{config.appearance.headerSubtitle}</p>
                </div>
                <div className="p-4">
                  <div className="bg-muted rounded-lg p-3 mb-4">
                    <p className="text-sm">{config.appearance.welcomeMessage}</p>
                  </div>
                  <Input placeholder="Type your message..." disabled />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
