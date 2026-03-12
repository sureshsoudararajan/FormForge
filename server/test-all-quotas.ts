import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
import * as path from 'path';
import process from 'process';

dotenv.config({ path: path.resolve('/home/suresh/Documents/FormForge/server/.env') });

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey!);

async function test(modelName: string) {
  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const result = await model.generateContent("Say 'ok'");
    console.log(`[WORKING] ${modelName}: ${result.response.text().trim()}`);
    return true;
  } catch (e: any) {
    console.log(`[ERROR] ${modelName}: ${e.status} - ${e.message.substring(0, 100)}`);
    return false;
  }
}

async function run() {
  const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-8b',
    'gemini-1.5-pro',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite',
    'gemini-flash-latest'
  ];
  for (const m of models) {
    await test(m);
  }
}

run();
