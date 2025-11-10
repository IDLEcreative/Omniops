/**
 * Icon Utilities
 *
 * Manages icon state and URL selection for the chat widget
 */

import { ChatWidgetConfig } from '../hooks/useChatState';

export type IconState = 'normal' | 'hover' | 'active';

export function getIconUrl(
  iconState: IconState,
  demoConfig: ChatWidgetConfig | null
): string | undefined {
  const normalIcon = demoConfig?.branding?.minimizedIconUrl || demoConfig?.appearance?.minimizedIconUrl;
  const hoverIcon = demoConfig?.branding?.minimizedIconHoverUrl || demoConfig?.appearance?.minimizedIconHoverUrl;
  const activeIcon = demoConfig?.branding?.minimizedIconActiveUrl || demoConfig?.appearance?.minimizedIconActiveUrl;

  switch (iconState) {
    case 'hover':
      return hoverIcon || normalIcon;
    case 'active':
      return activeIcon || normalIcon;
    default:
      return normalIcon;
  }
}
