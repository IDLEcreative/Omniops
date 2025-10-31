#!/usr/bin/env node

/**
 * Centralized Supabase configuration for scripts
 * Uses environment variables instead of hardcoded tokens
 *
 * Usage:
 *   import { getSupabaseConfig, executeSQL } from './supabase-config.js';
 *   const config = getSupabaseConfig();
 *   const result = await executeSQL(config, 'SELECT * FROM users LIMIT 1;');
 */

import { config as loadEnv } from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load environment variables from .env.local or .env
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

if (existsSync(join(rootDir, '.env.local'))) {
  loadEnv({ path: join(rootDir, '.env.local') });
} else if (existsSync(join(rootDir, '.env'))) {
  loadEnv({ path: join(rootDir, '.env') });
}

/**
 * Get Supabase configuration from environment variables
 * @returns {Object} Configuration object with required credentials
 * @throws {Error} If required environment variables are missing
 */
export function getSupabaseConfig() {
  const config = {
    projectRef: process.env.NEXT_PUBLIC_SUPABASE_PROJECT_REF || 'birugqyuqhiahxvxeyqg',
    managementToken: process.env.SUPABASE_MANAGEMENT_TOKEN,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  // Validate required credentials
  if (!config.managementToken) {
    throw new Error(
      '❌ SUPABASE_MANAGEMENT_TOKEN environment variable is not set.\n' +
      '   Get your token from: https://supabase.com/dashboard/account/tokens\n' +
      '   Add to .env.local: SUPABASE_MANAGEMENT_TOKEN=sbp_your_token_here'
    );
  }

  if (!config.projectRef) {
    throw new Error(
      '❌ NEXT_PUBLIC_SUPABASE_PROJECT_REF environment variable is not set.\n' +
      '   Add to .env.local: NEXT_PUBLIC_SUPABASE_PROJECT_REF=your_project_ref'
    );
  }

  return config;
}

/**
 * Execute SQL using Supabase Management API
 * @param {Object} config - Configuration from getSupabaseConfig()
 * @param {string} sql - SQL query to execute
 * @returns {Promise<any>} Query result
 */
export async function executeSQL(config, sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${config.projectRef}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.managementToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return await response.json();
}

/**
 * Create a Supabase client for direct queries (requires service role key)
 * @param {Object} config - Configuration from getSupabaseConfig()
 * @returns {Object} Supabase client instance
 */
export async function createSupabaseClient(config) {
  if (!config.serviceRoleKey) {
    throw new Error(
      '❌ SUPABASE_SERVICE_ROLE_KEY environment variable is not set.\n' +
      '   This is required for direct database queries.\n' +
      '   Add to .env.local: SUPABASE_SERVICE_ROLE_KEY=your_service_role_key'
    );
  }

  if (!config.supabaseUrl) {
    throw new Error(
      '❌ NEXT_PUBLIC_SUPABASE_URL environment variable is not set.\n' +
      '   Add to .env.local: NEXT_PUBLIC_SUPABASE_URL=https://your_project.supabase.co'
    );
  }

  const { createClient } = await import('@supabase/supabase-js');
  return createClient(config.supabaseUrl, config.serviceRoleKey);
}

/**
 * Validate that all required environment variables are set
 * @throws {Error} If validation fails
 */
export function validateConfig() {
  try {
    const config = getSupabaseConfig();
    console.log('✅ Configuration validated successfully');
    console.log(`   Project: ${config.projectRef}`);
    console.log(`   Management Token: ${config.managementToken.substring(0, 10)}...`);
    return config;
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
