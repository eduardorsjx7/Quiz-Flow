import express from 'express';
import {
  criarSessao,
  buscarSessaoPorCodigo,
  entrarNaSessao,
  iniciarSessao,
  finalizarSessao,
  obterRanking,
  buscarParticipante,
} from '../controllers/sessao.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, requireAdmin, criarSessao);
router.get('/codigo/:codigo', buscarSessaoPorCodigo);
router.post('/:codigo/entrar', entrarNaSessao);
router.post('/:id/iniciar', authenticate, requireAdmin, iniciarSessao);
router.post('/:id/finalizar', authenticate, requireAdmin, finalizarSessao);
router.get('/:codigo/ranking', obterRanking);
router.get('/participante/:id', buscarParticipante);

export default router;

