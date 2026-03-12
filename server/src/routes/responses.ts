import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { stringify } from 'csv-stringify/sync';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// Upload file (public for conversational forms)
router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.json({ filePath, filename: req.file.originalname });
});

// Submit response (public, no auth)
router.post('/:formId', async (req: Request, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    if (!form.published) {
      return res.status(403).json({ error: 'Form is not published' });
    }

    const response = await prisma.response.create({
      data: {
        formId: req.params.formId,
        data: JSON.stringify(req.body.data || {}),
      },
    });

    res.status(201).json({ id: response.id, success: true });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

// Get all responses for a form (owner only)
router.get('/:formId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form || form.userId !== req.userId) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || '';
    const skip = (page - 1) * limit;

    const [responses, total] = await Promise.all([
      prisma.response.findMany({
        where: { formId: req.params.formId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.response.count({ where: { formId: req.params.formId } }),
    ]);

    let result = responses.map((r) => ({
      id: r.id,
      data: JSON.parse(r.data),
      createdAt: r.createdAt,
    }));

    // Simple search filter on response data
    if (search) {
      result = result.filter((r) =>
        JSON.stringify(r.data).toLowerCase().includes(search.toLowerCase())
      );
    }

    res.json({
      responses: result,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ error: 'Failed to fetch responses' });
  }
});

// Export responses as CSV
router.get('/:formId/export', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form || form.userId !== req.userId) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const schema = JSON.parse(form.legacySchema) as Array<{ id: string; label: string }>;
    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['Submission ID', 'Submitted At', ...schema.map((f) => f.label)];
    const rows = responses.map((r) => {
      const data = JSON.parse(r.data);
      return [
        r.id,
        r.createdAt.toISOString(),
        ...schema.map((f) => {
          const val = data[f.id];
          if (Array.isArray(val)) return val.join(', ');
          return val?.toString() || '';
        }),
      ];
    });

    const csv = stringify([headers, ...rows]);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${form.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ error: 'Failed to export responses' });
  }
});

// Delete a single response
router.delete('/:formId/:responseId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form || form.userId !== req.userId) {
      return res.status(404).json({ error: 'Form not found' });
    }

    await prisma.response.delete({ where: { id: req.params.responseId } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete response error:', error);
    res.status(500).json({ error: 'Failed to delete response' });
  }
});

// Submit response by share token (public)
router.post('/by-token/:shareToken', async (req: Request, res: Response) => {
  try {
    const { shareToken } = req.params;
    const form = await prisma.form.findUnique({ where: { shareToken } });
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }
    if (!form.published) {
      return res.status(403).json({ error: 'Form is not published' });
    }

    const response = await prisma.response.create({
      data: {
        formId: form.id,
        data: JSON.stringify(req.body.data || {}),
      },
    });

    res.status(201).json({ id: response.id, success: true });
  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ error: 'Failed to submit response' });
  }
});

export default router;
