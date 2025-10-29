/**
 * Customer Config API Security Tests
 *
 * Tests for authentication and authorization vulnerabilities (GitHub Issue #9)
 * Verifies:
 * - Authentication required for all endpoints
 * - Organization membership enforcement
 * - Role-based access control
 * - Cross-organization isolation
 *
 * @jest-environment node
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import type { SupabaseClient } from '@supabase/supabase-js';
import { insertAsAdmin, deleteAsAdmin, createAdminClient } from '@/test-utils/rls-test-helpers';

// Mark as E2E test to use real credentials (not mocks)
process.env.E2E_TEST = 'true';

// Load real environment variables for security testing
// The Jest setup file overrides these with mocks, but security tests need real credentials
if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.includes('birugqyuqhiahxvxeyqg')) {
  // Force-load from .env.local (override=true)
  require('dotenv').config({ path: '.env.local', override: true });
}

// Test configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('Customer Config API Security', () => {
  let serviceClient: ReturnType<typeof createAdminClient>;
  let org1Id: string;
  let org2Id: string;
  let user1Id: string;
  let user2Id: string;
  let config1Id: string;
  let config2Id: string;
  let user1Email: string;
  let user2Email: string;
  const timestamp = Date.now();

  beforeAll(async () => {
    // Initialize service role client for setup
    serviceClient = createAdminClient();

    // Create test organizations using admin helper to bypass RLS
    const org1 = await insertAsAdmin('organizations', {
      name: `Test Org 1 - ${timestamp}`,
      slug: `test-org-1-${timestamp}`
    });

    const org2 = await insertAsAdmin('organizations', {
      name: `Test Org 2 - ${timestamp}`,
      slug: `test-org-2-${timestamp}`
    });

    if (!org1 || !org2) {
      throw new Error('Failed to create test organizations');
    }

    org1Id = org1.id;
    org2Id = org2.id;

    // Create test users
    user1Email = `test-user-1-${timestamp}@example.com`;
    user2Email = `test-user-2-${timestamp}@example.com`;

    const { data: { user: user1 } } = await serviceClient.auth.admin.createUser({
      email: user1Email,
      password: 'testpassword123',
      email_confirm: true
    });

    const { data: { user: user2 } } = await serviceClient.auth.admin.createUser({
      email: user2Email,
      password: 'testpassword123',
      email_confirm: true
    });

    user1Id = user1!.id;
    user2Id = user2!.id;

    // Add user1 as owner of org1
    await insertAsAdmin('organization_members', {
      organization_id: org1Id,
      user_id: user1Id,
      role: 'owner'
    });

    // Add user2 as member (not admin) of org2
    await insertAsAdmin('organization_members', {
      organization_id: org2Id,
      user_id: user2Id,
      role: 'member'
    });

    // Create customer configs for each org
    const config1 = await insertAsAdmin('customer_configs', {
      organization_id: org1Id,
      domain: `test1-${timestamp}.example.com`,
      business_name: 'Test Business 1'
    });

    const config2 = await insertAsAdmin('customer_configs', {
      organization_id: org2Id,
      domain: `test2-${timestamp}.example.com`,
      business_name: 'Test Business 2'
    });

    if (!config1 || !config2) {
      throw new Error('Failed to create test customer configs');
    }

    config1Id = config1.id;
    config2Id = config2.id;
  });

  afterAll(async () => {
    // Cleanup in reverse order of dependencies
    if (config1Id) {
      await deleteAsAdmin('customer_configs', { id: config1Id });
    }
    if (config2Id) {
      await deleteAsAdmin('customer_configs', { id: config2Id });
    }
    if (user1Id) {
      await deleteAsAdmin('organization_members', { user_id: user1Id });
      await serviceClient.auth.admin.deleteUser(user1Id);
    }
    if (user2Id) {
      await deleteAsAdmin('organization_members', { user_id: user2Id });
      await serviceClient.auth.admin.deleteUser(user2Id);
    }
    if (org1Id) {
      await deleteAsAdmin('organizations', { id: org1Id });
    }
    if (org2Id) {
      await deleteAsAdmin('organizations', { id: org2Id });
    }
  });

  describe('GET /api/customer/config', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`http://localhost:3000/api/customer/config`);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should only return configs for authenticated user\'s organization', async () => {
      // Sign in as user1
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      const response = await fetch(`http://localhost:3000/api/customer/config`, {
        headers: {
          'Authorization': `Bearer ${session!.access_token}`
        }
      });

      expect(response.status).toBe(200);
      const data = await response.json();

      // Should only see org1's config
      expect(data.success).toBe(true);
      expect(data.data.length).toBeGreaterThan(0);
      expect(data.data.every((c: any) => c.organization_id === org1Id)).toBe(true);

      // Sign out
      await serviceClient.auth.signOut();
    });

    it('should not allow user to access another organization\'s configs', async () => {
      // Sign in as user1 (org1)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      const response = await fetch(`http://localhost:3000/api/customer/config`, {
        headers: {
          'Authorization': `Bearer ${session!.access_token}`
        }
      });

      const data = await response.json();

      // Should not see org2's config
      const hasOrg2Config = data.data.some((c: any) => c.id === config2Id);
      expect(hasOrg2Config).toBe(false);

      await serviceClient.auth.signOut();
    });
  });

  describe('POST /api/customer/config', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(`http://localhost:3000/api/customer/config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: `test-new-${timestamp}.example.com`,
          business_name: 'New Business'
        })
      });

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should reject regular members (non-admin/owner)', async () => {
      // Sign in as user2 (member, not admin)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user2Email,
        password: 'testpassword123'
      });

      const response = await fetch(`http://localhost:3000/api/customer/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session!.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: `test-new-${timestamp}.example.com`,
          business_name: 'New Business'
        })
      });

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('admins and owners');

      await serviceClient.auth.signOut();
    });

    it('should allow admins and owners to create configs', async () => {
      // Sign in as user1 (owner)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      const newDomain = `test-create-${timestamp}.example.com`;
      const response = await fetch(`http://localhost:3000/api/customer/config`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session!.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          domain: newDomain,
          business_name: 'New Business'
        })
      });

      // Should succeed (201 or 409 if domain exists)
      expect([201, 409]).toContain(response.status);

      // Cleanup if created
      if (response.status === 201) {
        const data = await response.json();
        await serviceClient
          .from('customer_configs')
          .delete()
          .eq('id', data.data.config.id);
      }

      await serviceClient.auth.signOut();
    });
  });

  describe('PUT /api/customer/config', () => {
    it('should reject unauthenticated requests', async () => {
      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${config1Id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_name: 'Updated Business'
          })
        }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should reject updates to configs from other organizations', async () => {
      // Sign in as user1 (org1)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      // Try to update org2's config
      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${config2Id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_name: 'Hacked Business'
          })
        }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Forbidden');

      await serviceClient.auth.signOut();
    });

    it('should reject regular members', async () => {
      // Sign in as user2 (member, not admin)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user2Email,
        password: 'testpassword123'
      });

      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${config2Id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_name: 'Updated Business'
          })
        }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('admins and owners');

      await serviceClient.auth.signOut();
    });

    it('should allow admins/owners to update their own org configs', async () => {
      // Sign in as user1 (owner of org1)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${config1Id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            business_name: 'Updated Business 1'
          })
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      await serviceClient.auth.signOut();
    });
  });

  describe('DELETE /api/customer/config', () => {
    let tempConfigId: string;

    beforeAll(async () => {
      // Create a temp config to delete
      const data = await insertAsAdmin('customer_configs', {
        organization_id: org1Id,
        domain: `test-delete-${timestamp}.example.com`,
        business_name: 'Delete Me'
      });

      if (!data) {
        throw new Error('Failed to create temp config for DELETE test');
      }

      tempConfigId = data.id;
    });

    it('should reject unauthenticated requests', async () => {
      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${tempConfigId}`,
        {
          method: 'DELETE'
        }
      );

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toContain('Authentication required');
    });

    it('should reject deletion of configs from other organizations', async () => {
      // Sign in as user1 (org1)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      // Try to delete org2's config
      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${config2Id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`
          }
        }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('Forbidden');

      await serviceClient.auth.signOut();
    });

    it('should reject regular members', async () => {
      // Create temp config in org2
      const tempConfig = await insertAsAdmin('customer_configs', {
        organization_id: org2Id,
        domain: `test-delete-member-${timestamp}.example.com`,
        business_name: 'Delete Me 2'
      });

      if (!tempConfig) {
        throw new Error('Failed to create temp config for member test');
      }

      // Sign in as user2 (member, not admin)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user2Email,
        password: 'testpassword123'
      });

      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${tempConfig.id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`
          }
        }
      );

      expect(response.status).toBe(403);
      const data = await response.json();
      expect(data.error).toContain('admins and owners');

      // Cleanup
      await deleteAsAdmin('customer_configs', { id: tempConfig.id });

      await serviceClient.auth.signOut();
    });

    it('should allow admins/owners to delete their own org configs', async () => {
      // Sign in as user1 (owner of org1)
      const { data: { session } } = await serviceClient.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      const response = await fetch(
        `http://localhost:3000/api/customer/config?id=${tempConfigId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`
          }
        }
      );

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.success).toBe(true);

      await serviceClient.auth.signOut();
    });
  });

  describe('RLS Policy Verification', () => {
    it('should enforce RLS at database level', async () => {
      // Create authenticated client as user1
      const user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await user1Client.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      // Try to query config from org2
      const { data, error } = await user1Client
        .from('customer_configs')
        .select('*')
        .eq('id', config2Id)
        .single();

      // RLS should block this
      expect(error).toBeTruthy();
      expect(data).toBeNull();

      await user1Client.auth.signOut();
    });

    it('should allow access to own organization configs via RLS', async () => {
      // Create authenticated client as user1
      const user1Client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
      await user1Client.auth.signInWithPassword({
        email: user1Email,
        password: 'testpassword123'
      });

      // Query config from org1
      const { data, error } = await user1Client
        .from('customer_configs')
        .select('*')
        .eq('id', config1Id)
        .single();

      // RLS should allow this
      expect(error).toBeNull();
      expect(data).toBeTruthy();
      expect(data!.id).toBe(config1Id);

      await user1Client.auth.signOut();
    });
  });
});
