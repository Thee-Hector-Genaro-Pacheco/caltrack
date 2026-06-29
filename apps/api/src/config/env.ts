import dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

// Check required environment variables
if (!process.env.DATABASE_URL) {
  console.error('FATAL ERROR: DATABASE_URL environment variable is missing.');
  process.exit(1);
}

const defaultSecret = 'caltrack-secure-jwt-key';
const currentSecret = process.env.JWT_SECRET;

if (!currentSecret || currentSecret === defaultSecret) {
  if (isProduction) {
    console.error('FATAL ERROR: JWT_SECRET environment variable is missing or set to insecure default in production.');
    process.exit(1);
  } else {
    console.warn('WARNING: JWT_SECRET is missing or set to default. In production this will cause a boot failure.');
  }
}

export const env = {
  PORT: parseInt(process.env.PORT || '3001', 10),
  DATABASE_URL: process.env.DATABASE_URL!,
  JWT_SECRET: process.env.JWT_SECRET || defaultSecret,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export default env;
