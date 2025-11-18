import { AnomalyResult } from './core';

export function printAnomalies(anomalies: AnomalyResult[]): void {
  console.log('='.repeat(70));

  anomalies.forEach((anomaly, index) => {
    const icon = anomaly.severity === 'critical' ? '🔴' :
                 anomaly.severity === 'warning' ? '🟡' : '🟢';

    console.log(`\n${icon} Anomaly #${index + 1}: ${anomaly.type.toUpperCase()}`);

    if (anomaly.details) {
      Object.entries(anomaly.details).forEach(([key, value]) => {
        if (Array.isArray(value)) {
        } else {
          console.log(`     ${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`);
        }
      });
    }
  });

  console.log('\n' + '='.repeat(70));

  const critical = anomalies.filter(a => a.severity === 'critical').length;
  const warnings = anomalies.filter(a => a.severity === 'warning').length;

  if (critical > 0) {
  }
  if (warnings > 0) {
  }
  if (critical === 0 && warnings === 0) {
  }
}
