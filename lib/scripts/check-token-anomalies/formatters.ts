import { AnomalyResult } from './core';

export function printAnomalies(anomalies: AnomalyResult[]): void {
  console.log('\n🔍 Token Usage Anomaly Detection Report');
  console.log('='.repeat(70));

  anomalies.forEach((anomaly, index) => {
    const icon = anomaly.severity === 'critical' ? '🔴' :
                 anomaly.severity === 'warning' ? '🟡' : '🟢';

    console.log(`\n${icon} Anomaly #${index + 1}: ${anomaly.type.toUpperCase()}`);
    console.log(`   Severity: ${anomaly.severity}`);
    console.log(`   Message: ${anomaly.message}`);

    if (anomaly.details) {
      console.log('   Details:');
      Object.entries(anomaly.details).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          console.log(`     ${key}: ${value.length} items`);
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
    console.log(`\n⚠️  ${critical} CRITICAL anomalies require immediate attention`);
  }
  if (warnings > 0) {
    console.log(`\n⚡ ${warnings} warnings detected`);
  }
  if (critical === 0 && warnings === 0) {
    console.log('\n✅ No critical issues found');
  }
}
