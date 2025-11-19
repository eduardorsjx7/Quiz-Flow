import dotenv from 'dotenv';
import logger from './logger';

dotenv.config();

interface EnvConfig {
  // Server
  PORT: number;
  NODE_ENV: 'development' | 'production' | 'test';
  
  // Database
  DATABASE_URL: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  
  // CORS
  FRONTEND_URL: string;
  
  // Logging
  LOG_LEVEL: string;
}

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'FRONTEND_URL'
];

// Validar variáveis de ambiente obrigatórias
const validateEnv = (): EnvConfig => {
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.error('Missing required environment variables', { missingVars });
    throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
  }

  return {
    PORT: parseInt(process.env.PORT || '3001', 10),
    NODE_ENV: (process.env.NODE_ENV || 'development') as 'development' | 'production' | 'test',
    DATABASE_URL: process.env.DATABASE_URL!,
    JWT_SECRET: process.env.JWT_SECRET!,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '24h',
    FRONTEND_URL: process.env.FRONTEND_URL!,
    LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  };
};

const config = validateEnv();

logger.info('Environment configuration loaded', {
  port: config.PORT,
  nodeEnv: config.NODE_ENV,
  logLevel: config.LOG_LEVEL,
});

export default config;

