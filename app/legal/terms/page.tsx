import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service | OmniOps',
  description: 'Terms of Service governing the use of OmniOps AI-powered customer service chat widget platform',
};

export default function TermsPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Last Updated: November 19, 2025</span>
          <span>•</span>
          <span>Version: v1.0.0</span>
          <span>•</span>
          <span>Effective: January 1, 2025</span>
        </div>
      </header>

      {/* Table of Contents */}
      <nav className="mb-10 p-6 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-4">Table of Contents</h2>
        <ul className="space-y-2 text-sm">
          {[
            { href: '#acceptance', label: '1. Acceptance of Terms' },
            { href: '#description', label: '2. Description of Service' },
            { href: '#accounts', label: '3. User Accounts and Registration' },
            { href: '#responsibilities', label: '4. User Responsibilities' },
            { href: '#prohibited', label: '5. Prohibited Activities' },
            { href: '#intellectual', label: '6. Intellectual Property Rights' },
            { href: '#payment', label: '7. Payment Terms' },
            { href: '#availability', label: '8. Service Availability and Support' },
            { href: '#privacy', label: '9. Data Protection and Privacy' },
            { href: '#liability', label: '10. Limitation of Liability' },
            { href: '#indemnification', label: '11. Indemnification' },
            { href: '#termination', label: '12. Termination' },
            { href: '#modifications', label: '13. Modifications to Service and Terms' },
            { href: '#dispute', label: '14. Dispute Resolution' },
            { href: '#general', label: '15. General Provisions' },
            { href: '#contact', label: '16. Contact Information' }
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
        <section id="acceptance">
          <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
          <p>By accessing or using OmniOps ("the Service"), you agree to be bound by these Terms of Service ("Terms").
             If you disagree with any part of these terms, you may not access the Service.</p>
          <p>These Terms apply to all visitors, users, and others who access or use the Service, including:</p>
          <ul>
            <li>Trial users</li>
            <li>Paid subscribers</li>
            <li>API users</li>
            <li>Widget end-users</li>
          </ul>
        </section>

        <section id="description">
          <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
          <p>OmniOps provides:</p>
          <ul className="space-y-2">
            <li><strong>AI-Powered Chat Widget:</strong> Embeddable customer service chat functionality</li>
            <li><strong>Web Content Ingestion:</strong> Automated website scraping and content indexing</li>
            <li><strong>E-commerce Integration:</strong> Support for WooCommerce, Shopify, and other platforms</li>
            <li><strong>Multi-Tenant Architecture:</strong> Isolated, secure environments for each customer</li>
            <li><strong>Analytics Dashboard:</strong> Conversation metrics and insights</li>
            <li><strong>API Access:</strong> Programmatic access to Service features</li>
            <li><strong>Privacy Tools:</strong> GDPR/CCPA compliance features for data management</li>
          </ul>
          <p>The Service is provided on a Software-as-a-Service (SaaS) basis, hosted on cloud infrastructure,
             with continuous updates and improvements.</p>
        </section>

        <section id="accounts">
          <h2 className="text-2xl font-semibold mb-4">3. User Accounts and Registration</h2>

          <h3 className="text-xl font-medium mb-3">3.1 Account Creation</h3>
          <p>To use certain features, you must register for an account by providing:</p>
          <ul>
            <li>Valid email address</li>
            <li>Company/organization information</li>
            <li>Billing information (for paid plans)</li>
            <li>Accurate and complete registration information</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">3.2 Account Security</h3>
          <p>You are responsible for:</p>
          <ul>
            <li>Maintaining the confidentiality of your account credentials</li>
            <li>All activities that occur under your account</li>
            <li>Notifying us immediately of any unauthorized use</li>
            <li>Using strong, unique passwords</li>
            <li>Enabling two-factor authentication when available</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">3.3 Account Types</h3>
          <ul>
            <li><strong>Trial Accounts:</strong> Limited features, time-limited access</li>
            <li><strong>Paid Accounts:</strong> Full features based on subscription tier</li>
            <li><strong>Enterprise Accounts:</strong> Custom features and service level agreements</li>
          </ul>
        </section>

        <section id="responsibilities">
          <h2 className="text-2xl font-semibold mb-4">4. User Responsibilities</h2>

          <h3 className="text-xl font-medium mb-3">4.1 Lawful Use</h3>
          <ul>
            <li>Use the Service only for lawful purposes</li>
            <li>Comply with all applicable laws and regulations</li>
            <li>Respect intellectual property rights</li>
            <li>Obtain necessary consents for data collection</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">4.2 Data Responsibility</h3>
          <ul>
            <li>Ensure you have rights to any data you upload</li>
            <li>Comply with privacy laws for data you collect</li>
            <li>Configure the Service appropriately for your jurisdiction</li>
            <li>Implement appropriate data retention policies</li>
          </ul>
        </section>

        <section id="prohibited">
          <h2 className="text-2xl font-semibold mb-4">5. Prohibited Activities</h2>
          <p>You may not:</p>
          <ul className="space-y-2">
            <li>Attempt to gain unauthorized access to any systems</li>
            <li>Use the Service to transmit malware or malicious code</li>
            <li>Perform activities that could damage or disable the Service</li>
            <li>Reverse engineer or attempt to extract source code</li>
            <li>Exceed rate limits or usage quotas</li>
            <li>Violate privacy rights of individuals</li>
            <li>Upload illegal or offensive content</li>
          </ul>
        </section>

        <section id="payment">
          <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>

          <h3 className="text-xl font-medium mb-3">7.1 Subscription Fees</h3>
          <ul>
            <li>Fees are based on your selected plan and usage</li>
            <li>All fees are exclusive of taxes unless stated otherwise</li>
            <li>Prices may change with 30 days notice for monthly plans, 60 days for annual</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">7.2 Billing</h3>
          <ul>
            <li>Subscriptions are billed in advance on a recurring basis</li>
            <li>Payment is due upon receipt of invoice</li>
            <li>Late payments may result in service suspension</li>
            <li>No refunds for partial months or unused features</li>
          </ul>
        </section>

        <section id="privacy">
          <h2 className="text-2xl font-semibold mb-4">9. Data Protection and Privacy</h2>
          <p>We comply with GDPR, CCPA, and other privacy regulations. Our Privacy Policy details data collection and use.</p>
          <p className="mt-4">
            <Link href="/legal/privacy" className="text-blue-600 hover:text-blue-700 font-medium">
              View our Privacy Policy →
            </Link>
          </p>
          <p>
            <Link href="/legal/dpa" className="text-blue-600 hover:text-blue-700 font-medium">
              Data Processing Agreement →
            </Link>
          </p>
        </section>

        <section id="liability">
          <h2 className="text-2xl font-semibold mb-4">10. Limitation of Liability</h2>
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 my-6">
            <p className="font-semibold uppercase text-sm">Important Notice:</p>
            <p className="mt-2 text-sm">THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND,
               EXPRESS OR IMPLIED. IN NO EVENT SHALL OMNIOPS BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
               SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES.</p>
          </div>
        </section>

        <section id="termination">
          <h2 className="text-2xl font-semibold mb-4">12. Termination</h2>

          <h3 className="text-xl font-medium mb-3">12.1 Termination by You</h3>
          <ul>
            <li>Cancel subscription at any time through account settings</li>
            <li>Provide 30 days notice for annual plans</li>
            <li>Export your data before termination</li>
            <li>No refund for unused time</li>
          </ul>

          <h3 className="text-xl font-medium mb-3 mt-6">12.2 Termination by Us</h3>
          <p>We may terminate or suspend your account immediately if:</p>
          <ul>
            <li>You breach these Terms</li>
            <li>You fail to pay fees when due</li>
            <li>We are required to do so by law</li>
            <li>Continued provision would be commercially unreasonable</li>
          </ul>
        </section>

        <section id="contact">
          <h2 className="text-2xl font-semibold mb-4">16. Contact Information</h2>
          <div className="bg-blue-50 rounded-lg p-6">
            <p className="font-semibold mb-3">Legal Department</p>
            <p>Email: legal@omniops.com</p>
            <p>Support: support@omniops.com</p>
            <div className="mt-4 pt-4 border-t border-blue-100">
              <p className="text-sm">For general support:</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li><a href="/docs" className="text-blue-600 hover:text-blue-700">Documentation</a></li>
                <li><a href="/status" className="text-blue-600 hover:text-blue-700">Status Page</a></li>
                <li><a href="/support" className="text-blue-600 hover:text-blue-700">Support Portal</a></li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}