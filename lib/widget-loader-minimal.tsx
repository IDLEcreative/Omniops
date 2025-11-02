/**
 * Minimal Widget Loader (Stage 1)
 *
 * Ultra-lightweight loader that shows immediately.
 * Lazy-loads the full widget only when user interacts.
 *
 * Size target: <20 KB
 */

import { useState, useEffect } from 'react';

interface LoaderProps {
  config: any;
  privacySettings: any;
  onLoadFull: () => void;
}

export function MinimalWidgetLoader({ config, privacySettings, onLoadFull }: LoaderProps) {
  const [isMinimized, setIsMinimized] = useState(true);
  const [hasLoadedFull, setHasLoadedFull] = useState(false);

  const appearance = config.appearance || {};
  const behavior = config.behavior || {};
  const position = appearance.position || 'bottom-right';

  const handleOpen = () => {
    if (!hasLoadedFull) {
      // Trigger lazy load of full widget
      setHasLoadedFull(true);
      onLoadFull();
    } else {
      setIsMinimized(false);
    }
  };

  // Position styles
  const positionStyles = position.includes('right')
    ? { right: '20px' }
    : { left: '20px' };

  const verticalStyles = position.includes('bottom')
    ? { bottom: '20px' }
    : { top: '20px' };

  if (!isMinimized && hasLoadedFull) {
    // Full widget has been loaded and is open
    return null; // Let full widget handle display
  }

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles,
        ...verticalStyles,
        zIndex: 9999,
      }}
    >
      {/* Minimized chat button */}
      <button
        onClick={handleOpen}
        style={{
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: appearance.primaryColor || '#3b82f6',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        }}
        aria-label="Open chat"
      >
        {/* Chat icon SVG */}
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>

        {/* Notification badge */}
        {appearance.showNotificationBadge && (
          <span
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              width: '12px',
              height: '12px',
              backgroundColor: '#ef4444',
              borderRadius: '50%',
              border: '2px solid white',
            }}
          />
        )}

        {/* Pulse animation */}
        {appearance.showPulseAnimation && (
          <span
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              borderRadius: '50%',
              border: `2px solid ${appearance.primaryColor || '#3b82f6'}`,
              animation: 'pulse 2s infinite',
              opacity: 0.5,
            }}
          />
        )}
      </button>

      {/* Loading indicator when full widget is loading */}
      {hasLoadedFull && isMinimized && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '10px',
            color: 'white',
          }}
        >
          Loading...
        </div>
      )}

      {/* Pulse animation keyframes */}
      <style>{`
        @keyframes pulse {
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
      `}</style>
    </div>
  );
}
