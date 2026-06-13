import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import * as workOrderService from '../services/workorder.service';
import { z } from 'zod';

const router = Router();

const createWorkOrderSchema = z.object({
  instrumentId: z.string().uuid(),
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedTechnician: z.string().optional(),
  scheduledDate: z.string().optional(),
  description: z.string().optional(),
});

const updateWorkOrderSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  assignedTechnician: z.string().nullable().optional(),
  scheduledDate: z.string().nullable().optional(),
  completedDate: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  reason: z.string().min(4), // Audit reason is required
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const list = await workOrderService.getAllWorkOrders();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const data = createWorkOrderSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const wo = await workOrderService.createWorkOrder(data, changer);
    res.status(201).json(wo);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.post('/generate', async (req: AuthRequest, res: Response) => {
  try {
    const changer = req.user?.email || 'admin@caltrack.com';
    const result = await workOrderService.generateWorkOrdersForDueInstruments(changer);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const data = updateWorkOrderSchema.parse(req.body);
    const changer = req.user?.email || 'admin@caltrack.com';
    const wo = await workOrderService.updateWorkOrder(req.params.id, data, changer);
    res.json(wo);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

export default router;
