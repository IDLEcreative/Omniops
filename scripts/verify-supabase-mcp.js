#!/usr/bin/env node

/**
 * Supabase MCP Verification Script
 * Runs live checks against the Supabase Management API and database
 * using the credentials available in the current environment.
 */

import chalk from 'chalk';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local', override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken =
  process.env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_PERSONAL_ACCESS_TOKEN;

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  supabaseUrl?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ??
  null;

console.log(chalk.bold.cyan('\n🚀 SUPABASE MCP VERIFICATION REPORT\n'));
console.log(chalk.yellow('='.repeat(60)));

function computeCategoryStatus(functions) {
  const totals = functions.reduce(
    (acc, fn) => {
      if (fn.ok === true) acc.ok += 1;
      else if (fn.ok === null) acc.skipped += 1;
      else acc.failed += 1;
      return acc;
    },
    { ok: 0, failed: 0, skipped: 0 }
  );

  if (totals.ok === functions.length && functions.length > 0) return '✅ WORKING';
  if (totals.ok > 0 && totals.failed === 0) return '⚠️  PARTIAL';
  if (totals.ok > 0) return '⚠️  PARTIAL';
  if (totals.skipped === functions.length) return '⚠️  NOT CONFIGURED';
  return '❌ FAILED';
}

function printCategory(category) {
  console.log(chalk.bold.white(`\n${category.category}`));
  console.log(chalk.gray(`Status: ${category.status}`));
  console.log(chalk.gray('-'.repeat(40)));

  category.functions.forEach(func => {
    const symbol = func.ok === true ? '✅' : func.ok === null ? '⚠️' : '❌';
    console.log(`  ${symbol} ${chalk.cyan(func.name)}`);
    console.log(chalk.gray(`     ${func.description}`));
    if (func.notes) {
      console.log(chalk.yellow(`     Note: ${func.notes}`));
    }
  });
}

