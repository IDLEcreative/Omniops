#!/usr/bin/env tsx
/**
 * Document All Undocumented Database Tables
 *
 * Purpose: Query Supabase database to identify and document the 54 undocumented tables
 * Resolves: Issue #030 - Document 54 undocumented database tables
 *
 * This script:
 * 1. Connects to Supabase PostgreSQL database
 * 2. Queries all tables in public schema
 * 3. Identifies which tables are not documented
 * 4. Gathers comprehensive metadata for each table
 * 5. Generates structured documentation
 */

import pg from 'pg';
import * as fs from 'fs';
import * as path from 'path';

const { Client } = pg;

// Build connection string from Supabase env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Extract project ref from URL
const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

if (!projectRef) {
  throw new Error('Could not extract project ref from SUPABASE_URL');
}

// Supabase PostgreSQL connection
const connectionString = `postgresql://postgres.${projectRef}:${serviceRoleKey}@aws-0-us-west-1.pooler.supabase.com:6543/postgres`;

// Already documented tables (from REFERENCE_DATABASE_SCHEMA.md)
const DOCUMENTED_TABLES = new Set([
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
]);

interface TableInfo {
  tableName: string;
  rowCount: number;
  columns: ColumnInfo[];
  indexes: string[];
  foreignKeys: ForeignKeyInfo[];
  rlsPolicies: number;
  tableSize: string;
}

interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue: string | null;
}

interface ForeignKeyInfo {
  column: string;
  referencedTable: string;
  referencedColumn: string;
  onDelete: string;
}

async function main() {
  const client = new Client({ connectionString });

  try {
    console.log('🔌 Connecting to Supabase PostgreSQL...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    // 1. Get all tables
    console.log('📋 Fetching all tables...');
    const tablesResult = await client.query(`
      SELECT
        t.tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS table_size,
        n_live_tup as row_count
      FROM pg_tables t
      LEFT JOIN pg_stat_user_tables s ON t.tablename = s.relname
      WHERE t.schemaname = 'public'
      ORDER BY t.tablename;
    `);

    const allTables = tablesResult.rows.map(r => r.tablename);
    const undocumentedTables = allTables.filter(t => !DOCUMENTED_TABLES.has(t));

    console.log(`\n📊 Statistics:`);
    console.log(`   Total tables: ${allTables.length}`);
    console.log(`   Documented: ${DOCUMENTED_TABLES.size}`);
    console.log(`   Undocumented: ${undocumentedTables.length}\n`);

    console.log('❓ Undocumented tables:');
    undocumentedTables.forEach(t => console.log(`   - ${t}`));
    console.log('');

    // 2. Gather detailed information for each undocumented table
    const tableInfos: TableInfo[] = [];

    for (const tableName of undocumentedTables) {
      console.log(`📖 Analyzing: ${tableName}...`);

      try {
        // Get columns
        const columnsResult = await client.query(`
          SELECT
            column_name,
            data_type,
            is_nullable,
            column_default
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name = $1
          ORDER BY ordinal_position;
        `, [tableName]);

        // Get foreign keys
        const fkResult = await client.query(`
          SELECT
            kcu.column_name,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column,
            rc.delete_rule
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage ccu
            ON ccu.constraint_name = tc.constraint_name
          JOIN information_schema.referential_constraints rc
            ON rc.constraint_name = tc.constraint_name
          WHERE tc.constraint_type = 'FOREIGN KEY'
            AND tc.table_schema = 'public'
            AND tc.table_name = $1;
        `, [tableName]);

        // Get indexes
        const indexResult = await client.query(`
          SELECT indexname
          FROM pg_indexes
          WHERE schemaname = 'public'
            AND tablename = $1
          ORDER BY indexname;
        `, [tableName]);

        // Get RLS policy count
        const rlsResult = await client.query(`
          SELECT COUNT(*) as policy_count
          FROM pg_policies
          WHERE schemaname = 'public'
            AND tablename = $1;
        `, [tableName]);

        // Get table metadata from pg_tables
        const metaResult = await client.query(`
          SELECT
            pg_size_pretty(pg_total_relation_size('public.'||$1)) AS table_size
        `, [tableName]);

        // Get row count
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);

        tableInfos.push({
          tableName,
          rowCount: parseInt(countResult.rows[0].count, 10),
          columns: columnsResult.rows.map(r => ({
            name: r.column_name,
            type: r.data_type,
            nullable: r.is_nullable === 'YES',
            defaultValue: r.column_default
          })),
          indexes: indexResult.rows.map(r => r.indexname),
          foreignKeys: fkResult.rows.map(r => ({
            column: r.column_name,
            referencedTable: r.referenced_table,
            referencedColumn: r.referenced_column,
            onDelete: r.delete_rule
          })),
          rlsPolicies: parseInt(rlsResult.rows[0].policy_count, 10),
          tableSize: metaResult.rows[0].table_size
        });
      } catch (error: any) {
        console.error(`   ❌ Error analyzing ${tableName}: ${error.message}`);
      }
    }

    console.log(`\n✅ Successfully analyzed ${tableInfos.length} tables\n`);

    // 3. Categorize tables
    const categories = categorizeTables(tableInfos);

    // 4. Generate documentation
    let documentation = generateDocumentation(categories, tableInfos.length);

    // 5. Write to file
    const outputPath = path.join(process.cwd(), 'docs/10-ANALYSIS/ANALYSIS_UNDOCUMENTED_TABLES.md');
    fs.writeFileSync(outputPath, documentation);

    console.log(`✅ Documentation written to: ${outputPath}\n`);

    // 6. Print summary
    console.log(`📁 Category Breakdown:`);
    for (const [category, tables] of Object.entries(categories)) {
      console.log(`   - ${category}: ${tables.length} tables`);
    }

    console.log(`\n✨ Done! ${tableInfos.length} tables documented.`);

  } catch (error: any) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
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
    'Translation & Localization': [],
    'Integration (WhatsApp, Instagram, OAuth)': [],
    'Advanced Features (Quotes, Recommendations)': [],
    'Product & Catalog': [],
    'System & Internal': [],
    'Other': []
  };

  tables.forEach(table => {
    const name = table.tableName.toLowerCase();

    if (name.includes('cart') && !name.includes('woocommerce')) {
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
    } else if (name.includes('language') || name.includes('translation') || name.includes('supported_language')) {
      categories['Translation & Localization'].push(table);
    } else if (name.includes('whatsapp') || name.includes('instagram') || name.includes('oauth') || name.includes('webhook')) {
      categories['Integration (WhatsApp, Instagram, OAuth)'].push(table);
    } else if (name.includes('quote') || name.includes('recommendation') || name.includes('follow_up')) {
      categories['Advanced Features (Quotes, Recommendations)'].push(table);
    } else if (name.includes('product') || name.includes('catalog') || name.includes('inventory')) {
      categories['Product & Catalog'].push(table);
    } else if (name.includes('migration') || name.includes('schema') || name.includes('version')) {
      categories['System & Internal'].push(table);
    } else {
      categories['Other'].push(table);
    }
  });

  // Remove empty categories
  return Object.fromEntries(
    Object.entries(categories).filter(([_, tables]) => tables.length > 0)
  );
}

