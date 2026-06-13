import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as instrumentService from '../services/instrument.service';
import { z } from 'zod';

const router = Router();

const createInstrumentSchema = z.object({
  tagNumber: z.string().min(2),
  instrumentType: z.string().min(2),
  manufacturer: z.string().min(2),
  model: z.string().min(2),
  rangeMin: z.number(),
  rangeMax: z.number(),
  engineeringUnits: z.string().min(1),
  signalType: z.string().min(2),
  location: z.string().min(2),
  status: z.enum(['ACTIVE', 'CALIBRATION_DUE', 'OVERDUE', 'INACTIVE']).optional(),
  maxPermissibleError: z.number().positive().optional(),
  processAreaId: z.string().uuid().nullable().optional(),
  controlLoopId: z.string().uuid().nullable().optional(),
  calibrationIntervalMonths: z.number().int().positive().optional(),
  lastCalibrationDate: z.string().nullable().optional(),
  nextCalibrationDueDate: z.string().nullable().optional(),
});

const updateInstrumentSchema = createInstrumentSchema.partial().extend({
  reason: z.string().min(4),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const list = await instrumentService.getAllInstruments();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const instrument = await instrumentService.getInstrumentById(req.params.id);
    if (!instrument) {
      return res.status(404).json({ error: 'Instrument not found' });
    }
    res.json(instrument);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createInstrumentSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const instrument = await instrumentService.createInstrument(data, changer);
    res.status(201).json(instrument);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateInstrumentSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const instrument = await instrumentService.updateInstrument(req.params.id, data, changer);
    res.json(instrument);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const reason = (req.query.reason as string) || 'Instrument decommissioned';
    const changer = req.user?.email || 'admin@caltrack.com';
    const instrument = await instrumentService.deleteInstrument(req.params.id, changer, reason);
    res.json({ message: 'Instrument deleted successfully', instrument });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
