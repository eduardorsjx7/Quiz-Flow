import prisma from '../config/database';
import logger from '../config/logger';
import { CustomError } from '../middleware/errorHandler';
import { calcularPontuacao } from '../utils/pontuacao';
import tentativaService from './tentativa.service';

export class RespostaService {
  async processarResposta(dados: {
    tentativaId: number;
    perguntaId: number;
    alternativaId?: number;
    tempoResposta: number;
    tempoEsgotado?: boolean;
  }) {
    try {
      // Buscar dados necessários
      const tentativa = await prisma.tentativaQuiz.findUnique({
        where: { id: dados.tentativaId },
        include: {
          quiz: true,
        },
      });

      if (!tentativa) {
        throw new CustomError('Tentativa não encontrada', 404);
      }

      if (tentativa.status !== 'EM_ANDAMENTO') {
        throw new CustomError('Tentativa não está em andamento', 400);
      }

      const pergunta = await prisma.pergunta.findUnique({
        where: { id: dados.perguntaId },
        include: {
          alternativas: true,
        },
      });

      if (!pergunta) {
        throw new CustomError('Pergunta não encontrada', 404);
      }

      // Verificar se já respondeu esta pergunta
      const respostaExistente = await prisma.resposta.findFirst({
        where: {
          tentativaId: dados.tentativaId,
          perguntaId: dados.perguntaId,
        },
      });

      if (respostaExistente) {
        throw new CustomError('Pergunta já respondida', 400);
      }

      // Verificar se o tempo esgotou
      const tempoEsgotado = dados.tempoEsgotado || dados.tempoResposta >= pergunta.tempoSegundos;

      let acertou = false;
      let pontuacao = 0;

      if (tempoEsgotado || !dados.alternativaId) {
        // Se o tempo esgotou ou não foi selecionada alternativa, considera errado
        acertou = false;
        pontuacao = 0;
      } else {
        const alternativaEscolhida = pergunta.alternativas.find(
          (a) => a.id === dados.alternativaId
        );

        if (!alternativaEscolhida) {
          throw new CustomError('Alternativa não encontrada', 404);
        }

        acertou = alternativaEscolhida.correta;

        // Calcular pontuação apenas se acertou
        if (acertou) {
          pontuacao = calcularPontuacao(
            tentativa.quiz.pontosBase,
            dados.tempoResposta,
            pergunta.tempoSegundos,
            acertou
          );
        }
      }

      // Criar resposta
      const resposta = await prisma.resposta.create({
        data: {
          tentativaId: dados.tentativaId,
          perguntaId: dados.perguntaId,
          alternativaId: dados.alternativaId || null,
          tempoResposta: dados.tempoResposta,
          pontuacao,
          acertou,
          tempoEsgotado,
        },
      });

      // Atualizar pontuação total e tempo total da tentativa
      const todasRespostas = await prisma.resposta.findMany({
        where: { tentativaId: dados.tentativaId },
      });

      const pontuacaoTotal = todasRespostas.reduce((sum, r) => sum + r.pontuacao, 0);
      const tempoTotal = todasRespostas.reduce((sum, r) => sum + r.tempoResposta, 0);

      await prisma.tentativaQuiz.update({
        where: { id: dados.tentativaId },
        data: {
          pontuacaoTotal,
          tempoTotal,
        },
      });

      logger.info('Answer processed', {
        respostaId: resposta.id,
        tentativaId: dados.tentativaId,
        acertou,
        pontuacao,
        tempoEsgotado,
      });

      return {
        resposta,
        pontuacao,
        acertou,
        tempoEsgotado,
        pontuacaoTotal,
        tempoTotal,
      };
    } catch (error) {
      logger.error('Error processing answer', { error, dados });
      throw error;
    }
  }

  async buscarRespostasTentativa(tentativaId: number) {
    try {
      const respostas = await prisma.resposta.findMany({
        where: { tentativaId },
        include: {
          pergunta: {
            include: {
              alternativas: true,
            },
          },
        },
        orderBy: {
          respondidaEm: 'asc',
        },
      });

      return respostas;
    } catch (error) {
      logger.error('Error finding attempt answers', { error, tentativaId });
      throw error;
    }
  }
}

export default new RespostaService();