/**
 * Generate markdown documentation
 */
function generateDocumentation(categories: Record<string, TableInfo[]>, totalCount: number): string {
  let doc = `# Undocumented Database Tables\n\n`;
  doc += `**Generated**: ${new Date().toISOString()}\n`;
  doc += `**Total Undocumented**: ${totalCount}\n`;
  doc += `**Status**: Auto-generated documentation - purposes need manual review\n\n`;

  doc += `## Purpose\n\n`;
  doc += `This document catalogs the ${totalCount} database tables that are not yet documented in REFERENCE_DATABASE_SCHEMA.md. `;
  doc += `Each table includes column information, relationships, indexes, and RLS policies.\n\n`;

  doc += `## Quick Reference\n\n`;
  doc += `| Category | Tables |\n`;
  doc += `|----------|--------|\n`;
  for (const [category, tables] of Object.entries(categories)) {
    doc += `| ${category} | ${tables.length} |\n`;
  }
  doc += `\n---\n\n`;

  // Generate table-by-table documentation
  for (const [category, tables] of Object.entries(categories)) {
    doc += `## ${category}\n\n`;

    for (const table of tables) {
      doc += generateTableSection(table);
    }
  }

  return doc;
}

/**
 * Generate documentation section for a single table
 */
function generateTableSection(table: TableInfo): string {
  let section = `### \`${table.tableName}\`\n\n`;

  // Metadata
  section += `**Purpose**: [TODO: Add purpose description]\n\n`;
  section += `**Statistics**:\n`;
  section += `- Row Count: ${table.rowCount.toLocaleString()}\n`;
  section += `- Table Size: ${table.tableSize}\n`;
  section += `- Indexes: ${table.indexes.length}\n`;
  section += `- Foreign Keys: ${table.foreignKeys.length}\n`;
  section += `- RLS Policies: ${table.rlsPolicies}\n\n`;

  // Columns
  section += `**Columns**:\n\n`;
  section += '```\n';
  section += 'Column                     | Type                        | Nullable | Default\n';
  section += '---------------------------+-----------------------------+----------+------------------\n';

  table.columns.forEach(col => {
    const name = col.name.padEnd(26);
    const type = col.type.padEnd(28);
    const nullable = (col.nullable ? 'YES' : 'NOT NULL').padEnd(9);
    const defaultVal = col.defaultValue || '';

    section += `${name}| ${type}| ${nullable}| ${defaultVal}\n`;
  });

  section += '```\n\n';

  // Foreign keys
  if (table.foreignKeys.length > 0) {
    section += `**Foreign Keys**:\n`;
    table.foreignKeys.forEach(fk => {
      section += `- \`${fk.column}\` → \`${fk.referencedTable}(${fk.referencedColumn})\` (ON DELETE ${fk.onDelete})\n`;
    });
    section += '\n';
  }

  // Indexes
  if (table.indexes.length > 0) {
    section += `**Indexes** (${table.indexes.length}):\n`;
    table.indexes.slice(0, 10).forEach(idx => {
      section += `- \`${idx}\`\n`;
    });
    if (table.indexes.length > 10) {
      section += `- ... and ${table.indexes.length - 10} more\n`;
    }
    section += '\n';
  }

  // RLS
  if (table.rlsPolicies > 0) {
    section += `**RLS**: ${table.rlsPolicies} ${table.rlsPolicies === 1 ? 'policy' : 'policies'} active\n\n`;
  }

  // Usage pattern placeholder
  section += `**Usage Pattern**: [TODO: Grep codebase for references]\n\n`;
  section += `**Related Tables**: [TODO: Identify related tables]\n\n`;

  section += `---\n\n`;

  return section;
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
