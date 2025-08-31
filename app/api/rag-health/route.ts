import { NextRequest, NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { createServiceRoleClient, validateSupabaseEnv } from '@/lib/supabase-server'

type RpcError = {
  code?: string
  message: string
  details?: string | null
  hint?: string | null
}

export async function GET(request: NextRequest) {
  try {
    if (!validateSupabaseEnv()) {
      return NextResponse.json(
        { ok: false, error: 'Supabase environment not configured' },
        { status: 503 }
      )
    }

    const supabase = await createServiceRoleClient()
    if (!supabase) {
      return NextResponse.json(
        { ok: false, error: 'Database unavailable' },
        { status: 503 }
      )
    }

    const url = new URL(request.url)
    const domainParam = url.searchParams.get('domain')

    const health: any = {
      ok: true,
      embeddings_count: 0,
      search_working: false,
      rpc: {
        ok: false,
        rows: 0 as number,
        error: null as RpcError | null,
        operator_issue: false as boolean,
      },
      timestamp: new Date().toISOString(),
    }

    // 1) Count embeddings quickly
    const { count, error: countError } = await supabase
      .from('page_embeddings')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      health.ok = false
      health.rpc.error = {
        message: countError.message,
        code: (countError as any).code,
        details: (countError as any).details ?? null,
        hint: (countError as any).hint ?? null,
      }
    } else {
      health.embeddings_count = count || 0
    }

    // 2) Resolve optional domain to domain_id
    let domainId: string | null = null
    if (domainParam) {
      const normalized = domainParam.replace(/^www\./, '')
      const { data: domainRow } = await supabase
        .from('domains')
        .select('id')
        .eq('domain', normalized)
        .single()
      if (domainRow?.id) domainId = domainRow.id
    }

    // 3) RPC test with a dummy embedding (bypass OpenAI)
    const dummyEmbedding = new Array(1536).fill(0)
    const { data: rpcData, error: rpcError } = await supabase.rpc('search_embeddings', {
      query_embedding: dummyEmbedding,
      p_domain_id: domainId,
      match_threshold: -1, // accept any similarity
      match_count: 1,
    })

    if (rpcError) {
      health.search_working = false
      health.rpc.ok = false
      health.rpc.error = {
        code: (rpcError as any).code,
        message: rpcError.message,
        details: (rpcError as any).details ?? null,
        hint: (rpcError as any).hint ?? null,
      }
      // Detect the common pgvector operator issue to guide fixes
      const msg = rpcError.message || ''
      const details = ((rpcError as any).details as string | undefined) || ''
      if (msg.includes('<=>') || details.includes('<=>')) {
        health.rpc.operator_issue = true
      }
    } else {
      health.search_working = true
      health.rpc.ok = true
      health.rpc.rows = (rpcData || []).length
    }

    return NextResponse.json(health)
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

