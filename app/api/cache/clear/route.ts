import { NextResponse } from 'next/server';
import { getSearchCacheManager } from '@/lib/search-cache';

export async function POST() {
  try {
    const cacheManager = getSearchCacheManager();
    await cacheManager.clearAllCache();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Cache cleared successfully' 
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to clear cache' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const cacheManager = getSearchCacheManager();
    const stats = await cacheManager.getCacheStats();
    
    return NextResponse.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Error getting cache stats:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cache stats' },
      { status: 500 }
    );
  }
}