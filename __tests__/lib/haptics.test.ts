/**
 * Haptic Feedback Utility Tests
 *
 * Tests haptic feedback functionality with graceful degradation
 */

import {
  triggerHaptic,
  isHapticSupported,
  hapticLight,
  hapticMedium,
  hapticHeavy,
  hapticSuccess,
  hapticWarning,
  hapticError,
  hapticSwipe,
  hapticProductChange,
  getHapticInfo,
  cancelHaptic,
} from '@/lib/haptics';

describe('Haptic Feedback Utility', () => {
  let vibrateMock: jest.Mock;

  beforeEach(() => {
    vibrateMock = jest.fn();
    // Mock navigator.vibrate
    Object.defineProperty(navigator, 'vibrate', {
      writable: true,
      value: vibrateMock,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isHapticSupported', () => {
    it('should return true when vibration API is available', () => {
      expect(isHapticSupported()).toBe(true);
    });

    it('should return false when vibration API is not available', () => {
      // Save original
      const originalVibrate = Object.getOwnPropertyDescriptor(
        navigator,
        'vibrate'
      );

      // Remove vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        configurable: true,
      });

      expect(isHapticSupported()).toBe(false);

      // Restore
      if (originalVibrate) {
        Object.defineProperty(navigator, 'vibrate', originalVibrate);
      }
    });
  });

  describe('triggerHaptic', () => {
    it('should trigger light haptic with correct duration', () => {
      triggerHaptic('light');
      expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('should trigger medium haptic with correct duration', () => {
      triggerHaptic('medium');
      expect(vibrateMock).toHaveBeenCalledWith(50);
    });

    it('should trigger heavy haptic with correct duration', () => {
      triggerHaptic('heavy');
      expect(vibrateMock).toHaveBeenCalledWith(100);
    });

    it('should trigger success pattern', () => {
      triggerHaptic('success');
      expect(vibrateMock).toHaveBeenCalledWith([50, 100, 50]);
    });

    it('should trigger warning pattern', () => {
      triggerHaptic('warning');
      expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('should trigger error pattern', () => {
      triggerHaptic('error');
      expect(vibrateMock).toHaveBeenCalledWith([100, 100, 100]);
    });

    it('should return false when haptic is not supported', () => {
      const originalVibrate = Object.getOwnPropertyDescriptor(
        navigator,
        'vibrate'
      );

      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        configurable: true,
      });

      const result = triggerHaptic('light');
      expect(result).toBe(false);

      // Restore
      if (originalVibrate) {
        Object.defineProperty(navigator, 'vibrate', originalVibrate);
      }
    });

    it('should return true when haptic is successfully triggered', () => {
      const result = triggerHaptic('medium');
      expect(result).toBe(true);
    });
  });

  describe('Convenience functions', () => {
    it('hapticLight should trigger light pattern', () => {
      hapticLight();
      expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('hapticMedium should trigger medium pattern', () => {
      hapticMedium();
      expect(vibrateMock).toHaveBeenCalledWith(50);
    });

    it('hapticHeavy should trigger heavy pattern', () => {
      hapticHeavy();
      expect(vibrateMock).toHaveBeenCalledWith(100);
    });

    it('hapticSuccess should trigger success pattern', () => {
      hapticSuccess();
      expect(vibrateMock).toHaveBeenCalledWith([50, 100, 50]);
    });

    it('hapticWarning should trigger warning pattern', () => {
      hapticWarning();
      expect(vibrateMock).toHaveBeenCalledWith([100, 50, 100]);
    });

    it('hapticError should trigger error pattern', () => {
      hapticError();
      expect(vibrateMock).toHaveBeenCalledWith([100, 100, 100]);
    });
  });

  describe('hapticSwipe', () => {
    it('should trigger light haptic for low velocity', () => {
      hapticSwipe(0.2);
      expect(vibrateMock).toHaveBeenCalledWith(10);
    });

    it('should trigger medium haptic for medium velocity', () => {
      hapticSwipe(0.5);
      expect(vibrateMock).toHaveBeenCalledWith(50);
    });

    it('should trigger heavy haptic for high velocity', () => {
      hapticSwipe(0.9);
      expect(vibrateMock).toHaveBeenCalledWith(100);
    });

    it('should clamp velocity to 0-1 range', () => {
      hapticSwipe(1.5); // Should be clamped to 1.0
      expect(vibrateMock).toHaveBeenCalledWith(100);

      vibrateMock.mockClear();

      hapticSwipe(-0.5); // Should be clamped to 0
      expect(vibrateMock).toHaveBeenCalledWith(10);
    });
  });

  describe('hapticProductChange', () => {
    it('should trigger very subtle vibration', () => {
      hapticProductChange();
      expect(vibrateMock).toHaveBeenCalledWith(5);
    });

    it('should return false when not supported', () => {
      const originalVibrate = Object.getOwnPropertyDescriptor(
        navigator,
        'vibrate'
      );

      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        configurable: true,
      });

      const result = hapticProductChange();
      expect(result).toBe(false);

      // Restore
      if (originalVibrate) {
        Object.defineProperty(navigator, 'vibrate', originalVibrate);
      }
    });
  });

  describe('cancelHaptic', () => {
    it('should call vibrate with 0 to cancel', () => {
      cancelHaptic();
      expect(vibrateMock).toHaveBeenCalledWith(0);
    });

    it('should not throw when vibrate is not available', () => {
      const originalVibrate = Object.getOwnPropertyDescriptor(
        navigator,
        'vibrate'
      );

      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        configurable: true,
      });

      expect(() => cancelHaptic()).not.toThrow();

      // Restore
      if (originalVibrate) {
        Object.defineProperty(navigator, 'vibrate', originalVibrate);
      }
    });
  });

  describe('getHapticInfo', () => {
    it('should return haptic support information', () => {
      const info = getHapticInfo();

      expect(info).toHaveProperty('supported');
      expect(info).toHaveProperty('vibrationAPI');
      expect(info).toHaveProperty('iOSHaptic');
      expect(info).toHaveProperty('userAgent');

      expect(info.supported).toBe(true);
      expect(info.vibrationAPI).toBe(true);
      expect(info.iOSHaptic).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('should handle vibrate API errors gracefully', () => {
      vibrateMock.mockImplementation(() => {
        throw new Error('Vibration failed');
      });

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      const result = triggerHaptic('medium');

      expect(result).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Haptic feedback failed:',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Performance', () => {
    it('should execute haptic feedback quickly', () => {
      const start = performance.now();
      hapticMedium();
      const duration = performance.now() - start;

      // Should execute in less than 10ms
      expect(duration).toBeLessThan(10);
    });

    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 10; i++) {
        hapticLight();
      }

      expect(vibrateMock).toHaveBeenCalledTimes(10);
    });
  });
});
