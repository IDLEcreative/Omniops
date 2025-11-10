import { MetricCard } from './MetricCard';
import { Users, TrendingUp, Clock, MousePointerClick, ShoppingCart, Target } from 'lucide-react';

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
  shoppingBehavior
}: UserMetricsOverviewProps) {
  const growthDescription = userMetrics.growthRate > 0
    ? `+${userMetrics.growthAbsolute} users (${userMetrics.growthRate}%)`
    : userMetrics.growthRate < 0
    ? `${userMetrics.growthAbsolute} users (${userMetrics.growthRate}%)`
    : 'No change from last period';

  return (
    <div className="space-y-6">
      {/* User Metrics */}
      <div>
        <h3 className="text-lg font-semibold mb-4">User Metrics</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Daily Active Users"
            value={userMetrics.dailyActiveUsers}
            icon={Users}
            description="Average DAU in period"
            trend={userMetrics.growthRate}
          />

          <MetricCard
            title="Total Unique Users"
            value={userMetrics.totalUniqueUsers}
            icon={Users}
            description={growthDescription}
            trend={userMetrics.growthRate}
          />

          <MetricCard
            title="Avg Session Duration"
            value={formatDuration(sessionMetrics.avgDuration)}
            icon={Clock}
            description={`${sessionMetrics.totalSessions} total sessions`}
          />

          <MetricCard
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
            <MetricCard
              title="Product Views"
              value={shoppingBehavior.productViews}
              icon={ShoppingCart}
              description={`${shoppingBehavior.uniqueProducts} unique products`}
            />

            <MetricCard
              title="Cart Views"
              value={shoppingBehavior.cartViews}
              icon={ShoppingCart}
              description="Users viewing cart"
            />

            <MetricCard
              title="Checkout Views"
              value={shoppingBehavior.checkoutViews}
              icon={Target}
              description="Reached checkout"
            />

            <MetricCard
              title="Conversion Rate"
              value={`${shoppingBehavior.conversionRate}%`}
              icon={TrendingUp}
              description="Product → Checkout"
            />
          </div>
        </div>
      )}
    </div>
  );
}
