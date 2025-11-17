import { useState, useEffect, useCallback } from 'react';
import type { MetricGoal, MetricGoalInput } from '@/types/dashboard';

interface UseMetricGoalsReturn {
  goals: MetricGoal[];
  loading: boolean;
  error: Error | null;
  createGoal: (input: MetricGoalInput) => Promise<MetricGoal | null>;
  updateGoal: (id: string, updates: Partial<MetricGoalInput>) => Promise<MetricGoal | null>;
  deleteGoal: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
}

export function useMetricGoals(): UseMetricGoalsReturn {
  const [goals, setGoals] = useState<MetricGoal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/analytics/goals');

      if (!response.ok) {
        throw new Error(`Failed to fetch goals: ${response.statusText}`);
      }

      const data = await response.json();
      setGoals(data.goals || []);
    } catch (err) {
      console.error('Error fetching metric goals:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const createGoal = useCallback(async (input: MetricGoalInput): Promise<MetricGoal | null> => {
    try {
      const response = await fetch('/api/analytics/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create goal');
      }

      const { goal } = await response.json();
      setGoals(prev => [goal, ...prev]);
      return goal;
    } catch (err) {
      console.error('Error creating goal:', err);
      setError(err instanceof Error ? err : new Error('Failed to create goal'));
      return null;
    }
  }, []);

  const updateGoal = useCallback(async (
    id: string,
    updates: Partial<MetricGoalInput>
  ): Promise<MetricGoal | null> => {
    try {
      const response = await fetch('/api/analytics/goals', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update goal');
      }

      const { goal } = await response.json();
      setGoals(prev => prev.map(g => g.id === id ? goal : g));
      return goal;
    } catch (err) {
      console.error('Error updating goal:', err);
      setError(err instanceof Error ? err : new Error('Failed to update goal'));
      return null;
    }
  }, []);

  const deleteGoal = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/analytics/goals?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete goal');
      }

      setGoals(prev => prev.filter(g => g.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError(err instanceof Error ? err : new Error('Failed to delete goal'));
      return false;
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchGoals();
  }, [fetchGoals]);

  return {
    goals,
    loading,
    error,
    createGoal,
    updateGoal,
    deleteGoal,
    refresh,
  };
}
