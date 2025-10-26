import { Shield } from 'lucide-react';

export interface PrivacyBannerProps {
  retentionDays: number;
  onAccept: () => void;
  onCancel: () => void;
}

export function PrivacyBanner({
  retentionDays,
  onAccept,
  onCancel,
}: PrivacyBannerProps) {
  return (
    <div className="fixed bottom-0 right-0 w-full h-auto
      sm:bottom-5 sm:w-[400px] sm:right-5 sm:mx-0
      bg-[#141414] sm:rounded-2xl shadow-2xl p-5 animate-in slide-in-from-bottom-3 duration-200">
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3a3a3a] to-[#2a2a2a] flex items-center justify-center">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="font-medium text-white">Privacy Notice</h3>
            <p className="text-xs text-gray-500">Your data is protected</p>
          </div>
        </div>
        <p className="text-sm text-gray-400 leading-relaxed">
          By continuing, you agree to our data processing for support purposes.
          Data is retained for {retentionDays} days.
        </p>
        <div className="flex gap-2 pt-2">
          <button
            onClick={onAccept}
            className="flex-1 h-10 flex items-center justify-center bg-white text-black hover:bg-gray-200 rounded-lg font-medium transition-colors"
          >
            Accept
          </button>
          <button
            onClick={onCancel}
            className="h-10 px-4 flex items-center justify-center bg-transparent border border-[#2a2a2a] text-gray-400 hover:bg-[#1a1a1a] rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
        <div className="text-center pt-2 border-t border-[#1a1a1a]">
          <a href="/privacy" target="_blank" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            Privacy policy
          </a>
        </div>
      </div>
    </div>
  );
}
