import { z } from 'zod';

/**
 * Schema for creating organization invitations
 */
export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'member', 'viewer']),
});

export type CreateInvitationInput = z.infer<typeof createInvitationSchema>;
