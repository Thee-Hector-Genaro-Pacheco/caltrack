import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { UserRole } from '@caltrack/types';

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    // Administrators automatically bypass all RBAC checks (full platform access)
    if (req.user.role === 'ADMINISTRATOR') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient role permissions' });
    }

    next();
  };
}
