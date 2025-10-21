import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Brain, Globe, MessageSquare, Sparkles, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PersonalityCard } from "../components/PersonalityCard";

interface IntelligenceSettings {
  personality: 'professional' | 'friendly' | 'concise';
  language: string;
  responseStyle: 'short' | 'balanced' | 'detailed';
  enableSmartSuggestions: boolean;
  enableWebSearch: boolean;
}

interface IntelligenceSectionProps {
  settings: IntelligenceSettings;
  onChange: (updates: Partial<IntelligenceSettings>) => void;
}

const languages = [
  { value: "auto", label: "🌍 Auto-detect", flag: "🌍" },
  { value: "en", label: "🇺🇸 English", flag: "🇺🇸" },
  { value: "es", label: "🇪🇸 Spanish", flag: "🇪🇸" },
  { value: "fr", label: "🇫🇷 French", flag: "🇫🇷" },
  { value: "de", label: "🇩🇪 German", flag: "🇩🇪" },
];

export function IntelligenceSection({ settings, onChange }: IntelligenceSectionProps) {
  return (
    <div className="space-y-4">
      {/* Personality */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Personality
          </CardTitle>
          <CardDescription>
            Choose how your bot communicates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3">
            <PersonalityCard
              value="professional"
              selected={settings.personality === 'professional'}
              onClick={() => onChange({ personality: 'professional' })}
            />
            <PersonalityCard
              value="friendly"
              selected={settings.personality === 'friendly'}
              onClick={() => onChange({ personality: 'friendly' })}
            />
            <PersonalityCard
              value="concise"
              selected={settings.personality === 'concise'}
              onClick={() => onChange({ personality: 'concise' })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Language & Response Style */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Language & Style
          </CardTitle>
          <CardDescription>
            Configure language and response preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language */}
          <div className="space-y-2">
            <Label>Response Language</Label>
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
            <p className="text-xs text-muted-foreground">
              Auto-detect will match the user&apos;s language
            </p>
          </div>

          {/* Response Style */}
          <div className="space-y-3">
            <Label>Response Length</Label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => onChange({ responseStyle: 'short' })}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  hover:shadow-md
                  ${settings.responseStyle === 'short'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-semibold mb-1">Short</div>
                <div className="text-xs text-muted-foreground">
                  Quick answers
                </div>
              </button>

              <button
                onClick={() => onChange({ responseStyle: 'balanced' })}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  hover:shadow-md
                  ${settings.responseStyle === 'balanced'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-semibold mb-1">Balanced</div>
                <div className="text-xs text-muted-foreground">
                  Recommended
                </div>
              </button>

              <button
                onClick={() => onChange({ responseStyle: 'detailed' })}
                className={`
                  p-4 rounded-lg border-2 transition-all text-center
                  hover:shadow-md
                  ${settings.responseStyle === 'detailed'
                    ? 'border-primary bg-primary/5 shadow-md'
                    : 'border-gray-200 hover:border-gray-300'
                  }
                `}
              >
                <div className="font-semibold mb-1">Detailed</div>
                <div className="text-xs text-muted-foreground">
                  In-depth
                </div>
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="h-5 w-5 mr-2" />
            Smart Features
          </CardTitle>
          <CardDescription>
            Enable AI-powered enhancements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Smart Suggestions
              </Label>
              <p className="text-sm text-muted-foreground">
                Suggest related questions to help users
              </p>
            </div>
            <Switch
              checked={settings.enableSmartSuggestions}
              onCheckedChange={(checked) => onChange({ enableSmartSuggestions: checked })}
            />
          </div>

          {settings.enableSmartSuggestions && (
            <div className="pl-4 border-l-2 border-primary/20">
              <p className="text-xs text-muted-foreground mb-2">Preview:</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="text-xs">
                  📌 &quot;Tell me more&quot;
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  📌 &quot;Show pricing&quot;
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  📌 &quot;Contact support&quot;
                </Badge>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="flex items-center">
                <Search className="h-4 w-4 mr-2" />
                Web Search
              </Label>
              <p className="text-sm text-muted-foreground">
                Search the web for up-to-date information
              </p>
            </div>
            <Switch
              checked={settings.enableWebSearch}
              onCheckedChange={(checked) => onChange({ enableWebSearch: checked })}
            />
          </div>
        </CardContent>
      </Card>

      {/* Response Preview */}
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center text-blue-900">
            <MessageSquare className="h-5 w-5 mr-2" />
            Example Response
          </CardTitle>
          <CardDescription className="text-blue-700">
            How your bot will respond with current settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
              <p className="text-sm font-medium text-gray-600 mb-2">
                User: &quot;What products do you offer?&quot;
              </p>
              <div className="pl-4 border-l-2 border-blue-400">
                <p className="text-sm text-gray-700">
                  {settings.personality === 'professional'
                    ? settings.responseStyle === 'short'
                      ? "We offer a comprehensive product range. What interests you?"
                      : settings.responseStyle === 'detailed'
                      ? "Thank you for your inquiry. We offer a comprehensive range of products designed to meet diverse customer needs. I'd be happy to provide detailed information about our catalog, including specifications, pricing, and availability. May I ask what specific category interests you?"
                      : "Thank you for your inquiry. We offer a comprehensive range of products designed to meet your specific needs. I'd be happy to provide detailed information about our catalog."
                    : settings.personality === 'friendly'
                    ? settings.responseStyle === 'short'
                      ? "Great question! We've got lots of awesome products. What are you looking for? 😊"
                      : settings.responseStyle === 'detailed'
                      ? "Hey there! 😊 Great question! We've got an awesome selection of products that I think you'll love. We carry everything from our bestsellers to new arrivals, and I'd be happy to show you around! What kind of products are you most interested in? I can help you find exactly what you're looking for!"
                      : "Hey there! 😊 Great question! We've got an awesome selection of products that I think you'll love. Let me show you what we have available!"
                    : settings.responseStyle === 'short'
                    ? "We have multiple product categories. What do you need?"
                    : settings.responseStyle === 'detailed'
                    ? "We provide various product categories. Specify your area of interest for precise information on specifications and availability."
                    : "We offer multiple product categories. Please specify your area of interest for detailed information."}
                </p>
              </div>
            </div>

            {settings.enableSmartSuggestions && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs bg-white">
                  💡 &quot;Show me bestsellers&quot;
                </Badge>
                <Badge variant="outline" className="text-xs bg-white">
                  💡 &quot;What categories?&quot;
                </Badge>
                <Badge variant="outline" className="text-xs bg-white">
                  💡 &quot;Price range?&quot;
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
