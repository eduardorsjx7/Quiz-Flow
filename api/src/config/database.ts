import { PrismaClient } from '@prisma/client';
import logger from './logger';
import dotenv from 'dotenv';

// Garantir que .env está carregado
dotenv.config();

// Garantir que DATABASE_URL está disponível
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  logger.error('DATABASE_URL não está definida no ambiente');
  throw new Error('DATABASE_URL não está definida');
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
  errorFormat: 'pretty',
});

// Log de queries em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: any) => {
    logger.debug('Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

// Log de erros do Prisma
prisma.$on('error' as never, (e: any) => {
  logger.error('Prisma Error', {
    error: e.message || e,
    code: e.code,
    meta: e.meta,
    stack: e.stack,
    timestamp: new Date().toISOString(),
  });
});

// Log de informações do Prisma
prisma.$on('info' as never, (e: any) => {
  logger.info('Prisma Info', {
    message: e.message,
    target: e.target,
    timestamp: new Date().toISOString(),
  });
});

// Log de warnings do Prisma
prisma.$on('warn' as never, (e: any) => {
  logger.warn('Prisma Warning', {
    message: e.message,
    target: e.target,
    timestamp: new Date().toISOString(),
  });
});

// Middleware para conectar ao banco
export const connectDatabase = async () => {
  const startTime = Date.now();
  const connectionId = `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.info('Attempting to connect to database', {
      connectionId,
      databaseUrl: databaseUrl ? `${databaseUrl.split('@')[0]}@***` : 'not set',
      timestamp: new Date().toISOString(),
    });
    
    await prisma.$connect();
    
    const connectDuration = Date.now() - startTime;
    logger.info('Database connected successfully', {
      connectionId,
      duration: `${connectDuration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    // Testar uma query simples
    const queryStartTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const queryDuration = Date.now() - queryStartTime;
    
    logger.info('Database connection test successful', {
      connectionId,
      queryDuration: `${queryDuration}ms`,
      totalDuration: `${Date.now() - startTime}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    logger.error('Failed to connect to database', {
      connectionId,
      error: error.message || error,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
};

// Função para verificar a saúde da conexão
export const checkDatabaseHealth = async (): Promise<boolean> => {
  const healthCheckId = `health-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    logger.debug('Database health check started', {
      healthCheckId,
      timestamp: new Date().toISOString(),
    });
    
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const duration = Date.now() - startTime;
    
    logger.debug('Database health check successful', {
      healthCheckId,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
    
    return true;
  } catch (error: any) {
    logger.error('Database health check failed', {
      healthCheckId,
      error: error.message || error,
      code: error.code,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return false;
  }
};

// Middleware para desconectar do banco
export const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Database disconnected successfully');
  } catch (error) {
    logger.error('Error disconnecting from database', { error });
  }
};

export default prisma;

