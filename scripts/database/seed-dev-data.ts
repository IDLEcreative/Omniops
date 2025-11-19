#!/usr/bin/env tsx

/**
 * Seed Development Data
 *
 * Creates sample data for local development.
 * Idempotent - safe to run multiple times.
 * Creates:
 * - Customer configurations
 * - Sample conversations
 * - Sample messages
 *
 * Usage: npx tsx scripts/database/seed-dev-data.ts
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceKey)

const SEED_DOMAIN = 'dev.local'
const SEED_ORG_ID = 'org-dev-seed-001'

async function seedData() {
  console.log('Starting seed data creation...')
  console.log(`Domain: ${SEED_DOMAIN}`)

  try {
    // 1. Create or update customer config
    console.log('\n1. Creating customer configuration...')
    const { data: config, error: configError } = await supabase
      .from('customer_configs')
      .upsert(
        {
          domain: SEED_DOMAIN,
          organization_id: SEED_ORG_ID,
          widget_settings: {
            title: 'Development Support',
            description: 'Development test widget',
            theme: 'light',
          },
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'domain' }
      )
      .select()

    if (configError) {
      console.error('Config error:', configError)
      throw configError
    }
    console.log('✓ Customer config created/updated')

    // 2. Create sample conversations
    console.log('\n2. Creating sample conversations...')
    const conversationIds: string[] = []

    for (let i = 1; i <= 3; i++) {
      const { data: conv, error: convError } = await supabase
        .from('conversations')
        .insert({
          domain: SEED_DOMAIN,
          visitor_id: `visitor-dev-${i}`,
          organization_id: SEED_ORG_ID,
          is_active: true,
          created_at: new Date(Date.now() - i * 3600000).toISOString(),
        })
        .select('id')
        .single()

      if (convError) {
        console.error(`Conversation ${i} error:`, convError)
        continue
      }

      conversationIds.push(conv.id)
    }

    console.log(`✓ Created ${conversationIds.length} sample conversations`)

    // 3. Create sample messages
    if (conversationIds.length > 0) {
      console.log('\n3. Creating sample messages...')

      const messages = []
      for (let i = 0; i < conversationIds.length; i++) {
        messages.push({
          conversation_id: conversationIds[i],
          role: 'user',
          content: `Development question ${i + 1}?`,
          created_at: new Date().toISOString(),
        })
        messages.push({
          conversation_id: conversationIds[i],
          role: 'assistant',
          content: `This is a development test response ${i + 1}.`,
          created_at: new Date(Date.now() + 1000).toISOString(),
        })
      }

      const { error: msgError } = await supabase.from('messages').insert(messages)

      if (msgError) {
        console.error('Messages error:', msgError)
        throw msgError
      }

      console.log(`✓ Created ${messages.length} sample messages`)
    }

    console.log('\n✅ Seed data created successfully!')
    console.log(`\nConfiguration:`)
    console.log(`  Domain: ${SEED_DOMAIN}`)
    console.log(`  Organization ID: ${SEED_ORG_ID}`)
    console.log(`  Conversations: ${conversationIds.length}`)
  } catch (error) {
    console.error('\n❌ Seed failed:', error)
    process.exit(1)
  }
}

seedData()
