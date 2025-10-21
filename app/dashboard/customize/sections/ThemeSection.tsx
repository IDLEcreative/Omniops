import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Palette } from "lucide-react";

interface ThemeSettings {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontSize: string;
  fontFamily: string;
  darkMode: boolean;
  customCSS: string;
}

interface ThemeSectionProps {
  settings: ThemeSettings;
  onChange: (updates: Partial<ThemeSettings>) => void;
}

const colorPresets = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Green", color: "#10b981" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f59e0b" },
  { name: "Pink", color: "#ec4899" },
  { name: "Indigo", color: "#6366f1" },
  { name: "Teal", color: "#14b8a6" },
];

export function ThemeSection({ settings, onChange }: ThemeSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Palette className="h-5 w-5 mr-2" />
          Color Theme
        </CardTitle>
        <CardDescription>
          Customize the colors and appearance of your chat widget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Primary Color</Label>
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              value={settings.primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              className="w-16 h-10 p-1 border-2"
            />
            <Input
              value={settings.primaryColor}
              onChange={(e) => onChange({ primaryColor: e.target.value })}
              placeholder="#3b82f6"
              className="font-mono"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {colorPresets.map((preset) => (
              <button
                key={preset.name}
                onClick={() => onChange({ primaryColor: preset.color })}
                className="w-8 h-8 rounded-md border-2 hover:scale-110 transition-transform"
                style={{ backgroundColor: preset.color }}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Background Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={settings.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={settings.backgroundColor}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex items-center space-x-2">
              <Input
                type="color"
                value={settings.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="w-12 h-8 p-1"
              />
              <Input
                value={settings.textColor}
                onChange={(e) => onChange({ textColor: e.target.value })}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Border Radius (px)</Label>
            <Input
              type="number"
              value={settings.borderRadius}
              onChange={(e) => onChange({ borderRadius: e.target.value })}
              placeholder="8"
            />
          </div>

          <div className="space-y-2">
            <Label>Font Size (px)</Label>
            <Input
              type="number"
              value={settings.fontSize}
              onChange={(e) => onChange({ fontSize: e.target.value })}
              placeholder="14"
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Dark Mode</Label>
            <p className="text-sm text-muted-foreground">
              Enable dark theme variant
            </p>
          </div>
          <Switch
            checked={settings.darkMode}
            onCheckedChange={(checked) => onChange({ darkMode: checked })}
          />
        </div>
      </CardContent>
    </Card>
  );
}