import {
  Sparkles,
  TrendingUp,
  Users,
  DollarSign,
  ArrowRight,
} from 'lucide-react';
import { Check } from './Check';

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

interface QuoteResultsProps {
  result: QuoteResult;
  onReset: () => void;
}

export function QuoteResults({ result, onReset }: QuoteResultsProps) {
  return (
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
            onClick={() => (window.location.href = '/billing')}
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
              <div className="text-2xl font-bold">
                {result.estimatedVisitors.toLocaleString()}
              </div>
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
              <div className="text-2xl font-bold">
                {result.estimatedConversations.toLocaleString()}
              </div>
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
              <div className="text-2xl font-bold text-green-600">
                £{result.savings.toLocaleString()}
              </div>
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
            <span className="font-bold text-green-700">
              £{result.savings.toLocaleString()}/mo (85%)
            </span>
          </div>
          <div className="flex justify-between text-sm text-gray-600">
            <span>Annual savings</span>
            <span className="font-semibold">
              £{(result.savings * 12).toLocaleString()}/year
            </span>
          </div>
        </div>
      </div>

      {/* Try Another */}
      <div className="text-center">
        <button
          onClick={onReset}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Analyze a different website
        </button>
      </div>
    </div>
  );
}
