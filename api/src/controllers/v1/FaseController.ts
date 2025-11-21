import { Request, Response } from 'express';
import { BaseController } from '../../base/BaseController';
import { FaseService } from '../../services/v1/FaseService';
import { CreateFaseDTO, UpdateFaseDTO } from '../../dto/fase.dto';

/**
 * Controller refatorado para Fase usando Design Patterns
 */
export class FaseController extends BaseController {
  private faseService: FaseService;

  constructor(faseService?: FaseService) {
    super();
    this.faseService = faseService || new FaseService();
  }

  listarFases = this.asyncHandler(async (req: Request, res: Response) => {
    const usuarioId = req.userId;
    const apenasFaseAtual = req.query.apenasFaseAtual === 'true';
    const fases = await this.faseService.listarFases(usuarioId, apenasFaseAtual);
    return this.success(res, fases);
  });

  obterFaseAtual = this.asyncHandler(async (req: Request, res: Response) => {
    const usuarioId = this.getUserId(req);
    const fase = await this.faseService.obterFaseAtualDoUsuario(usuarioId);
    return this.success(res, fase);
  });

  buscarPorId = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const usuarioId = req.userId;
    const fase = await this.faseService.buscarPorId(Number(id), usuarioId);
    return this.success(res, fase);
  });

  criarFase = this.asyncHandler(async (req: Request, res: Response) => {
    const usuarioId = this.getUserId(req);
    const dados: CreateFaseDTO = {
      ...req.body,
      criadoPor: usuarioId,
    };
    const fase = await this.faseService.criarFase(dados);
    return this.created(res, fase);
  });

  atualizarFase = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const dados: UpdateFaseDTO = req.body;
    const fase = await this.faseService.atualizarFase(Number(id), dados);
    return this.success(res, fase);
  });

  deletarFase = this.asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await this.faseService.deletarFase(Number(id));
    return this.noContent(res);
  });

  desbloquearFaseParaUsuario = this.asyncHandler(async (req: Request, res: Response) => {
    const { faseId, usuarioId } = req.params;
    const { definirComoAtual } = req.body;
    const desbloqueadoPor = this.getUserId(req);
    const desbloqueio = await this.faseService.desbloquearFaseParaUsuario(
      Number(faseId),
      Number(usuarioId),
      desbloqueadoPor,
      definirComoAtual === true
    );
    return this.created(res, desbloqueio);
  });

  desbloquearFaseParaTodos = this.asyncHandler(async (req: Request, res: Response) => {
    const { faseId } = req.params;
    const desbloqueadoPor = this.getUserId(req);
    const desbloqueios = await this.faseService.desbloquearFaseParaTodosUsuarios(
      Number(faseId),
      desbloqueadoPor
    );
    return this.created(res, desbloqueios);
  });

  bloquearFaseParaUsuario = this.asyncHandler(async (req: Request, res: Response) => {
    const { faseId, usuarioId } = req.params;
    await this.faseService.bloquearFaseParaUsuario(Number(faseId), Number(usuarioId));
    return this.noContent(res);
  });

  listarUsuariosComDesbloqueio = this.asyncHandler(async (req: Request, res: Response) => {
    const { faseId } = req.params;
    const desbloqueios = await this.faseService.listarUsuariosComDesbloqueio(Number(faseId));
    return this.success(res, desbloqueios);
  });
}

