export const testQueries = [
  // Simple queries
  'motor price',
  'broken engine',
  'how to install',

  // Complex queries with entities
  'TENG-40DV motor not working need replacement',
  'Bosch PWS 700-115 angle grinder warranty claim',
  'Milwaukee M18 battery charger under $50',

  // Long queries
  "I have a problem with my motor it's making a strange noise when I turn it on and I think it might be broken can you help me fix it or do I need to buy a new one",

  // Queries with typos
  'moter instalation guid waranty',

  // Technical queries
  '12V 5A motor controller RPM adjustment troubleshooting',

  // Comparison queries
  'dewalt vs milwaukee impact driver comparison best price'
];

export const testDocuments = [
  // Short document
  'This is a simple product description. The motor has 500W power.',

  // Medium document with structure
  `# Product Manual

## Installation Guide
Follow these steps to install your new motor:
1. Remove the old motor
2. Clean the mounting area
3. Install the new motor
4. Test the connections

## Troubleshooting
Q: Motor not starting?
A: Check the power supply and connections.

Q: Strange noise?
A: Inspect bearings for damage.`,

  // Long document (simulate with repetition)
  Array(100)
    .fill(`
    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
    Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
    - Feature 1: High performance
    - Feature 2: Energy efficient
    - Feature 3: Quiet operation
  `)
    .join('\n'),

  // Complex HTML structure
  `<html><body>
    <div class="product">
      <h2>TENG-40DV Motor</h2>
      <p>Professional grade motor with variable speed control.</p>
      <ul>
        <li>Power: 750W</li>
        <li>Speed: 0-3000 RPM</li>
        <li>Weight: 2.5kg</li>
      </ul>
      <table>
        <tr><td>SKU</td><td>TENG-40DV</td></tr>
        <tr><td>Price</td><td>$299.99</td></tr>
      </table>
    </div>
  </body></html>`
];
