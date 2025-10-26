"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check } from "lucide-react";
import { PricingPlan } from "./types";

interface PlanCardProps {
  plan: PricingPlan;
  isSelected: boolean;
  isCurrentPlan: boolean;
  isRecommended: boolean;
  canSelect: boolean;
}

export function PlanCard({
  plan,
  isSelected,
  isCurrentPlan,
  isRecommended,
  canSelect
}: PlanCardProps) {
  const PlanIcon = plan.icon;

  return (
    <Card
      className={`relative cursor-pointer transition-all ${
        isSelected ? 'ring-2 ring-primary' : ''
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
            {isSelected && (
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
}
