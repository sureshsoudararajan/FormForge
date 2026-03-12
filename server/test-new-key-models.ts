import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import process from 'process';

dotenv.config({ path: path.resolve('/home/suresh/Documents/FormForge/server/.env') });

const apiKey = process.env.GEMINI_API_KEY;

async function testCombination(modelName: string) {
  try {
    const genAI = new GoogleGenerativeAI(apiKey!);
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Hello!");
    console.log(`[PASS] ${modelName}: ${result.response.text().substring(0, 20)}...`);
    return true;
  } catch (e: any) {
    console.log(`[FAIL] ${modelName}: Status ${e.status} - ${e.message.substring(0, 100)}`);
    return false;
  }
}

async function run() {
  console.log('Testing with new API Key...');
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-pro',
    'gemini-2.0-flash-exp',
    'gemini-exp-1206',
    'learnlm-1.5-pro-experimental'
  ];
  
  for (const m of models) {
    await testCombination(m);
  }
}

run();
