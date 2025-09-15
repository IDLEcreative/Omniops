#!/usr/bin/env node

/**
 * Supabase Token Type Identifier
 * Helps identify what type of Supabase tokens you have
 */

import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🔍 SUPABASE TOKEN TYPE IDENTIFIER\n'));
console.log(chalk.yellow('='.repeat(60)));

// Get all potential tokens from environment
const tokens = {
  SUPABASE_ACCESS_TOKEN: process.env.SUPABASE_ACCESS_TOKEN,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
};

function identifyTokenType(token) {
  if (!token) return { type: 'Not set', description: 'Token not found in environment' };
  
  const prefix = token.substring(0, 15);
  
  if (token.startsWith('sbp_')) {
    return {
      type: '✅ Personal Access Token',
      description: 'Used for Management API, CLI, and MCP operations',
      usage: 'Perfect for MCP! This is what you need.',
      color: 'green'
    };
  } else if (token.startsWith('sb_secret_')) {
    return {
      type: '🔑 Secret API Key',
      description: 'New format service key for project-level operations',
      usage: 'Server-side project operations only, NOT for MCP Management API',
      color: 'yellow'
    };
  } else if (token.startsWith('sb_publishable_')) {
    return {
      type: '📢 Publishable Key',
      description: 'Safe for client-side use',
      usage: 'Client-side operations only',
      color: 'blue'
    };
  } else if (token.startsWith('eyJ')) {
    // JWT tokens start with eyJ (base64 encoded {")
    return {
      type: '🔐 Legacy JWT Key',
      description: 'Old format (anon or service_role)',
      usage: 'Legacy project operations, should migrate to new format',
      color: 'gray'
    };
  } else {
    return {
      type: '❓ Unknown Format',
      description: 'Unrecognized token format',
      usage: 'May not be a valid Supabase token',
      color: 'red'
    };
  }
}

// Analyze each token
console.log(chalk.bold.white('\n📋 TOKEN ANALYSIS:\n'));

Object.entries(tokens).forEach(([name, token]) => {
  const info = identifyTokenType(token);
  const colorFn = chalk[info.color] || chalk.white;
  
  console.log(chalk.bold(`${name}:`));
  if (token) {
    console.log(`  Prefix: ${token.substring(0, 15)}...`);
    console.log(colorFn(`  Type: ${info.type}`));
    console.log(chalk.gray(`  Description: ${info.description}`));
    console.log(chalk.dim(`  Usage: ${info.usage}`));
  } else {
    console.log(chalk.red('  Not found in environment'));
  }
  console.log();
});

console.log(chalk.yellow('='.repeat(60)));
console.log(chalk.bold.white('\n🎯 THE ISSUE:\n'));

if (tokens.SUPABASE_ACCESS_TOKEN && tokens.SUPABASE_ACCESS_TOKEN.startsWith('sb_secret_')) {
  console.log(chalk.red('❌ Your SUPABASE_ACCESS_TOKEN is a Secret API Key, not a Personal Access Token!'));
  console.log(chalk.yellow('\nThe MCP server needs a Personal Access Token (sbp_) for Management API access.'));
  console.log(chalk.yellow('Secret API Keys (sb_secret_) are for project-level operations only.\n'));
  
  console.log(chalk.bold.green('✅ SOLUTION:\n'));
  console.log('1. Go to your Supabase account settings (not project settings):');
  console.log(chalk.blue('   https://supabase.com/dashboard/account/tokens'));
  console.log('\n2. Click "Generate New Token"');
  console.log('\n3. Give it a name like "MCP Access" or "Claude Code"');
  console.log('\n4. Copy the token (it will start with sbp_)');
  console.log('\n5. Replace your current SUPABASE_ACCESS_TOKEN:');
  console.log(chalk.gray('   export SUPABASE_ACCESS_TOKEN="sbp_your_new_token_here"'));
  console.log('\n6. The MCP functions will then work properly!');
} else if (tokens.SUPABASE_ACCESS_TOKEN && tokens.SUPABASE_ACCESS_TOKEN.startsWith('sbp_')) {
  console.log(chalk.green('✅ You have a valid Personal Access Token!'));
  console.log('This should work with the MCP. If it\'s not working, check:');
  console.log('  - Token permissions/scopes');
  console.log('  - Token hasn\'t been revoked');
  console.log('  - MCP server configuration');
} else {
  console.log(chalk.yellow('⚠️  No SUPABASE_ACCESS_TOKEN found or unrecognized format.'));
  console.log('You need to create a Personal Access Token for MCP to work.');
}

console.log(chalk.yellow('\n' + '='.repeat(60)));
console.log(chalk.bold.cyan('\n📚 TOKEN TYPES REFERENCE:\n'));
console.log('• ' + chalk.green('sbp_***') + ' = Personal Access Token (for Management API/MCP)');
console.log('• ' + chalk.yellow('sb_secret_***') + ' = Secret API Key (for project operations)');
console.log('• ' + chalk.blue('sb_publishable_***') + ' = Publishable Key (for client-side)');
console.log('• ' + chalk.gray('eyJ***') + ' = Legacy JWT format (anon or service_role)');
console.log();