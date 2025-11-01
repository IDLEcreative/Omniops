/**
 * Performance Monitoring and Optimization Utilities
 * Tracks performance metrics and provides insights for optimization
 */

export * from './types';
export { PerformanceMonitor } from './monitor';
export { ResourceMonitor } from './resource-monitor';
export { PerformanceAnalyzer } from './analysis';
export { MetricsCollector } from './metrics';

// Singleton instances
import { PerformanceMonitor } from './monitor';
import { ResourceMonitor } from './resource-monitor';

export const perfMonitor = new PerformanceMonitor();
export const resourceMonitor = new ResourceMonitor();

/**
 * Performance decorator for class methods
 */
export function measurePerformance(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    const methodName = `${target.constructor.name}.${propertyKey}`;
    return perfMonitor.measure(methodName, () => originalMethod.apply(this, args));
  };

  return descriptor;
}

// Auto-monitor in development
if (process.env.NODE_ENV === 'development') {
  // Take memory snapshots every minute
  setInterval(() => {
    resourceMonitor.takeSnapshot();
    const warnings = resourceMonitor.checkForLeaks();
    if (warnings.length > 0) {
      console.warn('[ResourceMonitor] Warnings:', warnings);
    }
  }, 60000);
}
