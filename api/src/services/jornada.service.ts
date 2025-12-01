import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';

// Função auxiliar para calcular status de desbloqueio de uma fase
function calcularStatusFase(
  fase: any,
  jornadaTemDesbloqueio: boolean,
  desbloqueio?: any
): { desbloqueada: boolean; aguardandoDesbloqueio: boolean } {
  // Se a fase não está ativa, não pode estar desbloqueada nem aguardando
  if (fase.ativo === false) {
    return { desbloqueada: false, aguardandoDesbloqueio: false };
  }

  const agora = new Date();
  const temDataDesbloqueio = fase.dataDesbloqueio !== null && fase.dataDesbloqueio !== undefined;
  const temDataBloqueio = fase.dataBloqueio !== null && fase.dataBloqueio !== undefined;

  // Caso 1: Não tem data de desbloqueio nem bloqueio → fase está aberta (desbloqueada)
  if (!temDataDesbloqueio && !temDataBloqueio) {
    return { desbloqueada: true, aguardandoDesbloqueio: false };
  }

  // Caso 2: Tem data de bloqueio e já passou → fase bloqueada
  if (temDataBloqueio) {
    const dataBloqueio = new Date(fase.dataBloqueio);
    if (dataBloqueio <= agora) {
      return { desbloqueada: false, aguardandoDesbloqueio: false };
    }
  }

  // Caso 3: Tem data de desbloqueio
  if (temDataDesbloqueio) {
    const dataDesbloqueio = new Date(fase.dataDesbloqueio);
    
    // Se a data de desbloqueio já passou → fase desbloqueada
    if (dataDesbloqueio <= agora) {
      return { desbloqueada: true, aguardandoDesbloqueio: false };
    }
    
    // Se a data de desbloqueio ainda não passou → aguardando desbloqueio
    return { desbloqueada: false, aguardandoDesbloqueio: true };
  }

  // Caso padrão: se não tem data de desbloqueio mas tem desbloqueio manual, está desbloqueada
  return {
    desbloqueada: !!desbloqueio,
    aguardandoDesbloqueio: false,
  };
}

export class JornadaService {
  async listarJornadas(apenasAtivas: boolean = true) {
    try {
      const jornadas = await prisma.jornada.findMany({
        where: apenasAtivas ? { ativo: true } : undefined,
        include: {
          _count: {
            select: {
              fases: true,
            },
          },
          fases: {
            where: {
              ordem: {
                gte: 1,
              },
            },
            orderBy: {
              ordem: 'asc',
            },
            take: 1,
            select: {
              id: true,
              titulo: true,
              ordem: true,
            },
          },
        },
        orderBy: {
          ordem: 'asc',
        },
      });

      // Para cada jornada, verificar se tem sequência de desbloqueio
      const jornadasComInfo = await Promise.all(
        jornadas.map(async (jornada: any) => {
          // Buscar todas as fases da jornada para verificar se alguma tem dataDesbloqueio
          const todasFases = await prisma.fase.findMany({
            where: {
              jornadaId: jornada.id,
              ativo: true,
            },
            select: {
              dataDesbloqueio: true,
            },
          });

          // Verificar se alguma fase tem dataDesbloqueio definida
          const temSequenciaDesbloqueio = todasFases.some((fase: any) => fase.dataDesbloqueio !== null);

          return {
            ...jornada,
            faseAtual: jornada.fases.length > 0 ? jornada.fases[0] : null,
            todasFasesAbertas: !temSequenciaDesbloqueio && todasFases.length > 0,
          };
        })
      );

      return jornadasComInfo;
    } catch (error) {
      logger.error('Error listing jornadas', { error });
      throw error;
    }
  }

