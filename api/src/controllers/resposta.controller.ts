import { Request, Response } from 'express';
import respostaService from '../services/resposta.service';
import { asyncHandler } from '../middleware/errorHandler';

export const processarResposta = asyncHandler(async (req: Request, res: Response) => {
  const { tentativaId, perguntaId, alternativaId, tempoResposta, tempoEsgotado } = req.body;

  const resultado = await respostaService.processarResposta({
    tentativaId,
    perguntaId,
    alternativaId,
    tempoResposta,
    tempoEsgotado,
  });

  res.status(201).json({
    success: true,
    data: resultado,
  });
});

export const buscarRespostasTentativa = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const respostas = await respostaService.buscarRespostasTentativa(parseInt(id));
  res.json({
    success: true,
    data: respostas,
  });
});

