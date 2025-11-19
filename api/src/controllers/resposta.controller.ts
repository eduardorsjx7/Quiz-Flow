import { Request, Response } from 'express';
import respostaService from '../services/resposta.service';
import { asyncHandler } from '../middleware/errorHandler';

export const processarResposta = asyncHandler(async (req: Request, res: Response) => {
  const { sessaoParticipanteId, perguntaId, alternativaId, tempoResposta } = req.body;

  const resultado = await respostaService.processarResposta({
    sessaoParticipanteId,
    perguntaId,
    alternativaId,
    tempoResposta,
  });

  res.status(201).json({
    success: true,
    data: resultado,
  });
});

export const buscarRespostasParticipante = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const respostas = await respostaService.buscarRespostasParticipante(parseInt(id));
  res.json({
    success: true,
    data: respostas,
  });
});

