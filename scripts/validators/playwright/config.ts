import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

export const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
