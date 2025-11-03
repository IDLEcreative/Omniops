'use client';

import { useState, useMemo } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { TrendingUp, ArrowRight } from 'lucide-react';

// Constants
const CS_REP_COST = 3354; // Monthly cost per CS rep in UK
const CHAT_ENGAGEMENT_RATE = 0.05; // 5% of visitors
const CONVERSATION_COMPLETION_RATE = 0.90; // 90% completion rate

const PLAN_TIERS = [
  { name: 'Small Business', price: 500, conversations: 2500, overageRate: 0.12 },
  { name: 'SME', price: 1000, conversations: 5000, overageRate: 0.10 },
  { name: 'Mid-Market', price: 5000, conversations: 25000, overageRate: 0.08 },
  { name: 'Enterprise', price: 10000, conversations: 100000, overageRate: 0.05 },
] as const;

type PlanTier = typeof PLAN_TIERS[number];

function recommendPlan(estimatedConversations: number): PlanTier {
  for (let i = PLAN_TIERS.length - 1; i >= 0; i--) {
    const tier = PLAN_TIERS[i];
    if (tier && estimatedConversations <= tier.conversations) {
      return tier;
    }
  }
  return PLAN_TIERS[PLAN_TIERS.length - 1]!;
}

export function ROICalculator() {
  const [monthlyVisitors, setMonthlyVisitors] = useState(50000);
  const [csTeamSize, setCsTeamSize] = useState(2);

  const calculations = useMemo(() => {
    // Estimate conversations
    const estimatedConversations = Math.round(
      monthlyVisitors * CHAT_ENGAGEMENT_RATE * CONVERSATION_COMPLETION_RATE
    );

    // Recommend plan
    const plan = recommendPlan(estimatedConversations);

    // Calculate costs
    const currentCost = csTeamSize * CS_REP_COST;
    const omniopsPrice = plan.price;

    // Handle overage if needed
    let totalOmniopsPrice = omniopsPrice;
    let overageConversations = 0;
    if (estimatedConversations > plan.conversations) {
      overageConversations = estimatedConversations - plan.conversations;
      totalOmniopsPrice += overageConversations * plan.overageRate;
    }

    // Calculate ROI
    const monthlySavings = currentCost - totalOmniopsPrice;
    const annualSavings = monthlySavings * 12;
    const roi = monthlySavings > 0 ? (monthlySavings / totalOmniopsPrice).toFixed(1) : '0';

    return {
      estimatedConversations,
      recommendedPlan: plan,
      currentCost,
      omniopsPrice: totalOmniopsPrice,
      monthlySavings,
      annualSavings,
      roi,
      overageConversations,
      savingsPercent: currentCost > 0 ? ((monthlySavings / currentCost) * 100).toFixed(0) : '0',
    };
  }, [monthlyVisitors, csTeamSize]);

  return (
    <section className="py-20 bg-white">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp className="h-6 w-6 text-green-600" />
            <h2 className="text-4xl font-bold text-slate-900">
              Calculate Your Savings
            </h2>
          </div>
          <p className="text-lg text-slate-600">
            See how much you'll save vs. hiring customer service reps
          </p>
        </div>

        {/* Calculator */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-8 border border-blue-200 mb-12">
          {/* Visitor input */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-slate-900">
                Monthly website visitors
              </label>
              <span className="text-3xl font-bold text-blue-600">
                {monthlyVisitors.toLocaleString()}
              </span>
            </div>
            <Slider
              value={[monthlyVisitors]}
              onValueChange={(value) => setMonthlyVisitors(value[0] ?? 50000)}
              min={5000}
              max={1000000}
              step={5000}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>5k</span>
              <span>1M+</span>
            </div>
          </div>

          {/* CS team size input */}
          <div className="mb-10">
            <div className="flex items-center justify-between mb-4">
              <label className="text-lg font-semibold text-slate-900">
                Current CS team size
              </label>
              <span className="text-3xl font-bold text-purple-600">
                {csTeamSize} reps
              </span>
            </div>
            <Slider
              value={[csTeamSize]}
              onValueChange={(value) => setCsTeamSize(value[0] ?? 2)}
              min={1}
              max={20}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-slate-600 mt-2">
              <span>1</span>
              <span>20+</span>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="space-y-8">
          {/* Plan recommendation */}
          <div className="p-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg border border-blue-200">
            <p className="text-sm text-slate-600 mb-1">Recommended Plan:</p>
            <div className="flex items-baseline justify-between">
              <h3 className="text-3xl font-bold text-slate-900">
                {calculations.recommendedPlan.name}
              </h3>
              <span className="text-2xl font-bold text-slate-900">
                £{Math.round(calculations.omniopsPrice)}/month
              </span>
            </div>
            <p className="text-slate-600 mt-2">
              Estimated conversations: <span className="font-semibold">{calculations.estimatedConversations.toLocaleString()}/month</span>
            </p>
            {calculations.overageConversations > 0 && (
              <p className="text-sm text-slate-600 mt-1">
                Includes {calculations.overageConversations.toLocaleString()} overage conversations at £{calculations.recommendedPlan.overageRate}/each
              </p>
            )}
          </div>

          {/* Cost comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-6 bg-slate-50 rounded-lg border border-slate-200">
              <p className="text-sm text-slate-600 mb-2">Current CS Team</p>
              <p className="text-3xl font-bold text-slate-900">
                £{calculations.currentCost.toLocaleString()}/month
              </p>
              <p className="text-xs text-slate-600 mt-2">
                {csTeamSize} reps × £{CS_REP_COST}/month
              </p>
            </div>

            <div className="p-6 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-slate-600 mb-2">Omniops Cost</p>
              <p className="text-3xl font-bold text-blue-600">
                £{Math.round(calculations.omniopsPrice).toLocaleString()}/month
              </p>
              <p className="text-xs text-slate-600 mt-2">
                {calculations.recommendedPlan.name}
              </p>
            </div>

            <div className="p-6 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 mb-2">Your Savings</p>
              <p className="text-3xl font-bold text-green-600">
                £{Math.round(calculations.monthlySavings).toLocaleString()}/month
              </p>
              <p className="text-xs text-slate-600 mt-2">
                {calculations.savingsPercent}% reduction
              </p>
            </div>
          </div>

          {/* ROI metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <p className="text-sm text-slate-600 mb-2">📈 Annual Savings</p>
              <p className="text-4xl font-bold text-green-600">
                £{Math.round(calculations.annualSavings).toLocaleString()}
              </p>
              <p className="text-xs text-slate-600 mt-2">
                That's like adding an extra {Math.round(calculations.annualSavings / (CS_REP_COST * 12))} full-time employees worth of value
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-200">
              <p className="text-sm text-slate-600 mb-2">🚀 ROI</p>
              <p className="text-4xl font-bold text-purple-600">
                {calculations.roi}x
              </p>
              <p className="text-xs text-slate-600 mt-2">
                Return on investment over 12 months
              </p>
            </div>
          </div>

          {/* Assumptions */}
          <div className="p-4 bg-slate-50 rounded border border-slate-200">
            <p className="text-xs font-semibold text-slate-600 mb-2">
              💡 Assumptions (based on industry averages):
            </p>
            <ul className="text-xs text-slate-600 space-y-1">
              <li>• UK CS rep average cost: £{CS_REP_COST}/month (salary + overhead)</li>
              <li>• Chat engagement rate: {(CHAT_ENGAGEMENT_RATE * 100).toFixed(0)}% of visitors use chat</li>
              <li>• Conversation completion: {(CONVERSATION_COMPLETION_RATE * 100).toFixed(0)}% of chats are completed</li>
            </ul>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Get My Custom Quote
              <ArrowRight className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
