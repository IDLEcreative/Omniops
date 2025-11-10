"use client";

/**
 * Language Selector Component
 *
 * Allows users to select their preferred UI language
 * Supports English, Spanish, and Arabic with RTL support
 */

import { Check, Globe, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { getAvailableLanguages, type LanguageCode } from '@/lib/i18n';

export interface LanguageSelectorProps {
  currentLanguage: LanguageCode;
  onLanguageChange: (languageCode: LanguageCode) => void;
  compact?: boolean;
}

export function LanguageSelector({
  currentLanguage,
  onLanguageChange,
  compact = false,
}: LanguageSelectorProps) {
  const languages = getAvailableLanguages();

  const currentLang = languages.find((l) => l.code === currentLanguage);
  const currentLangName = currentLang?.name || 'English';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "sm" : "default"}>
          <Globe className="h-4 w-4" />
          {!compact && (
            <>
              <span className="ml-2">{currentLangName}</span>
              <ChevronDown className="h-4 w-4 ml-1 opacity-50" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Select Language</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => onLanguageChange(lang.code)}
            className="flex items-center justify-between"
          >
            <span className={lang.rtl ? 'font-arabic' : ''}>
              {lang.name} {lang.native && `(${lang.native})`}
            </span>
            {lang.rtl && (
              <span className="text-xs text-muted-foreground ml-2">RTL</span>
            )}
            {currentLanguage === lang.code && (
              <Check className="h-4 w-4 ml-auto" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
