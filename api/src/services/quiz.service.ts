import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';

export class QuizService {
  async listarQuizzes() {
    try {
      const quizzes = await prisma.quiz.findMany({
        include: {
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
              sessoes: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return quizzes;
    } catch (error) {
      logger.error('Error listing quizzes', { error });
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

  async buscarPorCodigo(codigo: string) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { codigoAcesso: codigo },
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
      });

      if (!quiz) {
        throw new CustomError('Quiz não encontrado', 404);
      }

      return quiz;
    } catch (error) {
      logger.error('Error finding quiz by code', { error, codigo });
      throw error;
    }
  }

  async criarQuiz(dados: {
    titulo: string;
    descricao?: string;
    pontosBase?: number;
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
      // Gerar código único
      let codigoAcesso: string;
      let codigoExiste = true;

      while (codigoExiste) {
        codigoAcesso = Math.random().toString(36).substring(2, 8).toUpperCase();
        const existe = await prisma.quiz.findUnique({
          where: { codigoAcesso },
        });
        codigoExiste = !!existe;
      }

      const quiz = await prisma.quiz.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          pontosBase: dados.pontosBase || 100,
          codigoAcesso: codigoAcesso!,
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
          perguntas: {
            include: {
              alternativas: true,
            },
          },
        },
      });

      logger.info('Quiz created', { quizId: quiz.id, codigoAcesso: quiz.codigoAcesso });

      return quiz;
    } catch (error) {
      logger.error('Error creating quiz', { error });
      throw error;
    }
  }

  async atualizarQuiz(id: number, dados: {
    titulo?: string;
    descricao?: string;
    pontosBase?: number;
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

