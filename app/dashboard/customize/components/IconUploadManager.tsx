/**
 * Icon Upload Manager Component
 */

import { useIconUpload } from '../hooks/useIconUpload';
import { IconUploadSection } from './IconUploadSection';
import { IconPreview } from './IconPreview';

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

export function IconUploadManager({
  minimizedIconUrl,
  minimizedIconHoverUrl,
  minimizedIconActiveUrl,
  onChange,
  customerConfigId
}: IconUploadManagerProps) {
  const {
    isUploadingIcon,
    isUploadingHoverIcon,
    isUploadingActiveIcon,
    fileInputRef,
    hoverFileInputRef,
    activeFileInputRef,
    handleIconUpload,
  } = useIconUpload({ customerConfigId, onChange });

  const handleRemove = (type: 'normal' | 'hover' | 'active') => {
    if (type === 'hover') {
      onChange({ minimizedIconHoverUrl: '' });
    } else if (type === 'active') {
      onChange({ minimizedIconActiveUrl: '' });
    } else {
      onChange({ minimizedIconUrl: '' });
    }
  };

  return (
    <div className="space-y-4">
      <IconUploadSection
        label="Minimized Widget Icon - Normal State (Optional)"
        description="Custom icon shown when widget is minimized. Defaults to message bubble if not set."
        value={minimizedIconUrl}
        iconType="normal"
        isUploading={isUploadingIcon}
        fileInputRef={fileInputRef}
        placeholder="https://example.com/icon.png or upload file"
        onChange={(value) => onChange({ minimizedIconUrl: value })}
        onFileChange={(file) => handleIconUpload(file, 'normal')}
      />

      <IconUploadSection
        label="Hover State Icon (Optional)"
        description="Icon shown when user hovers over the widget button. Falls back to normal state if not set."
        value={minimizedIconHoverUrl}
        iconType="hover"
        isUploading={isUploadingHoverIcon}
        fileInputRef={hoverFileInputRef}
        placeholder="https://example.com/icon-hover.png or upload file"
        borderColor="border-blue-200"
        onChange={(value) => onChange({ minimizedIconHoverUrl: value })}
        onFileChange={(file) => handleIconUpload(file, 'hover')}
      />

      <IconUploadSection
        label="Active/Clicked State Icon (Optional)"
        description="Icon shown when user clicks the widget button. Falls back to normal state if not set."
        value={minimizedIconActiveUrl}
        iconType="active"
        isUploading={isUploadingActiveIcon}
        fileInputRef={activeFileInputRef}
        placeholder="https://example.com/icon-active.png or upload file"
        borderColor="border-green-200"
        onChange={(value) => onChange({ minimizedIconActiveUrl: value })}
        onFileChange={(file) => handleIconUpload(file, 'active')}
      />

      <IconPreview
        minimizedIconUrl={minimizedIconUrl}
        minimizedIconHoverUrl={minimizedIconHoverUrl}
        minimizedIconActiveUrl={minimizedIconActiveUrl}
        onRemove={handleRemove}
      />
    </div>
  );
}
