/**
 * Widget Embed - Type Definitions and Global Declarations
 */

import type {
  WidgetConfig,
  RemoteWidgetConfig,
  PrivacyPreferences,
} from './types';

export type { WidgetConfig, RemoteWidgetConfig, PrivacyPreferences };

declare global {
  interface Window {
    ChatWidgetConfig?: Partial<WidgetConfig>;
    ChatWidgetDebug?: boolean;
    ChatWidget?: {
      open(): void;
      close(): void;
      sendMessage(message: string): void;
      updateContext(context: any): void;
      privacy: {
        optOut(): void;
        optIn(): void;
        clearData(): void;
        getStatus(): PrivacyPreferences;
      };
      version: string;
    };
    gtag?: (...args: any[]) => void;
  }
}

// Version is auto-generated at build time to force cache invalidation
// @ts-expect-error - This will be replaced at build time
export const WIDGET_VERSION = __WIDGET_VERSION__;
export const CLEANUP_KEY = 'chat_widget_last_cleanup';
