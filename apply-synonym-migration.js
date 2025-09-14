#!/usr/bin/env node
/**
 * Apply domain-specific synonym mappings migration
 */

const fs = require('fs');
const path = require('path');

const SUPABASE_ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_f30783ba26b0a6ae2bba917988553bd1d5f76d97';
const PROJECT_REF = 'birugqyuqhiahxvxeyqg';

async function applyMigration() {
  console.log('📦 Applying domain-specific synonym mappings migration...\n');
  
  // Read the migration file
  const migrationPath = path.join(__dirname, 'supabase/migrations/20250114_domain_synonym_mappings.sql');
  const sqlStatement = fs.readFileSync(migrationPath, 'utf8');
  
  console.log('🔧 Creating synonym tables and functions...');
  
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sqlStatement })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ Migration failed:', result);
      return false;
    }
    
    console.log('✅ Migration applied successfully!');
    console.log('📝 Created tables: domain_synonym_mappings, global_synonym_mappings');
    console.log('📝 Created functions: get_domain_synonyms, learn_domain_synonym');
    console.log('📝 Added generic synonyms for all domains');
    
    return true;
  } catch (error) {
    console.error('❌ Error applying migration:', error);
    return false;
  }
}

async function initializeThompsonsSynonyms() {
  console.log('\n🎯 Initializing Thompson\'s eParts specific synonyms...\n');
  
  // Thompson's specific synonyms (domain-isolated)
  const thompsonsSynonyms = `
    -- Get Thompson's domain ID
    WITH thompson_domain AS (
      SELECT id FROM customer_configs 
      WHERE domain = 'thompsonseparts.co.uk'
      LIMIT 1
    )
    -- Insert Thompson's specific synonyms
    INSERT INTO domain_synonym_mappings (domain_id, term, synonyms, weight)
    SELECT 
      td.id,
      v.term,
      v.synonyms::jsonb,
      1.0
    FROM thompson_domain td, 
    (VALUES
      ('forest equipment', '["forest loader", "forestry", "logging equipment", "timber equipment"]'),
      ('hydraulic', '["hyd", "hydraulics", "fluid power"]'),
      ('chainsaw', '["chain saw", "saw", "cutting tool", "timber saw"]'),
      ('tough', '["extreme", "harsh", "severe", "heavy duty"]'),
      ('weather', '["climatic conditions", "climate", "environmental"]'),
      ('tank', '["reservoir", "container", "vessel", "hydraulic tank"]'),
      ('pump', '["hydraulic pump", "fluid pump", "pumping unit"]'),
      ('valve', '["control valve", "hydraulic valve", "flow control"]'),
      ('cylinder', '["hydraulic cylinder", "actuator", "ram"]'),
      ('cat', '["caterpillar", "cat equipment"]'),
      ('jd', '["john deere", "deere"]'),
      ('excavator', '["digger", "earthmover", "excavating machine"]'),
      ('loader', '["loading equipment", "crane", "lift"]'),
      ('tractor', '["agricultural tractor", "farm tractor"]'),
      ('blade', '["cutting blade", "saw blade", "cutter"]'),
      ('chain', '["saw chain", "cutting chain", "chainsaw chain"]'),
      ('bar', '["guide bar", "chainsaw bar", "cutting bar"]'),
      ('filter', '["strainer", "screen", "filtration"]'),
      ('oil', '["lubricant", "fluid", "hydraulic oil"]'),
      ('pressure', '["psi", "bar", "hydraulic pressure"]'),
      ('flow', '["flow rate", "gpm", "lpm", "fluid flow"]')
    ) AS v(term, synonyms)
    ON CONFLICT (domain_id, term) DO UPDATE
    SET synonyms = EXCLUDED.synonyms,
        updated_at = NOW();
  `;
  
  try {
    const response = await fetch(
      `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: thompsonsSynonyms })
      }
    );
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('⚠️ Could not initialize Thompson\'s synonyms:', result);
      console.log('(This is expected if Thompson\'s domain doesn\'t exist yet)');
      return;
    }
    
    console.log('✅ Thompson\'s eParts synonyms initialized!');
    console.log('📊 Added 21 domain-specific synonym mappings');
    
  } catch (error) {
    console.error('⚠️ Error initializing Thompson\'s synonyms:', error);
  }
}

// Run the migration
async function main() {
  const success = await applyMigration();
  
  if (success) {
    await initializeThompsonsSynonyms();
    
    console.log('\n🎉 Domain-specific synonym system ready!');
    console.log('\n📋 Summary:');
    console.log('  ✅ Domain-isolated synonym mappings');
    console.log('  ✅ Generic safe synonyms for all domains');
    console.log('  ✅ Thompson\'s specific terms (if domain exists)');
    console.log('  ✅ Learning capability from successful queries');
    console.log('\n💡 Each customer domain now has isolated synonyms!');
  }
}

main().catch(console.error);