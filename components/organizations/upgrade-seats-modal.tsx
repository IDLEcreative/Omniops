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
import { RadioGroup } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowRight, CreditCard } from "lucide-react";

import { UpgradeSeatsModalProps } from "./upgrade-seats/types";
import { pricingPlans } from "./upgrade-seats/pricing-plans";
import {
  getRecommendedPlan,
  getCurrentPlanDetails,
  canSelectPlan,
  processUpgrade
} from "./upgrade-seats/utils";
import { CurrentUsageAlert } from "./upgrade-seats/CurrentUsageAlert";
import { PlanCard } from "./upgrade-seats/PlanCard";
import { ComparisonTable } from "./upgrade-seats/ComparisonTable";

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
      await processUpgrade(organizationId, selectedPlan, onClose);
    } catch (err) {
      setError('Unable to process upgrade. Please try again or contact support.');
      console.error('Upgrade error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const recommendedPlan = getRecommendedPlan(currentPlan, currentUsage);
  const currentPlanDetails = getCurrentPlanDetails(currentPlan);

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
          <CurrentUsageAlert
            planName={currentPlanDetails.name}
            currentUsage={currentUsage}
            currentSeats={currentSeats}
          />

          <RadioGroup value={selectedPlan || ""} onValueChange={setSelectedPlan}>
            <div className="grid gap-4 md:grid-cols-3">
              {pricingPlans.map((plan) => {
                const isCurrentPlan = plan.id === currentPlan;
                const isRecommended = recommendedPlan && plan.id === recommendedPlan.id && !isCurrentPlan;
                const canSelect = canSelectPlan(plan, currentUsage);

                return (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    isSelected={selectedPlan === plan.id}
                    isCurrentPlan={isCurrentPlan}
                    isRecommended={!!isRecommended}
                    canSelect={canSelect}
                  />
                );
              })}
            </div>
          </RadioGroup>

          <ComparisonTable />

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
