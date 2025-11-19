import { Server, Socket } from 'socket.io';
import logger from '../config/logger';

// Socket.io para futuras funcionalidades em tempo real (se necessário)
// Por enquanto, o sistema é assíncrono e não requer atualizações em tempo real

export const inicializarSocket = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info('Client connected', { socketId: socket.id });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });

    socket.on('error', (error) => {
      logger.error('Socket error', { error, socketId: socket.id });
    });
  });
};

