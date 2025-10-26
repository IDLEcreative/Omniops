'use client';

import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Globe,
  MessageSquare,
  RefreshCw,
  Trash2,
  Loader2,
  File,
  FileText,
  Brain,
  Database,
  Zap
} from 'lucide-react';

interface TrainingData {
  id: string;
  type: 'url' | 'file' | 'qa' | 'text';
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  createdAt: string;
  metadata?: any;
}

interface TrainingDataListProps {
  trainingData: TrainingData[];
  isLoading?: boolean;
  isInitialLoading?: boolean;
  hasMore?: boolean;
  totalItems?: number;
  isTraining?: boolean;
  onDelete: (id: string) => Promise<void>;
  onLoadMore: () => void;
  onStartTraining: () => void;
  onSetActiveTab?: (tab: string) => void;
}

const typeConfig = {
  url: { icon: Globe, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/50' },
  file: { icon: File, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/50' },
  qa: { icon: MessageSquare, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/50' },
  text: { icon: FileText, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/50' },
};

export function TrainingDataList({
  trainingData,
  isLoading = false,
  isInitialLoading = false,
  hasMore = false,
  totalItems = 0,
  isTraining = false,
  onDelete,
  onLoadMore,
  onStartTraining,
  onSetActiveTab
}: TrainingDataListProps) {
  return (
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
            <Button onClick={onStartTraining} disabled={isTraining} size="sm">
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
                const config = typeConfig[item.type] || { icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' };
                const Icon = config.icon;

                return (
                  <div
                    key={item.id}
                    className="group flex items-center justify-between py-2 px-3 border-b hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Icon className={cn('h-3 w-3 flex-shrink-0', config.color)} />
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
                        onClick={() => onDelete(item.id)}
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
                  onAction={() => onSetActiveTab?.('scraping')}
                  variant="default"
                />
              )}

              {hasMore && (
                <div className="pt-4 pb-2 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={onLoadMore}
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
  );
}
