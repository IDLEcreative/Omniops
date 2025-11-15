/**
 * Shared Helper Functions for Metadata Validation Tests
 */

import { createClient } from '@supabase/supabase-js';
import { ConversationMetadataManager } from '../../../lib/chat/conversation-metadata';
import { ResponseParser } from '../../../lib/chat/response-parser';
import { RealProduct } from './types';

// Supabase client setup - use service role to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Query real products from database
 */
export async function queryRealProducts(domain: string, limit: number = 10): Promise<RealProduct[]> {
  console.log(`\n📊 Querying ${limit} real products from domain: ${domain}...`);

  // First, get the domain_id
  const { data: configData, error: configError } = await supabase
    .from('customer_configs')
    .select('id')
    .eq('domain', domain)
    .single();

  if (configError || !configData) {
    console.error('❌ Domain not found:', domain);
    return [];
  }

  const { data, error } = await supabase
    .from('scraped_pages')
    .select('title, url, excerpt, domain_id')
    .eq('domain_id', configData.id)
    .not('title', 'is', null)
    .limit(limit);

  if (error) {
    console.error('❌ Database query error:', error);
    return [];
  }

  if (!data || data.length === 0) {
    console.error(`❌ No products found for domain: ${domain}`);
    return [];
  }

  console.log(`✅ Retrieved ${data.length} real products`);
  data.forEach((p, idx) => {
    console.log(`   ${idx + 1}. ${p.title} (${p.url})`);
  });

  return data as RealProduct[];
}

/**
 * Helper function to parse and track
 */
export async function parseAndTrack(
  aiResponse: string,
  userMessage: string,
  manager: ConversationMetadataManager
): Promise<void> {
  const currentTurn = manager.getCurrentTurn();
  const parsed = ResponseParser.parseResponse(userMessage, aiResponse, currentTurn);

  parsed.entities.forEach(entity => manager.trackEntity(entity));
  parsed.corrections.forEach(correction => {
    manager.trackCorrection(correction.original, correction.corrected, userMessage);
  });
  parsed.lists.forEach(list => manager.trackList(list.items));
}
