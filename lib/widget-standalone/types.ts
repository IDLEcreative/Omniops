/**
 * Widget Standalone Type Definitions
 */

import type { ChatWidgetConfig, PrivacySettings } from '../../components/ChatWidget/hooks/useChatState';

export interface StandaloneWidgetConfig extends ChatWidgetConfig {
  serverUrl?: string;
  domain?: string;
  privacySettings?: Partial<PrivacySettings>;
}
