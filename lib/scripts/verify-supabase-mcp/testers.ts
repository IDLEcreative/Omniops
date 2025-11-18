/**
 * Supabase MCP Test Runners
 *
 * Individual test functions for different MCP categories
 */

import { CategoryResult, FunctionResult, computeCategoryStatus, managementRequest, runSql } from './validators.js';

/**
 * Test documentation functionality
 */
export async function runDocumentationTests(): Promise<CategoryResult> {
  const functions: FunctionResult[] = [
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

/**
 * Test project management functionality
 */
export async function runProjectManagementTests(
  accessToken: string,
  projectRef: string
): Promise<CategoryResult> {
  const functions: FunctionResult[] = [];

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
      functions.push({ name: name || '', description: description || '', ok: null, notes: note })
    );

    return {
      category: 'Project Management',
      status: computeCategoryStatus(functions),
      functions
    };
  }

  const projects = await managementRequest('/v1/projects', accessToken);
  functions.push({
    name: 'list_projects',
    description: 'List all Supabase projects',
    ok: projects.ok,
    notes: projects.ok
      ? `Found ${Array.isArray(projects.data) ? projects.data.length : 0} project(s).`
      : projects.message
  });

  const organizations = await managementRequest('/v1/organizations', accessToken);
  functions.push({
    name: 'list_organizations',
    description: 'List all organizations',
    ok: organizations.ok,
    notes: organizations.ok
      ? `Found ${Array.isArray(organizations.data) ? organizations.data.length : 0} organization(s).`
      : organizations.message
  });

  if (projectRef) {
    const projectDetails = await managementRequest(`/v1/projects/${projectRef}`, accessToken);
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

/**
 * Test database operation functionality
 */
export async function runDatabaseOperationTests(
  accessToken: string,
  projectRef: string
): Promise<CategoryResult> {
  const functions: FunctionResult[] = [];

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
    `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name LIMIT 5;`,
    projectRef,
    accessToken
  );
  functions.push({
    name: 'list_tables',
    description: 'List database tables',
    ok: tables.ok,
    notes: tables.ok
      ? `Sample: ${(tables.data || []).map((row: any) => row.table_name).join(', ') || 'none found'}.`
      : tables.message
  });

  const pageCount = await runSql(
    `SELECT COUNT(*)::text AS total FROM public.scraped_pages;`,
    projectRef,
    accessToken
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
    `SELECT version FROM supabase_migrations.schema_migrations ORDER BY version DESC LIMIT 3;`,
    projectRef,
    accessToken
  );
  functions.push({
    name: 'list_migrations',
    description: 'List all migrations',
    ok: migrations.ok,
    notes: migrations.ok
      ? `Latest migration version: ${migrations.data?.[0]?.version ?? 'unknown'}.`
      : migrations.message ?? 'supabase_migrations.schema_migrations not found.'
  });

  return {
    category: 'Database Operations',
    status: computeCategoryStatus(functions),
    functions
  };
}

/**
 * Test edge function functionality
 */
export async function runEdgeFunctionTests(
  accessToken: string,
  projectRef: string
): Promise<CategoryResult> {
  const functions: FunctionResult[] = [];

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

  const listFunctions = await managementRequest(`/v1/projects/${projectRef}/functions`, accessToken);
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
