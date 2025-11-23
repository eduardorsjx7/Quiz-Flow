import prisma from '../config/database';
import { BaseRepository } from '../base/BaseRepository';

/**
 * Repositório para Fase
 * Implementa o padrão Repository Pattern
 */
export class FaseRepository extends BaseRepository<any, number> {
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
              tempoLimitePorQuestao: true,
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
   * Se não houver fase atual definida manualmente, busca a primeira fase de uma jornada aberta
   */
  async findCurrentForUser(usuarioId: number) {
    try {
      // Primeiro, tenta buscar uma fase atual definida manualmente
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

      if (desbloqueio?.fase) {
        return desbloqueio.fase;
      }

      // Se não houver fase atual definida, busca a primeira fase de uma jornada aberta
      // (jornada onde nenhuma fase tem dataDesbloqueio)
      const jornadas = await prisma.jornada.findMany({
        where: {
          ativo: true,
        },
        include: {
          fases: {
            where: {
              ativo: true,
            },
            select: {
              id: true,
              dataDesbloqueio: true,
            },
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      // Encontrar jornadas abertas (sem dataDesbloqueio em nenhuma fase)
      const jornadasAbertas = jornadas.filter((jornada: any) => 
        jornada.fases.length > 0 && 
        jornada.fases.every((fase: any) => fase.dataDesbloqueio === null)
      );

      if (jornadasAbertas.length > 0) {
        // Pegar a primeira fase da primeira jornada aberta
        const primeiraJornadaAberta = jornadasAbertas[0];
        const primeiraFase = await prisma.fase.findFirst({
          where: {
            jornadaId: primeiraJornadaAberta.id,
            ativo: true,
          },
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
          orderBy: {
            ordem: 'asc',
          },
        });

        return primeiraFase;
      }

      return null;
    } catch (error) {
      throw error;
    }
  }
}

