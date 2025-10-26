/**
 * Validation schemas for telemetry API
 */

import { z } from 'zod';

export const telemetryQuerySchema = z.object({
  days: z.number().int().min(1).max(365).default(7),
  domain: z.string().optional(),
});

export type TelemetryQuery = z.infer<typeof telemetryQuerySchema>;

export function validateQuery(searchParams: URLSearchParams): TelemetryQuery {
  const days = parseInt(searchParams.get('days') || '7');
  const domain = searchParams.get('domain') || undefined;

  return telemetryQuerySchema.parse({ days, domain });
}
