import { Request, Response } from 'express';
import atribuicaoService from '../services/atribuicao.service';
import { asyncHandler } from '../middleware/errorHandler';

export const atribuirQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const { usuarioIds, grupoIds } = req.body;
  const atribuidoPor = req.userId;

  const atribuicoes = await atribuicaoService.atribuirQuiz({
    quizId: Number(quizId),
    usuarioIds,
    grupoIds,
    atribuidoPor,
  });

  res.status(201).json({
    success: true,
    data: atribuicoes,
  });
});

export const removerAtribuicao = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await atribuicaoService.removerAtribuicao(Number(id));
  res.json({
    success: true,
    message: 'Atribuição removida com sucesso',
  });
});

export const listarAtribuicoesPorQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const atribuicoes = await atribuicaoService.listarAtribuicoesPorQuiz(Number(quizId));
  res.json(atribuicoes);
});

