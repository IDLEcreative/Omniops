import fs from 'fs';
import path from 'path';
import { CodeBlock, ValidationContext } from './types';

export function validateCodeBlock(context: ValidationContext, block: CodeBlock) {
  context.stats.totalCodeBlocks++;
  const language = block.language.toLowerCase();
  context.stats.byLanguage[language] = (context.stats.byLanguage[language] || 0) + 1;

  switch (language) {
    case 'typescript':
    case 'ts':
    case 'tsx':
    case 'javascript':
    case 'js':
    case 'jsx':
      validateTypeScriptBlock(context, block);
      break;
    case 'bash':
    case 'sh':
    case 'shell':
      validateBashBlock(context, block);
      break;
    case 'sql':
    case 'postgresql':
    case 'postgres':
      validateSQLBlock(context, block);
      break;
  }
}

function validateTypeScriptBlock(context: ValidationContext, block: CodeBlock) {
  const { code, file, lineNumber } = block;

  const syntaxChecks = [
    { pattern: /\bfunction\s+\w+\s*\([^)]*\)\s*\{[^}]*$/, message: 'Unclosed function body' },
    { pattern: /\bclass\s+\w+\s*\{[^}]*$/, message: 'Unclosed class body' },
    { pattern: /\(\s*\w+\s*:\s*[^)]*$/, message: 'Unclosed parameter list' },
    { pattern: /\[\s*[^\]]*$/, message: 'Unclosed array' },
    { pattern: /\{\s*[^}]*$/, message: 'Unclosed object' }
  ];

  syntaxChecks.forEach(({ pattern, message }) => {
    if (pattern.test(code.trim())) {
      context.issues.push({
        file,
        language: 'typescript',
        lineNumber,
        severity: 'warning',
        message,
        code: code.substring(0, 100)
      });
    }
  });

  const importMatches = code.matchAll(/from\s+['"]([\w@\/.-]+)['"]/g);
  for (const match of importMatches) {
    const importPath = match[1];
    if (importPath.startsWith('@/') || importPath.startsWith('./') || importPath.startsWith('../')) {
      const cleanPath = importPath.replace('@/', '').replace(/^\.\//, '').replace(/^\.\.\//, '');
      const possiblePaths = [
        `${cleanPath}.ts`,
        `${cleanPath}.tsx`,
        `${cleanPath}/index.ts`,
        `${cleanPath}/index.tsx`
      ];

      const exists = possiblePaths.some(p => context.existingPaths.has(p));
      if (!exists && !importPath.includes('...')) {
        context.issues.push({
          file,
          language: 'typescript',
          lineNumber,
          severity: 'warning',
          message: `Import path may not exist: ${importPath}`,
          code: match[0]
        });
      }
    }
  }

  if (code.includes('any') && !code.includes('// any is intentional')) {
    context.issues.push({
      file,
      language: 'typescript',
      lineNumber,
      severity: 'info',
      message: 'Use of "any" type - consider more specific type',
      code: code.substring(0, 100)
    });
  }

  if (!code.includes('// ...') && !code.includes('/* ... */') && code.trim().endsWith(',')) {
    context.issues.push({
      file,
      language: 'typescript',
      lineNumber,
      severity: 'warning',
      message: 'Code block ends with comma - may be incomplete',
      code: code.substring(Math.max(0, code.length - 100))
    });
  }
}

function validateBashBlock(context: ValidationContext, block: CodeBlock) {
  const lines = block.code.split('\n').filter(line => line.trim() && !line.trim().startsWith('#'));

  lines.forEach(line => {
    if (line.includes('npx tsx ')) {
      const scriptMatch = line.match(/npx tsx ([^\s]+)/);
      if (scriptMatch) {
        const scriptPath = scriptMatch[1];
        const fullPath = path.join(process.cwd(), scriptPath);
        if (!fs.existsSync(fullPath)) {
          context.issues.push({
            file: block.file,
            language: 'bash',
            lineNumber: block.lineNumber,
            severity: 'critical',
            message: `Script does not exist: ${scriptPath}`,
            code: line
          });
        }
      }
    }

    if (line.includes('cd ') && line.includes('&&')) {
      context.issues.push({
        file: block.file,
        language: 'bash',
        lineNumber: block.lineNumber,
        severity: 'info',
        message: 'Using cd with && - consider using absolute paths instead',
        code: line
      });
    }

    const envVarMatches = line.matchAll(/\$\{?(\w+)\}?/g);
    for (const match of envVarMatches) {
      const envVar = match[1];
      if (!['HOME', 'USER', 'PATH', 'PWD'].includes(envVar)) {
        context.issues.push({
          file: block.file,
          language: 'bash',
          lineNumber: block.lineNumber,
          severity: 'info',
          message: `Environment variable used: ${envVar} - ensure it's documented`,
          code: line
        });
      }
    }
  });
}

function validateSQLBlock(context: ValidationContext, block: CodeBlock) {
  const { code, file, lineNumber } = block;
  const lower = code.toLowerCase();

  if (lower.includes('drop table') && !lower.includes('if exists')) {
    context.issues.push({
      file,
      language: 'sql',
      lineNumber,
      severity: 'warning',
      message: 'DROP TABLE without IF EXISTS - could cause errors',
      code: code.substring(0, 100)
    });
  }

  if (code.includes('${') || code.includes('` +')) {
    context.issues.push({
      file,
      language: 'sql',
      lineNumber,
      severity: 'critical',
      message: 'Possible SQL injection vulnerability - use parameterized queries',
      code: code.substring(0, 100)
    });
  }

  if (lower.includes('select *')) {
    context.issues.push({
      file,
      language: 'sql',
      lineNumber,
      severity: 'info',
      message: 'Using SELECT * - consider specifying columns',
      code: code.substring(0, 100)
    });
  }
}
