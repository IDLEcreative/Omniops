/**
 * Loading State Component
 *
 * Displays loading spinner while billing data is being fetched
 * Used by: app/dashboard/domains/[domainId]/billing/page.tsx
 */

export function LoadingState() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading billing information...</p>
      </div>
    </div>
  );
}
