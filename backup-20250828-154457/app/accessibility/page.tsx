export default function AccessibilityPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6 prose prose-gray">
      <h1>Accessibility Statement</h1>
      <p>Last updated: {new Date().toLocaleDateString()}</p>

      <h2>Our Commitment</h2>
      <p>
        We are committed to ensuring digital accessibility for people with disabilities. 
        We continually improve the user experience for everyone and apply relevant 
        accessibility standards.
      </p>

      <h2>Conformance Status</h2>
      <p>
        The Web Content Accessibility Guidelines (WCAG) defines requirements for 
        designers and developers to improve accessibility. It has three levels: 
        Level A, Level AA, and Level AAA. Our chat widget is partially conformant 
        with WCAG 2.1 level AA.
      </p>

      <h2>Widget Accessibility Features</h2>
      <ul>
        <li>Keyboard navigation support</li>
        <li>Screen reader compatibility</li>
        <li>ARIA labels and roles</li>
        <li>High contrast mode support</li>
        <li>Focus indicators</li>
        <li>Resizable text</li>
      </ul>

      <h2>Known Limitations</h2>
      <ul>
        <li>Some dynamic content may not announce properly to screen readers</li>
        <li>Complex animations can be distracting for some users</li>
        <li>Voice input not yet supported</li>
      </ul>

      <h2>Keyboard Shortcuts</h2>
      <ul>
        <li><kbd>Tab</kbd> - Navigate through interactive elements</li>
        <li><kbd>Enter</kbd> - Send message or activate buttons</li>
        <li><kbd>Escape</kbd> - Close the chat widget</li>
        <li><kbd>Arrow keys</kbd> - Navigate through message history</li>
      </ul>

      <h2>Feedback</h2>
      <p>
        We welcome your feedback on the accessibility of our chat widget. 
        Please contact us at accessibility@[yourdomain].com if you encounter barriers.
      </p>

      <h2>European Accessibility Act Compliance</h2>
      <p>
        By June 25, 2025, this service will be fully compliant with the European 
        Accessibility Act requirements. We are actively working on improvements.
      </p>
    </div>
  );
}