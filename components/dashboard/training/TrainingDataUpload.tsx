'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  FileText,
  Globe,
  MessageSquare,
  Loader2,
  Plus,
  Save,
  LightbulbIcon
} from 'lucide-react';

interface TrainingDataUploadProps {
  onUrlSubmit: (url: string) => Promise<void>;
  onTextSubmit: (text: string) => Promise<void>;
  onQASubmit: (question: string, answer: string) => Promise<void>;
  isLoading?: boolean;
}

export function TrainingDataUpload({
  onUrlSubmit,
  onTextSubmit,
  onQASubmit,
  isLoading = false
}: TrainingDataUploadProps) {
  const [activeTab, setActiveTab] = useState('scraping');
  const [urlInput, setUrlInput] = useState('');
  const [textInput, setTextInput] = useState('');
  const [qaQuestion, setQaQuestion] = useState('');
  const [qaAnswer, setQaAnswer] = useState('');

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    await onUrlSubmit(urlInput.trim());
    setUrlInput('');
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    await onTextSubmit(textInput.trim());
    setTextInput('');
  };

  const handleQASubmit = async () => {
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    await onQASubmit(qaQuestion.trim(), qaAnswer.trim());
    setQaQuestion('');
    setQaAnswer('');
  };

  return (
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
  );
}
