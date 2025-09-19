// Direct test of the search functionality
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { getProductOverview } from './lib/search-overview';

async function testMetadata() {
  console.log('Testing metadata extraction for "pumps"...\n');
  
  const overview = await getProductOverview('pumps', 'thompsonseparts.co.uk');
  
  console.log('Result:', JSON.stringify(overview, null, 2));
}

testMetadata().catch(console.error);
