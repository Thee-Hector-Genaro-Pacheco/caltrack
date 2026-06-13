import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as referenceStandardService from '../services/referenceStandard.service';
import { z } from 'zod';

const router = Router();

const createStandardSchema = z.object({
  assetTag: z.string().min(2),
  equipmentType: z.string().min(2),
  manufacturer: z.string().min(2),
  model: z.string().min(2),
  serialNumber: z.string().min(2),
  accuracyClass: z.string().min(2),
  certificateNumber: z.string().min(2),
  lastCalibratedDate: z.string().or(z.date()),
  calibrationDueDate: z.string().or(z.date()),
  status: z.enum(['ACTIVE', 'DUE_SOON', 'EXPIRED', 'OUT_OF_SERVICE']).optional(),
});

const updateStandardSchema = createStandardSchema.partial().extend({
  reason: z.string().min(4),
});

// GET /api/reference-standards
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const list = await referenceStandardService.getAllReferenceStandards();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/reference-standards/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const standard = await referenceStandardService.getReferenceStandardById(req.params.id);
    if (!standard) {
      return res.status(404).json({ error: 'Reference standard not found' });
    }
    res.json(standard);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/reference-standards
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createStandardSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const standard = await referenceStandardService.createReferenceStandard(data, changer);
    res.status(201).json(standard);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/reference-standards/:id
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateStandardSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const standard = await referenceStandardService.updateReferenceStandard(req.params.id, data, changer);
    res.json(standard);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
