/**
 * Synonym Management API
 * Endpoints for managing domain-specific synonyms
 */

import { NextRequest, NextResponse } from 'next/server';
import { synonymLoader } from '@/lib/synonym-loader';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * GET /api/synonyms?domainId=uuid
 * Retrieve synonyms for a domain
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');

  if (!domainId) {
    return NextResponse.json(
      { error: 'domainId parameter required' },
      { status: 400 }
    );
  }

  try {
    const synonyms = await synonymLoader.loadSynonymsForDomain(domainId);

    // Convert Map to object for JSON response
    const synonymsObject: Record<string, string[]> = {};
    synonyms.forEach((value, key) => {
      synonymsObject[key] = value;
    });

    return NextResponse.json({
      domainId,
      synonymCount: synonyms.size,
      synonyms: synonymsObject
    });
  } catch (error) {
    console.error('[Synonyms API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to load synonyms' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/synonyms
 * Add or update synonym mapping
 * Body: { domainId, term, synonyms[], priority? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { domainId, term, synonyms } = body;

    if (!domainId || !term || !synonyms || !Array.isArray(synonyms)) {
      return NextResponse.json(
        { error: 'domainId, term, and synonyms[] are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('domain_synonym_mappings')
      .upsert({
        domain_id: domainId,
        term: term.toLowerCase(),
        synonyms: synonyms.map((s: string) => s.toLowerCase()),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'domain_id,term'
      })
      .select();

    if (error) {
      throw error;
    }

    // Clear cache for this domain
    synonymLoader.clearCache(domainId);

    return NextResponse.json({
      success: true,
      synonym: data[0]
    });
  } catch (error) {
    console.error('[Synonyms API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to add synonym' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/synonyms?domainId=uuid&term=word
 * Delete a synonym mapping
 */
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('domainId');
  const term = searchParams.get('term');

  if (!domainId || !term) {
    return NextResponse.json(
      { error: 'domainId and term parameters required' },
      { status: 400 }
    );
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from('domain_synonym_mappings')
      .delete()
      .eq('domain_id', domainId)
      .eq('term', term.toLowerCase());

    if (error) {
      throw error;
    }

    // Clear cache
    synonymLoader.clearCache(domainId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Synonyms API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete synonym' },
      { status: 500 }
    );
  }
}

// Query expansion moved to /api/synonyms/expand/route.ts
