import express from 'express';
import {
  processarResposta,
  buscarRespostasParticipante,
} from '../controllers/resposta.controller';

const router = express.Router();

router.post('/', processarResposta);
router.get('/participante/:id', buscarRespostasParticipante);

export default router;

