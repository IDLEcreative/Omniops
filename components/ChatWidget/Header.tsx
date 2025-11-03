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
  headerSubtitle = 'Online - We typically reply instantly',
  primaryColor = '#818CF8',
  highContrast,
  onToggleHighContrast,
  onClose,
}: HeaderProps) {
  return (
    <div
      className={`px-4 py-3 flex items-center justify-between border-b ${
        highContrast ? 'border-white' : 'border-[#2a2a2a] bg-[#111111]'
      }`}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Online status indicator */}
        <div className="w-2.5 h-2.5 bg-green-500 rounded-full flex-shrink-0" aria-label="Online" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-white text-base leading-tight">
            {headerTitle}
          </h3>
          <p className="text-sm text-gray-400 opacity-90">
            {headerSubtitle}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleHighContrast}
          className="w-8 h-8 flex items-center justify-center text-white hover:opacity-70 transition-opacity duration-200 focus:outline-none"
          aria-label={`Toggle high contrast mode. Currently ${highContrast ? 'on' : 'off'}`}
          title="Toggle high contrast"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center text-white hover:opacity-70 transition-opacity duration-200 focus:outline-none"
          aria-label="Close chat widget"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
