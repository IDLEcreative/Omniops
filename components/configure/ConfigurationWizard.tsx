/**
 * Main configuration wizard container
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemeSelector } from './ThemeSelector';
import { AppearanceCustomizer } from './AppearanceCustomizer';
import { FeaturesPanel } from './FeaturesPanel';
import { BehaviorPanel } from './BehaviorPanel';
import { WidgetPreview } from './WidgetPreview';
import { EmbedCodeGenerator } from './EmbedCodeGenerator';
import { THEME_PRESETS, getInitialConfig, WidgetConfig } from '@/lib/configure/wizard-utils';

interface ConfigurationWizardProps {
  isOnboarding?: boolean;
}

export function ConfigurationWizard({ isOnboarding }: ConfigurationWizardProps) {
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof THEME_PRESETS>('light');
  const [showAdvancedCSS, setShowAdvancedCSS] = useState(false);
  const [customCSS, setCustomCSS] = useState('');
  const [showPreview, setShowPreview] = useState(true);
  const [config, setConfig] = useState<WidgetConfig>(getInitialConfig());

  const applyTheme = (theme: keyof typeof THEME_PRESETS) => {
    const preset = THEME_PRESETS[theme];
    setSelectedTheme(theme);
    setConfig({
      ...config,
      appearance: {
        ...config.appearance,
        theme,
        primaryColor: preset.primaryColor,
        backgroundColor: preset.backgroundColor,
        textColor: preset.textColor,
      },
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-6">
        <Tabs defaultValue="appearance" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="behavior">Behavior</TabsTrigger>
          </TabsList>

          <TabsContent value="appearance" className="space-y-4">
            <ThemeSelector selectedTheme={selectedTheme} onThemeSelect={applyTheme} />
            <AppearanceCustomizer
              config={config}
              onConfigChange={setConfig}
              customCSS={customCSS}
              onCustomCSSChange={setCustomCSS}
              showAdvancedCSS={showAdvancedCSS}
              onToggleAdvancedCSS={setShowAdvancedCSS}
            />
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <FeaturesPanel config={config} onConfigChange={setConfig} />
          </TabsContent>

          <TabsContent value="behavior" className="space-y-4">
            <BehaviorPanel config={config} onConfigChange={setConfig} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Right Column - Preview & Code */}
      <div className="space-y-6">
        <WidgetPreview
          config={config}
          showPreview={showPreview}
          onTogglePreview={setShowPreview}
        />
        <EmbedCodeGenerator
          config={config}
          customCSS={showAdvancedCSS ? customCSS : ''}
          isOnboarding={isOnboarding}
        />
      </div>
    </div>
  );
}
