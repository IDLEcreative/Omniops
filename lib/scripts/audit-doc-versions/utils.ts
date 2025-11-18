import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { AuditResult } from './core';

export function getFileLastModified(filePath: string, rootDir: string): string {
  try {
    const gitDate = execSync(`git log -1 --format=%cd --date=short "${filePath}"`, {
      encoding: 'utf-8',
      cwd: rootDir,
    }).trim();
    return gitDate;
  } catch (error) {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0] || '';
  }
}

export function extractMetadata(content: string): {
  lastUpdatedInDoc?: string;
  verifiedFor?: string;
} {
  const lastUpdatedMatch = content.match(/\*\*Last Updated:\*\*\s*(\d{4}-\d{2}-\d{2})/i);
  const verifiedForMatch = content.match(/\*\*Verified Accurate For:\*\*\s*v?([\d.]+)/i);

  return {
    lastUpdatedInDoc: lastUpdatedMatch?.[1],
    verifiedFor: verifiedForMatch?.[1]
  };
}

export function getDaysSince(dateStr: string): number {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function compareVersions(v1: string, v2: string): number {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  if ((parts1[0] ?? 0) !== (parts2[0] ?? 0)) {
    return Math.abs((parts1[0] ?? 0) - (parts2[0] ?? 0)) * 100;
  }

  return Math.abs((parts1[1] ?? 0) - (parts2[1] ?? 0));
}

export function autoFixDocument(
  filePath: string,
  content: string,
  result: AuditResult,
  currentVersion: string,
  isCriticalDoc: boolean
): boolean {
  let updated = content;
  let changed = false;

  if (!result.lastUpdatedInDoc) {
    const today = new Date().toISOString().split('T')[0];
    if (content.includes('**Last Updated:**')) {
      updated = updated.replace(
        /\*\*Last Updated:\*\*\s*\S*/,
        `**Last Updated:** ${today}`
      );
    } else {
      updated = `**Last Updated:** ${today}\n\n${updated}`;
    }
    changed = true;
  }

  if (!result.verifiedFor && isCriticalDoc) {
    if (content.includes('**Verified Accurate For:**')) {
      updated = updated.replace(
        /\*\*Verified Accurate For:\*\*\s*\S*/,
        `**Verified Accurate For:** v${currentVersion}`
      );
    } else {
      updated = updated.replace(
        /(\*\*Last Updated:\*\*\s*\S+)/,
        `$1\n**Verified Accurate For:** v${currentVersion}`
      );
    }
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, updated, 'utf-8');
  }

  return changed;
}
