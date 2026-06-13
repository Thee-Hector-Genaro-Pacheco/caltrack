import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as instrumentService from '../services/instrument.service';
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
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createCalibrationSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const record = await instrumentService.addCalibrationRecord(data, changer);
    res.status(201).json(record);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
