export default function PrivacyPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6 prose prose-gray">
      <h1>Privacy Policy</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>Data Collection</h2>
      <p>Our chat widget collects:</p>
      <ul>
        <li>Chat messages and conversations</li>
        <li>Session identifiers (no personal data required)</li>
        <li>Website domain where widget is installed</li>
        <li>Basic usage analytics</li>
      </ul>

      <h2>Data Storage</h2>
      <ul>
        <li>All data is stored securely in Supabase (PostgreSQL)</li>
        <li>Customer API keys are encrypted</li>
        <li>Conversations are isolated by domain</li>
        <li>We do not sell or share data with third parties</li>
      </ul>

      <h2>Data Retention</h2>
      <ul>
        <li>Conversations: 90 days</li>
        <li>Website content: Until manually refreshed</li>
        <li>Analytics: 180 days</li>
      </ul>

      <h2>User Rights</h2>
      <p>Users can request:</p>
      <ul>
        <li>Export of their data</li>
        <li>Deletion of their data</li>
        <li>Correction of their data</li>
      </ul>

      <h2>Cookies</h2>
      <p>We use minimal cookies for:</p>
      <ul>
        <li>Session management</li>
        <li>Chat persistence across page reloads</li>
      </ul>

      <h2>Third-Party Services</h2>
      <ul>
        <li>OpenAI - for generating responses</li>
        <li>Playwright and Crawlee - for website content scraping</li>
        <li>Supabase - for data storage</li>
      </ul>

      <h2>Contact</h2>
      <p>For privacy concerns: privacy@[yourdomain].com</p>
    </div>
  );
}