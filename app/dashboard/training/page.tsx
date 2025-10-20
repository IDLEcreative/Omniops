'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Bot, 
  Upload, 
  FileText, 
  Globe, 
  MessageSquare, 
  Settings, 
  Trash2, 
  RefreshCw,
  Plus,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Link,
  Brain,
  Sparkles,
  Database,
  Zap,
  Clock,
  File,
  TrendingUp,
  Info,
  LightbulbIcon,
  TestTube
} from 'lucide-react';

// Dynamically import the ChatWidget to avoid SSR issues
const ChatWidget = dynamic(() => import('@/components/ChatWidget'), { 
  ssr: false,
  loading: () => null 
});

interface TrainingData {
  id: string;
  type: 'url' | 'file' | 'qa' | 'text';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: string;
  metadata?: any;
}

export default function TrainingPage() {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('scraping');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [showTestWidget, setShowTestWidget] = useState(false);
  const [widgetMounted, setWidgetMounted] = useState(false);
  const itemsPerPage = 20;

  // Load existing training data with pagination
  const fetchTrainingData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!append) {
      setIsInitialLoading(true);
    }
    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: itemsPerPage.toString()
      });
      const response = await fetch(`/api/training?${params}`);
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setTrainingData(prev => [...prev, ...(data.items || [])]);
        } else {
          setTrainingData(data.items || []);
        }
        setTotalItems(data.total || 0);
        setHasMore(data.hasMore || false);
      }
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  // Load initial data
  useEffect(() => {
    fetchTrainingData(1);
  }, [fetchTrainingData]);

  // Handle widget mounting
  useEffect(() => {
    if (showTestWidget) {
      setWidgetMounted(true);
    }
  }, [showTestWidget]);

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    
    setIsLoading(true);
    
    // Normalize URL - add https:// if no protocol specified
    let normalizedUrl = urlInput.trim();
    if (!normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    // Optimistically add the item
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: TrainingData = {
      id: tempId,
      type: 'url',
      content: normalizedUrl,
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setTrainingData(prev => [optimisticItem, ...prev]);
    
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: normalizedUrl, crawl: true, max_pages: 1000 }),
      });

      if (response.ok) {
        const data = await response.json();
        setUrlInput('');
        // Update with real data
        setTrainingData(prev => 
          prev.map(item => item.id === tempId ? 
            { ...item, id: data.id, status: 'pending' } : item
          )
        );
      } else {
        // Remove optimistic item on error
        setTrainingData(prev => prev.filter(item => item.id !== tempId));
        const errorData = await response.json().catch(() => null);
        console.error('Scraping failed:', errorData);
        alert(`Failed to scrape URL: ${errorData?.error || response.statusText || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error submitting URL:', error);
      // Remove optimistic item on error
      setTrainingData(prev => prev.filter(item => item.id !== tempId));
      alert('Failed to submit URL. Please check your connection and try again.');
    }
    setIsLoading(false);
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    
    setIsLoading(true);
    
    // Optimistically add the item
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: TrainingData = {
      id: tempId,
      type: 'text',
      content: textInput.substring(0, 100) + (textInput.length > 100 ? '...' : ''),
      status: 'processing',
      createdAt: new Date().toISOString(),
    };
    setTrainingData(prev => [optimisticItem, ...prev]);
    
    try {
      const response = await fetch('/api/training/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: textInput }),
      });

      if (response.ok) {
        const data = await response.json();
        setTextInput('');
        // Update with real data
        setTrainingData(prev => 
          prev.map(item => item.id === tempId ? 
            { ...data.data, status: 'completed' } : item
          )
        );
      } else {
        // Remove optimistic item on error
        setTrainingData(prev => prev.filter(item => item.id !== tempId));
      }
    } catch (error) {
      console.error('Error submitting text:', error);
      // Remove optimistic item on error
      setTrainingData(prev => prev.filter(item => item.id !== tempId));
    }
    setIsLoading(false);
  };

  const handleQASubmit = async () => {
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    
    setIsLoading(true);
    
    // Optimistically add the item
    const tempId = `temp-${Date.now()}`;
    const optimisticItem: TrainingData = {
      id: tempId,
      type: 'qa',
      content: `Q: ${qaQuestion}`,
      status: 'processing',
      createdAt: new Date().toISOString(),
      metadata: { question: qaQuestion, answer: qaAnswer }
    };
    setTrainingData(prev => [optimisticItem, ...prev]);
    
    try {
      const response = await fetch('/api/training/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: qaQuestion, answer: qaAnswer }),
      });

      if (response.ok) {
        const data = await response.json();
        setQaQuestion('');
        setQaAnswer('');
        // Update with real data
        setTrainingData(prev => 
          prev.map(item => item.id === tempId ? 
            { ...data.data, status: 'completed' } : item
          )
        );
      } else {
        // Remove optimistic item on error
        setTrainingData(prev => prev.filter(item => item.id !== tempId));
      }
    } catch (error) {
      console.error('Error submitting Q&A:', error);
      // Remove optimistic item on error
      setTrainingData(prev => prev.filter(item => item.id !== tempId));
    }
    setIsLoading(false);
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);
    
    // Simulate training progress
    const interval = setInterval(() => {
      setTrainingProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsTraining(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  const handleDeleteData = async (id: string) => {
    // Optimistically remove the item
    setTrainingData(prev => prev.filter(item => item.id !== id));
    
    try {
      const response = await fetch(`/api/training/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        // Restore on error
        await fetchTrainingData(page);
      }
    } catch (error) {
      console.error('Error deleting data:', error);
      // Restore on error
      await fetchTrainingData(page);
    }
  };

  // Load more data when scrolling
  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTrainingData(nextPage, true);
  };

  // Memoize filtered training data for better performance
  const displayedData = useMemo(() => trainingData, [trainingData]);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      {/* Header with gradient background */}
      <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-primary/10 via-primary/5 to-background p-8">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.6))] pointer-events-none" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Bot Training Center</h1>
              <p className="text-muted-foreground mt-1">
                Teach your AI assistant with custom knowledge to deliver accurate, personalized responses
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Test Widget Card */}
      <Card className="border-primary/10 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TestTube className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Test Your Bot</h3>
                <p className="text-xs text-muted-foreground">
                  {showTestWidget ? 'Widget active in bottom-right corner' : 'Try your AI with latest training'}
                </p>
              </div>
            </div>
            <Button
              variant={showTestWidget ? "default" : "secondary"}
              size="sm"
              onClick={() => setShowTestWidget(!showTestWidget)}
              className="ml-4"
            >
              {showTestWidget ? 'Hide Widget' : 'Show Widget'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards with improved styling */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow duration-200 border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Data Sources</CardTitle>
            <div className="p-2 bg-primary/10 rounded-lg">
              <Database className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems || trainingData.length}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-600" />
              Active training items
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 border-blue-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Training Status</CardTitle>
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Brain className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isTraining ? 'Processing' : 'Ready'}
            </div>
            <Progress value={trainingProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 border-green-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Quality</CardTitle>
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Sparkles className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <CheckCircle className="h-3 w-3 text-green-600" />
              Excellent performance
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow duration-200 border-orange-500/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Updated</CardTitle>
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="h-4 w-4 text-orange-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2h ago</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <RefreshCw className="h-3 w-3 text-orange-600" />
              Auto-sync active
            </p>
          </CardContent>
        </Card>
      </div>


      {/* Training Tabs */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-t-lg">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Add Training Data</CardTitle>
              <CardDescription>
                Choose how you want to add content for training your bot
              </CardDescription>
            </div>
            <Badge variant="secondary" className="hidden md:flex">
              <LightbulbIcon className="h-3 w-3 mr-1" />
              Pro Tip: Mix different data types for best results
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
              <TabsTrigger value="scraping" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                <Globe className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Website</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                <Upload className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Files</span>
              </TabsTrigger>
              <TabsTrigger value="qa" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                <MessageSquare className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Q&A</span>
              </TabsTrigger>
              <TabsTrigger value="text" className="data-[state=active]:bg-background data-[state=active]:shadow-sm py-3">
                <FileText className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Text</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scraping" className="mt-6 space-y-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                      <Globe className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Import Website Content</h3>
                      <p className="text-sm text-muted-foreground">
                        We'll crawl your website and extract all relevant content including pages, FAQs, and product information
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="url">Website URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="url"
                        placeholder="https://example.com"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleUrlSubmit()}
                        className="bg-background"
                      />
                      <Button onClick={handleUrlSubmit} disabled={isLoading} className="min-w-[120px]">
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Globe className="mr-2 h-4 w-4" />
                            Scrape
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="files" className="mt-6 space-y-4">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg p-6">
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors">
                  <div className="max-w-sm mx-auto">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-full w-fit mx-auto mb-4">
                      <Upload className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    </div>
                    <h3 className="font-semibold mb-2">Upload Documents</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Drag and drop files here, or click to browse
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center text-xs text-muted-foreground mb-6">
                      <Badge variant="secondary">PDF</Badge>
                      <Badge variant="secondary">DOC/DOCX</Badge>
                      <Badge variant="secondary">TXT</Badge>
                      <Badge variant="secondary">CSV</Badge>
                    </div>
                    <Button variant="secondary" size="lg">
                      <FileText className="mr-2 h-4 w-4" />
                      Select Files
                    </Button>
                    <p className="text-xs text-muted-foreground mt-4">
                      Maximum file size: 10MB per file
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="qa" className="mt-6 space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                      <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Add Q&A Pairs</h3>
                      <p className="text-sm text-muted-foreground">
                        Train your bot with specific questions and their exact answers. Perfect for FAQs and policies.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="question">Question</Label>
                      <Input
                        id="question"
                        placeholder="What is your return policy?"
                        value={qaQuestion}
                        onChange={(e) => setQaQuestion(e.target.value)}
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="answer">Answer</Label>
                      <Textarea
                        id="answer"
                        placeholder="Our return policy allows customers to return products within 30 days..."
                        value={qaAnswer}
                        onChange={(e) => setQaAnswer(e.target.value)}
                        rows={4}
                        className="bg-background resize-none"
                      />
                    </div>
                    <Button onClick={handleQASubmit} disabled={isLoading} className="w-full sm:w-auto">
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Q&A Pair
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="text" className="mt-6 space-y-4">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 rounded-lg p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3 mb-6">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                      <FileText className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">Custom Text Content</h3>
                      <p className="text-sm text-muted-foreground">
                        Add any text content directly - product descriptions, company info, or specialized knowledge.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="text">Content</Label>
                    <Textarea
                      id="text"
                      placeholder="Enter any text content you want the bot to learn..."
                      value={textInput}
                      onChange={(e) => setTextInput(e.target.value)}
                      rows={8}
                      className="bg-background resize-none font-mono text-sm"
                    />
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {textInput.length} characters
                      </p>
                      <Button onClick={handleTextSubmit} disabled={isLoading}>
                        {isLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Content
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Training Data List */}
      <Card className="shadow-sm">
        <CardHeader className="bg-gradient-to-r from-muted/50 to-muted/30 rounded-t-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                Training Data Library
              </CardTitle>
              <CardDescription>
                Manage all content used to train your AI assistant
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync All
              </Button>
              <Button onClick={handleStartTraining} disabled={isTraining} size="sm">
                {isTraining ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Training...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Training
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isInitialLoading ? (
            // Loading skeleton
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="w-8 h-8 bg-muted rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-3 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-20 bg-muted rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <ScrollArea className="h-[500px] pr-2">
            <div className="divide-y">
              {trainingData.map((item) => {
                const typeConfig = {
                  url: { icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50' },
                  file: { icon: File, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/50' },
                  qa: { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/50' },
                  text: { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/50' },
                }[item.type] || { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' };
                
                const Icon = typeConfig.icon;
                
                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between py-2 px-3 border-b hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className={cn('h-3 w-3 flex-shrink-0', typeConfig.color)} />
                      <p className="text-sm truncate flex-1">{item.content}</p>
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 ml-2">
                      {item.status === 'processing' ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                      ) : item.status === 'error' ? (
                        <Badge variant="destructive" className="text-xs py-0 px-1 h-5">
                          Error
                        </Badge>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteData(item.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              
              {trainingData.length === 0 && (
                <EmptyState
                  icon={Brain}
                  title="No training data yet"
                  description="Start by adding website URLs, uploading documents, or creating Q&A pairs above to train your AI assistant"
                  actionLabel="Add Your First Source"
                  onAction={() => setActiveTab('scraping')}
                  variant="default"
                />
              )}
              
              {hasMore && (
                <div className="pt-4 pb-2 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full max-w-xs"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Load More ({trainingData.length} of {totalItems})
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Training Tips */}
      <div className="grid gap-4 md:grid-cols-2">
        <Alert className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/20">
          <LightbulbIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle>Pro Tips</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            <p className="text-sm">• Mix different data types for comprehensive coverage</p>
            <p className="text-sm">• Update Q&As regularly based on customer feedback</p>
            <p className="text-sm">• Include product specs and policies for accuracy</p>
          </AlertDescription>
        </Alert>
        
        <Alert className="border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/20">
          <Info className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle>Best Practices</AlertTitle>
          <AlertDescription className="mt-2 space-y-1">
            <p className="text-sm">• Keep answers concise and customer-friendly</p>
            <p className="text-sm">• Cover edge cases and common variations</p>
            <p className="text-sm">• Test responses after training updates</p>
          </AlertDescription>
        </Alert>
      </div>

      {/* Render the chat widget when enabled */}
      {widgetMounted && showTestWidget && (
        <ChatWidget 
          demoId="training-test"
          demoConfig={{
            brandName: 'Training Test Bot',
            brandColor: '#4F46E5',
            headerTitle: 'Test Your Assistant',
            welcomeMessage: 'Hi! I\'m your AI assistant. Ask me anything to test the training data!',
            url: 'https://training.test'
          }}
          initialOpen={false}
        />
      )}
    </div>
  );
}