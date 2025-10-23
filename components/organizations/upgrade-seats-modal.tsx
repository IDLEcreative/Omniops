"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Users, Check, X, TrendingUp, Crown, Sparkles, ArrowRight,
  CreditCard, Shield, Zap, Globe, HeadphonesIcon, Info
} from "lucide-react";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  priceDisplay: string;
  seats: number;
  seatsDisplay: string;
  features: string[];
  popular?: boolean;
  icon: React.ElementType;
  color: string;
}

interface UpgradeSeatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPlan: string;
  currentSeats: number;
  currentUsage: number;
  organizationId: string;
}

const pricingPlans: PricingPlan[] = [
  {
    id: "starter",
    name: "Starter",
    price: 49,
    priceDisplay: "$49/month",
    seats: 10,
    seatsDisplay: "Up to 10 team members",
    features: [
      "10 team seats",
      "Role-based permissions",
      "Email support",
      "API access",
      "30-day data retention",
      "Basic analytics"
    ],
    icon: TrendingUp,
    color: "bg-blue-500"
  },
  {
    id: "professional",
    name: "Professional",
    price: 149,
    priceDisplay: "$149/month",
    seats: 25,
    seatsDisplay: "Up to 25 team members",
    features: [
      "25 team seats",
      "Advanced permissions",
      "Priority email & chat support",
      "Advanced API access",
      "90-day data retention",
      "Advanced analytics & reports",
      "Custom integrations",
      "SSO authentication"
    ],
    popular: true,
    icon: Crown,
    color: "bg-purple-500"
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: -1,
    priceDisplay: "Custom",
    seats: -1,
    seatsDisplay: "Unlimited seats",
    features: [
      "Unlimited team seats",
      "Custom permissions",
      "24/7 dedicated support",
      "Full API access",
      "Unlimited data retention",
      "Custom analytics & BI",
      "White-label options",
      "SLA guarantee",
      "Dedicated account manager",
      "On-premise deployment option"
    ],
    icon: Sparkles,
    color: "bg-gradient-to-r from-purple-500 to-pink-500"
  }
];

