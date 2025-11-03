'use client';

import { useState } from 'react';
import { Sparkles, TrendingUp, Users, DollarSign, ArrowRight } from 'lucide-react';

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
      await new Promise(resolve => setTimeout(resolve, 2000));

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
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <form onSubmit={handleGetQuote} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Website URL
                </label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  required
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  We'll analyze your traffic, content, and recommend the best plan
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isAnalyzing || !websiteUrl}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    Analyzing Your Website...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Get My Free Quote
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  No signup required
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Instant results
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  100% free
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6 animate-fadeIn">
            {/* Success Header */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
              <div className="inline-flex items-center gap-2 text-green-700 font-semibold text-lg">
                <Sparkles className="w-5 h-5" />
                Analysis Complete!
              </div>
            </div>

            {/* Recommended Plan */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="text-center space-y-4">
                <div className="inline-block bg-white/20 px-4 py-2 rounded-full text-sm font-medium">
                  Recommended For You
                </div>
                <h2 className="text-4xl font-bold">{result.tierName} Plan</h2>
                <div className="text-5xl font-bold">
                  £{result.monthlyPrice.toLocaleString()}
                  <span className="text-2xl font-normal">/month</span>
                </div>
                <p className="text-lg text-indigo-100">per domain • 14-day free trial</p>

                <button
                  onClick={() => window.location.href = '/billing'}
                  className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-indigo-50 transition-colors inline-flex items-center gap-2"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Estimated Traffic</div>
                    <div className="text-2xl font-bold">{result.estimatedVisitors.toLocaleString()}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">monthly visitors</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-purple-100 p-3 rounded-lg">
                    <Users className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Expected Conversations</div>
                    <div className="text-2xl font-bold">{result.estimatedConversations.toLocaleString()}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">per month (unlimited)</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-md border border-green-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="bg-green-100 p-3 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Monthly Savings</div>
                    <div className="text-2xl font-bold text-green-600">£{result.savings.toLocaleString()}</div>
                  </div>
                </div>
                <p className="text-sm text-gray-500">vs. hiring CS team</p>
              </div>
            </div>

            {/* Features */}
            <div className="bg-white rounded-xl p-8 shadow-md border border-gray-100">
              <h3 className="text-xl font-bold mb-6">What's Included</h3>
              <div className="grid md:grid-cols-2 gap-4">
                {result.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <div className="bg-green-100 rounded-full p-1">
                      <Check className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="text-gray-700">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Breakdown */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
              <h3 className="font-bold text-lg mb-4">💰 ROI Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Current CS team cost (estimated)</span>
                  <span className="font-semibold">£{result.currentCost.toLocaleString()}/mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Omniops {result.tierName} plan</span>
                  <span className="font-semibold">£{result.monthlyPrice.toLocaleString()}/mo</span>
                </div>
                <div className="border-t border-green-300 pt-2 mt-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-bold text-green-700">Your Savings</span>
                  <span className="font-bold text-green-700">£{result.savings.toLocaleString()}/mo (85%)</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Annual savings</span>
                  <span className="font-semibold">£{(result.savings * 12).toLocaleString()}/year</span>
                </div>
              </div>
            </div>

            {/* Try Another */}
            <div className="text-center">
              <button
                onClick={() => {
                  setResult(null);
                  setWebsiteUrl('');
                }}
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                ← Analyze a different website
              </button>
            </div>
          </div>
        )}

        {/* Trust Indicators */}
        {!result && (
          <div className="mt-12 text-center space-y-6">
            <p className="text-gray-600">Trusted by 500+ businesses</p>
            <div className="flex justify-center gap-12 text-sm text-gray-500">
              <div>
                <div className="text-2xl font-bold text-gray-900">2.5M+</div>
                <div>Conversations handled</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">86%</div>
                <div>AI accuracy</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">£15M+</div>
                <div>Saved for clients</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Check({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 13l4 4L19 7"
      />
    </svg>
  );
}
