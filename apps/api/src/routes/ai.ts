import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as calibrationPrepService from '../services/calibrationPrep.service';

const router = Router();

router.post('/calibration-prep/:instrumentId', async (req: AuthRequest, res: Response) => {
  try {
    const { instrumentId } = req.params;
    if (!instrumentId) {
      return res.status(400).json({ error: 'Instrument ID is required' });
    }
    const guidance = await calibrationPrepService.generatePrepGuidance(instrumentId);
    res.json(guidance);
  } catch (error: any) {
    if (error.message === 'Instrument not found') {
      return res.status(404).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
