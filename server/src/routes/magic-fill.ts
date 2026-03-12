import { Router, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
import Groq from 'groq-sdk';

const router = Router();

async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY not configured');
  const groq = new Groq({ apiKey });
  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.1, // Low temperature for extraction
  });
  return completion.choices[0]?.message?.content || '';
}

router.post('/parse-document', async (req: Request, res: Response) => {
  try {
    const { filePath, questions } = req.body;
    if (!filePath || !questions) {
      return res.status(400).json({ error: 'filePath and questions are required' });
    }

    const absolutePath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ error: 'File not found' });
    }

    let text = '';
    const fileExt = path.extname(absolutePath).toLowerCase();

    if (fileExt === '.pdf') {
      const dataBuffer = fs.readFileSync(absolutePath);
      const data = await pdf(dataBuffer);
      text = data.text;
    } else {
      text = fs.readFileSync(absolutePath, 'utf8');
    }

    const prompt = `You are a data extraction AI. Extract information from the provided text to answer these form questions.
    
    FORM QUESTIONS:
    ${JSON.stringify(questions, null, 2)}
    
    TEXT FROM DOCUMENT:
    ${text.substring(0, 5000)} // Limit to avoid token issues
    
    Return a JSON object where keys are the question IDs and values are the extracted data. 
    If you can't find an answer for a question, omit it from the JSON.
    Return ONLY the JSON object. No markdown, no explanation.`;

    const result = await callAI(prompt);
    let mapping = {};
    try {
      mapping = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) mapping = JSON.parse(match[0]);
    }

    res.json({ mapping });
  } catch (error) {
    console.error('Magic fill error:', error);
    res.status(500).json({ error: 'Failed to parse document' });
  }
});

export default router;
