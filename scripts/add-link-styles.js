const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../lib/widget-standalone/constants.ts');
let content = fs.readFileSync(constantsPath, 'utf8');

// Add blue colors for links
if (!content.includes('.text-blue-300 {')) {
  content = content.replace(
    '.text-gray-500 { color: rgb(107 114 128); }',
    `.text-gray-500 { color: rgb(107 114 128); }
  .text-blue-300 { color: rgb(147 197 253); }
  .text-blue-400 { color: rgb(96 165 250); }`
  );
}

// Add hover:text-blue-300
if (!content.includes('.hover\\:text-blue-300:hover {')) {
  content = content.replace(
    '.hover\\:text-gray-300:hover { color: rgb(209 213 219); }',
    `.hover\\:text-gray-300:hover { color: rgb(209 213 219); }
  .hover\\:text-blue-300:hover { color: rgb(147 197 253); }`
  );
}

// Add underline
if (!content.includes('.underline {')) {
  content = content.replace(
    '.break-words { overflow-wrap: break-word; }',
    `.break-words { overflow-wrap: break-word; }
  .underline { text-decoration-line: underline; }`
  );
}

// Add whitespace-pre-wrap
if (!content.includes('.whitespace-pre-wrap {')) {
  content = content.replace(
    '.overflow-wrap-anywhere { overflow-wrap: anywhere; }',
    `.overflow-wrap-anywhere { overflow-wrap: anywhere; }
  .whitespace-pre-wrap { white-space: pre-wrap; }`
  );
}

fs.writeFileSync(constantsPath, content, 'utf8');
console.log('✅ Link styles added successfully!');
console.log('Added:');
console.log('  - text-blue-300 (link hover color)');
console.log('  - text-blue-400 (link color)');
console.log('  - hover:text-blue-300');
console.log('  - underline');
console.log('  - whitespace-pre-wrap');