  async buscarPorId(id: number, apenasAtiva: boolean = true) {
    try {
      const jornada = await prisma.jornada.findUnique({
        where: apenasAtiva ? { id, ativo: true } : { id },
        include: {
          fases: {
            include: {
              _count: {
                select: {
                  quizzes: true,
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
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      if (!jornada) {
        throw new CustomError('Jornada não encontrada', 404);
      }

      // Verificar se a jornada tem sequência de desbloqueio
      const jornadaTemDesbloqueio = jornada.fases.some((fase: any) => fase.dataDesbloqueio !== null);

      // Calcular total de perguntas por fase e status
      const jornadaComPerguntas = {
        ...jornada,
        fases: jornada.fases.map((fase: any) => {
          const totalPerguntas = (fase.quizzes || []).reduce((sum: number, quiz: any) => {
            return sum + (quiz._count?.perguntas || 0);
          }, 0);
          
          // Calcular status usando função auxiliar
          const { desbloqueada, aguardandoDesbloqueio } = calcularStatusFase(
            fase,
            jornadaTemDesbloqueio
          );
          
          return {
            ...fase,
            totalPerguntas,
            desbloqueada,
            aguardandoDesbloqueio,
          };
        }),
      };

      return jornadaComPerguntas;
    } catch (error) {
      logger.error('Error finding jornada by id', { error, jornadaId: id });
      throw error;
    }
  }

  async buscarFasesPorJornada(jornadaId: number, usuarioId?: number, apenasAtiva: boolean = true) {
    try {
      const jornada = await prisma.jornada.findUnique({
        where: apenasAtiva ? { id: jornadaId, ativo: true } : { id: jornadaId },
        select: {
          id: true,
          titulo: true,
          imagemCapa: true,
          tempoLimitePorQuestao: true,
        },
      });

      if (!jornada) {
        throw new CustomError('Jornada não encontrada', 404);
      }

      // Buscar todas as fases da jornada (incluindo inativas para mostrar o status completo)
      const fases = await prisma.fase.findMany({
        where: {
          jornadaId,
        },
        include: {
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

      // Verificar se a jornada tem sequência de desbloqueio
      const jornadaTemDesbloqueio = fases.some((fase: any) => fase.dataDesbloqueio !== null);

      // Buscar tentativas finalizadas do usuário para verificar quais fases foram concluídas
      let tentativasFinalizadas: any[] = [];
      if (usuarioId) {
        const quizIds = fases.flatMap((fase: any) => 
          fase.quizzes?.map((quiz: any) => quiz.id) || []
        );
        
        if (quizIds.length > 0) {
          tentativasFinalizadas = await prisma.tentativaQuiz.findMany({
            where: {
              quizId: { in: quizIds },
              usuarioId,
              status: 'FINALIZADA',
            },
            select: {
              quizId: true,
            },
          });
        }
      }

      // Filtrar e marcar fases desbloqueadas
      const fasesComStatus = fases.map((fase: any) => {
        const desbloqueio = fase.desbloqueios?.[0];
        
        // Calcular total de perguntas
        const totalPerguntas = fase.quizzes?.reduce((sum: number, quiz: any) => {
          return sum + (quiz._count?.perguntas || 0);
        }, 0) || 0;
        
        // Verificar se a fase foi finalizada (todos os quizzes têm tentativas finalizadas)
        const quizIdsDaFase = fase.quizzes?.map((quiz: any) => quiz.id) || [];
        const tentativasFase = tentativasFinalizadas.filter((t: any) => 
          quizIdsDaFase.includes(t.quizId)
        );
        const finalizada = quizIdsDaFase.length > 0 && 
          quizIdsDaFase.every((quizId: number) => 
            tentativasFase.some((t: any) => t.quizId === quizId)
          );
        
        // Calcular status usando função auxiliar
        const { desbloqueada, aguardandoDesbloqueio } = calcularStatusFase(
          fase,
          jornadaTemDesbloqueio,
          desbloqueio
        );

        return {
          ...fase,
          desbloqueada,
          aguardandoDesbloqueio,
          faseAtual: desbloqueio?.faseAtual || false,
          totalPerguntas,
          finalizada,
          desbloqueios: undefined,
        };
      });

      // Retornar todas as fases (bloqueadas e desbloqueadas) para mostrar o progresso completo
      // O frontend será responsável por mostrar visualmente quais estão bloqueadas
      return {
        jornada,
        fases: fasesComStatus,
      };
    } catch (error) {
      logger.error('Error finding phases by journey', { error, jornadaId });
      throw error;
    }
  }

  async criarJornada(dados: {
    titulo: string;
    descricao?: string;
    imagemCapa?: string | null;
    ordem?: number;
    criadoPor?: number;
    fases?: Array<{
      titulo: string;
      descricao?: string;
      ordem: number;
      dataDesbloqueio?: string | null;
      dataBloqueio?: string | null;
    }>;
  }) {
    try {
      const jornada = await prisma.jornada.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          imagemCapa: dados.imagemCapa,
          ordem: dados.ordem || 0,
          criadoPor: dados.criadoPor,
          fases: dados.fases && dados.fases.length > 0
            ? {
                create: dados.fases.map((fase) => ({
                  titulo: fase.titulo,
                  descricao: fase.descricao,
                  ordem: fase.ordem,
                  dataDesbloqueio: fase.dataDesbloqueio ? new Date(fase.dataDesbloqueio) : null,
                  dataBloqueio: fase.dataBloqueio ? new Date(fase.dataBloqueio) : null,
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
    imagemCapa?: string | null;
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

      // Verificar se alguma fase tem dataDesbloqueio
      const temFaseComDataDesbloqueio = jornada.fases.some((f: any) => f.dataDesbloqueio !== null);
      
      // Encontrar fase atual (primeira fase com ordem >= 1)
      const faseAtual = jornada.fases.find((f: any) => f.ordem >= 1) || jornada.fases[0] || null;
      
      // Encontrar próxima fase (primeira fase após a fase atual com dataDesbloqueio)
      // Se todas as fases não têm dataDesbloqueio, não há próxima fase com data de desbloqueio
      let proximaFase = null;
      if (temFaseComDataDesbloqueio) {
        if (faseAtual) {
          const fasesOrdenadas = jornada.fases.filter((f: any) => f.ordem > faseAtual.ordem).sort((a: any, b: any) => a.ordem - b.ordem);
          proximaFase = fasesOrdenadas.find((f: any) => f.dataDesbloqueio !== null) || null;
        } else {
          // Se não há fase atual, a próxima é a primeira fase com dataDesbloqueio
          proximaFase = jornada.fases.find((f: any) => f.dataDesbloqueio !== null) || null;
        }
      }
      // Se não tem nenhuma fase com dataDesbloqueio, todas estão abertas, então não há próxima fase para desbloquear

      return {
        jornada: {
          id: jornada.id,
          titulo: jornada.titulo,
          descricao: jornada.descricao,
          ordem: jornada.ordem,
          ativo: jornada.ativo,
          totalFases: jornada.fases.length,
        },
        faseAtual: faseAtual ? {
          id: faseAtual.id,
          titulo: faseAtual.titulo,
          ordem: faseAtual.ordem,
        } : null,
        proximaFase: proximaFase ? {
          id: proximaFase.id,
          titulo: proximaFase.titulo,
          ordem: proximaFase.ordem,
          dataDesbloqueio: proximaFase.dataDesbloqueio,
        } : null,
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

  async buscarConfiguracao(id: number) {
    try {
      const jornada = await prisma.jornada.findUnique({
        where: { id },
        include: {
          fases: {
            orderBy: {
              ordem: 'asc',
            },
            select: {
              id: true,
              titulo: true,
              ordem: true,
              dataDesbloqueio: true,
              dataBloqueio: true,
              pontuacao: true,
              ativo: true,
            },
          },
        },
      });

      if (!jornada) {
        throw new CustomError('Jornada não encontrada', 404);
      }

      return {
        jornada: {
          id: jornada.id,
          titulo: jornada.titulo,
          ativo: jornada.ativo,
        },
        fases: jornada.fases.map((fase) => ({
          id: fase.id,
          titulo: fase.titulo,
          ordem: fase.ordem,
          dataDesbloqueio: fase.dataDesbloqueio,
          dataBloqueio: fase.dataBloqueio,
          pontuacao: fase.pontuacao,
          ativo: fase.ativo,
        })),
        configuracao: {
          ativo: jornada.ativo,
          mostrarQuestaoCerta: jornada.mostrarQuestaoCerta,
          mostrarTaxaErro: jornada.mostrarTaxaErro,
          mostrarPodio: jornada.mostrarPodio,
          mostrarRanking: jornada.mostrarRanking,
          permitirTentativasIlimitadas: jornada.permitirTentativasIlimitadas,
          tempoLimitePorQuestao: jornada.tempoLimitePorQuestao,
        },
      };
    } catch (error) {
      logger.error('Error fetching configuration', { error, jornadaId: id });
      throw error;
    }
  }

  async salvarConfiguracao(
    id: number,
    dados: {
      fases?: Array<{
        faseId: number;
        ordem?: number;
        dataDesbloqueio: string | null;
        dataBloqueio: string | null;
        pontuacao: number;
        ativo?: boolean;
      }>;
      configuracao?: {
        ativo?: boolean;
        mostrarQuestaoCerta?: boolean;
        mostrarTaxaErro?: boolean;
        mostrarPodio?: boolean;
        mostrarRanking?: boolean;
        permitirTentativasIlimitadas?: boolean;
        tempoLimitePorQuestao?: number | null;
        status?: string; // Status da jornada: 'Ativa', 'Inativa', 'Fechada', 'Bloqueada'
      };
    }
  ) {
    try {
      // Atualizar configurações da jornada
      if (dados.configuracao) {
        // Log do status se fornecido
        if (dados.configuracao.status) {
          logger.info('Status da jornada recebido', {
            jornadaId: id,
            status: dados.configuracao.status,
            ativo: dados.configuracao.ativo,
          });
        }

        await prisma.jornada.update({
          where: { id },
          data: {
            ativo: dados.configuracao.ativo,
            mostrarQuestaoCerta: dados.configuracao.mostrarQuestaoCerta,
            mostrarTaxaErro: dados.configuracao.mostrarTaxaErro,
            mostrarPodio: dados.configuracao.mostrarPodio,
            mostrarRanking: dados.configuracao.mostrarRanking,
            permitirTentativasIlimitadas: dados.configuracao.permitirTentativasIlimitadas,
            tempoLimitePorQuestao: dados.configuracao.tempoLimitePorQuestao,
          },
        });
      }

      // Atualizar fases
      if (dados.fases && dados.fases.length > 0) {
        await Promise.all(
          dados.fases.map((faseData) => {
            const updateData: any = {
              dataDesbloqueio: faseData.dataDesbloqueio
                ? new Date(faseData.dataDesbloqueio)
                : null,
              dataBloqueio: faseData.dataBloqueio
                ? new Date(faseData.dataBloqueio)
                : null,
              pontuacao: faseData.pontuacao,
            };
            
            // Atualizar ordem apenas se fornecida
            if (faseData.ordem !== undefined) {
              updateData.ordem = faseData.ordem;
            }
            
            // Atualizar ativo se fornecido
            if (faseData.ativo !== undefined) {
              updateData.ativo = faseData.ativo;
            }
            
            return prisma.fase.update({
              where: { id: faseData.faseId },
              data: updateData,
            });
          })
        );
      }

      logger.info('Configuration saved', { jornadaId: id });

      return await this.buscarConfiguracao(id);
    } catch (error) {
      logger.error('Error saving configuration', { error, jornadaId: id });
      throw error;
    }
  }
}

export default new JornadaService();

