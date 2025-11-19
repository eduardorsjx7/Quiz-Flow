import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';
import atribuicaoService from './atribuicao.service';

export class QuizService {
  async listarQuizzes(faseId?: number) {
    try {
      const quizzes = await prisma.quiz.findMany({
        where: {
          ...(faseId ? { faseId } : {}),
          ativo: true,
        },
        include: {
          fase: {
            select: {
              id: true,
              titulo: true,
            },
          },
          perguntas: {
            include: {
              alternativas: true,
            },
            orderBy: {
              ordem: 'asc',
            },
          },
          _count: {
            select: {
              tentativas: true,
            },
          },
        },
        orderBy: {
          ordem: 'asc',
        },
      });

      return quizzes;
    } catch (error) {
      logger.error('Error listing quizzes', { error });
      throw error;
    }
  }

  async listarQuizzesDisponiveisParaUsuario(usuarioId: number) {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          grupo: true,
        },
      });

      if (!usuario) {
        throw new CustomError('Usuário não encontrado', 404);
      }

      // Buscar atribuições do usuário (direta ou por grupo)
      const atribuicoes = await prisma.atribuicaoQuiz.findMany({
        where: {
          OR: [
            { usuarioId },
            ...(usuario.grupoId ? [{ grupoId: usuario.grupoId }] : []),
          ],
        },
        include: {
          quiz: {
            include: {
              fase: {
                select: {
                  id: true,
                  titulo: true,
                },
              },
              _count: {
                select: {
                  perguntas: true,
                },
              },
            },
          },
        },
      });

      const agora = new Date();
      const quizIds = atribuicoes
        .map((a: any) => a.quiz)
        .filter((quiz: any) => {
          // Verificar período de disponibilidade
          if (quiz.dataInicio && agora < quiz.dataInicio) return false;
          if (quiz.dataFim && agora > quiz.dataFim) return false;
          return quiz.ativo;
        })
        .map((quiz: any) => quiz.id);

      // Buscar quizzes com informações de tentativas do usuário
      const quizzes = await prisma.quiz.findMany({
        where: {
          id: { in: quizIds },
        },
        include: {
          fase: {
            select: {
              id: true,
              titulo: true,
            },
          },
          tentativas: {
            where: {
              usuarioId,
            },
            select: {
              id: true,
              status: true,
              pontuacaoTotal: true,
              finalizadaEm: true,
            },
          },
          _count: {
            select: {
              perguntas: true,
            },
          },
        },
        orderBy: {
          ordem: 'asc',
        },
      });

      // Formatar resposta com status de cada quiz
      return quizzes.map((quiz: any) => {
        const tentativa = quiz.tentativas[0];
        let status: 'pendente' | 'em_andamento' | 'concluido' = 'pendente';

        if (tentativa) {
          if (tentativa.status === 'FINALIZADA') {
            status = 'concluido';
          } else if (tentativa.status === 'EM_ANDAMENTO') {
            status = 'em_andamento';
          }
        }

        return {
          ...quiz,
          status,
          tentativa: tentativa || null,
        };
      });
    } catch (error) {
      logger.error('Error listing available quizzes for user', { error, usuarioId });
      throw error;
    }
  }

  async buscarPorId(id: number) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
          perguntas: {
            include: {
              alternativas: true,
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

      return quiz;
    } catch (error) {
      logger.error('Error finding quiz by id', { error, quizId: id });
      throw error;
    }
  }

  async buscarQuizPorFase(faseId: number) {
    try {
      const quiz = await prisma.quiz.findFirst({
        where: {
          faseId,
          ativo: true,
        },
        include: {
          fase: {
            select: {
              id: true,
              titulo: true,
            },
          },
          perguntas: {
            include: {
              alternativas: true,
            },
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      return quiz;
    } catch (error) {
      logger.error('Error finding quiz by fase', { error, faseId });
      throw error;
    }
  }

  async criarQuiz(dados: {
    titulo: string;
    descricao?: string;
    faseId: number;
    ordem?: number;
    pontosBase?: number;
    tags?: string;
    dataInicio?: Date;
    dataFim?: Date;
    criadoPor?: number;
    perguntas: Array<{
      texto: string;
      tempoSegundos?: number;
      alternativas: Array<{
        texto: string;
        correta: boolean;
      }>;
    }>;
  }) {
    try {
      // Verificar se a fase existe
      const fase = await prisma.fase.findUnique({
        where: { id: dados.faseId },
        include: {
          quizzes: {
            where: {
              ativo: true,
            },
          },
        },
      });

      if (!fase) {
        throw new CustomError('Fase não encontrada', 404);
      }

      // Verificar se já existe um quiz ativo nesta fase
      if (fase.quizzes.length > 0) {
        throw new CustomError('Esta fase já possui um quiz. Cada fase pode ter apenas um quiz.', 400);
      }

      const quiz = await prisma.quiz.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          faseId: dados.faseId,
          ordem: dados.ordem || 0,
          pontosBase: dados.pontosBase || 100,
          tags: dados.tags,
          dataInicio: dados.dataInicio,
          dataFim: dados.dataFim,
          criadoPor: dados.criadoPor,
          perguntas: {
            create: dados.perguntas.map((pergunta, index) => ({
              texto: pergunta.texto,
              tempoSegundos: pergunta.tempoSegundos || 30,
              ordem: index + 1,
              alternativas: {
                create: pergunta.alternativas.map((alt, altIndex) => ({
                  texto: alt.texto,
                  correta: alt.correta || false,
                  ordem: altIndex + 1,
                })),
              },
            })),
          },
        },
        include: {
          fase: {
            select: {
              id: true,
              titulo: true,
            },
          },
          perguntas: {
            include: {
              alternativas: true,
            },
          },
        },
      });

      logger.info('Quiz created', { quizId: quiz.id, faseId: dados.faseId });

      return quiz;
    } catch (error) {
      logger.error('Error creating quiz', { error });
      throw error;
    }
  }

  async atualizarQuiz(id: number, dados: {
    titulo?: string;
    descricao?: string;
    faseId?: number;
    ordem?: number;
    pontosBase?: number;
    tags?: string;
    dataInicio?: Date;
    dataFim?: Date;
    ativo?: boolean;
  }) {
    try {
      const quiz = await prisma.quiz.update({
        where: { id },
        data: dados,
      });

      logger.info('Quiz updated', { quizId: id });

      return quiz;
    } catch (error) {
      logger.error('Error updating quiz', { error, quizId: id });
      throw error;
    }
  }

  async deletarQuiz(id: number) {
    try {
      await prisma.quiz.delete({
        where: { id },
      });

      logger.info('Quiz deleted', { quizId: id });
    } catch (error) {
      logger.error('Error deleting quiz', { error, quizId: id });
      throw error;
    }
  }

  async adicionarPergunta(quizId: number, dados: {
    texto: string;
    tempoSegundos?: number;
    alternativas: Array<{
      texto: string;
      correta: boolean;
    }>;
  }) {
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

      const ordem = quiz.perguntas.length + 1;

      const pergunta = await prisma.pergunta.create({
        data: {
          quizId,
          texto: dados.texto,
          tempoSegundos: dados.tempoSegundos || 30,
          ordem,
          alternativas: {
            create: dados.alternativas.map((alt, index) => ({
              texto: alt.texto,
              correta: alt.correta || false,
              ordem: index + 1,
            })),
          },
        },
        include: {
          alternativas: true,
        },
      });

      logger.info('Question added to quiz', { quizId, perguntaId: pergunta.id });

      return pergunta;
    } catch (error) {
      logger.error('Error adding question', { error, quizId });
      throw error;
    }
  }
}

export default new QuizService();

