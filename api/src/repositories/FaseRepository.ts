import prisma from '../config/database';
import { BaseRepository } from '../base/BaseRepository';
import { Fase } from '@prisma/client';

/**
 * Repositório para Fase
 * Implementa o padrão Repository Pattern
 */
export class FaseRepository extends BaseRepository<Fase, number> {
  constructor() {
    super(prisma, 'fase');
  }

  /**
   * Busca fase com jornada e quizzes
   */
  async findByIdWithRelations(id: number, usuarioId?: number) {
    try {
      return await prisma.fase.findUnique({
        where: { id },
        include: {
          jornada: {
            select: {
              id: true,
              titulo: true,
            },
          },
          _count: {
            select: {
              quizzes: true,
            },
          },
          quizzes: {
            where: {
              ativo: true,
            },
            include: {
              _count: {
                select: {
                  perguntas: true,
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
          desbloqueios: usuarioId
            ? {
                where: {
                  usuarioId,
                },
              }
            : false,
        },
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Busca fases por jornada
   */
  async findByJornadaId(jornadaId: number, includeInactive: boolean = false) {
    try {
      return await prisma.fase.findMany({
        where: {
          jornadaId,
          ...(includeInactive ? {} : { ativo: true }),
        },
        include: {
          jornada: {
            select: {
              id: true,
              titulo: true,
            },
          },
          _count: {
            select: {
              quizzes: true,
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
   * Busca fase atual do usuário
   */
  async findCurrentForUser(usuarioId: number) {
    try {
      const desbloqueio = await prisma.desbloqueioFase.findFirst({
        where: {
          usuarioId,
          faseAtual: true,
        },
        include: {
          fase: {
            include: {
              jornada: {
                select: {
                  id: true,
                  titulo: true,
                },
              },
              quizzes: {
                where: {
                  ativo: true,
                },
                include: {
                  _count: {
                    select: {
                      perguntas: true,
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

      return desbloqueio?.fase || null;
    } catch (error) {
      throw error;
    }
  }
}

