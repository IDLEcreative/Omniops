/**
 * Test Fixtures for Organization API Tests
 */

export const mockOrganizations = {
  newOrg: {
    id: 'new-org-id',
    name: 'New Organization',
    slug: 'new-organization',
    settings: {},
    plan_type: 'free' as const,
    seat_limit: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  existingOrg: {
    id: 'existing-org-id',
    name: 'Existing Organization',
    slug: 'existing-org',
    settings: {},
    plan_type: 'free' as const,
    seat_limit: 5,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
};

export const validRequests = {
  basic: { name: 'Test Organization' },
  withSlug: { name: 'Test Org', slug: 'test-org' },
  longName: { name: 'My Test Organization' },
};

export const invalidRequests = {
  missingName: {},
  shortName: { name: 'A' },
  invalidSlug: { name: 'Test Org', slug: 'Invalid_Slug!' },
};

export const mockMemberships = {
  owner: (userId: string, orgId: string) => ({
    organization_id: orgId,
    user_id: userId,
    role: 'owner' as const,
  }),
};
