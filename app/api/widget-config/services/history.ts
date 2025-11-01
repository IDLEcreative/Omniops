/**
 * Widget configuration history operations
 */

import type { SupabaseClient } from '@/types/supabase';

/**
 * Create history entry for configuration changes
 */
export async function createHistoryEntry(
  supabase: SupabaseClient,
  widgetConfigId: string,
  configSnapshot: any,
  version: number,
  changeDescription: string,
  changedFields: string[],
  userId: string
): Promise<void> {
  await supabase.from('widget_config_history').insert({
    widget_config_id: widgetConfigId,
    config_snapshot: configSnapshot,
    version,
    change_description: changeDescription,
    changed_fields: changedFields,
    created_by: userId,
  });
}
