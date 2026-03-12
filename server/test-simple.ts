
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('/home/suresh/Documents/FormForge/server/.env') });

console.log('API Key:', process.env.GEMINI_API_KEY ? 'Present' : 'Missing');
console.log('Testing output...');
