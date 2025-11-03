#!/usr/bin/env node
/**
 * Fix widget open/close animation by creating proper combined animations
 *
 * The issue: Multiple animation classes (animate-in, slide-in-from-bottom-3, fade-in)
 * override each other. Only the last one runs.
 *
 * The fix: Create combined animations that do scale + slide + fade in one keyframe
 */

const fs = require('fs');
const path = require('path');

const constantsPath = path.join(__dirname, '../lib/widget-standalone/constants.ts');
let content = fs.readFileSync(constantsPath, 'utf8');

console.log('🎬 Fixing widget open/close animations...\n');

// Remove the individual animation classes since they conflict
content = content.replace(
  '.animate-in { animation: enter 200ms ease-out; }',
  '/* REMOVED: .animate-in conflicts with other animations */'
);

content = content.replace(
  '.fade-in { animation: fadeIn 200ms ease-out; }',
  '/* REMOVED: .fade-in conflicts with other animations */'
);

// Create a COMBINED animation that does scale + slide + fade
// This is what the component INTENDS to do with the three classes
const combinedOpenAnimation = `
  /* Combined widget open animation - scale + slide + fade */
  .animate-in.slide-in-from-bottom-3.fade-in {
    animation: widgetOpen 200ms cubic-bezier(0.16, 1, 0.3, 1);
  }`;

const combinedCloseAnimation = `
  /* Combined widget close animation - scale + slide + fade */
  .animate-out.slide-out-to-bottom-3.fade-out {
    animation: widgetClose 200ms cubic-bezier(0.4, 0, 1, 1);
  }`;

// Add the combined animation classes
content = content.replace(
  '.slide-in-from-bottom-3 { animation: slideInFromBottom 200ms ease-out; }',
  `.slide-in-from-bottom-3 { animation: slideInFromBottom 200ms ease-out; }${combinedOpenAnimation}`
);

content = content.replace(
  '.slide-out-to-bottom-3 { animation: slideOutToBottom 200ms ease-in; }',
  `.slide-out-to-bottom-3 { animation: slideOutToBottom 200ms ease-in; }${combinedCloseAnimation}`
);

// Add the new combined keyframes
const newKeyframes = `
  @keyframes widgetOpen {
    from {
      opacity: 0;
      transform: translateY(12px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  @keyframes widgetClose {
    from {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    to {
      opacity: 0;
      transform: translateY(12px) scale(0.95);
    }
  }`;

content = content.replace(
  '@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }',
  `@keyframes fadeOut { from { opacity: 1; } to { opacity: 0; } }${newKeyframes}`
);

// Also need to ensure transform-origin is set for smooth scaling
if (!content.includes('.transform-origin-bottom {')) {
  content = content.replace(
    '  /* Responsive */',
    `  /* Transform origin for animations */
  .transform-origin-bottom { transform-origin: bottom; }

  /* Responsive */`
  );
}

fs.writeFileSync(constantsPath, content, 'utf8');

console.log('✅ Fixed widget animations!');
console.log('\nChanges:');
console.log('  - Removed conflicting .animate-in class');
console.log('  - Removed conflicting .fade-in class');
console.log('  - Added combined .animate-in.slide-in-from-bottom-3.fade-in animation');
console.log('  - Added combined .animate-out.slide-out-to-bottom-3.fade-out animation');
console.log('  - Added @keyframes widgetOpen (scale + slide + fade)');
console.log('  - Added @keyframes widgetClose (scale + slide + fade)');
console.log('  - Added transform-origin-bottom for smooth scaling');
console.log('\nAnimation timing: 200ms with smooth easing (cubic-bezier)');
