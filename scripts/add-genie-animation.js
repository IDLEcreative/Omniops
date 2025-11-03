#!/usr/bin/env node
/**
 * Add genie effect animation - widget grows from button location
 */

const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../lib/widget-standalone/constants.ts');
let content = fs.readFileSync(constantsPath, 'utf8');

console.log('🧞 Adding genie effect animation...\n');

// 1. Add hover:opacity-70 class for header buttons
if (!content.includes('.hover\\:opacity-70:hover {')) {
  content = content.replace(
    '.hover\\:text-blue-300:hover { color: rgb(147 197 253); }',
    `.hover\\:text-blue-300:hover { color: rgb(147 197 253); }
  .hover\\:opacity-70:hover { opacity: 0.7; }`
  );
  console.log('✅ Added: hover:opacity-70');
}

// 2. Update widgetOpen animation for genie effect
// The widget should grow from bottom-right corner (where button is)
content = content.replace(
  `  @keyframes widgetOpen {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }`,
  `  @keyframes widgetOpen {
    0% {
      opacity: 0;
      transform: scale(0.3) translateY(20px);
      transform-origin: bottom right;
    }
    100% {
      opacity: 1;
      transform: scale(1) translateY(0);
      transform-origin: bottom right;
    }
  }`
);
console.log('✅ Updated: widgetOpen animation (genie effect from bottom-right)');

// 3. Update widgetClose animation to reverse the genie effect
content = content.replace(
  `  @keyframes widgetClose {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(12px) scale(0.95);
    }
  }`,
  `  @keyframes widgetClose {
    0% {
      opacity: 1;
      transform: scale(1) translateY(0);
      transform-origin: bottom right;
    }
    100% {
      opacity: 0;
      transform: scale(0.3) translateY(20px);
      transform-origin: bottom right;
    }
  }`
);
console.log('✅ Updated: widgetClose animation (reverse genie effect)');

// 4. Update the combined animation selectors to include transform-origin
content = content.replace(
  `.animate-in.slide-in-from-bottom-3.fade-in {
    animation: widgetOpen 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }`,
  `.animate-in.slide-in-from-bottom-3.fade-in {
    animation: widgetOpen 300ms cubic-bezier(0.34, 1.56, 0.64, 1);
    transform-origin: bottom right;
  }`
);
console.log('✅ Enhanced: Open animation timing (300ms with bounce)');

content = content.replace(
  `.animate-out.slide-out-to-bottom-3.fade-out {
    animation: widgetClose 200ms cubic-bezier(0.4, 0, 1, 1);
  }`,
  `.animate-out.slide-out-to-bottom-3.fade-out {
    animation: widgetClose 200ms cubic-bezier(0.4, 0, 0.6, 1);
    transform-origin: bottom right;
  }`
);
console.log('✅ Enhanced: Close animation timing');

fs.writeFileSync(constantsPath, content, 'utf8');

console.log('\n✅ Genie effect animation complete!');
console.log('\nChanges:');
console.log('  - Widget grows from bottom-right (where button is)');
console.log('  - Smooth scale from 0.3 to 1.0 (genie expand)');
console.log('  - 300ms open duration with bounce easing');
console.log('  - 200ms close duration with smooth easing');
console.log('  - Transform origin set to bottom right');
console.log('  - Removed white border from widget');
console.log('  - Changed header button hover to opacity fade (no white overlay)');
