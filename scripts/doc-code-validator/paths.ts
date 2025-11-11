import { glob } from 'glob';

const DEFAULT_PATTERNS = [
  'lib/**/*.ts',
  'app/**/*.ts',
  'app/**/*.tsx',
  'components/**/*.tsx',
  'types/**/*.ts',
  '__tests__/**/*.ts',
  'scripts/**/*.ts'
];

export function loadExistingPaths(patterns: string[] = DEFAULT_PATTERNS): Set<string> {
  const existingPaths = new Set<string>();
  patterns.forEach(pattern => {
    const files = glob.sync(pattern, { cwd: process.cwd() });
    files.forEach(file => existingPaths.add(file));
  });
  return existingPaths;
}
