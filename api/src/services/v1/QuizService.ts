import { BaseService } from '../../base/BaseService';
import { QuizRepository } from '../../repositories/QuizRepository';
import { CustomError } from '../../middleware/errorHandler';
import { CreateQuizDTO, UpdateQuizDTO } from '../../dto/quiz.dto';
import { ValidatorFactory } from '../../factories/ValidatorFactory';
import logger from '../../config/logger';
import prisma from '../../config/database';

/**
 * Serviço refatorado para Quiz usando Design Patterns
 * Implementa Repository Pattern, DTO Pattern e Strategy Pattern
 */
export class QuizService extends BaseService {
  private quizRepository: QuizRepository;

  constructor(quizRepository?: QuizRepository) {
    super();
    this.quizRepository = quizRepository || new QuizRepository();
  }

  async listarQuizzes(faseId?: number) {
    try {
      if (faseId) {
        return await this.quizRepository.findByFaseId(faseId);
      }
      return await this.quizRepository.findAll({ ativo: true });
    } catch (error) {
      this.handleError(error, 'listarQuizzes');
    }
  }

  async listarQuizzesDisponiveisParaUsuario(usuarioId: number) {
    try {
      const quizzes = await this.quizRepository.findAvailableForUser(usuarioId);
      
      // Formatar resposta com status de cada quiz
      return quizzes.map((quiz: any) => {
        const tentativa = quiz.tentativas[0];
        let status: 'pendente' | 'em_andamento' | 'concluido' = 'pendente';

        if (tentativa) {
          if (tentativa.status === 'FINALIZADA') {
            status = 'concluido';
          } else if (tentativa.status === 'EM_ANDAMENTO') {
            status = 'em_andamento';
          }
        }

        return {
          ...quiz,
          status,
          tentativa: tentativa || null,
        };
      });
    } catch (error) {
      this.handleError(error, 'listarQuizzesDisponiveisParaUsuario');
    }
  }

  async buscarPorId(id: number) {
    try {
      const quiz = await this.quizRepository.findByIdWithQuestions(id);
      if (!quiz) {
        throw new CustomError('Quiz não encontrado', 404);
      }
      return quiz;
    } catch (error) {
      this.handleError(error, 'buscarPorId');
    }
  }

  async buscarQuizPorFase(faseId: number) {
    try {
      const quizzes = await this.quizRepository.findByFaseId(faseId);
      return quizzes[0] || null;
    } catch (error) {
      this.handleError(error, 'buscarQuizPorFase');
    }
  }

  async criarQuiz(dados: CreateQuizDTO & { criadoPor?: number }) {
    try {
      // Validar dados usando Strategy Pattern
      const validator = ValidatorFactory.create('quiz');
      const validation = await validator.validate(dados);
      
      if (!validation.isValid) {
        throw new CustomError(
          `Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`,
          400
        );
      }

      // Verificar se a fase existe
      const fase = await prisma.fase.findUnique({
        where: { id: dados.faseId },
        include: {
          quizzes: {
            where: { ativo: true },
          },
        },
      });

      if (!fase) {
        throw new CustomError('Fase não encontrada', 404);
      }

      // Verificar se já existe um quiz ativo nesta fase
      if (fase.quizzes.length > 0) {
        throw new CustomError(
          'Esta fase já possui um quiz. Cada fase pode ter apenas um quiz.',
          400
        );
      }

      // Criar quiz com perguntas e alternativas
      const quiz = await prisma.quiz.create({
        data: {
          titulo: dados.titulo,
          descricao: dados.descricao,
          faseId: dados.faseId,
          ordem: dados.ordem || 0,
          pontosBase: dados.pontosBase || 100,
          tags: dados.tags,
          dataInicio: dados.dataInicio,
          dataFim: dados.dataFim,
          criadoPor: dados.criadoPor,
          perguntas: {
            create: dados.perguntas.map((pergunta, index) => ({
              texto: pergunta.texto,
              tempoSegundos: pergunta.tempoSegundos || 30,
              ordem: index + 1,
              alternativas: {
                create: pergunta.alternativas.map((alt, altIndex) => ({
                  texto: alt.texto,
                  correta: alt.correta || false,
                  ordem: altIndex + 1,
                })),
              },
            })),
          },
        },
        include: {
          fase: {
            select: {
              id: true,
              titulo: true,
            },
          },
          perguntas: {
            include: {
              alternativas: true,
            },
          },
        },
      });

      logger.info('Quiz created', { quizId: quiz.id, faseId: dados.faseId });
      return quiz;
    } catch (error) {
      this.handleError(error, 'criarQuiz');
    }
  }

  async atualizarQuiz(id: number, dados: UpdateQuizDTO) {
    try {
      // Validar se o quiz existe
      await this.validateResourceExists(this.quizRepository, id, 'Quiz');

      // Validar dados
      const validator = ValidatorFactory.create('quiz');
      const validation = await validator.validate(dados);
      
      if (!validation.isValid) {
        throw new CustomError(
          `Dados inválidos: ${validation.errors.map(e => e.message).join(', ')}`,
          400
        );
      }

      const quiz = await this.quizRepository.update(id, dados);
      logger.info('Quiz updated', { quizId: id });
      return quiz;
    } catch (error) {
      this.handleError(error, 'atualizarQuiz');
    }
  }

  async deletarQuiz(id: number) {
    try {
      await this.validateResourceExists(this.quizRepository, id, 'Quiz');
      await this.quizRepository.delete(id);
      logger.info('Quiz deleted', { quizId: id });
    } catch (error) {
      this.handleError(error, 'deletarQuiz');
    }
  }

  async adicionarPergunta(quizId: number, dados: {
    texto: string;
    tempoSegundos?: number;
    alternativas: Array<{
      texto: string;
      correta: boolean;
    }>;
  }) {
    try {
      const quiz = await this.quizRepository.findByIdWithQuestions(quizId);
      if (!quiz) {
        throw new CustomError('Quiz não encontrado', 404);
      }

      const ordem = quiz.perguntas.length + 1;

      const pergunta = await prisma.pergunta.create({
        data: {
          quizId,
          texto: dados.texto,
          tempoSegundos: dados.tempoSegundos || 30,
          ordem,
          alternativas: {
            create: dados.alternativas.map((alt, index) => ({
              texto: alt.texto,
              correta: alt.correta || false,
              ordem: index + 1,
            })),
          },
        },
        include: {
          alternativas: true,
        },
      });

      logger.info('Question added to quiz', { quizId, perguntaId: pergunta.id });
      return pergunta;
    } catch (error) {
      this.handleError(error, 'adicionarPergunta');
    }
  }
}

