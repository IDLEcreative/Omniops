/**
 * Widget configuration deletion operations
 */

import type { SupabaseClient } from '@/types/supabase';
import { logger } from '@/lib/logger';

/**
 * Soft delete widget configuration
 */
export async function deleteWidgetConfig(
  supabase: SupabaseClient,
  configId: string,
  userId: string
): Promise<void> {
  const { error: updateError } = await supabase
    .from('widget_configs')
    .update({
      is_active: false,
      updated_by: userId,
    })
    .eq('id', configId);

  if (updateError) {
    logger.error('Error deleting widget config', { error: updateError, configId });
    throw new Error('Failed to delete configuration');
  }

  logger.info('Widget configuration deleted', {
    configId,
    userId,
  });
}
