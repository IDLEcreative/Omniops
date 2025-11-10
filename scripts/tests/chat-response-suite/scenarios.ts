export interface TestScenario {
  id: string;
  query: string;
  description: string;
  expectedBehavior: string;
  concerns: string[];
}

export const TEST_SCENARIOS: TestScenario[] = [
  {
    id: 'cifa_mixer_pump',
    query: 'Need a pump for my Cifa mixer',
    description: 'Check if it shows all Cifa pumps or just one',
    expectedBehavior: 'Should show multiple Cifa pump options immediately',
    concerns: ['Limited product display', 'Not showing full inventory']
  },
  {
    id: 'teng_torque_wrenches',
    query: 'Teng torque wrenches',
    description: 'Check if external sites are suggested',
    expectedBehavior: 'Should only show internal products/pages, no external links',
    concerns: ['External site recommendations', 'Competitor links']
  },
  {
    id: 'kinshofer_pin_bush',
    query: 'Kinshofer pin & bush kit',
    description: 'Check response length and external links',
    expectedBehavior: 'Concise response with internal links only',
    concerns: ['Response too verbose', 'External links present']
  },
  {
    id: 'sku_recognition',
    query: 'DC66-10P',
    description: 'Test SKU recognition',
    expectedBehavior: 'Should recognize and show specific product by SKU',
    concerns: ['SKU not recognized', 'Generic response instead of specific product']
  },
  {
    id: 'sheet_roller_bar',
    query: 'sheet roller bar',
    description: 'Check if it asks too many questions vs showing category',
    expectedBehavior: 'Should show available products first, minimal questioning',
    concerns: ['Too many clarifying questions', 'Not showing available options']
  },
  {
    id: 'starter_charger_price',
    query: 'Price on a starter charger',
    description: 'Check currency (should be GBP not USD) and external links',
    expectedBehavior: 'Show GBP prices, no external links',
    concerns: ['USD instead of GBP', 'External site links']
  },
  {
    id: 'body_filler_price',
    query: 'Price on Body Filler',
    description: 'Check for American products and external links',
    expectedBehavior: 'Show UK/relevant products only, no external links',
    concerns: ['American products suggested', 'External links to competitors']
  }
];
