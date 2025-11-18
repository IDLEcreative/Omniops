/**
 * Manual test for cursor-based pagination
 *
 * Run with: npx tsx scripts/tests/test-pagination-manual.ts
 */

// Test cursor encoding/decoding
function encodeCursor(score: number, id: string): string {
  return Buffer.from(`${score}:${id}`).toString('base64');
}

function decodeCursor(cursor: string): { score: number; id: string } {
  const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
  const [scoreStr, id] = decoded.split(':');
  return {
    score: parseFloat(scoreStr || '0'),
    id: id || ''
  };
}

// Test cursor encoding/decoding
console.log('🧪 Testing cursor encoding/decoding...\n');

const testCases = [
  { score: 0.95, id: 'msg-123' },
  { score: 0.5, id: 'msg-456' },
  { score: 0.1, id: 'msg-789' },
  { score: 1.0, id: 'msg-000' },
];

let allPassed = true;

testCases.forEach((testCase, idx) => {
  const encoded = encodeCursor(testCase.score, testCase.id);
  const decoded = decodeCursor(encoded);

  const scoreMatch = Math.abs(decoded.score - testCase.score) < 0.0001;
  const idMatch = decoded.id === testCase.id;

  if (scoreMatch && idMatch) {
    console.log(`✅ Test ${idx + 1}: PASSED`);
    console.log(`   Score: ${testCase.score} -> ${encoded} -> ${decoded.score}`);
    console.log(`   ID: ${testCase.id} -> ${decoded.id}\n`);
  } else {
    console.log(`❌ Test ${idx + 1}: FAILED`);
    console.log(`   Expected: score=${testCase.score}, id=${testCase.id}`);
    console.log(`   Got: score=${decoded.score}, id=${decoded.id}\n`);
    allPassed = false;
  }
});

// Test pagination filtering logic
console.log('🧪 Testing pagination filtering logic...\n');

interface TestResult {
  messageId: string;
  combinedScore: number;
}

const mockResults: TestResult[] = [
  { messageId: 'msg-1', combinedScore: 0.95 },
  { messageId: 'msg-2', combinedScore: 0.90 },
  { messageId: 'msg-3', combinedScore: 0.85 },
  { messageId: 'msg-4', combinedScore: 0.80 },
  { messageId: 'msg-5', combinedScore: 0.75 },
  { messageId: 'msg-6', combinedScore: 0.70 },
  { messageId: 'msg-7', combinedScore: 0.65 },
  { messageId: 'msg-8', combinedScore: 0.60 },
  { messageId: 'msg-9', combinedScore: 0.55 },
  { messageId: 'msg-10', combinedScore: 0.50 },
];

// Simulate first page (limit 5)
const limit = 5;
const paginatedResults = mockResults.slice(0, limit + 1);
const hasMore = paginatedResults.length > limit;
const page1Results = paginatedResults.slice(0, limit);

console.log('Page 1:');
console.log(`  Results: ${page1Results.length}`);
console.log(`  Has more: ${hasMore}`);
console.log(`  IDs: ${page1Results.map(r => r.messageId).join(', ')}`);

if (page1Results.length === 5 && hasMore) {
  console.log('✅ First page pagination: PASSED\n');
} else {
  console.log('❌ First page pagination: FAILED\n');
  allPassed = false;
}

// Simulate second page using cursor
const cursorScore = page1Results[page1Results.length - 1].combinedScore;
const cursorId = page1Results[page1Results.length - 1].messageId;

const afterCursor = mockResults.filter(r => {
  return r.combinedScore < cursorScore ||
         (r.combinedScore === cursorScore && r.messageId > cursorId);
});

const page2PaginatedResults = afterCursor.slice(0, limit + 1);
const page2HasMore = page2PaginatedResults.length > limit;
const page2Results = page2PaginatedResults.slice(0, limit);

console.log('Page 2 (using cursor):');
console.log(`  Results: ${page2Results.length}`);
console.log(`  Has more: ${page2HasMore}`);
console.log(`  IDs: ${page2Results.map(r => r.messageId).join(', ')}`);

if (page2Results.length === 5 && !page2HasMore) {
  console.log('✅ Second page pagination: PASSED\n');
} else {
  console.log('❌ Second page pagination: FAILED\n');
  allPassed = false;
}

// Verify no overlap
const page1Ids = new Set(page1Results.map(r => r.messageId));
const page2Ids = new Set(page2Results.map(r => r.messageId));
const overlap = [...page1Ids].filter(id => page2Ids.has(id));

if (overlap.length === 0) {
  console.log('✅ No overlap between pages: PASSED\n');
} else {
  console.log(`❌ Overlap detected: ${overlap.join(', ')}\n`);
  allPassed = false;
}

// Test edge case: empty results
console.log('🧪 Testing edge cases...\n');

const emptyResults: TestResult[] = [];
const emptyPaginated = emptyResults.slice(0, limit + 1);
const emptyHasMore = emptyPaginated.length > limit;
const emptyFinal = emptyPaginated.slice(0, limit);

console.log('Empty results:');
console.log(`  Results: ${emptyFinal.length}`);
console.log(`  Has more: ${emptyHasMore}`);

if (emptyFinal.length === 0 && !emptyHasMore) {
  console.log('✅ Empty results handling: PASSED\n');
} else {
  console.log('❌ Empty results handling: FAILED\n');
  allPassed = false;
}

// Test edge case: results < limit
const fewResults: TestResult[] = [
  { messageId: 'msg-1', combinedScore: 0.95 },
  { messageId: 'msg-2', combinedScore: 0.90 },
  { messageId: 'msg-3', combinedScore: 0.85 },
];

const fewPaginated = fewResults.slice(0, limit + 1);
const fewHasMore = fewPaginated.length > limit;
const fewFinal = fewPaginated.slice(0, limit);

console.log('Few results (< limit):');
console.log(`  Results: ${fewFinal.length}`);
console.log(`  Has more: ${fewHasMore}`);

if (fewFinal.length === 3 && !fewHasMore) {
  console.log('✅ Few results handling: PASSED\n');
} else {
  console.log('❌ Few results handling: FAILED\n');
  allPassed = false;
}

// Final summary
console.log('\n' + '='.repeat(50));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.log('❌ SOME TESTS FAILED');
  process.exit(1);
}
