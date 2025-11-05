import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Palette } from "lucide-react";
import { ColorInputGroup } from "./ColorInputGroup";

interface AdvancedColors {
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
}

interface AdvancedColorPickerProps {
  advancedColors?: AdvancedColors;
  onChange: (colors: AdvancedColors) => void;
}

export function AdvancedColorPicker({ advancedColors = {}, onChange }: AdvancedColorPickerProps) {
  const updateColor = (key: keyof AdvancedColors, value: string) => {
    onChange({ ...advancedColors, [key]: value });
  };

  return (
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
            <ColorInputGroup
              label="Background Color"
              value={advancedColors.widgetBackgroundColor || ''}
              onChange={(value) => updateColor('widgetBackgroundColor', value)}
              defaultValue="#111111"
            />
            <ColorInputGroup
              label="Border Color"
              value={advancedColors.widgetBorderColor || ''}
              onChange={(value) => updateColor('widgetBorderColor', value)}
              defaultValue="#2a2a2a"
            />
          </div>
        </div>

        {/* Header */}
        <div className="space-y-4 p-4 border rounded-lg bg-blue-50">
          <h4 className="font-medium text-sm">Header</h4>
          <div className="grid grid-cols-2 gap-4">
            <ColorInputGroup
              label="Background"
              value={advancedColors.headerBackgroundColor || ''}
              onChange={(value) => updateColor('headerBackgroundColor', value)}
              defaultValue="#111111"
            />
            <ColorInputGroup
              label="Border"
              value={advancedColors.headerBorderColor || ''}
              onChange={(value) => updateColor('headerBorderColor', value)}
              defaultValue="#2a2a2a"
            />
            <div className="col-span-2">
              <ColorInputGroup
                label="Text Color"
                value={advancedColors.headerTextColor || ''}
                onChange={(value) => updateColor('headerTextColor', value)}
                defaultValue="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4 p-4 border rounded-lg bg-purple-50">
          <h4 className="font-medium text-sm">Messages</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <ColorInputGroup
                label="Message Area Background"
                value={advancedColors.messageAreaBackgroundColor || ''}
                onChange={(value) => updateColor('messageAreaBackgroundColor', value)}
                defaultValue="#111111"
              />
            </div>
            <ColorInputGroup
              label="User Bubble Background"
              value={advancedColors.userMessageBackgroundColor || ''}
              onChange={(value) => updateColor('userMessageBackgroundColor', value)}
              defaultValue="#3f3f46"
            />
            <ColorInputGroup
              label="User Text Color"
              value={advancedColors.userMessageTextColor || ''}
              onChange={(value) => updateColor('userMessageTextColor', value)}
              defaultValue="#ffffff"
            />
            <div className="col-span-2">
              <ColorInputGroup
                label="Bot Text Color"
                value={advancedColors.botMessageTextColor || ''}
                onChange={(value) => updateColor('botMessageTextColor', value)}
                defaultValue="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="space-y-4 p-4 border rounded-lg bg-green-50">
          <h4 className="font-medium text-sm">Input Area</h4>
          <div className="grid grid-cols-2 gap-4">
            <ColorInputGroup
              label="Area Background"
              value={advancedColors.inputAreaBackgroundColor || ''}
              onChange={(value) => updateColor('inputAreaBackgroundColor', value)}
              defaultValue="#111111"
            />
            <ColorInputGroup
              label="Area Border"
              value={advancedColors.inputAreaBorderColor || ''}
              onChange={(value) => updateColor('inputAreaBorderColor', value)}
              defaultValue="#2a2a2a"
            />
            <ColorInputGroup
              label="Input Background"
              value={advancedColors.inputBackgroundColor || ''}
              onChange={(value) => updateColor('inputBackgroundColor', value)}
              defaultValue="#2a2a2a"
            />
            <ColorInputGroup
              label="Input Border"
              value={advancedColors.inputBorderColor || ''}
              onChange={(value) => updateColor('inputBorderColor', value)}
              defaultValue="#3a3a3a"
            />
            <ColorInputGroup
              label="Input Focus Border"
              value={advancedColors.inputFocusBorderColor || ''}
              onChange={(value) => updateColor('inputFocusBorderColor', value)}
              defaultValue="#4a4a4a"
            />
            <ColorInputGroup
              label="Input Text"
              value={advancedColors.inputTextColor || ''}
              onChange={(value) => updateColor('inputTextColor', value)}
              defaultValue="#ffffff"
            />
          </div>
        </div>

        {/* Floating Button */}
        <div className="space-y-4 p-4 border rounded-lg bg-orange-50">
          <h4 className="font-medium text-sm">Floating Button</h4>
          <div className="grid grid-cols-2 gap-4">
            <ColorInputGroup
              label="Gradient Start"
              value={advancedColors.buttonGradientStart || ''}
              onChange={(value) => updateColor('buttonGradientStart', value)}
              defaultValue="#3a3a3a"
            />
            <ColorInputGroup
              label="Gradient End"
              value={advancedColors.buttonGradientEnd || ''}
              onChange={(value) => updateColor('buttonGradientEnd', value)}
              defaultValue="#2a2a2a"
            />
            <div className="col-span-2">
              <ColorInputGroup
                label="Icon Color"
                value={advancedColors.buttonTextColor || ''}
                onChange={(value) => updateColor('buttonTextColor', value)}
                defaultValue="#ffffff"
              />
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
  );
}
