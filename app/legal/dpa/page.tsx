import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Data Processing Agreement | OmniOps',
  description: 'Data Processing Agreement (DPA) template for B2B customers requiring GDPR compliance documentation',
};

export default function DPAPage() {
  return (
    <div className="max-w-4xl">
      <header className="mb-8 pb-6 border-b border-gray-200">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Data Processing Agreement</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Last Updated: November 19, 2025</span>
          <span>•</span>
          <span>Version: v1.0.0</span>
          <span>•</span>
          <span>Template for B2B Customers</span>
        </div>
      </header>

      {/* Download Section */}
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-blue-700">
              <strong>Enterprise Customers:</strong> Download this DPA template for GDPR compliance.
              Complete the fields and return signed to legal@omniops.com
            </p>
          </div>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download PDF
          </button>
        </div>
      </div>

      {/* Table of Contents */}
      <nav className="mb-10 p-6 bg-gray-50 rounded-lg">
        <h2 className="font-semibold text-lg mb-4">Table of Contents</h2>
        <ul className="space-y-2 text-sm">
          {[
            { href: '#definitions', label: '1. Definitions' },
            { href: '#scope', label: '2. Scope and Purpose' },
            { href: '#processor-obligations', label: '3. Processor Obligations' },
            { href: '#controller-obligations', label: '4. Controller Obligations' },
            { href: '#security', label: '5. Security Measures' },
            { href: '#subprocessors', label: '6. Sub-processors' },
            { href: '#data-subject-rights', label: '7. Data Subject Rights' },
            { href: '#breaches', label: '8. Data Breaches' },
            { href: '#transfers', label: '9. Data Transfers' },
            { href: '#audit', label: '10. Audit Rights' },
            { href: '#return-deletion', label: '11. Data Return and Deletion' },
            { href: '#liability', label: '12. Liability and Indemnification' },
            { href: '#term', label: '13. Term and Termination' },
            { href: '#general', label: '14. General Provisions' },
            { href: '#annex-1', label: 'Annex 1: Processing Details' },
            { href: '#annex-2', label: 'Annex 2: Technical Measures' },
            { href: '#annex-3', label: 'Annex 3: Sub-processors' },
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
        {/* Agreement Header */}
        <section className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-center text-2xl font-bold mb-6">DATA PROCESSING AGREEMENT</h2>

          <p className="mb-6">This Data Processing Agreement ("DPA") forms part of the Agreement for OmniOps Services
             (the "Principal Agreement") between:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded p-4 border">
              <h3 className="font-semibold mb-3">Data Controller:</h3>
              <div className="space-y-2 text-sm">
                <div>Company: _______________________</div>
                <div>Address: _______________________</div>
                <div>Contact: _______________________</div>
                <div className="text-gray-600">("Customer" or "Controller")</div>
              </div>
            </div>

            <div className="bg-white rounded p-4 border">
              <h3 className="font-semibold mb-3">Data Processor:</h3>
              <div className="space-y-2 text-sm">
                <div>Company: OmniOps</div>
                <div>Address: [Your Address]</div>
                <div>Contact: dpo@omniops.com</div>
                <div className="text-gray-600">("Processor" or "OmniOps")</div>
              </div>
            </div>
          </div>

          <p className="mt-6 text-center">
            <strong>Effective Date:</strong> _______________________
          </p>
        </section>

        <section id="definitions">
          <h2 className="text-2xl font-semibold mb-4">1. Definitions</h2>

          <h3 className="text-xl font-medium mb-3">1.1 GDPR Definitions</h3>
          <p>Terms not defined herein shall have the meanings given in the EU General Data Protection
             Regulation 2016/679 ("GDPR").</p>

          <h3 className="text-xl font-medium mb-3 mt-6">1.2 Agreement Definitions</h3>
          <ul>
            <li><strong>"Agreement":</strong> The Principal Agreement and this DPA</li>
            <li><strong>"Services":</strong> OmniOps AI-powered chat widget platform</li>
            <li><strong>"Personal Data":</strong> Any data processed under this Agreement relating to identified
                or identifiable natural persons</li>
            <li><strong>"Processing":</strong> Any operation performed on Personal Data</li>
            <li><strong>"Data Subject":</strong> Individual to whom Personal Data relates</li>
            <li><strong>"Sub-processor":</strong> Third party engaged by Processor to process Personal Data</li>
          </ul>
        </section>

        <section id="scope">
          <h2 className="text-2xl font-semibold mb-4">2. Scope and Purpose</h2>

          <h3 className="text-xl font-medium mb-3">2.1 Application</h3>
          <p>This DPA applies to all Processing of Personal Data by Processor on behalf of Controller
             in connection with the Services.</p>

          <h3 className="text-xl font-medium mb-3 mt-6">2.2 Purpose of Processing</h3>
          <p>Processor shall Process Personal Data only to provide the Services as described in the
             Principal Agreement and Annex 1.</p>

          <h3 className="text-xl font-medium mb-3 mt-6">2.3 Relationship of Parties</h3>
          <p>The Parties acknowledge that:</p>
          <ul>
            <li>Controller is the Data Controller</li>
            <li>Processor is the Data Processor</li>
            <li>Controller determines purposes and means of Processing</li>
            <li>Processor acts only on Controller's documented instructions</li>
          </ul>
        </section>

        <section id="processor-obligations">
          <h2 className="text-2xl font-semibold mb-4">3. Processor Obligations</h2>

          <div className="bg-green-50 border-l-4 border-green-400 p-4 my-6">
            <p className="font-semibold text-green-800 mb-2">Processor shall:</p>
            <ul className="space-y-2 text-sm text-green-700">
              <li>✅ Process Personal Data only on documented instructions from Controller</li>
              <li>✅ Ensure persons authorized to process Personal Data are bound by confidentiality</li>
              <li>✅ Implement appropriate technical and organizational measures</li>
              <li>✅ Assist Controller in responding to data subject requests</li>
              <li>✅ Make available all information necessary to demonstrate compliance</li>
              <li>✅ Delete or return Personal Data at Controller's choice upon termination</li>
              <li>✅ Notify Controller immediately if instructions infringe data protection laws</li>
            </ul>
          </div>
        </section>

        <section id="security">
          <h2 className="text-2xl font-semibold mb-4">5. Security Measures</h2>

          <h3 className="text-xl font-medium mb-3">5.1 Technical and Organizational Measures</h3>
          <p>Processor shall implement and maintain the security measures described in Annex 2, including:</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Technical Measures</h4>
              <ul className="text-sm space-y-1 text-blue-700">
                <li>• Encryption (TLS/AES-256)</li>
                <li>• Access controls</li>
                <li>• Network security</li>
                <li>• Vulnerability management</li>
                <li>• Backup procedures</li>
              </ul>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <h4 className="font-semibold text-purple-900 mb-2">Organizational Measures</h4>
              <ul className="text-sm space-y-1 text-purple-700">
                <li>• Staff training</li>
                <li>• Confidentiality agreements</li>
                <li>• Access policies</li>
                <li>• Incident response</li>
                <li>• Regular audits</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="subprocessors">
          <h2 className="text-2xl font-semibold mb-4">6. Sub-processors</h2>

          <h3 className="text-xl font-medium mb-3">6.1 Authorized Sub-processors</h3>
          <p>Controller agrees to the Sub-processors listed in Annex 3.</p>

          <h3 className="text-xl font-medium mb-3 mt-6">6.2 New Sub-processors</h3>
          <p>Processor shall:</p>
          <ul>
            <li>Notify Controller of intended changes concerning Sub-processors</li>
            <li>Provide Controller 30 days to object to changes</li>
            <li>Ensure Sub-processors are bound by equivalent obligations</li>
          </ul>
        </section>

        <section id="breaches">
          <h2 className="text-2xl font-semibold mb-4">8. Data Breaches</h2>

          <div className="bg-red-50 border-l-4 border-red-400 p-4 my-6">
            <p className="font-semibold text-red-800 mb-2">Breach Response Protocol:</p>
            <ol className="list-decimal pl-5 space-y-2 text-sm text-red-700">
              <li>Processor notifies Controller without undue delay (max 72 hours)</li>
              <li>Provide full details of the breach</li>
              <li>Assess impact and risk to data subjects</li>
              <li>Implement immediate containment measures</li>
              <li>Assist with regulatory notifications</li>
              <li>Document all actions taken</li>
              <li>Conduct post-incident review</li>
            </ol>
          </div>
        </section>

        <section id="annexes">
          <h2 className="text-2xl font-semibold mb-4">Annexes</h2>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3">Annex 1: Processing Details</h3>
            <p className="text-sm mb-2"><strong>Subject Matter:</strong> AI-powered customer service chat widget services</p>
            <p className="text-sm mb-2"><strong>Duration:</strong> Term of the Agreement</p>
            <p className="text-sm mb-2"><strong>Data Types:</strong> Contact info, chat logs, preferences, technical data</p>
            <p className="text-sm"><strong>Data Subjects:</strong> Website visitors, customers, employees</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold mb-3">Annex 2: Security Measures</h3>
            <ul className="text-sm space-y-1">
              <li>• <strong>Access:</strong> Role-based, MFA, regular reviews</li>
              <li>• <strong>Encryption:</strong> TLS 1.3+ transit, AES-256 at rest</li>
              <li>• <strong>Monitoring:</strong> 24/7 security, intrusion detection</li>
              <li>• <strong>Backup:</strong> Daily backups, point-in-time recovery</li>
              <li>• <strong>Testing:</strong> Annual penetration testing, regular audits</li>
            </ul>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">Annex 3: Sub-processors</h3>
            <p className="text-xs text-gray-600 mb-3">Subject to change with 30 days notice</p>
            <ul className="text-sm space-y-1">
              <li>• <strong>Supabase:</strong> Database hosting (USA)</li>
              <li>• <strong>OpenAI:</strong> AI processing (USA)</li>
              <li>• <strong>Vercel:</strong> Application hosting (Global)</li>
              <li>• <strong>Redis Labs:</strong> Caching services (USA)</li>
            </ul>
          </div>
        </section>

        <section className="mt-12 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-4">Signature Block</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <p className="font-semibold mb-4">For Controller:</p>
              <div className="space-y-2 text-sm">
                <div>Name: _______________________</div>
                <div>Title: _______________________</div>
                <div>Date: _______________________</div>
                <div>Signature: _______________________</div>
              </div>
            </div>
            <div>
              <p className="font-semibold mb-4">For Processor (OmniOps):</p>
              <div className="space-y-2 text-sm">
                <div>Name: _______________________</div>
                <div>Title: _______________________</div>
                <div>Date: _______________________</div>
                <div>Signature: _______________________</div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}