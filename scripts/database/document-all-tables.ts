#!/usr/bin/env tsx
/**
 * Database Schema Documentation Script
 *
 * Purpose: Query Supabase database to document all 85 tables
 * Resolves: Issue #030 - Document 54 undocumented tables
 *
 * This script:
 * 1. Queries information_schema for all tables
 * 2. Gets columns, constraints, indexes, RLS policies
 * 3. Cross-references with documented tables
 * 4. Generates comprehensive documentation
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Already documented tables from REFERENCE_DATABASE_SCHEMA.md
const DOCUMENTED_TABLES = [
  'customer_configs',
  'domains',
  'organizations',
  'organization_members',
  'organization_invitations',
  'scraped_pages',
  'scrape_jobs',
  'embedding_queue',
  'entity_extraction_queue',
  'structured_extractions',
  'website_content',
  'page_embeddings',
  'entity_catalog',
  'product_catalog',
  'training_data',
  'conversations',
  'messages',
  'chat_telemetry',
  'chat_telemetry_rollups',
  'chat_telemetry_domain_rollups',
  'chat_telemetry_model_rollups',
  'chat_cost_alerts',
  'gdpr_audit_log',
  'demo_attempts',
  'widget_configs',
  'widget_config_variants',
  'widget_config_history',
  'global_synonym_mappings',
  'domain_synonym_mappings',
  'business_classifications',
  'query_cache',
  'search_cache'
];

interface TableInfo {
  tableName: string;
  rowCount: number;
  columns: ColumnInfo[];
  indexes: IndexInfo[];
  foreignKeys: ForeignKeyInfo[];
  rlsPolicies: RLSPolicyInfo[];
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
  isPrimaryKey: boolean;
  isUnique: boolean;
}

interface IndexInfo {
  name: string;
  type: string;
  columns: string[];
  isUnique: boolean;
  definition: string;
}

interface ForeignKeyInfo {
  constraintName: string;
  columnName: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
  onUpdate: string;
}

interface RLSPolicyInfo {
  policyName: string;
  command: string;
  definition: string;
}

/**
 * Execute raw SQL query via Supabase
 */