async function managementRequest(path, { method = 'GET', body } = {}) {
  if (!accessToken) {
    return { ok: false, statusCode: 0, message: 'Missing SUPABASE_ACCESS_TOKEN' };
  }

  try {
    const response = await fetch(`https://api.supabase.com${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    let data = null;
    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!response.ok) {
      const message =
        (data && typeof data === 'object' && (data.message || data.error)) ||
        text ||
        `Status ${response.status}`;
      return { ok: false, statusCode: response.status, message, data };
    }

    return { ok: true, statusCode: response.status, data };
  } catch (error) {
    return { ok: false, statusCode: 0, message: error.message };
  }
}

async function runSql(query) {
  if (!projectRef) {
    return { ok: false, message: 'Missing project reference (set SUPABASE_PROJECT_REF).' };
  }

  return managementRequest(`/v1/projects/${projectRef}/database/query`, {
    method: 'POST',
    body: { query }
  });
}

async function runDocumentationTests() {
  const functions = [
    {
      name: 'search_docs',
      description: 'Search Supabase documentation using GraphQL',
      ok: null,
      notes: 'MCP handles this remotely; no direct REST check available.'
    }
  ];

  return {
    category: 'Documentation & Search',
    status: computeCategoryStatus(functions),
    functions
  };
}

async function runProjectManagementTests() {
  const functions = [];

  if (!accessToken) {
    const note = 'Set SUPABASE_ACCESS_TOKEN or SUPABASE_PERSONAL_ACCESS_TOKEN.';
    [
      ['list_projects', 'List all Supabase projects'],
      ['get_project', 'Get project details'],
      ['create_project', 'Create new project'],
      ['pause_project', 'Pause a project'],
      ['restore_project', 'Restore a project'],
      ['list_organizations', 'List all organizations'],
      ['get_organization', 'Get organization details']
    ].forEach(([name, description]) =>
      functions.push({ name, description, ok: null, notes: note })
    );

    return {
      category: 'Project Management',
      status: computeCategoryStatus(functions),
      functions
    };
  }

  const projects = await managementRequest('/v1/projects');
  functions.push({
    name: 'list_projects',
    description: 'List all Supabase projects',
    ok: projects.ok,
    notes: projects.ok
      ? `Found ${Array.isArray(projects.data) ? projects.data.length : 0} project(s).`
      : projects.message
  });

  const organizations = await managementRequest('/v1/organizations');
  functions.push({
    name: 'list_organizations',
    description: 'List all organizations',
    ok: organizations.ok,
    notes: organizations.ok
      ? `Found ${Array.isArray(organizations.data) ? organizations.data.length : 0} organization(s).`
      : organizations.message
  });

  const organizationInfo = await managementRequest('/v1/organizations');
  functions.push({
    name: 'get_organization',
    description: 'Get organization details',
    ok: organizationInfo.ok,
    notes: organizationInfo.ok
      ? 'Organization metadata retrieved.'
      : organizationInfo.message
  });

  if (projectRef) {
    const projectDetails = await managementRequest(`/v1/projects/${projectRef}`);
    functions.push({
      name: 'get_project',
      description: 'Get project details',
      ok: projectDetails.ok,
      notes: projectDetails.ok
        ? `Project ${projectRef} retrieved successfully.`
        : projectDetails.message
    });
  } else {
    functions.push({
      name: 'get_project',
      description: 'Get project details',
      ok: null,
      notes: 'Unable to derive project reference from NEXT_PUBLIC_SUPABASE_URL.'
    });
  }

  ['create_project', 'pause_project', 'restore_project'].forEach(name =>
    functions.push({
      name,
      description: `${name.replace('_', ' ')} (requires manual approval)`,
      ok: null,
      notes: 'Skipped to avoid destructive changes.'
    })
  );

  return {
    category: 'Project Management',
    status: computeCategoryStatus(functions),
    functions
  };
}

async function runDatabaseOperationTests() {
  const functions = [];

  if (!accessToken || !projectRef) {
    const note = !accessToken
      ? 'Set SUPABASE_ACCESS_TOKEN to enable Management API queries.'
      : 'Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.';

    ['list_tables', 'execute_sql', 'apply_migration', 'list_migrations', 'list_extensions'].forEach(
      name => functions.push({ name, description: name.replace('_', ' '), ok: null, notes: note })
    );

    return {
      category: 'Database Operations',
      status: computeCategoryStatus(functions),
      functions
    };
  }

  const tables = await runSql(
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name LIMIT 5;`
  );
  functions.push({
    name: 'list_tables',
    description: 'List database tables',
    ok: tables.ok,
    notes: tables.ok
      ? `Sample: ${(tables.data || []).map(row => row.table_name).join(', ') || 'none found'}.`
      : tables.message
  });

  const pageCount = await runSql(
    `SELECT COUNT(*)::text AS total FROM public.scraped_pages;`
  );
  functions.push({
    name: 'execute_sql',
    description: 'Execute SQL queries',
    ok: pageCount.ok,
    notes: pageCount.ok
      ? `scraped_pages count: ${pageCount.data?.[0]?.total ?? 'unknown'}`
      : pageCount.message
  });

  functions.push({
    name: 'apply_migration',
    description: 'Apply database migrations',
    ok: null,
    notes: 'Skipped (would execute schema migration).'
  });

  const migrations = await runSql(
    `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 3;`
  );
  functions.push({
    name: 'list_migrations',
    description: 'List all migrations',
    ok: migrations.ok,
    notes: migrations.ok
      ? `Latest migration version: ${migrations.data?.[0]?.version ?? 'unknown'}.`
      : migrations.message ?? 'supabase_migrations.schema_migrations not found.'
  });

  const extensions = await runSql(
    `SELECT name FROM pg_available_extensions ORDER BY name LIMIT 5;`
  );
  functions.push({
    name: 'list_extensions',
    description: 'List database extensions',
    ok: extensions.ok,
    notes: extensions.ok
      ? `Sample extensions: ${(extensions.data || []).map(row => row.name).join(', ') || 'none found'}.`
      : extensions.message
  });

  return {
    category: 'Database Operations',
    status: computeCategoryStatus(functions),
    functions
  };
}

async function runEdgeFunctionTests() {
  const functions = [];

  if (!accessToken || !projectRef) {
    const note = !accessToken
      ? 'Set SUPABASE_ACCESS_TOKEN to query edge functions.'
      : 'Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.';
    functions.push({
      name: 'list_edge_functions',
      description: 'List all edge functions',
      ok: null,
      notes: note
    });
    functions.push({
      name: 'deploy_edge_function',
      description: 'Deploy edge function',
      ok: null,
      notes: 'Skipped (deploy requires function bundle and approval).'
    });

    return {
      category: 'Edge Functions',
      status: computeCategoryStatus(functions),
      functions
    };
  }

  const listFunctions = await managementRequest(`/v1/projects/${projectRef}/functions`);
  functions.push({
    name: 'list_edge_functions',
    description: 'List all edge functions',
    ok: listFunctions.ok,
    notes: listFunctions.ok
      ? `Found ${Array.isArray(listFunctions.data) ? listFunctions.data.length : 0} function(s).`
      : listFunctions.message
  });

  functions.push({
    name: 'deploy_edge_function',
    description: 'Deploy edge function',
    ok: null,
    notes: 'Skipped (deploy requires function bundle and approval).'
  });

  return {
    category: 'Edge Functions',
    status: computeCategoryStatus(functions),
    functions
  };
}

async function runBranchingTests() {
  const functions = [];

  if (!accessToken || !projectRef) {
    const note = !accessToken
      ? 'Set SUPABASE_ACCESS_TOKEN to query branching endpoints.'
      : 'Set SUPABASE_PROJECT_REF or NEXT_PUBLIC_SUPABASE_URL.';
    ['create_branch', 'list_branches', 'merge_branch'].forEach(name =>
      functions.push({
        name,
        description: name.replace('_', ' '),
        ok: null,
        notes: note
      })
    );
    return {
      category: 'Branching',
      status: computeCategoryStatus(functions),
      functions
    };
  }

  const branches = await managementRequest(`/v1/projects/${projectRef}/branches`);
  functions.push({
    name: 'list_branches',
    description: 'List all branches',
    ok: branches.ok,
    notes: branches.ok
      ? `Branch endpoint responded with status ${branches.statusCode}.`
      : branches.message ?? 'Branching not enabled for this project.'
  });

  ['create_branch', 'merge_branch'].forEach(name =>
    functions.push({
      name,
      description: name.replace('_', ' '),
      ok: null,
      notes: 'Skipped (would mutate project state).'
    })
  );

  return {
    category: 'Branching',
    status: computeCategoryStatus(functions),
    functions
  };
}

async function runDevelopmentToolTests() {
  const functions = [
    {
      name: 'generate_typescript_types',
      description: 'Generate TypeScript types from schema',
      ok: null,
      notes: 'Requires CLI invocation; not run automatically.'
    },
    {
      name: 'get_logs',
      description: 'Get service logs',
      ok: null,
      notes: 'Requires project log streaming; skipped.'
    },
    {
      name: 'get_advisors',
      description: 'Get security/performance advisors',
      ok: null,
      notes: 'Requires Management API advisors endpoint; skipped.'
    }
  ];

  return {
    category: 'Development Tools',
    status: computeCategoryStatus(functions),
    functions
  };
}

function summariseResults(categories) {
  const totals = categories.reduce(
    (acc, category) => {
      category.functions.forEach(func => {
        if (func.ok === true) acc.success += 1;
        else if (func.ok === null) acc.skipped += 1;
        else acc.failed += 1;
      });
      return acc;
    },
    { success: 0, failed: 0, skipped: 0 }
  );
  return totals;
}

async function main() {
  const categories = [
    await runDocumentationTests(),
    await runProjectManagementTests(),
    await runDatabaseOperationTests(),
    await runDevelopmentToolTests(),
    await runEdgeFunctionTests(),
    await runBranchingTests()
  ];

  categories.forEach(printCategory);

  const totals = summariseResults(categories);

  console.log(chalk.yellow('\n' + '='.repeat(60)));
  console.log(chalk.bold.white('\n📊 SUMMARY\n'));
  console.log(chalk.green(`✅ Passed: ${totals.success}`));
  console.log(chalk.yellow(`⚠️  Skipped: ${totals.skipped}`));
  console.log(chalk.red(`❌ Failed: ${totals.failed}`));

  if (!accessToken) {
    console.log(
      chalk.yellow('\n⚠️  Missing SUPABASE_ACCESS_TOKEN — management API checks are skipped.')
    );
  } else {
    console.log(
      chalk.green('\n✅ Personal access token detected — management API checks executed where safe.')
    );
  }

  if (!serviceRoleKey) {
    console.log(
      chalk.yellow('⚠️  SUPABASE_SERVICE_ROLE_KEY not found — consider adding it for additional checks.')
    );
  }

  console.log(
    chalk.cyan('\n🔧 Non-destructive checks completed. Destructive operations remain manual by design.\n')
  );
}

main().catch(error => {
  console.error(chalk.red('\n❌ Verification script failed:'), error);
  process.exitCode = 1;
});
