"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

interface CurrentUsageAlertProps {
  planName: string;
  currentUsage: number;
  currentSeats: number;
}

export function CurrentUsageAlert({ planName, currentUsage, currentSeats }: CurrentUsageAlertProps) {
  const isAtLimit = currentUsage >= currentSeats;

  return (
    <Alert>
      <Info className="h-4 w-4" />
      <AlertDescription>
        <strong>Current Status:</strong> {planName} plan with {currentUsage}/{currentSeats} seats used.
        {isAtLimit && " You've reached your seat limit and cannot add more team members."}
      </AlertDescription>
    </Alert>
  );
}
