'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertCircle, 
  CheckCircle, 
  Loader2, 
  Globe, 
  FileText, 
  RefreshCw, 
  Trash2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ScrapedPage {
  id: string;
  url: string;
  title: string;
  status: 'success' | 'error' | 'pending';
  error?: string;
  scrapedAt: string;
}

export default function ScrapingPage() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'scraping' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [jobId, setJobId] = useState('');
  const [progress, setProgress] = useState(0);
  const [crawlStats, setCrawlStats] = useState({
    total: 0,
    completed: 0,
    failed: 0,
    remaining: 0,
    estimatedTime: 0
  });
  const [scrapedPages, setScrapedPages] = useState<ScrapedPage[]>([]);
  const [syncSchedule, setSyncSchedule] = useState('weekly');
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  // Simulate loading scraped pages
  useEffect(() => {
    // In real implementation, fetch from API
    setScrapedPages([
      { id: '1', url: '/home', title: 'Welcome to Our Site', status: 'success', scrapedAt: '2 days ago' },
      { id: '2', url: '/products', title: 'Our Products', status: 'success', scrapedAt: '2 days ago' },
      { id: '3', url: '/about', title: 'About Us', status: 'success', scrapedAt: '2 days ago' },
      { id: '4', url: '/admin', title: 'Admin Panel', status: 'error', error: 'Blocked (401)', scrapedAt: '2 days ago' },
      { id: '5', url: '/old-page', title: 'Not Found', status: 'error', error: 'Page not found (404)', scrapedAt: '2 days ago' },
    ]);
  }, []);

  const handleScrape = async (crawl: boolean) => {
    if (!url.trim()) {
      setMessage('Please enter a URL');
      setStatus('error');
      return;
    }

    setLoading(true);
    setStatus('scraping');
    setMessage('');
    setProgress(0);

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: url.trim(),
          crawl,
          max_pages: crawl ? 50 : 1,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Scraping failed');
      }

      if (data.job_id) {
        setJobId(data.job_id);
        setCrawlStats({
          total: 50,
          completed: 0,
          failed: 0,
          remaining: 50,
          estimatedTime: 40
        });
        setMessage(`Crawl started! Indexing your website...`);
        setStatus('success');
        
        // Poll for status
        pollJobStatus();
      } else {
        setMessage(data.message || 'Page scraped successfully!');
        setStatus('success');
        setProgress(100);
      }
    } catch (error) {
      setMessage((error as Error).message || 'Failed to scrape website');
      setStatus('error');
    } finally {
      if (!jobId) {
        setLoading(false);
      }
    }
  };

  const pollJobStatus = async () => {
    let simulatedProgress = 0;
    const interval = setInterval(async () => {
      try {
        // Simulate progress
        simulatedProgress += Math.random() * 15;
        if (simulatedProgress > 100) simulatedProgress = 100;
        
        setProgress(simulatedProgress);
        const completed = Math.floor((simulatedProgress / 100) * 50);
        const failed = Math.floor(Math.random() * 3);
        
        setCrawlStats({
          total: 50,
          completed,
          failed,
          remaining: 50 - completed - failed,
          estimatedTime: Math.max(0, 40 - Math.floor(simulatedProgress * 0.4))
        });

        if (simulatedProgress >= 100) {
          clearInterval(interval);
          setMessage(`Crawl completed! Successfully indexed ${completed} pages.`);
          setStatus('success');
          setLoading(false);
          
          // Add new pages to the list
          const newPage: ScrapedPage = {
            id: Date.now().toString(),
            url: new URL(url).pathname || '/',
            title: 'Newly Scraped Page',
            status: 'success',
            scrapedAt: 'Just now'
          };
          setScrapedPages(prev => [newPage, ...prev]);
        } else {
          setMessage(`Indexing ${completed} pages, ${crawlStats.estimatedTime} sec remaining`);
        }
      } catch (error) {
        console.error('Failed to check job status:', error);
      }
    }, 1000);
  };

  const handleDeleteSelected = () => {
    setScrapedPages(prev => prev.filter(page => !selectedPages.includes(page.id)));
    setSelectedPages([]);
  };

  const handleRefreshAll = () => {
    setMessage('Refreshing all pages...');
    setStatus('scraping');
    // Simulate refresh
    setTimeout(() => {
      setMessage('All pages refreshed successfully!');
      setStatus('success');
      setScrapedPages(prev => prev.map(page => ({
        ...page,
        scrapedAt: 'Just now'
      })));
    }, 2000);
  };

  const failedCount = scrapedPages.filter(p => p.status === 'error').length;

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Website Content Manager</h1>
        <p className="text-muted-foreground">
          Scrape and manage your website content to train the AI assistant
        </p>
      </div>

      {status === 'error' && message && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {status === 'success' && message && (
        <Alert className="mb-4">
          <CheckCircle className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {status === 'scraping' && (
        <Alert className="mb-4">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Scraping in Progress</AlertTitle>
          <AlertDescription>
            <div className="space-y-2">
              <p>{message}</p>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{crawlStats.completed} pages indexed</span>
                <span>{crawlStats.failed} failed</span>
                <span>{crawlStats.estimatedTime}s remaining</span>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scrape New Content</CardTitle>
            <CardDescription>
              Add new pages to your knowledge base
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="url">Website URL</Label>
              <Input
                id="url"
                placeholder="https://example.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => handleScrape(false)}
                disabled={loading || !url.trim()}
              >
                {loading && !jobId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Scrape Single Page
                  </>
                )}
              </Button>
              
              <Button
                onClick={() => handleScrape(true)}
                disabled={loading || !url.trim()}
                variant="outline"
              >
                {loading && jobId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Crawling...
                  </>
                ) : (
                  <>
                    <Globe className="mr-2 h-4 w-4" />
                    Crawl Entire Site
                  </>
                )}
              </Button>
            </div>

            <div className="text-sm text-muted-foreground">
              <p>□ Scrape entire website (up to 50 pages)</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Scraped Pages</CardTitle>
                <CardDescription>
                  Last updated: 2 days ago • {failedCount > 0 && `${failedCount} pages failed`}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="sync-schedule" className="text-sm">Sync:</Label>
                <Select value={syncSchedule} onValueChange={setSyncSchedule}>
                  <SelectTrigger id="sync-schedule" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {scrapedPages.map((page) => (
                <div
                  key={page.id}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={selectedPages.includes(page.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPages([...selectedPages, page.id]);
                      } else {
                        setSelectedPages(selectedPages.filter(id => id !== page.id));
                      }
                    }}
                    className="rounded"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {page.status === 'success' ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : page.status === 'error' ? (
                        page.error?.includes('404') ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive" />
                        )
                      ) : (
                        <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />
                      )}
                      <span className="font-medium">{page.url}</span>
                      <span className="text-sm text-muted-foreground">"{page.title}"</span>
                    </div>
                    {page.error && (
                      <p className="text-sm text-destructive ml-6">{page.error}</p>
                    )}
                  </div>
                  
                  <Badge variant="secondary" className="text-xs">
                    <Calendar className="h-3 w-3 mr-1" />
                    {page.scrapedAt}
                  </Badge>
                </div>
              ))}
            </div>

            {failedCount > 0 && (
              <Alert className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Failed Pages Log</AlertTitle>
                <AlertDescription>
                  {failedCount} pages could not be scraped. Common reasons include authentication 
                  requirements, robots.txt blocks, or broken links.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefreshAll}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteSelected}
                disabled={selectedPages.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base Status</CardTitle>
            <CardDescription>
              Current AI training data overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Pages Indexed</span>
                <Badge variant="secondary">{scrapedPages.filter(p => p.status === 'success').length}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Failed Pages</span>
                <Badge variant={failedCount > 0 ? "destructive" : "secondary"}>{failedCount}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Next Sync</span>
                <Badge variant="secondary">
                  {syncSchedule === 'daily' ? 'Tomorrow' : 
                   syncSchedule === 'weekly' ? 'Next week' :
                   syncSchedule === 'monthly' ? 'Next month' : 'Manual'}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Knowledge Chunks</span>
                <Badge variant="secondary">~{scrapedPages.filter(p => p.status === 'success').length * 12}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}