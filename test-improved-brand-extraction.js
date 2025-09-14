/**
 * Test improved brand extraction on real Thompson's eParts titles
 */

// Simulate the improved extractBrand function
function extractBrand(titleText) {
  if (!titleText) return null;
  
  // Remove common suffixes first
  const cleanTitle = titleText
    .replace(/\s*[-–—]\s*Thompsons?\s+E\s+Parts?\s*$/i, '')
    .replace(/\s*[-–—]\s*Page not found\s*$/i, '')
    .trim();
  
  // Pattern 1: All caps word(s) at the beginning (CIFA, PARKER, BAWER, TS)
  const allCapsMatch = cleanTitle.match(/^([A-Z]{2,}(?:[A-Z0-9-]*)?(?:\s+[A-Z]{2,})?)/);
  if (allCapsMatch && allCapsMatch[1].length <= 30) {
    const brand = allCapsMatch[1].trim();
    // Filter out generic terms
    if (!brand.match(/^(ONLY|NOT|INC|MK\d+|DC|AC)$/)) {
      return brand;
    }
  }
  
  // Pattern 2: Brand/Brand format (Binotto/OMFB)
  const slashMatch = cleanTitle.match(/^([A-Z][A-Za-z]+\/[A-Z][A-Za-z]+)/);
  if (slashMatch) {
    return slashMatch[1];
  }
  
  // Pattern 3: Known brands at start (case insensitive)
  const knownBrands = [
    'TENG', 'Teng Tools', 'CIFA', 'PARKER', 'Parker', 'BAWER', 'Bawer',
    'Sealey', 'Palfinger', 'Binotto', 'OMFB', 'Thompsons', 'Thompson',
    'Edbro', 'Bosch', 'Makita', 'DeWalt', 'Stanley', 'Black & Decker',
    'Black&Decker', 'Ryobi', 'Milwaukee', 'Festool', 'Hilti', 'Metabo',
    'Draper', 'Faithfull', 'Silverline', 'Clarke', 'Wolf', 'Einhell'
  ];
  
  for (const brand of knownBrands) {
    const regex = new RegExp('^' + brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    if (cleanTitle.match(regex)) {
      return brand;
    }
  }
  
  // Pattern 4: Word before specific product types
  const productTypeMatch = cleanTitle.match(/^([A-Z][A-Za-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:Tools|Mixer|Pump|Valve|Tank|Ram|Solenoid|Kit|System)/i);
  if (productTypeMatch) {
    const potentialBrand = productTypeMatch[1].trim();
    // Filter out generic descriptive words
    if (!potentialBrand.match(/^(Hydraulic|Electric|Manual|Heavy|Light|Medium|Standard|Digital|Rubber|Plastic|Steel|Metal)$/i)) {
      return potentialBrand;
    }
  }
  
  // Pattern 5: Extract from "for Brand" or "to fit Brand" patterns
  const fitMatch = cleanTitle.match(/(?:for|to\s+fit|suit|suits?)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][a-z]+)?)/i);
  if (fitMatch) {
    const brand = fitMatch[1].trim();
    if (!brand.match(/^(all|any|most|standard|universal)$/i)) {
      return brand;
    }
  }
  
  // Pattern 6: Dash pattern but more flexible
  const dashMatch = cleanTitle.match(/^([A-Z][A-Za-z0-9\s&\/.-]+?)\s*[-–—]\s*/);
  if (dashMatch && dashMatch[1].length < 40) {
    const potentialBrand = dashMatch[1].trim();
    // Filter out product descriptions that aren't brands
    if (!potentialBrand.match(/^\d+|^(Genuine|Complete|Full|New|Used|Spare)/i)) {
      return potentialBrand;
    }
  }
  
  return null;
}

// Test titles from actual Thompson's eParts products
const testTitles = [
  'CIFA Mixer Pressure Reducer - Thompsons E Parts',
  'PARKER DC SOLENOID P2FCB349 - Thompsons E Parts',
  'BAWER series Euroinox Stainless Steel Toolbox Lock with Plastic catch - Thompsons E Parts',
  'Binotto/OMFB 21ltr Oil Tank - Thompsons E Parts',
  'Sealey Creeper Board Spare wheel - Thompsons E Parts',
  'Edbro CX15 4 Stage Ram & Tank only - Thompsons E Parts',
  'Palfinger 140ltr Oil Tank - Steel, (**Return pipe not inc) As fitted to 8x4 Chassis - Thompsons E Parts',
  'TS Standard HVDS (High Voltage Detection System) MK2 12/24v - Thompsons E Parts',
  'Thompsons (Side) Under-Run protection (Volvo) Tank Pressed Bracket - Thompsons E Parts',
  'TENG Tools 9 Pce TX Torx Driver and Bit Set - Thompsons E Parts',
  'Mixer Pressure Reducer c/w Gauge to fit Cifa Truck Mixer - Thompsons E Parts',
  'Rubber Strap Roll Set for Palfinger 140ltr Tank - Thompsons E Parts',
  'Hydraulic Tipper Valve 150 L/M - 9041890/3 - BZDP150 - Thompsons E Parts',
  '24v Powerpack Starter Solenoid Switch DC ( Round) - Thompsons E Parts',
  'Medium Duty Rotalock Shoot Bolt - Ø19/12.5mm Stroke - Thompsons E Parts',
  'Thompsons VCA Approved RURP Beam Attachment Arm Kit - Thompsons E Parts',
  'Hydraulic Ram Seal Kit to Suit Binotto Front Tipping Gears - Thompsons E Parts',
  'Complete Pin & Bush Kit to Fit Kinshofer KM602 - Thompsons E Parts',
  'ASP Crane Sheet System Side Plate - Thompsons E Parts',
  'HMF Crane Remote Control Transmitter - Thompsons E Parts'
];

console.log('🧪 Testing Improved Brand Extraction');
console.log('=' .repeat(60));
console.log('');

let successCount = 0;
let failures = [];

testTitles.forEach(title => {
  const brand = extractBrand(title);
  const hasExpectedBrand = title.match(/^(CIFA|PARKER|BAWER|Binotto|OMFB|Sealey|Edbro|Palfinger|TS|TENG|Thompsons|HMF|ASP|Kinshofer)/i);
  
  if (brand) {
    successCount++;
    console.log(`✅ "${title.substring(0, 50)}..."`);
    console.log(`   → Brand: ${brand}`);
  } else if (hasExpectedBrand) {
    failures.push(title);
    console.log(`❌ "${title.substring(0, 50)}..."`);
    console.log(`   → No brand found (expected: ${hasExpectedBrand[1]})`);
  } else {
    console.log(`⚪ "${title.substring(0, 50)}..."`);
    console.log(`   → No clear brand in title`);
  }
});

console.log('');
console.log('📊 Results Summary:');
console.log('=' .repeat(60));
console.log(`Success rate: ${successCount}/${testTitles.length} (${(successCount/testTitles.length*100).toFixed(1)}%)`);
console.log('');

if (failures.length > 0) {
  console.log('Failed extractions:');
  failures.forEach(title => {
    console.log(`  - ${title}`);
  });
}