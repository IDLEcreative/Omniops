import { NextRequest, NextResponse } from 'next/server';
import { createServiceRoleClient } from '@/lib/supabase-server';

interface MissingProduct {
  name: string;
  count: number;
  lastRequested: string;
  examples: string[];
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServiceRoleClient();
    
    // Get date range
    const searchParams = request.nextUrl.searchParams;
    const days = parseInt(searchParams.get('days') || '30');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Fetch messages that indicate product not found
    const { data: messages, error } = await supabase
      .from('messages')
      .select('content, created_at, conversation_id')
      .eq('role', 'assistant')
      .gte('created_at', startDate.toISOString())
      .or('content.ilike.%no results%,content.ilike.%couldn\'t find%,content.ilike.%not found%,content.ilike.%don\'t have%,content.ilike.%not available%')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Analyze failed searches
    const missingProducts = new Map<string, MissingProduct>();
    const productPatterns = [
      /looking for (.+?)(?:\.|,|$)/gi,
      /do you have (.+?)(?:\?|$)/gi,
      /need (?:a |an |some )?(.+?)(?:\.|,|$)/gi,
      /searching for (.+?)(?:\.|,|$)/gi,
      /(.+?) (?:products?|items?|parts?)/gi,
      /show me (.+?)(?:\.|,|$)/gi,
      /where (?:is|are) (?:the )?(.+?)(?:\?|$)/gi,
    ];
    
    // For each "not found" message, look at the conversation to find what was requested
    for (const msg of messages || []) {
      // Get the user's original query from the same conversation
      const { data: userMsg, error: userError } = await supabase
        .from('messages')
        .select('content')
        .eq('conversation_id', msg.conversation_id)
        .eq('role', 'user')
        .lt('created_at', msg.created_at)
        .order('created_at', { ascending: false })
        .limit(1);
      
      if (!userError && userMsg && userMsg[0]) {
        const query = userMsg[0].content.toLowerCase();
        
        // Extract product names from the query
        let productName = '';
        for (const pattern of productPatterns) {
          const match = pattern.exec(query);
          if (match && match[1]) {
            productName = match[1].trim()
              .replace(/^(the |a |an |some )/gi, '')
              .replace(/[?.,!]$/g, '');
            break;
          }
        }
        
        // If no pattern matched, use keywords from the query
        if (!productName) {
          // Extract potential product keywords
          const keywords = query
            .replace(/[^a-z0-9\s-]/gi, '')
            .split(/\s+/)
            .filter(word => 
              word.length > 3 && 
              !['have', 'need', 'want', 'looking', 'find', 'show', 'where', 'what', 'which', 'your', 'with', 'from', 'that', 'this'].includes(word)
            );
          
          if (keywords.length > 0) {
            productName = keywords.slice(0, 3).join(' ');
          }
        }
        
        if (productName && productName.length > 2) {
          const existing = missingProducts.get(productName) || {
            name: productName,
            count: 0,
            lastRequested: msg.created_at,
            examples: []
          };
          
          existing.count++;
          existing.lastRequested = msg.created_at;
          if (existing.examples.length < 3 && !existing.examples.includes(query)) {
            existing.examples.push(query.substring(0, 100));
          }
          
          missingProducts.set(productName, existing);
        }
      }
    }
    
    // Convert to array and sort by count
    const sortedMissing = Array.from(missingProducts.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20); // Top 20 missing products
    
    // Get some statistics
    const totalRequests = Array.from(missingProducts.values())
      .reduce((sum, p) => sum + p.count, 0);
    
    // Categorize missing products
    const categories = {
      tools: [] as string[],
      parts: [] as string[],
      equipment: [] as string[],
      other: [] as string[]
    };
    
    sortedMissing.forEach(product => {
      const name = product.name.toLowerCase();
      if (name.includes('tool') || name.includes('wrench') || name.includes('hammer') || name.includes('drill')) {
        categories.tools.push(product.name);
      } else if (name.includes('part') || name.includes('filter') || name.includes('belt') || name.includes('bearing')) {
        categories.parts.push(product.name);
      } else if (name.includes('pump') || name.includes('motor') || name.includes('compressor') || name.includes('generator')) {
        categories.equipment.push(product.name);
      } else {
        categories.other.push(product.name);
      }
    });
    
    return NextResponse.json({
      missingProducts: sortedMissing,
      statistics: {
        totalMissingProducts: missingProducts.size,
        totalRequests,
        avgRequestsPerProduct: missingProducts.size > 0 
          ? Math.round(totalRequests / missingProducts.size * 10) / 10 
          : 0,
        timeRange: `Last ${days} days`
      },
      categories: {
        tools: categories.tools.slice(0, 5),
        parts: categories.parts.slice(0, 5),
        equipment: categories.equipment.slice(0, 5),
        other: categories.other.slice(0, 5)
      },
      recommendations: generateRecommendations(sortedMissing)
    });
    
  } catch (error) {
    console.error('[Dashboard] Error analyzing missing products:', error);
    return NextResponse.json(
      { 
        missingProducts: [],
        statistics: {
          totalMissingProducts: 0,
          totalRequests: 0,
          avgRequestsPerProduct: 0,
          timeRange: 'Last 30 days'
        },
        categories: {
          tools: [],
          parts: [],
          equipment: [],
          other: []
        },
        recommendations: []
      },
      { status: 200 }
    );
  }
}

function generateRecommendations(missingProducts: MissingProduct[]): string[] {
  const recommendations: string[] = [];
  
  if (missingProducts.length === 0) {
    return ['Great! No significant missing products detected.'];
  }
  
  // Top requested product
  if (missingProducts[0] && missingProducts[0].count > 5) {
    recommendations.push(
      `Consider adding "${missingProducts[0].name}" - requested ${missingProducts[0].count} times`
    );
  }
  
  // High frequency pattern
  const highFrequency = missingProducts.filter(p => p.count > 3);
  if (highFrequency.length > 5) {
    recommendations.push(
      `${highFrequency.length} products have been requested multiple times - review for potential inventory expansion`
    );
  }
  
  // Category patterns
  const toolRequests = missingProducts.filter(p => 
    p.name.toLowerCase().includes('tool') || 
    p.name.toLowerCase().includes('wrench')
  );
  if (toolRequests.length > 3) {
    recommendations.push(
      `Strong demand for tools - ${toolRequests.length} different tool types requested`
    );
  }
  
  // Recent trends
  const recentProducts = missingProducts.filter(p => {
    const requestDate = new Date(p.lastRequested);
    const daysSince = (Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24);
    return daysSince <= 7;
  });
  if (recentProducts.length > 5) {
    recommendations.push(
      `${recentProducts.length} products requested in the last week - trending demand`
    );
  }
  
  return recommendations.slice(0, 4);
}