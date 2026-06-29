import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import * as instrumentService from '../services/instrument.service';
import prisma from '../db/prisma';
import { z } from 'zod';

const router = Router();

const createCalibrationSchema = z.object({
  instrumentId: z.string().uuid(),
  calibrationDate: z.string().or(z.date()),
  technicianName: z.string().min(2),
  notes: z.string().optional(),
  testPoints: z.array(
    z.object({
      targetInput: z.number(),
      asFoundOutput: z.number(),
      asLeftOutput: z.number(),
    })
  ).min(1),
  referenceStandards: z.array(
    z.object({
      referenceStandardId: z.string().uuid(),
      usageNotes: z.string().optional(),
    })
  ).optional(),
});

const signatureSchema = z.object({
  signerName: z.string().min(2),
  signerRole: z.enum(['TECHNICIAN', 'SUPERVISOR', 'QA']),
});

const rejectionSchema = signatureSchema.extend({
  reason: z.string().min(4),
});

// GET /api/calibrations
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const status = req.query.status as string;
    const instrumentId = req.query.instrumentId as string;

    const where: any = {};
    if (status) {
      where.status = status;
    }
    if (instrumentId) {
      where.instrumentId = instrumentId;
    }

    const list = await prisma.calibrationRecord.findMany({
      where,
      orderBy: { calibrationDate: 'desc' },
      include: {
        instrument: true,
        testPoints: true,
        signatures: {
          orderBy: { signedAt: 'asc' }
        },
        referenceStandards: {
          include: {
            referenceStandard: true
          }
        }
      }
    });

    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/calibrations/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const record = await prisma.calibrationRecord.findUnique({
      where: { id: req.params.id },
      include: {
        instrument: true,
        testPoints: true,
        signatures: {
          orderBy: { signedAt: 'asc' }
        },
        referenceStandards: {
          include: {
            referenceStandard: true
          }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ error: 'Calibration record not found' });
    }

    res.json(record);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calibrations
router.post('/', requireRole(['TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const data = createCalibrationSchema.parse(req.body);
    const changer = req.user!.email;
    const record = await instrumentService.addCalibrationRecord(data, changer);
    res.status(201).json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calibrations/:id/submit
router.post('/:id/submit', requireRole(['TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const { signerName, signerRole } = signatureSchema.parse(req.body);
    const changer = req.user!.email;
    const record = await instrumentService.submitCalibrationForReview(req.params.id, signerName, signerRole, changer);
    res.json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calibrations/:id/approve
router.post('/:id/approve', requireRole(['QA_REVIEWER']), async (req: AuthRequest, res: Response) => {
  try {
    const { signerName, signerRole } = signatureSchema.parse(req.body);
    const changer = req.user!.email;
    const record = await instrumentService.approveCalibration(req.params.id, signerName, signerRole, changer);
    res.json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// POST /api/calibrations/:id/reject
router.post('/:id/reject', requireRole(['QA_REVIEWER']), async (req: AuthRequest, res: Response) => {
  try {
    const { signerName, signerRole, reason } = rejectionSchema.parse(req.body);
    const changer = req.user!.email;
    const record = await instrumentService.rejectCalibration(req.params.id, signerName, signerRole, reason, changer);
    res.json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/calibrations/:id (Lock Enforcement)
router.put('/:id', requireRole(['TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const record = await prisma.calibrationRecord.findUnique({
      where: { id: req.params.id }
    });

    if (!record) {
      return res.status(404).json({ error: 'Calibration record not found' });
    }

    if (record.status === 'APPROVED') {
      return res.status(403).json({ error: 'Compliance record is approved and locked. Modifications are prohibited.' });
    }

    res.json({ message: 'Draft record update simulated successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/calibrations/:id (Lock Enforcement)
router.delete('/:id', requireRole(['TECHNICIAN']), async (req: AuthRequest, res: Response) => {
  try {
    const record = await prisma.calibrationRecord.findUnique({
      where: { id: req.params.id }
    });

    if (!record) {
      return res.status(404).json({ error: 'Calibration record not found' });
    }

    if (record.status === 'APPROVED') {
      return res.status(403).json({ error: 'Compliance record is approved and locked. Modifications are prohibited.' });
    }

    await prisma.calibrationRecord.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Calibration record deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
