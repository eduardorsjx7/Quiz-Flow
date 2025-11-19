import { Server, Socket } from 'socket.io';
import prisma from '../config/database';
import logger from '../config/logger';

// Esta função será chamada do server.ts após criar o io

export const atualizarRanking = (io: Server) => {
  io.on('connection', (socket: Socket) => {
    logger.info('Client connected', { socketId: socket.id });

    socket.on('join-session', async (sessaoId: number) => {
      try {
        socket.join(`sessao-${sessaoId}`);
        logger.debug('Client joined session', { socketId: socket.id, sessaoId });
        await atualizarRankingSessao(sessaoId, io);
      } catch (error) {
        logger.error('Error joining session', { error, socketId: socket.id, sessaoId });
      }
    });

    socket.on('disconnect', () => {
      logger.info('Client disconnected', { socketId: socket.id });
    });

    socket.on('error', (error) => {
      logger.error('Socket error', { error, socketId: socket.id });
    });
  });
};

export const atualizarRankingSessao = async (sessaoId: number, io: Server) => {
  try {
    const participantes = await prisma.sessaoQuizParticipante.findMany({
      where: { sessaoId },
      orderBy: [
        { pontuacaoTotal: 'desc' },
        { tempoTotal: 'asc' },
      ],
      include: {
        respostas: {
          include: {
            pergunta: true,
          },
        },
      },
    });

    // Atualizar posições no ranking
    for (let i = 0; i < participantes.length; i++) {
      await prisma.sessaoQuizParticipante.update({
        where: { id: participantes[i].id },
        data: { posicaoRanking: i + 1 },
      });
    }

    const ranking = participantes.map((p, index) => ({
      id: p.id,
      nome: p.nomeParticipante,
      pontuacao: p.pontuacaoTotal,
      tempoTotal: p.tempoTotal,
      posicao: index + 1,
      acertos: p.respostas.filter((r) => r.acertou).length,
      totalPerguntas: p.respostas.length,
    }));

    io.to(`sessao-${sessaoId}`).emit('ranking-update', ranking);
    logger.debug('Ranking updated', { sessaoId, totalParticipantes: participantes.length });
  } catch (error) {
    logger.error('Error updating ranking', { error, sessaoId });
    throw error;
  }
};

