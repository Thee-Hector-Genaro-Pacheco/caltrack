import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing Authorization header' });
  }

  const token = authHeader.split(' ')[1];
  const JWT_SECRET = process.env.JWT_SECRET || 'caltrack-secure-jwt-key';

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
    };

    // DEMO_VIEWER accounts are strictly read-only and blocked from mutations
    if (decoded.role === 'DEMO_VIEWER' && req.method !== 'GET') {
      return res.status(403).json({
        error: 'Forbidden: Demo Viewer accounts are read-only and cannot perform database mutations or administrative actions.'
      });
    }

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session token' });
  }
}

export default requireAuth;
