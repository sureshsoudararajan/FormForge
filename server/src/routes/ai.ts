import { Router, Request, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import Groq from 'groq-sdk';

const router = Router();

// Helper to call Groq API
async function callAI(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'llama-3.3-70b-versatile',
    temperature: 0.7,
    max_tokens: 4096,
  });

  return completion.choices[0]?.message?.content || '';
}

// Generate form from prompt
router.post('/generate-form', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemPrompt = `You are a form builder AI. Given a description, generate a JSON array of form fields.
Each field object must have these properties:
- id: a unique string (use lowercase with underscores like "full_name", "email_address")
- type: one of "text", "textarea", "dropdown", "radio", "checkbox", "date", "email", "number", "file"
- label: human-readable label
- placeholder: placeholder text (optional, empty string if not applicable)
- helpText: help text shown below the field (optional, empty string if not needed)
- required: boolean
- options: array of { id: string, label: string, value: string } (only for dropdown, radio, checkbox)

Generate a complete, professional form based on this description: "${prompt}"

Return ONLY the JSON array, no markdown, no explanation, no code fences.`;

    const result = await callAI(systemPrompt);

    // Try to parse the JSON from the response
    let schema;
    try {
      // Try direct parse first
      schema = JSON.parse(result);
    } catch {
      // Try to extract JSON from the response
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        schema = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    res.json({ schema });
  } catch (error: any) {
    console.error('Generate form error:', error);
    if (error.message === 'GROQ_API_KEY not configured') {
      return res.status(503).json({ error: 'AI service not configured. Please set GROQ_API_KEY.' });
    }
    res.status(500).json({ error: 'Failed to generate form' });
  }
});

// Suggest next field
router.post('/suggest-field', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { existingFields } = req.body;

    const fieldsSummary = (existingFields || [])
      .map((f: any) => `${f.label} (${f.type})`)
      .join(', ');

    const prompt = `You are a form builder AI assistant. The user is building a form that currently has these fields: ${fieldsSummary || 'none yet'}.

Suggest the ONE most logical next field to add. Return a single JSON object with these properties:
- id: unique string
- type: one of "text", "textarea", "dropdown", "radio", "checkbox", "date", "email", "number", "file"
- label: human-readable label
- placeholder: placeholder text
- helpText: empty string
- required: boolean
- options: array of { id: string, label: string, value: string } (only if type is dropdown, radio, or checkbox, otherwise omit)

Return ONLY the JSON object, no markdown, no explanation, no code fences.`;

    const result = await callAI(prompt);

    let field;
    try {
      field = JSON.parse(result);
    } catch {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        field = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    res.json({ field });
  } catch (error: any) {
    console.error('Suggest field error:', error);
    if (error.message === 'GROQ_API_KEY not configured') {
      return res.status(503).json({ error: 'AI service not configured. Please set GROQ_API_KEY.' });
    }
    res.status(500).json({ error: 'Failed to suggest field' });
  }
});

// Summarize responses
router.post('/summarize', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { formTitle, fields, responses } = req.body;

    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: 'No responses to summarize' });
    }

    const fieldMap = (fields || []).reduce((acc: any, f: any) => {
      acc[f.id] = f.label;
      return acc;
    }, {});

    const responseSummaries = responses.slice(0, 50).map((r: any, i: number) => {
      const entries = Object.entries(r.data || r)
        .map(([key, val]) => `${fieldMap[key] || key}: ${val}`)
        .join(', ');
      return `Response ${i + 1}: ${entries}`;
    });

    const prompt = `Analyze these form responses for "${formTitle || 'a form'}":

${responseSummaries.join('\n')}

Provide a concise analysis with:
1. **Key Themes**: Common patterns across responses
2. **Notable Insights**: Interesting or surprising findings
3. **Summary Statistics**: Brief overview of response trends
4. **Recommendations**: Actionable suggestions based on the data

Format as clean bullet points. Be concise but insightful.`;

    const result = await callAI(prompt);
    res.json({ summary: result });
  } catch (error: any) {
    console.error('Summarize error:', error);
    if (error.message === 'GROQ_API_KEY not configured') {
      return res.status(503).json({ error: 'AI service not configured. Please set GROQ_API_KEY.' });
    }
    res.status(500).json({ error: 'Failed to summarize responses' });
  }
});

// Auto-fix field labels
router.post('/fix-labels', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { fields } = req.body;

    const fieldsSummary = (fields || [])
      .map((f: any) => `{ id: "${f.id}", type: "${f.type}", currentLabel: "${f.label}" }`)
      .join(',\n');

    const prompt = `Review these form field labels and suggest better, more professional labels for any vague ones (like "q1", "field1", "untitled", etc.). Keep already good labels unchanged.

Fields:
${fieldsSummary}

Return a JSON array where each item has:
- id: the field id (same as input)
- suggestedLabel: the improved label (or the same label if it's already good)
- changed: boolean indicating if the label was changed

Return ONLY the JSON array, no markdown, no explanation, no code fences.`;

    const result = await callAI(prompt);

    let suggestions;
    try {
      suggestions = JSON.parse(result);
    } catch {
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response');
      }
    }

    res.json({ suggestions });
  } catch (error: any) {
    console.error('Fix labels error:', error);
    if (error.message === 'GROQ_API_KEY not configured') {
      return res.status(503).json({ error: 'AI service not configured. Please set GROQ_API_KEY.' });
    }
    res.status(500).json({ error: 'Failed to fix labels' });
  }
});

