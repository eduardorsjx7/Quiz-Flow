import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';

export class FaseService {
  async listarFases(usuarioId?: number, apenasFaseAtual: boolean = false) {
    try {
      let whereClause: any = { ativo: true };

      // Se for colaborador e deve mostrar apenas fase atual
      if (usuarioId && apenasFaseAtual) {
        const faseAtual = await prisma.desbloqueioFase.findFirst({
          where: {
            usuarioId,
            faseAtual: true,
          },
          include: {
            fase: true,
          },
        });

        if (faseAtual) {
          whereClause.id = faseAtual.faseId;
        } else {
          // Se não tem fase atual, retornar array vazio
          return [];
        }
      }

      const fases = await prisma.fase.findMany({
        where: whereClause,
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
        orderBy: {
          ordem: 'asc',
        },
      });

      // Se há um usuário logado, marcar quais fases estão desbloqueadas e qual é a atual
      if (usuarioId) {
        return fases.map((fase) => {
          const desbloqueio = fase.desbloqueios?.[0];
          return {
            ...fase,
            desbloqueada: !!desbloqueio,
            faseAtual: desbloqueio?.faseAtual || false,
            desbloqueios: undefined, // Remover do retorno
          };
        });
      }

      return fases.map((fase) => ({
        ...fase,
        desbloqueios: undefined,
      }));
    } catch (error) {
      logger.error('Error listing fases', { error });
      throw error;
    }
  }

