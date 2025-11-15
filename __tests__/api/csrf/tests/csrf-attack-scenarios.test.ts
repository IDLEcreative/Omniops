/**
 * CSRF Attack Scenarios Tests
 *
 * Tests that various CSRF attack vectors are properly prevented.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET as csrfGet } from '@/app/api/csrf/route';
import { POST as customerConfigPost } from '@/app/api/customer/config/route';
import {
  createMockRequest,
  createRequestWithCookieOnly,
  createRequestWithHeaderOnly,
  createRequestWithMismatchedTokens,
} from '../shared/csrf-test-helpers';

describe('CSRF Attack Scenarios', () => {
  let csrfToken: string;

  beforeAll(async () => {
    const request = new NextRequest('http://localhost:3000/api/csrf');
    const response = await csrfGet(request);
    const data = await response.json();
    csrfToken = data.csrfToken;
  });

  it('should prevent cross-origin requests without CSRF token', async () => {
    // Simulates attacker's site making request
    const request = createMockRequest(
      'http://localhost:3000/api/customer/config',
      'POST',
      { domain: 'malicious.com' },
      false
    );
    const response = await customerConfigPost(request);
    expect(response.status).toBe(403);
  });

  it('should prevent requests with only cookie (no header)', async () => {
    const request = createRequestWithCookieOnly(
      'http://localhost:3000/api/customer/config',
      'POST',
      { domain: 'example.com' },
      csrfToken
    );

    const response = await customerConfigPost(request);
    expect(response.status).toBe(403);
  });

  it('should prevent requests with only header (no cookie)', async () => {
    const request = createRequestWithHeaderOnly(
      'http://localhost:3000/api/customer/config',
      'POST',
      { domain: 'example.com' },
      csrfToken
    );

    const response = await customerConfigPost(request);
    expect(response.status).toBe(403);
  });

  it('should prevent requests with mismatched tokens', async () => {
    const request = createRequestWithMismatchedTokens(
      'http://localhost:3000/api/customer/config',
      'POST',
      { domain: 'example.com' },
      csrfToken
    );

    const response = await customerConfigPost(request);
    expect(response.status).toBe(403);
  });
});
