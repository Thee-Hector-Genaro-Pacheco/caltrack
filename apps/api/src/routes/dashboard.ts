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
    const totalProcessAreas = await prisma.processArea.count();
    const totalControlLoops = await prisma.controlLoop.count();
    const openWorkOrders = await prisma.workOrder.count({
      where: { status: 'OPEN' },
    });
    const pendingReviews = await prisma.calibrationRecord.count({
      where: { status: 'PENDING_REVIEW' },
    });
    const approvedRecords = await prisma.calibrationRecord.count({
      where: { status: 'APPROVED' },
    });
    const rejectedRecords = await prisma.calibrationRecord.count({
      where: { status: 'REJECTED' },
    });

    res.json({
      totalInstruments,
      calibrationsDue,
      overdueInstruments,
      recentAuditActivity,
      totalProcessAreas,
      totalControlLoops,
      openWorkOrders,
      pendingReviews,
      approvedRecords,
      rejectedRecords,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
