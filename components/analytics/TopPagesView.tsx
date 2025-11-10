'use client';

import { Card } from '@/components/ui/card';
import { ExternalLink, TrendingUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface PageViews {
  total: number;
  uniquePages: number;
  avgPerSession: number;
  topPages: Array<{ url: string; views: number }>;
}

interface TopPagesViewProps {
  pageViews: PageViews;
}

function extractPagePath(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.pathname;
  } catch {
    return url;
  }
}

function getPageCategory(path: string): { category: string; color: string } {
  const lowerPath = path.toLowerCase();

  if (lowerPath.includes('/product') || lowerPath.includes('/p/') || lowerPath.includes('/shop')) {
    return { category: 'Product', color: 'text-blue-600' };
  }
  if (lowerPath.includes('/cart') || lowerPath.includes('/basket')) {
    return { category: 'Cart', color: 'text-purple-600' };
  }
  if (lowerPath.includes('/checkout') || lowerPath.includes('/payment')) {
    return { category: 'Checkout', color: 'text-green-600' };
  }
  if (lowerPath.includes('/category') || lowerPath.includes('/collection')) {
    return { category: 'Category', color: 'text-orange-600' };
  }
  if (lowerPath === '/' || lowerPath === '') {
    return { category: 'Home', color: 'text-gray-600' };
  }

  return { category: 'Page', color: 'text-gray-600' };
}

export function TopPagesView({ pageViews }: TopPagesViewProps) {
  if (!pageViews.topPages || pageViews.topPages.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Pages</h3>
        <p className="text-sm text-muted-foreground">
          No page view data available yet. Page tracking will appear once users browse your site.
        </p>
      </Card>
    );
  }

  const maxViews = Math.max(...pageViews.topPages.map(p => p.views));

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Top Pages</h3>
          <p className="text-sm text-muted-foreground">
            {pageViews.uniquePages} unique pages • {pageViews.avgPerSession.toFixed(1)} views per session
          </p>
        </div>
        <TrendingUp className="h-5 w-5 text-muted-foreground" />
      </div>

      <div className="space-y-4">
        {pageViews.topPages.map((page, index) => {
          const path = extractPagePath(page.url);
          const { category, color } = getPageCategory(path);
          const percentage = (page.views / maxViews) * 100;
          const shareOfTotal = (page.views / pageViews.total) * 100;

          return (
            <div
              key={page.url}
              className="space-y-2 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold text-muted-foreground">
                      #{index + 1}
                    </span>
                    <span className={`text-xs font-medium ${color}`}>
                      {category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium truncate" title={path}>
                      {path}
                    </span>
                    <a
                      href={page.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-lg font-bold">{page.views}</div>
                  <div className="text-xs text-muted-foreground">
                    {shareOfTotal.toFixed(1)}%
                  </div>
                </div>
              </div>

              <Progress value={percentage} className="h-2" />
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-muted rounded-lg">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{pageViews.total}</div>
            <div className="text-xs text-muted-foreground">Total Views</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pageViews.uniquePages}</div>
            <div className="text-xs text-muted-foreground">Unique Pages</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{pageViews.avgPerSession.toFixed(1)}</div>
            <div className="text-xs text-muted-foreground">Avg/Session</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
