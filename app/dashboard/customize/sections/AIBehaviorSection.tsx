import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Brain, Zap, MessageSquare, Globe, Bot } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface AISettings {
  personality: 'professional' | 'friendly' | 'helpful' | 'concise' | 'technical';
  responseLength: 'short' | 'balanced' | 'detailed';
  confidenceThreshold: number;
  fallbackBehavior: 'apologize_and_offer_help' | 'redirect_to_human' | 'suggest_alternatives';
  language: string;
  customSystemPrompt: string;
  enableSmartSuggestions: boolean;
  maxTokens: number;
  temperature: number;
}

interface AIBehaviorSectionProps {
  settings: AISettings;
  onChange: (updates: Partial<AISettings>) => void;
}

const personalityDescriptions = {
  professional: "Formal and business-oriented responses",
  friendly: "Warm and conversational tone",
  helpful: "Focus on problem-solving and assistance",
  concise: "Brief and to-the-point answers",
  technical: "Detailed technical explanations"
};

const languages = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "ko", label: "Korean" },
  { value: "zh", label: "Chinese" },
];

export function AIBehaviorSection({ settings, onChange }: AIBehaviorSectionProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            AI Personality & Behavior
          </CardTitle>
          <CardDescription>
            Configure how the AI assistant communicates and responds
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personality */}
          <div className="space-y-2">
            <Label>Personality Type</Label>
            <Select
              value={settings.personality}
              onValueChange={(value: any) => onChange({ personality: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(personalityDescriptions).map(([value, desc]) => (
                  <SelectItem key={value} value={value}>
                    <div className="flex flex-col">
                      <span className="font-medium capitalize">{value}</span>
                      <span className="text-xs text-muted-foreground">{desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Response Length */}
          <div className="space-y-2">
            <Label>Response Length Preference</Label>
            <Select
              value={settings.responseLength}
              onValueChange={(value: any) => onChange({ responseLength: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="short">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="w-12">Short</Badge>
                    <span className="text-sm text-muted-foreground">Quick, concise answers</span>
                  </div>
                </SelectItem>
                <SelectItem value="balanced">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="w-12">Medium</Badge>
                    <span className="text-sm text-muted-foreground">Balanced detail level</span>
                  </div>
                </SelectItem>
                <SelectItem value="detailed">
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="w-12">Long</Badge>
                    <span className="text-sm text-muted-foreground">Comprehensive explanations</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Language Settings */}
          <div className="space-y-2">
            <Label className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Response Language
            </Label>
            <Select
              value={settings.language}
              onValueChange={(value) => onChange({ language: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Custom System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="customPrompt">
              Custom System Prompt
              <span className="text-xs text-muted-foreground ml-2">
                (Optional - Override default behavior)
              </span>
            </Label>
            <Textarea
              id="customPrompt"
              value={settings.customSystemPrompt}
              onChange={(e) => onChange({ customSystemPrompt: e.target.value })}
              placeholder="e.g., You are a helpful assistant for an e-commerce store specializing in..."
              rows={3}
              className="font-mono text-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Advanced AI Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Advanced AI Settings
          </CardTitle>
          <CardDescription>
            Fine-tune AI response generation and behavior
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence Threshold */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Confidence Threshold</Label>
              <span className="text-sm text-muted-foreground">
                {(settings.confidenceThreshold * 100).toFixed(0)}%
              </span>
            </div>
            <Slider
              value={[settings.confidenceThreshold]}
              onValueChange={([value]) => onChange({ confidenceThreshold: value })}
              min={0}
              max={1}
              step={0.05}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Minimum confidence required before providing an answer
            </p>
          </div>

          {/* Temperature */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Response Creativity (Temperature)</Label>
              <span className="text-sm text-muted-foreground">
                {settings.temperature.toFixed(1)}
              </span>
            </div>
            <Slider
              value={[settings.temperature]}
              onValueChange={([value]) => onChange({ temperature: value })}
              min={0}
              max={1}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Lower = More focused, Higher = More creative
            </p>
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>Maximum Response Tokens</Label>
              <Badge variant="outline">{settings.maxTokens}</Badge>
            </div>
            <Slider
              value={[settings.maxTokens]}
              onValueChange={([value]) => onChange({ maxTokens: value })}
              min={50}
              max={2000}
              step={50}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Approximate word count: {Math.round(settings.maxTokens * 0.75)} words
            </p>
          </div>

          {/* Fallback Behavior */}
          <div className="space-y-2">
            <Label>Low Confidence Fallback</Label>
            <Select
              value={settings.fallbackBehavior}
              onValueChange={(value: any) => onChange({ fallbackBehavior: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apologize_and_offer_help">
                  Apologize and offer alternatives
                </SelectItem>
                <SelectItem value="redirect_to_human">
                  Redirect to human support
                </SelectItem>
                <SelectItem value="suggest_alternatives">
                  Suggest related topics
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Smart Suggestions */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center">
                <Bot className="h-4 w-4 mr-2" />
                Smart Suggestions
              </Label>
              <p className="text-sm text-muted-foreground">
                Proactively suggest related questions
              </p>
            </div>
            <Switch
              checked={settings.enableSmartSuggestions}
              onCheckedChange={(checked) => onChange({ enableSmartSuggestions: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Response Examples Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Response Preview
          </CardTitle>
          <CardDescription>
            Example of how the AI will respond with current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-2">
              <p className="text-sm font-medium">User: "What products do you offer?"</p>
              <div className="pl-4 border-l-2 border-primary">
                <p className="text-sm text-muted-foreground italic">
                  {settings.personality === 'professional'
                    ? "Thank you for your inquiry. We offer a comprehensive range of products designed to meet your specific needs. I'd be happy to provide detailed information about our catalog."
                    : settings.personality === 'friendly'
                    ? "Hey there! 😊 Great question! We've got an awesome selection of products that I think you'll love. Let me show you what we have available!"
                    : settings.personality === 'concise'
                    ? "We offer multiple product categories. Please specify your area of interest for detailed information."
                    : "We provide a diverse product portfolio tailored to various customer requirements. How may I assist you in finding the right solution?"}
                </p>
              </div>
            </div>

            {settings.enableSmartSuggestions && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  📌 "Show me your best sellers"
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  📌 "What categories are available?"
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  📌 "Do you offer bulk discounts?"
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}