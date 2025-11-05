"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Users, UserPlus, AlertTriangle, TrendingUp, Crown, Sparkles, Info
} from "lucide-react";

interface SeatUsage {
  used: number;
  pending: number;
  total: number;
  limit: number;
  available: number;
  plan_type?: string;
}

interface SeatUsageIndicatorProps {
  organizationId: string;
  onUpgrade?: () => void;
  showDetails?: boolean;
  compact?: boolean;
}

const planConfigs = {
  free: {
    name: "Free",
    color: "bg-gray-500",
    badgeVariant: "secondary" as const,
    icon: Users,
    defaultLimit: 5
  },
  starter: {
    name: "Starter",
    color: "bg-blue-500",
    badgeVariant: "default" as const,
    icon: TrendingUp,
    defaultLimit: 10
  },
  professional: {
    name: "Professional",
    color: "bg-purple-500",
    badgeVariant: "default" as const,
    icon: Crown,
    defaultLimit: 25
  },
  enterprise: {
    name: "Enterprise",
    color: "bg-gradient-to-r from-purple-500 to-pink-500",
    badgeVariant: "default" as const,
    icon: Sparkles,
    defaultLimit: -1 // Unlimited
  }
};

export function SeatUsageIndicator({
  organizationId,
  onUpgrade,
  showDetails = true,
  compact = false
}: SeatUsageIndicatorProps) {
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeatUsage = useCallback(async () => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/invitations`);
      if (!response.ok) throw new Error('Failed to fetch seat usage');

      const data = await response.json();
      setSeatUsage(data.seat_usage);
      setError(null);
    } catch (err) {
      setError('Unable to load seat information');
      console.error('Error fetching seat usage:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    fetchSeatUsage();
    // Refresh every 30 seconds to keep data current
    const interval = setInterval(fetchSeatUsage, 30000);
    return () => clearInterval(interval);
  }, [fetchSeatUsage]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-muted rounded"></div>
      </div>
    );
  }

  if (error || !seatUsage) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error || 'Unable to load seat usage'}</AlertDescription>
      </Alert>
    );
  }

  const planConfig = planConfigs[seatUsage.plan_type as keyof typeof planConfigs] || planConfigs.free;
  const PlanIcon = planConfig.icon;
  const usagePercentage = seatUsage.limit > 0 ? (seatUsage.total / seatUsage.limit) * 100 : 0;
  const isNearLimit = usagePercentage >= 80;
  const isAtLimit = seatUsage.available === 0;
  const isUnlimited = seatUsage.limit === -1;

  // Compact view for header/sidebar
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium">
            {isUnlimited ? seatUsage.used : `${seatUsage.used}/${seatUsage.limit}`}
          </span>
          <span className="text-xs text-muted-foreground">seats</span>
          {seatUsage.pending > 0 && (
            <Badge variant="outline" className="ml-1 text-xs">
              +{seatUsage.pending} pending
            </Badge>
          )}
        </div>
        {isAtLimit && !isUnlimited && (
          <Badge variant="destructive" className="text-xs">Full</Badge>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Team Seats</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={planConfig.badgeVariant}>
              <PlanIcon className="h-3 w-3 mr-1" />
              {planConfig.name}
            </Badge>
            {isAtLimit && !isUnlimited && (
              <Badge variant="destructive">Limit Reached</Badge>
            )}
          </div>
        </div>
        <CardDescription>
          Manage your team's access and seat allocation
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Summary */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Seat Usage</span>
            <span className="font-medium">
              {isUnlimited ? (
                <span>{seatUsage.used} active members</span>
              ) : (
                <span>{seatUsage.used} of {seatUsage.limit} seats</span>
              )}
            </span>
          </div>

          {!isUnlimited && (
            <>
              <Progress
                value={usagePercentage}
                className={`h-2 ${isAtLimit ? 'bg-red-100' : isNearLimit ? 'bg-orange-100' : ''}`}
              />

              {seatUsage.pending > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{seatUsage.pending} pending invitations</span>
                  <span>{seatUsage.available} seats available</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-4 pt-2 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Active Members</p>
              <p className="text-2xl font-bold">{seatUsage.used}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending Invites</p>
              <p className="text-2xl font-bold">{seatUsage.pending}</p>
            </div>
          </div>
        )}

        {/* Warning/Action Messages */}
        {isAtLimit && !isUnlimited && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Seat Limit Reached</AlertTitle>
            <AlertDescription>
              You've reached your plan's limit of {seatUsage.limit} team members.
              Upgrade to add more team members.
            </AlertDescription>
          </Alert>
        )}

        {isNearLimit && !isAtLimit && !isUnlimited && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Approaching Seat Limit</AlertTitle>
            <AlertDescription>
              You're using {Math.round(usagePercentage)}% of your available seats.
              Consider upgrading soon to avoid interruptions.
            </AlertDescription>
          </Alert>
        )}

        {/* Upgrade CTA */}
        {!isUnlimited && (isNearLimit || isAtLimit) && onUpgrade && (
          <div className="pt-2">
            <Button
              onClick={onUpgrade}
              className="w-full"
              variant={isAtLimit ? "default" : "outline"}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isAtLimit ? 'Upgrade to Add More Seats' : 'View Upgrade Options'}
            </Button>
          </div>
        )}

        {/* Plan Benefits */}
        {showDetails && !isUnlimited && (
          <div className="text-xs text-muted-foreground pt-2 border-t">
            <p>Your {planConfig.name} plan includes:</p>
            <ul className="mt-1 space-y-1">
              <li>• Up to {seatUsage.limit} team members</li>
              <li>• Role-based permissions (Owner, Admin, Member, Viewer)</li>
              <li>• Unlimited invitations within seat limit</li>
              {seatUsage.plan_type === 'enterprise' && (
                <li>• Priority support and custom integrations</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Minimal inline version for use in headers
export function SeatUsageBadge({ organizationId }: { organizationId: string }) {
  const [seatUsage, setSeatUsage] = useState<SeatUsage | null>(null);

  useEffect(() => {
    fetch(`/api/organizations/${organizationId}/invitations`)
      .then(res => res.json())
      .then(data => setSeatUsage(data.seat_usage))
      .catch(console.error);
  }, [organizationId]);

  if (!seatUsage) return null;

  const isAtLimit = seatUsage.available === 0 && seatUsage.limit !== -1;
  const isUnlimited = seatUsage.limit === -1;

  return (
    <Badge variant={isAtLimit ? "destructive" : "outline"} className="font-normal">
      <Users className="h-3 w-3 mr-1" />
      {isUnlimited ? (
        <span>{seatUsage.used} seats</span>
      ) : (
        <span>{seatUsage.used}/{seatUsage.limit} seats</span>
      )}
      {seatUsage.pending > 0 && (
        <span className="ml-1 opacity-70">(+{seatUsage.pending})</span>
      )}
    </Badge>
  );
}