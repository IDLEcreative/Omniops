#!/usr/bin/env npx tsx
/**
 * Debug telemetry persistence issue
 */

import 'dotenv/config';
import { ChatTelemetry, telemetryManager } from './lib/chat-telemetry';
import { createClient } from '@supabase/supabase-js';

async function debugTelemetryPersistence() {
  console.log('🔍 Debugging Telemetry Persistence\n');
  
  // Check environment variables
  console.log('Environment Check:');
  console.log('- SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing');
  console.log('- SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing');
  
  // Test direct database insert
  console.log('\n📝 Testing Direct Database Insert:');
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  
  const testSessionId = `debug-test-${Date.now()}`;
  const { data, error } = await supabase
    .from('chat_telemetry')
    .insert({
      session_id: testSessionId,
      model: 'gpt-5-mini',
      start_time: new Date(Date.now() - 2000).toISOString(),
      end_time: new Date().toISOString(),
      input_tokens: 1000,
      output_tokens: 500,
      // total_tokens is generated automatically
      cost_usd: 0.001250,
      duration_ms: 2000,
      iterations: 1,
      search_count: 2,
      total_results: 10,
      success: true,
      domain: 'test.com',
      created_at: new Date().toISOString()
    })
    .select();
  
  if (error) {
    console.log('❌ Direct insert failed:', error);
  } else {
    console.log('✅ Direct insert succeeded:', data);
  }
  
  // Test telemetry manager
  console.log('\n🔬 Testing Telemetry Manager:');
  const telemetry = telemetryManager.createSession(`manager-test-${Date.now()}`, 'gpt-5-mini', {
    domain: 'test.com',
    persistToDatabase: true,
    detailedLogging: true
  });
  
  // Track some token usage
  telemetry.trackTokenUsage({
    prompt_tokens: 2000,
    completion_tokens: 800,
    total_tokens: 2800
  });
  
  // Complete the session
  const summary = await telemetry.complete('Test response');
  console.log('\nSession Summary:', summary);
  
  // Check if it was persisted
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  const { data: checkData, error: checkError } = await supabase
    .from('chat_telemetry')
    .select('session_id, input_tokens, output_tokens, cost_usd')
    .eq('session_id', telemetry.getSessionId())
    .single();
  
  if (checkError) {
    console.log('\n❌ Telemetry was not persisted:', checkError.message);
  } else {
    console.log('\n✅ Telemetry was persisted:', checkData);
  }
  
  // List all recent telemetry
  console.log('\n📊 Recent Telemetry Records:');
  const { data: recentData } = await supabase
    .from('chat_telemetry')
    .select('session_id, model, input_tokens, output_tokens, cost_usd, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentData && recentData.length > 0) {
    recentData.forEach((record, i) => {
      console.log(`${i + 1}. ${record.session_id.substring(0, 20)}...`);
      console.log(`   Model: ${record.model}, Tokens: ${record.input_tokens}/${record.output_tokens}, Cost: $${record.cost_usd}`);
    });
  } else {
    console.log('No telemetry records found');
  }
}

debugTelemetryPersistence().catch(console.error);