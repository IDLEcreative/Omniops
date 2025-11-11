export interface CodeBlock {
  file: string;
  language: string;
  code: string;
  lineNumber: number;
}

export interface ValidationIssue {
  file: string;
  language: string;
  lineNumber: number;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  code: string;
}

export interface ValidationStats {
  totalFiles: number;
  totalCodeBlocks: number;
  byLanguage: Record<string, number>;
  criticalIssues: number;
  warnings: number;
  info: number;
}

export interface ValidationContext {
  issues: ValidationIssue[];
  stats: ValidationStats;
  existingPaths: Set<string>;
}

export function createInitialStats(): ValidationStats {
  return {
    totalFiles: 0,
    totalCodeBlocks: 0,
    byLanguage: {},
    criticalIssues: 0,
    warnings: 0,
    info: 0
  };
}
