import { Request, Response } from 'express';
import tentativaService from '../services/tentativa.service';
import { asyncHandler } from '../middleware/errorHandler';

export const iniciarTentativa = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
    });
  }

  const tentativa = await tentativaService.iniciarTentativa(Number(quizId), usuarioId);
  res.status(201).json({
    success: true,
    data: tentativa,
  });
});

export const buscarTentativaPorId = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tentativa = await tentativaService.buscarTentativaPorId(Number(id));
  res.json(tentativa);
});

export const finalizarTentativa = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const tentativa = await tentativaService.finalizarTentativa(Number(id));
  res.json({
    success: true,
    data: tentativa,
  });
});

export const obterRankingQuiz = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.params;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const ranking = await tentativaService.obterRankingQuiz(Number(quizId), limit);
  res.json(ranking);
});

export const listarTentativasDoUsuario = asyncHandler(async (req: Request, res: Response) => {
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({
      success: false,
      error: 'Usuário não autenticado',
    });
  }

  const tentativas = await tentativaService.listarTentativasDoUsuario(usuarioId);
  res.json(tentativas);
});

