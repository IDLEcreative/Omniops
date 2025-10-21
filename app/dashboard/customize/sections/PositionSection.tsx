import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Monitor } from "lucide-react";

interface PositionSettings {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
  mobileBreakpoint: number;
}

interface PositionSectionProps {
  settings: PositionSettings;
  onChange: (updates: Partial<PositionSettings>) => void;
}

export function PositionSection({ settings, onChange }: PositionSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Monitor className="h-5 w-5 mr-2" />
          Widget Position
        </CardTitle>
        <CardDescription>
          Configure where the chat widget appears on your website
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Position</Label>
          <Select
            value={settings.position}
            onValueChange={(value: any) => onChange({ position: value })}
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Horizontal Offset (px)</Label>
            <Input
              type="number"
              value={settings.offsetX}
              onChange={(e) => onChange({ offsetX: parseInt(e.target.value) || 0 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Vertical Offset (px)</Label>
            <Input
              type="number"
              value={settings.offsetY}
              onChange={(e) => onChange({ offsetY: parseInt(e.target.value) || 0 })}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Width (px)</Label>
            <Input
              type="number"
              value={settings.width}
              onChange={(e) => onChange({ width: parseInt(e.target.value) || 380 })}
            />
          </div>

          <div className="space-y-2">
            <Label>Height (px)</Label>
            <Input
              type="number"
              value={settings.height}
              onChange={(e) => onChange({ height: parseInt(e.target.value) || 600 })}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}