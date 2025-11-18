/**
 * Anomaly Detection Tests
 *
 * Tests the anomaly detection algorithms to ensure accurate detection
 * of unusual patterns in metrics.
 */

import {
  detectThresholdAnomaly,
  detectPercentageAnomaly,
  detectPatternAnomaly,
  detectAnomalies,
  calculateBaselines,
  type AnomalyMetric,
  type HistoricalDataPoint,
} from '@/lib/analytics/anomaly-detector';

describe('Anomaly Detector', () => {
  describe('detectThresholdAnomaly', () => {
    it('should detect anomaly when current value exceeds threshold', () => {
      const historicalValues = [2.0, 2.1, 2.2, 2.0, 2.1, 2.0, 2.2];
      const currentValue = 5.5; // Way above normal
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectThresholdAnomaly(currentValue, historicalValues, metric);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.severity).toBe('critical');
      expect(anomaly?.metric).toBe('responseTime');
      expect(anomaly?.currentValue).toBe(5.5);
      expect(anomaly?.percentChange).toBeGreaterThan(100);
    });

    it('should not detect anomaly for normal values', () => {
      const historicalValues = [2.0, 2.1, 2.2, 2.0, 2.1, 2.0, 2.2];
      const currentValue = 2.15; // Within normal range
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectThresholdAnomaly(currentValue, historicalValues, metric);

      expect(anomaly).toBeNull();
    });

    it('should return null when insufficient data points', () => {
      const historicalValues = [2.0, 2.1]; // Only 2 points
      const currentValue = 5.5;
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectThresholdAnomaly(currentValue, historicalValues, metric, {
        minDataPoints: 7,
      });

      expect(anomaly).toBeNull();
    });

    it('should detect deviation when standard deviation is zero', () => {
      const historicalValues = [2.0, 2.0, 2.0, 2.0, 2.0, 2.0, 2.0]; // All same values, need 7 for minDataPoints
      const currentValue = 4.0; // Different value
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectThresholdAnomaly(currentValue, historicalValues, metric);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.percentChange).toBe(100); // 2x the baseline
    });
  });

  describe('detectPercentageAnomaly', () => {
    it('should detect anomaly when percent change exceeds threshold', () => {
      const baselineValue = 2.0;
      const currentValue = 3.5; // 75% increase
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPercentageAnomaly(currentValue, baselineValue, metric, {
        percentChangeThreshold: 40,
      });

      expect(anomaly).not.toBeNull();
      expect(anomaly?.severity).toBe('warning'); // 75% is warning level for responseTime (critical is 100%)
      expect(anomaly?.percentChange).toBe(75);
    });

    it('should not detect anomaly for small changes', () => {
      const baselineValue = 2.0;
      const currentValue = 2.3; // 15% increase
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPercentageAnomaly(currentValue, baselineValue, metric, {
        percentChangeThreshold: 40,
      });

      expect(anomaly).toBeNull();
    });

    it('should handle baseline of zero', () => {
      const baselineValue = 0;
      const currentValue = 5;
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPercentageAnomaly(currentValue, baselineValue, metric);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.severity).toBe('critical');
      expect(anomaly?.percentChange).toBe(100);
    });

    it('should detect negative anomalies (decreases)', () => {
      const baselineValue = 4.5;
      const currentValue = 2.0; // 55% decrease
      const metric: AnomalyMetric = 'satisfactionScore';

      const anomaly = detectPercentageAnomaly(currentValue, baselineValue, metric, {
        percentChangeThreshold: 40,
      });

      expect(anomaly).not.toBeNull();
      expect(anomaly?.percentChange).toBeLessThan(0);
    });
  });

  describe('detectPatternAnomaly', () => {
    it('should detect sudden spike', () => {
      const recentValues = [2.0, 2.1, 2.0, 2.2, 10.0]; // Last value is spike
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPatternAnomaly(recentValues, metric);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.severity).toBe('critical'); // 382% increase is critical
      expect(anomaly?.message).toContain('spike');
    });

    it('should detect sudden drop', () => {
      const recentValues = [4.5, 4.6, 4.4, 4.5, 1.0]; // Last value is drop
      const metric: AnomalyMetric = 'satisfactionScore';

      const anomaly = detectPatternAnomaly(recentValues, metric);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.message).toContain('drop');
    });

    it('should not detect anomaly for gradual changes', () => {
      const recentValues = [2.0, 2.1, 2.2, 2.3, 2.4]; // Gradual increase
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPatternAnomaly(recentValues, metric);

      expect(anomaly).toBeNull();
    });

    it('should return null for insufficient data', () => {
      const recentValues = [2.0, 2.1]; // Only 2 values
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPatternAnomaly(recentValues, metric);

      expect(anomaly).toBeNull();
    });
  });

  describe('detectAnomalies (Combined)', () => {
    it('should detect multiple anomalies across metrics', () => {
      const currentMetrics: Partial<Record<AnomalyMetric, number>> = {
        responseTime: 5.5, // Anomaly
        satisfactionScore: 2.0, // Anomaly (drop)
        bounceRate: 85, // Anomaly
        conversionRate: 5, // Normal
      };

      const historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>> = {
        responseTime: [
          { value: 2.0, timestamp: '2025-11-10' },
          { value: 2.1, timestamp: '2025-11-11' },
          { value: 2.0, timestamp: '2025-11-12' },
          { value: 2.2, timestamp: '2025-11-13' },
          { value: 2.1, timestamp: '2025-11-14' },
          { value: 2.0, timestamp: '2025-11-15' },
          { value: 2.2, timestamp: '2025-11-16' },
        ],
        satisfactionScore: [
          { value: 4.5, timestamp: '2025-11-10' },
          { value: 4.6, timestamp: '2025-11-11' },
          { value: 4.4, timestamp: '2025-11-12' },
          { value: 4.5, timestamp: '2025-11-13' },
          { value: 4.6, timestamp: '2025-11-14' },
          { value: 4.5, timestamp: '2025-11-15' },
          { value: 4.4, timestamp: '2025-11-16' },
        ],
        bounceRate: [
          { value: 35, timestamp: '2025-11-10' },
          { value: 38, timestamp: '2025-11-11' },
          { value: 36, timestamp: '2025-11-12' },
          { value: 37, timestamp: '2025-11-13' },
          { value: 35, timestamp: '2025-11-14' },
          { value: 38, timestamp: '2025-11-15' },
          { value: 36, timestamp: '2025-11-16' },
        ],
      };

      const anomalies = detectAnomalies(currentMetrics, historicalData);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies.some(a => a.metric === 'responseTime')).toBe(true);
      expect(anomalies.some(a => a.metric === 'satisfactionScore')).toBe(true);
      expect(anomalies.some(a => a.metric === 'bounceRate')).toBe(true);
    });

    it('should sort anomalies by severity', () => {
      const currentMetrics: Partial<Record<AnomalyMetric, number>> = {
        responseTime: 6.0, // Critical
        satisfactionScore: 3.5, // Warning
      };

      const historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>> = {
        responseTime: Array(7).fill({ value: 2.0 }).map((v, i) => ({ ...v, timestamp: `2025-11-${10 + i}` })),
        satisfactionScore: Array(7).fill({ value: 4.5 }).map((v, i) => ({ ...v, timestamp: `2025-11-${10 + i}` })),
      };

      const anomalies = detectAnomalies(currentMetrics, historicalData);

      expect(anomalies.length).toBeGreaterThanOrEqual(1);
      // First anomaly should be critical (responseTime)
      if (anomalies.length > 1) {
        expect(anomalies[0].severity).toBe('critical');
      }
    });

    it('should include recommendations for anomalies', () => {
      const currentMetrics: Partial<Record<AnomalyMetric, number>> = {
        responseTime: 5.5,
      };

      const historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>> = {
        responseTime: Array(7).fill({ value: 2.0 }).map((v, i) => ({ ...v, timestamp: `2025-11-${10 + i}` })),
      };

      const anomalies = detectAnomalies(currentMetrics, historicalData);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].recommendation).toBeDefined();
      expect(anomalies[0].recommendation).toContain('server load');
    });
  });

  describe('calculateBaselines', () => {
    it('should calculate mean, median, and stdDev for historical data', () => {
      const historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>> = {
        responseTime: [
          { value: 2.0, timestamp: '2025-11-10' },
          { value: 2.2, timestamp: '2025-11-11' },
          { value: 2.1, timestamp: '2025-11-12' },
          { value: 2.3, timestamp: '2025-11-13' },
          { value: 2.0, timestamp: '2025-11-14' },
        ],
      };

      const baselines = calculateBaselines(historicalData);

      expect(baselines.responseTime).toBeDefined();
      expect(baselines.responseTime?.mean).toBeCloseTo(2.12, 1);
      expect(baselines.responseTime?.median).toBe(2.1);
      expect(baselines.responseTime?.stdDev).toBeGreaterThan(0);
    });

    it('should handle empty historical data', () => {
      const historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>> = {};

      const baselines = calculateBaselines(historicalData);

      expect(Object.keys(baselines).length).toBe(0);
    });
  });

  describe('Severity Determination', () => {
    it('should assign critical severity for large deviations', () => {
      const historicalValues = Array(7).fill(2.0);
      const currentValue = 6.0; // 200% increase
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPercentageAnomaly(currentValue, 2.0, metric);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.severity).toBe('critical');
    });

    it('should assign warning severity for moderate deviations', () => {
      const historicalValues = Array(7).fill(2.0);
      const currentValue = 3.5; // 75% increase (warning range)
      const metric: AnomalyMetric = 'responseTime';

      const anomaly = detectPercentageAnomaly(currentValue, 2.0, metric);

      expect(anomaly).not.toBeNull();
      expect(anomaly?.severity).toBe('warning');
    });
  });

  describe('Message Generation', () => {
    it('should generate descriptive messages for anomalies', () => {
      const currentMetrics: Partial<Record<AnomalyMetric, number>> = {
        responseTime: 5.5,
      };

      const historicalData: Partial<Record<AnomalyMetric, HistoricalDataPoint[]>> = {
        responseTime: Array(7).fill({ value: 2.0 }).map((v, i) => ({ ...v, timestamp: `2025-11-${10 + i}` })),
      };

      const anomalies = detectAnomalies(currentMetrics, historicalData);

      expect(anomalies.length).toBeGreaterThan(0);
      expect(anomalies[0].message).toContain('Response time');
      expect(anomalies[0].message).toContain('increased');
      expect(anomalies[0].message).toContain('%');
    });
  });
});
