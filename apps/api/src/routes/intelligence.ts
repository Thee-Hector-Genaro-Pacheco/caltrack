import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as intelligenceService from '../services/intelligence.service';

const router = Router();

router.get('/instruments', async (req: AuthRequest, res: Response) => {
  try {
    const list = await intelligenceService.getAllInstrumentsIntelligence();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/instruments/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Instrument ID is required' });
    }
    const summary = await intelligenceService.getInstrumentIntelligence(id);
    res.json(summary);
  } catch (error: any) {
    if (error.message === 'Instrument not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
