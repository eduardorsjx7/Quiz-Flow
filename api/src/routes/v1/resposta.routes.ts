import express from 'express';
import {
  processarResposta,
  buscarRespostasTentativa,
} from '../../controllers/resposta.controller';
import { authenticate } from '../../middleware/auth';

const router = express.Router();

router.post('/', authenticate, processarResposta);
router.get('/tentativa/:id', authenticate, buscarRespostasTentativa);

export default router;

