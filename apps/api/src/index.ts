import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import requireAuth from './middleware/auth.middleware';
import instrumentsRouter from './routes/instruments';
import calibrationsRouter from './routes/calibrations';
import auditRouter from './routes/audit';
import dashboardRouter from './routes/dashboard';
import processAreasRouter from './routes/process-areas';
import controlLoopsRouter from './routes/control-loops';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Public healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Protected routes
app.use('/api/instruments', requireAuth, instrumentsRouter);
app.use('/api/calibrations', requireAuth, calibrationsRouter);
app.use('/api/audit', requireAuth, auditRouter);
app.use('/api/dashboard', requireAuth, dashboardRouter);
app.use('/api/process-areas', requireAuth, processAreasRouter);
app.use('/api/control-loops', requireAuth, controlLoopsRouter);

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong on the server' });
});

app.listen(PORT, () => {
  console.log(`CalTrack API Server listening on port ${PORT}`);
});
