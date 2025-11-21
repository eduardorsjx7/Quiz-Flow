import { Request, Response } from 'express';
import { BaseController } from '../../base/BaseController';
import { QuizService } from '../../services/v1/QuizService';
import { CreateQuizDTO, UpdateQuizDTO } from '../../dto/quiz.dto';

/**
 * Controller refatorado para Quiz usando Design Patterns
 * Implementa Base Controller Pattern e Dependency Injection
 */
export class QuizController extends BaseController {
  private quizService: QuizService;

  constructor(quizService?: QuizService) {
    super();
    this.quizService = quizService || new QuizService();
  }

  listarQuizzes = this.asyncHandler(async (req: Request, res: Response) => {
    const faseId = req.query.faseId ? Number(req.query.faseId) : undefined;
    const quizzes = await this.quizService.listarQuizzes(faseId);
    return this.success(res, quizzes);
  });

  listarQuizzesDisponiveis = this.asyncHandler(async (req: Request, res: Response) => {
    const usuarioId = this.getUserId(req);
    const quizzes = await this.quizService.listarQuizzesDisponiveisParaUsuario(usuarioId);
    return this.success(res, quizzes);
  });

  buscarQuiz = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const quiz = await this.quizService.buscarPorId(parseInt(id));
    return this.success(res, quiz);
  });

  buscarQuizPorFase = this.asyncHandler(async (req: Request, res: Response) => {
    const { faseId } = req.params;
    const quiz = await this.quizService.buscarQuizPorFase(parseInt(faseId));
    
    if (!quiz) {
      return this.error(res, 'Quiz não encontrado para esta fase', 404);
    }
    
    return this.success(res, quiz);
  });

  criarQuiz = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const dados: CreateQuizDTO = {
      ...req.body,
      criadoPor: userId,
    };

    const quiz = await this.quizService.criarQuiz(dados);
    return this.created(res, quiz);
  });

  atualizarQuiz = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dados: UpdateQuizDTO = req.body;

    const quiz = await this.quizService.atualizarQuiz(parseInt(id), dados);
    return this.success(res, quiz);
  });

  deletarQuiz = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.quizService.deletarQuiz(parseInt(id));
    return this.noContent(res);
  });

  adicionarPergunta = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { texto, tempoSegundos, alternativas } = req.body;

    const pergunta = await this.quizService.adicionarPergunta(parseInt(id), {
      texto,
      tempoSegundos,
      alternativas,
    });

    return this.created(res, pergunta);
  });
}

