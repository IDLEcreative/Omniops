import { NextRequest } from 'next/server';
import { handleRequest } from './handlers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return handleRequest(request);
}
