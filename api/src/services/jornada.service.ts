import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';

export class JornadaService {
  async listarJornadas() {
    try {
      const jornadas = await prisma.jornada.findMany({
        where: { ativo: true },
        include: {
          _count: {
            select: {
              fases: true,
            },
          },
        },
        orderBy: {
          ordem: 'asc',
        },
      });

      return jornadas;
    } catch (error) {
      logger.error('Error listing jornadas', { error });
      throw error;
    }
  }

  async buscarPorId(id: number) {
    try {
      const jornada = await prisma.jornada.findUnique({
        where: { id },
        include: {
          fases: {
            include: {
              _count: {
                select: {
                  quizzes: true,
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      if (!jornada) {
        throw new CustomError('Jornada não encontrada', 404);
      }

      return jornada;
    } catch (error) {
      logger.error('Error finding jornada by id', { error, jornadaId: id });
      throw error;
    }
  }

  async criarJornada(dados: {
    titulo: string;
    descricao?: string;
    ordem?: number;
    criadoPor?: number;
    fases?: Array<{
      titulo: string;
      descricao?: string;
      ordem: number;
    }>;
  }) {
    try {
      const jornada = await prisma.jornada.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          ordem: dados.ordem || 0,
          criadoPor: dados.criadoPor,
          fases: dados.fases && dados.fases.length > 0
            ? {
                create: dados.fases.map((fase) => ({
                  titulo: fase.titulo,
                  descricao: fase.descricao,
                  ordem: fase.ordem,
                  criadoPor: dados.criadoPor,
                  quizzes: {
                    create: {
                      titulo: fase.titulo, // Quiz tem o mesmo título da fase
                      descricao: fase.descricao,
                      ordem: 0,
                      pontosBase: 100,
                      criadoPor: dados.criadoPor,
                    },
                  },
                })),
              }
            : undefined,
        },
        include: {
          fases: {
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      logger.info('Jornada created', { jornadaId: jornada.id, fasesCount: dados.fases?.length || 0 });

      return jornada;
    } catch (error) {
      logger.error('Error creating jornada', { error });
      throw error;
    }
  }

  async atualizarJornada(id: number, dados: {
    titulo?: string;
    descricao?: string;
    ordem?: number;
    ativo?: boolean;
  }) {
    try {
      const jornada = await prisma.jornada.update({
        where: { id },
        data: dados,
      });

      logger.info('Jornada updated', { jornadaId: id });

      return jornada;
    } catch (error) {
      logger.error('Error updating jornada', { error, jornadaId: id });
      throw error;
    }
  }

  async deletarJornada(id: number) {
    try {
      await prisma.jornada.delete({
        where: { id },
      });

      logger.info('Jornada deleted', { jornadaId: id });
    } catch (error) {
      logger.error('Error deleting jornada', { error, jornadaId: id });
      throw error;
    }
  }
}

export default new JornadaService();

