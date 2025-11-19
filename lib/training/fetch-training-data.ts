/**
 * Fetch training data for a user
 * Combines training_data entries and scraped_pages entries
 */

import type { SupabaseClient } from '@/types/supabase';
import { logger } from '@/lib/logger';

export interface FetchTrainingDataParams {
  userId: string;
  page: number;
  limit: number;
  adminSupabase: SupabaseClient;
}

export interface TrainingDataItem {
  id: string;
  type: 'text' | 'qa' | 'url' | 'file';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: string;
  metadata?: any;
}

export interface FetchTrainingDataResult {
  items: TrainingDataItem[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

/**
 * Fetch training data entries from training_data table
 */
async function fetchTrainingDataEntries(
  adminSupabase: SupabaseClient,
  userId: string
): Promise<TrainingDataItem[]> {
  console.log('[DEBUG FLOW] 26. Querying training_data table for user:', userId);

  const { data: trainingDataEntries, error: trainingError } = await adminSupabase
    .from('training_data')
    .select('id, type, content, status, created_at, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  console.log('[DEBUG FLOW] 27. Training data query result:', {
    count: trainingDataEntries?.length ?? 0,
    error: trainingError,
    sampleEntry: trainingDataEntries?.[0]
  });

  if (trainingError) {
    logger.error('fetchTrainingDataEntries failed', trainingError);
    throw new Error('Failed to fetch training data');
  }

  return trainingDataEntries?.map(item => ({
    id: item.id,
    type: item.type as 'text' | 'qa' | 'url' | 'file',
    content: item.content,
    status: item.status as 'pending' | 'processing' | 'completed' | 'error',
    createdAt: item.created_at,
    metadata: item.metadata,
  })) || [];
}

/**
 * Fetch scraped pages entries via domains
 */
async function fetchScrapedPagesEntries(
  adminSupabase: SupabaseClient,
  userId: string
): Promise<TrainingDataItem[]> {
  try {
    // Build domain query conditions
    const domainConditions = [`user_id.eq.${userId}`];
    console.log('[DEBUG FLOW] 28. Building domain query conditions:', {
      userId,
      initialConditions: domainConditions
    });

    // Check user's organization(s)
    const { data: userOrgs } = await adminSupabase
      .from('organization_members')
      .select('organization_id')
      .eq('user_id', userId);

    console.log('[DEBUG FLOW] 29. User organizations query result:', {
      count: userOrgs?.length ?? 0,
      orgIds: userOrgs?.map(org => org.organization_id)
    });

    if (userOrgs && userOrgs.length > 0) {
      const orgIds = userOrgs.map(org => org.organization_id);
      domainConditions.push(`organization_id.in.(${orgIds.join(',')})`);
    }

    console.log('[DEBUG FLOW] 30. Final domain query conditions:', domainConditions);

    // Get all domains accessible to this user
    const { data: userDomains, error: domainsError } = await adminSupabase
      .from('domains')
      .select('id')
      .or(domainConditions.join(','));

    console.log('[DEBUG FLOW] 31. Domains query result:', {
      count: userDomains?.length ?? 0,
      error: domainsError,
      domainIds: userDomains?.map(d => d.id)
    });

    if (!domainsError && userDomains && userDomains.length > 0) {
      const domainIds = userDomains.map(d => d.id);

      console.log('[DEBUG FLOW] 32. Querying scraped_pages for domain IDs:', domainIds);

      // Get scraped pages for those domains
      const { data: scrapedPages, error: scrapedError } = await adminSupabase
        .from('scraped_pages')
        .select('id, url, title, created_at, metadata, domain_id')
        .in('domain_id', domainIds)
        .order('created_at', { ascending: false });

      console.log('[DEBUG FLOW] 33. Scraped pages query result:', {
        count: scrapedPages?.length ?? 0,
        error: scrapedError,
        samplePage: scrapedPages?.[0]
      });

      if (!scrapedError && scrapedPages) {
        return scrapedPages.map(item => ({
          id: item.id,
          type: 'url' as const,
          content: item.url,
          status: 'completed' as const,
          createdAt: item.created_at,
          metadata: {
            ...(item.metadata || {}),
            url: item.url,
            title: item.title,
            source: 'scraped_pages',
            domain_id: item.domain_id
          },
        }));
      }
    } else {
      console.log('[DEBUG FLOW] 32. No domains found or error occurred - skipping scraped_pages query');
    }

    return [];
  } catch (error) {
    console.error('[DEBUG FLOW] ERROR: scraped_pages query failed:', error);
    logger.error('fetchScrapedPagesEntries failed', error);
    return [];
  }
}

/**
 * Main function to fetch and paginate training data
 */
export async function fetchTrainingData(
  params: FetchTrainingDataParams
): Promise<FetchTrainingDataResult> {
  const { userId, page, limit, adminSupabase } = params;
  const offset = (page - 1) * limit;

  console.log('[DEBUG FLOW] 25. GET /api/training - Fetching data for user:', userId);

  // Fetch from both tables
  const [trainingItems, scrapedItems] = await Promise.all([
    fetchTrainingDataEntries(adminSupabase, userId),
    fetchScrapedPagesEntries(adminSupabase, userId)
  ]);

  console.log('[DEBUG FLOW] 35-36. Data transformation complete:', {
    trainingItemsCount: trainingItems.length,
    scrapedItemsCount: scrapedItems.length
  });

  // Combine and sort by created_at (newest first)
  const allItems = [...trainingItems, ...scrapedItems]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  console.log('[DEBUG FLOW] 38. Combined and sorted items:', {
    totalCount: allItems.length,
    firstItem: allItems[0],
    lastItem: allItems[allItems.length - 1]
  });

  // Apply pagination
  const paginatedItems = allItems.slice(offset, offset + limit);
  const totalCount = allItems.length;

  console.log('[DEBUG FLOW] 39. Pagination applied:', {
    offset,
    limit,
    paginatedCount: paginatedItems.length,
    totalCount,
    hasMore: totalCount > offset + limit
  });

  return {
    items: paginatedItems,
    total: totalCount,
    page,
    limit,
    hasMore: totalCount > offset + limit
  };
}
