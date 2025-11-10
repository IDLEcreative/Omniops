/**
 * Organization Overview Card Component
 *
 * Displays organization-level metrics (active domains, discount, total MRR)
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

interface OrganizationOverviewCardProps {
  organization: {
    activeDomainsCount: number;
    appliedDiscount: number;
    totalMRR: number;
  };
}

export function OrganizationOverviewCard({ organization }: OrganizationOverviewCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Organization Overview</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p className="text-sm text-gray-600">Active Domains</p>
          <p className="text-2xl font-bold text-gray-900">{organization.activeDomainsCount}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Multi-Domain Discount</p>
          <p className="text-2xl font-bold text-green-600">
            {(organization.appliedDiscount * 100).toFixed(0)}%
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Monthly Recurring Revenue</p>
          <p className="text-2xl font-bold text-gray-900">£{organization.totalMRR.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}
