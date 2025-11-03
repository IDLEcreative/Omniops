#!/usr/bin/env node
/**
 * Patch widget standalone CSS with missing classes
 * This adds all classes used by components but missing from constants.ts
 */

const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../lib/widget-standalone/constants.ts');
let content = fs.readFileSync(constantsPath, 'utf8');

// 1. Add bounce animation (for typing indicator)
if (!content.includes('@keyframes bounce')) {
  content = content.replace(
    '@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }',
    `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
  @keyframes bounce { 0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); } 50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); } }`
  );
}

if (!content.includes('.animate-bounce {')) {
  content = content.replace(
    '.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }',
    `.animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
  .animate-bounce { animation: bounce 1s infinite; }`
  );
}

// 2. Add gap-1.5
if (!content.includes('.gap-1\\\\.5 {')) {
  content = content.replace(
    '.gap-1 { gap: 0.25rem; }',
    `.gap-1 { gap: 0.25rem; }
  .gap-1\\.5 { gap: 0.375rem; }`
  );
}

// 3. Add opacity-90
if (!content.includes('.opacity-90 {')) {
  content = content.replace(
    '.opacity-75 { opacity: 0.75; }',
    `.opacity-75 { opacity: 0.75; }
  .opacity-90 { opacity: 0.9; }`
  );
}

// 4. Add font-semibold
if (!content.includes('.font-semibold {')) {
  content = content.replace(
    '.font-medium { font-weight: 500; }',
    `.font-medium { font-weight: 500; }
  .font-semibold { font-weight: 600; }`
  );
}

// 5. Add focus:ring-white/20
if (!content.includes('.focus\\\\:ring-white\\\\/20:focus {')) {
  content = content.replace(
    '.focus\\:ring-white\\/50:focus { box-shadow: 0 0 0 3px rgb(255 255 255 / 0.5); }',
    `.focus\\:ring-white\\/50:focus { box-shadow: 0 0 0 3px rgb(255 255 255 / 0.5); }
  .focus\\:ring-white\\/20:focus { box-shadow: 0 0 0 2px rgb(255 255 255 / 0.2); }`
  );
}

// 6. Add hover:bg-white/20
if (!content.includes('.hover\\\\:bg-white\\\\/20:hover {')) {
  content = content.replace(
    '.hover\\:bg-white\\/10:hover { background-color: rgb(255 255 255 / 0.1); }',
    `.hover\\:bg-white\\/10:hover { background-color: rgb(255 255 255 / 0.1); }
  .hover\\:bg-white\\/20:hover { background-color: rgb(255 255 255 / 0.2); }`
  );
}

// 7. Add animate-out and slide-out (used by ChatWidget)
if (!content.includes('.animate-out {')) {
  content = content.replace(
    '.animate-in { animation: enter 200ms ease-out; }',
    `.animate-in { animation: enter 200ms ease-out; }
  .animate-out { animation: exit 200ms ease-in; }`
  );
}

if (!content.includes('@keyframes exit {')) {
  content = content.replace(
    '@keyframes slideInFromBottom { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }',
    `@keyframes slideInFromBottom { from { transform: translateY(12px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
  @keyframes slideOutToBottom { from { transform: translateY(0); opacity: 1; } to { transform: translateY(12px); opacity: 0; } }
  @keyframes exit { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.95); } }
  @keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }`
  );
}

if (!content.includes('.slide-out-to-bottom-3 {')) {
  content = content.replace(
    '.slide-in-from-bottom-3 { animation: slideInFromBottom 200ms ease-out; }',
    `.slide-in-from-bottom-3 { animation: slideInFromBottom 200ms ease-out; }
  .slide-out-to-bottom-3 { animation: slideOutToBottom 200ms ease-in; }
  .fade-out { animation: fadeOut 200ms ease-in; }`
  );
}

fs.writeFileSync(constantsPath, content, 'utf8');
console.log('✅ Widget CSS patched successfully!');
console.log('Added:');
console.log('  - bounce animation for typing indicator');
console.log('  - gap-1.5 spacing');
console.log('  - opacity-90');
console.log('  - font-semibold');
console.log('  - focus:ring-white/20');
console.log('  - hover:bg-white/20');
console.log('  - animate-out and slide-out animations');
