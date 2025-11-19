import { Request, Response } from 'express';
import grupoService from '../services/grupo.service';
import { asyncHandler } from '../middleware/errorHandler';

export const listarGrupos = asyncHandler(async (req: Request, res: Response) => {
  const grupos = await grupoService.listarGrupos();
  res.json(grupos);
});

export const buscarGrupoPorId = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const grupo = await grupoService.buscarPorId(Number(id));
  res.json(grupo);
});

export const criarGrupo = asyncHandler(async (req: Request, res: Response) => {
  const grupo = await grupoService.criarGrupo(req.body);
  res.status(201).json({
    success: true,
    data: grupo,
  });
});

export const atualizarGrupo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const grupo = await grupoService.atualizarGrupo(Number(id), req.body);
  res.json({
    success: true,
    data: grupo,
  });
});

export const deletarGrupo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await grupoService.deletarGrupo(Number(id));
  res.json({
    success: true,
    message: 'Grupo deletado com sucesso',
  });
});

