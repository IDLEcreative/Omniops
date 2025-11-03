/**
 * AnimationStyles Component
 *
 * Generates CSS animations for the minimized widget icon based on configuration.
 * Supports multiple animation types with configurable speed and intensity.
 * Respects user's prefers-reduced-motion setting for accessibility.
 */

interface AnimationStylesProps {
  animationType: 'none' | 'pulse' | 'bounce' | 'rotate' | 'fade' | 'wiggle';
  animationSpeed: 'slow' | 'normal' | 'fast';
  animationIntensity: 'subtle' | 'normal' | 'strong';
}

export function AnimationStyles({
  animationType,
  animationSpeed,
  animationIntensity,
}: AnimationStylesProps) {
  if (animationType === 'none') {
    return null;
  }

  // Map speed to duration
  const duration = animationSpeed === 'slow' ? '4s' : animationSpeed === 'fast' ? '1s' : '2s';

  // Map intensity to scale factor
  const intensityMultiplier = animationIntensity === 'subtle' ? 0.5 : animationIntensity === 'strong' ? 1.5 : 1;

  // Generate animation-specific CSS with intensity adjustments
  const getAnimationCSS = () => {
    switch (animationType) {
      case 'pulse':
        const pulseScale = 1 + (0.05 * intensityMultiplier);
        const pulseOpacity = 1 - (0.1 * intensityMultiplier);
        return `
          @keyframes widget-pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(${pulseScale}); opacity: ${pulseOpacity}; }
          }
          .widget-icon-animated {
            animation: widget-pulse ${duration} ease-in-out infinite;
          }
        `;

      case 'bounce':
        const bounceHeight = 10 * intensityMultiplier;
        return `
          @keyframes widget-bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-${bounceHeight}px); }
          }
          .widget-icon-animated {
            animation: widget-bounce ${duration} ease-in-out infinite;
          }
        `;

      case 'rotate':
        return `
          @keyframes widget-rotate {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .widget-icon-animated {
            animation: widget-rotate ${duration} linear infinite;
          }
        `;

      case 'fade':
        const fadeOpacity = 1 - (0.4 * intensityMultiplier);
        return `
          @keyframes widget-fade {
            0%, 100% { opacity: 1; }
            50% { opacity: ${Math.max(0.3, fadeOpacity)}; }
          }
          .widget-icon-animated {
            animation: widget-fade ${duration} ease-in-out infinite;
          }
        `;

      case 'wiggle':
        const wiggleAngle = 5 * intensityMultiplier;
        return `
          @keyframes widget-wiggle {
            0%, 100% { transform: rotate(0deg); }
            25% { transform: rotate(-${wiggleAngle}deg); }
            75% { transform: rotate(${wiggleAngle}deg); }
          }
          .widget-icon-animated {
            animation: widget-wiggle ${duration} ease-in-out infinite;
          }
        `;

      default:
        return '';
    }
  };

  return (
    <style>
      {`
        ${getAnimationCSS()}

        /* Respect user's motion preferences */
        @media (prefers-reduced-motion: reduce) {
          .widget-icon-animated {
            animation: none !important;
          }
        }
      `}
    </style>
  );
}

/**
 * Utility function to get animation class name
 */
export function getAnimationClassName(animationType: string): string {
  return animationType !== 'none' ? 'widget-icon-animated' : '';
}