export function UpgradeSeatsModal({
  isOpen,
  onClose,
  currentPlan,
  currentSeats,
  currentUsage,
  organizationId
}: UpgradeSeatsModalProps) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpgrade = async () => {
    if (!selectedPlan) return;

    setIsProcessing(true);
    setError(null);

    try {
      // TODO: Integrate with actual payment provider (Stripe, etc.)
      const response = await fetch(`/api/organizations/${organizationId}/upgrade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selectedPlan,
          seats: pricingPlans.find(p => p.id === selectedPlan)?.seats
        })
      });

      if (!response.ok) {
        throw new Error('Upgrade failed');
      }

      // Redirect to payment page or show success
      if (selectedPlan === 'enterprise') {
        // For enterprise, redirect to contact form
        window.location.href = '/contact?type=enterprise';
      } else {
        // For other plans, redirect to payment
        const data = await response.json();
        if (data.checkout_url) {
          window.location.href = data.checkout_url;
        } else {
          // Show success message
          onClose();
          window.location.reload(); // Refresh to show new limits
        }
      }
    } catch (err) {
      setError('Unable to process upgrade. Please try again or contact support.');
      console.error('Upgrade error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const recommendedPlan = pricingPlans.find(plan =>
    plan.seats > currentUsage && plan.id !== currentPlan
  ) || pricingPlans[pricingPlans.length - 1];

  const currentPlanDetails = pricingPlans.find(p => p.id === currentPlan) || {
    name: "Free",
    seats: 5,
    seatsDisplay: "Up to 5 team members"
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Upgrade Your Team Plan</DialogTitle>
          <DialogDescription>
            You're currently using {currentUsage} of {currentSeats} available seats.
            Choose a plan that fits your growing team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Usage Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Current Status:</strong> {currentPlanDetails.name} plan with {currentUsage}/{currentSeats} seats used.
              {currentUsage >= currentSeats && " You've reached your seat limit and cannot add more team members."}
            </AlertDescription>
          </Alert>

          {/* Pricing Plans */}
          <RadioGroup value={selectedPlan || ""} onValueChange={setSelectedPlan}>
            <div className="grid gap-4 md:grid-cols-3">
              {pricingPlans.map((plan) => {
                const PlanIcon = plan.icon;
                const isCurrentPlan = plan.id === currentPlan;
                const isRecommended = recommendedPlan && plan.id === recommendedPlan.id && !isCurrentPlan;
                const canSelect = plan.seats === -1 || plan.seats > currentUsage;

                return (
                  <Card
                    key={plan.id}
                    className={`relative cursor-pointer transition-all ${
                      selectedPlan === plan.id ? 'ring-2 ring-primary' : ''
                    } ${!canSelect ? 'opacity-50' : 'hover:shadow-lg'}`}
                  >
                    <Label htmlFor={plan.id} className="cursor-pointer">
                      <RadioGroupItem
                        value={plan.id}
                        id={plan.id}
                        className="sr-only"
                        disabled={!canSelect || isCurrentPlan}
                      />

                      {(isRecommended || plan.popular) && (
                        <Badge className="absolute -top-2 -right-2 z-10">
                          {isRecommended ? 'Recommended' : 'Popular'}
                        </Badge>
                      )}

                      {isCurrentPlan && (
                        <Badge variant="secondary" className="absolute -top-2 -left-2 z-10">
                          Current Plan
                        </Badge>
                      )}

                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg ${plan.color} bg-opacity-10`}>
                            <PlanIcon className={`h-5 w-5 ${plan.color.replace('bg-', 'text-')}`} />
                          </div>
                          {selectedPlan === plan.id && (
                            <Check className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <CardTitle className="mt-2">{plan.name}</CardTitle>
                        <div className="mt-2">
                          <span className="text-3xl font-bold">{plan.priceDisplay}</span>
                          {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
                        </div>
                        <CardDescription className="mt-1">{plan.seatsDisplay}</CardDescription>
                      </CardHeader>

                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {plan.features.slice(0, 6).map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                          {plan.features.length > 6 && (
                            <li className="text-muted-foreground text-xs">
                              +{plan.features.length - 6} more features
                            </li>
                          )}
                        </ul>

                        {!canSelect && !isCurrentPlan && (
                          <Alert className="mt-3">
                            <AlertDescription className="text-xs">
                              This plan doesn't have enough seats for your current team size.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Label>
                  </Card>
                );
              })}
            </div>
          </RadioGroup>

          {/* Comparison Table (Optional - for detailed view) */}
          <details className="cursor-pointer">
            <summary className="text-sm text-muted-foreground hover:text-foreground">
              View detailed feature comparison
            </summary>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Feature</th>
                    {pricingPlans.map(plan => (
                      <th key={plan.id} className="text-center p-2">{plan.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { feature: "Team Seats", values: pricingPlans.map(p => p.seatsDisplay) },
                    { feature: "Support", values: ["Email", "Priority", "24/7 Dedicated"] },
                    { feature: "Data Retention", values: ["30 days", "90 days", "Unlimited"] },
                    { feature: "SSO", values: [false, true, true] },
                    { feature: "Custom Integrations", values: [false, true, true] },
                    { feature: "SLA", values: [false, false, true] },
                  ].map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2 font-medium">{row.feature}</td>
                      {row.values.map((value, i) => (
                        <td key={i} className="text-center p-2">
                          {typeof value === 'boolean' ? (
                            value ? <Check className="h-4 w-4 text-green-500 mx-auto" />
                                  : <X className="h-4 w-4 text-gray-400 mx-auto" />
                          ) : value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button
            onClick={handleUpgrade}
            disabled={!selectedPlan || isProcessing}
            className="sm:ml-auto"
          >
            {isProcessing ? (
              <>Processing...</>
            ) : selectedPlan === 'enterprise' ? (
              <>Contact Sales <ArrowRight className="h-4 w-4 ml-2" /></>
            ) : (
              <>Continue to Payment <CreditCard className="h-4 w-4 ml-2" /></>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}