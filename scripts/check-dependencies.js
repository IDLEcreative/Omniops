#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

// Required dependencies for shadcn/ui components
const requiredDependencies = {
  // Core dependencies
  'react': '^18.0.0 || ^19.0.0',
  'react-dom': '^18.0.0 || ^19.0.0',
  'next': '^13.0.0 || ^14.0.0 || ^15.0.0',
  
  // Styling dependencies
  'tailwindcss': '^3.0.0',
  'tailwindcss-animate': '^1.0.0',
  'class-variance-authority': '^0.7.0',
  'clsx': '^2.0.0',
  'tailwind-merge': '^2.0.0 || ^3.0.0',
  
  // Radix UI dependencies (for shadcn/ui components)
  '@radix-ui/react-avatar': '^1.0.0',
  '@radix-ui/react-collapsible': '^1.0.0',
  '@radix-ui/react-dropdown-menu': '^2.0.0',
  '@radix-ui/react-label': '^2.0.0',
  '@radix-ui/react-progress': '^1.0.0',
  '@radix-ui/react-radio-group': '^1.0.0',
  '@radix-ui/react-scroll-area': '^1.0.0',
  '@radix-ui/react-select': '^2.0.0',
  '@radix-ui/react-slot': '^1.0.0',
  '@radix-ui/react-switch': '^1.0.0',
  '@radix-ui/react-tabs': '^1.0.0',
  
  // Icon library
  'lucide-react': '^0.200.0',
};

console.log('🔍 Checking dependencies for shadcn/ui components...\n');

const packageJsonPath = path.join(process.cwd(), 'package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

const installedDeps = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies
};

let missingDeps = [];
let outdatedDeps = [];

Object.entries(requiredDependencies).forEach(([dep, requiredVersion]) => {
  if (!installedDeps[dep]) {
    missingDeps.push(dep);
  } else {
    console.log(`✅ ${dep}: ${installedDeps[dep]}`);
  }
});

if (missingDeps.length > 0) {
  console.log('\n❌ Missing dependencies:');
  missingDeps.forEach(dep => console.log(`   - ${dep}`));
  console.log('\n📦 To install missing dependencies, run:');
  console.log(`   npm install ${missingDeps.join(' ')}`);
} else {
  console.log('\n✅ All required dependencies are installed!');
}

// Check for CSS configuration
console.log('\n🎨 Checking CSS configuration...');

const globalsPath = path.join(process.cwd(), 'app', 'globals.css');
if (fs.existsSync(globalsPath)) {
  const globalsContent = fs.readFileSync(globalsPath, 'utf8');
  const requiredCSSVars = [
    '--background', '--foreground', '--card', '--card-foreground',
    '--popover', '--popover-foreground', '--primary', '--primary-foreground',
    '--secondary', '--secondary-foreground', '--muted', '--muted-foreground',
    '--accent', '--accent-foreground', '--destructive', '--destructive-foreground',
    '--border', '--input', '--ring', '--radius'
  ];
  
  const missingVars = requiredCSSVars.filter(varName => !globalsContent.includes(varName));
  
  if (missingVars.length > 0) {
    console.log('❌ Missing CSS variables:', missingVars.join(', '));
  } else {
    console.log('✅ All required CSS variables are defined');
  }
} else {
  console.log('❌ globals.css not found at expected location');
}

// Check Tailwind configuration
const tailwindPath = path.join(process.cwd(), 'tailwind.config.js');
if (fs.existsSync(tailwindPath)) {
  console.log('✅ Tailwind configuration found');
} else {
  console.log('❌ tailwind.config.js not found');
}

console.log('\n✨ Dependency check complete!');