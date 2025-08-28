"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Palette,
  Monitor,
  MessageSquare,
  Save,
  Eye,
  RotateCcw,
  Copy,
  Check,
  Settings,
  Smartphone,
  X,
  Send,
  Bot,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WidgetConfig {
  // Theme settings
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: string;
  fontSize: string;
  
  // Position settings
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offsetX: number;
  offsetY: number;
  
  // Content settings
  welcomeMessage: string;
  placeholderText: string;
  botName: string;
  avatarUrl: string;
  
  // Behavior settings
  showAvatar: boolean;
  showTypingIndicator: boolean;
  autoOpen: boolean;
  openDelay: number;
  minimizable: boolean;
  
  // Branding
  showBranding: boolean;
  companyLogo: string;
}

const defaultConfig: WidgetConfig = {
  primaryColor: "#3b82f6",
  backgroundColor: "#ffffff",
  textColor: "#1f2937",
  borderRadius: "8",
  fontSize: "14",
  position: "bottom-right",
  offsetX: 24,
  offsetY: 24,
  welcomeMessage: "Hi! How can I help you today?",
  placeholderText: "Type your message...",
  botName: "Assistant",
  avatarUrl: "",
  showAvatar: true,
  showTypingIndicator: true,
  autoOpen: false,
  openDelay: 3000,
  minimizable: true,
  showBranding: true,
  companyLogo: "",
};

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

