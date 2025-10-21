import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { BarChart } from "lucide-react";

interface AnalyticsSettings {
  trackConversations: boolean;
  trackUserBehavior: boolean;
  trackPerformance: boolean;
  dataRetentionDays: number;
  anonymizeData: boolean;
  shareAnalyticsWithCustomer: boolean;
  [key: string]: any;
}

interface AnalyticsSectionProps {
  settings: AnalyticsSettings;
  onChange: (updates: Partial<AnalyticsSettings>) => void;
}

export function AnalyticsSection({ settings, onChange }: AnalyticsSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart className="h-5 w-5 mr-2" />
          Analytics & Monitoring
        </CardTitle>
        <CardDescription>
          Configure tracking and analytics settings
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Track Conversations</Label>
            <p className="text-sm text-muted-foreground">
              Log and analyze chat interactions
            </p>
          </div>
          <Switch
            checked={settings.trackConversations}
            onCheckedChange={(checked) => onChange({ trackConversations: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Track User Behavior</Label>
            <p className="text-sm text-muted-foreground">
              Monitor user engagement patterns
            </p>
          </div>
          <Switch
            checked={settings.trackUserBehavior}
            onCheckedChange={(checked) => onChange({ trackUserBehavior: checked })}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Performance Monitoring</Label>
            <p className="text-sm text-muted-foreground">
              Track response times and errors
            </p>
          </div>
          <Switch
            checked={settings.trackPerformance}
            onCheckedChange={(checked) => onChange({ trackPerformance: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>Data Retention (days)</Label>
          <Input
            type="number"
            value={settings.dataRetentionDays}
            onChange={(e) => onChange({ dataRetentionDays: parseInt(e.target.value) || 30 })}
            min={1}
            max={365}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Anonymize Data</Label>
            <p className="text-sm text-muted-foreground">
              Remove personally identifiable information
            </p>
          </div>
          <Switch
            checked={settings.anonymizeData}
            onCheckedChange={(checked) => onChange({ anonymizeData: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}