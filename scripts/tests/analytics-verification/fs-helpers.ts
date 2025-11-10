import { existsSync, readFileSync, statSync } from 'fs';
import path from 'path';

export function fileExists(relativePath: string): boolean {
  return existsSync(path.join(process.cwd(), relativePath));
}

export function fileSizeKB(relativePath: string): string {
  const stats = statSync(path.join(process.cwd(), relativePath));
  return (stats.size / 1024).toFixed(1);
}

export function readPackageJson(): Record<string, any> {
  const pkgPath = path.join(process.cwd(), 'package.json');
  return JSON.parse(readFileSync(pkgPath, 'utf8'));
}
