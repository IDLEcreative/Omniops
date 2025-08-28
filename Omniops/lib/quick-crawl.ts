// Quick crawl functionality for demo mode
// This is a stub implementation to resolve import errors

export interface DemoContext {
  content: string;
  metadata?: {
    brandName?: string;
    contactInfo?: any;
  };
}

export interface QuickCrawlResult {
  demoId: string;
  config: {
    brandName: string;
    brandColor: string;
    welcomeMessage: string;
  };
  content: {
    title: string;
    description: string;
  };
}

/**
 * Create demo context for a given demo ID
 * This is a placeholder implementation that returns empty context
 */
export async function createDemoContext(demoId: string): Promise<DemoContext | null> {
  console.warn('createDemoContext is using placeholder implementation. Demo mode not fully functional.');
  
  // Return minimal demo context to prevent errors
  return {
    content: 'This is a demo context placeholder.',
    metadata: {
      brandName: 'Demo Website',
      contactInfo: {
        email: 'demo@example.com',
        phone: '(555) 123-4567'
      }
    }
  };
}

/**
 * Quick crawl function for generating demo data
 * This is a placeholder implementation that returns mock data
 */
export async function quickCrawl(url: string): Promise<QuickCrawlResult> {
  console.warn('quickCrawl is using placeholder implementation. No actual crawling performed.');
  
  // Generate a demo ID
  const demoId = `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Extract domain name for brand name
  const domain = new URL(url).hostname.replace('www.', '');
  const domainParts = domain.split('.');
  const firstPart = domainParts[0] || 'website';
  const brandName = firstPart.charAt(0).toUpperCase() + firstPart.slice(1);
  
  return {
    demoId,
    config: {
      brandName,
      brandColor: '#3b82f6', // Default blue color
      welcomeMessage: `Welcome to ${brandName}! How can we help you today?`,
    },
    content: {
      title: `${brandName} - Demo Website`,
      description: 'This is a demo website generated for testing purposes.',
    },
  };
}