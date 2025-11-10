/**
 * Funnel Editor Component
 * Allows customization of conversion funnel stages
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import { FunnelPreview } from './FunnelPreview';

interface FunnelStage {
  id: string;
  name: string;
  order: number;
}

interface CustomFunnel {
  id?: string;
  name: string;
  stages: FunnelStage[];
  is_default?: boolean;
}

interface FunnelEditorProps {
  domainId?: string;
}

export function FunnelEditor({ domainId }: FunnelEditorProps) {
  const [funnel, setFunnel] = useState<CustomFunnel>({
    name: '',
    stages: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchFunnel();
  }, [domainId]);

  const fetchFunnel = async () => {
    try {
      setLoading(true);
      const url = domainId
        ? `/api/analytics/funnels?domainId=${domainId}`
        : '/api/analytics/funnels';

      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch funnel');

      const data = await response.json();
      setFunnel({
        id: data.id,
        name: data.name || 'Custom Funnel',
        stages: data.stages || [],
        is_default: data.is_default,
      });
    } catch (error) {
      console.error('Error fetching funnel:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStage = () => {
    const newStage: FunnelStage = {
      id: `stage-${Date.now()}`,
      name: '',
      order: funnel.stages.length + 1,
    };

    setFunnel({
      ...funnel,
      stages: [...funnel.stages, newStage],
    });
  };

  const handleRemoveStage = (index: number) => {
    const newStages = funnel.stages.filter((_, i) => i !== index);
    // Reorder stages
    const reorderedStages = newStages.map((stage, idx) => ({
      ...stage,
      order: idx + 1,
    }));

    setFunnel({
      ...funnel,
      stages: reorderedStages,
    });
  };

  const handleUpdateStageName = (index: number, name: string) => {
    const newStages = [...funnel.stages];
    newStages[index] = { ...newStages[index], name };

    setFunnel({
      ...funnel,
      stages: newStages,
    });
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === funnel.stages.length - 1)
    ) {
      return;
    }

    const newStages = [...funnel.stages];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    // Swap stages
    [newStages[index], newStages[targetIndex]] = [newStages[targetIndex], newStages[index]];

    // Update order
    newStages.forEach((stage, idx) => {
      stage.order = idx + 1;
    });

    setFunnel({
      ...funnel,
      stages: newStages,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate
      if (!funnel.name.trim()) {
        alert('Please enter a funnel name');
        return;
      }

      if (funnel.stages.length === 0) {
        alert('Please add at least one stage');
        return;
      }

      if (funnel.stages.some((s) => !s.name.trim())) {
        alert('All stages must have a name');
        return;
      }

      const response = await fetch('/api/analytics/funnels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: funnel.id,
          name: funnel.name,
          stages: funnel.stages,
          domainId,
          isDefault: false,
        }),
      });

      if (!response.ok) throw new Error('Failed to save funnel');

      const savedFunnel = await response.json();
      setFunnel(savedFunnel);

      alert('Funnel saved successfully!');
    } catch (error) {
      console.error('Error saving funnel:', error);
      alert('Failed to save funnel. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading funnel configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Customize Conversion Funnel</CardTitle>
          <CardDescription>
            Define the stages of your customer journey to track conversions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="funnel-name">Funnel Name</Label>
            <Input
              id="funnel-name"
              placeholder="e.g., Sales Funnel, Support Journey"
              value={funnel.name}
              onChange={(e) => setFunnel({ ...funnel, name: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Funnel Stages</Label>
              <Button variant="outline" size="sm" onClick={handleAddStage}>
                <Plus className="mr-2 h-4 w-4" />
                Add Stage
              </Button>
            </div>

            {funnel.stages.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
                No stages yet. Click "Add Stage" to get started.
              </div>
            ) : (
              <div className="space-y-2">
                {funnel.stages.map((stage, idx) => (
                  <div
                    key={stage.id}
                    className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30"
                  >
                    <div className="flex flex-col gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 p-0"
                        onClick={() => handleMoveStage(idx, 'up')}
                        disabled={idx === 0}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-4 p-0"
                        onClick={() => handleMoveStage(idx, 'down')}
                        disabled={idx === funnel.stages.length - 1}
                      >
                        <GripVertical className="h-4 w-4" />
                      </Button>
                    </div>

                    <Badge variant="outline" className="w-12 justify-center">
                      {idx + 1}
                    </Badge>

                    <Input
                      placeholder="Stage name"
                      value={stage.name}
                      onChange={(e) => handleUpdateStageName(idx, e.target.value)}
                      className="flex-1"
                    />

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveStage(idx)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={fetchFunnel}>
              Reset
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Saving...' : 'Save Funnel'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <FunnelPreview stages={funnel.stages} />
    </div>
  );
}
