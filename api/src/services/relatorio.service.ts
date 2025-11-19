import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';
import { calcularTempoMedio, calcularPercentualAcertos } from '../utils/pontuacao';

export class RelatorioService {
  async relatorioPorQuiz(quizId: number) {
    try {
      const sessoes = await prisma.sessaoQuiz.findMany({
        where: { quizId },
        include: {
          participantes: {
            include: {
              respostas: {
                include: {
                  pergunta: true,
                },
              },
            },
            orderBy: [
              { pontuacaoTotal: 'desc' },
              { tempoTotal: 'asc' },
            ],
          },
          quiz: {
            include: {
              perguntas: true,
            },
          },
        },
      });

      const relatorio = {
        quiz: {
          id: sessoes[0]?.quiz.id,
          titulo: sessoes[0]?.quiz.titulo,
          totalPerguntas: sessoes[0]?.quiz.perguntas.length || 0,
        },
        sessoes: sessoes.map((sessao) => ({
          id: sessao.id,
          codigo: sessao.codigoSessao,
          status: sessao.status,
          iniciadaEm: sessao.iniciadaEm,
          finalizadaEm: sessao.finalizadaEm,
          totalParticipantes: sessao.participantes.length,
          participantes: sessao.participantes.map((p, index) => ({
            posicao: index + 1,
            nome: p.nomeParticipante,
            matricula: p.matricula,
            pontuacao: p.pontuacaoTotal,
            tempoTotal: p.tempoTotal,
            tempoMedio: calcularTempoMedio(p.respostas.map((r) => r.tempoResposta)),
            acertos: p.respostas.filter((r) => r.acertou).length,
            totalPerguntas: p.respostas.length,
            percentualAcertos: calcularPercentualAcertos(
              p.respostas.length,
              p.respostas.filter((r) => r.acertou).length
            ),
          })),
        })),
      };

      return relatorio;
    } catch (error) {
      logger.error('Error generating quiz report', { error, quizId });
      throw error;
    }
  }

  async relatorioPorColaborador(usuarioId: number) {
    try {
      const participacoes = await prisma.sessaoQuizParticipante.findMany({
        where: { usuarioId },
        include: {
          sessao: {
            include: {
              quiz: true,
            },
          },
          respostas: {
            include: {
              pergunta: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const relatorio = {
        usuario: {
          id: participacoes[0]?.usuarioId,
          nome: participacoes[0]?.nomeParticipante,
        },
        historico: participacoes.map((p) => ({
          quizId: p.sessao.quiz.id,
          quizTitulo: p.sessao.quiz.titulo,
          sessaoCodigo: p.sessao.codigoSessao,
          dataParticipacao: p.createdAt,
          pontuacao: p.pontuacaoTotal,
          tempoTotal: p.tempoTotal,
          tempoMedio: calcularTempoMedio(p.respostas.map((r) => r.tempoResposta)),
          acertos: p.respostas.filter((r) => r.acertou).length,
          totalPerguntas: p.respostas.length,
          percentualAcertos: calcularPercentualAcertos(
            p.respostas.length,
            p.respostas.filter((r) => r.acertou).length
          ),
          posicaoRanking: p.posicaoRanking,
        })),
        estatisticas: {
          totalQuizzes: participacoes.length,
          pontuacaoMedia:
            participacoes.length > 0
              ? Math.round(
                  participacoes.reduce((sum, p) => sum + p.pontuacaoTotal, 0) /
                    participacoes.length
                )
              : 0,
          percentualAcertosMedio:
            participacoes.length > 0
              ? Math.round(
                  participacoes.reduce((sum, p) => {
                    const total = p.respostas.length;
                    const acertos = p.respostas.filter((r) => r.acertou).length;
                    return sum + calcularPercentualAcertos(total, acertos);
                  }, 0) / participacoes.length
                )
              : 0,
        },
      };

      return relatorio;
    } catch (error) {
      logger.error('Error generating collaborator report', { error, usuarioId });
      throw error;
    }
  }

  async relatorioPorPergunta(perguntaId: number) {
    try {
      const pergunta = await prisma.pergunta.findUnique({
        where: { id: perguntaId },
        include: {
          alternativas: true,
          respostas: {
            include: {
              sessaoParticipante: true,
            },
          },
          quiz: true,
        },
      });

      if (!pergunta) {
        throw new CustomError('Pergunta não encontrada', 404);
      }

      const totalRespostas = pergunta.respostas.length;
      const acertos = pergunta.respostas.filter((r) => r.acertou).length;
      const erros = totalRespostas - acertos;
      const tempoMedio = calcularTempoMedio(pergunta.respostas.map((r) => r.tempoResposta));

      // Distribuição de escolhas por alternativa
      const distribuicaoAlternativas = pergunta.alternativas.map((alt) => ({
        alternativaId: alt.id,
        texto: alt.texto,
        correta: alt.correta,
        escolhas: pergunta.respostas.filter((r) => r.alternativaId === alt.id).length,
        percentualEscolhas:
          totalRespostas > 0
            ? Math.round(
                (pergunta.respostas.filter((r) => r.alternativaId === alt.id).length /
                  totalRespostas) *
                  100
              )
            : 0,
      }));

      const relatorio = {
        pergunta: {
          id: pergunta.id,
          texto: pergunta.texto,
          tempoSegundos: pergunta.tempoSegundos,
          quizTitulo: pergunta.quiz.titulo,
        },
        estatisticas: {
          totalRespostas,
          acertos,
          erros,
          taxaAcerto: calcularPercentualAcertos(totalRespostas, acertos),
          tempoMedioResposta: tempoMedio,
          distribuicaoAlternativas,
        },
      };

      return relatorio;
    } catch (error) {
      logger.error('Error generating question report', { error, perguntaId });
      throw error;
    }
  }

  async dadosParaExportacaoCSV(quizId: number) {
    try {
      const sessoes = await prisma.sessaoQuiz.findMany({
        where: { quizId },
        include: {
          participantes: {
            include: {
              respostas: true,
            },
          },
          quiz: true,
        },
      });

      const dados = [];
      for (const sessao of sessoes) {
        for (const participante of sessao.participantes) {
          dados.push({
            sessao: sessao.codigoSessao,
            nome: participante.nomeParticipante,
            matricula: participante.matricula || '',
            pontuacao: participante.pontuacaoTotal,
            tempoTotal: participante.tempoTotal,
            acertos: participante.respostas.filter((r) => r.acertou).length,
            totalPerguntas: participante.respostas.length,
            percentualAcertos: calcularPercentualAcertos(
              participante.respostas.length,
              participante.respostas.filter((r) => r.acertou).length
            ),
          });
        }
      }

      return dados;
    } catch (error) {
      logger.error('Error preparing CSV export data', { error, quizId });
      throw error;
    }
  }
}

export default new RelatorioService();

