/**
 * Traffic Data Collector
 * Estimates monthly traffic using algorithm based on website size
 */

import { TrafficData, WebsiteData } from '../types';

export async function collectTrafficData(
  domain: string,
  websiteData: WebsiteData
): Promise<TrafficData> {
  try {
    // Try external APIs first (optional)
    // For now, use algorithm-based estimation

    const monthlyVisitors = estimateTrafficFromSize(websiteData);

    return {
      monthlyVisitors,
      source: 'estimated',
      confidence: 60 // Moderate confidence for algorithm-based estimate
    };
  } catch (error) {
    console.error('Traffic data collection failed:', error);
    return {
      monthlyVisitors: 10000,
      source: 'estimated',
      confidence: 30
    };
  }
}

export function estimateTrafficFromSize(websiteData: WebsiteData): number {
  const { totalPages, productCount, hasBlog, blogPostCount } = websiteData;

  let estimate = 0;

  // Base estimate from page count
  // Larger sites typically indicate more traffic
  if (totalPages === 0) {
    estimate = 2000; // Very new or minimal site
  } else if (totalPages < 50) {
    estimate = 5000;
  } else if (totalPages < 200) {
    estimate = 20000;
  } else if (totalPages < 1000) {
    estimate = 100000;
  } else if (totalPages < 5000) {
    estimate = 500000;
  } else {
    estimate = 2000000;
  }

  // Adjust for e-commerce (higher traffic per page)
  if (productCount > 50) {
    estimate *= 1.2;
  }
  if (productCount > 200) {
    estimate *= 1.5;
  }
  if (productCount > 1000) {
    estimate *= 2;
  }

  // Adjust for blog (content marketing = SEO traffic)
  if (hasBlog && blogPostCount > 20) {
    estimate *= 1.5;
  } else if (hasBlog && blogPostCount > 5) {
    estimate *= 1.2;
  }

  return Math.round(estimate);
}

// Future: Cloudflare Radar integration (free but limited)
export async function getCloudflareTraffic(
  domain: string
): Promise<TrafficData | null> {
  const token = process.env.CLOUDFLARE_API_TOKEN;

  if (!token) {
    return null;
  }

  try {
    // Cloudflare Radar API - requires domain to be on Cloudflare
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/radar/http/timeseries_groups/browser/domain/${domain}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    // Cloudflare returns relative traffic (not absolute visitors)
    // This is useful for ranking but not for absolute numbers
    return {
      monthlyVisitors: 0, // Can't get absolute numbers
      source: 'cloudflare',
      confidence: 40 // Low confidence for relative data
    };
  } catch (error) {
    console.error('Cloudflare API error:', error);
    return null;
  }
}

// Future: SimilarWeb integration (paid - £200/month)
export async function getSimilarWebTraffic(domain: string): Promise<TrafficData | null> {
  const apiKey = process.env.SIMILARWEB_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch(
      `https://api.similarweb.com/v1/website/${domain}/total-traffic`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    return {
      monthlyVisitors: data.visits || 0,
      source: 'similarweb',
      confidence: 80,
      trend: determineTrend(data)
    };
  } catch (error) {
    console.error('SimilarWeb API error:', error);
    return null;
  }
}

function determineTrend(data: any): 'growing' | 'stable' | 'declining' {
  // SimilarWeb provides monthly data points
  if (!data.visits_history || data.visits_history.length < 2) {
    return 'stable';
  }

  const recent = data.visits_history.slice(-3);
  const average = recent.reduce((a: number, b: number) => a + b, 0) / recent.length;
  const previous = data.visits_history.slice(-6, -3);
  const prevAverage = previous.reduce((a: number, b: number) => a + b, 0) / previous.length;

  const change = (average - prevAverage) / prevAverage;

  if (change > 0.1) return 'growing';
  if (change < -0.1) return 'declining';
  return 'stable';
}
