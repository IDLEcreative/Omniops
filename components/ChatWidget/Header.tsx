import { X, Eye } from 'lucide-react';

export interface HeaderProps {
  headerTitle?: string;
  headerSubtitle?: string;
  primaryColor?: string;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onClose: () => void;
}

export function Header({
  headerTitle = 'Support',
  headerSubtitle = "We're here to help!",
  primaryColor = '#818CF8',
  highContrast,
  onToggleHighContrast,
  onClose,
}: HeaderProps) {
  return (
    <div
      className={`px-4 py-3 flex items-center justify-between ${highContrast ? 'border-b-2 border-white' : ''}`}
      style={{
        backgroundColor: highContrast ? 'transparent' : primaryColor
      }}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-sm leading-tight">
            {headerTitle}
          </h3>
          <p className="text-sm text-white opacity-90">
            {headerSubtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleHighContrast}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label={`Toggle high contrast mode. Currently ${highContrast ? 'on' : 'off'}`}
          title="Toggle high contrast"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50"
          aria-label="Close chat widget"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
