import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';
import { calcularPontuacao } from '../utils/pontuacao';
import { atualizarRankingSessao } from './socket.service';
import { io } from '../server';
import { io } from '../server';

export class RespostaService {
  async processarResposta(dados: {
    sessaoParticipanteId: number;
    perguntaId: number;
    alternativaId: number;
    tempoResposta: number;
  }) {
    try {
      // Buscar dados necessários
      const participante = await prisma.sessaoQuizParticipante.findUnique({
        where: { id: dados.sessaoParticipanteId },
        include: {
          sessao: {
            include: {
              quiz: true,
            },
          },
        },
      });

      if (!participante) {
        throw new CustomError('Participante não encontrado', 404);
      }

      const pergunta = await prisma.pergunta.findUnique({
        where: { id: dados.perguntaId },
        include: {
          alternativas: true,
        },
      });

      if (!pergunta) {
        throw new CustomError('Pergunta não encontrada', 404);
      }

      const alternativaEscolhida = pergunta.alternativas.find(
        (a) => a.id === dados.alternativaId
      );

      if (!alternativaEscolhida) {
        throw new CustomError('Alternativa não encontrada', 404);
      }

      // Verificar se já respondeu esta pergunta
      const respostaExistente = await prisma.resposta.findFirst({
        where: {
          sessaoParticipanteId: dados.sessaoParticipanteId,
          perguntaId: dados.perguntaId,
        },
      });

      if (respostaExistente) {
        throw new CustomError('Pergunta já respondida', 400);
      }

      // Verificar se a resposta está correta
      const acertou = alternativaEscolhida.correta;

      // Calcular pontuação
      const pontuacao = calcularPontuacao(
        participante.sessao.quiz.pontosBase,
        dados.tempoResposta,
        pergunta.tempoSegundos,
        acertou
      );

      // Criar resposta
      const resposta = await prisma.resposta.create({
        data: {
          sessaoParticipanteId: dados.sessaoParticipanteId,
          perguntaId: dados.perguntaId,
          alternativaId: dados.alternativaId,
          tempoResposta: dados.tempoResposta,
          pontuacao,
          acertou,
          usuarioId: participante.usuarioId,
        },
      });

      // Atualizar pontuação total e tempo total do participante
      const todasRespostas = await prisma.resposta.findMany({
        where: { sessaoParticipanteId: dados.sessaoParticipanteId },
      });

      const pontuacaoTotal = todasRespostas.reduce((sum, r) => sum + r.pontuacao, 0);
      const tempoTotal = todasRespostas.reduce((sum, r) => sum + r.tempoResposta, 0);

      await prisma.sessaoQuizParticipante.update({
        where: { id: dados.sessaoParticipanteId },
        data: {
          pontuacaoTotal,
          tempoTotal,
        },
      });

      // Atualizar ranking em tempo real
      if (io) {
        await atualizarRankingSessao(participante.sessaoId, io);
      }

      logger.info('Answer processed', {
        respostaId: resposta.id,
        participanteId: dados.sessaoParticipanteId,
        acertou,
        pontuacao,
      });

      return {
        resposta,
        pontuacao,
        acertou,
        pontuacaoTotal,
        tempoTotal,
      };
    } catch (error) {
      logger.error('Error processing answer', { error, dados });
      throw error;
    }
  }

  async buscarRespostasParticipante(participanteId: number) {
    try {
      const respostas = await prisma.resposta.findMany({
        where: { sessaoParticipanteId: participanteId },
        include: {
          pergunta: {
            include: {
              alternativas: true,
            },
          },
        },
        orderBy: {
          respondidaEm: 'asc',
        },
      });

      return respostas;
    } catch (error) {
      logger.error('Error finding participant answers', { error, participanteId });
      throw error;
    }
  }
}

export default new RespostaService();