  async obterFaseAtualDoUsuario(usuarioId: number) {
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

      if (!desbloqueio) {
        return null;
      }

      return {
        ...desbloqueio.fase,
        desbloqueada: true,
        faseAtual: true,
      };
    } catch (error) {
      logger.error('Error getting current fase for user', { error, usuarioId });
      throw error;
    }
  }

  async buscarPorId(id: number, usuarioId?: number) {
    try {
      const fase = await prisma.fase.findUnique({
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

      if (!fase) {
        throw new CustomError('Fase não encontrada', 404);
      }

      const desbloqueio = fase.desbloqueios?.[0];
      const desbloqueada = !!desbloqueio;

      return {
        ...fase,
        desbloqueada,
        faseAtual: desbloqueio?.faseAtual || false,
        desbloqueios: undefined,
      };
    } catch (error) {
      logger.error('Error finding fase', { error, id });
      throw error;
    }
  }

  async criarFase(dados: {
    jornadaId: number;
    titulo: string;
    descricao?: string;
    ordem?: number;
    criadoPor?: number;
  }) {
    try {
      // Verificar se a jornada existe
      const jornada = await prisma.jornada.findUnique({
        where: { id: dados.jornadaId },
      });

      if (!jornada) {
        throw new CustomError('Jornada não encontrada', 404);
      }

      const fase = await prisma.fase.create({
        data: {
          jornadaId: dados.jornadaId,
          titulo: dados.titulo,
          descricao: dados.descricao,
          ordem: dados.ordem || 0,
          criadoPor: dados.criadoPor,
          ativo: true,
          quizzes: {
            create: {
              titulo: dados.titulo, // Quiz tem o mesmo título da fase
              descricao: dados.descricao,
              ordem: 0,
              pontosBase: 100,
              criadoPor: dados.criadoPor,
            },
          },
        },
        include: {
          jornada: {
            select: {
              id: true,
              titulo: true,
            },
          },
          quizzes: {
            include: {
              _count: {
                select: {
                  perguntas: true,
                },
              },
            },
          },
        },
      });

      logger.info('Fase created', { faseId: fase.id, jornadaId: dados.jornadaId });
      return fase;
    } catch (error) {
      logger.error('Error creating fase', { error, dados });
      throw error;
    }
  }

  async atualizarFase(id: number, dados: {
    titulo?: string;
    descricao?: string;
    ordem?: number;
    ativo?: boolean;
  }) {
    try {
      const fase = await prisma.fase.update({
        where: { id },
        data: {
          ...dados,
        },
        include: {
          quizzes: true,
        },
      });

      logger.info('Fase updated', { faseId: id });
      return fase;
    } catch (error) {
      logger.error('Error updating fase', { error, id, dados });
      throw error;
    }
  }

  async deletarFase(id: number) {
    try {
      await prisma.fase.delete({
        where: { id },
      });

      logger.info('Fase deleted', { faseId: id });
    } catch (error) {
      logger.error('Error deleting fase', { error, id });
      throw error;
    }
  }

  async desbloquearFaseParaUsuario(
    faseId: number,
    usuarioId: number,
    desbloqueadoPor?: number,
    definirComoAtual: boolean = false
  ) {
    try {
      // Verificar se a fase existe
      const fase = await prisma.fase.findUnique({
        where: { id: faseId },
      });

      if (!fase) {
        throw new CustomError('Fase não encontrada', 404);
      }

      // Verificar se o usuário existe
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new CustomError('Usuário não encontrado', 404);
      }

      // Se deve definir como fase atual, remover faseAtual de outras fases do usuário
      if (definirComoAtual) {
        await prisma.desbloqueioFase.updateMany({
          where: {
            usuarioId,
            faseAtual: true,
          },
          data: {
            faseAtual: false,
          },
        });
      }

      // Criar ou atualizar desbloqueio
      const desbloqueio = await prisma.desbloqueioFase.upsert({
        where: {
          faseId_usuarioId: {
            faseId,
            usuarioId,
          },
        },
        create: {
          faseId,
          usuarioId,
          faseAtual: definirComoAtual,
          desbloqueadoPor,
        },
        update: {
          faseAtual: definirComoAtual,
          desbloqueadoEm: new Date(),
          desbloqueadoPor,
        },
      });

      logger.info('Fase unlocked for user', {
        faseId,
        usuarioId,
        faseAtual: definirComoAtual,
        desbloqueioId: desbloqueio.id,
      });

      return desbloqueio;
    } catch (error) {
      logger.error('Error unlocking fase', { error, faseId, usuarioId });
      throw error;
    }
  }

  async desbloquearFaseParaTodosUsuarios(faseId: number, desbloqueadoPor?: number) {
    try {
      const fase = await prisma.fase.findUnique({
        where: { id: faseId },
      });

      if (!fase) {
        throw new CustomError('Fase não encontrada', 404);
      }

      // Buscar todos os usuários colaboradores
      const usuarios = await prisma.usuario.findMany({
        where: {
          tipo: 'COLABORADOR',
        },
      });

      // Criar desbloqueios para todos
      const desbloqueios = await Promise.all(
        usuarios.map((usuario) =>
          prisma.desbloqueioFase.upsert({
            where: {
              faseId_usuarioId: {
                faseId,
                usuarioId: usuario.id,
              },
            },
            create: {
              faseId,
              usuarioId: usuario.id,
              desbloqueadoPor,
            },
            update: {
              desbloqueadoEm: new Date(),
              desbloqueadoPor,
            },
          })
        )
      );

      logger.info('Fase unlocked for all users', {
        faseId,
        usuariosCount: usuarios.length,
      });

      return desbloqueios;
    } catch (error) {
      logger.error('Error unlocking fase for all users', { error, faseId });
      throw error;
    }
  }

  async bloquearFaseParaUsuario(faseId: number, usuarioId: number) {
    try {
      await prisma.desbloqueioFase.delete({
        where: {
          faseId_usuarioId: {
            faseId,
            usuarioId,
          },
        },
      });

      logger.info('Fase locked for user', { faseId, usuarioId });
    } catch (error) {
      logger.error('Error locking fase', { error, faseId, usuarioId });
      throw error;
    }
  }

  async listarUsuariosComDesbloqueio(faseId: number) {
    try {
      const desbloqueios = await prisma.desbloqueioFase.findMany({
        where: { faseId },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              matricula: true,
            },
          },
        },
        orderBy: {
          desbloqueadoEm: 'desc',
        },
      });

      return desbloqueios;
    } catch (error) {
      logger.error('Error listing users with unlock', { error, faseId });
      throw error;
    }
  }
}

