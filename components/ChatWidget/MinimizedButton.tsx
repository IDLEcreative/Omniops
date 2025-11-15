/**
 * Minimized Chat Button
 *
 * The floating button shown when the chat widget is closed
 */

import { MessageCircle } from 'lucide-react';
import { ChatWidgetConfig } from './hooks/useChatState';
import { AnimationStyles, getAnimationClassName } from '@/app/dashboard/customize/components/AnimationStyles';
import { IconState, getIconUrl } from './utils/iconUtils';

interface MinimizedButtonProps {
  demoConfig: ChatWidgetConfig | null;
  iconState: IconState;
  onOpen: () => void;
  onIconStateChange: (state: IconState) => void;
}

export function MinimizedButton({
  demoConfig,
  iconState,
  onOpen,
  onIconStateChange,
}: MinimizedButtonProps) {
  // Animation settings with sensible defaults
  const animationType = demoConfig?.behavior?.animationType || 'pulse';
  const animationSpeed = demoConfig?.behavior?.animationSpeed || 'normal';
  const animationIntensity = demoConfig?.behavior?.animationIntensity || 'normal';
  const showBadge = demoConfig?.appearance?.showNotificationBadge ?? true;

  // Config-driven button colors and icon
  const buttonGradientStart = demoConfig?.appearance?.buttonGradientStart || '#3a3a3a';
  const buttonGradientEnd = demoConfig?.appearance?.buttonGradientEnd || '#2a2a2a';
  const buttonTextColor = demoConfig?.appearance?.buttonTextColor || '#ffffff';
  const minimizedIconUrl = getIconUrl(iconState, demoConfig);

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-5 sm:right-5 z-50">
      {/* Inject animation styles if animation is enabled */}
      {animationType !== 'none' && (
        <AnimationStyles
          animationType={animationType}
          animationSpeed={animationSpeed}
          animationIntensity={animationIntensity}
        />
      )}
      <button
        onClick={onOpen}
        onMouseEnter={() => onIconStateChange('hover')}
        onMouseLeave={() => onIconStateChange('normal')}
        onMouseDown={() => onIconStateChange('active')}
        onMouseUp={() => onIconStateChange('hover')}
        onTouchStart={() => onIconStateChange('active')}
        onTouchEnd={() => onIconStateChange('normal')}
        style={{
          backgroundImage: `linear-gradient(to bottom right, ${buttonGradientStart}, ${buttonGradientEnd})`,
          color: buttonTextColor,
        }}
        className={`relative w-12 h-12 sm:w-14 sm:h-14 text-white rounded-full shadow-xl hover:shadow-2xl hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black transition-all duration-300 flex items-center justify-center animate-in fade-in group ${getAnimationClassName(animationType)}`}
        aria-label="Open chat support widget"
        role="button"
        tabIndex={0}
      >
        {/* Legacy pulse ring - only show if animationType is 'none' for backwards compatibility */}
        {animationType === 'none' && (
          <span
            style={{
              backgroundImage: `linear-gradient(to bottom right, ${buttonGradientStart}, ${buttonGradientEnd})`,
              animationDuration: '3s',
            }}
            className="absolute inset-0 rounded-full opacity-75 animate-ping motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}

        {/* Notification dot badge - can be disabled via config */}
        {showBadge && (
          <span
            className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg animate-pulse motion-reduce:animate-none"
            aria-hidden="true"
          />
        )}

        {/* Icon with hover scale effect and smooth state transitions */}
        {minimizedIconUrl ? (
          <picture
            key={iconState}
            className="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-all duration-200 ease-in-out block"
          >
            {/* WebP version for modern browsers (better compression) */}
            <source
              srcSet={minimizedIconUrl.replace(/\.(png|jpg|jpeg)$/i, '.webp')}
              type="image/webp"
            />
            {/* PNG fallback for older browsers */}
            <img
              src={minimizedIconUrl.replace(/\.webp$/i, '.png')}
              alt="Chat"
              className="h-full w-full object-contain transition-opacity duration-200"
              width="24"
              height="24"
              loading="lazy"
              aria-hidden="true"
              style={{
                opacity: iconState === 'active' ? 0.8 : 1,
              }}
              onError={(e) => {
                // Fallback to default MessageCircle icon on error
                const picture = e.currentTarget.closest('picture');
                if (picture) {
                  picture.style.display = 'none';
                }
                const button = picture?.parentElement;
                if (button) {
                  const fallbackIcon = document.createElement('div');
                  fallbackIcon.innerHTML = '<svg class="relative h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>';
                  button.appendChild(fallbackIcon.firstChild as Node);
                }
              }}
            />
          </picture>
        ) : (
          <MessageCircle className="relative h-5 w-5 sm:h-6 sm:w-6 group-hover:scale-110 transition-transform" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
