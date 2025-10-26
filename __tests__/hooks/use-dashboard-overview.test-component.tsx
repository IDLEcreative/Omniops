import { useDashboardOverview } from '@/hooks/use-dashboard-overview';

export function TestComponent({ days = 7, disabled = false }: { days?: number; disabled?: boolean }) {
  const { data, loading, error, refresh } = useDashboardOverview({ days, disabled });

  return (
    <div>
      <span data-testid="loading">{loading ? 'loading' : 'idle'}</span>
      <span data-testid="conversations">{data?.summary.totalConversations ?? 'none'}</span>
      <span data-testid="satisfaction">{data?.summary.satisfactionScore ?? 'none'}</span>
      <span data-testid="error">{error?.message ?? ''}</span>
      <button type="button" data-testid="refresh" onClick={() => refresh()}>
        Refresh
      </button>
    </div>
  );
}