// FormMorph: Pick next question
router.post('/next-question', async (req: Request, res: Response) => {
  try {
    const { questions, answers } = req.body;

    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'Questions array required' });
    }

    const answeredIds = answers.map((a: any) => a.questionId);
    const remainingQuestions = questions.filter((q: any) => !answeredIds.includes(q.id));

    if (remainingQuestions.length === 0) {
      return res.json({ nextQuestionId: null });
    }

    // If no AI logic needed (e.g. strict linear form without hints), just return the next one
    const needsAi = questions.some((q: any) => q.hint && q.hint.trim().length > 0);
    if (!needsAi) {
      return res.json({ nextQuestionId: remainingQuestions[0].id });
    }

    const prompt = `You are a conversational form engine. Your job is to pick the NEXT question to ask based on the user's previous answers and the conditional logic hints provided by the form creator.

PREVIOUS ANSWERS:
${JSON.stringify(answers, null, 2)}

REMAINING QUESTIONS TO CHOOSE FROM:
${JSON.stringify(remainingQuestions, null, 2)}

RULES:
1. Analyze the 'hint' field of the remaining questions. The hint contains instructions on WHEN to ask that question (e.g., "only if they said yes to previous").
2. Compare the hints against the PREVIOUS ANSWERS.
3. If a question's hint condition is NOT met, skip it.
4. From the remaining valid questions, pick the most logical next one (usually the first valid one in order).
5. If NO questions are valid/remaining, return null.

Return ONLY a JSON object with a single property "nextQuestionId" set to the ID string of the chosen question (or null). No markdown, no explanation.`;

    const result = await callAI(prompt);
    
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { nextQuestionId: remainingQuestions[0].id };
    }

    res.json({ nextQuestionId: parsed.nextQuestionId });
  } catch (error: any) {
    console.error('Next question error:', error);
    res.status(500).json({ error: 'Failed to pick next question' });
  }
});

// FormMorph: Rephrase question in a specific tone
router.post('/rephrase', async (req: Request, res: Response) => {
  try {
    const { question, tone, isFirst } = req.body;

    if (!question || !tone || tone === 'standard') {
      return res.json({ rephrased: question });
    }

    const prompt = `Rewrite this form question naturally using a ${tone} tone.
Original question: "${question}"
${isFirst ? 'This is the FIRST question in the conversation, so include a very brief, natural greeting.' : ''}

RULES:
- Keep the core meaning and intent EXACTLY the same.
- Make it sound human and conversational, like a chat message.
- For a "friendly" tone, be warm but concise.
- For a "professional" tone, be polite and direct.
- For a "casual" tone, be relaxed and colloquial.
- For an "empathetic" tone, be understanding and gentle.
- Return ONLY the rewritten question string. No quotes, no markdown, no explanation.`;

    const result = await callAI(prompt);
    // clean up any potential quotes AI might add
    const cleanResult = result.replace(/^["']|["']$/g, '').trim();
    
    res.json({ rephrased: cleanResult || question });
  } catch (error: any) {
    console.error('Rephrase error:', error);
    res.json({ rephrased: req.body.question }); // Fallback to original on error
  }
});

// FormMorph: Parse open-ended answer into structured data
router.post('/parse-answer', async (req: Request, res: Response) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ error: 'Question and answer required' });
    }

    const prompt = `You are a data extraction AI. A user was asked this question in a form:
"${question}"

The user provided this conversational answer:
"${answer}"

Task: Extract the core data value(s) from their answer as concisely as possible, removing the conversational fluff. 
If the question implies a number, boolean, or specific category, extract just that.
If it's a truly open-ended text response, summarize the main point concisely.

Return ONLY a JSON object with a single property "parsed" containing the extracted primitive value (string, number, boolean, or array). No markdown, no explanation.`;

    const result = await callAI(prompt);
    
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      parsed = match ? JSON.parse(match[0]) : { parsed: answer };
    }

    res.json({ parsed: parsed.parsed });
  } catch (error: any) {
    console.error('Parse answer error:', error);
    res.json({ parsed: req.body.answer }); // Fallback to raw on error
  }
});

// FormMorph: Full Analytics (Summary, Sentiment, Clusters)
router.post('/analyze', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { formTitle, questions, responses } = req.body;

    if (!responses || responses.length === 0) {
      return res.status(400).json({ error: 'No responses to analyze' });
    }

    const prompt = `Analyze these form responses for "${formTitle || 'a form'}" to power an analytics dashboard.

QUESTIONS:
${JSON.stringify(questions, null, 2)}

RESPONSES:
${JSON.stringify(responses.slice(0, 30), null, 2)} // Limit to 30 for token limits

Task: Provide a comprehensive JSON analysis.
Format exactly as this JSON structure:
{
  "summary": "A cohesive 3-4 sentence paragraph summarizing the overall sentiment and key takeaways from all responses. Write this like an executive summary.",
  "sentiment": {
    "positive": 60, // percentage (0-100)
    "neutral": 30,  // percentage (0-100)
    "negative": 10  // percentage (0-100)
  },
  "clusters": [
    { "name": "Theme Name (e.g., Feature Requests)", "count": 5, "description": "Brief description of this theme" }
  ],
  "anomalies": [
    "Any weird, spammy, or highly unusual responses (if none, empty array)"
  ]
}

Return ONLY the JSON object. No markdown, no explanation, no code fences.`;

    const result = await callAI(prompt);
    
    let parsed;
    try {
      parsed = JSON.parse(result);
    } catch {
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Failed to parse analytics JSON');
      }
    }

    res.json(parsed);
  } catch (error: any) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});

export default router;
