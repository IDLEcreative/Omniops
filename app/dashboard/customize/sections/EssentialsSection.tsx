import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Palette, MessageSquare, Settings2, Upload, Loader2, X, Sparkles } from "lucide-react";
import { PositionPicker } from "../components/PositionPicker";
import { AnimationStyles } from "../components/AnimationStyles";
import { useState, useRef } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface EssentialsSettings {
  primaryColor: string;
  logoUrl: string;
  minimizedIconUrl: string;
  minimizedIconHoverUrl: string;
  minimizedIconActiveUrl: string;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  botName: string;
  welcomeMessage: string;
  placeholderText: string;
  showAvatar: boolean;
  autoOpen: boolean;
  autoOpenDelay: number;
  soundNotifications: boolean;
  animationType: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle';
  animationSpeed: 'slow' | 'normal' | 'fast';
  animationIntensity: 'subtle' | 'normal' | 'strong';
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
  customerConfigId?: string;
}

const colorPresets = [
  { name: "Blue", color: "#3b82f6" },
  { name: "Green", color: "#10b981" },
  { name: "Purple", color: "#8b5cf6" },
  { name: "Red", color: "#ef4444" },
  { name: "Orange", color: "#f59e0b" },
  { name: "Pink", color: "#ec4899" },
];

export function EssentialsSection({ settings, onChange, customerConfigId }: EssentialsSectionProps) {
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingHoverIcon, setIsUploadingHoverIcon] = useState(false);
  const [isUploadingActiveIcon, setIsUploadingActiveIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hoverFileInputRef = useRef<HTMLInputElement>(null);
  const activeFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleIconUpload = async (file: File, iconType: 'normal' | 'hover' | 'active' = 'normal') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    // Set appropriate loading state
    if (iconType === 'hover') {
      setIsUploadingHoverIcon(true);
    } else if (iconType === 'active') {
      setIsUploadingActiveIcon(true);
    } else {
      setIsUploadingIcon(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `minimized-icon-${iconType}`);

      if (!customerConfigId) {
        toast({
          title: "Configuration error",
          description: "Please select a website configuration first",
          variant: "destructive",
        });
        return;
      }

      formData.append('customerConfigId', customerConfigId);

      const response = await fetch('/api/widget-assets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        // Use WebP URL as primary (will fallback to PNG automatically in the component)
        const iconUrl = data.data.webpUrl || data.data.pngUrl || data.data.url;

        // Update the correct field based on icon type
        if (iconType === 'hover') {
          onChange({ minimizedIconHoverUrl: iconUrl });
        } else if (iconType === 'active') {
          onChange({ minimizedIconActiveUrl: iconUrl });
        } else {
          onChange({ minimizedIconUrl: iconUrl });
        }

        // Calculate compression percentage for user feedback
        const compressionPercent = data.data.originalSize && data.data.optimizedSize?.webp
          ? Math.round((1 - data.data.optimizedSize.webp / data.data.originalSize) * 100)
          : 0;

        const sizeInfo = compressionPercent > 0
          ? ` (${compressionPercent}% smaller)`
          : '';

        const iconLabel = iconType === 'hover' ? 'hover' : iconType === 'active' ? 'active' : 'minimized widget';

        toast({
          title: "Icon uploaded",
          description: `Your ${iconLabel} icon has been uploaded and optimized${sizeInfo}`,
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload icon. Please try again.",
        variant: "destructive",
      });
    } finally {
      // Clear appropriate loading state
      if (iconType === 'hover') {
        setIsUploadingHoverIcon(false);
        if (hoverFileInputRef.current) {
          hoverFileInputRef.current.value = '';
        }
      } else if (iconType === 'active') {
        setIsUploadingActiveIcon(false);
        if (activeFileInputRef.current) {
          activeFileInputRef.current.value = '';
        }
      } else {
        setIsUploadingIcon(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

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

            {/* Minimized Widget Icon Upload */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Minimized Widget Icon - Normal State (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Custom icon shown when widget is minimized. Defaults to message bubble if not set.
                </p>
                <div className="flex items-center space-x-3">
                  <Input
                    type="url"
                    value={settings.minimizedIconUrl}
                    onChange={(e) => onChange({ minimizedIconUrl: e.target.value })}
                    placeholder="https://example.com/icon.png or upload file"
                    className="flex-1"
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleIconUpload(file, 'normal');
                      }
                    }}
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingIcon}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingIcon ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Hover State Icon */}
              <div className="space-y-2 pl-4 border-l-2 border-blue-200">
                <Label>Hover State Icon (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Icon shown when user hovers over the widget button. Falls back to normal state if not set.
                </p>
                <div className="flex items-center space-x-3">
                  <Input
                    type="url"
                    value={settings.minimizedIconHoverUrl}
                    onChange={(e) => onChange({ minimizedIconHoverUrl: e.target.value })}
                    placeholder="https://example.com/icon-hover.png or upload file"
                    className="flex-1"
                  />
                  <input
                    ref={hoverFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleIconUpload(file, 'hover');
                      }
                    }}
                  />
                  <button
                    onClick={() => hoverFileInputRef.current?.click()}
                    disabled={isUploadingHoverIcon}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingHoverIcon ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Active State Icon */}
              <div className="space-y-2 pl-4 border-l-2 border-green-200">
                <Label>Active/Clicked State Icon (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Icon shown when user clicks the widget button. Falls back to normal state if not set.
                </p>
                <div className="flex items-center space-x-3">
                  <Input
                    type="url"
                    value={settings.minimizedIconActiveUrl}
                    onChange={(e) => onChange({ minimizedIconActiveUrl: e.target.value })}
                    placeholder="https://example.com/icon-active.png or upload file"
                    className="flex-1"
                  />
                  <input
                    ref={activeFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleIconUpload(file, 'active');
                      }
                    }}
                  />
                  <button
                    onClick={() => activeFileInputRef.current?.click()}
                    disabled={isUploadingActiveIcon}
                    className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploadingActiveIcon ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4" />
                        <span>Upload</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Preview of all three states side by side */}
              {(settings.minimizedIconUrl || settings.minimizedIconHoverUrl || settings.minimizedIconActiveUrl) && (
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  <p className="text-xs text-muted-foreground mb-3 font-medium">Icon State Previews:</p>
                  <div className="flex items-start space-x-6">
                    {/* Normal State Preview */}
                    {settings.minimizedIconUrl && (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <img
                            src={settings.minimizedIconUrl}
                            alt="Normal state preview"
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">Normal</span>
                        <button
                          onClick={() => onChange({ minimizedIconUrl: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Hover State Preview */}
                    {settings.minimizedIconHoverUrl && (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                          <img
                            src={settings.minimizedIconHoverUrl}
                            alt="Hover state preview"
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-xs text-blue-600">Hover</span>
                        <button
                          onClick={() => onChange({ minimizedIconHoverUrl: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    {/* Active State Preview */}
                    {settings.minimizedIconActiveUrl && (
                      <div className="flex flex-col items-center space-y-2">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                          <img
                            src={settings.minimizedIconActiveUrl}
                            alt="Active state preview"
                            className="w-6 h-6 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                        <span className="text-xs text-green-600">Active</span>
                        <button
                          onClick={() => onChange({ minimizedIconActiveUrl: '' })}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
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

      {/* Animations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Widget Icon Animation
          </CardTitle>
          <CardDescription>
            Add eye-catching animations to your minimized widget icon
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Animation Type */}
          <div className="space-y-2">
            <Label htmlFor="animationType">Animation Type</Label>
            <Select
              value={settings.animationType}
              onValueChange={(value: any) => onChange({ animationType: value })}
            >
              <SelectTrigger id="animationType">
                <SelectValue placeholder="Select animation" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                <SelectItem value="pulse">Pulse - Subtle scale and fade effect</SelectItem>
                <SelectItem value="bounce">Bounce - Vertical bouncing motion</SelectItem>
                <SelectItem value="rotate">Rotate - Continuous rotation</SelectItem>
                <SelectItem value="fade">Fade - Opacity pulsing effect</SelectItem>
                <SelectItem value="wiggle">Wiggle - Gentle side-to-side rotation</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Animation Speed */}
          {settings.animationType !== 'none' && (
            <div className="space-y-3">
              <Label>Animation Speed</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['slow', 'normal', 'fast'] as const).map((speed) => (
                  <button
                    key={speed}
                    onClick={() => onChange({ animationSpeed: speed })}
                    className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      settings.animationSpeed === speed
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {speed === 'slow' ? '4s' : speed === 'fast' ? '1s' : '2s'}
                    <br />
                    <span className="text-xs opacity-70 capitalize">{speed}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Animation Intensity */}
          {settings.animationType !== 'none' && (
            <div className="space-y-3">
              <Label>Animation Intensity</Label>
              <div className="grid grid-cols-3 gap-3">
                {(['subtle', 'normal', 'strong'] as const).map((intensity) => (
                  <button
                    key={intensity}
                    onClick={() => onChange({ animationIntensity: intensity })}
                    className={`px-4 py-3 border-2 rounded-lg text-sm font-medium transition-all ${
                      settings.animationIntensity === intensity
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {intensity === 'subtle' ? '50%' : intensity === 'strong' ? '150%' : '100%'}
                    <br />
                    <span className="text-xs opacity-70 capitalize">{intensity}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Live Preview */}
          {settings.animationType !== 'none' && (
            <div className="p-6 border-2 border-dashed rounded-lg bg-gray-50 flex flex-col items-center space-y-4">
              <Label className="text-sm font-medium">Live Preview</Label>
              <AnimationStyles
                animationType={settings.animationType}
                animationSpeed={settings.animationSpeed}
                animationIntensity={settings.animationIntensity}
              />
              <div
                className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white shadow-lg widget-icon-animated"
                style={{
                  backgroundImage: `linear-gradient(to bottom right, ${settings.advancedColors?.buttonGradientStart || '#3a3a3a'}, ${settings.advancedColors?.buttonGradientEnd || '#2a2a2a'})`,
                }}
              >
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Animation: {settings.animationType} • Speed: {settings.animationSpeed} • Intensity: {settings.animationIntensity}
              </p>
            </div>
          )}

          {/* Accessibility Note */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-xs text-blue-800">
              <strong>♿ Accessibility:</strong> Animations automatically respect user&apos;s &quot;prefers-reduced-motion&quot; setting for better accessibility.
            </p>
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
