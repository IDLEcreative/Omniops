import { PricingPlan } from "./types";
import { pricingPlans } from "./pricing-plans";

export function getRecommendedPlan(currentPlan: string, currentUsage: number): PricingPlan | undefined {
  return pricingPlans.find(plan =>
    plan.seats > currentUsage && plan.id !== currentPlan
  ) || pricingPlans[pricingPlans.length - 1];
}

export function getCurrentPlanDetails(currentPlan: string) {
  return pricingPlans.find(p => p.id === currentPlan) || {
    name: "Free",
    seats: 5,
    seatsDisplay: "Up to 5 team members"
  };
}

export function canSelectPlan(plan: PricingPlan, currentUsage: number): boolean {
  return plan.seats === -1 || plan.seats > currentUsage;
}

export async function processUpgrade(
  organizationId: string,
  selectedPlan: string,
  onClose: () => void
): Promise<void> {
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
}
