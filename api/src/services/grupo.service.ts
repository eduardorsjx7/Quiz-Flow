import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';

export class GrupoService {
  async listarGrupos() {
    try {
      const grupos = await prisma.grupo.findMany({
        where: { ativo: true },
        include: {
          _count: {
            select: {
              usuarios: true,
            },
          },
        },
        orderBy: {
          nome: 'asc',
        },
      });

      return grupos;
    } catch (error) {
      logger.error('Error listing groups', { error });
      throw error;
    }
  }

  async buscarPorId(id: number) {
    try {
      const grupo = await prisma.grupo.findUnique({
        where: { id },
        include: {
          usuarios: {
            select: {
              id: true,
              nome: true,
              email: true,
              matricula: true,
            },
          },
        },
      });

      if (!grupo) {
        throw new CustomError('Grupo não encontrado', 404);
      }

      return grupo;
    } catch (error) {
      logger.error('Error finding group by id', { error, grupoId: id });
      throw error;
    }
  }

  async criarGrupo(dados: {
    nome: string;
    descricao?: string;
  }) {
    try {
      const grupo = await prisma.grupo.create({
        data: {
          nome: dados.nome,
          descricao: dados.descricao,
        },
      });

      logger.info('Group created', { grupoId: grupo.id });

      return grupo;
    } catch (error) {
      logger.error('Error creating group', { error });
      throw error;
    }
  }

  async atualizarGrupo(id: number, dados: {
    nome?: string;
    descricao?: string;
    ativo?: boolean;
  }) {
    try {
      const grupo = await prisma.grupo.update({
        where: { id },
        data: dados,
      });

      logger.info('Group updated', { grupoId: id });

      return grupo;
    } catch (error) {
      logger.error('Error updating group', { error, grupoId: id });
      throw error;
    }
  }

  async deletarGrupo(id: number) {
    try {
      await prisma.grupo.update({
        where: { id },
        data: { ativo: false },
      });

      logger.info('Group deactivated', { grupoId: id });
    } catch (error) {
      logger.error('Error deleting group', { error, grupoId: id });
      throw error;
    }
  }
}

export default new GrupoService();

