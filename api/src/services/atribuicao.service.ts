import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';

export class AtribuicaoService {
  async atribuirQuiz(dados: {
    quizId: number;
    usuarioIds?: number[];
    grupoIds?: number[];
    atribuidoPor?: number;
  }) {
    try {
      const { quizId, usuarioIds = [], grupoIds = [], atribuidoPor } = dados;

      // Verificar se o quiz existe
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
      });

      if (!quiz) {
        throw new CustomError('Quiz não encontrado', 404);
      }

      const atribuicoes = [];

      // Atribuir a usuários específicos
      for (const usuarioId of usuarioIds) {
        const usuario = await prisma.usuario.findUnique({
          where: { id: usuarioId },
        });

        if (!usuario) {
          logger.warn('User not found for assignment', { usuarioId });
          continue;
        }

        // Verificar se já existe atribuição
        const existe = await prisma.atribuicaoQuiz.findFirst({
          where: {
            quizId,
            usuarioId,
          },
        });

        if (!existe) {
          const atribuicao = await prisma.atribuicaoQuiz.create({
            data: {
              quizId,
              usuarioId,
              atribuidoPor,
            },
          });
          atribuicoes.push(atribuicao);
        }
      }

      // Atribuir a grupos
      for (const grupoId of grupoIds) {
        const grupo = await prisma.grupo.findUnique({
          where: { id: grupoId },
        });

        if (!grupo) {
          logger.warn('Group not found for assignment', { grupoId });
          continue;
        }

        // Verificar se já existe atribuição
        const existe = await prisma.atribuicaoQuiz.findFirst({
          where: {
            quizId,
            grupoId,
          },
        });

        if (!existe) {
          const atribuicao = await prisma.atribuicaoQuiz.create({
            data: {
              quizId,
              grupoId,
              atribuidoPor,
            },
          });
          atribuicoes.push(atribuicao);
        }
      }

      logger.info('Quiz assignments created', {
        quizId,
        atribuicoesCriadas: atribuicoes.length,
      });

      return atribuicoes;
    } catch (error) {
      logger.error('Error assigning quiz', { error });
      throw error;
    }
  }

  async removerAtribuicao(id: number) {
    try {
      await prisma.atribuicaoQuiz.delete({
        where: { id },
      });

      logger.info('Assignment removed', { atribuicaoId: id });
    } catch (error) {
      logger.error('Error removing assignment', { error, atribuicaoId: id });
      throw error;
    }
  }

  async listarAtribuicoesPorQuiz(quizId: number) {
    try {
      const atribuicoes = await prisma.atribuicaoQuiz.findMany({
        where: { quizId },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
              email: true,
              matricula: true,
            },
          },
          grupo: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
      });

      return atribuicoes;
    } catch (error) {
      logger.error('Error listing assignments', { error, quizId });
      throw error;
    }
  }

  async verificarSeUsuarioTemAcesso(quizId: number, usuarioId: number): Promise<boolean> {
    try {
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        include: {
          grupo: true,
        },
      });

      if (!usuario) {
        return false;
      }

      // Verificar atribuição direta ao usuário
      const atribuicaoDireta = await prisma.atribuicaoQuiz.findFirst({
        where: {
          quizId,
          usuarioId,
        },
      });

      if (atribuicaoDireta) {
        return true;
      }

      // Verificar atribuição por grupo
      if (usuario.grupoId) {
        const atribuicaoGrupo = await prisma.atribuicaoQuiz.findFirst({
          where: {
            quizId,
            grupoId: usuario.grupoId,
          },
        });

        if (atribuicaoGrupo) {
          return true;
        }
      }

      // Se não há atribuição específica, verificar se a fase está desbloqueada
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          fase: {
            select: {
              id: true,
              jornadaId: true,
              dataDesbloqueio: true,
              dataBloqueio: true,
              ativo: true,
            },
          },
        },
      });

      if (!quiz || !quiz.fase) {
        return false;
      }

      // Se a fase não está ativa, o usuário não tem acesso
      if (!quiz.fase.ativo) {
        return false;
      }

      // Verificar se a jornada tem sequência de desbloqueio
      const fasesDaJornada = await prisma.fase.findMany({
        where: {
          jornadaId: quiz.fase.jornadaId,
          ativo: true,
        },
        select: {
          dataDesbloqueio: true,
        },
      });

      const jornadaTemDesbloqueio = fasesDaJornada.some((f) => f.dataDesbloqueio !== null);

      if (!jornadaTemDesbloqueio) {
        // Se não tem sequência de desbloqueio, todas as fases estão abertas
        return true;
      }

      // Se tem sequência de desbloqueio, verificar se a fase está desbloqueada
      if (quiz.fase.dataDesbloqueio) {
        const agora = new Date();
        // Verificar se a data de desbloqueio já passou
        const desbloqueada = new Date(quiz.fase.dataDesbloqueio) <= agora;
        // Verificar se a data de bloqueio já passou (se existir)
        const bloqueada = quiz.fase.dataBloqueio ? new Date(quiz.fase.dataBloqueio) <= agora : false;
        // Está desbloqueada se passou a data de desbloqueio E não passou a data de bloqueio
        if (desbloqueada && !bloqueada) {
          return true;
        }
      }

      // Verificar desbloqueio manual
      const desbloqueio = await prisma.desbloqueioFase.findFirst({
        where: {
          faseId: quiz.fase.id,
          usuarioId,
        },
      });

      return !!desbloqueio;
    } catch (error) {
      logger.error('Error checking user access', { error, quizId, usuarioId });
      return false;
    }
  }
}

export default new AtribuicaoService();

