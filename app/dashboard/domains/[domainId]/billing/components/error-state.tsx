/**
 * Error State Component
 *
 * Displays error message when billing data fails to load
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

interface ErrorStateProps {
  error: string | null;
}

export function ErrorState({ error }: ErrorStateProps) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
        <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Billing Data</h2>
        <p className="text-red-700">{error || 'Unable to load billing information'}</p>
      </div>
    </div>
  );
}
