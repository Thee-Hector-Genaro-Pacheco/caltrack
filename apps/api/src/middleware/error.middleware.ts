import { Request, Response, NextFunction } from 'express';
import { logger } from '../services/logger.service';
import env from '../config/env';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  const status = err.status || err.statusCode || 500;
  const rawMessage = err.message || 'An unexpected error occurred on the server';

  // Log full error details to CloudWatch / server console
  logger.error(`API Error [${status}] ${req.method} ${req.originalUrl}: ${rawMessage}`, {
    status,
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    stack: err.stack,
  });

  // Sanitize 500 internal server errors to avoid leaking database schema, table names, or raw SQL queries
  let safeMessage = rawMessage;
  if (status === 500) {
    if (env.NODE_ENV === 'production' || rawMessage.includes('prisma') || rawMessage.includes('public.')) {
      safeMessage = 'An unexpected internal server error occurred.';
    }
  }

  res.status(status).json({
    error: safeMessage,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString(),
  });
}

export default errorHandler;
