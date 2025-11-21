import prisma from '../config/database';
import { BaseRepository } from '../base/BaseRepository';
import { Quiz, Pergunta, Alternativa } from '@prisma/client';

/**
 * Repositório para Quiz
 * Implementa o padrão Repository Pattern
 */
export class QuizRepository extends BaseRepository<Quiz, number> {
  constructor() {
    super(prisma, 'quiz');
  }

  /**
   * Busca quiz com perguntas e alternativas
   */
  async findByIdWithQuestions(id: number): Promise<(Quiz & { perguntas: (Pergunta & { alternativas: Alternativa[] })[] }) | null> {
    try {
      return await prisma.quiz.findUnique({
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca quizzes por fase
   */
  async findByFaseId(faseId: number, includeInactive: boolean = false): Promise<Quiz[]> {
    try {
      return await prisma.quiz.findMany({
        where: {
          faseId,
          ...(includeInactive ? {} : { ativo: true }),
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
        orderBy: {
          ordem: 'asc',
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca quizzes disponíveis para um usuário
   */
  async findAvailableForUser(usuarioId: number): Promise<Quiz[]> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          grupo: true,
        },
      });

      if (!usuario) {
        return [];
      }

      const atribuicoes = await prisma.atribuicaoQuiz.findMany({
        where: {
          OR: [
            { usuarioId },
            ...(usuario.grupoId ? [{ grupoId: usuario.grupoId }] : []),
          ],
        },
        include: {
          quiz: true,
        },
      });

      const agora = new Date();
      const quizIds = atribuicoes
        .map(a => a.quiz)
        .filter(quiz => {
          if (quiz.dataInicio && agora < quiz.dataInicio) return false;
          if (quiz.dataFim && agora > quiz.dataFim) return false;
          return quiz.ativo;
        })
        .map(quiz => quiz.id);

      return await prisma.quiz.findMany({
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
    } catch (error) {
      throw error;
    }
  }

  /**
   * Verifica se existe quiz ativo na fase
   */
  async hasActiveQuizInFase(faseId: number): Promise<boolean> {
    try {
      const count = await prisma.quiz.count({
        where: {
          faseId,
          ativo: true,
        },
      });
      return count > 0;
    } catch (error) {
      throw error;
    }
  }
}

