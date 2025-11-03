import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Palette, MessageSquare, Settings2, Upload } from "lucide-react";
import { PositionPicker } from "../components/PositionPicker";

interface EssentialsSettings {
  primaryColor: string;
  logoUrl: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  botName: string;
  welcomeMessage: string;
  placeholderText: string;
  showAvatar: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
  soundNotifications: boolean;
  // Advanced color customization (config-driven widget)
  advancedColors?: {
    widgetBackgroundColor?: string;
    widgetBorderColor?: string;
    headerBackgroundColor?: string;
    headerBorderColor?: string;
    headerTextColor?: string;
    messageAreaBackgroundColor?: string;
    userMessageBackgroundColor?: string;
    userMessageTextColor?: string;
    botMessageTextColor?: string;
    inputAreaBackgroundColor?: string;
    inputAreaBorderColor?: string;
    inputBackgroundColor?: string;
    inputBorderColor?: string;
    inputFocusBorderColor?: string;
    inputTextColor?: string;
    inputPlaceholderColor?: string;
    buttonGradientStart?: string;
    buttonGradientEnd?: string;
    buttonTextColor?: string;
  };
}

interface EssentialsSectionProps {
  settings: EssentialsSettings;
  onChange: (updates: Partial<EssentialsSettings>) => void;
}

const colorPresets = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Green", color: "#10b981" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f59e0b" },
  { name: "Pink", color: "#ec4899" },
];

