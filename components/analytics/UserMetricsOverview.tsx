import { MetricCardWithGoal } from '@/components/dashboard/analytics/MetricCardWithGoal';
import { ComparisonIndicator } from '@/components/dashboard/analytics/ComparisonIndicator';
import { Users, TrendingUp, Clock, MousePointerClick, ShoppingCart, Target } from 'lucide-react';
import type { MetricGoal, MetricProgress, DashboardAnalyticsComparison } from '@/types/dashboard';
import { calculateMetricProgress } from '@/lib/analytics/calculate-metric-progress';

interface UserMetrics {
  dailyActiveUsers: number;
  totalUniqueUsers: number;
  growthRate: number;
  growthAbsolute: number;
}

interface SessionMetrics {
  avgDuration: number;
  medianDuration: number;
  totalSessions: number;
  bounceRate: number;
}

interface ShoppingBehavior {
  productViews: number;
  uniqueProducts: number;
  cartViews: number;
  checkoutViews: number;
  conversionRate: number;
  avgProductsPerSession: number;
}

interface UserMetricsOverviewProps {
  userMetrics: UserMetrics;
  sessionMetrics: SessionMetrics;
  shoppingBehavior: ShoppingBehavior;
  goals?: MetricGoal[];
  comparison?: DashboardAnalyticsComparison;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`;
}

export function UserMetricsOverview({
  userMetrics,
  sessionMetrics,
  shoppingBehavior,
  goals = [],
}: UserMetricsOverviewProps) {
  const growthDescription = userMetrics.growthRate > 0
    ? `+${userMetrics.growthAbsolute} users (${userMetrics.growthRate}%)`
    : userMetrics.growthRate < 0
    ? `${userMetrics.growthAbsolute} users (${userMetrics.growthRate}%)`
    : 'No change from last period';

  const dauProgress = calculateMetricProgress('daily_active_users', userMetrics.dailyActiveUsers, goals);
  const conversionProgress = calculateMetricProgress('conversion_rate', shoppingBehavior.conversionRate, goals);

  return (
    <div className="space-y-6">
      {/* User Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">User Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCardWithGoal
            title="Daily Active Users"
            value={userMetrics.dailyActiveUsers}
            icon={Users}
            description="Average DAU in period"
            trend={userMetrics.growthRate}
            progress={dauProgress || undefined}
          />

          <MetricCardWithGoal
            title="Total Unique Users"
            value={userMetrics.totalUniqueUsers}
            icon={Users}
            description={growthDescription}
            trend={userMetrics.growthRate}
          />

          <MetricCardWithGoal
            title="Avg Session Duration"
            value={formatDuration(sessionMetrics.avgDuration)}
            icon={Clock}
            description={`${sessionMetrics.totalSessions} total sessions`}
          />

          <MetricCardWithGoal
            title="Bounce Rate"
            value={`${sessionMetrics.bounceRate}%`}
            icon={MousePointerClick}
            description="Single page visits"
          />
        </div>
      </div>

      {/* Shopping Behavior */}
      {shoppingBehavior.productViews > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Shopping Behavior</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCardWithGoal
              title="Product Views"
              value={shoppingBehavior.productViews}
              icon={ShoppingCart}
              description={`${shoppingBehavior.uniqueProducts} unique products`}
            />

            <MetricCardWithGoal
              title="Cart Views"
              value={shoppingBehavior.cartViews}
              icon={ShoppingCart}
              description="Users viewing cart"
            />

            <MetricCardWithGoal
              title="Checkout Views"
              value={shoppingBehavior.checkoutViews}
              icon={Target}
              description="Reached checkout"
            />

            <MetricCardWithGoal
              title="Conversion Rate"
              value={`${shoppingBehavior.conversionRate}%`}
              icon={TrendingUp}
              description="Product → Checkout"
              progress={conversionProgress || undefined}
            />
          </div>
        </div>
      )}
    </div>
  );
}
