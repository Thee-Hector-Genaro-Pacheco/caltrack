import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as hierarchyService from '../services/hierarchy.service';
import { z } from 'zod';

const router = Router();

const createControlLoopSchema = z.object({
  loopNumber: z.string().min(1),
  loopTag: z.string().min(2),
  description: z.string().optional(),
  pidReference: z.string().optional(),
  processAreaId: z.string().uuid(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const list = await hierarchyService.getAllControlLoops();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createControlLoopSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const loop = await hierarchyService.createControlLoop(data, changer);
    res.status(201).json(loop);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const loop = await hierarchyService.getControlLoopById(req.params.id);
    if (!loop) {
      return res.status(404).json({ error: 'Control Loop not found' });
    }
    res.json(loop);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/instruments', async (req: AuthRequest, res: Response) => {
  try {
    const instruments = await hierarchyService.getInstrumentsByLoopId(req.params.id);
    res.json(instruments);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
