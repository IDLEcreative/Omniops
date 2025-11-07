/**
 * Custom hook for icon upload functionality
 */

import { useState, useRef } from 'react';
import { useToast } from "@/components/ui/use-toast";

export type IconType = 'normal' | 'hover' | 'active';

export interface UseIconUploadOptions {
  customerConfigId?: string;
  onChange: (updates: {
    minimizedIconUrl?: string;
    minimizedIconHoverUrl?: string;
    minimizedIconActiveUrl?: string;
  }) => void;
}

export function useIconUpload({ customerConfigId, onChange }: UseIconUploadOptions) {
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingHoverIcon, setIsUploadingHoverIcon] = useState(false);
  const [isUploadingActiveIcon, setIsUploadingActiveIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hoverFileInputRef = useRef<HTMLInputElement>(null);
  const activeFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const validateFile = (file: File): string | null => {
    if (!file.type.startsWith('image/')) {
      return "Please select an image file";
    }

    if (file.size > 2 * 1024 * 1024) {
      return "Please select an image smaller than 2MB";
    }

    return null;
  };

  const setLoadingState = (iconType: IconType, isLoading: boolean) => {
    if (iconType === 'hover') {
      setIsUploadingHoverIcon(isLoading);
    } else if (iconType === 'active') {
      setIsUploadingActiveIcon(isLoading);
    } else {
      setIsUploadingIcon(isLoading);
    }
  };

  const clearFileInput = (iconType: IconType) => {
    if (iconType === 'hover') {
      if (hoverFileInputRef.current) hoverFileInputRef.current.value = '';
    } else if (iconType === 'active') {
      if (activeFileInputRef.current) activeFileInputRef.current.value = '';
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleIconUpload = async (file: File, iconType: IconType = 'normal') => {
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast({
        title: "Invalid file",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    if (!customerConfigId) {
      toast({
        title: "Configuration error",
        description: "Please select a website configuration first",
        variant: "destructive",
      });
      return;
    }

    setLoadingState(iconType, true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `minimized-icon-${iconType}`);
      formData.append('customerConfigId', customerConfigId);

      const response = await fetch('/api/widget-assets/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const iconUrl = data.data.webpUrl || data.data.pngUrl || data.data.url;

        if (iconType === 'hover') {
          onChange({ minimizedIconHoverUrl: iconUrl });
        } else if (iconType === 'active') {
          onChange({ minimizedIconActiveUrl: iconUrl });
        } else {
          onChange({ minimizedIconUrl: iconUrl });
        }

        const compressionPercent = data.data.originalSize && data.data.optimizedSize?.webp
          ? Math.round((1 - data.data.optimizedSize.webp / data.data.originalSize) * 100)
          : 0;

        const sizeInfo = compressionPercent > 0 ? ` (${compressionPercent}% smaller)` : '';
        const iconLabel = iconType === 'hover' ? 'hover' : iconType === 'active' ? 'active' : 'minimized widget';

        toast({
          title: "Icon uploaded",
          description: `Your ${iconLabel} icon has been uploaded and optimized${sizeInfo}`,
        });
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload icon. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingState(iconType, false);
      clearFileInput(iconType);
    }
  };

  return {
    isUploadingIcon,
    isUploadingHoverIcon,
    isUploadingActiveIcon,
    fileInputRef,
    hoverFileInputRef,
    activeFileInputRef,
    handleIconUpload,
  };
}
