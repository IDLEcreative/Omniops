/**
 * Rollout Simulation Configuration & Types
 *
 * Centralized configuration for all simulation scenarios:
 * - User counts per phase
 * - Browser and device types
 * - Network conditions
 * - Concurrency parameters
 */

export interface SimulatedUser {
  id: string;
  sessionId: string;
  domain: string;
  browser: string;
  device: string;
  network: string;
  features: {
    persistence: boolean;
    multiTab: boolean;
    crossPage: boolean;
  };
}

export const SIMULATION_CONFIG = {
  phase1Users: 1000,
  phase2Users: 100,
  phase3Users: 100,
  browsers: ['chrome', 'firefox', 'safari', 'edge'],
  devices: ['desktop', 'mobile', 'tablet'],
  networkConditions: ['3g', '4g', 'wifi'],
  concurrentUsers: 50,
};
