import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as calibrationPrepService from '../services/calibrationPrep.service';
import { AIEngine } from '@caltrack/ai';

// Instantiate and initialize the CalTrack AI engine
const aiEngine = new AIEngine();
aiEngine.initialize();

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

router.post('/calibration-brief', async (req: AuthRequest, res: Response) => {
  try {
    const { instrumentId } = req.body;
    if (!instrumentId) {
      return res.status(400).json({ error: 'Instrument ID is required' });
    }

    const supervisor = aiEngine.agents.get('supervisor');
    if (!supervisor) {
      return res.status(500).json({ error: 'Supervisor agent not initialized' });
    }

    const response = await supervisor.execute({
      goal: `Prepare instrument with ID ${instrumentId} for calibration`,
      context: { instrumentId },
    });

    if (!response.success) {
      return res.status(500).json({ error: response.summary });
    }

    res.json(response.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
