/**
 * Icon preview component
 */

interface IconPreviewProps {
  iconUrl: string;
  label: string;
  bgGradient: string;
  labelColor: string;
  onRemove: () => void;
}

function IconPreviewItem({ iconUrl, label, bgGradient, labelColor, onRemove }: IconPreviewProps) {
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className={`w-12 h-12 rounded-full ${bgGradient} flex items-center justify-center`}>
        <img
          src={iconUrl}
          alt={`${label} state preview`}
          className="w-6 h-6 object-contain"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
      </div>
      <span className={`text-xs ${labelColor}`}>{label}</span>
      <button
        onClick={onRemove}
        className="text-xs text-red-600 hover:text-red-700"
      >
        Remove
      </button>
    </div>
  );
}

interface IconPreviewContainerProps {
  minimizedIconUrl: string;
  minimizedIconHoverUrl: string;
  minimizedIconActiveUrl: string;
  onRemove: (type: 'normal' | 'hover' | 'active') => void;
}

export function IconPreview({
  minimizedIconUrl,
  minimizedIconHoverUrl,
  minimizedIconActiveUrl,
  onRemove,
}: IconPreviewContainerProps) {
  if (!minimizedIconUrl && !minimizedIconHoverUrl && !minimizedIconActiveUrl) {
    return null;
  }

  return (
    <div className="mt-2 p-4 border rounded-lg bg-gray-50">
      <p className="text-xs text-muted-foreground mb-3 font-medium">Icon State Previews:</p>
      <div className="flex items-start space-x-6">
        {minimizedIconUrl && (
          <IconPreviewItem
            iconUrl={minimizedIconUrl}
            label="Normal"
            bgGradient="bg-gradient-to-br from-gray-700 to-gray-800"
            labelColor="text-gray-600"
            onRemove={() => onRemove('normal')}
          />
        )}
        {minimizedIconHoverUrl && (
          <IconPreviewItem
            iconUrl={minimizedIconHoverUrl}
            label="Hover"
            bgGradient="bg-gradient-to-br from-blue-600 to-blue-700"
            labelColor="text-blue-600"
            onRemove={() => onRemove('hover')}
          />
        )}
        {minimizedIconActiveUrl && (
          <IconPreviewItem
            iconUrl={minimizedIconActiveUrl}
            label="Active"
            bgGradient="bg-gradient-to-br from-green-600 to-green-700"
            labelColor="text-green-600"
            onRemove={() => onRemove('active')}
          />
        )}
      </div>
    </div>
  );
}
