import { NextRequest, NextResponse } from 'next/server';
import { warmCache, warmAllCaches } from '@/lib/cache-warmer';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { domain } = body;
    
    if (domain) {
      // Warm cache for specific domain
      await warmCache(domain);
      return NextResponse.json({ 
        success: true, 
        message: `Cache warmed for ${domain}` 
      });
    } else {
      // Warm cache for all domains
      await warmAllCaches();
      return NextResponse.json({ 
        success: true, 
        message: 'Cache warmed for all domains' 
      });
    }
  } catch (error) {
    console.error('Error warming cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to warm cache' },
      { status: 500 }
    );
  }
}