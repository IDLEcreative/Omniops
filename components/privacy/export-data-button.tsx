'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface ExportDataButtonProps {
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function ExportDataButton({
  className,
  variant = 'default',
  size = 'default'
}: ExportDataButtonProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setLoading(true);

    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Get the current user's domain/session from context
          // This would typically come from a user context or auth provider
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Export failed');
      }

      // Handle the response based on content type
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/zip') || contentType?.includes('application/json')) {
        // Download the file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `omniops-data-export-${Date.now()}.${contentType.includes('zip') ? 'zip' : 'json'}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        toast({
          title: 'Export successful',
          description: 'Your data has been downloaded successfully.',
        });
      } else {
        throw new Error('Unexpected response format');
      }
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: 'Export failed',
        description: error instanceof Error ? error.message : 'Failed to export data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleExport}
      disabled={loading}
      className={className}
      variant={variant}
      size={size}
    >
      <Download className="h-4 w-4 mr-2" />
      {loading ? 'Exporting...' : 'Download My Data'}
    </Button>
  );
}