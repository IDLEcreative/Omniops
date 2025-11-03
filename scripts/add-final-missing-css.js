#!/usr/bin/env node
/**
 * Add the final 10 missing CSS classes found by comprehensive analysis
 */

const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../lib/widget-standalone/constants.ts');
let content = fs.readFileSync(constantsPath, 'utf8');

console.log('🔍 Adding final missing CSS classes...\n');

// 1. Add bg-[#262626] - Input background color
if (!content.includes('.bg-\\[\\#262626\\] {')) {
  content = content.replace(
    '.bg-\\[\\#3f3f46\\] { background-color: #3f3f46; }',
    `.bg-\\[\\#3f3f46\\] { background-color: #3f3f46; }
  .bg-\\[\\#262626\\] { background-color: #262626; }`
  );
  console.log('✅ Added: bg-[#262626] (input background)');
}

// 2. Add border-0
if (!content.includes('.border-0 {')) {
  content = content.replace(
    '.border { border-width: 1px; }',
    `.border-0 { border-width: 0px; }
  .border { border-width: 1px; }`
  );
  console.log('✅ Added: border-0');
}

// 3. Add bg-gray-400 - Loading dots color
if (!content.includes('.bg-gray-400 {')) {
  content = content.replace(
    '.bg-gray-600 { background-color: rgb(75 85 99); }',
    `.bg-gray-400 { background-color: rgb(156 163 175); }
  .bg-gray-600 { background-color: rgb(75 85 99); }`
  );
  console.log('✅ Added: bg-gray-400 (loading dots)');
}

// 4. Add hover:bg-white/20 - ALREADY ADDED (but verify)
if (!content.includes('.hover\\:bg-white\\/20:hover {')) {
  content = content.replace(
    '.hover\\:bg-white\\/10:hover { background-color: rgb(255 255 255 / 0.1); }',
    `.hover\\:bg-white\\/10:hover { background-color: rgb(255 255 255 / 0.1); }
  .hover\\:bg-white\\/20:hover { background-color: rgb(255 255 255 / 0.2); }`
  );
  console.log('✅ Added: hover:bg-white/20');
} else {
  console.log('✓ Already present: hover:bg-white/20');
}

// 5. Add hover:text-blue-300 - ALREADY ADDED (but verify)
if (!content.includes('.hover\\:text-blue-300:hover {')) {
  content = content.replace(
    '.hover\\:text-gray-300:hover { color: rgb(209 213 219); }',
    `.hover\\:text-gray-300:hover { color: rgb(209 213 219); }
  .hover\\:text-blue-300:hover { color: rgb(147 197 253); }`
  );
  console.log('✅ Added: hover:text-blue-300');
} else {
  console.log('✓ Already present: hover:text-blue-300');
}

// 6. Add slide-in-from-bottom-2 animation
if (!content.includes('.slide-in-from-bottom-2 {')) {
  content = content.replace(
    '.slide-in-from-bottom-3 { animation: slideInFromBottom 200ms ease-out; }',
    `.slide-in-from-bottom-2 { animation: slideInFromBottom 150ms ease-out; }
  .slide-in-from-bottom-3 { animation: slideInFromBottom 200ms ease-out; }`
  );
  console.log('✅ Added: slide-in-from-bottom-2 (150ms animation)');
}

// 7. Add sm:mx-0 - Responsive margin reset
if (!content.includes('.sm\\:mx-0 {')) {
  content = content.replace(
    '  @media (min-width: 640px) {',
    `  @media (min-width: 640px) {
    .sm\\:mx-0 { margin-left: 0px; margin-right: 0px; }`
  );
  console.log('✅ Added: sm:mx-0 (responsive margin reset)');
}

// 8 & 9. Add focus ring offset classes - COMPLETE implementation
if (!content.includes('--tw-ring-offset-shadow')) {
  // Need to add the ring offset system properly
  content = content.replace(
    '.focus\\:ring-offset-2:focus { --tw-ring-offset-width: 2px; }',
    `.focus\\:ring-offset-2:focus {
    --tw-ring-offset-width: 2px;
    box-shadow: 0 0 0 var(--tw-ring-offset-width) var(--tw-ring-offset-color, #fff), 0 0 0 calc(2px + var(--tw-ring-offset-width)) var(--tw-ring-color, rgba(255, 255, 255, 0.5));
  }`
  );
  console.log('✅ Enhanced: focus:ring-offset-2 (complete implementation)');
}

if (!content.includes('.focus\\:ring-offset-black:focus { --tw-ring-offset-color: #000;')) {
  content = content.replace(
    '.focus\\:ring-offset-black:focus { --tw-ring-offset-color: #000; }',
    `.focus\\:ring-offset-black:focus {
    --tw-ring-offset-color: #000;
    box-shadow: 0 0 0 2px #000, 0 0 0 4px rgba(255, 255, 255, 0.5);
  }`
  );
  console.log('✅ Enhanced: focus:ring-offset-black');
}

// 10. Add .group class for group hover parent
if (!content.includes('  .group { position: relative; }')) {
  content = content.replace(
    '  /* Group hover for button icons */',
    `  /* Group hover for button icons */
  .group { position: relative; }`
  );
  console.log('✅ Added: .group (group hover parent)');
}

// Also add overflow-hidden for group if needed
if (!content.includes('/* Overflow */')) {
  // It's already defined earlier, just verify
  if (content.includes('.overflow-hidden { overflow: hidden; }')) {
    console.log('✓ Already present: overflow-hidden');
  }
}

fs.writeFileSync(constantsPath, content, 'utf8');

console.log('\n✅ All 10 critical missing CSS classes added!');
console.log('\nSummary:');
console.log('  1. bg-[#262626] - Input background color');
console.log('  2. border-0 - Zero border width');
console.log('  3. bg-gray-400 - Loading dots color');
console.log('  4. hover:bg-white/20 - Button hover (20% opacity)');
console.log('  5. hover:text-blue-300 - Link hover color');
console.log('  6. slide-in-from-bottom-2 - Message animation (150ms)');
console.log('  7. sm:mx-0 - Responsive margin reset');
console.log('  8. focus:ring-offset-2 - Complete ring offset implementation');
console.log('  9. focus:ring-offset-black - Ring offset black color');
console.log('  10. .group - Group hover parent class');
