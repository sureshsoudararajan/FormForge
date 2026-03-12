import { Router, Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Start a new conversational session
router.post('/start/:shareToken', async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;

    const form = await prisma.form.findUnique({
      where: { shareToken },
      select: { id: true, title: true, tone: true, questions: true, published: true }
    });

    if (!form || !form.published) {
      return res.status(404).json({ error: 'Form not found or not published' });
    }

    const questions = JSON.parse(form.questions);
    if (!questions || questions.length === 0) {
      return res.status(400).json({ error: 'Form has no questions' });
    }

    const session = await prisma.session.create({
      data: {
        formId: form.id,
        answers: '[]',
        completed: false
      }
    });

    res.json({
      sessionId: session.id,
      formTitle: form.title,
      tone: form.tone,
      firstQuestion: questions[0],
      allQuestions: questions
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Failed to start session' });
  }
});

// Submit an answer and get the next question
router.post('/:sessionId/answer', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { questionId, rawAnswer, parsedAnswer, sentiment, nextQuestion } = req.body;

    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { form: true }
    });

    if (!session || session.completed) {
      return res.status(400).json({ error: 'Invalid or completed session' });
    }

    // Append the new answer to the existing array
    const existingAnswers = JSON.parse(session.answers);
    const updatedAnswers = [
      ...existingAnswers, 
      { questionId, raw: rawAnswer, parsed: parsedAnswer, sentiment, submittedAt: new Date().toISOString() }
    ];

    await prisma.session.update({
      where: { id: sessionId },
      data: { answers: JSON.stringify(updatedAnswers) }
    });

    // PICK THE NEXT QUESTION
    const questions = JSON.parse(session.form.questions);
    const answeredIds = updatedAnswers.map((a: any) => a.questionId);
    const remainingQuestions = questions.filter((q: any) => !answeredIds.includes(q.id));

    if (remainingQuestions.length === 0) {
      res.json({ done: true });
    } else {
      // For now, simpler linear logic unless we want to call the AI endpoint here
      // To keep it robust, we just take the next one in line
      res.json({ done: false, nextQuestion: remainingQuestions[0] });
    }

  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Mark session as complete
router.post('/:sessionId/complete', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = await prisma.session.update({
      where: { id: sessionId },
      data: { 
        completed: true,
        completedAt: new Date()
      },
      include: { form: true }
    });

    // Also save this officially as a Response for the dashboard
    const answers = JSON.parse(session.answers);
    const responseData = answers.reduce((acc: any, ans: any) => {
      acc[ans.questionId] = ans.parsed || ans.raw;
      return acc;
    }, {});

    await prisma.response.create({
      data: {
        formId: session.formId,
        data: JSON.stringify(responseData)
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ error: 'Failed to complete session' });
  }
});

export default router;
