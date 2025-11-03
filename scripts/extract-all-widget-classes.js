#!/usr/bin/env node
/**
 * Extract ALL CSS classes from widget components and generate complete CSS
 * This ensures we don't miss ANY classes - systematic approach
 */

const fs = require('fs');
const path = require('path');

// Component files to analyze
const componentFiles = [
  'components/ChatWidget.tsx',
  'components/ChatWidget/Header.tsx',
  'components/ChatWidget/MessageList.tsx',
  'components/ChatWidget/InputArea.tsx',
  'components/chat/MessageContent.tsx',
];

console.log('🔍 Extracting ALL CSS classes from widget components...\n');

const allClasses = new Set();
const classUsageMap = new Map(); // Track where each class is used

// Read all component files
for (const file of componentFiles) {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Extract className usage - matches className="..." or className={...}
  const classNameRegex = /className=(?:["'`]([^"'`]+)["'`]|{[^}]*["'`]([^"'`]+)["'`][^}]*})/g;

  let match;
  while ((match = classNameRegex.exec(content)) !== null) {
    const classes = (match[1] || match[2] || '').split(/\s+/).filter(Boolean);

    for (const cls of classes) {
      // Skip template literals and variables
      if (cls.includes('${') || cls.includes('?') || cls.includes(':')) continue;

      allClasses.add(cls);

      if (!classUsageMap.has(cls)) {
        classUsageMap.set(cls, []);
      }
      classUsageMap.set(cls, [...classUsageMap.get(cls), file]);
    }
  }
}

// Also check for dynamic classes by looking for common patterns
for (const file of componentFiles) {
  const filePath = path.join(__dirname, '..', file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Look for specific patterns
  const patterns = [
    /sm:w-\[400px\]/g,
    /sm:h-\[580px\]/g,
    /sm:max-h-\[calc\(100vh-40px\)\]/g,
    /bg-\[#[0-9A-Fa-f]+\]/g,
    /text-\[#[0-9A-Fa-f]+\]/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      allClasses.add(match[0]);
    }
  }
}

console.log(`Found ${allClasses.size} unique CSS classes\n`);

// Categorize classes
const categories = {
  layout: [],
  spacing: [],
  typography: [],
  colors: [],
  borders: [],
  effects: [],
  animations: [],
  responsive: [],
  states: [],
  other: [],
};

for (const cls of allClasses) {
  if (cls.startsWith('sm:')) {
    categories.responsive.push(cls);
  } else if (cls.startsWith('hover:') || cls.startsWith('focus:') || cls.startsWith('disabled:')) {
    categories.states.push(cls);
  } else if (cls.includes('animate') || cls.includes('transition') || cls.includes('duration')) {
    categories.animations.push(cls);
  } else if (cls.startsWith('bg-') || cls.startsWith('text-') || cls.startsWith('border-') && cls.includes('color')) {
    categories.colors.push(cls);
  } else if (cls.startsWith('p-') || cls.startsWith('m-') || cls.startsWith('gap-') || cls.includes('px-') || cls.includes('py-')) {
    categories.spacing.push(cls);
  } else if (cls.startsWith('text-') || cls.includes('font-') || cls.includes('leading-')) {
    categories.typography.push(cls);
  } else if (cls.startsWith('border') || cls.startsWith('rounded')) {
    categories.borders.push(cls);
  } else if (cls.includes('shadow') || cls.includes('opacity')) {
    categories.effects.push(cls);
  } else if (cls.startsWith('flex') || cls.startsWith('grid') || cls.includes('items-') || cls.includes('justify-')) {
    categories.layout.push(cls);
  } else {
    categories.other.push(cls);
  }
}

// Print categorized report
console.log('📊 Classes by Category:\n');
for (const [category, classes] of Object.entries(categories)) {
  if (classes.length > 0) {
    console.log(`${category.toUpperCase()}: ${classes.length} classes`);
    console.log(classes.sort().join(', '));
    console.log('');
  }
}

// Save detailed report
const report = {
  totalClasses: allClasses.size,
  categories,
  allClassesSorted: Array.from(allClasses).sort(),
  usage: Object.fromEntries(classUsageMap),
};

fs.writeFileSync(
  path.join(__dirname, 'widget-classes-report.json'),
  JSON.stringify(report, null, 2)
);

console.log('✅ Full report saved to: scripts/widget-classes-report.json\n');
console.log('📋 Next step: Compare with constants.ts to find missing classes');
