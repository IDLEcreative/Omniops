import { FormEvent } from 'react';
import { Sparkles } from 'lucide-react';
import { Check } from './Check';

interface QuoteFormProps {
  websiteUrl: string;
  setWebsiteUrl: (url: string) => void;
  isAnalyzing: boolean;
  error: string;
  onSubmit: (e: FormEvent) => void;
}

export function QuoteForm({
  websiteUrl,
  setWebsiteUrl,
  isAnalyzing,
  error,
  onSubmit,
}: QuoteFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Website URL
          </label>
          <input
            type="url"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            placeholder="https://yourwebsite.com"
            required
            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-lg"
          />
          <p className="text-sm text-gray-500 mt-2">
            We'll analyze your traffic, content, and recommend the best plan
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isAnalyzing || !websiteUrl}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-lg font-semibold text-lg hover:from-indigo-600 hover:to-purple-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              Analyzing Your Website...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Get My Free Quote
            </>
          )}
        </button>

        <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            No signup required
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            Instant results
          </div>
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-green-500" />
            100% free
          </div>
        </div>
      </form>
    </div>
  );
}
