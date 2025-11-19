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
  logger.error('Prisma Error', { error: e });
});

// Log de informações do Prisma
prisma.$on('info' as never, (e: any) => {
  logger.info('Prisma Info', { message: e.message });
});

// Log de warnings do Prisma
prisma.$on('warn' as never, (e: any) => {
  logger.warn('Prisma Warning', { message: e.message });
});

// Middleware para conectar ao banco
export const connectDatabase = async () => {
  try {
    logger.info('Attempting to connect to database', { 
      databaseUrl: databaseUrl ? `${databaseUrl.split('@')[0]}@***` : 'not set' 
    });
    await prisma.$connect();
    logger.info('Database connected successfully');
    
    // Testar uma query simples
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection test successful');
  } catch (error: any) {
    logger.error('Failed to connect to database', { 
      error: error.message || error,
      code: error.code,
      meta: error.meta 
    });
    throw error;
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

