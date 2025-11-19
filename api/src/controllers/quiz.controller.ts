import { Request, Response } from 'express';
import quizService from '../services/quiz.service';
import { asyncHandler } from '../middleware/errorHandler';

export const listarQuizzes = asyncHandler(async (req: Request, res: Response) => {
  const faseId = req.query.faseId ? Number(req.query.faseId) : undefined;
  const quizzes = await quizService.listarQuizzes(faseId);
  res.json({
    success: true,
    data: quizzes,
  });
});

export const listarQuizzesDisponiveis = asyncHandler(async (req: Request, res: Response) => {
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
    });
  }

  const quizzes = await quizService.listarQuizzesDisponiveisParaUsuario(usuarioId);
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

export const buscarQuizPorFase = asyncHandler(async (req: Request, res: Response) => {
  const { faseId } = req.params;
  const quiz = await quizService.buscarQuizPorFase(parseInt(faseId));
  
  if (!quiz) {
    return res.status(404).json({
      success: false,
      error: 'Quiz não encontrado para esta fase',
    });
  }
  
  res.json({
    success: true,
    data: quiz,
  });
});

export const criarQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { titulo, descricao, faseId, ordem, pontosBase, tags, dataInicio, dataFim, perguntas } = req.body;
  const userId = req.userId;

  if (!faseId) {
    return res.status(400).json({
      success: false,
      error: 'faseId é obrigatório',
    });
  }

  const quiz = await quizService.criarQuiz({
    titulo,
    descricao,
    faseId,
    ordem,
    pontosBase,
    tags,
    dataInicio: dataInicio ? new Date(dataInicio) : undefined,
    dataFim: dataFim ? new Date(dataFim) : undefined,
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
  const { titulo, descricao, faseId, ordem, pontosBase, tags, dataInicio, dataFim, ativo } = req.body;

  const quiz = await quizService.atualizarQuiz(parseInt(id), {
    titulo,
    descricao,
    faseId,
    ordem,
    pontosBase,
    tags,
    dataInicio: dataInicio ? new Date(dataInicio) : undefined,
    dataFim: dataFim ? new Date(dataFim) : undefined,
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

