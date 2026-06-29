import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import logger from '../services/logger.service';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'caltrack-secure-jwt-key';

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      logger.warn(`Authentication failure: account not found or inactive for email ${email}`, { email });
      return res.status(401).json({ error: 'Invalid credentials or inactive account' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      logger.warn(`Authentication failure: invalid password credentials for email ${email}`, { email, userId: user.id });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    logger.info(`Authentication successful for user ${user.email}`, { userId: user.id, email: user.email, role: user.role });

    // Omit password hash in response
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({
      user: userWithoutPassword,
      token,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req: Request, res: Response) => {
  res.json({ success: true });
});

router.get('/me', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Unauthorized: User not found or inactive' });
    }

    const { passwordHash, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
