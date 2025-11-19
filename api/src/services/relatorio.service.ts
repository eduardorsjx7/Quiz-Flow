import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';
import { calcularTempoMedio, calcularPercentualAcertos } from '../utils/pontuacao';

export class RelatorioService {
  async relatorioPorQuiz(quizId: number) {
    try {
      const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        include: {
          perguntas: true,
        },
      });

      if (!quiz) {
        throw new CustomError('Quiz não encontrado', 404);
      }

      const tentativas = await prisma.tentativaQuiz.findMany({
        where: {
          quizId,
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
      });

      const relatorio = {
        quiz: {
          id: quiz.id,
          titulo: quiz.titulo,
          totalPerguntas: quiz.perguntas.length || 0,
        },
        tentativas: tentativas.map((tentativa, index) => ({
          id: tentativa.id,
          usuario: tentativa.usuario,
          iniciadaEm: tentativa.iniciadaEm,
          finalizadaEm: tentativa.finalizadaEm,
          posicao: index + 1,
          pontuacao: tentativa.pontuacaoTotal,
          tempoTotal: tentativa.tempoTotal,
          tempoMedio: calcularTempoMedio(tentativa.respostas.map((r) => r.tempoResposta)),
          acertos: tentativa.respostas.filter((r) => r.acertou).length,
          totalPerguntas: tentativa.respostas.length,
          percentualAcertos: calcularPercentualAcertos(
            tentativa.respostas.length,
            tentativa.respostas.filter((r) => r.acertou).length
          ),
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
      const usuario = await prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: {
          id: true,
          nome: true,
          email: true,
        },
      });

      if (!usuario) {
        throw new CustomError('Usuário não encontrado', 404);
      }

      const tentativas = await prisma.tentativaQuiz.findMany({
        where: {
          usuarioId,
          status: 'FINALIZADA',
        },
        include: {
          quiz: true,
          respostas: {
            include: {
              pergunta: true,
            },
          },
        },
        orderBy: {
          finalizadaEm: 'desc',
        },
      });

      const relatorio = {
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email,
        },
        historico: tentativas.map((tentativa) => ({
          quizId: tentativa.quiz.id,
          quizTitulo: tentativa.quiz.titulo,
          dataParticipacao: tentativa.finalizadaEm || tentativa.iniciadaEm,
          pontuacao: tentativa.pontuacaoTotal,
          tempoTotal: tentativa.tempoTotal,
          tempoMedio: calcularTempoMedio(tentativa.respostas.map((r) => r.tempoResposta)),
          acertos: tentativa.respostas.filter((r) => r.acertou).length,
          totalPerguntas: tentativa.respostas.length,
          percentualAcertos: calcularPercentualAcertos(
            tentativa.respostas.length,
            tentativa.respostas.filter((r) => r.acertou).length
          ),
          posicaoRanking: tentativa.posicaoRanking,
        })),
        estatisticas: {
          totalQuizzes: tentativas.length,
          pontuacaoMedia:
            tentativas.length > 0
              ? Math.round(
                  tentativas.reduce((sum, t) => sum + t.pontuacaoTotal, 0) /
                    tentativas.length
                )
              : 0,
          percentualAcertosMedio:
            tentativas.length > 0
              ? Math.round(
                  tentativas.reduce((sum, t) => {
                    const total = t.respostas.length;
                    const acertos = t.respostas.filter((r) => r.acertou).length;
                    return sum + calcularPercentualAcertos(total, acertos);
                  }, 0) / tentativas.length
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
              tentativa: {
                include: {
                  usuario: {
                    select: {
                      id: true,
                      nome: true,
                    },
                  },
                },
              },
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
      const tentativas = await prisma.tentativaQuiz.findMany({
        where: {
          quizId,
          status: 'FINALIZADA',
        },
        include: {
          usuario: {
            select: {
              nome: true,
              matricula: true,
            },
          },
          respostas: true,
        },
        orderBy: [
          { pontuacaoTotal: 'desc' },
          { tempoTotal: 'asc' },
        ],
      });

      const dados = tentativas.map((tentativa) => ({
        nome: tentativa.usuario.nome,
        matricula: tentativa.usuario.matricula || '',
        pontuacao: tentativa.pontuacaoTotal,
        tempoTotal: tentativa.tempoTotal,
        acertos: tentativa.respostas.filter((r) => r.acertou).length,
        totalPerguntas: tentativa.respostas.length,
        percentualAcertos: calcularPercentualAcertos(
          tentativa.respostas.length,
          tentativa.respostas.filter((r) => r.acertou).length
        ),
        posicaoRanking: tentativa.posicaoRanking || 0,
        dataFinalizacao: tentativa.finalizadaEm || tentativa.iniciadaEm,
      }));

      return dados;
    } catch (error) {
      logger.error('Error preparing CSV export data', { error, quizId });
      throw error;
    }
  }
}

export default new RelatorioService();

