import { useState, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface IconUploadManagerProps {
  minimizedIconUrl: string;
  minimizedIconHoverUrl: string;
  minimizedIconActiveUrl: string;
  onChange: (updates: {
    minimizedIconUrl?: string;
    minimizedIconHoverUrl?: string;
    minimizedIconActiveUrl?: string;
  }) => void;
  customerConfigId?: string;
}

type IconType = 'normal' | 'hover' | 'active';

export function IconUploadManager({
  minimizedIconUrl,
  minimizedIconHoverUrl,
  minimizedIconActiveUrl,
  onChange,
  customerConfigId
}: IconUploadManagerProps) {
  const [isUploadingIcon, setIsUploadingIcon] = useState(false);
  const [isUploadingHoverIcon, setIsUploadingHoverIcon] = useState(false);
  const [isUploadingActiveIcon, setIsUploadingActiveIcon] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hoverFileInputRef = useRef<HTMLInputElement>(null);
  const activeFileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleIconUpload = async (file: File, iconType: IconType = 'normal') => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    if (iconType === 'hover') {
      setIsUploadingHoverIcon(true);
    } else if (iconType === 'active') {
      setIsUploadingActiveIcon(true);
    } else {
      setIsUploadingIcon(true);
    }

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', `minimized-icon-${iconType}`);

      if (!customerConfigId) {
        toast({
          title: "Configuration error",
          description: "Please select a website configuration first",
          variant: "destructive",
        });
        return;
      }

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
      if (iconType === 'hover') {
        setIsUploadingHoverIcon(false);
        if (hoverFileInputRef.current) hoverFileInputRef.current.value = '';
      } else if (iconType === 'active') {
        setIsUploadingActiveIcon(false);
        if (activeFileInputRef.current) activeFileInputRef.current.value = '';
      } else {
        setIsUploadingIcon(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Normal State */}
      <div className="space-y-2">
        <Label>Minimized Widget Icon - Normal State (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Custom icon shown when widget is minimized. Defaults to message bubble if not set.
        </p>
        <div className="flex items-center space-x-3">
          <Input
            type="url"
            value={minimizedIconUrl}
            onChange={(e) => onChange({ minimizedIconUrl: e.target.value })}
            placeholder="https://example.com/icon.png or upload file"
            className="flex-1"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleIconUpload(file, 'normal');
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingIcon}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingIcon ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Hover State */}
      <div className="space-y-2 pl-4 border-l-2 border-blue-200">
        <Label>Hover State Icon (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Icon shown when user hovers over the widget button. Falls back to normal state if not set.
        </p>
        <div className="flex items-center space-x-3">
          <Input
            type="url"
            value={minimizedIconHoverUrl}
            onChange={(e) => onChange({ minimizedIconHoverUrl: e.target.value })}
            placeholder="https://example.com/icon-hover.png or upload file"
            className="flex-1"
          />
          <input
            ref={hoverFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleIconUpload(file, 'hover');
            }}
          />
          <button
            onClick={() => hoverFileInputRef.current?.click()}
            disabled={isUploadingHoverIcon}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingHoverIcon ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active State */}
      <div className="space-y-2 pl-4 border-l-2 border-green-200">
        <Label>Active/Clicked State Icon (Optional)</Label>
        <p className="text-xs text-muted-foreground mb-2">
          Icon shown when user clicks the widget button. Falls back to normal state if not set.
        </p>
        <div className="flex items-center space-x-3">
          <Input
            type="url"
            value={minimizedIconActiveUrl}
            onChange={(e) => onChange({ minimizedIconActiveUrl: e.target.value })}
            placeholder="https://example.com/icon-active.png or upload file"
            className="flex-1"
          />
          <input
            ref={activeFileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleIconUpload(file, 'active');
            }}
          />
          <button
            onClick={() => activeFileInputRef.current?.click()}
            disabled={isUploadingActiveIcon}
            className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploadingActiveIcon ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preview */}
      {(minimizedIconUrl || minimizedIconHoverUrl || minimizedIconActiveUrl) && (
        <div className="mt-2 p-4 border rounded-lg bg-gray-50">
          <p className="text-xs text-muted-foreground mb-3 font-medium">Icon State Previews:</p>
          <div className="flex items-start space-x-6">
            {minimizedIconUrl && (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                  <img
                    src={minimizedIconUrl}
                    alt="Normal state preview"
                    className="w-6 h-6 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <span className="text-xs text-gray-600">Normal</span>
                <button
                  onClick={() => onChange({ minimizedIconUrl: '' })}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            {minimizedIconHoverUrl && (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
                  <img
                    src={minimizedIconHoverUrl}
                    alt="Hover state preview"
                    className="w-6 h-6 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <span className="text-xs text-blue-600">Hover</span>
                <button
                  onClick={() => onChange({ minimizedIconHoverUrl: '' })}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
            {minimizedIconActiveUrl && (
              <div className="flex flex-col items-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-600 to-green-700 flex items-center justify-center">
                  <img
                    src={minimizedIconActiveUrl}
                    alt="Active state preview"
                    className="w-6 h-6 object-contain"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
                <span className="text-xs text-green-600">Active</span>
                <button
                  onClick={() => onChange({ minimizedIconActiveUrl: '' })}
                  className="text-xs text-red-600 hover:text-red-700"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
