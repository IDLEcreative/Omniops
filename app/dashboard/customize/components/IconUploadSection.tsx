/**
 * Reusable icon upload section component
 */

import { RefObject } from 'react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { IconType } from '../hooks/useIconUpload';

interface IconUploadSectionProps {
  label: string;
  description: string;
  value: string;
  iconType: IconType;
  isUploading: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  placeholder: string;
  borderColor?: string;
  onChange: (value: string) => void;
  onFileChange: (file: File) => void;
}

export function IconUploadSection({
  label,
  description,
  value,
  iconType,
  isUploading,
  fileInputRef,
  placeholder,
  borderColor,
  onChange,
  onFileChange,
}: IconUploadSectionProps) {
  const containerClass = borderColor
    ? `space-y-2 pl-4 border-l-2 ${borderColor}`
    : 'space-y-2';

  return (
    <div className={containerClass}>
      <Label>{label}</Label>
      <p className="text-xs text-muted-foreground mb-2">{description}</p>
      <div className="flex items-center space-x-3">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onFileChange(file);
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="px-4 py-2 border rounded-md hover:bg-gray-50 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
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
  );
}
