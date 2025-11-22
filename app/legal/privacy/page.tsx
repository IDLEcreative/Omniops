import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy | OmniOps',
  description: 'Privacy Policy describing how OmniOps collects, uses, and protects your information. GDPR and CCPA compliant.',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Last Updated: November 19, 2025</span>
          <span>•</span>
          <span>Version: v1.0.0</span>
          <span>•</span>
          <span>Effective: January 1, 2025</span>
        </div>
      </header>

      {/* Important Notice */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
        <div className="flex">
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>Your Privacy Rights:</strong> You have rights under GDPR Articles 15-22 including access,
              rectification, erasure, and portability of your data.{' '}
              <Link href="/dashboard/privacy" className="underline font-semibold">
                Visit your Privacy Dashboard
              </Link>{' '}
              to exercise these rights.
            </p>
          </div>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mb-10 p-6 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-4">Table of Contents</h2>
        <ul className="space-y-2 text-sm">
          {[
            { href: '#information-collected', label: '1. Information We Collect' },
            { href: '#how-we-use', label: '2. How We Use Information' },
            { href: '#legal-basis', label: '3. Legal Basis for Processing' },
            { href: '#data-storage', label: '4. Data Storage and Security' },
            { href: '#data-sharing', label: '5. Data Sharing and Disclosure' },
            { href: '#user-rights', label: '6. User Rights' },
            { href: '#cookies', label: '7. Cookies and Tracking Technologies' },
            { href: '#retention', label: '8. Data Retention' },
            { href: '#transfers', label: '9. International Data Transfers' },
            { href: '#children', label: '10. Children\'s Privacy' },
            { href: '#third-party', label: '11. Third-Party Services' },
            { href: '#privacy-design', label: '12. Privacy by Design' },
            { href: '#breach', label: '13. Data Breach Procedures' },
            { href: '#changes', label: '14. Changes to Privacy Policy' },
            { href: '#contact', label: '15. Contact Information' }
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
            This Privacy Policy describes how OmniOps ("we", "us", or "our") collects, uses, and protects
            information when you use our AI-powered customer service chat widget platform ("the Service").
            We are committed to protecting your privacy and complying with applicable data protection laws,
            including GDPR and CCPA.
          </p>
        </section>

        <section id="information-collected">
          <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>

          <h3 className="text-xl font-medium mb-3">1.1 Information You Provide Directly</h3>

          <h4 className="text-lg font-medium mb-2">Account Information:</h4>
          <ul className="mb-4">
            <li>Name and contact details</li>
            <li>Email address</li>
            <li>Company/organization information</li>
            <li>Billing information (processed by payment providers)</li>
            <li>Account preferences and settings</li>
          </ul>

          <h4 className="text-lg font-medium mb-2">Customer Configuration:</h4>
          <ul className="mb-4">
            <li>Website URLs for scraping</li>
            <li>API credentials (encrypted using AES-256)</li>
            <li>Widget customization settings</li>
            <li>Integration configurations (WooCommerce, Shopify)</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">1.2 Information Collected Automatically</h3>

          <h4 className="text-lg font-medium mb-2">Usage Data:</h4>
          <ul className="mb-4">
            <li>Service usage patterns and statistics</li>
            <li>Feature utilization metrics</li>
            <li>API call logs</li>
            <li>Performance metrics</li>
          </ul>

          <h4 className="text-lg font-medium mb-2">Chat Widget Data:</h4>
          <ul>
            <li>Conversation logs between end-users and AI</li>
            <li>User queries and interactions</li>
            <li>Session identifiers</li>
            <li>Timestamp information</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">1.3 Information from Website Scraping</h3>
          <p>We only scrape publicly accessible information with customer authorization:</p>
          <ul>
            <li>Website pages and content structure</li>
            <li>Product information and descriptions</li>
            <li>FAQ content</li>
            <li>Contact information published on websites</li>
            <li>Business information</li>
          </ul>
        </section>

        <section id="user-rights">
          <h2 className="text-2xl font-semibold mb-4">6. User Rights</h2>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 my-6">
            <p className="font-semibold text-green-800 mb-2">Your GDPR Rights (Articles 15-22)</p>
            <ul className="space-y-2 text-sm text-green-700">
              <li>✅ <strong>Right to Access:</strong> Request copies of your personal data</li>
              <li>✅ <strong>Right to Rectification:</strong> Correct inaccurate or incomplete data</li>
              <li>✅ <strong>Right to Erasure:</strong> Request deletion of your data</li>
              <li>✅ <strong>Right to Restrict Processing:</strong> Limit how we use your data</li>
              <li>✅ <strong>Right to Data Portability:</strong> Receive your data in a portable format</li>
              <li>✅ <strong>Right to Object:</strong> Object to certain processing activities</li>
              <li>✅ <strong>Rights Related to Automated Decision-Making:</strong> Not be subject to solely automated decisions</li>
              <li>✅ <strong>Right to Withdraw Consent:</strong> Withdraw consent at any time</li>
            </ul>
          </div>

          <p className="mt-4">
            <Link href="/dashboard/privacy" className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
              Access Privacy Dashboard →
            </Link>
          </p>

          <h3 className="text-xl font-medium mb-3 mt-6">How to Exercise Your Rights</h3>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Visit the <Link href="/dashboard/privacy" className="text-blue-600 hover:text-blue-700">Privacy Dashboard</Link> for self-service options</li>
            <li>Contact our Data Protection Officer at dpo@omniops.com</li>
            <li>Submit a request through our support portal</li>
            <li>We will respond within 30 days as required by law</li>
          </ol>
        </section>

        <section id="cookies">
          <h2 className="text-2xl font-semibold mb-4">7. Cookies and Tracking Technologies</h2>
          <p>We use cookies and similar technologies to improve your experience. For detailed information:</p>
          <p className="mt-4">
            <Link href="/legal/cookies" className="text-blue-600 hover:text-blue-700 font-medium">
              View our Cookie Policy →
            </Link>
          </p>
          <p className="mt-2">
            <button className="text-blue-600 hover:text-blue-700 font-medium">
              Manage Cookie Preferences →
            </button>
          </p>
        </section>

        <section id="retention">
          <h2 className="text-2xl font-semibold mb-4">8. Data Retention</h2>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 my-4">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Retention Period</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 text-sm">Account Data</td>
                  <td className="px-6 py-4 text-sm">Duration of account + 30 days</td>
                  <td className="px-6 py-4 text-sm">Service provision</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm">Chat Conversations</td>
                  <td className="px-6 py-4 text-sm">90 days (configurable)</td>
                  <td className="px-6 py-4 text-sm">Service improvement</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm">Analytics Data</td>
                  <td className="px-6 py-4 text-sm">13 months</td>
                  <td className="px-6 py-4 text-sm">Performance analysis</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 text-sm">Security Logs</td>
                  <td className="px-6 py-4 text-sm">180 days</td>
                  <td className="px-6 py-4 text-sm">Security monitoring</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="data-storage">
          <h2 className="text-2xl font-semibold mb-4">4. Data Storage and Security</h2>

          <h3 className="text-xl font-medium mb-3">Security Measures</h3>
          <ul className="space-y-2">
            <li>🔒 <strong>Encryption:</strong> Industry-standard encryption for data in transit (TLS) and at rest (AES-256)</li>
            <li>🔐 <strong>Access Control:</strong> Role-based access with multi-factor authentication</li>
            <li>🛡️ <strong>Isolation:</strong> Multi-tenant architecture with data isolation</li>
            <li>💾 <strong>Backups:</strong> Regular automated backups with point-in-time recovery</li>
            <li>🔍 <strong>Monitoring:</strong> 24/7 security monitoring and intrusion detection</li>
            <li>✅ <strong>Compliance:</strong> Regular security audits and penetration testing</li>
          </ul>
        </section>

        <section id="contact">
          <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>

          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Data Protection Officer</h3>
            <p>Email: dpo@omniops.com</p>
            <p>Privacy Inquiries: privacy@omniops.com</p>

            <div className="mt-4 pt-4 border-t border-blue-100">
              <h4 className="font-semibold mb-2">Quick Actions:</h4>
              <div className="space-y-2">
                <Link href="/dashboard/privacy" className="block text-blue-600 hover:text-blue-700">
                  → Privacy Dashboard
                </Link>
                <Link href="/api/privacy/export" className="block text-blue-600 hover:text-blue-700">
                  → Export Your Data
                </Link>
                <Link href="/api/privacy/delete" className="block text-blue-600 hover:text-blue-700">
                  → Request Data Deletion
                </Link>
                <Link href="/support" className="block text-blue-600 hover:text-blue-700">
                  → Contact Support
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              For supervisory authority complaints (EU residents), contact your local
              Data Protection Authority. UK residents may contact the Information Commissioner's Office (ICO).
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}