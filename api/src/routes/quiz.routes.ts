import express from 'express';
import {
  listarQuizzes,
  buscarQuiz,
  buscarQuizPorCodigo,
  criarQuiz,
  atualizarQuiz,
  deletarQuiz,
  adicionarPergunta,
} from '../controllers/quiz.controller';
import { authenticate, requireAdmin } from '../middleware/auth';

const router = express.Router();

router.get('/', authenticate, listarQuizzes);
router.get('/:id', buscarQuiz);
router.get('/codigo/:codigo', buscarQuizPorCodigo);
router.post('/', authenticate, requireAdmin, criarQuiz);
router.put('/:id', authenticate, requireAdmin, atualizarQuiz);
router.delete('/:id', authenticate, requireAdmin, deletarQuiz);
router.post('/:id/perguntas', authenticate, requireAdmin, adicionarPergunta);

export default router;

