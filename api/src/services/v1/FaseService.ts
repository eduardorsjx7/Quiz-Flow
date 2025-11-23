import { BaseService } from '../../base/BaseService';
import { FaseRepository } from '../../repositories/FaseRepository';
import { CreateFaseDTO, UpdateFaseDTO } from '../../dto/fase.dto';
import logger from '../../config/logger';
import prisma from '../../config/database';

/**
 * Serviço refatorado para Fase usando Design Patterns
 */
export class FaseService extends BaseService {
  private faseRepository: FaseRepository;

  constructor(faseRepository?: FaseRepository) {
    super();
    this.faseRepository = faseRepository || new FaseRepository();
  }

  async listarFases(usuarioId?: number, apenasFaseAtual: boolean = false) {
    try {
      if (usuarioId && apenasFaseAtual) {
        const faseAtual = await this.faseRepository.findCurrentForUser(usuarioId);
        if (!faseAtual) {
          return [];
        }
        return [faseAtual];
      }

      const fases = await this.faseRepository.findMany(
        { ativo: true },
        {
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
        {
          ordem: 'asc',
        }
      );

      // Verificar se alguma jornada tem fases com dataDesbloqueio definida
      // Agrupar fases por jornada para verificar se cada jornada tem sequência de desbloqueio
      const jornadasComDesbloqueio = new Set<number>();
      fases.forEach((fase: any) => {
        if (fase.dataDesbloqueio !== null) {
          jornadasComDesbloqueio.add(fase.jornadaId || fase.jornada?.id);
        }
      });

      if (usuarioId) {
        return fases.map((fase: any) => {
          const desbloqueio = fase.desbloqueios?.[0];
          const jornadaId = fase.jornadaId || fase.jornada?.id;
          const jornadaTemDesbloqueio = jornadasComDesbloqueio.has(jornadaId);
          
          // Se a jornada não tem nenhuma fase com dataDesbloqueio, todas estão desbloqueadas
          let estaDesbloqueada = true;
          if (jornadaTemDesbloqueio) {
            // Se tem sequência de desbloqueio, verificar se está desbloqueada
            if (fase.dataDesbloqueio) {
              // Verificar se a data de desbloqueio já passou
              estaDesbloqueada = new Date(fase.dataDesbloqueio) <= new Date();
            } else {
              // Se não tem dataDesbloqueio mas a jornada tem sequência, precisa de desbloqueio manual
              estaDesbloqueada = !!desbloqueio;
            }
          }
          // Se não tem sequência de desbloqueio (jornadaTemDesbloqueio = false), todas estão desbloqueadas (true)
          
          return {
            ...fase,
            desbloqueada: estaDesbloqueada,
            faseAtual: desbloqueio?.faseAtual || false,
            desbloqueios: undefined,
          };
        });
      }

      return fases.map((fase: any) => ({
        ...fase,
        desbloqueios: undefined,
      }));
    } catch (error) {
      this.handleError(error, 'listarFases');
    }
  }

  async obterFaseAtualDoUsuario(usuarioId: number) {
    try {
      const fase = await this.faseRepository.findCurrentForUser(usuarioId);
      if (!fase) {
        return null;
      }
      return {
        ...fase,
        desbloqueada: true,
        faseAtual: true,
        quizzes: fase.quizzes || [],
      };
    } catch (error) {
      this.handleError(error, 'obterFaseAtualDoUsuario');
    }
  }

  async buscarPorId(id: number, usuarioId?: number) {
    try {
      const fase = await this.faseRepository.findByIdWithRelations(id, usuarioId);
      if (!fase) {
        throw new Error('Fase não encontrada');
      }

      // Verificar se a jornada tem alguma fase com dataDesbloqueio definida
      const jornadaId = (fase as any).jornadaId;
      const fasesDaJornada = await prisma.fase.findMany({
        where: {
          jornadaId,
          ativo: true,
        },
        select: {
          dataDesbloqueio: true,
        },
      });

      const jornadaTemDesbloqueio = fasesDaJornada.some((f) => f.dataDesbloqueio !== null);
      const desbloqueio = (fase as any).desbloqueios?.[0];
      
      // Se a jornada não tem nenhuma fase com dataDesbloqueio, todas estão desbloqueadas
      const estaDesbloqueada = jornadaTemDesbloqueio 
        ? !!desbloqueio || ((fase as any).dataDesbloqueio && new Date((fase as any).dataDesbloqueio) <= new Date())
        : true; // Todas desbloqueadas se não houver sequência de desbloqueio

      return {
        ...fase,
        desbloqueada: estaDesbloqueada,
        faseAtual: desbloqueio?.faseAtual || false,
        desbloqueios: undefined,
      };
    } catch (error) {
      this.handleError(error, 'buscarPorId');
    }
  }

  async criarFase(dados: CreateFaseDTO & { criadoPor?: number }) {
    try {
      const jornada = await prisma.jornada.findUnique({
        where: { id: dados.jornadaId },
      });

      if (!jornada) {
        throw new Error('Jornada não encontrada');
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
              titulo: dados.titulo,
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
      this.handleError(error, 'criarFase');
    }
  }

  async atualizarFase(id: number, dados: UpdateFaseDTO) {
    try {
      await this.validateResourceExists(this.faseRepository, id, 'Fase');
      const fase = await this.faseRepository.update(id, dados);
      logger.info('Fase updated', { faseId: id });
      return fase;
    } catch (error) {
      this.handleError(error, 'atualizarFase');
    }
  }

  async deletarFase(id: number) {
    try {
      await this.validateResourceExists(this.faseRepository, id, 'Fase');
      await this.faseRepository.delete(id);
      logger.info('Fase deleted', { faseId: id });
    } catch (error) {
      this.handleError(error, 'deletarFase');
    }
  }

  async desbloquearFaseParaUsuario(
    faseId: number,
    usuarioId: number,
    desbloqueadoPor?: number,
    definirComoAtual: boolean = false
  ) {
    try {
      await this.validateResourceExists(this.faseRepository, faseId, 'Fase');
      
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
      });

      if (!usuario) {
        throw new Error('Usuário não encontrado');
      }

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
      });

      return desbloqueio;
    } catch (error) {
      this.handleError(error, 'desbloquearFaseParaUsuario');
    }
  }

  async desbloquearFaseParaTodosUsuarios(faseId: number, desbloqueadoPor?: number) {
    try {
      await this.validateResourceExists(this.faseRepository, faseId, 'Fase');

      const usuarios = await prisma.usuario.findMany({
        where: {
          tipo: 'COLABORADOR',
        },
      });

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
      this.handleError(error, 'desbloquearFaseParaTodosUsuarios');
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
      this.handleError(error, 'bloquearFaseParaUsuario');
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
      this.handleError(error, 'listarUsuariosComDesbloqueio');
    }
  }
}

