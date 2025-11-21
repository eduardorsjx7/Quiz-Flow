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

  async obterEstatisticasCompletas(jornadaId: number) {
    try {
      const jornada = await prisma.jornada.findUnique({
        where: { id: jornadaId },
        include: {
          fases: {
            include: {
              quizzes: {
                include: {
                  tentativas: {
                    where: {
                      status: 'FINALIZADA',
                    },
                    include: {
                      usuario: {
                        select: {
                          id: true,
                          nome: true,
                          email: true,
                          matricula: true,
                        },
                      },
                      respostas: true,
                    },
                  },
                  _count: {
                    select: {
                      perguntas: true,
                    },
                  },
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
          },
        },
      });

      if (!jornada) {
        throw new CustomError('Jornada não encontrada', 404);
      }

      // Calcular estatísticas por fase
      const estatisticasPorFase = jornada.fases.map((fase) => {
        const quizzes = fase.quizzes || [];
        const todasTentativas = quizzes.flatMap((q) => q.tentativas || []);
        
        const tentativasFinalizadas = todasTentativas.filter((t) => t.status === 'FINALIZADA');
        const totalTentativas = tentativasFinalizadas.length;
        
        // Calcular acertos por fase
        const totalAcertos = tentativasFinalizadas.reduce((sum, tentativa) => {
          return sum + (tentativa.respostas?.filter((r) => r.acertou).length || 0);
        }, 0);
        
        const totalPerguntas = tentativasFinalizadas.reduce((sum, tentativa) => {
          return sum + (tentativa.respostas?.length || 0);
        }, 0);
        
        const percentualAcertos = totalPerguntas > 0 
          ? Math.round((totalAcertos / totalPerguntas) * 100) 
          : 0;
        
        // Pontuação média
        const pontuacaoMedia = totalTentativas > 0
          ? Math.round(
              tentativasFinalizadas.reduce((sum, t) => sum + t.pontuacaoTotal, 0) / totalTentativas
            )
          : 0;

        return {
          faseId: fase.id,
          faseTitulo: fase.titulo,
          faseDescricao: fase.descricao,
          totalQuizzes: fase._count.quizzes,
          totalTentativas,
          totalAcertos,
          totalPerguntas,
          percentualAcertos,
          pontuacaoMedia,
        };
      });

      // Calcular ranking geral da jornada
      const todasTentativasJornada = jornada.fases.flatMap((fase) =>
        fase.quizzes.flatMap((quiz) => quiz.tentativas || [])
      ).filter((t) => t.status === 'FINALIZADA');

      // Agrupar por usuário e calcular pontuação total
      const pontuacaoPorUsuario = new Map<number, {
        usuario: any;
        pontuacaoTotal: number;
        tentativas: number;
        acertos: number;
        totalPerguntas: number;
      }>();

      todasTentativasJornada.forEach((tentativa) => {
        const usuarioId = tentativa.usuarioId;
        const acertos = tentativa.respostas?.filter((r) => r.acertou).length || 0;
        const totalPerguntas = tentativa.respostas?.length || 0;

        if (pontuacaoPorUsuario.has(usuarioId)) {
          const atual = pontuacaoPorUsuario.get(usuarioId)!;
          atual.pontuacaoTotal += tentativa.pontuacaoTotal;
          atual.tentativas += 1;
          atual.acertos += acertos;
          atual.totalPerguntas += totalPerguntas;
        } else {
          pontuacaoPorUsuario.set(usuarioId, {
            usuario: tentativa.usuario,
            pontuacaoTotal: tentativa.pontuacaoTotal,
            tentativas: 1,
            acertos,
            totalPerguntas,
          });
        }
      });

      // Converter para array e ordenar por pontuação
      const ranking = Array.from(pontuacaoPorUsuario.values())
        .map((item) => ({
          ...item,
          percentualAcertos: item.totalPerguntas > 0
            ? Math.round((item.acertos / item.totalPerguntas) * 100)
            : 0,
        }))
        .sort((a, b) => {
          // Ordenar por pontuação total (desc), depois por percentual de acertos (desc)
          if (b.pontuacaoTotal !== a.pontuacaoTotal) {
            return b.pontuacaoTotal - a.pontuacaoTotal;
          }
          return b.percentualAcertos - a.percentualAcertos;
        })
        .map((item, index) => ({
          ...item,
          posicao: index + 1,
        }));

      // Estatísticas gerais
      const totalTentativasJornada = todasTentativasJornada.length;
      const totalUsuariosParticipantes = pontuacaoPorUsuario.size;
      const pontuacaoMediaGeral = totalTentativasJornada > 0
        ? Math.round(
            todasTentativasJornada.reduce((sum, t) => sum + t.pontuacaoTotal, 0) / totalTentativasJornada
          )
        : 0;

      const totalAcertosJornada = todasTentativasJornada.reduce((sum, t) => {
        return sum + (t.respostas?.filter((r) => r.acertou).length || 0);
      }, 0);

      const totalPerguntasJornada = todasTentativasJornada.reduce((sum, t) => {
        return sum + (t.respostas?.length || 0);
      }, 0);

      const percentualAcertosGeral = totalPerguntasJornada > 0
        ? Math.round((totalAcertosJornada / totalPerguntasJornada) * 100)
        : 0;

      return {
        jornada: {
          id: jornada.id,
          titulo: jornada.titulo,
          descricao: jornada.descricao,
          ordem: jornada.ordem,
          ativo: jornada.ativo,
          totalFases: jornada.fases.length,
        },
        estatisticasGerais: {
          totalFases: jornada.fases.length,
          totalQuizzes: jornada.fases.reduce((sum, f) => sum + f._count.quizzes, 0),
          totalTentativas: totalTentativasJornada,
          totalUsuariosParticipantes,
          pontuacaoMediaGeral,
          percentualAcertosGeral,
          totalAcertos: totalAcertosJornada,
          totalPerguntas: totalPerguntasJornada,
        },
        estatisticasPorFase,
        ranking: ranking.slice(0, 10), // Top 10
      };
    } catch (error) {
      logger.error('Error getting jornada statistics', { error, jornadaId });
      throw error;
    }
  }
}

export default new JornadaService();

