import { Request, Response } from 'express';
import sessaoService from '../services/sessao.service';
import { asyncHandler } from '../middleware/errorHandler';

export const criarSessao = asyncHandler(async (req: Request, res: Response) => {
  const { quizId } = req.body;
  const sessao = await sessaoService.criarSessao(quizId);
  res.status(201).json({
    success: true,
    data: sessao,
  });
});

export const buscarSessaoPorCodigo = asyncHandler(async (req: Request, res: Response) => {
  const { codigo } = req.params;
  const sessao = await sessaoService.buscarPorCodigo(codigo);
  res.json({
    success: true,
    data: sessao,
  });
});

export const entrarNaSessao = asyncHandler(async (req: Request, res: Response) => {
  const { codigo } = req.params;
  const { nomeParticipante, matricula, usuarioId } = req.body;

  const participante = await sessaoService.entrarNaSessao(codigo, {
    nomeParticipante,
    matricula,
    usuarioId,
  });

  res.status(201).json({
    success: true,
    data: participante,
  });
});

export const iniciarSessao = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sessao = await sessaoService.iniciarSessao(parseInt(id));
  res.json({
    success: true,
    data: sessao,
  });
});

export const finalizarSessao = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const sessao = await sessaoService.finalizarSessao(parseInt(id));
  res.json({
    success: true,
    data: sessao,
  });
});

export const obterRanking = asyncHandler(async (req: Request, res: Response) => {
  const { codigo } = req.params;
  const ranking = await sessaoService.obterRanking(codigo);
  res.json({
    success: true,
    data: ranking,
  });
});

export const buscarParticipante = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const participante = await sessaoService.buscarParticipante(parseInt(id));
  res.json({
    success: true,
    data: participante,
  });
});

