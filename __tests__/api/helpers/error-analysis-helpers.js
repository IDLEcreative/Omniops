/**
 * Error Analysis Helper Functions
 * Shared utilities for error handling analysis
 */

class ErrorFindingTracker {
  constructor() {
    this.findings = [];
  }

  addFinding(file, line, pattern, description, suggestion, severity) {
    this.findings.push({
      file,
      line,
      pattern,
      description,
      suggestion,
      severity,
    });
  }

  getFindings() {
    return this.findings;
  }

  getGroupedBySeverity() {
    return {
      critical: this.findings.filter(f => f.severity === 'critical'),
      high: this.findings.filter(f => f.severity === 'high'),
      medium: this.findings.filter(f => f.severity === 'medium'),
      low: this.findings.filter(f => f.severity === 'low'),
    };
  }

  calculateRiskScore() {
    const bySeverity = this.getGroupedBySeverity();
    return (bySeverity.critical.length * 10) +
           (bySeverity.high.length * 5) +
           (bySeverity.medium.length * 2) +
           (bySeverity.low.length * 0.5);
  }
}

function printFinding(finding) {
  console.log(`${finding.file}${finding.line ? `:${finding.line}` : ''}`);
  console.log(`  Pattern: ${finding.pattern}`);
  console.log(`  Issue: ${finding.description}`);
  console.log(`  Suggestion:\n    ${finding.suggestion.split('\n').join('\n    ')}`);
  console.log();
}

module.exports = {
  ErrorFindingTracker,
  printFinding
};
