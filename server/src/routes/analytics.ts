import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

router.get('/:formId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const form = await prisma.form.findUnique({ where: { id: req.params.formId } });
    if (!form || form.userId !== req.userId) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const responses = await prisma.response.findMany({
      where: { formId: req.params.formId },
      orderBy: { createdAt: 'asc' },
    });

    const totalResponses = responses.length;

    // Submissions over time (group by date)
    const dateMap: Record<string, number> = {};
    responses.forEach((r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      dateMap[date] = (dateMap[date] || 0) + 1;
    });
    const submissionsOverTime = Object.entries(dateMap).map(([date, count]) => ({ date, count }));

    // Field distributions for dropdown/radio/checkbox fields
    const schema = JSON.parse(form.legacySchema) as Array<{
      id: string;
      type: string;
      label: string;
      options?: Array<{ label: string; value: string }>;
    }>;

    const fieldDistributions: Record<string, Array<{ label: string; value: string; count: number }>> = {};

    schema.forEach((field) => {
      if (['dropdown', 'radio', 'checkbox'].includes(field.type) && field.options) {
        const counts: Record<string, number> = {};
        field.options.forEach((opt) => {
          counts[opt.value] = 0;
        });

        responses.forEach((r) => {
          const data = JSON.parse(r.data);
          const val = data[field.id];
          if (Array.isArray(val)) {
            val.forEach((v: string) => {
              if (counts[v] !== undefined) counts[v]++;
            });
          } else if (val && counts[val] !== undefined) {
            counts[val]++;
          }
        });

        fieldDistributions[field.id] = field.options.map((opt) => ({
          label: opt.label,
          value: opt.value,
          count: counts[opt.value] || 0,
        }));
      }
    });

    res.json({
      totalResponses,
      submissionsOverTime,
      fieldDistributions,
    });
  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
