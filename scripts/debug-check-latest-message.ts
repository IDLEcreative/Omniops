/**
 * Debug script to check if latest message has metadata
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLatestMessage() {
  console.log('🔍 Fetching latest message from database...\n');

  const { data: messages, error } = await supabase
    .from('messages')
    .select('id, role, content, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(3);

  if (error) {
    console.error('❌ Error fetching messages:', error);
    return;
  }

  if (!messages || messages.length === 0) {
    console.log('⚠️  No messages found');
    return;
  }

  console.log(`✅ Found ${messages.length} recent messages:\n`);

  messages.forEach((msg, index) => {
    console.log(`\n--- Message ${index + 1} ---`);
    console.log(`ID: ${msg.id}`);
    console.log(`Role: ${msg.role}`);
    console.log(`Content preview: ${msg.content.substring(0, 80)}...`);
    console.log(`Created: ${msg.created_at}`);
    console.log(`Has metadata: ${!!msg.metadata}`);

    if (msg.metadata) {
      console.log(`Metadata keys: ${Object.keys(msg.metadata).join(', ')}`);

      if (msg.metadata.shoppingProducts) {
        console.log(`✅ Shopping products: ${msg.metadata.shoppingProducts.length} products`);
        console.log(`First product:`, msg.metadata.shoppingProducts[0]);
      } else {
        console.log(`❌ NO shopping products in metadata`);
      }

      console.log(`Full metadata:`, JSON.stringify(msg.metadata, null, 2));
    } else {
      console.log(`❌ NO metadata at all`);
    }
  });
}

checkLatestMessage().catch(console.error);
