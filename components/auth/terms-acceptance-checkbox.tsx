'use client';

import Link from 'next/link';

interface TermsAcceptanceCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  error?: string;
}

/**
 * Terms acceptance checkbox for signup flow
 *
 * Features:
 * - Required checkbox for signup
 * - Links to Terms of Service and Privacy Policy
 * - Opens links in new tab
 * - Validates before form submission
 * - Accessible with proper labels and ARIA attributes
 */
export function TermsAcceptanceCheckbox({
  checked,
  onChange,
  error,
}: TermsAcceptanceCheckboxProps) {
  return (
    <div className="space-y-2">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          required
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          aria-required="true"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? 'terms-error' : undefined}
        />
        <span className="text-sm text-gray-700 dark:text-gray-300">
          I agree to the{' '}
          <Link
            href="/legal/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
          >
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link
            href="/legal/privacy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
          >
            Privacy Policy
          </Link>
        </span>
      </label>
      {error && (
        <p id="terms-error" className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
