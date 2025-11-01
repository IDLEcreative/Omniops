import { NextRequest } from 'next/server';
import { handleRequest } from './handlers';

/**
 * Installation Verification API
 *
 * Automatically verifies that all systems are working BEFORE showing
 * embed code to customers.
 */

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
