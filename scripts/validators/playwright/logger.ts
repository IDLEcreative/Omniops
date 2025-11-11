const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m'
};

export function log(message: string, color: keyof typeof colors = 'cyan') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export const logInfo = (message: string) => log(message, 'blue');
export const logSuccess = (message: string) => log(`✓ ${message}`, 'green');
export const logError = (message: string) => log(`✗ ${message}`, 'red');
export const logWarning = (message: string) => log(`⚠ ${message}`, 'yellow');
