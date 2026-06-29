import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserRole } from '@caltrack/types';
import logger from '../services/logger.service';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      logger.warn(`Authorization blocked: authentication session missing for path ${req.originalUrl}`);
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    // Administrators automatically bypass all RBAC checks (full platform access)
    if (req.user.role === 'ADMINISTRATOR') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      logger.warn(`Authorization failure: user ${req.user.email} with role ${req.user.role} attempted to access route requiring roles ${JSON.stringify(allowedRoles)}`, {
        email: req.user.email,
        role: req.user.role,
        requiredRoles: allowedRoles,
        url: req.originalUrl,
        method: req.method
      });
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
    }

    next();
  };
}
