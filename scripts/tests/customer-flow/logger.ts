const colors: Record<string, string> = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

export function log(message: string, color: keyof typeof colors = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

export function logSection(title: string) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

export function logStep(step: string, message: string) {
  log(`[${step}] ${message}`, 'blue');
}

export const logSuccess = (message: string) => log(`✓ ${message}`, 'green');
export const logError = (message: string) => log(`✗ ${message}`, 'red');
export const logWarning = (message: string) => log(`⚠ ${message}`, 'yellow');
