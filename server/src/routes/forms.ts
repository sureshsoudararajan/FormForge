import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Get all forms for the authenticated user
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const forms = await prisma.form.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { responses: true } } },
    });

    const result = forms.map((f) => ({
      id: f.id,
      title: f.title,
      description: f.description,
      published: f.published,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      responseCount: f._count.responses,
      schema: JSON.parse(f.legacySchema),
      tone: f.tone,
      questions: JSON.parse(f.questions),
      shareToken: f.shareToken,
    }));

    res.json(result);
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get single form (public — no auth required for published forms)
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({
      where: { id: req.params.id },
    });

    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      published: form.published,
      schema: JSON.parse(form.legacySchema),
      tone: form.tone,
      questions: JSON.parse(form.questions),
      shareToken: form.shareToken,
      userId: form.userId,
      createdAt: form.createdAt,
    });
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Create form
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, schema, tone, questions } = req.body;

    const form = await prisma.form.create({
      data: {
        title: title || 'Untitled Form',
        description: description || '',
        legacySchema: JSON.stringify(schema || []),
        tone: tone || 'friendly',
        questions: JSON.stringify(questions || []),
        userId: req.userId!,
      },
    });

    res.status(201).json({
      id: form.id,
      title: form.title,
      description: form.description,
      published: form.published,
      schema: JSON.parse(form.legacySchema),
      tone: form.tone,
      questions: JSON.parse(form.questions),
      shareToken: form.shareToken,
      createdAt: form.createdAt,
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update form
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.form.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const { title, description, schema, tone, questions, published } = req.body;

    const form = await prisma.form.update({
      where: { id: req.params.id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(schema !== undefined && { legacySchema: JSON.stringify(schema) }),
        ...(tone !== undefined && { tone }),
        ...(questions !== undefined && { questions: JSON.stringify(questions) }),
        ...(published !== undefined && { published }),
      },
    });

    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      published: form.published,
      schema: JSON.parse(form.legacySchema),
      tone: form.tone,
      questions: JSON.parse(form.questions),
      shareToken: form.shareToken,
      createdAt: form.createdAt,
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete form
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.form.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Form not found' });
    }

    await prisma.form.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Publish form
router.post('/:id/publish', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.form.findUnique({ where: { id: req.params.id } });
    if (!existing || existing.userId !== req.userId) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const form = await prisma.form.update({
      where: { id: req.params.id },
      data: { published: true },
    });

    res.json({
      id: form.id,
      published: true,
      shareToken: form.shareToken,
      shareUrl: `/f/${form.shareToken}`,
    });
  } catch (error) {
    console.error('Publish form error:', error);
    res.status(500).json({ error: 'Failed to publish form' });
  }
});

// Get single form by share token (public)
router.get('/by-token/:shareToken', async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const form = await prisma.form.findUnique({
      where: { shareToken },
    });

    if (!form || !form.published) {
      return res.status(404).json({ error: 'Form not found or not published' });
    }

    res.json({
      id: form.id,
      title: form.title,
      description: form.description,
      published: form.published,
      schema: JSON.parse(form.legacySchema),
      tone: form.tone,
      questions: JSON.parse(form.questions),
      shareToken: form.shareToken,
      createdAt: form.createdAt,
    });
  } catch (error) {
    console.error('Get form by token error:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

export default router;
