import { X, Eye } from 'lucide-react';

export interface HeaderProps {
  headerTitle?: string;
  highContrast: boolean;
  onToggleHighContrast: () => void;
  onClose: () => void;
}

export function Header({
  headerTitle = 'Support',
  highContrast,
  onToggleHighContrast,
  onClose,
}: HeaderProps) {
  return (
    <div className={`${highContrast ? 'bg-transparent border-b-2 border-white' : 'bg-transparent border-b border-white/10'} px-3 sm:px-4 py-2.5 flex items-center justify-between`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="h-2 w-2 bg-green-500 rounded-full flex-shrink-0" aria-label="Status: Online" />
        <div className="min-w-0 flex-1">
          <h3 className={`font-medium ${highContrast ? 'text-white' : 'text-gray-100'} text-sm leading-tight`}>
            {headerTitle}
          </h3>
          <p className={`text-xs ${highContrast ? 'text-gray-200' : 'text-gray-400'} leading-tight`}>
            Online - We typically reply instantly
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onToggleHighContrast}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${highContrast ? 'text-white hover:bg-white hover:text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
          aria-label={`Toggle high contrast mode. Currently ${highContrast ? 'on' : 'off'}`}
          title="Toggle high contrast"
        >
          <Eye className="h-4 w-4" aria-hidden="true" />
        </button>
        <button
          onClick={onClose}
          className={`w-8 h-8 flex items-center justify-center rounded-full ${highContrast ? 'text-white hover:bg-white hover:text-black' : 'text-gray-400 hover:text-white hover:bg-white/10'} transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50`}
          aria-label="Close chat widget"
        >
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
