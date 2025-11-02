/**
 * Vanilla JS Minimal Widget Loader (Zero Dependencies)
 *
 * Ultra-lightweight loader that shows immediately without React.
 * Lazy-loads the full React widget only when user interacts.
 *
 * Target size: <5 KB (no dependencies)
 */

interface VanillaLoaderConfig {
  appearance?: {
    position?: string;
    primaryColor?: string;
    showNotificationBadge?: boolean;
    showPulseAnimation?: boolean;
  };
}

export function createMinimalLoader(config: VanillaLoaderConfig = {}): HTMLElement {
  const appearance = config.appearance || {};
  const position = appearance.position || 'bottom-right';
  const primaryColor = appearance.primaryColor || '#3b82f6';

  // Create container
  const container = document.createElement('div');
  container.id = 'omniops-minimal-loader';

  // Position styles
  const isRight = position.includes('right');
  const isBottom = position.includes('bottom');

  container.style.cssText = `
    position: fixed;
    ${isRight ? 'right: 20px;' : 'left: 20px;'}
    ${isBottom ? 'bottom: 20px;' : 'top: 20px;'}
    z-index: 9999;
  `;

  // Create chat button
  const button = document.createElement('button');
  button.setAttribute('aria-label', 'Open chat');
  button.style.cssText = `
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background-color: ${primaryColor};
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
    position: relative;
  `;

  // Hover effects
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.05)';
    button.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1)';
    button.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  });

  // Chat icon SVG
  button.innerHTML = `
    <svg
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="white"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  `;

  // Notification badge
  if (appearance.showNotificationBadge) {
    const badge = document.createElement('span');
    badge.style.cssText = `
      position: absolute;
      top: 8px;
      right: 8px;
      width: 12px;
      height: 12px;
      background-color: #ef4444;
      border-radius: 50%;
      border: 2px solid white;
    `;
    button.appendChild(badge);
  }

  // Pulse animation
  if (appearance.showPulseAnimation) {
    const pulse = document.createElement('span');
    pulse.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-radius: 50%;
      border: 2px solid ${primaryColor};
      animation: omniops-pulse 2s infinite;
      opacity: 0.5;
      pointer-events: none;
    `;
    button.appendChild(pulse);

    // Inject keyframes
    if (!document.getElementById('omniops-pulse-animation')) {
      const style = document.createElement('style');
      style.id = 'omniops-pulse-animation';
      style.textContent = `
        @keyframes omniops-pulse {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.1);
            opacity: 0.3;
          }
          100% {
            transform: scale(1.2);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  container.appendChild(button);
  return container;
}

/**
 * Load the full React widget dynamically
 */
export async function loadFullWidget(containerId: string, config: any): Promise<void> {
  // Show loading state
  const loader = document.getElementById('omniops-minimal-loader');
  if (loader) {
    const button = loader.querySelector('button');
    if (button) {
      button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round">
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 12 12"
              to="360 12 12"
              dur="1s"
              repeatCount="indefinite"
            />
          </path>
        </svg>
      `;
    }
  }

  try {
    // Dynamically import the full React widget
    const { initWidget } = await import('./widget-standalone');

    // Remove minimal loader
    if (loader) {
      loader.remove();
    }

    // Initialize full widget
    initWidget(containerId, config);
  } catch (error) {
    console.error('[Omniops] Failed to load full widget:', error);

    // Show error state
    if (loader) {
      const button = loader.querySelector('button');
      if (button) {
        button.innerHTML = `
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        `;
      }
    }
  }
}
