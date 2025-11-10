/**
 * Dependency Checker
 *
 * Validates required and optional modules are installed.
 */

import { logSection, logTest } from './test-utils.js';

/**
 * Check if required dependencies exist
 */
export async function checkDependencies() {
  logSection('📦 CHECKING DEPENDENCIES');

  const requiredModules = [
    { name: 'redis', path: 'redis', required: true },
    { name: 'bullmq', path: 'bullmq', required: true },
    { name: '@supabase/supabase-js', path: '@supabase/supabase-js', required: true },
    { name: 'playwright', path: 'playwright', required: false }
  ];

  const errors = [];

  for (const module of requiredModules) {
    try {
      await import(module.path);
      logTest(`Module: ${module.name}`, 'pass', 'Found');
    } catch (error) {
      if (module.required) {
        logTest(`Module: ${module.name}`, 'fail', 'Missing - required module');
        errors.push(`Missing required module: ${module.name}`);
      } else {
        logTest(`Module: ${module.name}`, 'skip', 'Optional module not installed');
      }
    }
  }

  return errors;
}
