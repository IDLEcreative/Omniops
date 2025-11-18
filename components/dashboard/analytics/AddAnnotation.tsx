'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import type { CreateAnnotationInput, AnnotationCategory, ChartAnnotation } from '@/types/dashboard';

interface AddAnnotationProps {
  onAdd: (input: CreateAnnotationInput) => Promise<ChartAnnotation>;
  defaultDate?: string;
  minDate?: string;
  maxDate?: string;
}

const CATEGORY_OPTIONS: { value: AnnotationCategory; label: string; color: string }[] = [
  { value: 'campaign', label: '🚀 Campaign', color: '#10b981' },
  { value: 'incident', label: '⚠️ Incident', color: '#ef4444' },
  { value: 'release', label: '📦 Release', color: '#8b5cf6' },
  { value: 'event', label: '📅 Event', color: '#3b82f6' },
  { value: 'other', label: 'ℹ️ Other', color: '#6b7280' },
];

export function AddAnnotation({ onAdd, defaultDate, minDate, maxDate }: AddAnnotationProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateAnnotationInput>({
    annotation_date: (defaultDate ?? new Date().toISOString().split('T')[0]) as string,
    title: '',
    description: '',
    category: 'other',
    color: '#3b82f6',
  });

  const handleCategoryChange = (category: AnnotationCategory) => {
    const option = CATEGORY_OPTIONS.find((opt) => opt.value === category);
    setFormData((prev) => ({
      ...prev,
      category,
      color: option?.color || prev.color,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      return;
    }

    try {
      setLoading(true);
      await onAdd(formData);

      // Reset form and close dialog
      setFormData({
        annotation_date: (defaultDate ?? new Date().toISOString().split('T')[0]) as string,
        title: '',
        description: '',
        category: 'other',
        color: '#3b82f6',
      });
      setOpen(false);
    } catch (error) {
      console.error('Failed to add annotation:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Note
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Chart Annotation</DialogTitle>
            <DialogDescription>
              Add business context to your analytics charts. This note will appear as a marker on
              the selected date.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.annotation_date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, annotation_date: e.target.value }))
                }
                min={minDate}
                max={maxDate}
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleCategoryChange(value as AnnotationCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: option.color }}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="e.g., Black Friday Sale Launch"
                value={formData.title}
                onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                maxLength={200}
                required
              />
              <p className="text-xs text-muted-foreground">{formData.title.length}/200</p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                placeholder="Add details about this event..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                maxLength={1000}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {formData.description?.length || 0}/1000
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                  placeholder="#3b82f6"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.title.trim()}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Annotation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
