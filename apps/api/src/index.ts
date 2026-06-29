import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import env from './config/env';
import logger from './services/logger.service';
import prisma from './db/prisma';
import requireAuth from './middleware/auth.middleware';
import requestLogger from './middleware/requestLogger.middleware';
import errorHandler from './middleware/error.middleware';

import instrumentsRouter from './routes/instruments';
import calibrationsRouter from './routes/calibrations';
import auditRouter from './routes/audit';
import dashboardRouter from './routes/dashboard';
import processAreasRouter from './routes/process-areas';
import controlLoopsRouter from './routes/control-loops';
import workOrdersRouter from './routes/work-orders';
import referenceStandardsRouter from './routes/reference-standards';
import aiRouter from './routes/ai';
import documentationRouter from './routes/documentation';
import intelligenceRouter from './routes/intelligence';
import authRouter from './routes/auth';

const app = express();

// Secure Express headers via Helmet
app.use(helmet());

// Configure Cors policy dynamically
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true
}));

app.use(express.json());

// Request logging middleware
app.use(requestLogger);

// Health Endpoint
app.get('/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let statusCode = 200;

  try {
    // Perform simple query to verify postgres connectivity
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err: any) {
    logger.error('Healthcheck database query failed', { error: err.message });
    dbStatus = 'disconnected';
    statusCode = 500;
  }

  res.status(statusCode).json({
    status: statusCode === 200 ? 'healthy' : 'unhealthy',
    version: '1.0.0',
    uptime: process.uptime(),
    database: dbStatus
  });
});

// Maintain backward compatibility for /api/health path
app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected';
  let statusCode = 200;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = 'disconnected';
    statusCode = 500;
  }
  res.status(statusCode).json({
    status: statusCode === 200 ? 'healthy' : 'unhealthy',
    version: '1.0.0',
    uptime: process.uptime(),
    database: dbStatus
  });
});

// Public auth routes
app.use('/api/auth', authRouter);

// Protected routes
app.use('/api/instruments', requireAuth, instrumentsRouter);
app.use('/api/calibrations', requireAuth, calibrationsRouter);
app.use('/api/audit', requireAuth, auditRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/process-areas', requireAuth, processAreasRouter);
app.use('/api/control-loops', requireAuth, controlLoopsRouter);
app.use('/api/work-orders', requireAuth, workOrdersRouter);
app.use('/api/reference-standards', requireAuth, referenceStandardsRouter);
app.use('/api/ai', requireAuth, aiRouter);
app.use('/api/documentation', requireAuth, documentationRouter);
app.use('/api/intelligence', requireAuth, intelligenceRouter);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    error: `Cannot ${req.method} ${req.originalUrl}`,
    code: 'NOT_FOUND',
    timestamp: new Date().toISOString()
  });
});

// Centralized error handler
app.use(errorHandler);

// Database startup connection check
prisma.$connect()
  .then(() => {
    logger.info('Database connection established successfully');
  })
  .catch((err) => {
    logger.error('Failed to establish database connection during startup', { error: err.message });
  });

const server = app.listen(env.PORT, () => {
  logger.info(`CalTrack API Server listening on port ${env.PORT}`, {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    frontendUrl: env.FRONTEND_URL
  });
});

// Capture process exceptions
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Rejection observed', {
    message: reason?.message || String(reason),
    stack: reason?.stack
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception observed', {
    message: error.message,
    stack: error.stack
  });
  // Graceful shutdown on unhandled runtime exception
  gracefulShutdown('uncaughtException');
});

// Graceful server termination
const gracefulShutdown = (signal: string) => {
  logger.warn(`Received shutdown trigger [${signal}], starting graceful process termination...`);
  
  server.close(() => {
    logger.info('HTTP server terminated successfully.');
    prisma.$disconnect()
      .then(() => {
        logger.info('Database connections closed. Exiting process.');
        process.exit(0);
      })
      .catch((err) => {
        logger.error('Error during database disconnect', { error: err.message });
        process.exit(1);
      });
  });

  // Force close after 10s
  setTimeout(() => {
    logger.error('Shutdown deadline exceeded, forcing process termination.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
