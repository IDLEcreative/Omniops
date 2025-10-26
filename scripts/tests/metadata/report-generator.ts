/**
 * Report Generator for Competency Test Results
 */

import { CompetencyReport } from './types';

export function generateReport(report: CompetencyReport): void {
  console.log();
  console.log('=' .repeat(80));
  console.log('📊 COMPETENCY REPORT');
  console.log('=' .repeat(80));
  console.log();

  console.log('ACCURACY BY CATEGORY:');
  console.log('-' .repeat(80));
  console.log(`Correction Tracking:       ${report.correctionAccuracy}% (baseline: ${report.baseline.correctionAccuracy}%, target: ${report.target.correctionAccuracy}%)`);
  console.log(`                           ${report.improvement.correctionAccuracy > 0 ? '↑' : '↓'} ${Math.abs(report.improvement.correctionAccuracy)}% improvement`);
  console.log();
  console.log(`List Reference:            ${report.listReferenceAccuracy}% (baseline: ${report.baseline.listReferenceAccuracy}%, target: ${report.target.listReferenceAccuracy}%)`);
  console.log(`                           ${report.improvement.listReferenceAccuracy > 0 ? '↑' : '↓'} ${Math.abs(report.improvement.listReferenceAccuracy)}% improvement`);
  console.log();
  console.log(`Pronoun Resolution:        ${report.pronounAccuracy}% (baseline: ${report.baseline.pronounAccuracy}%, target: ${report.target.pronounAccuracy}%)`);
  console.log(`                           ${report.improvement.pronounAccuracy > 0 ? '↑' : '↓'} ${Math.abs(report.improvement.pronounAccuracy)}% improvement`);
  console.log();
  console.log(`OVERALL ACCURACY:          ${report.overallAccuracy}% (baseline: ${report.baseline.overallAccuracy}%, target: ${report.target.overallAccuracy}%)`);
  console.log(`                           ${report.improvement.overallAccuracy > 0 ? '↑' : '↓'} ${Math.abs(report.improvement.overallAccuracy)}% improvement`);
  console.log();

  console.log('TEST DETAILS:');
  console.log('-' .repeat(80));
  console.log(`Total Tests:               ${report.details.total}`);
  console.log(`Passed:                    ${report.details.passed} ✅`);
  console.log(`Failed:                    ${report.details.failed} ❌`);
  console.log();
  console.log(`Correction Tests:          ${report.details.byCategory.correction.passed}/${report.details.byCategory.correction.total}`);
  console.log(`List Reference Tests:      ${report.details.byCategory.list_reference.passed}/${report.details.byCategory.list_reference.total}`);
  console.log(`Pronoun Resolution Tests:  ${report.details.byCategory.pronoun.passed}/${report.details.byCategory.pronoun.total}`);
  console.log();

  console.log('TARGET ACHIEVEMENT:');
  console.log('-' .repeat(80));
  const correctionMet = report.correctionAccuracy >= report.target.correctionAccuracy;
  const listMet = report.listReferenceAccuracy >= report.target.listReferenceAccuracy;
  const pronounMet = report.pronounAccuracy >= report.target.pronounAccuracy;
  const overallMet = report.overallAccuracy >= report.target.overallAccuracy;

  console.log(`Correction Target:         ${correctionMet ? '✅ MET' : '❌ NOT MET'} (${report.correctionAccuracy}% / ${report.target.correctionAccuracy}%)`);
  console.log(`List Reference Target:     ${listMet ? '✅ MET' : '❌ NOT MET'} (${report.listReferenceAccuracy}% / ${report.target.listReferenceAccuracy}%)`);
  console.log(`Pronoun Resolution Target: ${pronounMet ? '✅ MET' : '❌ NOT MET'} (${report.pronounAccuracy}% / ${report.target.pronounAccuracy}%)`);
  console.log(`Overall Target:            ${overallMet ? '✅ MET' : '❌ NOT MET'} (${report.overallAccuracy}% / ${report.target.overallAccuracy}%)`);
  console.log();

  if (overallMet) {
    console.log('🎉 SUCCESS! All target accuracies achieved.');
  } else {
    console.log('⚠️  Some targets not yet met. Continue improving the system.');
  }

  console.log('=' .repeat(80));
}
