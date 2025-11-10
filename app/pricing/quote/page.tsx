'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { QuoteForm } from './components/QuoteForm';
import { QuoteResults } from './components/QuoteResults';
import { TrustIndicators } from './components/TrustIndicators';

interface QuoteResult {
  recommendedTier: string;
  tierName: string;
  monthlyPrice: number;
  estimatedVisitors: number;
  estimatedConversations: number;
  savings: number;
  currentCost: number;
  features: string[];
}

export default function QuotePage() {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<QuoteResult | null>(null);
  const [error, setError] = useState('');

  const handleGetQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsAnalyzing(true);

    try {
      // Simulate AI analysis (in production, this would call your AI quote API)
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simple logic based on domain (you'll replace this with actual AI)
      const mockResult: QuoteResult = {
        recommendedTier: 'sme',
        tierName: 'SME',
        monthlyPrice: 1000,
        estimatedVisitors: 250000,
        estimatedConversations: 12500,
        savings: 5708,
        currentCost: 6708,
        features: [
          'Unlimited conversations',
          'Priority support',
          'Advanced analytics',
          'Custom AI training',
          'Multi-language support',
        ],
      };

      setResult(mockResult);
    } catch (err) {
      setError('Failed to analyze website. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setWebsiteUrl('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            AI-Powered Pricing Calculator
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Get Your Personalized Quote in 30 Seconds
          </h1>
          <p className="text-xl text-gray-600">
            Our AI analyzes your website and recommends the perfect pricing tier
          </p>
        </div>

        {/* Quote Form */}
        {!result && (
          <QuoteForm
            websiteUrl={websiteUrl}
            setWebsiteUrl={setWebsiteUrl}
            isAnalyzing={isAnalyzing}
            error={error}
            onSubmit={handleGetQuote}
          />
        )}

        {/* Results */}
        {result && <QuoteResults result={result} onReset={handleReset} />}

        {/* Trust Indicators */}
        {!result && <TrustIndicators />}
      </div>
    </div>
  );
}
