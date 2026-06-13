import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import prisma from '../db/prisma';

const router = Router();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const totalInstruments = await prisma.instrument.count();
    const calibrationsDue = await prisma.instrument.count({
      where: { status: 'CALIBRATION_DUE' },
    });
    const overdueInstruments = await prisma.instrument.count({
      where: { status: 'OVERDUE' },
    });
    const recentAuditActivity = await prisma.auditEvent.findMany({
      orderBy: { timestamp: 'desc' },
      take: 5,
    });

    res.json({
      totalInstruments,
      calibrationsDue,
      overdueInstruments,
      recentAuditActivity,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
