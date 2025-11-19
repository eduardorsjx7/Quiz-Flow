import { Request, Response } from 'express';
import { FaseService } from '../services/fase.service';
import { asyncHandler } from '../middleware/errorHandler';

const faseService = new FaseService();

export class FaseController {
  listarFases = asyncHandler(async (req: Request, res: Response) => {
    const usuarioId = req.userId;
    const apenasFaseAtual = req.query.apenasFaseAtual === 'true';
    const fases = await faseService.listarFases(usuarioId, apenasFaseAtual);
    res.json({
      success: true,
      data: fases,
    });
  });

  obterFaseAtual = asyncHandler(async (req: Request, res: Response) => {
    const usuarioId = req.userId;
    if (!usuarioId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado',
      });
    }
    const fase = await faseService.obterFaseAtualDoUsuario(usuarioId);
    res.json({
      success: true,
      data: fase,
    });
  });

  buscarPorId = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioId = req.userId;
    const fase = await faseService.buscarPorId(Number(id), usuarioId);
    res.json(fase);
  });

  criarFase = asyncHandler(async (req: Request, res: Response) => {
    const usuarioId = req.userId;
    const fase = await faseService.criarFase({
      ...req.body,
      criadoPor: usuarioId,
    });
    res.status(201).json(fase);
  });

  atualizarFase = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const fase = await faseService.atualizarFase(Number(id), req.body);
    res.json(fase);
  });

  deletarFase = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await faseService.deletarFase(Number(id));
    res.status(204).send();
  });

  desbloquearFaseParaUsuario = asyncHandler(async (req: Request, res: Response) => {
    const { faseId, usuarioId } = req.params;
    const { definirComoAtual } = req.body;
    const desbloqueadoPor = req.userId;
    const desbloqueio = await faseService.desbloquearFaseParaUsuario(
      Number(faseId),
      Number(usuarioId),
      desbloqueadoPor,
      definirComoAtual === true
    );
    res.status(201).json({
      success: true,
      data: desbloqueio,
    });
  });

  desbloquearFaseParaTodos = asyncHandler(async (req: Request, res: Response) => {
    const { faseId } = req.params;
    const desbloqueadoPor = req.userId;
    const desbloqueios = await faseService.desbloquearFaseParaTodosUsuarios(
      Number(faseId),
      desbloqueadoPor
    );
    res.status(201).json(desbloqueios);
  });

  bloquearFaseParaUsuario = asyncHandler(async (req: Request, res: Response) => {
    const { faseId, usuarioId } = req.params;
    await faseService.bloquearFaseParaUsuario(Number(faseId), Number(usuarioId));
    res.status(204).send();
  });

  listarUsuariosComDesbloqueio = asyncHandler(async (req: Request, res: Response) => {
    const { faseId } = req.params;
    const desbloqueios = await faseService.listarUsuariosComDesbloqueio(Number(faseId));
    res.json(desbloqueios);
  });
}