async function executeSql(query: string): Promise<any[]> {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      throw new Error(`SQL execution failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

/**
 * Query all tables in the public schema
 */
async function getAllTables(): Promise<string[]> {
  const query = `
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name;
  `;

  const data = await executeSql(query);
  return data.map((row: any) => row.table_name);
}

/**
 * Get detailed column information for a table
 */
async function getTableColumns(tableName: string): Promise<ColumnInfo[]> {
  const query = `
    SELECT
      c.column_name,
      c.data_type,
      c.is_nullable,
      c.column_default,
      CASE
        WHEN pk.column_name IS NOT NULL THEN true
        ELSE false
      END as is_primary_key,
      CASE
        WHEN uq.column_name IS NOT NULL THEN true
        ELSE false
      END as is_unique
    FROM information_schema.columns c
    LEFT JOIN (
      SELECT ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type = 'PRIMARY KEY'
    ) pk ON c.column_name = pk.column_name
    LEFT JOIN (
      SELECT ku.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage ku
        ON tc.constraint_name = ku.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = '${tableName}'
        AND tc.constraint_type = 'UNIQUE'
    ) uq ON c.column_name = uq.column_name
    WHERE c.table_schema = 'public'
      AND c.table_name = '${tableName}'
    ORDER BY c.ordinal_position;
  `;

  const data = await executeSql(query);

  return data.map((row: any) => ({
    name: row.column_name,
    type: row.data_type,
    nullable: row.is_nullable === 'YES',
    defaultValue: row.column_default,
    isPrimaryKey: row.is_primary_key,
    isUnique: row.is_unique
  }));
}

/**
 * Get indexes for a table
 */
async function getTableIndexes(tableName: string): Promise<IndexInfo[]> {
  const query = `
    SELECT
      i.indexname,
      i.indexdef,
      CASE
        WHEN i.indexdef LIKE '%UNIQUE%' THEN true
        ELSE false
      END as is_unique
    FROM pg_indexes i
    WHERE i.schemaname = 'public'
      AND i.tablename = '${tableName}'
    ORDER BY i.indexname;
  `;

  const data = await executeSql(query);

  return data.map((row: any) => ({
    name: row.indexname,
    type: row.indexdef.includes('USING hnsw') ? 'HNSW' :
          row.indexdef.includes('USING gin') ? 'GIN' :
          row.indexdef.includes('USING gist') ? 'GIST' :
          'B-tree',
    columns: [], // Would need additional parsing
    isUnique: row.is_unique,
    definition: row.indexdef
  }));
}

/**
 * Get foreign key constraints for a table
 */
async function getTableForeignKeys(tableName: string): Promise<ForeignKeyInfo[]> {
  const query = `
    SELECT
      tc.constraint_name,
      kcu.column_name,
      ccu.table_name AS referenced_table,
      ccu.column_name AS referenced_column,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = tc.constraint_name
    JOIN information_schema.referential_constraints rc
      ON rc.constraint_name = tc.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_schema = 'public'
      AND tc.table_name = '${tableName}';
  `;

  const data = await executeSql(query);

  return data.map((row: any) => ({
    constraintName: row.constraint_name,
    columnName: row.column_name,
    referencedTable: row.referenced_table,
    referencedColumn: row.referenced_column,
    onDelete: row.delete_rule,
    onUpdate: row.update_rule
  }));
}

/**
 * Get RLS policies for a table
 */
async function getTableRLSPolicies(tableName: string): Promise<RLSPolicyInfo[]> {
  const query = `
    SELECT
      policyname,
      cmd,
      qual
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = '${tableName}'
    ORDER BY policyname;
  `;

  const data = await executeSql(query);

  return data.map((row: any) => ({
    policyName: row.policyname,
    command: row.cmd,
    definition: row.qual
  }));
}

/**
 * Get row count for a table
 */
async function getTableRowCount(tableName: string): Promise<number> {
  try {
    // Use Supabase client for row count (simpler than raw SQL)
    const { count, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.error(`Error counting rows for ${tableName}:`, error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error(`Failed to count rows for ${tableName}:`, error);
    return 0;
  }
}

/**
 * Get comprehensive information for a table
 */
async function getTableInfo(tableName: string): Promise<TableInfo> {
  console.log(`Analyzing table: ${tableName}...`);

  const [columns, indexes, foreignKeys, rlsPolicies, rowCount] = await Promise.all([
    getTableColumns(tableName),
    getTableIndexes(tableName),
    getTableForeignKeys(tableName),
    getTableRLSPolicies(tableName),
    getTableRowCount(tableName)
  ]);

  return {
    tableName,
    rowCount,
    columns,
    indexes,
    foreignKeys,
    rlsPolicies
  };
}

/**
 * Generate markdown documentation for a table
 */
function generateTableMarkdown(table: TableInfo): string {
  let md = `\n### \`${table.tableName}\`\n\n`;

  // Purpose placeholder
  md += `**Purpose**: [TODO: Add purpose]\n\n`;

  // Row count
  md += `**Row Count**: ${table.rowCount.toLocaleString()}\n\n`;

  // Columns
  md += `**Columns**:\n`;
  md += '```\n';
  md += 'Column                     | Type                        | Nullable | Default\n';
  md += '---------------------------+-----------------------------+----------+------------------\n';

  table.columns.forEach(col => {
    const name = col.name.padEnd(26);
    const type = col.type.padEnd(28);
    const nullable = (col.nullable ? 'YES' : 'NOT NULL').padEnd(9);
    const defaultVal = col.defaultValue || '';

    md += `${name}| ${type}| ${nullable}| ${defaultVal}\n`;
  });

  md += '```\n\n';

  // Primary keys
  const primaryKeys = table.columns.filter(c => c.isPrimaryKey).map(c => c.name);
  if (primaryKeys.length > 0) {
    md += `**Primary Key**: ${primaryKeys.join(', ')}\n\n`;
  }

  // Foreign keys
  if (table.foreignKeys.length > 0) {
    md += `**Foreign Keys**:\n`;
    table.foreignKeys.forEach(fk => {
      md += `- \`${fk.columnName}\` -> \`${fk.referencedTable}(${fk.referencedColumn})\` (ON DELETE ${fk.onDelete})\n`;
    });
    md += '\n';
  }

  // Indexes
  if (table.indexes.length > 0) {
    md += `**Indexes** (${table.indexes.length}):\n`;
    table.indexes.forEach(idx => {
      const uniqueFlag = idx.isUnique ? ' (UNIQUE)' : '';
      const typeFlag = idx.type !== 'B-tree' ? ` (${idx.type})` : '';
      md += `- \`${idx.name}\`${uniqueFlag}${typeFlag}\n`;
    });
    md += '\n';
  }

  // RLS policies
  if (table.rlsPolicies.length > 0) {
    md += `**RLS Policies** (${table.rlsPolicies.length}):\n`;
    table.rlsPolicies.forEach(policy => {
      md += `- \`${policy.policyName}\` (${policy.command})\n`;
    });
    md += '\n';
  }

  md += '---\n';

  return md;
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Starting database schema documentation...\n');

  // Get all tables
  const allTables = await getAllTables();
  console.log(`📊 Found ${allTables.length} total tables\n`);

  // Identify undocumented tables
  const undocumentedTables = allTables.filter(t => !DOCUMENTED_TABLES.includes(t));
  console.log(`📝 Documented tables: ${DOCUMENTED_TABLES.length}`);
  console.log(`❓ Undocumented tables: ${undocumentedTables.length}\n`);

  console.log('Undocumented tables:');
  undocumentedTables.forEach(t => console.log(`  - ${t}`));
  console.log('\n');

  // Analyze all undocumented tables
  const tableInfos: TableInfo[] = [];

  for (const tableName of undocumentedTables) {
    try {
      const info = await getTableInfo(tableName);
      tableInfos.push(info);
    } catch (error) {
      console.error(`Failed to analyze ${tableName}:`, error);
    }
  }

  // Categorize tables
  const categories = categorizeTables(tableInfos);

  // Generate markdown documentation
  let documentation = `# Undocumented Database Tables\n\n`;
  documentation += `**Generated**: ${new Date().toISOString()}\n`;
  documentation += `**Total Undocumented Tables**: ${undocumentedTables.length}\n\n`;
  documentation += `## Table Categories\n\n`;

  for (const [category, tables] of Object.entries(categories)) {
    documentation += `### ${category} (${tables.length} tables)\n\n`;

    tables.forEach(table => {
      documentation += generateTableMarkdown(table);
    });
  }

  // Write to file
  const outputPath = path.join(process.cwd(), 'docs/10-ANALYSIS/ANALYSIS_UNDOCUMENTED_TABLES.md');
  fs.writeFileSync(outputPath, documentation);

  console.log(`\n✅ Documentation written to: ${outputPath}`);
  console.log(`\n📊 Summary:`);
  console.log(`   - Total tables: ${allTables.length}`);
  console.log(`   - Documented: ${DOCUMENTED_TABLES.length}`);
  console.log(`   - Undocumented: ${undocumentedTables.length}`);
  console.log(`   - Successfully analyzed: ${tableInfos.length}`);

  // Print category breakdown
  console.log(`\n📁 Category Breakdown:`);
  for (const [category, tables] of Object.entries(categories)) {
    console.log(`   - ${category}: ${tables.length} tables`);
  }
}

/**
 * Categorize tables by purpose based on naming patterns
 */
function categorizeTables(tables: TableInfo[]): Record<string, TableInfo[]> {
  const categories: Record<string, TableInfo[]> = {
    'Cart Analytics': [],
    'Funnel Tracking': [],
    'Autonomous Operations': [],
    'Feature Management': [],
    'Alerts & Monitoring': [],
    'User Management': [],
    'Advanced Features': [],
    'Translation & Localization': [],
    'Integration': [],
    'Other': []
  };

  tables.forEach(table => {
    const name = table.tableName.toLowerCase();

    if (name.includes('cart')) {
      categories['Cart Analytics'].push(table);
    } else if (name.includes('funnel')) {
      categories['Funnel Tracking'].push(table);
    } else if (name.includes('autonomous')) {
      categories['Autonomous Operations'].push(table);
    } else if (name.includes('feature') || name.includes('flag') || name.includes('rollout')) {
      categories['Feature Management'].push(table);
    } else if (name.includes('alert') || name.includes('threshold') || name.includes('circuit_breaker') || name.includes('error_log')) {
      categories['Alerts & Monitoring'].push(table);
    } else if (name.includes('customer_session') || name.includes('notification') || name.includes('feedback')) {
      categories['User Management'].push(table);
    } else if (name.includes('quote') || name.includes('recommendation') || name.includes('follow_up')) {
      categories['Advanced Features'].push(table);
    } else if (name.includes('language') || name.includes('translation') || name.includes('supported_languages')) {
      categories['Translation & Localization'].push(table);
    } else if (name.includes('whatsapp') || name.includes('instagram') || name.includes('oauth') || name.includes('webhook')) {
      categories['Integration'].push(table);
    } else {
      categories['Other'].push(table);
    }
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([_, tables]) => tables.length > 0)
  );
}

// Run the script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
