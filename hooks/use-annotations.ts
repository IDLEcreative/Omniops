import { useState, useEffect, useCallback } from 'react';
import type { ChartAnnotation, CreateAnnotationInput, UpdateAnnotationInput } from '@/types/dashboard';

interface UseAnnotationsOptions {
  organizationId: string;
  startDate?: string;
  endDate?: string;
  enabled?: boolean;
}

interface UseAnnotationsReturn {
  annotations: ChartAnnotation[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  createAnnotation: (input: CreateAnnotationInput) => Promise<ChartAnnotation>;
  updateAnnotation: (id: string, input: UpdateAnnotationInput) => Promise<ChartAnnotation>;
  deleteAnnotation: (id: string) => Promise<void>;
}

export function useAnnotations({
  organizationId,
  startDate,
  endDate,
  enabled = true,
}: UseAnnotationsOptions): UseAnnotationsReturn {
  const [annotations, setAnnotations] = useState<ChartAnnotation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAnnotations = useCallback(async () => {
    if (!enabled || !organizationId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        organization_id: organizationId,
      });

      if (startDate) {
        params.append('start_date', startDate);
      }
      if (endDate) {
        params.append('end_date', endDate);
      }

      const response = await fetch(`/api/analytics/annotations?${params.toString()}`);

      if (!response.ok) {
        throw new Error('Failed to fetch annotations');
      }

      const data = await response.json();
      setAnnotations(data.annotations || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  }, [organizationId, startDate, endDate, enabled]);

  const createAnnotation = useCallback(
    async (input: CreateAnnotationInput): Promise<ChartAnnotation> => {
      const response = await fetch('/api/analytics/annotations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...input,
          organization_id: organizationId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create annotation');
      }

      const data = await response.json();
      const newAnnotation = data.annotation;

      // Update local state
      setAnnotations((prev) => [...prev, newAnnotation]);

      return newAnnotation;
    },
    [organizationId]
  );

  const updateAnnotation = useCallback(
    async (id: string, input: UpdateAnnotationInput): Promise<ChartAnnotation> => {
      const response = await fetch('/api/analytics/annotations', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...input }),
      });

      if (!response.ok) {
        throw new Error('Failed to update annotation');
      }

      const data = await response.json();
      const updatedAnnotation = data.annotation;

      // Update local state
      setAnnotations((prev) =>
        prev.map((ann) => (ann.id === id ? updatedAnnotation : ann))
      );

      return updatedAnnotation;
    },
    []
  );

  const deleteAnnotation = useCallback(async (id: string): Promise<void> => {
    const response = await fetch(`/api/analytics/annotations?id=${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Failed to delete annotation');
    }

    // Update local state
    setAnnotations((prev) => prev.filter((ann) => ann.id !== id));
  }, []);

  useEffect(() => {
    fetchAnnotations();
  }, [fetchAnnotations]);

  return {
    annotations,
    loading,
    error,
    refresh: fetchAnnotations,
    createAnnotation,
    updateAnnotation,
    deleteAnnotation,
  };
}
