import { PrismaClient } from '@prisma/client';
import logger from './logger';

const prisma = new PrismaClient({
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
    await prisma.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', { error });
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

