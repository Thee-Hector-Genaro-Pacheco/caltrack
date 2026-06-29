import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/rbac.middleware';
import * as documentationService from '../services/documentation.service';
import { z } from 'zod';

const router = Router();

const createDocumentationSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  documentNumber: z.string().min(2),
  revision: z.string().min(1),
  manufacturer: z.string().optional(),
  instrumentType: z.string().optional(),
  equipmentCategory: z.string().optional(),
  documentType: z.string().min(2),
  tags: z.array(z.string()).optional(),
  fileLocation: z.string().min(1),
  status: z.enum(['ACTIVE', 'ARCHIVED']).optional(),
  instrumentIds: z.array(z.string()).optional(),
});

const updateDocumentationSchema = createDocumentationSchema.partial().extend({
  reason: z.string().min(4).optional(),
});

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { search, manufacturer, instrumentType, status } = req.query;
    const filters = {
      search: typeof search === 'string' ? search : undefined,
      manufacturer: typeof manufacturer === 'string' ? manufacturer : undefined,
      instrumentType: typeof instrumentType === 'string' ? instrumentType : undefined,
      status: typeof status === 'string' ? status : undefined,
    };
    const list = await documentationService.getAllDocumentation(filters);
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const document = await documentationService.getDocumentationById(req.params.id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json(document);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', requireRole(['METROLOGY_MANAGER', 'SUPERVISOR']), async (req: AuthRequest, res: Response) => {
  try {
    const data = createDocumentationSchema.parse(req.body);
    const changer = req.user!.email;
    const document = await documentationService.createDocumentation(data, changer);
    res.status(201).json(document);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', requireRole(['METROLOGY_MANAGER', 'SUPERVISOR']), async (req: AuthRequest, res: Response) => {
  try {
    const data = updateDocumentationSchema.parse(req.body);
    const changer = req.user!.email;
    const document = await documentationService.updateDocumentation(req.params.id, data, changer);
    res.json(document);
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireRole(['METROLOGY_MANAGER', 'SUPERVISOR']), async (req: AuthRequest, res: Response) => {
  try {
    const reason = (req.query.reason as string) || 'Document deleted';
    const changer = req.user!.email;
    const document = await documentationService.deleteDocumentation(req.params.id, changer, reason);
    res.json({ message: 'Document deleted successfully', document });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