export default function CustomizePage() {
  const [config, setConfig] = useState<WidgetConfig>(defaultConfig);
  const [activeTab, setActiveTab] = useState("theme");
  const [copied, setCopied] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const resetConfig = () => {
    setConfig(defaultConfig);
    setIsDirty(false);
  };

  const saveConfig = () => {
    // Here you would save to backend/localStorage
    console.log("Saving config:", config);
    setIsDirty(false);
  };

  const generateEmbedCode = () => {
    const embedCode = `<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://your-domain.com/embed.js';
    script.async = true;
    script.onload = function() {
      window.ChatWidget.init({
        primaryColor: '${config.primaryColor}',
        position: '${config.position}',
        welcomeMessage: '${config.welcomeMessage}',
        botName: '${config.botName}',
        showAvatar: ${config.showAvatar},
        autoOpen: ${config.autoOpen}
      });
    };
    document.head.appendChild(script);
  })();
</script>`;
    return embedCode;
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(generateEmbedCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getPositionClass = () => {
    const base = "fixed z-50";
    switch (config.position) {
      case 'bottom-right':
        return `${base} bottom-${Math.floor(config.offsetY/4)} right-${Math.floor(config.offsetX/4)}`;
      case 'bottom-left':
        return `${base} bottom-${Math.floor(config.offsetY/4)} left-${Math.floor(config.offsetX/4)}`;
      case 'top-right':
        return `${base} top-${Math.floor(config.offsetY/4)} right-${Math.floor(config.offsetX/4)}`;
      case 'top-left':
        return `${base} top-${Math.floor(config.offsetY/4)} left-${Math.floor(config.offsetX/4)}`;
      default:
        return `${base} bottom-6 right-6`;
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Chat Widget Customization</h2>
          <p className="text-muted-foreground">
            Customize the appearance and behavior of your chat widget
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {isDirty && (
            <Badge variant="secondary" className="animate-pulse">
              Unsaved changes
            </Badge>
          )}
          <Button variant="outline" onClick={resetConfig}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button onClick={saveConfig}>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="theme">Theme</TabsTrigger>
              <TabsTrigger value="position">Position</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="behavior">Behavior</TabsTrigger>
            </TabsList>

            {/* Theme Settings */}
            <TabsContent value="theme" className="space-y-6">
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
                        value={config.primaryColor}
                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                        className="w-16 h-10 p-1 border-2"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => updateConfig('primaryColor', e.target.value)}
                        placeholder="#3b82f6"
                        className="font-mono"
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {colorPresets.map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() => updateConfig('primaryColor', preset.color)}
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
                          value={config.backgroundColor}
                          onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={config.backgroundColor}
                          onChange={(e) => updateConfig('backgroundColor', e.target.value)}
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Text Color</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          type="color"
                          value={config.textColor}
                          onChange={(e) => updateConfig('textColor', e.target.value)}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          value={config.textColor}
                          onChange={(e) => updateConfig('textColor', e.target.value)}
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
                        value={config.borderRadius}
                        onChange={(e) => updateConfig('borderRadius', e.target.value)}
                        placeholder="8"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Font Size (px)</Label>
                      <Input
                        type="number"
                        value={config.fontSize}
                        onChange={(e) => updateConfig('fontSize', e.target.value)}
                        placeholder="14"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Position Settings */}
            <TabsContent value="position" className="space-y-6">
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
                    <Select value={config.position} onValueChange={(value: any) => updateConfig('position', value)}>
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
                        value={config.offsetX}
                        onChange={(e) => updateConfig('offsetX', parseInt(e.target.value) || 0)}
                        placeholder="24"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Vertical Offset (px)</Label>
                      <Input
                        type="number"
                        value={config.offsetY}
                        onChange={(e) => updateConfig('offsetY', parseInt(e.target.value) || 0)}
                        placeholder="24"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Content Settings */}
            <TabsContent value="content" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Content & Messages
                  </CardTitle>
                  <CardDescription>
                    Customize the text and messaging in your chat widget
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="welcomeMessage">Welcome Message</Label>
                    <Textarea
                      id="welcomeMessage"
                      value={config.welcomeMessage}
                      onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
                      placeholder="Hi! How can I help you today?"
                      rows={2}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="placeholderText">Input Placeholder</Label>
                    <Input
                      id="placeholderText"
                      value={config.placeholderText}
                      onChange={(e) => updateConfig('placeholderText', e.target.value)}
                      placeholder="Type your message..."
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="botName">Bot Name</Label>
                    <Input
                      id="botName"
                      value={config.botName}
                      onChange={(e) => updateConfig('botName', e.target.value)}
                      placeholder="Assistant"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="avatarUrl">Avatar URL (optional)</Label>
                    <Input
                      id="avatarUrl"
                      value={config.avatarUrl}
                      onChange={(e) => updateConfig('avatarUrl', e.target.value)}
                      placeholder="https://example.com/avatar.png"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Behavior Settings */}
            <TabsContent value="behavior" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Widget Behavior
                  </CardTitle>
                  <CardDescription>
                    Configure how your chat widget behaves
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Avatar</Label>
                      <p className="text-sm text-muted-foreground">
                        Display bot avatar in messages
                      </p>
                    </div>
                    <Switch
                      checked={config.showAvatar}
                      onCheckedChange={(checked) => updateConfig('showAvatar', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Typing Indicator</Label>
                      <p className="text-sm text-muted-foreground">
                        Show typing animation when bot is responding
                      </p>
                    </div>
                    <Switch
                      checked={config.showTypingIndicator}
                      onCheckedChange={(checked) => updateConfig('showTypingIndicator', checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto Open</Label>
                      <p className="text-sm text-muted-foreground">
                        Automatically open chat widget on page load
                      </p>
                    </div>
                    <Switch
                      checked={config.autoOpen}
                      onCheckedChange={(checked) => updateConfig('autoOpen', checked)}
                    />
                  </div>
                  
                  {config.autoOpen && (
                    <div className="space-y-2">
                      <Label>Auto Open Delay (ms)</Label>
                      <Input
                        type="number"
                        value={config.openDelay}
                        onChange={(e) => updateConfig('openDelay', parseInt(e.target.value) || 0)}
                        placeholder="3000"
                      />
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show Branding</Label>
                      <p className="text-sm text-muted-foreground">
                        Display "Powered by Omniops" branding
                      </p>
                    </div>
                    <Switch
                      checked={config.showBranding}
                      onCheckedChange={(checked) => updateConfig('showBranding', checked)}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Live Preview */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your widget will appear to users
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative bg-gray-100 rounded-lg h-96 overflow-hidden">
                {/* Mock browser */}
                <div className="bg-gray-200 p-2 rounded-t-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  </div>
                </div>
                
                {/* Mock website content */}
                <div className="p-4 space-y-2 h-full bg-white">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  
                  {/* Widget Preview */}
                  <div className={getPositionClass()}>
                    <div className="flex flex-col space-y-2">
                      {/* Chat Window */}
                      <div
                        className="w-80 h-96 rounded-lg shadow-lg flex flex-col"
                        style={{
                          backgroundColor: config.backgroundColor,
                          borderRadius: `${config.borderRadius}px`,
                          fontSize: `${config.fontSize}px`,
                        }}
                      >
                        {/* Header */}
                        <div
                          className="p-3 rounded-t-lg flex items-center justify-between"
                          style={{ backgroundColor: config.primaryColor }}
                        >
                          <div className="flex items-center space-x-2">
                            {config.showAvatar && (
                              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="h-4 w-4 text-white" />
                              </div>
                            )}
                            <span className="text-white font-medium">{config.botName}</span>
                          </div>
                          <X className="h-4 w-4 text-white cursor-pointer" />
                        </div>
                        
                        {/* Messages */}
                        <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                          <div className="flex items-start space-x-2">
                            {config.showAvatar && (
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                                <Bot className="h-3 w-3 text-gray-500" />
                              </div>
                            )}
                            <div
                              className="rounded-lg px-3 py-2 max-w-xs"
                              style={{
                                backgroundColor: `${config.primaryColor}10`,
                                color: config.textColor,
                              }}
                            >
                              {config.welcomeMessage}
                            </div>
                          </div>
                        </div>
                        
                        {/* Input */}
                        <div className="p-3 border-t border-gray-200">
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              placeholder={config.placeholderText}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                              style={{
                                borderRadius: `${Math.max(4, parseInt(config.borderRadius) - 2)}px`,
                                fontSize: `${config.fontSize}px`,
                              }}
                            />
                            <button
                              className="p-2 rounded-md text-white"
                              style={{ backgroundColor: config.primaryColor }}
                            >
                              <Send className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Branding */}
                        {config.showBranding && (
                          <div className="px-3 pb-2">
                            <p className="text-xs text-gray-500 text-center">
                              Powered by Omniops
                            </p>
                          </div>
                        )}
                      </div>
                      
                      {/* Chat Button */}
                      <button
                        className="w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-white"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        <MessageSquare className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Embed Code */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Embed Code</CardTitle>
              <CardDescription>
                Copy this code to add the widget to your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="text-xs bg-gray-50 p-3 rounded-md overflow-x-auto">
                  <code>{generateEmbedCode()}</code>
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute top-2 right-2"
                  onClick={copyEmbedCode}
                >
                  {copied ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Alert className="mt-4">
                <AlertDescription>
                  Add this code to your website's HTML, preferably before the closing &lt;/body&gt; tag.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}