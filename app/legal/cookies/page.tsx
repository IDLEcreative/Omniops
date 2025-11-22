import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Cookie Policy | OmniOps',
  description: 'Cookie Policy explaining how OmniOps uses cookies and similar tracking technologies for our chat widget platform',
};

export default function CookiesPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Last Updated: November 19, 2025</span>
          <span>•</span>
          <span>Version: v1.0.0</span>
          <span>•</span>
          <span>Effective: January 1, 2025</span>
        </div>
      </header>

      {/* Cookie Preferences Banner */}
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 mb-8">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-amber-700">
              <strong>Cookie Preferences:</strong> You can manage your cookie preferences at any time.{' '}
              <button className="underline font-semibold hover:text-amber-800">
                Manage Cookie Settings
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mb-10 p-6 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-4">Table of Contents</h2>
        <ul className="space-y-2 text-sm">
          {[
            { href: '#what-are-cookies', label: '1. What Are Cookies' },
            { href: '#why-we-use', label: '2. Why We Use Cookies' },
            { href: '#types-of-cookies', label: '3. Types of Cookies We Use' },
            { href: '#third-party', label: '4. Third-Party Cookies' },
            { href: '#widget-cookies', label: '5. Chat Widget Cookies' },
            { href: '#duration', label: '6. Cookie Duration' },
            { href: '#managing', label: '7. Managing Cookie Preferences' },
            { href: '#do-not-track', label: '8. Do Not Track Signals' },
            { href: '#updates', label: '9. Updates to Cookie Policy' },
            { href: '#contact', label: '10. Contact Information' }
          ].map(item => (
            <li key={item.href}>
              <a href={item.href} className="text-blue-600 hover:text-blue-700 hover:underline">
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="prose prose-gray max-w-none space-y-8">
        <section>
          <p className="text-lg">
            This Cookie Policy explains how OmniOps uses cookies and similar tracking technologies when you use
            our AI-powered customer service chat widget platform and related services. This policy is part of
            our Privacy Policy and should be read in conjunction with it.
          </p>
        </section>

        <section id="what-are-cookies">
          <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>

          <h3 className="text-xl font-medium mb-3">1.1 Definition</h3>
          <p>Cookies are small text files that are placed on your device (computer, smartphone, tablet) when
             you visit a website. They help websites remember information about your visit, making your next
             visit easier and the site more useful to you.</p>

          <h3 className="text-xl font-medium mb-3 mt-6">1.2 Similar Technologies</h3>
          <p>In addition to cookies, we may use:</p>
          <ul>
            <li><strong>Local Storage:</strong> Stores data in your browser with no expiration</li>
            <li><strong>Session Storage:</strong> Stores data for the duration of your browser session</li>
            <li><strong>Web Beacons:</strong> Small graphics that track usage</li>
            <li><strong>Device Fingerprinting:</strong> Technical information about your device</li>
            <li><strong>ETags:</strong> Cache validators used by browsers</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">1.3 First-Party vs Third-Party</h3>
          <ul>
            <li><strong>First-Party Cookies:</strong> Set by OmniOps directly</li>
            <li><strong>Third-Party Cookies:</strong> Set by our service providers or partners</li>
          </ul>
        </section>

        <section id="why-we-use">
          <h2 className="text-2xl font-semibold mb-4">2. Why We Use Cookies</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">🔧 Core Functionality</h3>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>• Maintain your session</li>
                <li>• Remember preferences</li>
                <li>• Enable authentication</li>
                <li>• Ensure widget operation</li>
              </ul>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="font-semibold text-green-900 mb-2">⚡ Performance</h3>
              <ul className="text-sm space-y-1 text-green-700">
                <li>• Optimize loading times</li>
                <li>• Distribute traffic</li>
                <li>• Cache data efficiently</li>
                <li>• Monitor performance</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h3 className="font-semibold text-purple-900 mb-2">📊 Analytics</h3>
              <ul className="text-sm space-y-1 text-purple-700">
                <li>• Understand usage patterns</li>
                <li>• Identify popular features</li>
                <li>• Diagnose issues</li>
                <li>• Measure effectiveness</li>
              </ul>
            </div>

            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="font-semibold text-amber-900 mb-2">🎯 Personalization</h3>
              <ul className="text-sm space-y-1 text-amber-700">
                <li>• Remember languages</li>
                <li>• Customize interface</li>
                <li>• Provide relevant content</li>
                <li>• Save preferences</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="types-of-cookies">
          <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>

          <h3 className="text-xl font-medium mb-3">3.1 Essential Cookies</h3>
          <p className="mb-4">These cookies are necessary for the Service to function and cannot be disabled.</p>

          <div className="overflow-x-auto mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cookie Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-3 text-sm font-mono">session_id</td>
                  <td className="px-4 py-3 text-sm">Maintains user session</td>
                  <td className="px-4 py-3 text-sm">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono">auth_token</td>
                  <td className="px-4 py-3 text-sm">Authentication token</td>
                  <td className="px-4 py-3 text-sm">7 days</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono">csrf_token</td>
                  <td className="px-4 py-3 text-sm">Security against CSRF attacks</td>
                  <td className="px-4 py-3 text-sm">Session</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm font-mono">consent_given</td>
                  <td className="px-4 py-3 text-sm">Records cookie consent</td>
                  <td className="px-4 py-3 text-sm">1 year</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="text-xl font-medium mb-3">3.2 Functional & Analytics Cookies</h3>
          <p className="mb-4">Additional cookies for personalization and analytics:</p>
          <ul className="text-sm space-y-1 mb-4">
            <li>• <code className="text-xs bg-gray-100 px-1">language</code>: Stores language preference (1 year)</li>
            <li>• <code className="text-xs bg-gray-100 px-1">timezone</code>: Stores timezone preference (1 year)</li>
            <li>• <code className="text-xs bg-gray-100 px-1">theme</code>: UI theme preference (1 year)</li>
            <li>• Analytics cookies help us understand usage patterns</li>
          </ul>
        </section>

        <section id="widget-cookies">
          <h2 className="text-2xl font-semibold mb-4">5. Chat Widget Cookies</h2>

          <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 my-6">
            <p className="font-semibold text-indigo-800 mb-2">Widget-Specific Cookies</p>
            <p className="text-sm text-indigo-700 mb-3">
              When you embed our chat widget on your website, these cookies are used:
            </p>
            <ul className="space-y-2 text-sm text-indigo-700">
              <li>• <strong>widget_session:</strong> Maintains chat session continuity</li>
              <li>• <strong>widget_user_id:</strong> Anonymous identifier for conversations</li>
              <li>• <strong>widget_preferences:</strong> Widget display settings</li>
              <li>• <strong>widget_history:</strong> Recent conversation context (optional)</li>
            </ul>
          </div>

          <p>Widget cookies are essential for maintaining conversation context and providing personalized responses.
             They do not track users across different websites.</p>
        </section>

        <section id="managing">
          <h2 className="text-2xl font-semibold mb-4">7. Managing Cookie Preferences</h2>

          <h3 className="text-xl font-medium mb-3">Browser Controls</h3>
          <p>Most browsers allow you to manage cookies through their settings:</p>
          <ul className="mt-2">
            <li><strong>Chrome:</strong> Settings → Privacy and security → Cookies</li>
            <li><strong>Firefox:</strong> Settings → Privacy & Security → Cookies</li>
            <li><strong>Safari:</strong> Preferences → Privacy → Cookies</li>
            <li><strong>Edge:</strong> Settings → Privacy → Cookies</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">OmniOps Cookie Settings</h3>
          <div className="bg-gray-50 rounded-lg p-6 my-4">
            <p className="mb-4">You can manage your cookie preferences directly:</p>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-3 bg-white border rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Essential Cookies</span>
                  <span className="text-sm text-gray-500">Always Enabled</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-white border rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Functional Cookies</span>
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
              </button>
              <button className="w-full text-left px-4 py-3 bg-white border rounded-md hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Analytics Cookies</span>
                  <span className="text-sm text-green-600">Enabled</span>
                </div>
              </button>
            </div>
            <button className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Save Preferences
            </button>
          </div>

          <p className="text-sm text-gray-600 mt-4">
            Note: Disabling certain cookies may impact the functionality of our Service.
          </p>
        </section>

        <section id="contact">
          <h2 className="text-2xl font-semibold mb-4">10. Contact Information</h2>

          <div className="bg-blue-50 rounded-lg p-6">
            <p className="font-semibold mb-3">Cookie Questions?</p>
            <p>Privacy Team: privacy@omniops.com</p>
            <p>Data Protection Officer: dpo@omniops.com</p>

            <div className="mt-4 pt-4 border-t border-blue-100">
              <h4 className="font-semibold mb-2">Related Resources:</h4>
              <div className="space-y-2">
                <Link href="/legal/privacy" className="block text-blue-600 hover:text-blue-700">
                  → Privacy Policy
                </Link>
                <Link href="/dashboard/privacy" className="block text-blue-600 hover:text-blue-700">
                  → Privacy Dashboard
                </Link>
                <button className="block text-blue-600 hover:text-blue-700">
                  → Manage Cookie Preferences
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}