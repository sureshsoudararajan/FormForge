
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve('/home/suresh/Documents/FormForge/server/.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function listModels() {
  try {
    const genAI = new GoogleGenerativeAI(apiKey!);
    // The SDK doesn't have a direct listModels, but we can try to find how to do it or just try common ones.
    // Actually, let's try a few more variants and log full errors.
    const models = [
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-1.0-pro',
      'gemini-pro',
      'gemini-pro-vision'
    ];
    
    for (const modelName of models) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("test");
        console.log(`[OK] ${modelName}: ${result.response.text().substring(0, 20)}`);
      } catch (e: any) {
        console.log(`[ERR] ${modelName}: ${e.status} ${e.message}`);
      }
    }
  } catch (error) {
    console.error('List models error:', error);
  }
}

listModels();
