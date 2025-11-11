export function printSummaryReport(queryCount: number, domain: string, threshold = 0.15) {
  console.log('\n\n╔════════════════════════════════════════════════════════════╗');
  console.log('║                    SUMMARY REPORT                          ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  console.log('## Test Execution Summary\n');
  console.log(`Total Queries Tested: ${queryCount}`);
  console.log(`Test Domain: ${domain}`);
  console.log(`Similarity Threshold: ${threshold}`);

  console.log('\n## Key Findings\n');
  console.log('See detailed results above for:');
  console.log('1. Query variation results and chunk type distribution');
  console.log('2. Similarity score distributions across thresholds');
  console.log('3. Chunk index impact on ranking');
  console.log('4. search_embeddings function behavior analysis');

  console.log('\n## Recommendations\n');
  console.log('Based on the analysis above, recommendations will be generated in the final report.');
}
