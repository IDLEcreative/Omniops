import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkTableColumns() {
  // Check if structured_extractions table exists and get its columns
  const { data, error } = await supabase
    .from('structured_extractions')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('Error or table does not exist:', error.message);
  } else {
    console.log('Table exists. Sample row:', data);
    if (data && data.length > 0) {
      console.log('Columns:', Object.keys(data[0]));
    }
  }
}

checkTableColumns();