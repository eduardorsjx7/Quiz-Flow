import { Request, Response } from 'express';
import quizService from '../services/quiz.service';
import { asyncHandler } from '../middleware/errorHandler';

export const listarQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const quizzes = await quizService.listarQuizzes();
  res.json({
    success: true,
    data: quizzes,
  });
});

export const buscarQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const quiz = await quizService.buscarPorId(parseInt(id));
  res.json({
    success: true,
    data: quiz,
  });
});

export const buscarQuizPorCodigo = asyncHandler(async (req: Request, res: Response) => {
  const { codigo } = req.params;
  const quiz = await quizService.buscarPorCodigo(codigo);
  res.json({
    success: true,
    data: quiz,
  });
});

export const criarQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { titulo, descricao, pontosBase, perguntas } = req.body;
  const userId = (req as any).userId;

  const quiz = await quizService.criarQuiz({
    titulo,
    descricao,
    pontosBase,
    criadoPor: userId,
    perguntas,
  });

  res.status(201).json({
    success: true,
    data: quiz,
  });
});

export const atualizarQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, descricao, pontosBase, ativo } = req.body;

  const quiz = await quizService.atualizarQuiz(parseInt(id), {
    titulo,
    descricao,
    pontosBase,
    ativo,
  });

  res.json({
    success: true,
    data: quiz,
  });
});

export const deletarQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await quizService.deletarQuiz(parseInt(id));
  res.json({
    success: true,
    message: 'Quiz deletado com sucesso',
  });
});

export const adicionarPergunta = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { texto, tempoSegundos, alternativas } = req.body;

  const pergunta = await quizService.adicionarPergunta(parseInt(id), {
    texto,
    tempoSegundos,
    alternativas,
  });

  res.status(201).json({
    success: true,
    data: pergunta,
  });
});

