import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const list = await prisma.auditEvent.findMany({
      orderBy: { timestamp: 'desc' },
    });
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