export function EssentialsSection({ settings, onChange }: EssentialsSectionProps) {
  return (
    <div className="space-y-6">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Appearance
          </CardTitle>
          <CardDescription>
            Colors, logo, and position
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            {/* Primary Color */}
            <div className="space-y-3">
              <Label>Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => onChange({ primaryColor: e.target.value })}
                  className="w-16 h-10 p-1 border-2 cursor-pointer"
                />
                <Input
                  value={settings.primaryColor}
                  onChange={(e) => onChange({ primaryColor: e.target.value })}
                  placeholder="#3b82f6"
                  className="font-mono"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {colorPresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => onChange({ primaryColor: preset.color })}
                    className="w-10 h-10 rounded-md border-2 hover:scale-110 transition-transform shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
                    aria-label={`Select ${preset.name} color`}
                  />
                ))}
              </div>
            </div>

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo (Optional)</Label>
              <div className="flex items-center space-x-3">
                <Input
                  type="url"
                  value={settings.logoUrl}
                  onChange={(e) => onChange({ logoUrl: e.target.value })}
                  placeholder="https://example.com/logo.png"
                  className="flex-1"
                />
                <button className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2">
                  <Upload className="h-4 w-4" />
                  <span>Upload</span>
                </button>
              </div>
              {settings.logoUrl && (
                <div className="mt-2 p-2 border rounded-lg bg-gray-50">
                  <img
                    src={settings.logoUrl}
                    alt="Logo preview"
                    className="h-12 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {/* Position Picker */}
            <PositionPicker
              value={settings.position}
              onChange={(position) => onChange({ position })}
            />
        </CardContent>
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Messages
          </CardTitle>
          <CardDescription>
            Customize the chat messages
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="botName">Bot Name</Label>
              <Input
                id="botName"
                value={settings.botName}
                onChange={(e) => onChange({ botName: e.target.value })}
                placeholder="Assistant"
                maxLength={30}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="welcomeMessage">Welcome Message</Label>
              <Textarea
                id="welcomeMessage"
                value={settings.welcomeMessage}
                onChange={(e) => onChange({ welcomeMessage: e.target.value })}
                placeholder="Hi! How can I help you today?"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">
                {settings.welcomeMessage.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="placeholderText">Input Placeholder</Label>
              <Input
                id="placeholderText"
                value={settings.placeholderText}
                onChange={(e) => onChange({ placeholderText: e.target.value })}
                placeholder="Type your message..."
                maxLength={50}
              />
            </div>
        </CardContent>
      </Card>

      {/* Behavior */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings2 className="h-5 w-5 mr-2" />
            Behavior
          </CardTitle>
          <CardDescription>
            How the widget behaves
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Show Avatar</Label>
                <p className="text-sm text-muted-foreground">
                  Display bot icon in messages
                </p>
              </div>
              <Switch
                checked={settings.showAvatar}
                onCheckedChange={(checked) => onChange({ showAvatar: checked })}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Auto-Open Widget</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically open after page load
                  </p>
                </div>
                <Switch
                  checked={settings.autoOpen}
                  onCheckedChange={(checked) => onChange({ autoOpen: checked })}
                />
              </div>

              {settings.autoOpen && (
                <div className="space-y-2 pl-4 border-l-2 border-gray-200">
                  <Label htmlFor="autoOpenDelay">Delay (milliseconds)</Label>
                  <Input
                    id="autoOpenDelay"
                    type="number"
                    value={settings.autoOpenDelay}
                    onChange={(e) => onChange({ autoOpenDelay: parseInt(e.target.value) || 3000 })}
                    min={0}
                    max={60000}
                    step={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opens after {(settings.autoOpenDelay / 1000).toFixed(1)} seconds
                  </p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Sound Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Play sound on new messages
                </p>
              </div>
              <Switch
                checked={settings.soundNotifications}
                onCheckedChange={(checked) => onChange({ soundNotifications: checked })}
              />
            </div>
        </CardContent>
      </Card>

      {/* Advanced Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Advanced Colors
            </span>
            <Badge variant="outline">Config-Driven</Badge>
          </CardTitle>
          <CardDescription>
            Fine-tune every color in your widget. Changes apply instantly without code deployment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Widget Container */}
          <div className="space-y-4 p-4 border rounded-lg bg-slate-50">
            <h4 className="font-medium text-sm">Widget Container</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Background Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.widgetBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, widgetBackgroundColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.widgetBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, widgetBackgroundColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Border Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.widgetBorderColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, widgetBorderColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.widgetBorderColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, widgetBorderColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
            <h4 className="font-medium text-sm">Header</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Background</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.headerBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, headerBackgroundColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.headerBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, headerBackgroundColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Border</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.headerBorderColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, headerBorderColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.headerBorderColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, headerBorderColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Text Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.headerTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, headerTextColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.headerTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, headerTextColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="space-y-4 p-4 border rounded-lg bg-purple-50">
            <h4 className="font-medium text-sm">Messages</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Message Area Background</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.messageAreaBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, messageAreaBackgroundColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.messageAreaBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, messageAreaBackgroundColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">User Bubble Background</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.userMessageBackgroundColor || '#3f3f46'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, userMessageBackgroundColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.userMessageBackgroundColor || '#3f3f46'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, userMessageBackgroundColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">User Text Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.userMessageTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, userMessageTextColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.userMessageTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, userMessageTextColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Bot Text Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.botMessageTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, botMessageTextColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.botMessageTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, botMessageTextColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="space-y-4 p-4 border rounded-lg bg-green-50">
            <h4 className="font-medium text-sm">Input Area</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Area Background</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.inputAreaBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputAreaBackgroundColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.inputAreaBackgroundColor || '#111111'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputAreaBackgroundColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Area Border</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.inputAreaBorderColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputAreaBorderColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.inputAreaBorderColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputAreaBorderColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Input Background</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.inputBackgroundColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputBackgroundColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.inputBackgroundColor || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputBackgroundColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Input Border</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.inputBorderColor || '#3a3a3a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputBorderColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.inputBorderColor || '#3a3a3a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputBorderColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Input Focus Border</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.inputFocusBorderColor || '#4a4a4a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputFocusBorderColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.inputFocusBorderColor || '#4a4a4a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputFocusBorderColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Input Text</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.inputTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputTextColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.inputTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, inputTextColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Floating Button */}
          <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
            <h4 className="font-medium text-sm">Floating Button</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Gradient Start</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.buttonGradientStart || '#3a3a3a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, buttonGradientStart: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.buttonGradientStart || '#3a3a3a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, buttonGradientStart: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Gradient End</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.buttonGradientEnd || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, buttonGradientEnd: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.buttonGradientEnd || '#2a2a2a'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, buttonGradientEnd: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="text-xs">Icon Color</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    type="color"
                    value={settings.advancedColors?.buttonTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, buttonTextColor: e.target.value }
                    })}
                    className="w-12 h-8 p-1 border cursor-pointer"
                  />
                  <Input
                    value={settings.advancedColors?.buttonTextColor || '#ffffff'}
                    onChange={(e) => onChange({
                      advancedColors: { ...settings.advancedColors, buttonTextColor: e.target.value }
                    })}
                    className="font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>💡 Pro Tip:</strong> All color changes apply instantly without code deployment.
              Your widget will automatically pick up these changes on next page load.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
