'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { TrainingHeader } from '@/components/dashboard/training/TrainingHeader';
import { TrainingProgressBar } from '@/components/dashboard/training/TrainingProgressBar';
import { TrainingDataUpload } from '@/components/dashboard/training/TrainingDataUpload';
import { TrainingDataList } from '@/components/dashboard/training/TrainingDataList';
import { TrainingTips } from '@/components/dashboard/training/TrainingTips';
import {
  type TrainingData,
  normalizeUrl,
  createOptimisticItem,
  formatQAContent,
  updateOptimisticItem,
  removeOptimisticItem,
  fetchTrainingData as fetchTrainingDataUtil,
  submitUrl,
  submitText,
  submitQA,
  deleteTrainingData
} from '@/lib/dashboard/training-utils';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
  loading: () => null
});

export default function TrainingPage() {
  const [trainingData, setTrainingData] = useState<TrainingData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [isTraining, setIsTraining] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalItems, setTotalItems] = useState(0);
  const [showTestWidget, setShowTestWidget] = useState(false);
  const [widgetMounted, setWidgetMounted] = useState(false);
  const itemsPerPage = 20;

  const fetchTrainingData = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (!append) {
      setIsInitialLoading(true);
    }
    try {
      const data = await fetchTrainingDataUtil(pageNum, itemsPerPage);
      if (append) {
        setTrainingData(prev => [...prev, ...data.items]);
      } else {
        setTrainingData(data.items);
      }
      setTotalItems(data.total);
      setHasMore(data.hasMore);
    } catch (error) {
      console.error('Error fetching training data:', error);
    } finally {
      setIsInitialLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainingData(1);
  }, [fetchTrainingData]);

  useEffect(() => {
    if (showTestWidget) {
      setWidgetMounted(true);
    }
  }, [showTestWidget]);

  const handleUrlSubmit = async (url: string) => {
    setIsLoading(true);

    const normalizedUrl = normalizeUrl(url);
    const optimisticItem = createOptimisticItem('url', normalizedUrl);
    setTrainingData(prev => [optimisticItem, ...prev]);

    try {
      const data = await submitUrl(normalizedUrl);
      setTrainingData(prev =>
        updateOptimisticItem(prev, optimisticItem.id, { id: data.id, status: 'pending' })
      );
    } catch (error) {
      console.error('Error submitting URL:', error);
      setTrainingData(prev => removeOptimisticItem(prev, optimisticItem.id));
      alert(`Failed to scrape URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    setIsLoading(false);
  };

  const handleTextSubmit = async (text: string) => {
    setIsLoading(true);

    const optimisticItem = createOptimisticItem('text', text);
    setTrainingData(prev => [optimisticItem, ...prev]);

    try {
      const result = await submitText(text);
      setTrainingData(prev =>
        updateOptimisticItem(prev, optimisticItem.id, { ...result.data, status: 'completed' })
      );
    } catch (error) {
      console.error('Error submitting text:', error);
      setTrainingData(prev => removeOptimisticItem(prev, optimisticItem.id));
    }
    setIsLoading(false);
  };

  const handleQASubmit = async (question: string, answer: string) => {
    setIsLoading(true);

    const optimisticItem = createOptimisticItem(
      'qa',
      formatQAContent(question, answer),
      { question, answer }
    );
    setTrainingData(prev => [optimisticItem, ...prev]);

    try {
      const result = await submitQA(question, answer);
      setTrainingData(prev =>
        updateOptimisticItem(prev, optimisticItem.id, { ...result.data, status: 'completed' })
      );
    } catch (error) {
      console.error('Error submitting Q&A:', error);
      setTrainingData(prev => removeOptimisticItem(prev, optimisticItem.id));
    }
    setIsLoading(false);
  };

  const handleStartTraining = async () => {
    setIsTraining(true);
    setTrainingProgress(0);

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
    setTrainingData(prev => prev.filter(item => item.id !== id));

    try {
      await deleteTrainingData(id);
    } catch (error) {
      console.error('Error deleting data:', error);
      await fetchTrainingData(page);
    }
  };

  const handleLoadMore = () => {
    if (!hasMore || isLoading) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTrainingData(nextPage, true);
  };

  const displayedData = useMemo(() => trainingData, [trainingData]);

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-8">
      <TrainingHeader
        showTestWidget={showTestWidget}
        onToggleWidget={() => setShowTestWidget(!showTestWidget)}
      />

      <TrainingProgressBar
        totalItems={totalItems || trainingData.length}
        trainingProgress={trainingProgress}
        isTraining={isTraining}
      />

      <TrainingDataUpload
        onUrlSubmit={handleUrlSubmit}
        onTextSubmit={handleTextSubmit}
        onQASubmit={handleQASubmit}
        isLoading={isLoading}
      />

      <TrainingDataList
        trainingData={displayedData}
        isLoading={isLoading}
        isInitialLoading={isInitialLoading}
        hasMore={hasMore}
        totalItems={totalItems}
        isTraining={isTraining}
        onDelete={handleDeleteData}
        onLoadMore={handleLoadMore}
        onStartTraining={handleStartTraining}
      />

      <TrainingTips />

      {widgetMounted && showTestWidget && (
        <ChatWidget
          demoId="training-test"
          demoConfig={{
            headerTitle: 'Test Your Assistant',
          }}
          initialOpen={false}
        />
      )}
    </div>
  );
}
