import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Palette, MessageSquare, Settings2, Upload } from "lucide-react";
import { PositionPicker } from "../components/PositionPicker";
import { useState } from "react";

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
  const [appearanceExpanded, setAppearanceExpanded] = useState(true);
  const [messagesExpanded, setMessagesExpanded] = useState(true);
  const [behaviorExpanded, setBehaviorExpanded] = useState(true);

  return (
    <div className="space-y-4">
      {/* Appearance */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setAppearanceExpanded(!appearanceExpanded)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Appearance
            </div>
            <span className="text-sm text-muted-foreground">
              {appearanceExpanded ? '▼' : '▶'}
            </span>
          </CardTitle>
          <CardDescription>
            Colors, logo, and position
          </CardDescription>
        </CardHeader>
        {appearanceExpanded && (
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
                    className="w-10 h-10 rounded-md border-2 hover:scale-110 transition-transform shadow-sm"
                    style={{ backgroundColor: preset.color }}
                    title={preset.name}
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
        )}
      </Card>

      {/* Messages */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setMessagesExpanded(!messagesExpanded)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <MessageSquare className="h-5 w-5 mr-2" />
              Messages
            </div>
            <span className="text-sm text-muted-foreground">
              {messagesExpanded ? '▼' : '▶'}
            </span>
          </CardTitle>
          <CardDescription>
            Customize the chat messages
          </CardDescription>
        </CardHeader>
        {messagesExpanded && (
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
        )}
      </Card>

      {/* Behavior */}
      <Card>
        <CardHeader
          className="cursor-pointer hover:bg-gray-50/50 transition-colors"
          onClick={() => setBehaviorExpanded(!behaviorExpanded)}
        >
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Settings2 className="h-5 w-5 mr-2" />
              Behavior
            </div>
            <span className="text-sm text-muted-foreground">
              {behaviorExpanded ? '▼' : '▶'}
            </span>
          </CardTitle>
          <CardDescription>
            How the widget behaves
          </CardDescription>
        </CardHeader>
        {behaviorExpanded && (
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
        )}
      </Card>
    </div>
  );
}
