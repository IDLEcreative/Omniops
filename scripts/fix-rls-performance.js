#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLSPerformance() {
  console.log('🔧 Fixing RLS Performance Issues...\n');

  const migrations = [
    {
      name: 'Fix auth RLS for domains table',
      query: `
        -- Fix auth RLS initialization plan issues for domains table
        DROP POLICY IF EXISTS "Users can view their own domains" ON public.domains;
        CREATE POLICY "Users can view their own domains" ON public.domains
          FOR SELECT USING ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can insert their own domains" ON public.domains;
        CREATE POLICY "Users can insert their own domains" ON public.domains
          FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can update their own domains" ON public.domains;
        CREATE POLICY "Users can update their own domains" ON public.domains
          FOR UPDATE USING ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can delete their own domains" ON public.domains;
        CREATE POLICY "Users can delete their own domains" ON public.domains
          FOR DELETE USING ((SELECT auth.uid()) = user_id);
      `
    },
    {
      name: 'Fix auth RLS for structured_extractions table',
      query: `
        -- Fix auth RLS initialization plan issues for structured_extractions table
        DROP POLICY IF EXISTS "Users can view their domain's extractions" ON public.structured_extractions;
        CREATE POLICY "Users can view their domain's extractions" ON public.structured_extractions
          FOR SELECT USING (
            domain IN (
              SELECT domain FROM public.domains 
              WHERE user_id = (SELECT auth.uid())
            )
          );

        DROP POLICY IF EXISTS "Users can insert extractions for their domains" ON public.structured_extractions;
        CREATE POLICY "Users can insert extractions for their domains" ON public.structured_extractions
          FOR INSERT WITH CHECK (
            domain IN (
              SELECT domain FROM public.domains 
              WHERE user_id = (SELECT auth.uid())
            )
          );
      `
    },
    {
      name: 'Fix auth RLS for website_content table',
      query: `
        -- Fix auth RLS initialization plan issues for website_content table
        DROP POLICY IF EXISTS "Users can view their domain's content" ON public.website_content;
        CREATE POLICY "Users can view their domain's content" ON public.website_content
          FOR SELECT USING (
            domain IN (
              SELECT domain FROM public.domains 
              WHERE user_id = (SELECT auth.uid())
            )
          );

        DROP POLICY IF EXISTS "Users can insert content for their domains" ON public.website_content;
        CREATE POLICY "Users can insert content for their domains" ON public.website_content
          FOR INSERT WITH CHECK (
            domain IN (
              SELECT domain FROM public.domains 
              WHERE user_id = (SELECT auth.uid())
            )
          );
      `
    },
    {
      name: 'Fix auth RLS for scraped_pages table',
      query: `
        -- Fix auth RLS initialization plan issues for scraped_pages table
        DROP POLICY IF EXISTS "Users can view their domain's pages" ON public.scraped_pages;
        CREATE POLICY "Users can view their domain's pages" ON public.scraped_pages
          FOR SELECT USING (
            domain IN (
              SELECT domain FROM public.domains 
              WHERE user_id = (SELECT auth.uid())
            )
          );

        DROP POLICY IF EXISTS "Users can insert pages for their domains" ON public.scraped_pages;
        CREATE POLICY "Users can insert pages for their domains" ON public.scraped_pages
          FOR INSERT WITH CHECK (
            domain IN (
              SELECT domain FROM public.domains 
              WHERE user_id = (SELECT auth.uid())
            )
          );
      `
    },
    {
      name: 'Fix auth RLS for scrape_jobs table',
      query: `
        -- Fix auth RLS initialization plan issues for scrape_jobs table
        DROP POLICY IF EXISTS "Users can view their own scrape jobs" ON public.scrape_jobs;
        CREATE POLICY "Users can view their own scrape jobs" ON public.scrape_jobs
          FOR SELECT USING ((SELECT auth.uid()) = user_id);

        DROP POLICY IF EXISTS "Users can manage their own scrape jobs" ON public.scrape_jobs;
        CREATE POLICY "Users can manage their own scrape jobs" ON public.scrape_jobs
          FOR ALL USING ((SELECT auth.uid()) = user_id);
      `
    },
    {
      name: 'Consolidate multiple permissive policies for scrape_jobs',
      query: `
        -- Remove duplicate SELECT policies for scrape_jobs
        DROP POLICY IF EXISTS "Users can view their own scrape jobs" ON public.scrape_jobs;
        
        -- Keep only one comprehensive policy for all operations
        DROP POLICY IF EXISTS "Users can manage their own scrape jobs" ON public.scrape_jobs;
        CREATE POLICY "Users manage own scrape jobs" ON public.scrape_jobs
          FOR ALL USING ((SELECT auth.uid()) = user_id);
      `
    },
    {
      name: 'Remove duplicate index on page_embeddings',
      query: `
        -- Drop the duplicate index (keeping the one with the more descriptive name)
        DROP INDEX IF EXISTS public.idx_page_embeddings_page;
      `
    }
  ];

  let successCount = 0;
  let errorCount = 0;

  for (const migration of migrations) {
    console.log(`📝 Applying: ${migration.name}`);
    try {
      const { error } = await supabase.rpc('exec_sql', {
        sql: migration.query
      }).single();

      if (error) {
        // Try direct execution if RPC fails
        const { error: directError } = await supabase
          .from('_migrations')
          .insert({ 
            name: migration.name.toLowerCase().replace(/\s+/g, '_'),
            executed_at: new Date().toISOString()
          });

        // Execute via direct SQL (this requires service role)
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`
          },
          body: JSON.stringify({ sql: migration.query })
        });

        if (!response.ok) {
          throw new Error(`Failed to execute migration: ${response.statusText}`);
        }
      }
      
      console.log(`✅ Success: ${migration.name}\n`);
      successCount++;
    } catch (err) {
      console.error(`❌ Error: ${err.message}\n`);
      errorCount++;
    }
  }

  console.log('\n📊 Summary:');
  console.log(`✅ Successful migrations: ${successCount}`);
  console.log(`❌ Failed migrations: ${errorCount}`);
  
  if (errorCount === 0) {
    console.log('\n🎉 All RLS performance optimizations applied successfully!');
  } else {
    console.log('\n⚠️  Some migrations failed. Please review the errors above.');
  }
}

// Run the script
fixRLSPerformance().catch(console.error);