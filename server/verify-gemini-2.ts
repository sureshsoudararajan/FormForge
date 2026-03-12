import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import process from 'process';

dotenv.config({ path: path.resolve('/home/suresh/Documents/FormForge/server/.env') });

async function verify() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('No GEMINI_API_KEY found');
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  try {
    console.log('Testing model: gemini-2.0-flash...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    const result = await model.generateContent("Hello, say 'Gemini 2.0 is working'");
    console.log('Result:', result.response.text());
    console.log('SUCCESS: gemini-2.0-flash is working!');
  } catch (error: any) {
    console.error('FAILED:', error.message);
    if (error.status === 404) {
      console.log('Still getting 404. Let check the URL manually in code.');
    }
  }
}

verify();
