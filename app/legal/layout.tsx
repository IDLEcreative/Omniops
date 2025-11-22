import type { Metadata } from 'next';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const metadata: Metadata = {
  title: {
    default: 'Legal | OmniOps',
    template: '%s | OmniOps Legal'
  },
  description: 'Legal documents, terms of service, privacy policy, and compliance information for OmniOps',
};

function LegalNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  'use client';
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`
        block px-4 py-2 rounded-md transition-colors
        ${isActive
          ? 'bg-blue-50 text-blue-700 font-medium'
          : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
        }
      `}
    >
      {children}
    </Link>
  );
}

export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      {/* Header with breadcrumbs */}
      <header className="border-b bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <nav className="flex items-center text-sm">
            <Link href="/" className="text-gray-500 hover:text-gray-700">
              Home
            </Link>
            <span className="mx-2 text-gray-400">/</span>
            <span className="text-gray-900 font-medium">Legal</span>
          </nav>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:col-span-3 mb-8 lg:mb-0">
            <nav className="sticky top-8 space-y-1">
              <h2 className="px-4 mb-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Legal Documents
              </h2>

              <LegalNavLink href="/legal/terms">
                <div>
                  <div className="font-medium">Terms of Service</div>
                  <div className="text-sm text-gray-500">Service agreement</div>
                </div>
              </LegalNavLink>

              <LegalNavLink href="/legal/privacy">
                <div>
                  <div className="font-medium">Privacy Policy</div>
                  <div className="text-sm text-gray-500">Data protection & GDPR</div>
                </div>
              </LegalNavLink>

              <LegalNavLink href="/legal/cookies">
                <div>
                  <div className="font-medium">Cookie Policy</div>
                  <div className="text-sm text-gray-500">Cookie usage & preferences</div>
                </div>
              </LegalNavLink>

              <LegalNavLink href="/legal/dpa">
                <div>
                  <div className="font-medium">Data Processing Agreement</div>
                  <div className="text-sm text-gray-500">B2B compliance template</div>
                </div>
              </LegalNavLink>

              <div className="pt-6 mt-6 border-t border-gray-200">
                <h3 className="px-4 mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Quick Links
                </h3>
                <div className="space-y-2 px-4">
                  <Link
                    href="/dashboard/privacy"
                    className="block text-sm text-blue-600 hover:text-blue-700"
                  >
                    Privacy Dashboard →
                  </Link>
                  <Link
                    href="/support"
                    className="block text-sm text-blue-600 hover:text-blue-700"
                  >
                    Contact Support →
                  </Link>
                </div>
              </div>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="lg:col-span-9">
            <div className="prose prose-gray max-w-none">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t bg-gray-50 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} OmniOps. All rights reserved.</p>
            <p className="mt-2">
              Questions about our legal documents? Contact{' '}
              <a href="mailto:legal@omniops.com" className="text-blue-600 hover:text-blue-700">
                legal@omniops.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}