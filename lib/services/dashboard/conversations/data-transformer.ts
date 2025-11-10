/**
 * Conversations Data Transformer
 *
 * Handles all data transformation and formatting for conversation statistics
 */

/**
 * Determine conversation status from metadata and ended_at timestamp
 */
export function determineStatus(
  metadata: any,
  endedAt: string | null
): 'active' | 'waiting' | 'resolved' {
  const metadataStatus =
    typeof metadata.status === 'string' ? metadata.status.toLowerCase() : '';

  if (metadataStatus.includes('wait') || metadataStatus.includes('pending')) {
    return 'waiting';
  }
  if (metadataStatus.includes('resolve') || endedAt) {
    return 'resolved';
  }
  return 'active';
}

/**
 * Extract language information from conversation metadata
 */
export function extractLanguage(metadata: any): string {
  const metadataLanguage =
    typeof metadata.language === 'string'
      ? metadata.language
      : metadata.customer?.language || metadata.customerLanguage;
  return metadataLanguage ? String(metadataLanguage).trim() : 'Unknown';
}

/**
 * Transform language counts into sorted array with percentages
 */
export function transformLanguages(
  languageCounts: Record<string, number>,
  total: number
): Array<{ language: string; count: number; percentage: number }> {
  return Object.entries(languageCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([language, count]) => ({
      language,
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0,
    }));
}

/**
 * Transform peak hour counts into formatted peak hours with labels and levels
 */
export function transformPeakHours(
  peakHourCounts: Record<number, number>
): Array<{ hour: number; label: string; level: string; count: number }> {
  return Object.entries(peakHourCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([hourString, count], index) => {
      const hour = Number(hourString);
      const start = new Date();
      start.setUTCHours(hour, 0, 0, 0);
      const end = new Date(start);
      end.setUTCHours(hour + 1);

      const level = index === 0 ? 'high' : index === 1 ? 'high' : 'medium';

      return {
        hour,
        label: `${start.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })} - ${end.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        level,
        count,
      };
    });
}

/**
 * Calculate percentage change between current and previous counts
 */
export function calculateChange(
  currentCount: number,
  previousCount: number
): number {
  if (previousCount === 0) {
    return 0;
  }
  const change = ((currentCount - previousCount) / previousCount) * 100;
  return Math.round(change * 10) / 10;
}
