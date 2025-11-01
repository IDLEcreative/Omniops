#!/usr/bin/env node

/**
 * Lightweight MCP client test for the Supabase MCP server.
 * Spawns the server via stdio, lists available tools, and
 * invokes `list_tables` to confirm end-to-end access.
 */

import { config as loadEnv } from 'dotenv';
import { Client } from '@modelcontextprotocol/sdk/client';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Load .env and .env.local (if present) so we can reuse existing Supabase creds.
loadEnv({ path: '.env' });
loadEnv({ path: '.env.local', override: true });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const accessToken =
  process.env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_PERSONAL_ACCESS_TOKEN;

if (!supabaseUrl) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL in environment.');
  process.exit(1);
}

if (!serviceRoleKey) {
  console.error('Missing SUPABASE_SERVICE_ROLE_KEY in environment.');
  process.exit(1);
}

if (!accessToken) {
  console.error('Missing SUPABASE_ACCESS_TOKEN (or SUPABASE_PERSONAL_ACCESS_TOKEN) in environment.');
  process.exit(1);
}

const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ??
  null;

if (!projectRef) {
  console.error('Unable to derive Supabase project reference. Set SUPABASE_PROJECT_REF explicitly.');
  process.exit(1);
}

async function main() {
  const transport = new StdioClientTransport({
    command: 'npx',
    args: ['-y', '@supabase/mcp-server-supabase', `--project-ref=${projectRef}`],
    env: {
      SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
      SUPABASE_ACCESS_TOKEN: accessToken
    },
    stderr: 'inherit'
  });

  const client = new Client(
    { name: 'Omniops MCP Test Harness', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  console.log('🔄 Connecting to Supabase MCP server via stdio…');
  await client.connect(transport);
  console.log('✅ Connected.\n');

  const { tools } = await client.listTools();
  console.log('🛠️  Available tools:', tools.map(tool => tool.name).join(', ') || '(none)');

  if (!tools.some(tool => tool.name === 'list_tables')) {
    throw new Error('list_tables tool not found on Supabase MCP server.');
  }

  console.log('\n📋 Invoking list_tables …');
  const result = await client.callTool({
    name: 'list_tables',
    arguments: {}
  });

  if (result.isError) {
    throw new Error(`list_tables returned an error: ${result.error?.message ?? 'unknown error'}`);
  }

  const rawOutput =
    result.structuredContent ??
    (Array.isArray(result.content)
      ? result.content
          .map(chunk => ('text' in chunk ? chunk.text : JSON.stringify(chunk)))
          .join('')
      : result.content);

  let tables;
  if (Array.isArray(rawOutput)) {
    tables = rawOutput;
  } else if (typeof rawOutput === 'string') {
    try {
      tables = JSON.parse(rawOutput);
    } catch (error) {
      console.warn('Warning: could not parse tool output as JSON; displaying raw payload.');
      console.log(rawOutput);
    }
  } else if (rawOutput) {
    tables = rawOutput.tables ?? rawOutput.result ?? rawOutput.tools ?? null;
  }

  if (Array.isArray(tables)) {
    const sample = tables.slice(0, 5).map(({ schema, name }) => `${schema}.${name}`);
    console.log('First tables:', sample.join(', '));
    if (tables.length > 5) {
      console.log(`(Total tables reported: ${tables.length})`);
    }
  } else {
    console.log(rawOutput);
  }

  await client.close();
  console.log('\n🏁 MCP test complete.');
}

main().catch(error => {
  console.error('❌ MCP test failed:', error?.message ?? error);
  process.exit(1);
});
