export default function TermsPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6 prose prose-gray">
      <h1>Terms of Service</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>
      <p>
        By using our AI Customer Service Chat Widget service ("Service"), you agree to these Terms of Service ("Terms").
        If you disagree with any part of these terms, please do not use our Service.
      </p>

      <h2>1. Service Description</h2>
      <p>
        Our Service provides an embeddable AI-powered chat widget that can be integrated into websites to provide
        automated customer support. The Service includes website content scraping, AI response generation, and
        analytics features.
      </p>

      <h2>2. Account Registration</h2>
      <ul>
        <li>You must provide accurate and complete information during registration</li>
        <li>You are responsible for maintaining the security of your account credentials</li>
        <li>You must notify us immediately of any unauthorized access</li>
        <li>One account per business entity is permitted</li>
      </ul>

      <h2>3. Acceptable Use</h2>
      <p>You agree NOT to use the Service to:</p>
      <ul>
        <li>Violate any laws or regulations</li>
        <li>Infringe on intellectual property rights</li>
        <li>Transmit malicious code or interfere with the Service</li>
        <li>Collect personal information without consent</li>
        <li>Impersonate others or provide false information</li>
        <li>Use the Service for illegal, harmful, or offensive purposes</li>
      </ul>

      <h2>4. Content and Data</h2>
      <h3>Your Content</h3>
      <ul>
        <li>You retain ownership of content you provide</li>
        <li>You grant us a license to use your content to provide the Service</li>
        <li>You are responsible for ensuring you have rights to all content</li>
      </ul>
      
      <h3>AI-Generated Content</h3>
      <ul>
        <li>AI responses are provided "as is" without warranty</li>
        <li>You are responsible for reviewing AI responses for accuracy</li>
        <li>We are not liable for errors or inaccuracies in AI responses</li>
      </ul>

      <h2>5. Pricing and Payment</h2>
      <ul>
        <li>Free tier: Up to 100 messages per month</li>
        <li>Paid plans: As described on our pricing page</li>
        <li>Payments are processed securely through our payment provider</li>
        <li>Fees are non-refundable except as required by law</li>
      </ul>

      <h2>6. API Usage and Limits</h2>
      <ul>
        <li>Rate limits apply as specified in your plan</li>
        <li>Excessive usage may result in temporary suspension</li>
        <li>API keys must be kept confidential</li>
        <li>We reserve the right to modify limits with notice</li>
      </ul>

      <h2>7. Privacy and Data Protection</h2>
      <ul>
        <li>We handle data according to our Privacy Policy</li>
        <li>You must comply with applicable data protection laws</li>
        <li>You are responsible for obtaining necessary consents from end users</li>
      </ul>

      <h2>8. Intellectual Property</h2>
      <ul>
        <li>The Service and its original content remain our property</li>
        <li>Our trademarks and branding may not be used without permission</li>
        <li>Feedback and suggestions may be used without compensation</li>
      </ul>

      <h2>9. Third-Party Services</h2>
      <p>Our Service integrates with:</p>
      <ul>
        <li>OpenAI for AI responses</li>
        <li>Playwright and Crawlee for web scraping</li>
        <li>Supabase for data storage</li>
        <li>Optional: WooCommerce for e-commerce features</li>
      </ul>
      <p>Third-party services have their own terms which you must comply with.</p>

      <h2>10. Disclaimers and Limitations</h2>
      <ul>
        <li>The Service is provided "AS IS" without warranties</li>
        <li>We do not guarantee uninterrupted or error-free service</li>
        <li>We are not liable for indirect, incidental, or consequential damages</li>
        <li>Our total liability is limited to fees paid in the last 12 months</li>
      </ul>

      <h2>11. Indemnification</h2>
      <p>
        You agree to indemnify and hold us harmless from claims arising from your use of the Service,
        violation of these Terms, or infringement of any rights.
      </p>

      <h2>12. Termination</h2>
      <ul>
        <li>Either party may terminate with 30 days notice</li>
        <li>We may suspend or terminate immediately for Terms violations</li>
        <li>Upon termination, your access will be revoked</li>
        <li>You may export your data before termination</li>
      </ul>

      <h2>13. Changes to Terms</h2>
      <ul>
        <li>We may update these Terms with 30 days notice</li>
        <li>Continued use after changes constitutes acceptance</li>
        <li>Material changes will be communicated via email</li>
      </ul>

      <h2>14. Governing Law</h2>
      <p>
        These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.
        Any disputes shall be resolved in the courts of [Your Jurisdiction].
      </p>

      <h2>15. Support and Contact</h2>
      <ul>
        <li>Technical support: support@[yourdomain].com</li>
        <li>Legal inquiries: legal@[yourdomain].com</li>
        <li>General inquiries: hello@[yourdomain].com</li>
      </ul>

      <h2>16. Severability</h2>
      <p>
        If any provision of these Terms is found unenforceable, the remaining provisions will continue in effect.
      </p>

      <h2>17. Entire Agreement</h2>
      <p>
        These Terms constitute the entire agreement between you and us regarding the Service and supersede
        all prior agreements.
      </p>
    </div>
  );
}