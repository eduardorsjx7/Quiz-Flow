import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';
import atribuicaoService from './atribuicao.service';

export class TentativaService {
  async iniciarTentativa(quizId: number, usuarioId: number) {
    try {
      // Verificar se o quiz existe e está disponível
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          perguntas: {
            select: {
              id: true,
              texto: true,
              tempoSegundos: true,
              ordem: true,
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
      });

      if (!quiz) {
        throw new CustomError('Quiz não encontrado', 404);
      }

      if (!quiz.ativo) {
        throw new CustomError('Quiz não está ativo', 400);
      }

      // Verificar período de disponibilidade
      const agora = new Date();
      if (quiz.dataInicio && agora < quiz.dataInicio) {
        throw new CustomError('Quiz ainda não está disponível', 400);
      }
      if (quiz.dataFim && agora > quiz.dataFim) {
        throw new CustomError('Quiz não está mais disponível', 400);
      }

      // Verificar se o usuário tem acesso ao quiz
      const temAcesso = await atribuicaoService.verificarSeUsuarioTemAcesso(quizId, usuarioId);
      if (!temAcesso) {
        throw new CustomError('Você não tem acesso a este quiz', 403);
      }

      // Verificar se já existe uma tentativa em andamento ou finalizada
      const tentativaExistente = await prisma.tentativaQuiz.findUnique({
        where: {
          quizId_usuarioId: {
            quizId,
            usuarioId,
          },
        },
      });

      if (tentativaExistente) {
        if (tentativaExistente.status === 'EM_ANDAMENTO') {
          // Retornar tentativa existente
          return await this.buscarTentativaPorId(tentativaExistente.id);
        } else if (tentativaExistente.status === 'FINALIZADA') {
          throw new CustomError('Você já finalizou este quiz', 400);
        }
      }

      // Criar nova tentativa
      const tentativa = await prisma.tentativaQuiz.create({
        data: {
          quizId,
          usuarioId,
          status: 'EM_ANDAMENTO',
        },
        include: {
          quiz: {
            include: {
              fase: {
                include: {
                  jornada: {
                    select: {
                      id: true,
                      titulo: true,
                      tempoLimitePorQuestao: true,
                    },
                  },
                },
              },
              perguntas: {
                select: {
                  id: true,
                  texto: true,
                  tempoSegundos: true,
                  ordem: true,
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
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
        },
      });

      logger.info('Tentativa iniciada', {
        tentativaId: tentativa.id,
        quizId,
        usuarioId,
      });

      return tentativa;
    } catch (error) {
      logger.error('Error starting attempt', { error, quizId, usuarioId });
      throw error;
    }
  }

  async buscarTentativaPorId(tentativaId: number) {
    try {
      const tentativa = await prisma.tentativaQuiz.findUnique({
        where: { id: tentativaId },
        include: {
          quiz: {
            include: {
              fase: {
                include: {
                  jornada: {
                    select: {
                      id: true,
                      titulo: true,
                      tempoLimitePorQuestao: true,
                    },
                  },
                },
              },
              perguntas: {
                select: {
                  id: true,
                  texto: true,
                  tempoSegundos: true,
                  ordem: true,
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
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
            },
          },
          respostas: {
            include: {
              pergunta: {
                include: {
                  alternativas: true,
                },
              },
            },
          },
        },
      });

      if (!tentativa) {
        throw new CustomError('Tentativa não encontrada', 404);
      }

      return tentativa;
    } catch (error) {
      logger.error('Error finding attempt', { error, tentativaId });
      throw error;
    }
  }

  async finalizarTentativa(tentativaId: number) {
    try {
      const tentativa = await prisma.tentativaQuiz.findUnique({
        where: { id: tentativaId },
        include: {
          respostas: true,
        },
      });

      if (!tentativa) {
        throw new CustomError('Tentativa não encontrada', 404);
      }

      if (tentativa.status === 'FINALIZADA') {
        return tentativa;
      }

      // Calcular pontuação total e tempo total
      const pontuacaoTotal = tentativa.respostas.reduce(
        (sum, resposta) => sum + resposta.pontuacao,
        0
      );
      const tempoTotal = tentativa.respostas.reduce(
        (sum, resposta) => sum + resposta.tempoResposta,
        0
      );

      // Atualizar tentativa
      const tentativaAtualizada = await prisma.tentativaQuiz.update({
        where: { id: tentativaId },
        data: {
          status: 'FINALIZADA',
          finalizadaEm: new Date(),
          pontuacaoTotal,
          tempoTotal,
        },
      });

      // Atualizar ranking do quiz
      await this.atualizarRankingQuiz(tentativa.quizId);

      logger.info('Tentativa finalizada', {
        tentativaId,
        pontuacaoTotal,
        tempoTotal,
      });

      return tentativaAtualizada;
    } catch (error) {
      logger.error('Error finishing attempt', { error, tentativaId });
      throw error;
    }
  }

  async atualizarRankingQuiz(quizId: number) {
    try {
      // Buscar todas as tentativas finalizadas do quiz, ordenadas por pontuação e tempo
      const tentativas = await prisma.tentativaQuiz.findMany({
        where: {
          quizId,
          status: 'FINALIZADA',
        },
        orderBy: [
          { pontuacaoTotal: 'desc' },
          { tempoTotal: 'asc' },
        ],
      });

      // Atualizar posição no ranking
      for (let i = 0; i < tentativas.length; i++) {
        await prisma.tentativaQuiz.update({
          where: { id: tentativas[i].id },
          data: { posicaoRanking: i + 1 },
        });
      }

      logger.info('Ranking atualizado', { quizId, totalTentativas: tentativas.length });
    } catch (error) {
      logger.error('Error updating ranking', { error, quizId });
      throw error;
    }
  }

  async obterRankingQuiz(quizId: number, limit: number = 10) {
    try {
      const ranking = await prisma.tentativaQuiz.findMany({
        where: {
          quizId,
          status: 'FINALIZADA',
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              matricula: true,
            },
          },
          respostas: {
            select: {
              acertou: true,
              tempoResposta: true,
            },
          },
        },
        orderBy: [
          { pontuacaoTotal: 'desc' },
          { tempoTotal: 'asc' },
        ],
        take: limit,
      });

      return ranking.map((tentativa, index) => {
        const acertos = tentativa.respostas.filter((r) => r.acertou).length;
        const totalPerguntas = tentativa.respostas.length;
        
        return {
          posicao: index + 1,
          usuario: tentativa.usuario,
          pontuacaoTotal: tentativa.pontuacaoTotal,
          tempoTotal: tentativa.tempoTotal,
          acertos,
          totalPerguntas,
          percentualAcertos: totalPerguntas > 0 
            ? Math.round((acertos / totalPerguntas) * 100) 
            : 0,
        };
      });
    } catch (error) {
      logger.error('Error getting ranking', { error, quizId });
      throw error;
    }
  }

  async listarTentativasDoUsuario(usuarioId: number) {
    try {
      const tentativas = await prisma.tentativaQuiz.findMany({
        where: { usuarioId },
        include: {
          quiz: {
            select: {
              id: true,
              titulo: true,
              descricao: true,
            },
          },
          respostas: {
            select: {
              id: true,
              acertou: true,
              tempoResposta: true,
              pontuacao: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return tentativas;
    } catch (error) {
      logger.error('Error listing user attempts', { error, usuarioId });
      throw error;
    }
  }
}

export default new TentativaService();

