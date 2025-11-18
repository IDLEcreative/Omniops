/**
 * Category Mapping Persistence
 */

import type { CategoryMapping } from './types';

export async function persistMappings(
  supabase: any,
  mappings: Map<string, CategoryMapping>
): Promise<void> {
  // Get domain ID first
  const { data: domains } = await supabase
    .from('customer_configs')
    .select('domain_id')
    .limit(1);

  if (!domains || domains.length === 0) {
    console.error('No domain found to persist mappings');
    return;
  }

  const domainId = domains[0].domain_id;

  // Store as a single record with all mappings
  const record = {
    domain_id: domainId,
    url: 'system/category-mappings',
    extract_type: 'category_mappings',
    extracted_data: {
      mappings: Array.from(mappings.values()),
      generated_at: new Date().toISOString(),
      total_categories: mappings.size
    },
    confidence_score: 0.8,
    extracted_at: new Date().toISOString()
  };

  // Delete old mappings first
  await supabase
    .from('structured_extractions')
    .delete()
    .eq('url', 'system/category-mappings')
    .eq('extract_type', 'category_mappings');

  // Insert new mappings
  const { error } = await supabase
    .from('structured_extractions')
    .insert(record);

  if (error) {
    console.error('Error persisting mappings:', error);
  } else {
  }
}
