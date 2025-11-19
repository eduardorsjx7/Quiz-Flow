import { Request, Response } from 'express';
import jornadaService from '../services/jornada.service';
import { asyncHandler } from '../middleware/errorHandler';

export const listarJornadas = asyncHandler(async (req: Request, res: Response) => {
  const jornadas = await jornadaService.listarJornadas();
  res.json({
    success: true,
    data: jornadas,
  });
});

export const buscarJornadaPorId = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const jornada = await jornadaService.buscarPorId(Number(id));
  res.json({
    success: true,
    data: jornada,
  });
});

export const criarJornada = asyncHandler(async (req: Request, res: Response) => {
  const { titulo, descricao, ordem, fases } = req.body;
  const criadoPor = req.userId;

  const jornada = await jornadaService.criarJornada({
    titulo,
    descricao,
    ordem,
    criadoPor,
    fases,
  });

  res.status(201).json({
    success: true,
    data: jornada,
  });
});

export const atualizarJornada = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { titulo, descricao, ordem, ativo } = req.body;

  const jornada = await jornadaService.atualizarJornada(Number(id), {
    titulo,
    descricao,
    ordem,
    ativo,
  });

  res.json({
    success: true,
    data: jornada,
  });
});

export const deletarJornada = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await jornadaService.deletarJornada(Number(id));
  res.json({
    success: true,
    message: 'Jornada deletada com sucesso',
  });
});

