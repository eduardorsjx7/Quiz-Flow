import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';
import { atualizarRankingSessao } from './socket.service';

export class SessaoService {
  async criarSessao(quizId: number) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          perguntas: true,
        },
      });

      if (!quiz) {
        throw new CustomError('Quiz não encontrado', 404);
      }

      // Gerar código único para a sessão
      let codigoSessao: string;
      let codigoExiste = true;

      while (codigoExiste) {
        codigoSessao = Math.random().toString(36).substring(2, 10).toUpperCase();
        const existe = await prisma.sessaoQuiz.findUnique({
          where: { codigoSessao },
        });
        codigoExiste = !!existe;
      }

      const sessao = await prisma.sessaoQuiz.create({
        data: {
          quizId,
          codigoSessao: codigoSessao!,
          status: 'AGUARDANDO',
        },
        include: {
          quiz: {
            include: {
              perguntas: {
                include: {
                  alternativas: {
                    select: {
                      id: true,
                      texto: true,
                      ordem: true,
                    },
                  },
                },
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
          },
        },
      });

      logger.info('Session created', { sessaoId: sessao.id, codigoSessao: sessao.codigoSessao });

      return sessao;
    } catch (error) {
      logger.error('Error creating session', { error, quizId });
      throw error;
    }
  }

  async buscarPorCodigo(codigo: string) {
    try {
      const sessao = await prisma.sessaoQuiz.findUnique({
        where: { codigoSessao: codigo },
        include: {
          quiz: {
            include: {
              perguntas: {
                include: {
                  alternativas: {
                    select: {
                      id: true,
                      texto: true,
                      ordem: true,
                    },
                  },
                },
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
          },
          participantes: {
            orderBy: [
              { pontuacaoTotal: 'desc' },
              { tempoTotal: 'asc' },
            ],
            take: 10,
          },
        },
      });

      if (!sessao) {
        throw new CustomError('Sessão não encontrada', 404);
      }

      return sessao;
    } catch (error) {
      logger.error('Error finding session by code', { error, codigo });
      throw error;
    }
  }

  async entrarNaSessao(codigo: string, dados: {
    nomeParticipante: string;
    matricula?: string;
    usuarioId?: number;
  }) {
    try {
      const sessao = await prisma.sessaoQuiz.findUnique({
        where: { codigoSessao: codigo },
      });

      if (!sessao) {
        throw new CustomError('Sessão não encontrada', 404);
      }

      if (sessao.status === 'FINALIZADA') {
        throw new CustomError('Sessão já finalizada', 400);
      }

      const participante = await prisma.sessaoQuizParticipante.create({
        data: {
          sessaoId: sessao.id,
          usuarioId: dados.usuarioId || null,
          nomeParticipante: dados.nomeParticipante,
          matricula: dados.matricula,
        },
      });

      logger.info('Participant joined session', {
        sessaoId: sessao.id,
        participanteId: participante.id,
      });

      return participante;
    } catch (error) {
      logger.error('Error joining session', { error, codigo });
      throw error;
    }
  }

  async iniciarSessao(id: number) {
    try {
      const sessao = await prisma.sessaoQuiz.update({
        where: { id },
        data: {
          status: 'EM_ANDAMENTO',
          iniciadaEm: new Date(),
        },
      });

      logger.info('Session started', { sessaoId: id });

      return sessao;
    } catch (error) {
      logger.error('Error starting session', { error, sessaoId: id });
      throw error;
    }
  }

  async finalizarSessao(id: number) {
    try {
      const sessao = await prisma.sessaoQuiz.update({
        where: { id },
        data: {
          status: 'FINALIZADA',
          finalizadaEm: new Date(),
        },
      });

      // Ranking será atualizado via socket quando necessário

      logger.info('Session finalized', { sessaoId: id });

      return sessao;
    } catch (error) {
      logger.error('Error finalizing session', { error, sessaoId: id });
      throw error;
    }
  }

  async obterRanking(codigo: string) {
    try {
      const sessao = await prisma.sessaoQuiz.findUnique({
        where: { codigoSessao: codigo },
      });

      if (!sessao) {
        throw new CustomError('Sessão não encontrada', 404);
      }

      const participantes = await prisma.sessaoQuizParticipante.findMany({
        where: { sessaoId: sessao.id },
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

      const ranking = participantes.map((p, index) => ({
        posicao: index + 1,
        id: p.id,
        nome: p.nomeParticipante,
        pontuacao: p.pontuacaoTotal,
        tempoTotal: p.tempoTotal,
        acertos: p.respostas.filter((r) => r.acertou).length,
        totalPerguntas: p.respostas.length,
        percentualAcertos:
          p.respostas.length > 0
            ? Math.round((p.respostas.filter((r) => r.acertou).length / p.respostas.length) * 100)
            : 0,
      }));

      return ranking;
    } catch (error) {
      logger.error('Error getting ranking', { error, codigo });
      throw error;
    }
  }

  async buscarParticipante(id: number) {
    try {
      const participante = await prisma.sessaoQuizParticipante.findUnique({
        where: { id },
        include: {
          sessao: {
            include: {
              quiz: true,
            },
          },
          respostas: {
            include: {
              pergunta: true,
            },
          },
        },
      });

      if (!participante) {
        throw new CustomError('Participante não encontrado', 404);
      }

      return participante;
    } catch (error) {
      logger.error('Error finding participant', { error, participanteId: id });
      throw error;
    }
  }
}

export default new SessaoService();

