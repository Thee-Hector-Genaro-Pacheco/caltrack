import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';
import env from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected error occurred on the server';

  // Log error using structured logger
  logger.error(`API Error: ${message}`, {
    status,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
  });

  res.status(status).json({
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
}

export default errorHandler;
