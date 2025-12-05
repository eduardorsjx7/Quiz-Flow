import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

export interface CriarAvaliacaoDTO {
  jornadaId: number;
  faseId?: number; // ID da fase (opcional, null se for avaliação geral)
  titulo: string;
  descricao?: string;
  ativo?: boolean;
  obrigatorio?: boolean;
  criadoPor?: number;
  perguntas?: Array<{
    texto: string;
    tipo: 'MULTIPLA_ESCOLHA' | 'TEXTO_LIVRE' | 'NOTA' | 'SIM_NAO';
    ordem: number;
    obrigatoria?: boolean;
    peso?: number; // Peso da pergunta (1-10)
    alternativas?: Array<{
      texto: string;
      valor: number;
      ordem: number;
    }>;
  }>;
}

export interface ResponderAvaliacaoDTO {
  avaliacaoId: number;
  usuarioId: number;
  respostas: Array<{
    perguntaId: number;
    alternativaId?: number;
    textoResposta?: string;
    valorNota?: number;
  }>;
}

export class AvaliacaoService {
  /**
   * Criar uma nova avaliação de jornada
   */
  async criarAvaliacao(dados: CriarAvaliacaoDTO) {
    try {
      const avaliacao = await prisma.avaliacaoJornada.create({
        data: {
          jornadaId: dados.jornadaId,
          faseId: dados.faseId ?? null,
          titulo: dados.titulo,
          descricao: dados.descricao,
          ativo: dados.ativo ?? true,
          obrigatorio: dados.obrigatorio ?? false,
          criadoPor: dados.criadoPor,
          perguntas: dados.perguntas
            ? {
                create: dados.perguntas.map((pergunta) => ({
                  texto: pergunta.texto,
                  tipo: pergunta.tipo,
                  ordem: pergunta.ordem,
                  obrigatoria: pergunta.obrigatoria ?? true,
                  peso: pergunta.peso ?? 1,
                  alternativas: pergunta.alternativas
                    ? {
                        create: pergunta.alternativas.map((alt) => ({
                          texto: alt.texto,
                          valor: alt.valor,
                          ordem: alt.ordem,
                        })),
                      }
                    : undefined,
                })),
              }
            : undefined,
        },
        include: {
          jornada: {
            select: {
              id: true,
              titulo: true,
            },
          },
          perguntas: {
            include: {
              alternativas: {
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      logger.info('Avaliação criada', { avaliacaoId: avaliacao.id });
      return avaliacao;
    } catch (error) {
      logger.error('Erro ao criar avaliação', { error });
      throw error;
    }
  }

  /**
   * Listar avaliações de uma jornada
   */
  async listarAvaliacoes(jornadaId: number) {
    try {
      const avaliacoes = await prisma.avaliacaoJornada.findMany({
        where: {
          jornadaId,
        },
        include: {
          jornada: {
            select: {
              id: true,
              titulo: true,
            },
          },
          perguntas: {
            include: {
              alternativas: {
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
          _count: {
            select: {
              respostas: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return avaliacoes;
    } catch (error) {
      logger.error('Erro ao listar avaliações', { error });
      throw error;
    }
  }

  /**
   * Listar avaliações disponíveis para um usuário
   * Retorna apenas avaliações de fases que o usuário já completou e ainda não respondeu
   */
  async listarAvaliacoesDisponiveis(usuarioId: number) {
    try {
      // Buscar todas as avaliações ativas que estão vinculadas a fases
      const avaliacoes = await prisma.avaliacaoJornada.findMany({
        where: {
          ativo: true,
          faseId: { not: null }, // Apenas avaliações de fases
        },
        include: {
          jornada: {
            select: {
              id: true,
              titulo: true,
            },
          },
          fase: {
            select: {
              id: true,
              titulo: true,
              ordem: true,
            },
          },
          perguntas: {
            include: {
              alternativas: {
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
          respostas: {
            where: {
              usuarioId,
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      // Verificar quais fases foram completadas pelo usuário
      const avaliacoesDisponiveis = [];
      
      for (const avaliacao of avaliacoes) {
        if (!avaliacao.faseId || !avaliacao.fase) continue;
        
        // Verificar se o usuário já respondeu esta avaliação
        const jaRespondeu = avaliacao.respostas.length > 0;
        if (jaRespondeu) continue;

        // Verificar se a fase foi completada (todos os quizzes da fase têm tentativas finalizadas)
        const faseId = avaliacao.faseId;
        const fase = await prisma.fase.findUnique({
          where: { id: faseId },
          include: {
            quizzes: {
              where: { ativo: true },
              select: { id: true },
            },
          },
        });

        if (!fase) continue;

        // Buscar tentativas finalizadas do usuário para os quizzes desta fase
        const quizIds = fase.quizzes.map(q => q.id);
        if (quizIds.length === 0) continue;

        const tentativasFinalizadas = await prisma.tentativaQuiz.findMany({
          where: {
            quizId: { in: quizIds },
            usuarioId,
            status: 'FINALIZADA',
          },
          select: {
            quizId: true,
          },
        });

        // Verificar se todos os quizzes foram completados
        const todosQuizzesCompletados = quizIds.every(quizId =>
          tentativasFinalizadas.some(t => t.quizId === quizId)
        );

        if (todosQuizzesCompletados) {
          avaliacoesDisponiveis.push({
            ...avaliacao,
            respostas: undefined, // Remover informações de respostas
            faseCompletada: true,
          });
        }
      }

      return avaliacoesDisponiveis;
    } catch (error) {
      logger.error('Erro ao listar avaliações disponíveis', { error, usuarioId });
      throw error;
    }
  }

  /**
   * Buscar avaliação por ID
   */
  async buscarAvaliacao(id: number, incluirRespostas: boolean = false) {
    try {
      const avaliacao = await prisma.avaliacaoJornada.findUnique({
        where: { id },
        include: {
          jornada: {
            select: {
              id: true,
              titulo: true,
              descricao: true,
            },
          },
          perguntas: {
            include: {
              alternativas: {
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
          respostas: incluirRespostas
            ? {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nome: true,
                      email: true,
                    },
                  },
                  respostas: {
                    include: {
                      pergunta: true,
                      alternativa: true,
                    },
                  },
                },
                orderBy: {
                  respondidaEm: 'desc',
                },
              }
            : false,
        },
      });

      if (!avaliacao) {
        throw new Error('Avaliação não encontrada');
      }

      return avaliacao;
    } catch (error) {
      logger.error('Erro ao buscar avaliação', { error });
      throw error;
    }
  }

  /**
   * Atualizar avaliação
   */
  async atualizarAvaliacao(
    id: number,
    dados: {
      titulo?: string;
      descricao?: string;
      ativo?: boolean;
      obrigatorio?: boolean;
    }
  ) {
    try {
      const avaliacao = await prisma.avaliacaoJornada.update({
        where: { id },
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          ativo: dados.ativo,
          obrigatorio: dados.obrigatorio,
          updatedAt: new Date(),
        },
        include: {
          perguntas: {
            include: {
              alternativas: {
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      logger.info('Avaliação atualizada', { avaliacaoId: id });
      return avaliacao;
    } catch (error) {
      logger.error('Erro ao atualizar avaliação', { error });
      throw error;
    }
  }

  /**
   * Deletar avaliação
   */
  async deletarAvaliacao(id: number) {
    try {
      await prisma.avaliacaoJornada.delete({
        where: { id },
      });

      logger.info('Avaliação deletada', { avaliacaoId: id });
      return { message: 'Avaliação deletada com sucesso' };
    } catch (error) {
      logger.error('Erro ao deletar avaliação', { error });
      throw error;
    }
  }

  /**
   * Responder avaliação
   */
  async responderAvaliacao(dados: ResponderAvaliacaoDTO) {
    try {
      // Verificar se já respondeu
      const respostaExistente = await prisma.respostaAvaliacao.findUnique({
        where: {
          avaliacaoId_usuarioId: {
            avaliacaoId: dados.avaliacaoId,
            usuarioId: dados.usuarioId,
          },
        },
      });

      if (respostaExistente) {
        throw new Error('Você já respondeu esta avaliação');
      }

      // Buscar avaliação e jornadaId
      const avaliacao = await prisma.avaliacaoJornada.findUnique({
        where: { id: dados.avaliacaoId },
      });

      if (!avaliacao) {
        throw new Error('Avaliação não encontrada');
      }

      // Criar resposta
      const resposta = await prisma.respostaAvaliacao.create({
        data: {
          avaliacaoId: dados.avaliacaoId,
          usuarioId: dados.usuarioId,
          jornadaId: avaliacao.jornadaId,
          respostas: {
            create: dados.respostas.map((r) => ({
              perguntaId: r.perguntaId,
              alternativaId: r.alternativaId,
              textoResposta: r.textoResposta,
              valorNota: r.valorNota,
            })),
          },
        },
        include: {
          respostas: {
            include: {
              pergunta: true,
              alternativa: true,
            },
          },
        },
      });

      logger.info('Avaliação respondida', {
        avaliacaoId: dados.avaliacaoId,
        usuarioId: dados.usuarioId,
      });

      return resposta;
    } catch (error) {
      logger.error('Erro ao responder avaliação', { error });
      throw error;
    }
  }

  /**
   * Verificar se usuário já respondeu avaliação
   */
  async verificarResposta(avaliacaoId: number, usuarioId: number) {
    try {
      const resposta = await prisma.respostaAvaliacao.findUnique({
        where: {
          avaliacaoId_usuarioId: {
            avaliacaoId,
            usuarioId,
          },
        },
      });

      return !!resposta;
    } catch (error) {
      logger.error('Erro ao verificar resposta', { error });
      throw error;
    }
  }

  /**
   * Buscar respostas de uma avaliação
   */
  async buscarRespostas(avaliacaoId: number) {
    try {
      const respostas = await prisma.respostaAvaliacao.findMany({
        where: {
          avaliacaoId,
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
          respostas: {
            include: {
              pergunta: {
                select: {
                  id: true,
                  texto: true,
                  tipo: true,
                },
              },
              alternativa: {
                select: {
                  id: true,
                  texto: true,
                  valor: true,
                },
              },
            },
          },
        },
        orderBy: {
          respondidaEm: 'desc',
        },
      });

      return respostas;
    } catch (error) {
      logger.error('Erro ao buscar respostas', { error });
      throw error;
    }
  }

  /**
   * Gerar relatório de avaliação
   */
  async gerarRelatorio(avaliacaoId: number) {
    try {
      const avaliacao = await this.buscarAvaliacao(avaliacaoId, true);
      const respostas = await this.buscarRespostas(avaliacaoId);

      // Filtrar apenas perguntas que devem ser contabilizadas (com valores numéricos)
      const perguntasContabilizadas = avaliacao.perguntas.filter(
        (p) => p.tipo === 'MULTIPLA_ESCOLHA' || p.tipo === 'SIM_NAO' || p.tipo === 'NOTA'
      );

      // Calcular estatísticas por pergunta
      const estatisticas = avaliacao.perguntas.map((pergunta) => {
        const respostasPergunta = respostas.flatMap((r) =>
          r.respostas.filter((resp) => resp.perguntaId === pergunta.id)
        );

        const totalRespostas = respostasPergunta.length;

        if (pergunta.tipo === 'MULTIPLA_ESCOLHA' || pergunta.tipo === 'SIM_NAO') {
          // Contar respostas por alternativa
          const contagemAlternativas = pergunta.alternativas.map((alt) => {
            const count = respostasPergunta.filter(
              (r) => r.alternativaId === alt.id
            ).length;
            const percentual = totalRespostas > 0 ? (count / totalRespostas) * 100 : 0;

            return {
              alternativa: alt.texto,
              valor: alt.valor,
              quantidade: count,
              percentual: Math.round(percentual * 100) / 100,
            };
          });

          // Calcular média ponderada
          const somaValores = contagemAlternativas.reduce(
            (sum, item) => sum + item.valor * item.quantidade,
            0
          );
          const media = totalRespostas > 0 ? somaValores / totalRespostas : 0;

          return {
            pergunta: pergunta.texto,
            tipo: pergunta.tipo,
            totalRespostas,
            alternativas: contagemAlternativas,
            mediaValor: Math.round(media * 100) / 100,
          };
        } else if (pergunta.tipo === 'NOTA') {
          // Calcular média das notas
          const notas = respostasPergunta
            .map((r) => r.valorNota)
            .filter((n): n is number => n !== null);
          const somaNotas = notas.reduce((sum, nota) => sum + nota, 0);
          const media = notas.length > 0 ? somaNotas / notas.length : 0;

          return {
            pergunta: pergunta.texto,
            tipo: pergunta.tipo,
            totalRespostas,
            mediaNotas: Math.round(media * 100) / 100,
            notaMinima: notas.length > 0 ? Math.min(...notas) : 0,
            notaMaxima: notas.length > 0 ? Math.max(...notas) : 0,
          };
        } else {
          // TEXTO_LIVRE
          const textos = respostasPergunta
            .map((r) => r.textoResposta)
            .filter((t): t is string => t !== null && t !== '');

          return {
            pergunta: pergunta.texto,
            tipo: pergunta.tipo,
            totalRespostas,
            respostasTexto: textos,
          };
        }
      });

      // Calcular média geral ponderada (apenas perguntas contabilizadas)
      let somaMediasPonderadas = 0;
      let somaPesos = 0;

      perguntasContabilizadas.forEach((pergunta) => {
        const estatistica = estatisticas.find((e) => e.pergunta === pergunta.texto);
        if (estatistica) {
          const peso = (pergunta as any).peso || 1;
          
          if (pergunta.tipo === 'MULTIPLA_ESCOLHA' || pergunta.tipo === 'SIM_NAO') {
            somaMediasPonderadas += (estatistica as any).mediaValor * peso;
            somaPesos += peso;
          } else if (pergunta.tipo === 'NOTA') {
            somaMediasPonderadas += (estatistica as any).mediaNotas * peso;
            somaPesos += peso;
          }
        }
      });

      const mediaGeralPonderada = somaPesos > 0 ? somaMediasPonderadas / somaPesos : 0;

      return {
        avaliacao: {
          id: avaliacao.id,
          titulo: avaliacao.titulo,
          descricao: avaliacao.descricao,
          jornada: avaliacao.jornada,
        },
        totalRespondentes: respostas.length,
        totalPerguntasContabilizadas: perguntasContabilizadas.length,
        mediaGeralPonderada: Math.round(mediaGeralPonderada * 100) / 100,
        estatisticas,
      };
    } catch (error) {
      logger.error('Erro ao gerar relatório', { error });
      throw error;
    }
  }

  /**
   * Buscar avaliação ativa de uma jornada
   */
  async buscarAvaliacaoAtiva(jornadaId: number) {
    try {
      const avaliacao = await prisma.avaliacaoJornada.findFirst({
        where: {
          jornadaId,
          ativo: true,
        },
        include: {
          perguntas: {
            include: {
              alternativas: {
                orderBy: {
                  ordem: 'asc',
                },
              },
            },
            orderBy: {
              ordem: 'asc',
            },
          },
        },
      });

      return avaliacao;
    } catch (error) {
      logger.error('Erro ao buscar avaliação ativa', { error });
      throw error;
    }
  }

  /**
   * Adicionar pergunta em todas as avaliações de uma jornada
   */
  async adicionarPerguntaEmTodasAvaliacoes(
    jornadaId: number,
    dadosPergunta: {
      texto: string;
      tipo: 'MULTIPLA_ESCOLHA' | 'TEXTO_LIVRE' | 'NOTA' | 'SIM_NAO';
      obrigatoria: boolean;
      peso: number;
      alternativas?: Array<{
        texto: string;
        valor: number;
        ordem: number;
      }>;
    }
  ) {
    try {
      // Buscar todas as avaliações da jornada
      const avaliacoes = await prisma.avaliacaoJornada.findMany({
        where: { jornadaId },
        include: {
          perguntas: {
            orderBy: { ordem: 'asc' },
          },
        },
      });

      if (avaliacoes.length === 0) {
        throw new Error('Nenhuma avaliação encontrada para esta jornada');
      }

      // Adicionar pergunta em cada avaliação
      for (const avaliacao of avaliacoes) {
        const proximaOrdem = avaliacao.perguntas.length;

        await prisma.perguntaAvaliacao.create({
          data: {
            avaliacaoId: avaliacao.id,
            texto: dadosPergunta.texto,
            tipo: dadosPergunta.tipo,
            ordem: proximaOrdem,
            obrigatoria: dadosPergunta.obrigatoria,
            peso: dadosPergunta.peso,
            alternativas: dadosPergunta.alternativas
              ? {
                  create: dadosPergunta.alternativas.map((alt) => ({
                    texto: alt.texto,
                    valor: alt.valor,
                    ordem: alt.ordem,
                  })),
                }
              : undefined,
          },
        });
      }

      logger.info('Pergunta adicionada em todas as avaliações', {
        jornadaId,
        avaliacoesAtualizadas: avaliacoes.length,
      });

      return { message: 'Pergunta adicionada em todas as avaliações' };
    } catch (error) {
      logger.error('Erro ao adicionar pergunta', { error });
      throw error;
    }
  }

  /**
   * Excluir pergunta de todas as avaliações de uma jornada (por índice)
   */
  async excluirPerguntaPorIndice(jornadaId: number, indicePergunta: number) {
    try {
      // Buscar todas as avaliações da jornada
      const avaliacoes = await prisma.avaliacaoJornada.findMany({
        where: { jornadaId },
        include: {
          perguntas: {
            orderBy: { ordem: 'asc' },
          },
        },
      });

      // Excluir a pergunta no índice especificado de cada avaliação
      for (const avaliacao of avaliacoes) {
        if (avaliacao.perguntas[indicePergunta]) {
          await prisma.perguntaAvaliacao.delete({
            where: { id: avaliacao.perguntas[indicePergunta].id },
          });

          // Reordenar perguntas restantes
          const perguntasRestantes = avaliacao.perguntas.filter(
            (_, i) => i !== indicePergunta
          );
          for (let i = 0; i < perguntasRestantes.length; i++) {
            await prisma.perguntaAvaliacao.update({
              where: { id: perguntasRestantes[i].id },
              data: { ordem: i },
            });
          }
        }
      }

      logger.info('Pergunta excluída de todas as avaliações', {
        jornadaId,
        indicePergunta,
      });

      return { message: 'Pergunta excluída de todas as avaliações' };
    } catch (error) {
      logger.error('Erro ao excluir pergunta', { error });
      throw error;
    }
  }

  /**
   * Mover pergunta em todas as avaliações de uma jornada
   */
  async moverPergunta(
    jornadaId: number,
    indiceOrigem: number,
    indiceDestino: number
  ) {
    try {
      // Buscar todas as avaliações da jornada
      const avaliacoes = await prisma.avaliacaoJornada.findMany({
        where: { jornadaId },
        include: {
          perguntas: {
            orderBy: { ordem: 'asc' },
          },
        },
      });

      // Mover pergunta em cada avaliação
      for (const avaliacao of avaliacoes) {
        const perguntas = avaliacao.perguntas;
        if (perguntas[indiceOrigem]) {
          // Reordenar
          const [perguntaMovida] = perguntas.splice(indiceOrigem, 1);
          perguntas.splice(indiceDestino, 0, perguntaMovida);

          // Atualizar ordem no banco
          for (let i = 0; i < perguntas.length; i++) {
            await prisma.perguntaAvaliacao.update({
              where: { id: perguntas[i].id },
              data: { ordem: i },
            });
          }
        }
      }

      logger.info('Pergunta movida em todas as avaliações', {
        jornadaId,
        indiceOrigem,
        indiceDestino,
      });

      return { message: 'Pergunta reordenada em todas as avaliações' };
    } catch (error) {
      logger.error('Erro ao mover pergunta', { error });
      throw error;
    }
  }
}

export const avaliacaoService = new AvaliacaoService();

