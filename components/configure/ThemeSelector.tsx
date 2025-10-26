/**
 * Theme preset selector component
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { THEME_PRESETS } from '@/lib/configure/wizard-utils';

interface ThemeSelectorProps {
  selectedTheme: keyof typeof THEME_PRESETS;
  onThemeSelect: (theme: keyof typeof THEME_PRESETS) => void;
}

export function ThemeSelector({ selectedTheme, onThemeSelect }: ThemeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme Presets</CardTitle>
        <CardDescription>Choose a theme or customize your own</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(THEME_PRESETS).map(([key, preset]) => {
            const Icon = preset.icon;
            return (
              <button
                key={key}
                onClick={() => onThemeSelect(key as keyof typeof THEME_PRESETS)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedTheme === key
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <Icon className="h-6 w-6 mx-auto mb-2" />
                <p className="text-sm font-medium">{preset.name}</p>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
