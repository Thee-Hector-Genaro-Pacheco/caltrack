import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as hierarchyService from '../services/hierarchy.service';
import { z } from 'zod';

const router = Router();

const createProcessAreaSchema = z.object({
  areaCode: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const list = await hierarchyService.getAllProcessAreas();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createProcessAreaSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const area = await hierarchyService.createProcessArea(data, changer);
    res.status(201).json(area);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
