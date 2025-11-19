import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app';
import config from './config/env';
import logger from './config/logger';
import { connectDatabase, disconnectDatabase } from './config/database';
import { atualizarRanking } from './services/socket.service';

const httpServer = createServer(app);

// Configurar Socket.io
export const io = new Server(httpServer, {
  cors: {
    origin: config.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Inicializar serviço de socket
atualizarRanking(io);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  httpServer.close(async () => {
    logger.info('HTTP server closed');

    try {
      await disconnectDatabase();
      logger.info('Database disconnected');
      process.exit(0);
    } catch (error) {
      logger.error('Error during shutdown', { error });
      process.exit(1);
    }
  });

  // Forçar fechamento após 10 segundos
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Iniciar servidor
const startServer = async () => {
  try {
    // Conectar ao banco de dados
    await connectDatabase();

    // Iniciar servidor HTTP
    httpServer.listen(config.PORT, () => {
      logger.info(`Server running on port ${config.PORT}`, {
        environment: config.NODE_ENV,
        port: config.PORT,
      });
    });
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

// Handlers de sinal
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handler de erros não capturados
process.on('unhandledRejection', (reason: Error, promise: Promise<any>) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception', { error });
  gracefulShutdown('uncaughtException');
});

// Iniciar aplicação
startServer();

export { httpServer, io };
