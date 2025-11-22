import { X, Eye } from 'lucide-react';

export interface HeaderProps {
  headerTitle?: string;
  headerSubtitle?: string;
  primaryColor?: string;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onClose: () => void;
  humanAssigned?: boolean;
  // Configuration-driven styling props
  appearance?: {
    headerBackgroundColor?: string;
    headerBorderColor?: string;
    headerTextColor?: string;
  };
}

export function Header({
  headerTitle = 'Support',
  headerSubtitle = 'Online - We typically reply instantly',
  primaryColor = '#818CF8',
  highContrast,
  onToggleHighContrast,
  onClose,
  humanAssigned = false,
  appearance,
}: HeaderProps) {
  // Use config-driven colors with fallbacks to current hardcoded values
  const backgroundColor = appearance?.headerBackgroundColor || '#111111';
  const borderColor = appearance?.headerBorderColor || '#2a2a2a';
  const textColor = appearance?.headerTextColor || '#ffffff';

  return (
    <div
      style={{
        backgroundColor: highContrast ? undefined : backgroundColor,
        borderColor: highContrast ? undefined : borderColor,
      }}
      className={`px-4 py-3 flex items-center justify-between border-b ${
        highContrast ? 'border-white bg-black' : ''
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Online status indicator - shows orange when human assigned */}
        <div
          className={`w-2.5 h-2.5 ${humanAssigned ? 'bg-orange-500' : 'bg-green-500'} rounded-full flex-shrink-0`}
          aria-label={humanAssigned ? 'Human agent assigned' : 'Online'}
        />
        <div className="min-w-0 flex-1">
          <h3
            style={{ color: highContrast ? undefined : textColor }}
            className={`font-semibold text-base leading-tight ${highContrast ? 'text-white' : ''}`}
          >
            {headerTitle}
          </h3>
          <p className="text-sm text-gray-400 opacity-90">
            {humanAssigned ? '👤 Human Agent Assigned' : headerSubtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleHighContrast}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: highContrast ? '#ffffff' : textColor,
            opacity: 1,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          className={highContrast ? 'text-white' : ''}
          aria-label={`Toggle high contrast mode. Currently ${highContrast ? 'on' : 'off'}`}
          title="Toggle high contrast"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={onClose}
          style={{
            all: 'unset',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: highContrast ? '#ffffff' : textColor,
            opacity: 1,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          className={highContrast ? 'text-white' : ''}
          aria-label="Close chat widget"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
